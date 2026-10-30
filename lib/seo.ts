// Shared SEO helpers: absolute URLs and schema.org JSON-LD builders.
import { STORE_DOMAIN } from "./config";

/** Public origin of the storefront (no trailing slash). Override per deploy with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${STORE_DOMAIN}`).replace(/\/$/, "");
export const SITE_NAME = "מכבי תל אביב – החנות הרשמית";
export const ORG_NAME = "מכבי תל אביב FC";

/** Absolute URL for a site path. Handles Hebrew handles by encoding each segment once. */
export function absoluteUrl(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const encoded = clean
    .split("/")
    .map((seg) => {
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join("/");
  return `${SITE_URL}${encoded}`;
}

/** `alternates` for Next metadata: `export const metadata = { alternates: canonical("/shop/kits") }`. */
export function canonical(path: string) {
  return { canonical: absoluteUrl(path) };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: ORG_NAME,
    alternateName: "Maccabi Tel Aviv FC",
    sport: "Soccer",
    url: "https://www.maccabi-tlv.co.il",
    logo: absoluteUrl("/icons/icon-512.png"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "he-IL",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList for a trail like [{ name: "בית", path: "/" }, { name: "תלבושות משחק", path: "/shop/kits" }]. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  };
}

/** Serialize JSON-LD for a <script> tag; escapes "<" so content can't close the tag. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Only the real production deploy opts into indexing (NEXT_PUBLIC_ALLOW_INDEX=1).
export const INDEXABLE = process.env.NEXT_PUBLIC_ALLOW_INDEX === "1";
