import { AsyncLocalStorage } from "node:async_hooks";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

export type AuditResource = "User" | "Link";
export type AuditOperation = "CREATE" | "UPDATE" | "DELETE";

export interface AuditContext {
  actorId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditEventPayload {
  eventId?: string;
  actorId: string;
  actionType: string;
  resource: AuditResource;
  resourceId: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

type AuditWriter = (
  event: Required<
    Omit<AuditEventPayload, "ipAddress" | "userAgent" | "oldState" | "newState">
  > & {
    oldState: Prisma.InputJsonValue | undefined;
    newState: Prisma.InputJsonValue | undefined;
    ipAddress: string | null;
    userAgent: string | null;
  }
) => Promise<void>;

const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "hashedPassword",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "secret",
  "otp",
  "otpHash",
]);

const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export function extractClientIp(req: NextRequest | Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return req.headers.get("x-real-ip") || null;
}

export function runWithAuditContext<T>(
  context: AuditContext,
  fn: () => Promise<T>
): Promise<T> {
  return auditContextStorage.run(context, fn);
}

export function getAuditContext(): AuditContext | undefined {
  return auditContextStorage.getStore();
}

export function sanitizeAuditState(
  raw: unknown
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      cleaned[key] = "[REDACTED]";
    } else if (value instanceof Date) {
      cleaned[key] = value.toISOString();
    } else if (typeof value === "bigint") {
      cleaned[key] = value.toString();
    } else if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function computeStateDelta(
  oldState: Record<string, unknown> | null,
  newState: Record<string, unknown> | null
): {
  oldDelta: Record<string, unknown> | null;
  newDelta: Record<string, unknown> | null;
} {
  if (!oldState || !newState) {
    return { oldDelta: oldState, newDelta: newState };
  }

  const oldDelta: Record<string, unknown> = {};
  const newDelta: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

  for (const key of keys) {
    if (key === "updatedAt") continue;
    const prevVal = oldState[key];
    const nextVal = newState[key];
    if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
      oldDelta[key] = prevVal ?? null;
      newDelta[key] = nextVal ?? null;
    }
  }

  return {
    oldDelta: Object.keys(oldDelta).length > 0 ? oldDelta : null,
    newDelta: Object.keys(newDelta).length > 0 ? newDelta : null,
  };
}

class AuditEventBus extends EventEmitter {
  private writer: AuditWriter | null = null;

  registerWriter(writer: AuditWriter) {
    this.writer = writer;
  }

  publish(payload: AuditEventPayload): void {
    const eventId = payload.eventId ?? randomUUID();

    setImmediate(() => {
      this.emit("audit:recorded", { ...payload, eventId });

      if (!this.writer) return;

      this.writer({
        eventId,
        actorId: payload.actorId,
        actionType: payload.actionType,
        resource: payload.resource,
        resourceId: payload.resourceId,
        oldState: (payload.oldState ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        newState: (payload.newState ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      }).catch((err) => {
        console.error("[AuditEventBus] Failed to persist audit log:", err);
      });
    });
  }
}

const globalForEventBus = globalThis as unknown as {
  auditEventBus?: AuditEventBus;
};

export const eventBus =
  globalForEventBus.auditEventBus ?? new AuditEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.auditEventBus = eventBus;
}