import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendVerificationEmail } from '@/lib/mail';
import { transporterMock } from '../mocks/nodemailer';

describe('Mail Utility Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call sendMail with correct HTML content and recipient', async () => {
        const mockEmail = 'recipient@example.com';
        const mockToken = 'test_token_456';
        
        // Mock environment variables
        process.env.NEXTAUTH_URL = 'https://linkid.test';
        process.env.NODEMAILER_FROM = 'LinkID <noreply@linkid.test>';

        await sendVerificationEmail(mockEmail, mockToken);

        expect(transporterMock.sendMail).toHaveBeenCalled();
        const callArgs = (transporterMock.sendMail as any).mock.calls[0][0];

        expect(callArgs.to).toBe(mockEmail);
        expect(callArgs.from).toContain('LinkID <noreply@linkid.test>');
        expect(callArgs.subject).toBe('Verify your LinkID account');
        
        // Check if HTML contains the verification link and token
        expect(callArgs.html).toContain('https://linkid.test/verify-email?token=test_token_456');
    });

    it('should include the correct expiry time in the email template', async () => {
        process.env.TOKEN_EXPIRY_HOURS = '12';
        const mockEmail = 'recipient@example.com';
        const mockToken = 'test_token_789';

        await sendVerificationEmail(mockEmail, mockToken);

        const callArgs = (transporterMock.sendMail as any).mock.calls[0][0];
        expect(callArgs.html).toContain('expire in 12 hours');
    });
});
