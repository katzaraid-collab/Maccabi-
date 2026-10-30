"use client";

import { forwardRef } from "react";
import type { Kit } from "@/lib/types";
import { Jersey } from "./Jersey";
import s from "./PrintStudio.module.css";

export const NAME_MAX = 12;

export function nameError(name: string) {
  if (!name) return null;
  if (/[^A-Za-zא-ת '\-.]/.test(name)) return "אותיות בעברית או באנגלית בלבד";
  if (/[A-Za-z]/.test(name) && /[א-ת]/.test(name)) return "שפה אחת בשם, עברית או אנגלית";
  return null;
}

export function numberError(num: string) {
  if (!num) return null;
  if (/\D/.test(num)) return "ספרות בלבד";
  if (num.length > 2) return "מספר בין 0 ל־99";
  return null;
}

type Props = {
  kit: Kit;
  on: boolean;
  onToggle: (on: boolean) => void;
  name: string;
  number: string;
  onName: (v: string) => void;
  onNumber: (v: string) => void;
  onFocusField: () => void;
};

export const PrintStudio = forwardRef<HTMLInputElement, Props>(function PrintStudio(
  { kit, on, onToggle, name, number, onName, onNumber, onFocusField },
  nameRef,
) {
  const nErr = nameError(name);
  const numErr = numberError(number);
  const full = name.length >= NAME_MAX;

  return (
    <section className={s.studio} id="print" aria-labelledby="print-title" data-on={on} data-kit={kit}>
      <label className={s.head}>
        <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        <span className={s.box} aria-hidden="true" />
        <span className={s.headText}>
          <span id="print-title" className={s.headTitle}>
            שם ומספר על הגב
          </span>
          <span className={s.tag}>קונספט</span>
        </span>
      </label>

      {on && (
        <div className={s.body}>
          <div className={s.preview} aria-hidden="true">
            <Jersey kit={kit} name={name || "שם שלך"} number={number || "10"} className={s.jersey} />
          </div>
          <div className={s.fields}>
            <div className={s.field}>
              <div className={s.labelRow}>
                <label htmlFor="print-name">שם</label>
                <span className={s.counter} data-full={full} aria-hidden="true">
                  {name.length}/{NAME_MAX}
                </span>
              </div>
              <input
                ref={nameRef}
                id="print-name"
                value={name}
                onChange={(e) => onName(e.target.value.slice(0, NAME_MAX))}
                onFocus={onFocusField}
                maxLength={NAME_MAX}
                autoComplete="off"
                spellCheck={false}
                placeholder="COHEN / כהן"
                aria-invalid={Boolean(nErr)}
                aria-describedby="print-name-msg"
              />
              <p id="print-name-msg" className={s.msg} data-error={Boolean(nErr)} aria-live="polite">
                {nErr ?? (full ? `מקסימום ${NAME_MAX} תווים` : "")}
              </p>
            </div>
            <div className={`${s.field} ${s.num}`}>
              <div className={s.labelRow}>
                <label htmlFor="print-number">מספר</label>
              </div>
              <input
                id="print-number"
                value={number}
                onChange={(e) => onNumber(e.target.value.slice(0, 3))}
                onBlur={() => /^\d{2}$/.test(number) && number.startsWith("0") && onNumber(String(Number(number)))}
                onFocus={onFocusField}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0–99"
                dir="ltr"
                aria-invalid={Boolean(numErr)}
                aria-describedby="print-number-msg"
              />
              <p id="print-number-msg" className={s.msg} data-error={Boolean(numErr)} aria-live="polite">
                {numErr ?? ""}
              </p>
            </div>
          </div>
          <p className={s.note}>
            ההדפסה מוצגת כאן כקונספט: היא עדיין לא נשלחת לקופה ולא נגבה עליה תשלום, והמחיר שלה ייקבע בחנות. השאירו ריק כדי לקנות בלי הדפסה.
          </p>
        </div>
      )}
    </section>
  );
});
