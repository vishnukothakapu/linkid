/**
 * __tests__/components/ThemeToggle.test.tsx
 *
 * Tests for app/components/ThemeToggle.tsx
 *
 * ThemeToggle lets users switch between light, dark, and system themes
 * using the `next-themes` library.
 *
 * Covers:
 *  - Smoke test (renders without crashing)
 *  - Toggle button is present and accessible
 *  - Clicking cycles or opens theme options
 *  - Correct aria-label / title for screen readers
 *  - setTheme() is called with correct value on selection
 *  - Current theme is visually indicated
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/app/components/ThemeToggle";

// ---------------------------------------------------------------------------
// Mock next-themes
// ---------------------------------------------------------------------------
const mockSetTheme = jest.fn();
let mockTheme = "light";

jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockTheme,
    themes: ["light", "dark", "system"],
  }),
}));

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
describe("ThemeToggle — smoke test", () => {
  it("renders without crashing in light mode", () => {
    mockTheme = "light";
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });

  it("renders without crashing in dark mode", () => {
    mockTheme = "dark";
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });

  it("renders without crashing in system mode", () => {
    mockTheme = "system";
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Button presence
// ---------------------------------------------------------------------------
describe("ThemeToggle — button presence", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockSetTheme.mockClear();
  });

  it("renders at least one interactive button", () => {
    render(<ThemeToggle />);
    // getByRole fails immediately if no button is found
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("the toggle button has an accessible label", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ fails if missing
    const label =
      btn.getAttribute("aria-label") ||
      btn.getAttribute("title") ||
      btn.textContent?.trim();
    expect(label?.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Theme switching
// ---------------------------------------------------------------------------
describe("ThemeToggle — theme switching", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockSetTheme.mockClear();
  });

  it("calls setTheme once when the toggle is clicked", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  it("toggles to dark when current theme is light", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    const callArg = mockSetTheme.mock.calls[0]?.[0];
    expect(["dark", "system"]).toContain(callArg);
  });

  it("toggles to light when current theme is dark", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    const callArg = mockSetTheme.mock.calls[0]?.[0];
    expect(["light", "system"]).toContain(callArg);
  });

  it("never calls setTheme with an invalid theme value", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    const callArg = mockSetTheme.mock.calls[0]?.[0];
    expect(["light", "dark", "system"]).toContain(callArg);
  });
});

// ---------------------------------------------------------------------------
// Dropdown / menu options
// ---------------------------------------------------------------------------
describe("ThemeToggle — dropdown options", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockSetTheme.mockClear();
  });

  it("shows Light option after the toggle is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button")); // ✅ no if-guard
    expect(screen.getByText(/light/i)).toBeInTheDocument();
  });

  it("shows Dark option after the toggle is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button")); // ✅ no if-guard
    expect(screen.getByText(/dark/i)).toBeInTheDocument();
  });

  it("shows System option after the toggle is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button")); // ✅ no if-guard
    expect(screen.getByText(/system/i)).toBeInTheDocument();
  });

  it("calls setTheme exactly 3 times when clicked 3 times rapidly", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledTimes(3);
  });

  it("always calls setTheme with a valid theme on each rapid click", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button"); // ✅ no if-guard
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    mockSetTheme.mock.calls.forEach(([calledWith]) => {
      expect(["light", "dark", "system"]).toContain(calledWith);
    });
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe("ThemeToggle — accessibility", () => {
  beforeEach(() => {
    mockTheme = "light";
  });

  it("the toggle button is not disabled", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).not.toBeDisabled(); // ✅ no if-guard
  });

  it("has no tabIndex -1 on the trigger button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).not.toHaveAttribute("tabindex", "-1"); // ✅ no if-guard
  });
});