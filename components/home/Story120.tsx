import Image from "next/image";
import Link from "next/link";
import { price } from "@/lib/config";
import type { Product } from "@/lib/types";
import s from "./Story120.module.css";

export function Story120({ products }: { products: Product[] }) {
  const picks = products.slice(0, 3);
  return (
    <section className={`${s.section} on-dark`} aria-labelledby="s120-title">
      <figure className={s.photo} data-reveal="wipe">
        <Image src="/media/trophy-celebration.webp" alt="שחקני מכבי תל אביב מניפים גביע בחגיגה על הדשא" fill sizes="100vw" className={s.img} />
        <figcaption className={`tag ${s.credit}`}>MACCABI TEL AVIV FC</figcaption>
      </figure>

      <div className={`wrap ${s.body}`}>
        <p className={`latin ${s.big}`} aria-hidden="true">
          120
        </p>
        <div className={s.copy}>
          <p className={`tag ${s.years}`} dir="ltr">1906 — 2026 · ANNIVERSARY COLLECTION</p>
          <h2 id="s120-title" className={`display ${s.title}`} data-reveal="mask">
            <span>
              <span>120 שנה.</span>
            </span>
            <span style={{ "--line-i": 1 } as React.CSSProperties}>
              <span className={s.accent}>אותו צהוב.</span>
            </span>
          </h2>
          <p className={s.lead}>קולקציית היובל: משבצות, זהב והסמל של המאה ועשרים. לובשים היסטוריה, לא מסתכלים עליה.</p>
          <Link href="/shop/fashion" className="btn">
            לקולקציית 120 <span className="arrow">←</span>
          </Link>
        </div>

        {picks.length > 0 && (
          <ol className={s.picks}>
            {picks.map((p, i) => (
              <li key={p.id} data-reveal>
                <Link href={`/product/${p.handle}`} className={s.pick}>
                  <span className={s.pickMedia}>
                    {p.images[0] && <Image src={p.images[0].src} alt="" fill sizes="(max-width: 860px) 45vw, 18vw" />}
                  </span>
                  <span className={s.pickMeta}>
                    <span className={`idx ${s.pickIdx}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={s.pickTitle}>{p.title}</span>
                    <span className={s.pickPrice}>{price(p.price)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
