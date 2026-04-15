import { vi } from 'vitest';

/**
 * Mocking Prisma for Unit Tests
 * This allows us to test the API logic without a running database.
 */
export const prismaMock = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    verificationToken: {
        create: vi.fn(),
        delete: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: prismaMock,
}));

vi.mock('@/app/generated/prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
}));
