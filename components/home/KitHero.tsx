"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { price } from "@/lib/config";
import { KIT_THEME } from "@/lib/kits";
import type { Kit } from "@/lib/types";
import s from "./KitHero.module.css";

export type HeroKit = { kit: Kit; handle: string; title: string; price: number; image: string };

const LINES: Record<Kit, [string, string]> = {
  home: ["הצהוב", "של בלומפילד."],
  away: ["כחול", "לכל מגרש."],
  third: ["פסים", "של מסורת."],
  fourth: ["הרביעית.", "למי שיודע."],
  keeper: ["הקו", "האחרון."],
};

export function KitHero({ kits }: { kits: HeroKit[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const current = kits[i];
  const theme = KIT_THEME[current.kit];

  const go = useCallback((n: number) => setI((n + kits.length) % kits.length), [kits.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(i + 1), 6500);
    return () => clearTimeout(t);
  }, [i, paused, go]);

  // Pointer tilt on the shirt.
  const onMove = (e: React.PointerEvent) => {
    const el = stage.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    el.style.setProperty("--tx", `${(x * 18).toFixed(1)}px`);
  };
  const onLeave = () => {
    stage.current?.style.setProperty("--rx", "0deg");
    stage.current?.style.setProperty("--ry", "0deg");
    stage.current?.style.setProperty("--tx", "0px");
  };

  return (
    <section
      className={s.hero}
      style={{ "--bg": theme.bg, "--accent": theme.accent } as React.CSSProperties}
      aria-roledescription="קרוסלה"
      aria-label="תלבושות המשחק 26/27"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
    >
      <div className={s.grain} aria-hidden="true" />
      <div className={s.giant} aria-hidden="true" key={`g-${current.kit}`}>
        {theme.label}
      </div>

      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <p className={`eyebrow ${s.eyebrow}`}>
            <span className="latin">PUMA × MACCABI TEL AVIV</span> · עונת 26/27
          </p>
          <h1 className={`display ${s.title}`} key={`t-${current.kit}`} aria-live="polite">
            <span>{LINES[current.kit][0]}</span>
            <span>{LINES[current.kit][1]}</span>
          </h1>
          <p className={s.sub}>
            חולצת ה{theme.label} הרשמית של עונת 26/27. עם השם והמספר שלך על הגב.
          </p>
          <div className={s.ctas}>
            <Link href={`/product/${current.handle}`} className="btn btn-navy">
              לקנייה · {price(current.price)} <span className="arrow">←</span>
            </Link>
            <Link href={`/product/${current.handle}#print`} className={`btn btn-ghost ${s.ghost}`}>
              עצב עם שם ומספר
            </Link>
          </div>

          <div className={s.tabs} role="tablist" aria-label="בחירת תלבושת">
            {kits.map((k, n) => (
              <button
                key={k.kit}
                role="tab"
                aria-selected={n === i}
                className={s.tab}
                onClick={() => {
                  go(n);
                  setPaused(true);
                }}
              >
                <span className={s.swatch} style={{ background: KIT_THEME[k.kit].shirt }} />
                {KIT_THEME[k.kit].label}
                {n === i && !paused && <span className={s.progress} key={i} />}
              </button>
            ))}
          </div>
        </div>

        <div className={s.stage} ref={stage} onPointerMove={onMove} onPointerLeave={onLeave}>
          <div className={s.halo} aria-hidden="true" />
          {kits.map((k, n) => (
            <Image
              key={k.kit}
              src={k.image}
              alt={n === i ? k.title : ""}
              width={900}
              height={900}
              sizes="(max-width: 900px) 90vw, 46vw"
              priority={n === 0}
              className={s.shirt}
              data-active={n === i}
            />
          ))}
          <div className={s.counter} aria-hidden="true">
            <span className="latin">{String(i + 1).padStart(2, "0")}</span>
            <span className={s.counterLine} />
            <span className="latin">{String(kits.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      <a href="#drop" className={s.scroll} aria-label="גלילה לתוכן">
        <span />
      </a>
    </section>
  );
}
