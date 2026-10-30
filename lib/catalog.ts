import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { STORE_DOMAIN } from "./config";
import type { Kit, Product } from "./types";

// Type-only reference: the 650 KB snapshot is imported lazily, only when the
// live store can't be reached, so it stays out of the hot path.
type RawProduct = (typeof import("@/data/catalog.snapshot.json"))[number];

/** Cache tag for everything derived from the catalog. `revalidateTag(CATALOG_TAG)` refreshes it on demand. */
export const CATALOG_TAG = "catalog";
const REVALIDATE = 900;

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function kitOf(title: string, tags: string[]): Kit | null {
  if (!tags.includes("תלבושות משחק")) return null;
  if (title.includes("שוער")) return "keeper";
  if (title.includes("רביעית")) return "fourth";
  if (title.includes("שלישית")) return "third";
  if (title.includes("חוץ")) return "away";
  if (title.includes("בית")) return "home";
  return null;
}

function normalize(p: RawProduct): Product {
  const variants = p.variants.map((v) => ({
    id: v.id,
    title: v.title,
    size: v.option1 ?? v.title,
    price: Number(v.price),
    compareAt: v.compare_at_price ? Number(v.compare_at_price) : null,
    available: v.available,
  }));
  const price = Math.min(...variants.map((v) => v.price));
  const cheapest = variants.find((v) => v.price === price);
  const compareAt = cheapest?.compareAt && cheapest.compareAt > price ? cheapest.compareAt : null;
  return {
    id: p.id,
    handle: p.handle,
    title: p.title.replace(/\s+/g, " ").trim(),
    description: stripHtml(p.body_html ?? ""),
    tags: p.tags,
    createdAt: p.created_at,
    // Only the fields the UI reads; the live feed carries much more per image.
    images: p.images.map((i) => ({ src: i.src, width: i.width, height: i.height })),
    variants,
    price,
    compareAt,
    available: variants.some((v) => v.available),
    kit: kitOf(p.title, p.tags),
  };
}

