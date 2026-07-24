import { z } from 'zod';

/**
 * Password validation requirements.
 *
 * A valid password must:
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one numeric digit
 * - Contain at least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least 1 special character'
  );

/**
 * Validation schema for user registration.
 *
 * Fields:
 * - name: User's display name (minimum 2 characters)
 * - email: Valid email address
 * - password: Must satisfy the password policy
 */
export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required'),

  email: z
    .email('Invalid email address'),

  password: passwordSchema,
});

/**
 * Type inferred from the signup validation schema.
 *
 * Use this type to ensure consistency between validation
 * and application logic.
 */
export type SignupInput = z.infer<typeof signupSchema>;