import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

/**
 * Type for Prisma transaction client
 */
type TransactionClient = Prisma.TransactionClient;

/**
 * Profile snapshot for versioning and comparison
 */
export interface ProfileSnapshot {
  name: string | null;
  username: string | null;
  bio: string | null;
  image: string | null;
}

/**
 * Upsert a profile draft for a user
 */
export async function upsertProfileDraft(
  userId: string,
  data: Partial<ProfileSnapshot>
): Promise<ProfileSnapshot> {
  // Validate username if it's being changed
  if (data.username) {
    const basicValidation = validateUsername(data.username);
    if (!basicValidation.valid) {
      throw new Error(basicValidation.error || "Invalid username");
    }

    // Check if username is available
    const isAvailable = await isProfileUsernameAvailable(data.username, userId);
    if (!isAvailable) {
      throw new Error("Username already taken");
    }
  }

  const draft = await prisma.profileDraft.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });

  return {
    name: draft.name,
    username: draft.username,
    bio: draft.bio,
    image: draft.image,
  };
}

/**
 * Get the current editable profile state (draft if exists, otherwise live profile)
 */
export async function getEditableProfileState(
  userId: string
): Promise<ProfileSnapshot> {
  const draft = await prisma.profileDraft.findUnique({
    where: { userId },
  });
  if (draft) {
    // Merge draft with live user values so missing draft fields fall back
    // to the current live profile (avoids returning nulls when only
    // a subset of fields are being edited in the draft).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, bio: true, image: true },
    });

    // If a draft exists but the live user record is missing, the system
    // is in an inconsistent state. Remove the stale draft and surface
    // a clear error so callers don't operate on orphaned drafts.
    if (!user) {
      await prisma.profileDraft.deleteMany({ where: { userId } });
      throw new Error("User not found");
    }

    return {
      name: draft.name ?? user.name ?? null,
      username: draft.username ?? user.username ?? null,
      bio: draft.bio ?? user.bio ?? null,
      image: draft.image ?? user.image ?? null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    username: user.username,
    bio: user.bio,
    image: user.image,
  };
}

/**
 * Helper: Ensure username aliases are created for previous usernames
 */
async function ensureUsernameAliases(
  tx: TransactionClient,
  userId: string,
  previousUsername: string | null
): Promise<void> {
  if (!previousUsername) return;

  // Check if this username is already an alias
  const existingAlias = await tx.userAlias.findUnique({
    where: { username: previousUsername },
  });

  if (!existingAlias) {
    await tx.userAlias.create({
      data: {
        username: previousUsername,
        userId,
      },
    });
  }
}

/**
 * Helper: Calculate diff between two profile snapshots
 */
function diffProfileSnapshots(
  before: ProfileSnapshot,
  after: ProfileSnapshot
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  if (before.name !== after.name) {
    diff.name = { before: before.name, after: after.name };
  }
  if (before.username !== after.username) {
    diff.username = { before: before.username, after: after.username };
  }
  if (before.bio !== after.bio) {
    diff.bio = { before: before.bio, after: after.bio };
  }
  if (before.image !== after.image) {
    diff.image = { before: before.image, after: after.image };
  }

  return diff;
}

/**
 * Check if a username is available (not taken and not an alias)
 */
export async function isProfileUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  // Check if username is taken
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user && user.id !== excludeUserId) {
    return false;
  }

  // Check if username is an alias — but allow the user to reclaim their own alias
  const alias = await prisma.userAlias.findUnique({
    where: { username },
  });

  if (alias && alias.userId !== excludeUserId) {
    return false;
  }

  return true;
}

/**
 * Publish a profile draft to live
 */
