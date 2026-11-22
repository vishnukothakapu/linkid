// Mock Prisma client for testing – no real database required.
// The actual store is an in-memory Map managed by the test file.

interface MockDeleteOtp {
  findUnique: (args: { where: { userId: string } }) => Promise<Record<string, unknown> | null>;
  upsert: (args: {
    where: { userId: string };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
  update: (args: {
    where: { userId: string };
    data: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
  delete: (args: { where: { userId: string } }) => Promise<void>;
}

interface MockPrisma {
  deleteOtp: MockDeleteOtp;
}

// Stubs – replaced by mock.method() in the test file before any call.
const deleteOtp: MockDeleteOtp = {
  findUnique: async () => null,
  upsert: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
};

const prisma: MockPrisma = { deleteOtp };

export default prisma;
export { prisma };
