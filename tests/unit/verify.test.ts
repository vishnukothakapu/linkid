import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/verify/route';
import { prismaMock } from '../mocks/prisma';

// Mock the response again
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn().mockImplementation((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: (init?.status || 200) < 400,
        })),
    },
}));

describe('Verification API Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully verify a user with a valid token', async () => {
        const mockToken = 'valid_token_123';
        const mockUser = {
            id: 'user_1',
            email: 'test@example.com',
            tokenExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        };

        const request = new Request(`http://localhost:3000/api/auth/verify?token=${mockToken}`);

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue({ ...mockUser, isVerified: true });

        const response = await GET(request);
        const data = await response.json();

        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: 'user_1' },
            data: expect.objectContaining({
                isVerified: true,
                verificationToken: null,
                tokenExpiry: null,
                emailVerified: expect.any(Date),
            }),
        });

        expect(data.success).toBe(true);
        expect(response.status).toBe(200);
    });

    it('should fail for an expired token', async () => {
        const mockToken = 'expired_token_123';
        const mockUser = {
            id: 'user_1',
            email: 'test@example.com',
            tokenExpiry: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        };

        const request = new Request(`http://localhost:3000/api/auth/verify?token=${mockToken}`);

        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await GET(request);
        const data = await response.json();

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(data.error).toBe('Token has expired');
        expect(response.status).toBe(400);
    });

    it('should fail for an invalid token', async () => {
        const mockToken = 'non_existent_token';
        const request = new Request(`http://localhost:3000/api/auth/verify?token=${mockToken}`);

        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await GET(request);
        const data = await response.json();

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(data.error).toBe('Invalid token');
        expect(response.status).toBe(400);
    });
});
