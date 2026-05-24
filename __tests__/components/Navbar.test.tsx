/**
 * __tests__/components/Navbar.test.tsx
 *
 * Tests for app/components/Navbar.tsx
 *
 * Navbar.tsx is the PUBLIC landing-page navbar only. It does NOT read
 * auth state. It renders:
 *   - Brand / logo linking to "/"
 *   - Section anchor links (Features, How it Works, etc.)
 *   - A theme toggle button
 *   - A "Get Started" link pointing to /login
 *
 * Auth-specific behaviour (Dashboard link, hiding Sign In when logged in,
 * user avatar) belongs to DashboardNavbar.tsx — tested separately.
 *
 * Covers:
 *  - Smoke test
 *  - Brand / logo present and links to "/"
 *  - "Get Started" link present and points to /login
 *  - Section anchor links present
 *  - Theme toggle button present
 *  - <nav> landmark present
 *  - Keyboard accessibility — no tabIndex -1 on buttons
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/app/components/Navbar";

// Navbar does not call useSession — no auth mock needed.
// next/navigation and next/image are mocked globally in jest.setup.ts.

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
describe("Navbar — smoke test", () => {
  it("renders without crashing", () => {
    expect(() => render(<Navbar />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Brand / logo
// ---------------------------------------------------------------------------
describe("Navbar — branding", () => {
  beforeEach(() => render(<Navbar />));

  it("displays the LinkID brand name", () => {
    expect(screen.getByText(/linkid/i)).toBeInTheDocument();
  });

  it("brand name links to the homepage '/'", () => {
    const homeLink = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/");
    expect(homeLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Get Started CTA
// ---------------------------------------------------------------------------
describe("Navbar — Get Started link", () => {
  beforeEach(() => render(<Navbar />));

  it("renders a 'Get Started' link", () => {
    const ctaLink = screen.getByRole("link", { name: /get started/i });
    expect(ctaLink).toBeInTheDocument();
  });

  it("'Get Started' link points to /login", () => {
    const ctaLink = screen.getByRole("link", { name: /get started/i });
    expect(ctaLink.getAttribute("href")).toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// Section anchor links
// ---------------------------------------------------------------------------
describe("Navbar — section links", () => {
  beforeEach(() => render(<Navbar />));

  it("renders at least one section anchor link", () => {
    const links = screen.getAllByRole("link");
    // Section links use href="#section-name" anchors
    const anchorLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("#")
    );
    expect(anchorLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT render a Dashboard link (auth-only element)", () => {
    // Dashboard link belongs to DashboardNavbar, not the public Navbar
    const dashboardLink = screen.queryByRole("link", { name: /dashboard/i });
    expect(dashboardLink).not.toBeInTheDocument();
  });

  it("does NOT render a Sign In link (Navbar uses 'Get Started' instead)", () => {
    // Public Navbar shows "Get Started" — not a Sign In link
    const signInLink = screen.queryByRole("link", { name: /^sign in$/i });
    expect(signInLink).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------
describe("Navbar — theme toggle", () => {
  it("renders the theme toggle button", () => {
    render(<Navbar />);
    // ThemeToggle renders a <button> — presence confirms it's mounted
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe("Navbar — accessibility", () => {
  beforeEach(() => render(<Navbar />));

  it("has a <nav> landmark element", () => {
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("no button has tabIndex -1 (all keyboard reachable)", () => {
    screen.queryAllByRole("button").forEach((btn) => {
      expect(btn).not.toHaveAttribute("tabindex", "-1");
    });
  });

  it("all links have non-empty href attributes", () => {
    screen.getAllByRole("link").forEach((link) => {
      const href = link.getAttribute("href") ?? "";
      expect(href.length).toBeGreaterThan(0);
    });
  });
});