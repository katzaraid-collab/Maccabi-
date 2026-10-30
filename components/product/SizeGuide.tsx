"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ADULT_CHEST, KIDS, SIZE_CHART_CHECKED, SIZE_CHART_NOTE, SIZE_CHART_URL } from "./sizeChart";
import type { SizeSystem } from "./sizes";
import s from "./SizeGuide.module.css";

export function SizeGuide({ system, onClose }: { system: SizeSystem; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      root.style.overflow = prev;
      opener?.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key !== "Tab") return;
    const f = panel.current?.querySelectorAll<HTMLElement>("a, button");
    if (!f?.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className={s.root} onKeyDown={onKeyDown}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.panel} ref={panel} role="dialog" aria-modal="true" aria-labelledby="sg-title">
        <header className={s.head}>
          <div>
            <p className={s.kicker}>SIZE GUIDE · PUMA</p>
            <h2 id="sg-title" className={s.title}>
              מדריך מידות
            </h2>
          </div>
          <button ref={close} type="button" className={s.close} onClick={onClose} aria-label="סגירת מדריך המידות">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </header>

        <div className={s.body}>
          {(system === "adult" || system === null) && (
            <section>
              <h3 className={s.h3}>מבוגרים · היקף חזה</h3>
              <div className={s.scroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th scope="col">מידה</th>
                      {ADULT_CHEST.sizes.map((z) => (
                        <th key={z} scope="col" className="latin">
                          {z}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ADULT_CHEST.rows.map((r) => (
                      <tr key={r.label}>
                        <th scope="row">{r.label}</th>
                        {r.values.map((v, i) => (
                          <td key={i} dir="ltr">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={s.small}>בטבלת החנות מופיעות מידות S עד XL בלבד.</p>
            </section>
          )}

          {(system === "kids" || system === null) && (
            <section>
              <h3 className={s.h3}>ילדים · המרת מידות</h3>
              <div className={s.scroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th scope="col">PUMA</th>
                      {KIDS.puma.map((z) => (
                        <th key={z} scope="col">
                          {z}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">מידה</th>
                      {KIDS.local.map((v) => (
                        <td key={v}>{v}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">היקף חזה (ס״מ)</th>
                      {KIDS.chest.map((v) => (
                        <td key={v} dir="ltr">
                          {v}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={s.small}>טווחי היקף החזה מוצגים לפי הסדר שבו הם מופיעים בטבלת החנות.</p>
            </section>
          )}

          {system === "socks" && (
            <section>
              <h3 className={s.h3}>גרביים</h3>
              <p className={s.text}>לגרביים אין טבלה ייעודית בחנות. הטווח שעל כל מידה מופיע ישירות בבחירת המידה.</p>
            </section>
          )}

          <p className={s.text}>{SIZE_CHART_NOTE}</p>
          <p className={s.source}>
            מקור: טבלת המידות של החנות הרשמית · נבדק {SIZE_CHART_CHECKED}
            <br />
            <a href={SIZE_CHART_URL} target="_blank" rel="noopener noreferrer">
              לטבלה המלאה באתר החנות ↗
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
