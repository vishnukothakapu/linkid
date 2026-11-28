import crypto from "crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import prismaClient from "./prisma";

export const CONFIRMATION_TOKEN_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
export const UNSUBSCRIBE_TOKEN_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
export const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
export const MAX_RESENDS_PER_WINDOW = 5;
export const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

export type SubscriptionResult =
  | { status: "PENDING"; subscriberId: string }
  | { status: "PENDING_RESENT"; subscriberId: string }
  | { status: "ALREADY_CONFIRMED"; subscriberId: string }
  | { status: "RESEND_COOLDOWN"; retryAfterSeconds: number }
  | { status: "RATE_LIMITED"; error: string };

export async function createPendingSubscription(
  client: PrismaClient | Prisma.TransactionClient = prismaClient,
  params: {
    email: string;
    workspaceId: string;
    workspaceUsername: string;
    baseUrl?: string;
  }
): Promise<SubscriptionResult> {
  const { email, workspaceId, workspaceUsername } = params;
  const baseUrl = params.baseUrl || process.env.NEXTAUTH_URL || "https://linkid.app";
  const normalizedEmail = email.toLowerCase().trim();

  // Inspect existing subscriber record
  const existing = await client.subscriber.findUnique({
    where: {
      email_workspaceId: {
        email: normalizedEmail,
        workspaceId,
      },
    },
    include: {
      tokens: {
        where: { type: "CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const now = new Date();

  if (existing) {
    if (existing.status === "CONFIRMED") {
      // Idempotent: already confirmed, do not resend confirmation or alter state
      return { status: "ALREADY_CONFIRMED", subscriberId: existing.id };
    }

    if (existing.status === "PENDING") {
      // Enforce bounded resend cooldown and limits
      const recentTokens = existing.tokens;
      const latestToken = recentTokens[0];

      if (latestToken) {
        const timeSinceLatest = now.getTime() - new Date(latestToken.createdAt).getTime();
        if (timeSinceLatest < RESEND_COOLDOWN_MS) {
          const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLatest) / 1000);
          return { status: "RESEND_COOLDOWN", retryAfterSeconds };
        }

        const oneHourAgo = new Date(now.getTime() - RESEND_WINDOW_MS);
        const tokensInWindow = recentTokens.filter((t) => new Date(t.createdAt) > oneHourAgo);
        if (tokensInWindow.length >= MAX_RESENDS_PER_WINDOW) {
          return { status: "RATE_LIMITED", error: "Too many confirmation requests. Please try again later." };
        }
      }

      // Issue new confirmation token and enqueue bounded email job
      const confirmToken = generateToken();
      const expiresAt = new Date(now.getTime() + CONFIRMATION_TOKEN_EXPIRY_MS);

      await client.subscriberToken.create({
        data: {
          subscriberId: existing.id,
          tokenHash: confirmToken.tokenHash,
          type: "CONFIRMATION",
          expiresAt,
        },
      });

      const confirmationUrl = `${baseUrl}/api/subscribe/confirm?token=${confirmToken.rawToken}`;

      await client.job.create({
        data: {
          type: "subscriber-confirmation",
          userId: workspaceId,
          payload: {
            to: normalizedEmail,
            confirmationUrl,
            workspaceUsername,
            subscriberId: existing.id,
          },
        },
      });

      return { status: "PENDING_RESENT", subscriberId: existing.id };
    }

    // UNSUBSCRIBED: User wants to resubscribe -> transition to PENDING and require confirmation
    if (existing.status === "UNSUBSCRIBED") {
      const confirmToken = generateToken();
      const unsubToken = generateToken();
      const expiresAt = new Date(now.getTime() + CONFIRMATION_TOKEN_EXPIRY_MS);
      const unsubExpiresAt = new Date(now.getTime() + UNSUBSCRIBE_TOKEN_EXPIRY_MS);

      await client.subscriber.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          unsubscribedAt: null,
          confirmedAt: null,
        },
      });

      await client.subscriberToken.createMany({
        data: [
          {
            subscriberId: existing.id,
            tokenHash: confirmToken.tokenHash,
            type: "CONFIRMATION",
            expiresAt,
          },
          {
            subscriberId: existing.id,
            tokenHash: unsubToken.tokenHash,
            type: "UNSUBSCRIBE",
            expiresAt: unsubExpiresAt,
          },
        ],
      });

      const confirmationUrl = `${baseUrl}/api/subscribe/confirm?token=${confirmToken.rawToken}`;
      const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${unsubToken.rawToken}`;

      await client.job.create({
        data: {
          type: "subscriber-confirmation",
          userId: workspaceId,
          payload: {
            to: normalizedEmail,
            confirmationUrl,
            unsubscribeUrl,
            workspaceUsername,
            subscriberId: existing.id,
          },
        },
      });

      return { status: "PENDING", subscriberId: existing.id };
    }
  }

  // Create brand new subscriber in PENDING state
  const confirmToken = generateToken();
  const unsubToken = generateToken();
  const expiresAt = new Date(now.getTime() + CONFIRMATION_TOKEN_EXPIRY_MS);
  const unsubExpiresAt = new Date(now.getTime() + UNSUBSCRIBE_TOKEN_EXPIRY_MS);

  const subscriber = await client.subscriber.create({
    data: {
      email: normalizedEmail,
      workspaceId,
      status: "PENDING",
      tokens: {
        create: [
          {
            tokenHash: confirmToken.tokenHash,
            type: "CONFIRMATION",
            expiresAt,
          },
          {
            tokenHash: unsubToken.tokenHash,
            type: "UNSUBSCRIBE",
            expiresAt: unsubExpiresAt,
          },
        ],
      },
    },
  });

  const confirmationUrl = `${baseUrl}/api/subscribe/confirm?token=${confirmToken.rawToken}`;
  const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${unsubToken.rawToken}`;

  // Persist confirmation email work through bounded retryable outbox
  await client.job.create({
    data: {
      type: "subscriber-confirmation",
      userId: workspaceId,
      payload: {
        to: normalizedEmail,
        confirmationUrl,
        unsubscribeUrl,
        workspaceUsername,
        subscriberId: subscriber.id,
      },
    },
  });

  return { status: "PENDING", subscriberId: subscriber.id };
}

export type ConfirmResult =
  | { success: true; subscriberId: string; alreadyConfirmed?: boolean }
  | { success: false; error: "EXPIRED_OR_INVALID" | "TOKEN_ALREADY_USED" };

export async function confirmSubscription(
  client: PrismaClient | Prisma.TransactionClient = prismaClient,
  rawToken: string
): Promise<ConfirmResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 16) {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const tokenRecord = await client.subscriberToken.findUnique({
    where: { tokenHash },
    include: { subscriber: true },
  });

  if (!tokenRecord || tokenRecord.type !== "CONFIRMATION") {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  if (new Date(tokenRecord.expiresAt) < now) {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  // Token already used
  if (tokenRecord.usedAt !== null) {
    // If the subscriber is already confirmed, confirmation is idempotent
    if (tokenRecord.subscriber.status === "CONFIRMED") {
      return { success: true, subscriberId: tokenRecord.subscriberId, alreadyConfirmed: true };
    }
    // If subscriber was subsequently unsubscribed, replayed token CANNOT reactivate consent
    return { success: false, error: "TOKEN_ALREADY_USED" };
  }

  // Mark token used and subscriber confirmed atomically
  await client.subscriberToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: now },
  });

  await client.subscriber.update({
    where: { id: tokenRecord.subscriberId },
    data: {
      status: "CONFIRMED",
      confirmedAt: now,
      unsubscribedAt: null,
    },
  });

  return { success: true, subscriberId: tokenRecord.subscriberId };
}

export type UnsubscribeResult =
  | { success: true }
  | { success: false; error: "EXPIRED_OR_INVALID" };

export async function unsubscribeSubscription(
  client: PrismaClient | Prisma.TransactionClient = prismaClient,
  rawToken: string
): Promise<UnsubscribeResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 16) {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const tokenRecord = await client.subscriberToken.findUnique({
    where: { tokenHash },
    include: { subscriber: true },
  });

  if (!tokenRecord || tokenRecord.type !== "UNSUBSCRIBE") {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  if (new Date(tokenRecord.expiresAt) < now) {
    return { success: false, error: "EXPIRED_OR_INVALID" };
  }

  // Idempotent: record token used and update subscriber status to UNSUBSCRIBED
  await client.subscriberToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: now },
  });

  await client.subscriber.update({
    where: { id: tokenRecord.subscriberId },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: now,
    },
  });

  return { success: true };
}
