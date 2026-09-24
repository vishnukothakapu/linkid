import assert from "node:assert/strict";
import test from "node:test";

import { signupSchema, getPasswordError } from "@/lib/validations/auth";

test("signupSchema accepts valid email and password", () => {
    const result = signupSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "Secure@123",
    });

    assert.equal(result.success, true);
});

test("signupSchema rejects invalid email", () => {
    const result = signupSchema.safeParse({
        name: "John Doe",
        email: "not-an-email",
        password: "Secure@123",
    });

    assert.equal(result.success, false);
    if (!result.success) {
        const emailErrors = result.error.flatten().fieldErrors.email;
        assert.ok(emailErrors?.some((e) => e.includes("Invalid email")));
    }
});

test("signupSchema rejects empty email", () => {
    const result = signupSchema.safeParse({
        name: "John Doe",
        email: "",
        password: "Secure@123",
    });

    assert.equal(result.success, false);
});

test("signupSchema accepts valid password", () => {
    const result = signupSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "Abcdef1@",
    });

    assert.equal(result.success, true);
});

test("signupSchema rejects password below minimum length", () => {
    const result = signupSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "Ab1@",
    });

    assert.equal(result.success, false);
    if (!result.success) {
        const passwordErrors = result.error.flatten().fieldErrors.password;
        assert.ok(passwordErrors?.some((e) => e.includes("at least 8")));
    }
});

test("signupSchema rejects missing required fields", () => {
    const result = signupSchema.safeParse({});

    assert.equal(result.success, false);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        assert.ok(errors.name);
        assert.ok(errors.email);
        assert.ok(errors.password);
    }
});

test("getPasswordError returns null for valid password", () => {
    assert.equal(getPasswordError("Secure@123"), null);
});

test("getPasswordError returns error for password below minimum length", () => {
    const error = getPasswordError("Ab1@");
    assert.ok(error?.includes("at least 8 characters"));
});

test("getPasswordError returns error for missing uppercase", () => {
    const error = getPasswordError("secure@123");
    assert.ok(error?.includes("uppercase"));
});

test("getPasswordError returns error for missing lowercase", () => {
    const error = getPasswordError("SECURE@123");
    assert.ok(error?.includes("lowercase"));
});

test("getPasswordError returns error for missing number", () => {
    const error = getPasswordError("Secure@abc");
    assert.ok(error?.includes("number"));
});

test("getPasswordError returns error for missing special character", () => {
    const error = getPasswordError("Secure123");
    assert.ok(error?.includes("special character"));
});
