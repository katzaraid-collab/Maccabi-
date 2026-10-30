import Image from "next/image";
import Link from "next/link";
import s from "./Bento.module.css";

export type Tile = { slug: string; title: string; kicker: string; count: number; image?: string };

// Editorial photography per department; falls back to the tile's packshot.
const PHOTO: Record<string, string> = {
  kits: "/media/match-home-1.webp",
  training: "/media/player-fourth.webp",
  fashion: "/media/lifestyle-editorial.webp",
  kids: "/media/lifestyle-kid.webp",
  sale: "/media/lifestyle-hoodie-blue.webp",
};
const CODE: Record<string, string> = {
  kits: "MATCH KITS",
  training: "TRAINING",
  fashion: "LIFESTYLE",
  kids: "KIDS",
  accessories: "ACCESSORIES",
  sale: "SALE",
};

// The department index: a numbered list with a single photograph frame that
// follows whichever row you hover or focus (pure CSS :has(), no JS).
export function Bento({ tiles }: { tiles: Tile[] }) {
  return (
    <section className={s.section} aria-labelledby="bento-title">
      <div className={`wrap ${s.grid}`}>
        <div className={s.list}>
          <div className={s.head}>
            <p className="tag">INDEX · {String(tiles.length).padStart(2, "0")} DEPARTMENTS</p>
            <h2 id="bento-title" className={`display ${s.title}`}>
              החנות
            </h2>
          </div>
          <ol className={s.rows}>
            {tiles.map((t, i) => {
              const photo = PHOTO[t.slug] ?? t.image;
              return (
                <li key={t.slug} className={s.row} data-slug={t.slug}>
                  <Link href={`/shop/${t.slug}`} className={s.link}>
                    <span className={`idx ${s.idx}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={s.text}>
                      <strong className={`display ${s.name}`}>{t.title}</strong>
                      <span className={s.kicker}>{t.kicker}</span>
                    </span>
                    <span className={s.meta}>
                      <span className="tag">{CODE[t.slug] ?? t.slug.toUpperCase()}</span>
                      <span className={s.count}>
                        <span className="latin">{t.count}</span> מוצרים
                      </span>
                    </span>
                    <span className={s.arrow} aria-hidden="true">
                      ←
                    </span>
                    {photo && (
                      <span className={s.thumb} aria-hidden="true">
                        <Image src={photo} alt="" fill sizes="96px" />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={s.frame} aria-hidden="true">
          {tiles.map((t, i) => {
            const photo = PHOTO[t.slug] ?? t.image;
            const isPackshot = !PHOTO[t.slug];
            return (
              <div key={t.slug} className={s.slide} data-i={i} data-packshot={isPackshot || undefined}>
                {photo && <Image src={photo} alt="" fill sizes="(max-width: 960px) 0px, 40vw" className={s.slideImg} />}
                <span className={`tag ${s.slideTag}`} dir="ltr">
                  {String(i + 1).padStart(2, "0")} / {CODE[t.slug] ?? t.slug.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
