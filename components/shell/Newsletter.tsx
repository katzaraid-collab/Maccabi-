"use client";

import { useId, useRef, useState } from "react";
import s from "./Footer.module.css";

type Status = "idle" | "invalid" | "sending" | "done";

// Simple but real enough to reject "a@b" and typos like "name@gmail".
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Email only. The current store asks for an Israeli ID number to join the
// newsletter, which loses sign-ups and collects data nobody needs.
export function Newsletter() {
  const [status, setStatus] = useState<Status>("idle");
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(value.trim())) {
      setStatus("invalid");
      input.current?.focus();
      return;
    }
    setStatus("sending");
    // Concept: no list is connected yet, so nothing is sent anywhere.
    setTimeout(() => setStatus("done"), 700);
  };

  return (
    <form className={s.news} onSubmit={submit} noValidate data-status={status}>
      <h2 className={`display ${s.newsTitle}`}>
        הדרופ הבא.
        <br />
        <span className={s.newsAccent}>אצלך קודם.</span>
      </h2>

      {status === "done" ? (
        <div className={s.done} role="status">
          <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" className={s.check}>
            <rect x="1" y="1" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 25l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
          </svg>
          <div>
            <strong className={s.doneTitle}>אתה ברשימה.</strong>
            <span className={s.doneText}>
              כשהקולקציה הבאה נוחתת, אתה שומע ראשון. <span className="tag-he">קונספט · לא נשלח בפועל</span>
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className={s.newsLead} id={hintId}>
            קולקציות, מהדורות מוגבלות והדפסות מיוחדות. רק אימייל, בלי תעודת זהות.
          </p>
          <div className={s.field} data-invalid={status === "invalid" || undefined}>
            <label htmlFor={`${id}-email`} className={s.fieldLabel}>
              אימייל
            </label>
            <input
              ref={input}
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@email.com"
              dir="ltr"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (status === "invalid" && EMAIL.test(e.target.value.trim())) setStatus("idle");
              }}
              aria-invalid={status === "invalid"}
              aria-describedby={status === "invalid" ? errId : hintId}
            />
            <button className="btn" type="submit" aria-busy={status === "sending"}>
              הרשמה
            </button>
          </div>
          <p className={s.error} id={errId} role="alert">
            {status === "invalid" ? (value.trim() ? "זה לא נראה כמו אימייל. בדוק שוב?" : "צריך אימייל כדי להירשם.") : ""}
          </p>
        </>
      )}
    </form>
  );
}
