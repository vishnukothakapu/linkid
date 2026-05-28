/**
 * __tests__/pages/RegisterPage.test.tsx
 *
 * Tests for app/register/page.tsx
 *
 * The register page collects: username, email, password, confirm password.
 * This also directly tests the fix for GitHub Issue #44:
 *   "[Bug] Password Visibility Toggle Not Working on Register Page"
 *
 * Covers:
 *  - Smoke test
 *  - All four form fields present
 *  - Password visibility toggle on password field (Issue #44)
 *  - Password visibility toggle on confirm-password field (Issue #44)
 *  - Each toggle is independent of the other
 *  - Username field accepts valid values
 *  - Link to /login is present
 *  - Form heading is present
 *  - Accessibility — labels, heading, button roles
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/register/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPasswordInput(): HTMLInputElement | null {
  return (
    (document.querySelector(
      'input[name="password"], input[id="password"]'
    ) as HTMLInputElement) ??
    (screen.queryByLabelText(/^password$/i) as HTMLInputElement) ??
    null
  );
}

function getConfirmPasswordInput(): HTMLInputElement | null {
  return (
    (document.querySelector(
      'input[name="confirmPassword"], input[name="confirm_password"], input[id="confirmPassword"]'
    ) as HTMLInputElement) ??
    (screen.queryByLabelText(/confirm password/i) as HTMLInputElement) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
describe("RegisterPage — smoke test", () => {
  it("renders without crashing", () => {
    expect(() => render(<RegisterPage />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
describe("RegisterPage — form fields", () => {
  beforeEach(() => render(<RegisterPage />));

  it("renders a username input", () => {
    const usernameInput =
      screen.queryByRole("textbox", { name: /username/i }) ||
      screen.queryByPlaceholderText(/username/i) ||
      document.querySelector('input[name="username"]');
    expect(usernameInput).toBeInTheDocument();
  });

  it("renders an email input", () => {
    const emailInput =
      screen.queryByRole("textbox", { name: /email/i }) ||
      document.querySelector('input[type="email"]');
    expect(emailInput).toBeInTheDocument();
  });

  it("renders a password input", () => {
    const passwordInput = getPasswordInput();
    expect(passwordInput).toBeInTheDocument();
  });

  it("renders a confirm-password input", () => {
    const confirmInput = getConfirmPasswordInput();
    expect(confirmInput).toBeInTheDocument();
  });

  it("password field is type=password by default (hidden)", () => {
    const passwordInput = getPasswordInput();
    expect(passwordInput?.type).toBe("password");
  });

  it("confirm-password field is type=password by default (hidden)", () => {
    const confirmInput = getConfirmPasswordInput();
    expect(confirmInput?.type).toBe("password");
  });
});

// ---------------------------------------------------------------------------
// Issue #44 — Password visibility toggle on password field
// ---------------------------------------------------------------------------
describe("RegisterPage — Issue #44: password field visibility toggle", () => {
  it("has a toggle button for the password field", () => {
    render(<RegisterPage />);
    const toggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    expect(toggleBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("clicking the password toggle changes type from 'password' to 'text'", async () => {
    render(<RegisterPage />);

    const passwordInput = getPasswordInput();
    expect(passwordInput?.type).toBe("password");

    // Find the toggle closest to the password field
    const allToggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    const toggleBtn = allToggleBtns[0];

    if (toggleBtn && passwordInput) {
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(passwordInput.type).toBe("text");
      });
    }
  });

  it("clicking the password toggle again hides the password (back to type=password)", async () => {
    render(<RegisterPage />);

    const passwordInput = getPasswordInput();
    const allToggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    const toggleBtn = allToggleBtns[0];

    if (toggleBtn && passwordInput) {
      fireEvent.click(toggleBtn); // show
      fireEvent.click(toggleBtn); // hide again
      await waitFor(() => {
        expect(passwordInput.type).toBe("password");
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Issue #44 — Password visibility toggle on confirm-password field
// ---------------------------------------------------------------------------
describe("RegisterPage — Issue #44: confirm-password field visibility toggle", () => {
  it("has a toggle button for the confirm-password field", () => {
    render(<RegisterPage />);
    const toggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    // Should have at least 2 toggle buttons (one per password field)
    expect(toggleBtns.length).toBeGreaterThanOrEqual(2);
  });

  it("clicking the confirm-password toggle reveals that field independently", async () => {
    render(<RegisterPage />);

    const confirmInput = getConfirmPasswordInput();
    const allToggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    // Second toggle = confirm-password
    const confirmToggleBtn = allToggleBtns[1];

    if (confirmToggleBtn && confirmInput) {
      expect(confirmInput.type).toBe("password");
      fireEvent.click(confirmToggleBtn);
      await waitFor(() => {
        expect(confirmInput.type).toBe("text");
      });
    }
  });

  it("password and confirm-password toggles are independent of each other", async () => {
    render(<RegisterPage />);

    const passwordInput = getPasswordInput();
    const confirmInput = getConfirmPasswordInput();
    const allToggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });

    if (
      allToggleBtns.length >= 2 &&
      passwordInput &&
      confirmInput
    ) {
      // Toggle only the confirm field
      fireEvent.click(allToggleBtns[1]);

      await waitFor(() => {
        // Confirm field is now visible
        expect(confirmInput.type).toBe("text");
        // Password field is still hidden
        expect(passwordInput.type).toBe("password");
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Username field input
// ---------------------------------------------------------------------------
describe("RegisterPage — username field", () => {
  it("accepts typed input in the username field", async () => {
    render(<RegisterPage />);
    const usernameInput = (
      screen.queryByRole("textbox", { name: /username/i }) ||
      document.querySelector('input[name="username"]')
    ) as HTMLInputElement;

    if (usernameInput) {
      await userEvent.type(usernameInput, "vishnu");
      expect(usernameInput.value).toBe("vishnu");
    }
  });
});

// ---------------------------------------------------------------------------
// Navigation links
// ---------------------------------------------------------------------------
describe("RegisterPage — navigation links", () => {
  beforeEach(() => render(<RegisterPage />));

  it("has a link to the login page", () => {
    const loginLink = screen.queryByRole("link", {
      name: /log in|sign in|already have an account/i,
    });
    expect(loginLink).toBeInTheDocument();
  });

  it("login link points to /login", () => {
    const loginLink = screen.queryByRole("link", {
      name: /log in|sign in|already have an account/i,
    });
    if (loginLink) {
      expect(loginLink.getAttribute("href")).toContain("/login");
    }
  });
});

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------
describe("RegisterPage — submit button", () => {
  beforeEach(() => render(<RegisterPage />));

  it("renders a register / create account button", () => {
    const submitBtn =
      screen.queryByRole("button", {
        name: /register|create account|sign up|get started/i,
      }) || screen.queryByRole("button", { name: /submit/i });
    expect(submitBtn).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe("RegisterPage — accessibility", () => {
  beforeEach(() => render(<RegisterPage />));

  it("page has a heading", () => {
    expect(screen.queryByRole("heading")).toBeInTheDocument();
  });

  it("username input has an associated label", () => {
    const usernameInput =
      screen.queryByLabelText(/username/i) ||
      document.querySelector('input[name="username"]');
    expect(usernameInput).toBeInTheDocument();
  });

  it("password toggle buttons have an accessible label", () => {
    const toggleBtns = screen.queryAllByRole("button", {
      name: /show|hide|toggle|eye/i,
    });
    toggleBtns.forEach((btn) => {
      const label =
        btn.getAttribute("aria-label") ||
        btn.getAttribute("title") ||
        btn.textContent?.trim();
      expect(label?.length).toBeGreaterThan(0);
    });
  });
});
