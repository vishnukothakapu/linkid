import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[@$!%*?&]/, 'Password must contain at least 1 special character'),
});

export function getPasswordError(password: string): string | null {
    if (password.length < 8) return 'Must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Must include one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Must include one lowercase letter';
    if (!/\d/.test(password)) return 'Must include one number';
    if (!/[@$!%*?&]/.test(password)) return 'Must include one special character';
    return null;
}
