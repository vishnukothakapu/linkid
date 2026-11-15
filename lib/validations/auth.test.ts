import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signupSchema } from './auth';

test('accepts valid signup details', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'StrongPass1!',
  });

  assert.equal(result.success, true);
});

test('rejects an invalid email', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'invalid-email',
    password: 'StrongPass1!',
  });

  assert.equal(result.success, false);
});

test('rejects a name shorter than 2 characters', () => {
  const result = signupSchema.safeParse({
    name: 'A',
    email: 'test@example.com',
    password: 'StrongPass1!',
  });

  assert.equal(result.success, false);
});

test('rejects a password shorter than 8 characters', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'Ab1!',
  });

  assert.equal(result.success, false);
});

test('rejects a password without uppercase letters', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'strongpass1!',
  });

  assert.equal(result.success, false);
});

test('rejects a password without lowercase letters', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'STRONGPASS1!',
  });

  assert.equal(result.success, false);
});

test('rejects a password without a number', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'StrongPass!',
  });

  assert.equal(result.success, false);
});

test('rejects a password without a special character', () => {
  const result = signupSchema.safeParse({
    name: 'Sharuhan',
    email: 'test@example.com',
    password: 'StrongPass123',
  });

  assert.equal(result.success, false);
});