import { z } from 'zod';

import disposableDomains from 'disposable-email-domains';

export const signupSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address').refine(
        (email) => {
            const domain = email.split('@')[1];
            return !disposableDomains.includes(domain);
        },
        { message: 'Disposable or fake email addresses are not allowed' }
    ),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
});