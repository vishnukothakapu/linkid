import type { User as PrismaUser, Link as PrismaLink } from "@prisma/client";

export function buildVCard({
  user,
  links,
}: {
  user: PrismaUser;
  links: PrismaLink[];
}): string {
  const CRLF = "\r\n";

  const escapeText = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\n|\r/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const sanitizeUri = (value: string) => value.replace(/[\r\n]/g, "").trim();

  let vcard = `BEGIN:VCARD${CRLF}`;
  vcard += `VERSION:3.0${CRLF}`;
  vcard += `FN:${escapeText(user.name ?? user.username ?? "")}${CRLF}`;
  vcard += `N:${escapeText(user.name ?? user.username ?? "")};;;;${CRLF}`;

  if (user.email)
    vcard += `EMAIL;TYPE=INTERNET:${escapeText(user.email)}${CRLF}`;
  if (user.bio) vcard += `NOTE:${escapeText(user.bio)}${CRLF}`;
  if (user.image) vcard += `PHOTO;VALUE=URI:${sanitizeUri(user.image)}${CRLF}`;

  for (const link of links) {
    vcard += `URL;TYPE=${escapeText(link.platform.toUpperCase())}:${sanitizeUri(link.url)}${CRLF}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  vcard += `URL:${sanitizeUri(`${baseUrl}/${user.username}`)}${CRLF}`;
  vcard += `END:VCARD${CRLF}`;
  return vcard;
}