async function fetchPage(page: number): Promise<RawProduct[]> {
  const res = await fetch(`https://${STORE_DOMAIN}/products.json?limit=250&page=${page}`, {
    // Each page is ~0.6–0.8 MB, under the 2 MB data-cache limit, so pages cache individually.
    next: { revalidate: REVALIDATE, tags: [CATALOG_TAG] },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`products.json page ${page}: ${res.status}`);
  return ((await res.json()) as { products: RawProduct[] }).products;
}

async function fetchLive(): Promise<RawProduct[] | null> {
  try {
    // The store holds ~500 products (2 pages). Pages are fetched in pairs so
    // the common case is one round trip instead of three sequential ones.
    const all: RawProduct[] = [];
    for (let page = 1; page < 20; page += 2) {
      const [a, b] = await Promise.all([fetchPage(page), fetchPage(page + 1)]);
      all.push(...a, ...b);
      if (a.length < 250 || b.length < 250) break;
    }
    return all.length ? all : null;
  } catch {
    return null;
  }
}

function normalizeAll(raw: RawProduct[]): Product[] {
  const out: Product[] = [];
  for (const p of raw) {
    try {
      const n = normalize(p);
      if (n.handle && n.variants.length && Number.isFinite(n.price)) out.push(n);
    } catch {
      // A malformed product is skipped, not allowed to fail every page.
    }
  }
  return out;
}

async function loadCatalog(): Promise<Product[]> {
  const live = await fetchLive();
  const products = live ? normalizeAll(live) : [];
  if (products.length) return products;
  if (live) console.error("[catalog] live feed had no usable products; serving the snapshot");
  else console.error("[catalog] live feed unreachable; serving the snapshot");
  const snapshot = (await import("@/data/catalog.snapshot.json")).default as RawProduct[];
  return normalizeAll(snapshot);
}

// Across requests: the normalized catalog (~0.5 MB) sits in the data cache for
// 15 minutes, so a request doesn't re-parse and re-normalize the raw feed.
const cachedCatalog = unstable_cache(loadCatalog, ["catalog:v2"], { revalidate: REVALIDATE, tags: [CATALOG_TAG] });

// Within a request: page, generateMetadata, OG image etc. share one result.
// (The old module-level promise never expired, so a long-running server kept
// serving the catalog from its first request regardless of ISR.)
const requestCatalog = cache(async (): Promise<Product[]> => {
  try {
    return await cachedCatalog();
  } catch {
    // unstable_cache needs a Next request/build scope; scripts fall back here.
    return loadCatalog();
  }
});

const handleIndex = new WeakMap<Product[], Map<string, Product>>();

export function getCatalog(): Promise<Product[]> {
  return requestCatalog();
}

export async function getProduct(handle: string) {
  const decoded = decodeURIComponent(handle);
  const catalog = await getCatalog();
  let index = handleIndex.get(catalog);
  if (!index) {
    index = new Map(catalog.map((p) => [p.handle, p]));
    handleIndex.set(catalog, index);
  }
  return index.get(decoded) ?? null;
}


// Curated departments. The live store has 100+ overlapping collections; these
// map its tags onto the handful of doors a fan actually looks for.
export type Department = {
  slug: string;
  title: string;
  kicker: string;
  match: (p: Product) => boolean;
};

const has = (p: Product, ...tags: string[]) => tags.some((t) => p.tags.includes(t));

export const DEPARTMENTS: Department[] = [
  { slug: "new", title: "עונת 26/27", kicker: "הקולקציה החדשה", match: (p) => has(p, "26/27") || /26[./]27/.test(p.title) },
  { slug: "kits", title: "תלבושות משחק", kicker: "בית · חוץ · שלישית · רביעית · שוער", match: (p) => has(p, "תלבושות משחק", "שוער") },
  { slug: "training", title: "אימון וייצוג", kicker: "מה שהשחקנים לובשים מחוץ למגרש", match: (p) => has(p, "אימון וייצוג", "ייצוג") },
  { slug: "fashion", title: "אופנה ורטרו", kicker: "120 שנה, רטרו וקולקציות מיוחדות", match: (p) => has(p, "אופנה", "רטרו", "120", "קולקציה", "טישירט", "קפוצ׳ון") },
  { slug: "kids", title: "ילדים", kicker: "הדור הבא של היציע", match: (p) => has(p, "ילדים", "לילדים", "ילד", "תינוקות") },
  { slug: "accessories", title: "אביזרים ומתנות", kicker: "צעיפים, כובעים, לבית ולרכב", match: (p) => has(p, "אביזרים ומתנות", "אביזרים", "סלולר", "כובע", "כובעים", "תיקים", "צעיפים", "לבית", "לרכב", "שעונים", "מחזיק מפתחות", "בובות", "משחקים", "כדורים") },
  { slug: "sale", title: "SALE", kicker: "מחירים שלא חוזרים", match: (p) => p.compareAt !== null || has(p, "SALE", "אאוטלט") },
];

export function getDepartment(slug: string) {
  return DEPARTMENTS.find((d) => d.slug === slug) ?? null;
}

export async function productsIn(slug: string) {
  const dept = getDepartment(slug);
  if (!dept) return [];
  return byShelfOrder((await getCatalog()).filter(dept.match));
}

// In stock first, then newest.
export function byShelfOrder(list: Product[]) {
  return [...list].sort(
    (a, b) => Number(b.available) - Number(a.available) || b.createdAt.localeCompare(a.createdAt),
  );
}

export async function currentKits() {
  const catalog = await getCatalog();
  const order: Kit[] = ["home", "away", "third", "fourth"];
  const shirt = (p: Product) => p.title.includes("חולצת") && p.images.length > 0;
  // Strictest first (this season's men's shirt), then looser, so a renamed or
  // sold-out product degrades the hero instead of breaking it.
  const tiers: ((p: Product) => boolean)[] = [
    (p) => shirt(p) && /26[./]27/.test(p.title) && p.title.includes("גבר"),
    (p) => shirt(p) && /26[./]27/.test(p.title),
    (p) => shirt(p),
  ];
  return order
    .map((kit) => {
      for (const test of tiers) {
        const hit = catalog.find((p) => p.kit === kit && test(p));
        if (hit) return hit;
      }
      return undefined;
    })
    .filter((p): p is Product => Boolean(p));
}

export async function related(product: Product, n = 8) {
  const catalog = await getCatalog();
  const shared = (p: Product) => p.tags.filter((t) => product.tags.includes(t)).length;
  return catalog
    .filter((p) => p.id !== product.id && p.available && p.images.length)
    .map((p) => ({ p, score: shared(p) + (p.kit && product.kit === p.kit ? 3 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p);
}
