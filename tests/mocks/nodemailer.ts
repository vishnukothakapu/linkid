import { vi } from 'vitest';

/**
 * Mocking Nodemailer for Unit Tests
 * This allows us to test the email verification logic without an SMTP server.
 */
export const transporterMock = {
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
};

vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn().mockReturnValue(transporterMock),
    },
}));
// Note: We don't mock @/lib/mail here because we need the real function for mail.test.ts
