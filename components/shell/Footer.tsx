import Image from "next/image";
import Link from "next/link";
import { CLUB_SITE } from "@/lib/config";
import { Newsletter } from "./Newsletter";
import s from "./Footer.module.css";

const POLICY = "https://shop.maccabi-tlv.co.il/policies";

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "קניות",
    links: [
      { href: "/shop/new", label: "עונת 26/27" },
      { href: "/shop/kits", label: "תלבושות משחק" },
      { href: "/shop/training", label: "אימון וייצוג" },
      { href: "/shop/fashion", label: "אופנה ורטרו" },
      { href: "/shop/kids", label: "ילדים" },
      { href: "/shop/accessories", label: "אביזרים" },
      { href: "/shop/sale", label: "SALE" },
    ],
  },
  {
    title: "שירות",
    links: [
      { href: `${POLICY}/shipping-policy`, label: "משלוחים", external: true },
      { href: `${POLICY}/refund-policy`, label: "החזרות והחלפות", external: true },
      { href: `${POLICY}/privacy-policy`, label: "מדיניות פרטיות", external: true },
      { href: `${POLICY}/terms-of-service`, label: "תנאי שימוש", external: true },
      { href: "/accessibility", label: "הצהרת נגישות" },
    ],
  },
  {
    title: "המועדון",
    links: [
      { href: CLUB_SITE, label: "אתר המועדון", external: true },
      { href: `${CLUB_SITE}/en/result-fixtures/first-team/fixtures/`, label: "משחקים וכרטיסים", external: true },
      { href: `${CLUB_SITE}/en/the-club/bloomfield-stadium/season-tickets/`, label: "מנויים", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className={`${s.footer} on-dark`}>
      {/* The stand, graded into the footer navy. */}
      <div className={s.tifo} aria-hidden="true">
        <Image src="/media/match-night-away.webp" alt="" fill sizes="100vw" className={s.tifoImg} />
        <div className={s.crest}>
          <Image src="/crest.png" alt="" width={400} height={400} sizes="(max-width: 700px) 120px, 200px" />
        </div>
      </div>

      <div className={`wrap ${s.top}`}>
        <div className={s.since}>
          <span className="tag" dir="ltr">EST.</span>
          <span className={`latin ${s.year}`}>1906</span>
          <span className="tag" dir="ltr">TEL AVIV · ISRAEL</span>
        </div>
        <Newsletter />
      </div>

      <div className={`wrap ${s.cols}`}>
        {COLUMNS.map((c, i) => (
          <nav key={c.title} aria-label={c.title} className={s.col}>
            <h3>
              <span className={`idx ${s.colIdx}`}>{String(i + 1).padStart(2, "0")}</span>
              {c.title}
            </h3>
            <ul>
              {c.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} className={s.link}>
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className={s.link}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className={s.col}>
          <h3>
            <span className={`idx ${s.colIdx}`}>04</span>
            החנות
          </h3>
          <p className={s.about}>
            החנות הרשמית של מועדון הכדורגל מכבי תל אביב. כל הזמנה נסגרת בקופה של החנות הקיימת.
          </p>
          <a href="#main" className={`${s.link} ${s.up}`}>
            חזרה למעלה <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>

      <div className={`wrap ${s.bottom}`}>
        <span>© {new Date().getFullYear()} מכבי תל אביב FC</span>
        <span className="tag-he">קונספט עיצוב · לא האתר הרשמי</span>
      </div>

      <div className={s.giant} aria-hidden="true">
        <span className="latin">MACCABI</span>
      </div>
    </footer>
  );
}
