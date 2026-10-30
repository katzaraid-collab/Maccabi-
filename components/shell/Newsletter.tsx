"use client";

import { useState } from "react";
import s from "./Footer.module.css";

// Email only. The current store asks for an Israeli ID number to join the
// newsletter, which loses sign-ups and collects data nobody needs.
export function Newsletter() {
  const [done, setDone] = useState(false);
  return (
    <form
      className={s.news}
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <h2 className="display">ראשונים לדרופ הבא.</h2>
      <p>קולקציות חדשות, מהדורות מוגבלות והטבות לאוהדים. בלי ספאם.</p>
      {done ? (
        <p className={s.thanks} role="status">
          נרשמת. נתראה ביציע 💛💙
        </p>
      ) : (
        <div className={s.field}>
          <label htmlFor="news-email" className="sr-only">
            אימייל
          </label>
          <input id="news-email" type="email" required placeholder="האימייל שלך" dir="ltr" />
          <button className="btn" type="submit">
            הרשמה
          </button>
        </div>
      )}
    </form>
  );
}
