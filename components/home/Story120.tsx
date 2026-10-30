import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import s from "./Story120.module.css";

export function Story120({ products }: { products: Product[] }) {
  return (
    <section className={s.section} aria-labelledby="s120-title">
      <div className={s.bg} aria-hidden="true">
        <span className="latin">120</span>
      </div>
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy} data-reveal>
          <p className={`eyebrow ${s.eyebrow}`}>
            <span className="latin">1906 — 2026</span>
          </p>
          <h2 id="s120-title" className="display">
            120 שנה
            <br />
            של צהוב.
          </h2>
          <p>קולקציית היובל: משבצות, זהב וסמל החגיגה. מהדורה שתיזכר כמו העונה שבה נולדה.</p>
          <Link href="/shop/fashion" className="btn">
            לקולקציית 120 <span className="arrow">←</span>
          </Link>
        </div>
        <div className={s.stack}>
          {products.slice(0, 3).map((p, i) => (
            <Link key={p.id} href={`/product/${p.handle}`} className={s.card} style={{ "--i": i } as React.CSSProperties} data-reveal>
              {p.images[0] && <Image src={p.images[0].src} alt={p.title} fill sizes="(max-width: 860px) 60vw, 22vw" />}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
