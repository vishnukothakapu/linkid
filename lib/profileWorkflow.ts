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
  themeType: string | null;
  themeColor: string | null;
  themeCustom: string | null;
  backgroundImage: string | null;
}

/**
 * Upsert a profile draft for a workspace
 */
export async function upsertProfileDraft(
  workspaceId: string,
  data: Partial<ProfileSnapshot>
): Promise<ProfileSnapshot> {
  // Validate username if it's being changed
  if (data.username) {
    const basicValidation = validateUsername(data.username);
    if (!basicValidation.valid) {
      throw new Error(basicValidation.error || "Invalid username");
    }

    // Check if username is available
    const isAvailable = await isProfileUsernameAvailable(data.username, workspaceId);
    if (!isAvailable) {
      throw new Error("Username already taken");
    }
  }

  const draft = await prisma.profileDraft.upsert({
    where: { workspaceId },
    update: data,
    create: {
      workspaceId,
      ...data,
    },
  });

  return {
    name: draft.name,
    username: draft.username,
    bio: draft.bio,
    image: draft.image,
    themeType: draft.themeType,
    themeColor: draft.themeColor,
    themeCustom: draft.themeCustom,
    backgroundImage: draft.backgroundImage,
  };
}

/**
 * Get the current editable profile state (draft if exists, otherwise live workspace profile)
 */
export async function getEditableProfileState(
  workspaceId: string
): Promise<ProfileSnapshot> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      name: true,
      username: true,
      bio: true,
      backgroundImage: true,
      themeType: true,
      themeColor: true,
      themeCustom: true,
      profileDraft: true,
      members: {
        where: { role: "OWNER" },
        include: { user: { select: { image: true } } },
        take: 1,
      },
    },
  });

  if (!workspace) {
    await prisma.profileDraft.deleteMany({ where: { workspaceId } });
    throw new Error("Workspace not found");
  }

  const liveImage = workspace.members[0]?.user?.image ?? null;
  const draft = workspace.profileDraft;

  if (draft) {
    return {
      name: draft.name ?? workspace.name ?? null,
      username: draft.username ?? workspace.username ?? null,
      bio: draft.bio ?? workspace.bio ?? null,
      image: draft.image ?? liveImage,
      themeType: draft.themeType ?? workspace.themeType ?? null,
      themeColor: draft.themeColor ?? workspace.themeColor ?? null,
      themeCustom: draft.themeCustom ?? workspace.themeCustom ?? null,
      backgroundImage: draft.backgroundImage ?? workspace.backgroundImage ?? null,
    };
  }

  return {
    name: workspace.name,
    username: workspace.username,
    bio: workspace.bio,
    image: liveImage,
    themeType: workspace.themeType,
    themeColor: workspace.themeColor,
    themeCustom: workspace.themeCustom,
    backgroundImage: workspace.backgroundImage,
  };
}

/**
 * Helper: Ensure username aliases are created for previous usernames
 */
