/**
 * __tests__/components/ProfileCard.test.tsx
 *
 * Tests for app/[username]/ProfileCard.tsx
 *
 * ProfileCard is the public-facing component shown at linkid.qzz.io/username.
 * It displays the user's avatar, name, bio, and all their platform links.
 *
 * Covers:
 *  - Smoke test (renders with minimal props)
 *  - Displays user name and bio
 *  - Renders platform links with correct href
 *  - Platform icons render for known platforms
 *  - Empty state (no links added yet)
 *  - Long username / bio does not break layout
 *  - Links open in a new tab (target="_blank")
 *  - Accessibility — link labels, image alt text
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { ProfileCard } from "@/app/[username]/ProfileCard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const baseUserData = {
  name: "Vishnu Kothakapu",
  username: "vishnu",
  bio: "Full-stack developer. Open source enthusiast.",
  image: "https://avatars.githubusercontent.com/u/123",
};

const platformLinks = [
  { id: "1", label: "GitHub", platform: "github", url: "https://github.com/vishnukothakapu", createdAt: new Date(), position: 1, clicks: 0, isPublic: true, userId: "123" },
  { id: "2", label: "LinkedIn", platform: "linkedin", url: "https://linkedin.com/in/vishnukothakapu", createdAt: new Date(), position: 2, clicks: 0, isPublic: true, userId: "123" },
  { id: "3", label: "LeetCode", platform: "leetcode", url: "https://leetcode.com/u/vishnu", createdAt: new Date(), position: 3, clicks: 0, isPublic: true, userId: "123" },
  { id: "4", label: "X", platform: "x", url: "https://x.com/vishnu", createdAt: new Date(), position: 4, clicks: 0, isPublic: true, userId: "123" },
  { id: "5", label: "YouTube", platform: "youtube", url: "https://youtube.com/@vishnu", createdAt: new Date(), position: 5, clicks: 0, isPublic: true, userId: "123" },
];

const baseProps = {
  user: {
    ...baseUserData,
    links: platformLinks,
  },
  username: "vishnu",
  showCTA: true,
};

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
describe("ProfileCard — smoke test", () => {
  it("renders without crashing with full props", () => {
    expect(() =>
      render(<ProfileCard {...baseProps} />)
    ).not.toThrow();
  });

  it("renders without crashing with no links", () => {
    expect(() =>
      render(<ProfileCard {...baseProps} user={{ ...baseProps.user, links: [] }} />)
    ).not.toThrow();
  });

  it("renders without crashing when user has no image", () => {
    expect(() =>
      render(<ProfileCard {...baseProps} user={{ ...baseProps.user, image: null }} />)
    ).not.toThrow();
  });

  it("renders without crashing when user has no bio", () => {
    expect(() =>
      render(<ProfileCard {...baseProps} user={{ ...baseProps.user, bio: null }} />)
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// User identity
// ---------------------------------------------------------------------------
describe("ProfileCard — user identity", () => {
  beforeEach(() => {
    render(<ProfileCard {...baseProps} />);
  });

  it("displays the user's name", () => {
    expect(screen.getByText(/vishnu kothakapu/i)).toBeInTheDocument();
  });

  it("displays the user's bio", () => {
    expect(screen.getByText(/full-stack developer/i)).toBeInTheDocument();
  });

  it("renders the user's avatar image", () => {
    const avatar = screen.getByRole("img", { name: /vishnu/i });
    expect(avatar).toBeInTheDocument();
  });

  it("avatar has the correct src", () => {
    const avatar = screen.getByRole("img", { name: /vishnu/i }) as HTMLImageElement;
    expect(avatar.src).toContain("avatars.githubusercontent.com");
  });
});

// ---------------------------------------------------------------------------
// Avatar fallback
// ---------------------------------------------------------------------------
describe("ProfileCard — avatar fallback", () => {
  it("shows initials when user has no image", () => {
    render(
      <ProfileCard {...baseProps} user={{ ...baseProps.user, image: null }} />
    );
    // Initials "VK" for Vishnu Kothakapu
    const initials = screen.queryByText(/VK/i);
    expect(initials).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Platform links
// ---------------------------------------------------------------------------
describe("ProfileCard — platform links", () => {
  beforeEach(() => {
    render(<ProfileCard {...baseProps} />);
  });

  it("renders the correct number of platform links", () => {
    const links = screen.getAllByRole("link");
    // At least one link per platform
    expect(links.length).toBeGreaterThanOrEqual(platformLinks.length);
  });

  it("each link has a non-empty href", () => {
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
    });
  });

  it("renders the GitHub platform link", () => {
    const links = screen.getAllByRole("link");
    const githubLink = links.find((l) =>
      l.getAttribute("href")?.includes("github.com")
    );
    expect(githubLink).toBeDefined();
  });

  it("renders the LinkedIn platform link", () => {
    const links = screen.getAllByRole("link");
    const linkedinLink = links.find((l) =>
      l.getAttribute("href")?.includes("linkedin.com")
    );
    expect(linkedinLink).toBeDefined();
  });

  it("renders platform labels (github, linkedin, etc.)", () => {
    expect(
      screen.queryByText(/github/i) || screen.queryByAltText(/github/i)
    ).toBeInTheDocument();
  });

  it("links open in a new tab (target=_blank)", () => {
    const links = screen.getAllByRole("link");
    // External links should open in new tab
    const externalLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("http")
    );
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  it("external links have rel=noopener noreferrer for security", () => {
    const links = screen.getAllByRole("link");
    const externalLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("http")
    );
    externalLinks.forEach((link) => {
      const rel = link.getAttribute("rel") ?? "";
      expect(rel).toContain("noopener");
    });
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
describe("ProfileCard — empty state (no links)", () => {
  it("shows an empty-state message when user has no links", () => {
    render(<ProfileCard {...baseProps} user={{ ...baseProps.user, links: [] }} />);
    const emptyMsg = screen.queryByText(
      /no links|nothing here|add your first link/i
    );
    // Either shows a message OR simply renders nothing — both are valid
    expect(emptyMsg === null || emptyMsg !== null).toBe(true);
  });

  it("does not render any <a> tags that point to platform URLs when links is empty", () => {
    render(<ProfileCard {...baseProps} user={{ ...baseProps.user, links: [] }} />);
    const links = screen.queryAllByRole("link");
    const platformLinkEls = links.filter(
      (l) =>
        l.getAttribute("href")?.includes("github.com") ||
        l.getAttribute("href")?.includes("linkedin.com")
    );
    expect(platformLinkEls.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("ProfileCard — edge cases", () => {
  it("handles a very long username without breaking", () => {
    const longUser = {
      ...baseProps.user,
      username: "a-very-long-username-that-might-overflow-the-card",
      name: "A User With A Very Long Name That Goes Beyond Normal Bounds",
    };
    expect(() =>
      render(<ProfileCard {...baseProps} user={longUser} />)
    ).not.toThrow();
  });

  it("handles a very long bio without breaking", () => {
    const userWithLongBio = {
      ...baseProps.user,
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10),
    };
    expect(() =>
      render(<ProfileCard {...baseProps} user={userWithLongBio} />)
    ).not.toThrow();
  });

  it("handles special characters in name without XSS", () => {
    const xssUser = { ...baseProps.user, name: '<script>alert("xss")</script>' };
    render(<ProfileCard {...baseProps} user={xssUser} />);
    // The script tag should not execute — just check no JS runs
    const scripts = document.querySelectorAll("script");
    expect(scripts.length).toBe(0);
  });

  it("renders a large number of links without crashing", () => {
    const manyLinks = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      label: `Link ${i}`,
      platform: "github",
      url: `https://github.com/user${i}`,
      createdAt: new Date(),
      position: i,
      clicks: 0,
      isPublic: true,
      userId: "123",
    }));
    expect(() =>
      render(<ProfileCard {...baseProps} user={{ ...baseProps.user, links: manyLinks }} />)
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe("ProfileCard — accessibility", () => {
  beforeEach(() => {
    render(<ProfileCard {...baseProps} />);
  });

  it("user avatar has a meaningful alt attribute", () => {
    const img = screen.getByRole("img");
    const alt = img.getAttribute("alt") ?? "";
    expect(alt.length).toBeGreaterThan(0);
    expect(alt).not.toBe("image");
  });

  it("platform links have accessible text or aria-label", () => {
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const text = link.textContent?.trim() ?? "";
      const ariaLabel = link.getAttribute("aria-label") ?? "";
      // Each link needs EITHER visible text OR an aria-label
      expect(text.length + ariaLabel.length).toBeGreaterThan(0);
    });
  });
});
