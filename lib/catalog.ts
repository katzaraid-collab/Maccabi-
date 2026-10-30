import "server-only";
import snapshot from "@/data/catalog.snapshot.json";
import { STORE_DOMAIN } from "./config";
import type { Kit, Product } from "./types";

type RawProduct = (typeof snapshot)[number];

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
    images: p.images,
    variants,
    price,
    compareAt,
    available: variants.some((v) => v.available),
    kit: kitOf(p.title, p.tags),
  };
}

async function fetchLive(): Promise<RawProduct[] | null> {
  try {
    const all: RawProduct[] = [];
    for (let page = 1; page < 20; page++) {
      const res = await fetch(`https://${STORE_DOMAIN}/products.json?limit=250&page=${page}`, {
        next: { revalidate: 900 },
      });
      if (!res.ok) return null;
      const { products } = (await res.json()) as { products: RawProduct[] };
      if (!products.length) break;
      all.push(...products);
    }
    return all.length ? all : null;
  } catch {
    return null;
  }
}

let cache: Promise<Product[]> | null = null;

export function getCatalog(): Promise<Product[]> {
  cache ??= fetchLive().then((live) => (live ?? snapshot).map(normalize));
  return cache;
}

export async function getProduct(handle: string) {
  const decoded = decodeURIComponent(handle);
  return (await getCatalog()).find((p) => p.handle === decoded) ?? null;
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
  return order
    .map((kit) =>
      catalog.find((p) => p.kit === kit && /26[./]27/.test(p.title) && p.title.includes("גבר") && p.title.includes("חולצת")),
    )
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
