"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import s from "./CartToast.module.css";

// Shown when something calls add(line, qty, { open: false }): a quiet
// confirmation instead of throwing the drawer over the page.
export function CartToast() {
  const { toast, dismissToast, setOpen } = useCart();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4500);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;
  return (
    <div className={s.toast} key={toast.id} role="status" aria-live="polite">
      <div className={s.thumb}>{toast.image && <Image src={toast.image} alt="" fill sizes="56px" />}</div>
      <div className={s.body}>
        <span className="tag-he">נוסף לסל</span>
        <strong className={s.title}>{toast.title}</strong>
        <span className={s.detail}>{toast.detail}</span>
      </div>
      <button
        className={s.view}
        onClick={() => {
          dismissToast();
          setOpen(true);
        }}
      >
        לסל
      </button>
      <button className={s.x} onClick={dismissToast} aria-label="סגירת ההודעה">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <span className={s.timer} aria-hidden="true" />
    </div>
  );
}
