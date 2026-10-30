import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // A concept preview must never be indexed next to the club's real store.
  if (!INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    // Search results and API routes are thin/duplicate content.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
