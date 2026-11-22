import type { MetadataRoute } from "next";
import { getPublishedUsernames } from "@/lib/userLookup";

// Force runtime rendering — the sitemap queries the DB and cannot be prerendered at build time.
export const dynamic = "force-dynamic";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://linkid.qzz.io").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const users = await getPublishedUsernames();

  const profileEntries: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${BASE_URL}/${user.username}`,
    lastModified: user.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...profileEntries,
  ];
}
