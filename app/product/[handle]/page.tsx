import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Rail } from "@/components/home/Rail";
import { Bundle } from "@/components/product/Bundle";
import { KitStory } from "@/components/product/KitStory";
import { ProductView } from "@/components/product/ProductView";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { kitBundle } from "@/lib/bundles";
import { getProduct, related } from "@/lib/catalog";
import { STORE_DOMAIN } from "@/lib/config";
import s from "./page.module.css";

export const revalidate = 900;

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 160) || `${product.title} – החנות הרשמית של מכבי תל אביב`,
    openGraph: { title: product.title },
    alternates: canonical(`/product/${product.handle}`),
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();
  const [more, bundle] = await Promise.all([related(product), kitBundle(product)]);
  // Bundle pieces already have their own module; keep the rail for everything else.
  const inBundle = new Set(bundle.map((b) => b.product.handle));
  const rail = more.filter((p) => !inBundle.has(p.handle));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((i) => i.src),
    description: product.description,
    brand: { "@type": "Brand", name: "Maccabi Tel Aviv FC" },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: String(v.id),
      price: v.price,
      priceCurrency: "ILS",
      availability: v.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://${STORE_DOMAIN}/products/${product.handle}?variant=${v.id}`,
    })),
  };

  return (
    <>
      <div className={s.page}>
        <nav className={s.crumbs} aria-label="פירורי לחם">
          <Link href="/">בית</Link>
          <span aria-hidden="true">/</span>
          <Link href={product.kit ? "/shop/kits" : "/shop/new"}>{product.kit ? "תלבושות משחק" : "החנות"}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.title}</span>
        </nav>
        <Suspense>
          <ProductView product={product} />
        </Suspense>
      </div>
      {product.kit && <KitStory kit={product.kit} />}
      {product.kit && bundle.length > 0 && <Bundle items={bundle} kit={product.kit} current={product.handle} />}
      {rail.length > 0 && <Rail eyebrow="N°03 · MORE" title="עוד מהמדף" href={product.kit ? "/shop/kits" : "/shop/new"} products={rail} />}
      <RecentlyViewed current={{ handle: product.handle, title: product.title, price: product.price, image: product.images[0]?.src ?? null }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
