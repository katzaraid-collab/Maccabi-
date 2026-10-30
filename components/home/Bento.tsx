import Image from "next/image";
import Link from "next/link";
import s from "./Bento.module.css";

export type Tile = { slug: string; title: string; kicker: string; count: number; image?: string };

export function Bento({ tiles }: { tiles: Tile[] }) {
  return (
    <section className={s.section} aria-labelledby="bento-title">
      <div className="wrap">
        <div className={s.head} data-reveal>
          <p className="eyebrow">החנות</p>
          <h2 id="bento-title" className="display">
            מאיפה מתחילים?
          </h2>
        </div>
        <div className={s.grid}>
          {tiles.map((t, i) => (
            <Link key={t.slug} href={`/shop/${t.slug}`} className={s.tile} data-reveal style={{ "--d": `${i * 0.05}s` } as React.CSSProperties}>
              {t.image && <Image src={t.image} alt="" fill sizes="(max-width: 800px) 100vw, 40vw" className={s.img} />}
              <div className={s.label}>
                <span className={s.kicker}>{t.kicker}</span>
                <strong>{t.title}</strong>
                <span className={s.count}>{t.count} מוצרים ←</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
