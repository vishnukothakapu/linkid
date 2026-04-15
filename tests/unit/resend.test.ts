import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/resend/route';
import { prismaMock } from '../mocks/prisma';
import { sendVerificationEmail } from '@/lib/mail';

vi.mock('@/lib/mail', () => ({
    sendVerificationEmail: vi.fn(),
}));

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

describe('Resend API Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully resend a verification email for an unverified user', async () => {
        const mockEmail = 'unverified@example.com';
        const mockUser = {
            id: 'user_1',
            email: mockEmail,
            isVerified: false,
        };

        const request = new Request('http://localhost:3000/api/auth/resend', {
            method: 'POST',
            body: JSON.stringify({ email: mockEmail }),
        });

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue({ ...mockUser, verificationToken: 'new_token' });

        const response = await POST(request);
        const data = await response.json();

        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: 'user_1' },
            data: expect.objectContaining({
                verificationToken: expect.stringMatching(/^[a-f0-9]{64}$/),
                tokenExpiry: expect.any(Date),
            }),
        });

        expect(sendVerificationEmail).toHaveBeenCalled();
        expect(data.success).toBe(true);
        expect(response.status).toBe(200);
    });

    it('should fail for an already verified user', async () => {
        const mockEmail = 'verified@example.com';
        const mockUser = {
            id: 'user_1',
            email: mockEmail,
            isVerified: true,
        };

        const request = new Request('http://localhost:3000/api/auth/resend', {
            method: 'POST',
            body: JSON.stringify({ email: mockEmail }),
        });

        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await POST(request);
        const data = await response.json();

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(data.error).toBe('Email is already verified');
        expect(response.status).toBe(400);
    });
});
