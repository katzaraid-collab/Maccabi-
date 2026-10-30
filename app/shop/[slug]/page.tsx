import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Browser, BrowserSkeleton } from "@/components/shop/Browser";
import { DEPARTMENTS, getDepartment, productsIn } from "@/lib/catalog";
import { price } from "@/lib/config";
import { canonical } from "@/lib/seo";
import { DEPT_LATIN, DEPT_PHOTO, toItem, typeOf } from "@/components/shop/taxonomy";
import type { Product } from "@/lib/types";
import s from "./page.module.css";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dept = getDepartment(slug);
  return dept
    ? { title: dept.title, description: `${dept.title} – ${dept.kicker}. החנות הרשמית של מכבי תל אביב.`, alternates: canonical(`/shop/${slug}`) }
    : {};
}

// Hero strip: in-stock products with images, one per product type/kit first so
// the strip reads as a range, not six near-identical shirts.
function strip(list: Product[], n: number) {
  const pool = list.filter((p) => p.available && p.images.length);
  // Shirts lead: they photograph best and say "this department" fastest.
  pool.sort((a, b) => Number(typeOf(b) === "shirts") - Number(typeOf(a) === "shirts"));
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of pool) {
    const key = p.kit ?? typeOf(p) ?? p.handle;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
    if (out.length === n) return out;
  }
  for (const p of pool) if (out.length < n && !out.includes(p)) out.push(p);
  return out;
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { slug } = await params;
  // Reading the query renders per request, so a shared filtered link
  // (?type=…&size=…) arrives already filtered.
  await searchParams;
  const dept = getDepartment(slug);
  if (!dept) notFound();
  const products = await productsIn(slug);
  const items = products.map(toItem);
  const photo = DEPT_PHOTO[slug];
  const index = DEPARTMENTS.findIndex((d) => d.slug === slug) + 1;
  const picks = strip(products, 6);

  return (
    <>
      <header className={s.hero} data-tone={slug}>
        <div className={s.poster}>
          <div className={s.type}>
            <p className={s.tech}>
              <span className="latin">N°{String(index).padStart(2, "0")}</span>
              <span aria-hidden="true">/</span>
              <span className="latin">{DEPT_LATIN[slug]}</span>
              <span className={s.rule} aria-hidden="true" />
              <span>
                <span className="latin">{products.length}</span> פריטים
              </span>
            </p>
            <h1 className={s.title}>
              <span>{dept.title}</span>
            </h1>
            <p className={s.kicker}>{dept.kicker}</p>
          </div>
          {photo && (
            <figure className={s.photo}>
              <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 900px) 100vw, 60vw" style={{ objectPosition: photo.pos }} />
              <span className={`latin ${s.stamp}`} aria-hidden="true">
                {DEPT_LATIN[slug]}
              </span>
            </figure>
          )}
        </div>

        {picks.length > 2 && (
          <ol className={s.strip} aria-label={`נבחרים מ${dept.title}`}>
            {picks.map((p, i) => (
              <li key={p.id} style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/product/${p.handle}`}>
                  <span className={`latin ${s.no}`} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={s.shot}>
                    <Image src={p.images[0].src} alt="" fill sizes="(max-width: 900px) 42vw, 17vw" />
                  </span>
                  <span className={s.pickTitle}>{p.title}</span>
                  <span className={s.pickPrice}>{price(p.price)}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <nav className={s.depts} aria-label="מחלקות">
          <div className="wrap">
            {DEPARTMENTS.map((d, i) => (
              <Link key={d.slug} href={`/shop/${d.slug}`} aria-current={d.slug === slug ? "page" : undefined}>
                <span className="latin">{String(i + 1).padStart(2, "0")}</span>
                {d.title}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <div className={`wrap ${s.body}`}>
        <Suspense fallback={<BrowserSkeleton />}>
          <Browser key={slug} items={items} />
        </Suspense>
      </div>
    </>
  );
}
