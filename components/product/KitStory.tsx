import Image from "next/image";
import type { Kit } from "@/lib/types";
import { KIT_EN } from "./labels";
import s from "./KitStory.module.css";

type Shot = { src: string; alt: string; shape: "wide" | "tall"; pos?: string };

// Official club photography (public/media, see CREDITS.md), mapped by kit.
const PITCH: Partial<Record<Kit, Shot>> = {
  home: { src: "/media/match-home-1.webp", alt: "שחקן מכבי בתלבושת הבית הצהובה עם הכדור במשחק לילה", shape: "wide", pos: "50% 40%" },
  away: { src: "/media/match-night-away.webp", alt: "שחקני מכבי בתלבושת החוץ הכחולה בדו־קרב אווירי במשחק לילה", shape: "wide", pos: "60% 30%" },
  third: { src: "/media/fullbody-third.webp", alt: "שחקן בתלבושת השלישית, לבנה עם פסי זהב", shape: "tall", pos: "50% 20%" },
  fourth: { src: "/media/fullbody-fourth.webp", alt: "שחקן בתלבושת הרביעית האפורה", shape: "tall", pos: "50% 20%" },
};
const SECOND: Partial<Record<Kit, Shot>> = {
  home: { src: "/media/match-home-2.webp", alt: "שחקן מכבי בצהוב מוביל כדור", shape: "wide", pos: "45% 45%" },
  away: { src: "/media/player-away.webp", alt: "שחקן מכבי בחולצת החוץ", shape: "tall", pos: "50% 30%" },
};

const DETAILS = [
  { src: "/media/macro-crest-1.webp", label: "הסמל", alt: "תקריב של סמל המועדון הרקום והכוכבים" },
  { src: "/media/macro-fabric-1.webp", label: "האריג", alt: "תקריב של מרקם הבד" },
  { src: "/media/macro-crest-2.webp", label: "הזר", alt: "תקריב של זר הדפנה סביב הסמל" },
  { src: "/media/macro-fabric-2.webp", label: "הדוגמה", alt: "תקריב של דוגמת הבד" },
];

export function KitStory({ kit }: { kit: Kit }) {
  const shot = PITCH[kit];
  if (!shot) return null;
  const second = SECOND[kit];
  const word = KIT_EN[kit];

  return (
    <section className={s.story} data-shape={shot.shape} aria-labelledby="story-title">
      <figure className={s.hero}>
        <Image src={shot.src} alt={shot.alt} fill sizes={shot.shape === "wide" ? "100vw" : "(max-width: 900px) 100vw, 45vw"} style={{ objectPosition: shot.pos }} className={s.img} />
        <figcaption className={s.cap}>
          <span>N°01 · ON THE PITCH</span>
          <span>© MACCABI TEL AVIV FC</span>
        </figcaption>
      </figure>

      <div className={s.copy}>
        <p className={s.word} aria-hidden="true">
          {word}
        </p>
        <h2 id="story-title" className={s.title}>
          ככה היא נראית
          <br />
          על הדשא.
        </h2>
        {second && (
          <div className={s.second} data-shape={second.shape}>
            <Image src={second.src} alt={second.alt} fill sizes="(max-width: 900px) 100vw, 30vw" style={{ objectPosition: second.pos }} />
          </div>
        )}
      </div>

      <div className={s.details}>
        <p className={s.detailsHead}>
          <span>DETAILS</span>
          {kit !== "home" && <span>תקריבים מחולצת הבית</span>}
        </p>
        <ul className={s.tiles}>
          {DETAILS.map((d, i) => (
            <li key={d.src}>
              <div className={s.tile}>
                <Image src={d.src} alt={d.alt} fill sizes="(max-width: 700px) 50vw, 355px" />
              </div>
              <span className={s.tileCap}>
                <b>{String(i + 1).padStart(2, "0")}</b> {d.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
