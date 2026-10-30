import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Browser, BrowserSkeleton } from "@/components/shop/Browser";
import { DEPT_LATIN, DEPT_PHOTO, SUGGESTED, searchProducts, toItem } from "@/components/shop/taxonomy";
import { DEPARTMENTS, getCatalog } from "@/lib/catalog";
import s from "./page.module.css";

export const metadata: Metadata = { title: "חיפוש", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const results = q ? searchProducts(await getCatalog(), q) : [];
  const items = results.map(toItem);

  return (
    <>
      <header className={s.hero}>
        <div className="wrap">
          <p className={s.tech}>
            <span className="latin">SEARCH</span>
            <span className={s.rule} aria-hidden="true" />
            {q ? (
              <span>
                <span className="latin">{results.length}</span> תוצאות
              </span>
            ) : (
              <span>חיפוש בחנות</span>
            )}
          </p>
          <h1 className={s.title}>{q ? <bdi>“{q}”</bdi> : "מה מחפשים?"}</h1>
          <form className={s.form} action="/search" role="search">
            <label htmlFor="search-page-q" className="sr-only">
              חיפוש מוצרים
            </label>
            <input id="search-page-q" name="q" type="search" defaultValue={q} placeholder="חולצת בית, צעיף, ג׳קט…" autoComplete="off" />
            <button type="submit">חיפוש</button>
          </form>
        </div>
      </header>

      <div className={`wrap ${s.body}`}>
        {items.length > 0 ? (
          <Suspense fallback={<BrowserSkeleton />}>
            <Browser key={q} items={items} />
          </Suspense>
        ) : (
          <section className={s.none} aria-labelledby="none-title">
            {q && (
              <h2 id="none-title" className={s.noneTitle}>
                לא מצאנו כלום.
                <small>בדקו את האיות, נסו מילה אחת, או התחילו מכאן:</small>
              </h2>
            )}
            {!q && (
              <h2 id="none-title" className="sr-only">
                הצעות
              </h2>
            )}
            <ul className={s.chips} aria-label="חיפושים מוצעים">
              {SUGGESTED.map((t) => (
                <li key={t}>
                  <Link href={`/search?q=${encodeURIComponent(t)}`}>{t}</Link>
                </li>
              ))}
            </ul>
            <ul className={s.depts} aria-label="מחלקות">
              {DEPARTMENTS.map((d, i) => {
                const photo = DEPT_PHOTO[d.slug];
                return (
                  <li key={d.slug}>
                    <Link href={`/shop/${d.slug}`}>
                      <span className={s.deptImg}>
                        {photo && <Image src={photo.src} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" style={{ objectPosition: photo.pos }} />}
                      </span>
                      <span className={`latin ${s.deptNo}`}>
                        {String(i + 1).padStart(2, "0")} · {DEPT_LATIN[d.slug]}
                      </span>
                      <span className={s.deptName}>{d.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
