import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

type FakeLink = {
  id: string;
  platform: string;
  alias: string | null;
  label: string;
  url: string;
  position: number;
  clicks: number;
  isPublic: boolean;
  isGroup: boolean;
  parentId: string | null;
  pinCode: string | null;
  isSocialIcon: boolean;
  startDate: Date | null;
  endDate: Date | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
};

let workspace: Record<string, unknown> | null = null;

const fakePrisma = {
  workspace: {
    findUnique: async ({ where }: { where: { username?: string } }) =>
      where.username === "alice" ? workspace : null,
  },
  workspaceAlias: {
    findUnique: async () => null,
  },
};

mock.module("@/lib/prisma", {
  defaultExport: fakePrisma,
  namedExports: { prisma: fakePrisma },
});

mock.module("@/lib/profileCache", {
  namedExports: {
    readCachedResolvedProfile: async () => ({ userId: null, payload: null }),
    cacheResolvedProfile: async () => undefined,
    getProfileGeneration: async () => null,
  },
});

function makeLink(overrides: Partial<FakeLink> & Pick<FakeLink, "id" | "label" | "url">): FakeLink {
  return {
    platform: "website",
    alias: null,
    position: 0,
    clicks: 0,
    isPublic: true,
    isGroup: false,
    parentId: null,
    pinCode: null,
    isSocialIcon: false,
    startDate: null,
    endDate: null,
    workspaceId: "ws-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeWorkspace(links: FakeLink[]) {
  return {
    id: "ws-1",
    name: "Alice",
    username: "alice",
    bio: null,
    seoTitle: null,
    seoDescription: null,
    backgroundImage: null,
    isVerified: false,
    customDomain: null,
    themeType: "solid",
    themeColor: "slate",
    themeCustom: null,
    theme: "default",
    enableEmailCapture: false,
    layoutStyle: "LIST",
    resumeUrl: null,
    resumeDownloadCount: 0,
    webhookUrl: null,
    webhookSecret: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    members: [
      {
        role: "OWNER",
        user: { image: null, email: "alice@example.com" },
      },
    ],
    links,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolveUserByUsername: (username: string) => Promise<any>;

before(async () => {
  const mod = await import("@/lib/userLookup");
  resolveUserByUsername = mod.resolveUserByUsername;
});

test("masks the destination of a PIN-protected link", async () => {
  workspace = makeWorkspace([
    makeLink({
      id: "locked",
      label: "Private",
      url: "https://example.com/private-document",
      pinCode: "1234",
    }),
    makeLink({
      id: "public",
      label: "Public",
      url: "https://example.com/public-page",
    }),
  ]);

  const resolved = await resolveUserByUsername("alice");
  assert.ok(resolved);

  const locked = resolved.user.links.find((link: FakeLink) => link.id === "locked");
  const publicLink = resolved.user.links.find((link: FakeLink) => link.id === "public");

  assert.equal(locked.pinCode, "locked");
  assert.equal(locked.url, "");
  assert.equal(publicLink.pinCode, null);
  assert.equal(publicLink.url, "https://example.com/public-page");
});

test("masks PIN-protected links nested inside a group", async () => {
  workspace = makeWorkspace([
    makeLink({
      id: "group",
      label: "Group",
      url: "",
      isGroup: true,
      platform: "system_group",
    }),
    makeLink({
      id: "child-locked",
      label: "Child",
      url: "https://example.com/child-private",
      pinCode: "5678",
      parentId: "group",
    }),
  ]);

  const resolved = await resolveUserByUsername("alice");
  assert.ok(resolved);

  const group = resolved.user.links.find((link: FakeLink) => link.id === "group");
  assert.equal(group.children.length, 1);
  assert.equal(group.children[0].pinCode, "locked");
  assert.equal(group.children[0].url, "");
});

test("serialized public payload contains no locked destination", async () => {
  workspace = makeWorkspace([
    makeLink({
      id: "locked",
      label: "Private",
      url: "https://example.com/private-document",
      pinCode: "1234",
    }),
  ]);

  const resolved = await resolveUserByUsername("alice");
  assert.ok(resolved);

  const serialized = JSON.stringify(resolved);
  assert.equal(serialized.includes("private-document"), false);
  assert.equal(serialized.includes("1234"), false);
  assert.equal(serialized.includes('"locked"'), true);
});
