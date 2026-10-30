import Image from "next/image";
import Link from "next/link";
import { CLUB_SITE } from "@/lib/config";
import { Newsletter } from "./Newsletter";
import s from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.top}`}>
        <div className={s.brand}>
          <Image src="/crest.png" alt="" width={84} height={84} />
          <p className={`display ${s.since}`}>
            מאז
            <br />
            1906
          </p>
        </div>
        <Newsletter />
      </div>

      <div className={`wrap ${s.cols}`}>
        <nav aria-label="קניות">
          <h3>קניות</h3>
          <Link href="/shop/new">עונת 26/27</Link>
          <Link href="/shop/kits">תלבושות משחק</Link>
          <Link href="/shop/training">אימון וייצוג</Link>
          <Link href="/shop/fashion">אופנה ורטרו</Link>
          <Link href="/shop/kids">ילדים</Link>
          <Link href="/shop/sale">SALE</Link>
        </nav>
        <nav aria-label="שירות">
          <h3>שירות</h3>
          <a href="https://shop.maccabi-tlv.co.il/policies/shipping-policy">משלוחים</a>
          <a href="https://shop.maccabi-tlv.co.il/policies/refund-policy">החזרות והחלפות</a>
          <a href="https://shop.maccabi-tlv.co.il/policies/privacy-policy">מדיניות פרטיות</a>
          <a href="https://shop.maccabi-tlv.co.il/policies/terms-of-service">תנאי שימוש</a>
          <Link href="/accessibility">הצהרת נגישות</Link>
        </nav>
        <nav aria-label="המועדון">
          <h3>המועדון</h3>
          <a href={CLUB_SITE}>אתר המועדון</a>
          <a href={`${CLUB_SITE}/en/result-fixtures/first-team/fixtures/`}>משחקים וכרטיסים</a>
          <a href={`${CLUB_SITE}/en/the-club/bloomfield-stadium/season-tickets/`}>מנויים</a>
        </nav>
      </div>

      <div className={`wrap ${s.bottom}`}>
        <span>© {new Date().getFullYear()} מכבי תל אביב FC</span>
        <span>קונספט עיצוב · לא האתר הרשמי</span>
      </div>
      <div className={s.giant} aria-hidden="true">
        MACCABI
      </div>
    </footer>
  );
}
