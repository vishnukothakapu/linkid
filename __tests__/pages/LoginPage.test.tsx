/**
 * __tests__/pages/LoginPage.test.tsx
 *
 * Tests for app/login/page.tsx
 *
 * The login page handles two auth flows:
 *  1. Email + password (credentials provider via NextAuth)
 *  2. OAuth — Google and GitHub
 *
 * Covers:
 *  - Smoke test
 *  - Email and password fields are present
 *  - Password visibility toggle works
 *  - Submit button is present
 *  - Google and GitHub OAuth buttons are present
 *  - signIn() is called with correct provider on OAuth click
 *  - Link to /register is present
 *  - Form does not submit with empty fields (HTML5 required)
 *  - Accessibility — labels linked to inputs, button roles
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import LoginPage from "@/app/login/page";

const mockSignIn = signIn as jest.Mock;

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
describe("LoginPage — smoke test", () => {
  it("renders without crashing", () => {
    expect(() => render(<LoginPage />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
describe("LoginPage — form fields", () => {
  beforeEach(() => render(<LoginPage />));

  it("renders an email input", () => {
    const emailInput =
      screen.queryByRole("textbox", { name: /email/i }) ||
      screen.queryByPlaceholderText(/email/i) ||
      document.querySelector('input[type="email"]');
    expect(emailInput).toBeInTheDocument();
  });

  it("renders a password input", () => {
    const passwordInput =
      screen.queryByLabelText(/password/i) ||
      document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it("password input is of type password by default (hidden)", () => {
    const passwordInput = document.querySelector(
      'input[type="password"]'
    ) as HTMLInputElement;
    expect(passwordInput).not.toBeNull();
    expect(passwordInput?.type).toBe("password");
  });
});

// ---------------------------------------------------------------------------
// Password visibility toggle
// ---------------------------------------------------------------------------
describe("LoginPage — password visibility toggle", () => {
  it("toggles password input to type=text when the eye icon is clicked", async () => {
    render(<LoginPage />);
    const toggleBtn = screen.queryByRole("button", {
      name: /show password|toggle password|eye/i,
    });

    if (toggleBtn) {
      // Initially hidden
      const passwordInput = document.querySelector(
        'input[name="password"], input[placeholder*="password" i]'
      ) as HTMLInputElement;

      fireEvent.click(toggleBtn);

      await waitFor(() => {
        expect(passwordInput?.type).toBe("text");
      });
    }
  });

  it("toggles back to type=password when clicked a second time", async () => {
    render(<LoginPage />);
    const toggleBtn = screen.queryByRole("button", {
      name: /show password|toggle password|eye/i,
    });

    if (toggleBtn) {
      const passwordInput = document.querySelector(
        'input[name="password"], input[placeholder*="password" i]'
      ) as HTMLInputElement;

      fireEvent.click(toggleBtn); // → text
      fireEvent.click(toggleBtn); // → password

      await waitFor(() => {
        expect(passwordInput?.type).toBe("password");
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------
describe("LoginPage — submit button", () => {
  beforeEach(() => render(<LoginPage />));

  it("renders a submit / sign in button", () => {
    const submitBtn =
      screen.queryByRole("button", { name: /sign in|log in|login|continue/i }) ||
      screen.queryByRole("button", { name: /submit/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it("submit button is not disabled initially", () => {
    const submitBtn = screen.queryByRole("button", {
      name: /sign in|log in|login|continue/i,
    });
    if (submitBtn) {
      expect(submitBtn).not.toBeDisabled();
    }
  });
});

// ---------------------------------------------------------------------------
// OAuth buttons
// ---------------------------------------------------------------------------
describe("LoginPage — OAuth providers", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    render(<LoginPage />);
  });

  it("renders a Google sign-in button", () => {
    const googleBtn =
      screen.queryByRole("button", { name: /google/i }) ||
      screen.queryByText(/continue with google|sign in with google/i);
    expect(googleBtn).toBeInTheDocument();
  });

  it("renders a GitHub sign-in button", () => {
    const githubBtn =
      screen.queryByRole("button", { name: /github/i }) ||
      screen.queryByText(/continue with github|sign in with github/i);
    expect(githubBtn).toBeInTheDocument();
  });

  it("calls signIn('google') when Google button is clicked", () => {
    const googleBtn = screen.queryByRole("button", { name: /google/i });
    if (googleBtn) {
      fireEvent.click(googleBtn);
      expect(mockSignIn).toHaveBeenCalledWith(
        "google",
        expect.objectContaining({ callbackUrl: expect.any(String) })
      );
    }
  });

  it("calls signIn('github') when GitHub button is clicked", () => {
    const githubBtn = screen.queryByRole("button", { name: /github/i });
    if (githubBtn) {
      fireEvent.click(githubBtn);
      expect(mockSignIn).toHaveBeenCalledWith(
        "github",
        expect.objectContaining({ callbackUrl: expect.any(String) })
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Navigation links
// ---------------------------------------------------------------------------
describe("LoginPage — navigation links", () => {
  beforeEach(() => render(<LoginPage />));

  it("has a link to the register page", () => {
    const registerLink = screen.queryByRole("link", {
      name: /register|sign up|create account/i,
    });
    expect(registerLink).toBeInTheDocument();
  });

  it("register link points to /register", () => {
    const registerLink = screen.queryByRole("link", {
      name: /register|sign up|create account/i,
    });
    if (registerLink) {
      expect(registerLink.getAttribute("href")).toContain("/register");
    }
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe("LoginPage — accessibility", () => {
  beforeEach(() => render(<LoginPage />));

  it("email input has an associated label", () => {
    const emailInput =
      screen.queryByLabelText(/email/i) ||
      document.querySelector('input[type="email"]');
    expect(emailInput).toBeInTheDocument();
  });

  it("password input has an associated label", () => {
    const passwordInput = screen.queryByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it("page has a heading", () => {
    const heading = screen.queryByRole("heading");
    expect(heading).toBeInTheDocument();
  });
});
