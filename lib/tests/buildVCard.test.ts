import assert from "node:assert/strict";
import test from "node:test";

import { buildVCard } from "@/lib/buildVCard";

const mockUser = {
  username: "testuser",
  name: "Test User",
  email: "test@example.com",
  bio: "Software Developer",
  image: "https://example.com/avatar.png",
} as any;

const mockLinks = [
  {
    platform: "github",
    url: "https://github.com/testuser",
  },
] as any;

test("buildVCard generates valid vCard structure", () => {
  const card = buildVCard({
    user: mockUser,
    links: mockLinks,
  });

  assert.match(card, /BEGIN:VCARD/);
  assert.match(card, /VERSION:3\.0/);
  assert.match(card, /FN:Test User/);
  assert.match(card, /END:VCARD/);
});

test("buildVCard includes optional fields when provided", () => {
  const card = buildVCard({
    user: mockUser,
    links: mockLinks,
  });

  assert.match(card, /EMAIL;TYPE=INTERNET:test@example\.com/);
  assert.match(card, /NOTE:Software Developer/);
  assert.match(card, /PHOTO;VALUE=URI:https:\/\/example\.com\/avatar\.png/);
  assert.match(card, /URL;TYPE=GITHUB:https:\/\/github\.com\/testuser/);
});

test("buildVCard omits optional fields when missing", () => {
  const card = buildVCard({
    user: {
      username: "testuser",
      name: "Test User",
    } as any,
    links: [],
  });

  assert.ok(!card.includes("EMAIL;TYPE=INTERNET"));
  assert.ok(!card.includes("NOTE:"));
  assert.ok(!card.includes("PHOTO;VALUE=URI"));
});

test("buildVCard handles special characters safely", () => {
  const card = buildVCard({
    user: {
      username: "testuser",
      name: "John;Doe, Jr",
      bio: "Developer; Engineer, Builder",
      email: "john@example.com",
    } as any,
    links: [],
  });

  assert.ok(card.includes("John"));
  assert.ok(card.includes("Developer"));
});

test("buildVCard includes multiple social links", () => {
  const card = buildVCard({
    user: mockUser,
    links: [
      {
        platform: "github",
        url: "https://github.com/testuser",
      },
      {
        platform: "linkedin",
        url: "https://linkedin.com/in/testuser",
      },
    ] as any,
  });

  assert.match(
    card,
    /URL;TYPE=GITHUB:https:\/\/github\.com\/testuser/,
  );

  assert.match(
    card,
    /URL;TYPE=LINKEDIN:https:\/\/linkedin\.com\/in\/testuser/,
  );
});

test("buildVCard handles empty optional values", () => {
  const card = buildVCard({
    user: {
      username: "testuser",
      name: "Test User",
      email: "",
      bio: "",
      image: "",
    } as any,
    links: [],
  });

  assert.ok(!card.includes("EMAIL;TYPE=INTERNET:"));
  assert.ok(!card.includes("NOTE:"));
  assert.ok(!card.includes("PHOTO;VALUE=URI:"));
});