export async function publishProfileDraft(
  userId: string
): Promise<{ published: ProfileSnapshot; diff: Record<string, unknown> }> {
  const result = await prisma.$transaction(async (tx) => {
    // Get the draft
    const draft = await tx.profileDraft.findUnique({
      where: { userId },
    });

    if (!draft) {
      throw new Error("No draft to publish");
    }

    // Get the current live profile
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const beforeSnapshot: ProfileSnapshot = user;
    const afterSnapshot: ProfileSnapshot = {
      name: draft.name ?? user.name,
      username: draft.username ?? user.username,
      bio: draft.bio ?? user.bio,
      image: draft.image ?? user.image,
    };

    // Calculate diff
    const diff = diffProfileSnapshots(beforeSnapshot, afterSnapshot);

    // Handle username change - create alias for old username
    if (beforeSnapshot.username && beforeSnapshot.username !== afterSnapshot.username) {
      // Recheck availability within the transaction to guard against TOCTOU races
      const takenByOther = await tx.user.findFirst({
        where: { username: afterSnapshot.username, NOT: { id: userId } },
      });
      if (takenByOther) {
        throw new Error("Username already taken");
      }
      await ensureUsernameAliases(tx, userId, beforeSnapshot.username);
    }

    // Update the live profile
    await tx.user.update({
      where: { id: userId },
      data: {
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        image: afterSnapshot.image,
      },
    });

    // Create version record
    await tx.profileVersion.create({
      data: {
        userId,
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        image: afterSnapshot.image,
        changeType: "publish",
        diffJson: JSON.stringify(diff),
      },
    });

    // Delete the draft
    await tx.profileDraft.delete({
      where: { userId },
    });

    // Revoke all preview tokens for this user
    await tx.profilePreviewToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return {
      published: afterSnapshot,
      diff,
    };
  });

  return result;
}

/**
 * Create a secure preview token for draft sharing
 */
export async function createProfilePreviewToken(
  userId: string,
  expiresInDays: number = 7
): Promise<{ token: string; expiresAt: Date }> {
  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Store the hash in database
  await prisma.profilePreviewToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

/**
 * Validate and resolve a preview token to get the draft snapshot
 */
export async function resolvePreviewToken(
  token: string
): Promise<{ userId: string; snapshot: ProfileSnapshot } | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const previewToken = await prisma.profilePreviewToken.findUnique({
    where: { tokenHash },
  });

  if (!previewToken) {
    return null;
  }

  // Check if token is expired
  if (previewToken.expiresAt < new Date()) {
    return null;
  }

  // Check if token is revoked
  if (previewToken.revokedAt) {
    return null;
  }

  // Get the draft snapshot
  const draft = await prisma.profileDraft.findUnique({
    where: { userId: previewToken.userId },
  });

  if (!draft) {
    return null;
  }

  const snapshot: ProfileSnapshot = {
    name: draft.name,
    username: draft.username,
    bio: draft.bio,
    image: draft.image,
  };

  return {
    userId: previewToken.userId,
    snapshot,
  };
}

/**
 * Get profile version history
 */
export async function getProfileVersions(userId: string, limit: number = 20) {
  const versions = await prisma.profileVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return versions.map((v) => ({
    id: v.id,
    snapshot: {
      name: v.name,
      username: v.username,
      bio: v.bio,
      image: v.image,
    },
    changeType: v.changeType,
    diff: v.diffJson ? JSON.parse(v.diffJson) : {},
    createdAt: v.createdAt,
  }));
}

/**
 * Rollback to a specific profile version
 */
export async function rollbackProfileVersion(
  userId: string,
  versionId: string
): Promise<{ snapshot: ProfileSnapshot; diff: Record<string, unknown> }> {
  const result = await prisma.$transaction(async (tx) => {
    // Get the version to rollback to
    const version = await tx.profileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.userId !== userId) {
      throw new Error("Version not found or access denied");
    }

    // Get current profile
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const beforeSnapshot: ProfileSnapshot = user;
    const afterSnapshot: ProfileSnapshot = {
      name: version.name,
      username: version.username,
      bio: version.bio,
      image: version.image,
    };

    // Calculate diff
    const diff = diffProfileSnapshots(beforeSnapshot, afterSnapshot);

    // Handle username change
    if (beforeSnapshot.username && beforeSnapshot.username !== afterSnapshot.username) {
      await ensureUsernameAliases(tx, userId, beforeSnapshot.username);
    }

    // Update the live profile
    await tx.user.update({
      where: { id: userId },
      data: {
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        image: afterSnapshot.image,
      },
    });

    // Create new version record for the rollback
    await tx.profileVersion.create({
      data: {
        userId,
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        image: afterSnapshot.image,
        changeType: "rollback",
        diffJson: JSON.stringify(diff),
      },
    });

    // Delete any existing draft (deleteMany never throws on missing record)
    await tx.profileDraft.deleteMany({
      where: { userId },
    });

    // Revoke all preview tokens
    await tx.profilePreviewToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return {
      snapshot: afterSnapshot,
      diff,
    };
  });

  return result;
}
