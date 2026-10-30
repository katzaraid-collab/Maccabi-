import Image from "next/image";
import { Bento, type Tile } from "@/components/home/Bento";
import { Marquee } from "@/components/home/Marquee";
import { PrintTeaser } from "@/components/home/PrintTeaser";
import { Rail } from "@/components/home/Rail";
import { ScrollFilm, type FilmKit } from "@/components/home/ScrollFilm";
import { Story120 } from "@/components/home/Story120";
import { DEPARTMENTS, byShelfOrder, currentKits, getCatalog } from "@/lib/catalog";
import type { Kit } from "@/lib/types";
import s from "./page.module.css";

export const revalidate = 900;

export default async function Home() {
  const [catalog, kits] = await Promise.all([getCatalog(), currentKits()]);

  // Transparent cut-outs made once by scripts/cutout-kits.py.
  const filmKits: FilmKit[] = kits.map((p) => ({
    kit: p.kit!,
    handle: p.handle,
    title: p.title,
    price: p.price,
    cutout: `/kits/${p.kit}.webp`,
  }));

  const printLinks = Object.fromEntries(kits.map((p) => [p.kit, p.handle])) as Partial<Record<Kit, string>>;

  const inDept = (slug: string) => byShelfOrder(catalog.filter(DEPARTMENTS.find((d) => d.slug === slug)!.match));
  const newSeason = inDept("new").filter((p) => p.available && p.images.length);
  const sale = inDept("sale").filter((p) => p.available && p.compareAt && p.images.length);
  const anniversary = catalog.filter((p) => p.tags.includes("120") && p.images.length);

  const tileOrder = ["kits", "training", "fashion", "kids", "accessories", "sale"];
  const tiles: Tile[] = tileOrder.map((slug) => {
    const d = DEPARTMENTS.find((x) => x.slug === slug)!;
    const items = inDept(slug);
    const cover = slug === "kits" ? kits[0] : items.find((p) => p.available && p.images.length);
    return { slug, title: d.title, kicker: d.kicker, count: items.length, image: cover?.images[0]?.src };
  });

  return (
    <>
      <ScrollFilm kits={filmKits} />
      <div id="drop" tabIndex={-1} />
      <Marquee items={["עונת 26/27", "PUMA × מכבי תל אביב", "120 שנה", "הדפסה אישית", "מאז 1906"]} />
      <Rail eyebrow="חדש בחנות" title="הקולקציה של 26/27" href="/shop/new" products={newSeason.slice(0, 14)} />
      <PrintTeaser links={printLinks} />
      <Story120 products={anniversary} />
      <Bento tiles={tiles} />
      {sale.length > 0 && <Rail eyebrow="SALE" title="מחירי יציע" href="/shop/sale" products={sale.slice(0, 14)} />}
      <section className={s.forever} aria-labelledby="forever-title">
        <div className={s.band}>
          <Image src="/media/stadium-tifo.webp" alt="טיפו ענק של אוהדי מכבי ביציע" fill sizes="100vw" className={s.bandImg} />
        </div>
        <div className="wrap">
          <h2 id="forever-title" className={s.foreverTitle}>
            <span className="latin" aria-hidden="true">
              FOREVER
            </span>
            <span className="sr-only">FOREVER, מועדון האוהדים</span>
          </h2>
          <div className={s.foreverGrid} data-reveal>
            <p className={`tag ${s.foreverTag}`}>FAN CLUB · SINCE 1906</p>
            <div>
              <p className="tag-he">מועדון האוהדים</p>
              <p className={s.foreverText}>עדיפות בכרטיסים, הטבות במנוי ומתנת הצטרפות. כי אוהדים לא מחליפים.</p>
            </div>
            <a className={s.foreverLink} href="https://www.maccabi-tlv.co.il/">
              לפרטים באתר המועדון <span aria-hidden="true">←</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
