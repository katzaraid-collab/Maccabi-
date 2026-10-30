import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Browser } from "@/components/shop/Browser";
import { DEPARTMENTS, getDepartment, productsIn } from "@/lib/catalog";
import s from "./page.module.css";

export const revalidate = 900;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dept = getDepartment((await params).slug);
  return dept ? { title: dept.title, description: `${dept.title} – ${dept.kicker}. החנות הרשמית של מכבי תל אביב.` } : {};
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const dept = getDepartment(slug);
  if (!dept) notFound();
  const products = await productsIn(slug);

  return (
    <>
      <header className={s.hero} data-tone={slug}>
        <div className="wrap">
          <p className="eyebrow">{dept.kicker}</p>
          <h1 className="display">{dept.title}</h1>
        </div>
        <nav className={`wrap ${s.depts}`} aria-label="מחלקות">
          {DEPARTMENTS.map((d) => (
            <Link key={d.slug} href={`/shop/${d.slug}`} aria-current={d.slug === slug ? "page" : undefined}>
              {d.title}
            </Link>
          ))}
        </nav>
      </header>
      <div className={`wrap ${s.body}`}>
        <Browser key={slug} products={products} />
      </div>
    </>
  );
}
