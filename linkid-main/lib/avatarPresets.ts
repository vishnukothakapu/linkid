export const AVATAR_PRESETS = [
  { id: "sun", name: "Sun", src: "/avatars/sun.svg" },
  { id: "ocean", name: "Ocean", src: "/avatars/ocean.svg" },
  { id: "leaf", name: "Leaf", src: "/avatars/leaf.svg" },
  { id: "berry", name: "Berry", src: "/avatars/berry.svg" },
  { id: "fox", name: "Fox", src: "/avatars/fox.svg" },
  { id: "bear", name: "Bear", src: "/avatars/bear.svg" },
  { id: "star", name: "Star", src: "/avatars/star.svg" },
  { id: "moon", name: "Moon", src: "/avatars/moon.svg" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

export function getAvatarPreset(id: unknown) {
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? null;
}