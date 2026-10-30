import type { Metadata } from "next";

export const metadata: Metadata = { title: "הצהרת נגישות" };

export default function Accessibility() {
  return (
    <div className="wrap" style={{ paddingTop: "calc(var(--header-h) + 60px)", paddingBottom: 100, maxWidth: 820 }}>
      <p className="eyebrow">נגישות</p>
      <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: "16px 0 32px" }}>
        הצהרת נגישות
      </h1>
      <p>
        האתר נבנה לפי תקן ישראלי 5568 ו-WCAG 2.1 ברמה AA: ניווט מלא במקלדת, קישור דילוג לתוכן, ניגודיות צבעים תקינה, טקסט
        חלופי לתמונות, תמיכה בקוראי מסך ובהגדרת &quot;הפחתת תנועה&quot; של מערכת ההפעלה.
      </p>
      <p>
        <strong>טיוטה לקונספט.</strong> לפני עלייה לאוויר יש להשלים את פרטי רכז הנגישות של המועדון, תאריך בדיקה ודרכי
        פנייה.
      </p>
    </div>
  );
}
