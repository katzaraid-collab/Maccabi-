"use client";

import Link from "next/link";
import { useEffect } from "react";
import s from "./not-found.module.css";

// Any page that throws lands here instead of Next's default English error page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={`${s.page} on-dark`} aria-labelledby="err-title">
      <div className={`wrap ${s.inner}`}>
        <p className={`tag ${s.code}`}>ERROR · TIME OUT</p>
        <h1 id="err-title" className={`display ${s.title}`}>
          פסק זמן
          <br />
          קצר.
        </h1>
        <p className={s.lead}>משהו השתבש בטעינת העמוד. אפשר לנסות שוב, או לחזור לחנות.</p>
        <div className={s.row}>
          <button type="button" className="btn" onClick={reset}>
            לנסות שוב
          </button>
          <Link href="/" className="btn btn-ghost">
            לדף הבית
          </Link>
        </div>
      </div>
    </section>
  );
}
