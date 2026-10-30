import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import s from "./page.module.css";

export const metadata: Metadata = { title: "הצהרת נגישות", alternates: canonical("/accessibility") };

// What the concept does today. Claims stay modest until a formal audit is done.
const FEATURES = [
  "ניווט במקלדת וקישור דילוג לתוכן",
  "טבעת מיקוד גלויה ברכיבים האינטראקטיביים",
  "טקסט חלופי לתמונות",
  "תמיכה בקוראי מסך: כותרות, תוויות ואזורים חיים",
  "כיבוד הגדרת “הפחתת תנועה” של מערכת ההפעלה",
];

export default function Accessibility() {
  return (
    <article className={`wrap ${s.page}`}>
      <header className={s.head}>
        <p className="tag">IS 5568 · WCAG 2.1 AA · TARGET</p>
        <h1 className={`display ${s.title}`}>הצהרת נגישות</h1>
      </header>

      <div className={`prose ${s.body}`}>
        <p className={s.lead}>
          היעד הוא תקן ישראלי 5568 ו-WCAG 2.1 ברמה AA, כדי שכל אוהד יוכל לקנות בלי תלות במכשיר, בעכבר או בראייה.
          זו גרסת קונספט, ועדיין לא עברה בדיקת נגישות רשמית.
        </p>

        <h2 className={s.h2}>מה נעשה באתר</h2>
        <ol className={s.list}>
          {FEATURES.map((f, i) => (
            <li key={f}>
              <span className={`idx ${s.idx}`}>{String(i + 1).padStart(2, "0")}</span>
              {f}
            </li>
          ))}
        </ol>

        <div className={s.draft} role="note">
          <span className="tag-he">טיוטה לקונספט</span>
          <p>לפני עלייה לאוויר יש להשלים את פרטי רכז הנגישות של המועדון, תאריך בדיקה ודרכי פנייה.</p>
        </div>
      </div>
    </article>
  );
}
