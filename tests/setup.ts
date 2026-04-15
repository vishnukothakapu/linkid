import { vi, beforeAll, afterEach } from 'vitest';
import './mocks/prisma';
import './mocks/nodemailer';

/**
 * Global Test Setup
 * Initialize mocks and cleanup after each test.
 */
beforeAll(() => {
    // Suppress console logs during tests unless they are errors
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    vi.clearAllMocks();
});
