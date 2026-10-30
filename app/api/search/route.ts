import { NextResponse, type NextRequest } from "next/server";
import { byShelfOrder, DEPARTMENTS, getCatalog } from "@/lib/catalog";
import { KITS, norm, queryWords, searchProducts, TYPES, typeOf } from "@/components/shop/taxonomy";
import type { Product } from "@/lib/types";

export type SearchHit = {
  handle: string;
  title: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  available: boolean;
};
export type SearchLink = { href: string; label: string; count: number };
export type SearchResponse = { q: string; total: number; products: SearchHit[]; links: SearchLink[] };

const MAX = 8;

const slim = (p: Product): SearchHit => ({
  handle: p.handle,
  title: p.title,
  price: p.price,
  compareAt: p.compareAt,
  image: p.images[0]?.src ?? null,
  available: p.available,
});

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 80).trim();
  const catalog = await getCatalog();

  // Empty query: show what is new and in stock, so the overlay is never blank.
  if (!queryWords(q).length) {
    const fresh = byShelfOrder(catalog.filter((p) => p.available && p.images.length && /26[./]27/.test(p.title)));
    return json({ q, total: 0, products: fresh.slice(0, MAX).map(slim), links: [] });
  }

  const hits = searchProducts(catalog, q);
  const words = queryWords(q);
  const matches = (label: string) => {
    const parts = norm(label).split(" ");
    return words.some((w) => w.length > 1 && parts.some((x) => x.startsWith(w) || (x.length > 2 && w.startsWith(x))));
  };

  const links: SearchLink[] = [];
  for (const d of DEPARTMENTS) {
    if (matches(`${d.title} ${d.kicker}`)) links.push({ href: `/shop/${d.slug}`, label: d.title, count: catalog.filter(d.match).length });
  }
  for (const t of TYPES) {
    if (matches(t.label)) {
      const count = catalog.filter((p) => typeOf(p) === t.key).length;
      if (count) links.push({ href: `/search?q=${encodeURIComponent(t.label.split(" ")[0])}`, label: t.label, count });
    }
  }
  for (const k of KITS) {
    if (matches(`תלבושת ${k.label}`) && k.label.length > 2) {
      const count = catalog.filter((p) => p.kit === k.key).length;
      if (count) links.push({ href: `/shop/kits?kit=${k.key}`, label: `ערכת ${k.label}`, count });
    }
  }

  return json({ q, total: hits.length, products: hits.slice(0, MAX).map(slim), links: links.slice(0, 5) });
}

function json(body: SearchResponse) {
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } });
}
