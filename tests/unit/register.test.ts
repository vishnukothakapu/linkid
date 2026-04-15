import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { prismaMock } from '../mocks/prisma';
import { sendVerificationEmail } from '@/lib/mail';

vi.mock('@/lib/mail', () => ({
    sendVerificationEmail: vi.fn(),
}));

// Mock the response to handle Next.js NextResponse
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn().mockImplementation((data, init) => ({
            json: async () => data,
            status: init?.status || 200,
            ok: (init?.status || 200) < 400,
        })),
    },
}));

describe('Registration API Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate a 32-character hex token and save to DB', async () => {
        const mockUser = {
            name: 'Test user',
            email: 'test@example.com',
            password: 'password123',
        };

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(mockUser),
        });

        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({ id: 'user_1', ...mockUser });

        const response = await POST(request);
        const data = await response.json();

        // Check if prisma.user.create was called with verification fields
        expect(prismaMock.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    email: mockUser.email,
                    isVerified: false,
                    verificationToken: expect.stringMatching(/^[a-f0-9]{64}$/), // 32 bytes = 64 hex chars
                    tokenExpiry: expect.any(Date),
                }),
            })
        );

        // Check if verification email was "sent"
        expect(sendVerificationEmail).toHaveBeenCalled();
        
        expect(data.success).toBe(true);
        expect(data.message).toBe('Verification email sent!');
    });

    it('should calculate the correct token expiry based on environment variable', async () => {
        // Mock environment variable
        process.env.TOKEN_EXPIRY_HOURS = '48';

        const mockUser = {
            name: 'Test user',
            email: 'test@example.com',
            password: 'password123',
        };

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(mockUser),
        });

        prismaMock.user.findUnique.mockResolvedValue(null);

        await POST(request);

        // Access the calls to check tokenExpiry
        const createCall = prismaMock.user.create.mock.calls[0][0];
        const expiryDate = createCall.data.tokenExpiry;
        
        const now = new Date();
        const expectedDate = new Date();
        expectedDate.setHours(now.getHours() + 48);

        // Check if the expiry is roughly 48 hours in the future
        expect(Math.abs(expiryDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });

    it('should fail if the user already exists', async () => {
        const mockUser = {
            email: 'existing@example.com',
            password: 'password123',
        };

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(mockUser),
        });

        prismaMock.user.findUnique.mockResolvedValue({ id: 'user_1', email: mockUser.email });

        const response = await POST(request);
        const data = await response.json();

        expect(prismaMock.user.create).not.toHaveBeenCalled();
        expect(data.error).toBe('User already exists');
        expect(response.status).toBe(409);
    });
});
