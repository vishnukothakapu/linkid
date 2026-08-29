import assert from "node:assert/strict";
import test from "node:test";

import {
  computeProfileCompleteness,
  type CompletenessInput,
} from "@/lib/profileCompleteness";

const base: CompletenessInput = {
  image: null,
  bio: null,
  seoTitle: null,
  seoDescription: null,
  resumeUrl: null,
  isVerified: false,
  publicLinkCount: 0,
};

test("empty profile scores zero", () => {
  const result = computeProfileCompleteness(base);
  assert.equal(result.score, 0);
  assert.equal(result.completedCount, 0);
  assert.equal(result.items.length, 8);
  assert.equal(result.totalCount, 8);
});

test("fully complete profile scores 100", () => {
  const result = computeProfileCompleteness({
    image: "https://example.com/a.png",
    bio: "Hello there",
    seoTitle: "My page",
    seoDescription: "About my page",
    resumeUrl: "https://example.com/cv.pdf",
    isVerified: true,
    publicLinkCount: 5,
  });
  assert.equal(result.score, 100);
  assert.equal(result.completedCount, 8);
});

test("whitespace-only text fields are not counted as done", () => {
  const result = computeProfileCompleteness({
    ...base,
    bio: "   ",
    seoTitle: "  ",
  });
  const bio = result.items.find((i) => i.key === "bio");
  const seo = result.items.find((i) => i.key === "seoTitle");
  assert.equal(bio?.done, false);
  assert.equal(seo?.done, false);
});

test("public link thresholds are boundary-correct", () => {
  const one = computeProfileCompleteness({ ...base, publicLinkCount: 1 });
  assert.equal(one.items.find((i) => i.key === "firstLink")?.done, true);
  assert.equal(one.items.find((i) => i.key === "threeLinks")?.done, false);

  const three = computeProfileCompleteness({ ...base, publicLinkCount: 3 });
  assert.equal(three.items.find((i) => i.key === "threeLinks")?.done, true);
});

test("partial profile scores the sum of completed weights", () => {
  const result = computeProfileCompleteness({
    ...base,
    image: "https://example.com/a.png",
    bio: "Hello",
    publicLinkCount: 1,
  });
  // avatar (15) + bio (15) + firstLink (20) = 50
  assert.equal(result.score, 50);
  assert.equal(result.items.find((i) => i.key === "avatar")?.done, true);
  assert.equal(result.items.find((i) => i.key === "verified")?.done, false);
});

test("score is always an integer in [0, 100]", () => {
  for (const count of [0, 1, 2, 3, 4]) {
    const { score } = computeProfileCompleteness({
      ...base,
      publicLinkCount: count,
    });
    assert.ok(Number.isInteger(score));
    assert.ok(score >= 0 && score <= 100);
  }
});
