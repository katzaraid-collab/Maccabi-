import { Bento, type Tile } from "@/components/home/Bento";
import { KitHero, type HeroKit } from "@/components/home/KitHero";
import { Marquee } from "@/components/home/Marquee";
import { PrintTeaser } from "@/components/home/PrintTeaser";
import { Rail } from "@/components/home/Rail";
import { Story120 } from "@/components/home/Story120";
import { DEPARTMENTS, byShelfOrder, currentKits, getCatalog } from "@/lib/catalog";
import type { Kit } from "@/lib/types";
import s from "./page.module.css";

export const revalidate = 900;

export default async function Home() {
  const [catalog, kits] = await Promise.all([getCatalog(), currentKits()]);

  const heroKits: HeroKit[] = kits.map((p) => ({
    kit: p.kit!,
    handle: p.handle,
    title: p.title,
    price: p.price,
    image: p.images[0].src,
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
      <KitHero kits={heroKits} />
      <Marquee items={["עונת 26/27", "PUMA × מכבי תל אביב", "120 שנה", "הדפסה אישית", "מאז 1906"]} />
      <div id="drop" />
      <Rail eyebrow="חדש בחנות" title="הקולקציה של 26/27" href="/shop/new" products={newSeason.slice(0, 14)} />
      <PrintTeaser links={printLinks} />
      <Story120 products={anniversary} />
      <Bento tiles={tiles} />
      {sale.length > 0 && <Rail eyebrow="SALE" title="מחירי יציע" href="/shop/sale" products={sale.slice(0, 14)} />}
      <section className={s.forever}>
        <div className="wrap">
          <div className={s.foreverCard} data-reveal>
            <p className="eyebrow">מועדון האוהדים</p>
            <h2 className="display latin">FOREVER</h2>
            <p>עדיפות בכרטיסים, הטבות במנוי ומתנת הצטרפות. כי אוהדים לא מחליפים.</p>
            <a className="btn btn-navy" href="https://www.maccabi-tlv.co.il/">
              לפרטים באתר המועדון <span className="arrow">←</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
