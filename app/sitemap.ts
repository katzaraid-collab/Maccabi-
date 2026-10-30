import type { MetadataRoute } from "next";
import { DEPARTMENTS, getCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  // The feed has no updated_at in the snapshot, so the newest product date stands in for listing pages.
  const newest = catalog.reduce((max, p) => (p.createdAt > max ? p.createdAt : max), "1970-01-01");

  return [
    { url: absoluteUrl("/"), lastModified: newest, changeFrequency: "daily", priority: 1 },
    ...DEPARTMENTS.map((d) => ({
      url: absoluteUrl(`/shop/${d.slug}`),
      lastModified: newest,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...catalog.map((p) => ({
      url: absoluteUrl(`/product/${p.handle}`),
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: p.available ? 0.6 : 0.3,
      images: p.images.slice(0, 1).map((i) => i.src),
    })),
    { url: absoluteUrl("/accessibility"), changeFrequency: "yearly", priority: 0.1 },
  ];
}
