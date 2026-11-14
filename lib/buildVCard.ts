export interface VCardLink {
  title: string;
  url: string;
  platform?: string | null;
}

export interface VCardUser {
  name?: string | null;
  username: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  links?: VCardLink[];
}

function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildVCard(user: VCardUser): string {
  const fullName = user.name?.trim() || user.username;
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://linkid.in"
  ).replace(/\/$/, "");
  const profileUrl = `${baseUrl}/${user.username}`;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardText(fullName)}`,
    `N:;${escapeVCardText(fullName)};;;`,
    `URL;TYPE=PROFILE:${escapeVCardText(profileUrl)}`,
  ];

  if (user.headline) {
    lines.push(`TITLE:${escapeVCardText(user.headline)}`);
  }

  if (user.website) {
    lines.push(`URL;TYPE=WORK:${escapeVCardText(user.website)}`);
  }

  if (user.location) {
    lines.push(`ADR;TYPE=HOME:;;${escapeVCardText(user.location)};;;;`);
  }

  if (user.bio) {
    lines.push(`NOTE:${escapeVCardText(user.bio)}`);
  }

  if (user.links && user.links.length > 0) {
    for (const link of user.links) {
      if (!link.url) continue;
      const label = link.platform || link.title;
      if (label) {
        lines.push(`URL;TYPE=${escapeVCardText(label.toUpperCase())}:${escapeVCardText(link.url)}`);
      } else {
        lines.push(`URL:${escapeVCardText(link.url)}`);
      }
    }
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}