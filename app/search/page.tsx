import type { Metadata } from "next";
import { Browser } from "@/components/shop/Browser";
import { byShelfOrder, getCatalog } from "@/lib/catalog";
import s from "../shop/[slug]/page.module.css";

export const metadata: Metadata = { title: "חיפוש", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const results = words.length
    ? byShelfOrder(
        (await getCatalog()).filter((p) => {
          const hay = `${p.title} ${p.tags.join(" ")}`.toLowerCase();
          return words.every((w) => hay.includes(w.toLowerCase()));
        }),
      )
    : [];

  return (
    <>
      <header className={s.hero}>
        <div className="wrap">
          <p className="eyebrow">תוצאות חיפוש</p>
          <h1 className="display">{q ? `“${q}”` : "חיפוש"}</h1>
        </div>
      </header>
      <div className={`wrap ${s.body}`}>
        <Browser key={q} products={results} />
      </div>
    </>
  );
}
