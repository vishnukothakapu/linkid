// lib/url.ts

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://linkid.qzz.io";

/** Public profile URL  →  linkid.qzz.io/username */
export function profileUrl(username: string): string {
  return `${BASE_URL}/${username}`;
}

/** Share-variant URL  →  linkid.qzz.io/username/share/recruiter */
export function shareVariantUrl(username: string, slug: string): string {
  return `${BASE_URL}/${username}/share/${slug}`;
}

/** Platform redirect URL  →  linkid.qzz.io/username/github */
export function platformUrl(username: string, platform: string): string {
  return `${BASE_URL}/${username}/${platform}`;
}

/** Validate a slug: lowercase letters, numbers, hyphens, 2–40 chars */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,40}$/.test(slug);
}

/** Normalise a raw string into a URL-safe slug */
export function toSlug(raw: string): string {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  
  // Ensure slug meets minimum length requirement
  return slug.length < 2 ? "" : slug;
}

export function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value.startsWith("http") ? value : `https://${value}`);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
