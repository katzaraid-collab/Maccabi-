import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Search results and API routes are thin/duplicate content.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
