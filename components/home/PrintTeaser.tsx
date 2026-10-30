"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Jersey } from "@/components/product/Jersey";
import { KIT_THEME } from "@/lib/kits";
import type { Kit } from "@/lib/types";
import s from "./PrintTeaser.module.css";

// Club photography of each shirt being worn, shown beside the live preview.
const WORN: Record<Kit, string> = {
  home: "/media/model-home-3.webp",
  away: "/media/player-away.webp",
  third: "/media/fullbody-third.webp",
  fourth: "/media/fullbody-fourth.webp",
  keeper: "/media/player-keeper-pink.webp",
};
const CODE: Record<Kit, string> = { home: "HOME", away: "AWAY", third: "THIRD", fourth: "FOURTH", keeper: "GK" };

export function PrintTeaser({ links }: { links: Partial<Record<Kit, string>> }) {
  const kits = (Object.keys(links) as Kit[]).filter((k) => links[k]);
  const [kit, setKit] = useState<Kit>(kits[0] ?? "home");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  return (
    <section className={s.section} id="print" aria-labelledby="print-title">
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <p className={`tag ${s.code}`}>
            <span>N°{number || "10"}</span>
            <span>PRINT STUDIO · 26/27 · {CODE[kit]}</span>
          </p>
          <h2 id="print-title" className={`display ${s.title}`} data-reveal="mask">
            <span>
              <span>השם שלך.</span>
            </span>
            <span style={{ "--line-i": 1 } as React.CSSProperties}>
              <span className={s.titleAccent}>הגב שלנו.</span>
            </span>
          </h2>
          <p className={s.lead}>מקלידים שם ומספר, בוחרים חולצה, ורואים בדיוק מה יעלה על הגב.</p>

          <div className={s.form}>
            <label className={s.field}>
              <span className="tag-he">שם על החולצה</span>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} placeholder="כהן" maxLength={12} />
            </label>
            <label className={`${s.field} ${s.num}`}>
              <span className="tag-he">מספר</span>
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
            {kits.map((k, i) => (
              <button key={k} role="radio" aria-checked={k === kit} className={s.kit} onClick={() => setKit(k)}>
                <span className={`idx ${s.kitIdx}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.swatch} style={{ background: KIT_THEME[k].shirt }} />
                {KIT_THEME[k].label}
              </button>
            ))}
          </div>

          <Link href={`/product/${links[kit]}?name=${encodeURIComponent(name)}&number=${number}#print`} className="btn btn-navy">
            להדפיס על החולצה הזו <span className="arrow">←</span>
          </Link>
        </div>

        <div className={s.stage} style={{ "--bg": KIT_THEME[kit].bg } as React.CSSProperties} data-reveal="wipe">
          <span className={`latin ${s.ghostNum}`} aria-hidden="true">
            {number || "10"}
          </span>
          <Jersey kit={kit} name={name || "השם שלך"} number={number || "10"} className={s.jersey} />
          <span className={`tag ${s.stageTag}`}>LIVE PREVIEW</span>
        </div>

        <figure className={s.worn} data-reveal="wipe" style={{ "--d": "0.15s" } as React.CSSProperties}>
          {kits.map((k) => (
            <Image
              key={k}
              src={WORN[k]}
              alt={k === kit ? `חולצת ה${KIT_THEME[k].label} של מכבי תל אביב על שחקן` : ""}
              aria-hidden={k !== kit}
              fill
              sizes="(max-width: 860px) 50vw, 22vw"
              className={s.wornImg}
              data-on={k === kit}
            />
          ))}
          <figcaption className="tag">{CODE[kit]} · WORN</figcaption>
        </figure>
      </div>
    </section>
  );
}
