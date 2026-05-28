/**
 * jest.setup.ts
 *
 * This file runs once per test suite AFTER Jest is initialised.
 * It extends Jest's `expect` with @testing-library/jest-dom matchers
 * such as toBeInTheDocument(), toHaveClass(), toBeDisabled(), etc.
 */

import React from "react";
import "@testing-library/jest-dom";

// Silence Next.js router warnings in tests
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock next-auth so components that call useSession don't need a real provider
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/image to avoid canvas dependencies in jsdom
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    return React.createElement("img", { src, alt, ...props });
  },
}));

// Suppress console.error for known React 19 / RTL noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = args[0];
    if (
      typeof msg === "string" &&
      (msg.includes("ReactDOM.render") ||
        msg.includes("not wrapped in act"))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});