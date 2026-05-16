import prisma from "@/lib/prisma";

/**
 * Marks a user's sessions as invalidated across all devices.
 * Call this BEFORE deleting the user from the database.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  // Session is invalid for 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await prisma.invalidatedSession.upsert({
    where: { userId },
    update: { expiresAt },
    create: { userId, expiresAt }
  });
}

/**
 * Checks whether a user's sessions have been invalidated.
 * Cleans up the record if it has expired.
 */
export async function isUserSessionInvalidated(userId: string): Promise<boolean> {
  const record = await prisma.invalidatedSession.findUnique({
    where: { userId }
  });

  if (!record) return false;

  if (Date.now() > record.expiresAt.getTime()) {
    // Expired, clean up
    await prisma.invalidatedSession.delete({
      where: { userId }
    }).catch(() => {});
    return false;
  }

  return true;
}
