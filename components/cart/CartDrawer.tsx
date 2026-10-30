"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { checkoutUrl, price } from "@/lib/config";
import { useCart } from "./CartProvider";
import s from "./CartDrawer.module.css";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, count } = useCart();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const hasPrint = lines.some((l) => l.print);

  return (
    <div className={s.root} data-open={open} aria-hidden={!open} inert={!open}>
      <button className={s.scrim} onClick={() => setOpen(false)} aria-label="סגירת הסל" tabIndex={-1} />
      <div className={s.panel} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} ref={panel}>
        <header className={s.head}>
          <h2 id="cart-title" className={s.title}>
            הסל שלי <span className={s.count}>{count}</span>
          </h2>
          <button className={s.close} onClick={() => setOpen(false)} aria-label="סגירה">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className={s.empty}>
            <p className="display">הסל ריק.</p>
            <p>היציע מחכה לך.</p>
            <Link href="/shop/new" className="btn" onClick={() => setOpen(false)}>
              לקולקציה החדשה <span className="arrow">←</span>
            </Link>
          </div>
        ) : (
          <>
            <ul className={s.lines}>
              {lines.map((l) => (
                <li key={l.key} className={s.line}>
                  <Link href={`/product/${l.handle}`} className={s.thumb} onClick={() => setOpen(false)}>
                    {l.image && <Image src={l.image} alt="" fill sizes="96px" />}
                  </Link>
                  <div className={s.info}>
                    <Link href={`/product/${l.handle}`} className={s.name} onClick={() => setOpen(false)}>
                      {l.title}
                    </Link>
                    <div className={s.meta}>
                      מידה {l.size}
                      {l.print && (
                        <span className={s.print}>
                          הדפסה: {l.print.name} · {l.print.number}
                        </span>
                      )}
                    </div>
                    <div className={s.row}>
                      <div className={s.qty} role="group" aria-label={`כמות עבור ${l.title}`}>
                        <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="הוספה">
                          +
                        </button>
                        <span aria-live="polite">{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="הפחתה">
                          −
                        </button>
                      </div>
                      <strong>{price(l.price * l.qty)}</strong>
                    </div>
                    <button className={s.remove} onClick={() => remove(l.key)}>
                      הסרה
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className={s.foot}>
              <div className={s.total}>
                <span>סה״כ ביניים</span>
                <strong>{price(subtotal)}</strong>
              </div>
              <p className={s.note}>משלוח ומיסים יחושבו בקופה.</p>
              {hasPrint && (
                <p className={s.note}>
                  קונספט: הדפסה אישית עוד לא עוברת לקופה הקיימת. היא תתחבר דרך Storefront API.
                </p>
              )}
              <a className="btn btn-block" href={checkoutUrl(lines)}>
                לתשלום מאובטח <span className="arrow">←</span>
              </a>
              <div className={s.pay} aria-label="אמצעי תשלום">
                <span>Apple Pay</span>
                <span>Google Pay</span>
                <span>Visa</span>
                <span>Mastercard</span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
