"use client";

import Link from "next/link";
import { useState } from "react";
import { Jersey } from "@/components/product/Jersey";
import { KIT_THEME } from "@/lib/kits";
import type { Kit } from "@/lib/types";
import s from "./PrintTeaser.module.css";

export function PrintTeaser({ links }: { links: Partial<Record<Kit, string>> }) {
  const kits = (Object.keys(links) as Kit[]).filter((k) => links[k]);
  const [kit, setKit] = useState<Kit>(kits[0] ?? "home");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  return (
    <section className={s.section} id="print" aria-labelledby="print-title">
      <div className={`wrap ${s.grid}`}>
        <div className={s.preview} style={{ "--bg": KIT_THEME[kit].bg } as React.CSSProperties} data-reveal>
          <Jersey kit={kit} name={name || "שם שלך"} number={number || "10"} className={s.jersey} />
        </div>
        <div className={s.copy} data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
          <p className="eyebrow">סטודיו הדפסה</p>
          <h2 id="print-title" className={`display ${s.title}`}>
            השם שלך.
            <br />
            על הגב שלנו.
          </h2>
          <p className={s.lead}>תכתוב, תבחר חולצה, ותראה את התוצאה לפני שאתה מזמין.</p>

          <div className={s.form}>
            <label className={s.field}>
              <span>שם על החולצה</span>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} placeholder="לדוגמה: כהן" maxLength={12} />
            </label>
            <label className={`${s.field} ${s.num}`}>
              <span>מספר</span>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="10"
                inputMode="numeric"
                maxLength={2}
                dir="ltr"
              />
            </label>
          </div>

          <div className={s.kits} role="radiogroup" aria-label="בחירת חולצה">
            {kits.map((k) => (
              <button key={k} role="radio" aria-checked={k === kit} className={s.kit} onClick={() => setKit(k)}>
                <span style={{ background: KIT_THEME[k].shirt }} />
                {KIT_THEME[k].label}
              </button>
            ))}
          </div>

          <Link
            href={`/product/${links[kit]}?name=${encodeURIComponent(name)}&number=${number}#print`}
            className="btn btn-navy"
          >
            המשך לחולצה הזו <span className="arrow">←</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
