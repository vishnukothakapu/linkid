export type CompletenessInput = {
  image: string | null;
  bio: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  resumeUrl: string | null;
  isVerified: boolean;
  publicLinkCount: number;
};

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  weight: number;
};

export type ProfileCompleteness = {
  score: number;
  completedCount: number;
  totalCount: number;
  items: ChecklistItem[];
};

const isFilled = (value: string | null): boolean =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Score a public profile 0-100 against a weighted checklist and return the
 * per-item breakdown. Pure and deterministic — the dashboard renders `score`
 * as a progress bar and lists the undone `items` as next steps.
 */
export function computeProfileCompleteness(
  input: CompletenessInput
): ProfileCompleteness {
  const items: ChecklistItem[] = [
    { key: "avatar", label: "Add a profile photo", done: isFilled(input.image), weight: 15 },
    { key: "bio", label: "Write a bio", done: isFilled(input.bio), weight: 15 },
    {
      key: "firstLink",
      label: "Add your first public link",
      done: input.publicLinkCount >= 1,
      weight: 20,
    },
    {
      key: "threeLinks",
      label: "Add at least three public links",
      done: input.publicLinkCount >= 3,
      weight: 15,
    },
    { key: "seoTitle", label: "Set an SEO title", done: isFilled(input.seoTitle), weight: 10 },
    {
      key: "seoDescription",
      label: "Set an SEO description",
      done: isFilled(input.seoDescription),
      weight: 10,
    },
    { key: "resume", label: "Link a resume", done: isFilled(input.resumeUrl), weight: 5 },
    { key: "verified", label: "Verify your account", done: input.isVerified === true, weight: 10 },
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const doneWeight = items.reduce(
    (sum, item) => (item.done ? sum + item.weight : sum),
    0
  );

  return {
    score: totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100),
    completedCount: items.filter((item) => item.done).length,
    totalCount: items.length,
    items,
  };
}
