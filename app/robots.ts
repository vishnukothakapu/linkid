import type { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://linkid.qzz.io").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/api",
        "/api/",
        "/login",
        "/register",
        "/profile",
        "/account-deleted",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
