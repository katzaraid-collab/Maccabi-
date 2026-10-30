"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutUrl, price } from "@/lib/config";
import type { CartLine } from "@/lib/types";
import { CartToast } from "./CartToast";
import { MAX_QTY, useCart } from "./CartProvider";
import s from "./CartDrawer.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
const LEAVE_MS = 320;

const START = [
  { href: "/shop/kits", label: "תלבושות משחק 26/27" },
  { href: "/shop/new", label: "חדש בחנות" },
  { href: "/shop/training", label: "אימון וייצוג" },
];

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, restore, subtotal, count, lastAdded } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ line: CartLine; index: number } | null>(null);
  const [said, setSaid] = useState("");
  const close = useCallback(() => setOpen(false), [setOpen]);

  // Open: remember who opened us, lock scroll, focus the panel, trap Tab.
  // Close: hand focus back to the opener (or the header cart button).
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      root.style.overflow = "";
      const back =
        returnTo.current?.isConnected && returnTo.current !== document.body
          ? returnTo.current
          : document.querySelector<HTMLElement>('[data-cart-trigger], header button[aria-label^="הסל שלי"]');
      back?.focus({ preventScroll: true });
    };
  }, [open, close]);

  // Undo bar times out on its own.
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  // Announce adds to screen readers.
  useEffect(() => {
    if (!lastAdded) return;
    const l = lines.find((x) => x.key === lastAdded);
    if (l) setSaid(`נוסף לסל: ${l.title}, מידה ${l.size}`);
    // Only when a new add happens, not on every qty change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAdded]);

  const drop = (line: CartLine) => {
    const index = lines.findIndex((l) => l.key === line.key);
    setLeaving((prev) => new Set(prev).add(line.key));
    setTimeout(() => {
      remove(line.key);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(line.key);
        return next;
      });
      setUndo({ line, index });
      setSaid(`הוסר מהסל: ${line.title}`);
      // Keep focus inside the dialog after the row disappears.
      panel.current?.focus({ preventScroll: true });
    }, LEAVE_MS);
  };

  const step = (line: CartLine, delta: number) => {
    if (line.qty + delta <= 0) return drop(line);
    setQty(line.key, line.qty + delta);
    setSaid(`כמות ${line.title}: ${Math.min(MAX_QTY, line.qty + delta)}`);
  };

  const hasPrint = lines.some((l) => l.print);
  const empty = lines.length === 0;

  return (
    <>
      <div className={s.root} data-open={open} inert={!open}>
        <button className={s.scrim} onClick={close} aria-label="סגירת הסל" tabIndex={-1} />
        <div className={s.panel} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} ref={panel}>
          <header className={s.head}>
            <div>
              <p className={`tag ${s.kicker}`}>MACCABI TEL AVIV · STORE</p>
              <h2 id="cart-title" className={`display ${s.title}`}>
                הסל
                <span className={`idx ${s.count}`} aria-label={`${count} פריטים`}>
                  {String(count).padStart(2, "0")}
                </span>
              </h2>
            </div>
            <button className={s.close} onClick={close} aria-label="סגירת הסל">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </button>
          </header>

          {undo && (
            <div className={s.undo}>
              <span>
                הוסר: <strong>{undo.line.title}</strong>
              </span>
              <button
                onClick={() => {
                  restore(undo.line, undo.index);
                  setSaid(`הוחזר לסל: ${undo.line.title}`);
                  setUndo(null);
                }}
              >
                ביטול
              </button>
            </div>
          )}

          {empty ? (
            <div className={s.empty}>
              <p className={`display ${s.emptyTitle}`}>
                עוד אין
                <br />
                פה כלום.
              </p>
              <p className={s.emptyLead}>תתחיל מהחולצה. השאר יבוא.</p>
              <ol className={s.start}>
                {START.map((x, i) => (
                  <li key={x.href}>
                    <Link href={x.href} onClick={close}>
                      <span className={`idx ${s.startIdx}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span>{x.label}</span>
                      <span className={s.startArrow} aria-hidden="true">
                        ←
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <ul className={s.lines} aria-label="פריטים בסל">
                {lines.map((l, i) => (
                  <li
                    key={l.key}
                    className={s.line}
                    data-leaving={leaving.has(l.key) || undefined}
                    data-new={l.key === lastAdded || undefined}
                  >
                    <div className={s.lineInner}>
                      <span className={`idx ${s.lineIdx}`} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link href={`/product/${l.handle}`} className={s.thumb} onClick={close} tabIndex={-1} aria-hidden="true">
                        {l.image && <Image src={l.image} alt="" fill sizes="112px" />}
                      </Link>
                      <div className={s.info}>
                        <Link href={`/product/${l.handle}`} className={s.name} onClick={close}>
                          {l.title}
                        </Link>
                        <dl className={s.meta}>
                          <div>
                            <dt>מידה</dt>
                            <dd className="latin">{l.size}</dd>
                          </div>
                          {l.qty > 1 && (
                            <div>
                              <dt>ליחידה</dt>
                              <dd>{price(l.price)}</dd>
                            </div>
                          )}
                        </dl>
                        {l.print && (
                          <div className={s.print} aria-label={`הדפסה אישית: ${l.print.name} ${l.print.number}`}>
                            <span className={`latin ${s.printNum}`}>{l.print.number || "–"}</span>
                            <span className={s.printText}>
                              <span className="tag-he">הדפסה אישית</span>
                              <strong>{l.print.name || "ללא שם"}</strong>
                            </span>
                          </div>
                        )}
                        <div className={s.row}>
                          <div className={s.qty} role="group" aria-label={`כמות עבור ${l.title}`}>
                            <button onClick={() => step(l, 1)} aria-label="הוספת יחידה" disabled={l.qty >= MAX_QTY}>
                              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" />
                              </svg>
                            </button>
                            <output className="latin" aria-live="off">
                              {l.qty}
                            </output>
                            <button onClick={() => step(l, -1)} aria-label={l.qty === 1 ? "הסרה מהסל" : "הפחתת יחידה"}>
                              {l.qty === 1 ? (
                                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                                  <path d="M3 4h10M6 4V2.5h4V4M4.5 4l.7 9.5h5.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                                  <path d="M2 8h12" stroke="currentColor" strokeWidth="1.8" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <strong className={s.linePrice}>{price(l.price * l.qty)}</strong>
                        </div>
                        <button className={s.remove} onClick={() => drop(l)}>
                          הסרה
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <footer className={s.foot}>
                <dl className={s.summary}>
                  <div>
                    <dt>פריטים</dt>
                    <dd className="latin">{count}</dd>
                  </div>
                  <div>
                    <dt>משלוח</dt>
                    <dd>יחושב בקופה</dd>
                  </div>
                  <div className={s.total}>
                    <dt>סכום ביניים</dt>
                    <dd>{price(subtotal)}</dd>
                  </div>
                </dl>
                {hasPrint && (
                  <p className={s.note}>
                    <span className="tag-he">קונספט</span> הדפסה אישית עוד לא עוברת לקופה הקיימת. היא תתחבר דרך Storefront API.
                  </p>
                )}
                <a className="btn btn-navy btn-block" href={checkoutUrl(lines)}>
                  לקופה <span className="arrow">←</span>
                </a>
                <button className={s.continue} onClick={close}>
                  להמשיך לקנות
                </button>
                <p className={s.note}>התשלום, המשלוח והמיסים נקבעים בקופה של החנות הרשמית.</p>
              </footer>
            </>
          )}
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {said}
      </div>
      <CartToast />
    </>
  );
}