async function ensureUsernameAliases(
  tx: TransactionClient,
  workspaceId: string,
  previousUsername: string | null
): Promise<void> {
  if (!previousUsername) return;

  const existingAlias = await tx.workspaceAlias.findUnique({
    where: { username: previousUsername },
  });

  if (!existingAlias) {
    await tx.workspaceAlias.create({
      data: {
        username: previousUsername,
        workspaceId,
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
  if (before.themeType !== after.themeType) {
    diff.themeType = { before: before.themeType, after: after.themeType };
  }
  if (before.themeColor !== after.themeColor) {
    diff.themeColor = { before: before.themeColor, after: after.themeColor };
  }
  if (before.themeCustom !== after.themeCustom) {
    diff.themeCustom = { before: before.themeCustom, after: after.themeCustom };
  }
  if (before.backgroundImage !== after.backgroundImage) {
    diff.backgroundImage = { before: before.backgroundImage, after: after.backgroundImage };
  }

  return diff;
}

/**
 * Check if a username is available (not taken by another workspace or alias)
 */
export async function isProfileUsernameAvailable(
  username: string,
  excludeWorkspaceId?: string,
  tx?: TransactionClient | typeof prisma
): Promise<boolean> {
  const db = tx || prisma;
  const workspace = await db.workspace.findUnique({
    where: { username },
  });

  if (workspace && workspace.id !== excludeWorkspaceId) {
    return false;
  }

  // Check if username is an alias — but allow workspace to reclaim its own alias
  const alias = await db.workspaceAlias.findUnique({
    where: { username },
  });

  if (alias && alias.workspaceId !== excludeWorkspaceId) {
    return false;
  }

  return true;
}

/**
 * Publish a profile draft to live workspace
 */
export async function publishProfileDraft(
  workspaceId: string
): Promise<{ published: ProfileSnapshot; diff: Record<string, unknown> }> {
  const result = await prisma.$transaction(async (tx) => {
    const draft = await tx.profileDraft.findUnique({
      where: { workspaceId },
    });

    if (!draft) {
      throw new Error("No draft to publish");
    }

    const workspace = await tx.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        username: true,
        bio: true,
        backgroundImage: true,
        themeType: true,
        themeColor: true,
        themeCustom: true,
      },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Resolve owner image for snapshot
    const ownerMember = await tx.workspaceMember.findFirst({
      where: { workspaceId, role: "OWNER" },
      include: { user: { select: { image: true } } },
    });
    const liveImage = ownerMember?.user?.image ?? null;

    const beforeSnapshot: ProfileSnapshot = {
      ...workspace,
      image: liveImage,
    };
    const afterSnapshot: ProfileSnapshot = {
      name: draft.name ?? workspace.name,
      username: draft.username ?? workspace.username,
      bio: draft.bio ?? workspace.bio,
      image: draft.image ?? liveImage,
      themeType: draft.themeType ?? workspace.themeType,
      themeColor: draft.themeColor ?? workspace.themeColor,
      themeCustom: draft.themeCustom ?? workspace.themeCustom,
      backgroundImage: draft.backgroundImage ?? workspace.backgroundImage,
    };

    const diff = diffProfileSnapshots(beforeSnapshot, afterSnapshot);

    // Handle username being set or changed
    if (afterSnapshot.username && afterSnapshot.username !== beforeSnapshot.username) {
      const isAvailable = await isProfileUsernameAvailable(afterSnapshot.username, workspaceId, tx);
      if (!isAvailable) {
        throw new Error("Username already taken");
      }
      if (beforeSnapshot.username) {
        await ensureUsernameAliases(tx, workspaceId, beforeSnapshot.username);

        const existingHistory = await tx.usernameHistory.findUnique({
          where: { previousUsername: beforeSnapshot.username },
        });
        if (!existingHistory) {
          await tx.usernameHistory.create({
            data: { previousUsername: beforeSnapshot.username, workspaceId },
          });
        }
      }
    }

    // Update the live workspace
    await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        backgroundImage: afterSnapshot.backgroundImage,
        themeType: afterSnapshot.themeType ?? "solid",
        themeColor: afterSnapshot.themeColor ?? "slate",
        themeCustom: afterSnapshot.themeCustom,
      },
    });

    // Update owner User.image if image changed (including removing image)
    if (afterSnapshot.image !== liveImage && ownerMember) {
      await tx.user.update({
        where: { id: ownerMember.userId },
        data: { image: afterSnapshot.image ?? null },
      });
    }

    // Create version record using snapshot JSON
    await tx.profileVersion.create({
      data: {
        workspaceId,
        snapshot: afterSnapshot as unknown as Prisma.InputJsonValue,
        changeType: "publish",
        diff: diff as unknown as Prisma.InputJsonValue,
      },
    });

    // Delete the draft
    await tx.profileDraft.delete({
      where: { workspaceId },
    });

    // Revoke all preview tokens for this workspace
    await tx.profilePreviewToken.updateMany({
      where: { workspaceId },
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
  workspaceId: string,
  expiresInDays: number = 7
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await prisma.profilePreviewToken.create({
    data: {
      workspaceId,
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
): Promise<{ workspaceId: string; snapshot: ProfileSnapshot } | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const previewToken = await prisma.profilePreviewToken.findUnique({
    where: { tokenHash },
  });

  if (!previewToken) {
    return null;
  }

  if (previewToken.expiresAt < new Date()) {
    return null;
  }

  if (previewToken.revokedAt) {
    return null;
  }

  const draft = await prisma.profileDraft.findUnique({
    where: { workspaceId: previewToken.workspaceId },
  });

  if (!draft) {
    return null;
  }

  const snapshot: ProfileSnapshot = {
    name: draft.name,
    username: draft.username,
    bio: draft.bio,
    image: draft.image,
    themeType: draft.themeType,
    themeColor: draft.themeColor,
    themeCustom: draft.themeCustom,
    backgroundImage: draft.backgroundImage,
  };

  return {
    workspaceId: previewToken.workspaceId,
    snapshot,
  };
}

/**
 * Get profile version history for a workspace
 */
export async function getProfileVersions(workspaceId: string, limit: number = 20) {
  const versions = await prisma.profileVersion.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return versions
    .filter((v) => v.snapshot && typeof v.snapshot === "object" && Object.keys(v.snapshot).length > 0)
    .map((v) => ({
      id: v.id,
      snapshot: v.snapshot as unknown as ProfileSnapshot,
      changeType: v.changeType,
      diff: (v.diff as Record<string, unknown>) ?? {},
      createdAt: v.createdAt,
    }));
}

/**
 * Rollback to a specific profile version
 */
export async function rollbackProfileVersion(
  workspaceId: string,
  versionId: string
): Promise<{ snapshot: ProfileSnapshot; diff: Record<string, unknown> }> {
  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.profileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.workspaceId !== workspaceId) {
      throw new Error("Version not found or access denied");
    }

    if (!version.snapshot || typeof version.snapshot !== "object" || Object.keys(version.snapshot).length === 0) {
      throw new Error("Cannot rollback to a version with an empty snapshot");
    }

    const afterSnapshot = version.snapshot as unknown as ProfileSnapshot;

    // Get current live workspace state for diff
    const workspace = await tx.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        username: true,
        bio: true,
        backgroundImage: true,
        themeType: true,
        themeColor: true,
        themeCustom: true,
      },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const ownerMember = await tx.workspaceMember.findFirst({
      where: { workspaceId, role: "OWNER" },
      include: { user: { select: { image: true } } },
    });
    const liveImage = ownerMember?.user?.image ?? null;

    const beforeSnapshot: ProfileSnapshot = { ...workspace, image: liveImage };
    const diff = diffProfileSnapshots(beforeSnapshot, afterSnapshot);

    // Handle username change
    if (afterSnapshot.username && afterSnapshot.username !== beforeSnapshot.username) {
      const isAvailable = await isProfileUsernameAvailable(afterSnapshot.username, workspaceId, tx);
      if (!isAvailable) {
        throw new Error("The username in this profile version is no longer available.");
      }
      if (beforeSnapshot.username) {
        await ensureUsernameAliases(tx, workspaceId, beforeSnapshot.username);
      }
    }

    // Update the live workspace (without image, which lives on User)
    await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        name: afterSnapshot.name,
        username: afterSnapshot.username,
        bio: afterSnapshot.bio,
        backgroundImage: afterSnapshot.backgroundImage,
        themeType: afterSnapshot.themeType ?? "solid",
        themeColor: afterSnapshot.themeColor ?? "slate",
        themeCustom: afterSnapshot.themeCustom,
      },
    });

    // Update owner User.image if image changed during rollback
    if (afterSnapshot.image !== liveImage && ownerMember) {
      await tx.user.update({
        where: { id: ownerMember.userId },
        data: { image: afterSnapshot.image ?? null },
      });
    }

    // Create new version record for the rollback
    await tx.profileVersion.create({
      data: {
        workspaceId,
        snapshot: afterSnapshot as unknown as Prisma.InputJsonValue,
        changeType: "rollback",
        diff: diff as unknown as Prisma.InputJsonValue,
      },
    });

    // Delete any existing draft
    await tx.profileDraft.deleteMany({
      where: { workspaceId },
    });

    // Revoke all preview tokens
    await tx.profilePreviewToken.updateMany({
      where: { workspaceId },
      data: { revokedAt: new Date() },
    });

    return {
      snapshot: afterSnapshot,
      diff,
    };
  });

  return result;
}
