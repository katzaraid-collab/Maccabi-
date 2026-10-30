import Image from "next/image";
import Link from "next/link";
import s from "./not-found.module.css";

const WAYS = [
  { href: "/shop/kits", label: "תלבושות משחק" },
  { href: "/shop/new", label: "עונת 26/27" },
  { href: "/shop/training", label: "אימון וייצוג" },
  { href: "/shop/sale", label: "SALE" },
];

export default function NotFound() {
  return (
    <section className={`${s.page} on-dark`} aria-labelledby="nf-title">
      <Image src="/media/match-night-away.webp" alt="" fill priority sizes="100vw" className={s.photo} />
      <div className={s.grade} aria-hidden="true" />

      <div className={`wrap ${s.inner}`}>
        <p className={`tag ${s.code}`}>ERROR 404 · OUT OF PLAY</p>
        <p className={`latin ${s.num}`} aria-hidden="true">
          404
        </p>
        <h1 id="nf-title" className={`display ${s.title}`}>
          הכדור
          <br />
          בחוץ.
        </h1>
        <p className={s.lead}>העמוד הזה לא קיים, או שעבר מקום. המשחק ממשיך כאן:</p>

        <div className={s.row}>
          <Link href="/" className="btn">
            חזרה למגרש <span className="arrow">←</span>
          </Link>
          <ul className={s.ways}>
            {WAYS.map((w, i) => (
              <li key={w.href}>
                <Link href={w.href}>
                  <span className={`idx ${s.idx}`}>{String(i + 1).padStart(2, "0")}</span>
                  {w.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
