"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";
import s from "./Browser.module.css";

const AUDIENCES = [
  // Tags are inconsistent in the store, so titles are checked too.
  { key: "men", label: "גברים", words: ["גבר"] },
  { key: "women", label: "נשים", words: ["נשים"] },
  { key: "kids", label: "ילדים", words: ["ילד", "תינוק"] },
];

const PRICES = [
  { key: "u100", label: "עד ₪100", test: (n: number) => n <= 100 },
  { key: "100-200", label: "₪100–200", test: (n: number) => n > 100 && n <= 200 },
  { key: "200+", label: "מעל ₪200", test: (n: number) => n > 200 },
];

const SORTS = {
  featured: { label: "מומלץ", fn: () => 0 },
  new: { label: "החדשים ביותר", fn: (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt) },
  low: { label: "מחיר: מהנמוך", fn: (a: Product, b: Product) => a.price - b.price },
  high: { label: "מחיר: מהגבוה", fn: (a: Product, b: Product) => b.price - a.price },
} as const;

const PAGE = 24;

export function Browser({ products }: { products: Product[] }) {
  const [audience, setAudience] = useState<string | null>(null);
  const [band, setBand] = useState<string | null>(null);
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState<keyof typeof SORTS>("featured");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const aud = AUDIENCES.find((a) => a.key === audience);
    const pb = PRICES.find((p) => p.key === band);
    const list = products.filter(
      (p) =>
        (!inStock || p.available) &&
        (!aud || aud.words.some((w) => p.title.includes(w) || p.tags.some((t) => t.includes(w)))) &&
        (!pb || pb.test(p.price)),
    );
    return sort === "featured" ? list : [...list].sort(SORTS[sort].fn);
  }, [products, audience, band, inStock, sort]);

  const reset = () => {
    setAudience(null);
    setBand(null);
    setLimit(PAGE);
  };

  return (
    <div>
      <div className={s.bar}>
        <div className={s.chips} role="group" aria-label="סינון">
          {AUDIENCES.map((a) => (
            <button key={a.key} className={s.chip} aria-pressed={audience === a.key} onClick={() => { setAudience(audience === a.key ? null : a.key); setLimit(PAGE); }}>
              {a.label}
            </button>
          ))}
          <span className={s.sep} aria-hidden="true" />
          {PRICES.map((p) => (
            <button key={p.key} className={s.chip} aria-pressed={band === p.key} onClick={() => { setBand(band === p.key ? null : p.key); setLimit(PAGE); }}>
              {p.label}
            </button>
          ))}
          <span className={s.sep} aria-hidden="true" />
          <button className={s.chip} aria-pressed={inStock} onClick={() => setInStock(!inStock)}>
            במלאי בלבד
          </button>
        </div>
        <label className={s.sort}>
          <span className="sr-only">מיון</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className={s.count} aria-live="polite">
        {filtered.length} מוצרים
      </p>

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <p>אין מוצרים שמתאימים לסינון.</p>
          <button className="btn btn-navy" onClick={reset}>
            ניקוי סינון
          </button>
        </div>
      ) : (
        <div className={s.grid}>
          {filtered.slice(0, limit).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
          ))}
        </div>
      )}

      {filtered.length > limit && (
        <div className={s.more}>
          <button className="btn btn-ghost" onClick={() => setLimit(limit + PAGE)}>
            עוד מוצרים ({filtered.length - limit})
          </button>
        </div>
      )}
    </div>
  );
}
