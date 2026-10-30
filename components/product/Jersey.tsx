"use client";

import { useId } from "react";
import { KIT_THEME } from "@/lib/kits";
import type { Kit } from "@/lib/types";

type Props = { kit: Kit; name: string; number: string; className?: string };

const BODY =
  "M150 28 C170 36 230 36 250 28 L300 40 C326 48 346 60 356 74 L394 148 C396 152 394 156 390 158 L340 178 C336 180 332 178 330 174 L314 142 L320 410 C320 420 312 428 300 428 C240 434 160 434 100 428 C88 428 80 420 80 410 L86 142 L70 174 C68 178 64 180 60 178 L10 158 C6 156 4 152 6 148 L44 74 C54 60 74 48 100 40 Z";

// The back of the shirt, drawn so a fan's name and number preview live. Layers, bottom up:
// kit cloth, mesh, grain, body light, folds, trims, then the print with a slight fabric warp.
export function Jersey({ kit, name, number, className }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = KIT_THEME[kit];
  const isHebrew = /[֐-׿]/.test(name);
  const display = (isHebrew ? name : name.toUpperCase()).slice(0, 12);
  // Rough glyph widths (em) for Anton + tracking and Heebo Black, to keep long names inside the shoulders.
  const perChar = isHebrew ? 0.6 : 0.5 + 0.1;
  const nameSize = Math.min(isHebrew ? 40 : 42, 236 / Math.max(1, display.length * perChar));
  const numSize = number.length > 1 ? 178 : 186;
  const u = (k: string) => `url(#${k}${id})`;
  const striped = kit === "third" || kit === "away";

  return (
    <svg viewBox="0 0 400 440" className={className} role="img" aria-label={`תצוגת גב החולצה: ${name || "ללא שם"}, מספר ${number}`}>
      <defs>
        <clipPath id={`clip${id}`}>
          <path d={BODY} />
        </clipPath>
        {kit === "third" && (
          <pattern id={`cloth${id}`} width="18" height="10" patternUnits="userSpaceOnUse">
            <rect width="18" height="10" fill={t.shirt} />
            <rect x="8" width="1.4" height="10" fill={t.trim} opacity="0.9" />
          </pattern>
        )}
        {kit === "away" && (
          <pattern id={`cloth${id}`} width="36" height="10" patternUnits="userSpaceOnUse">
            <rect width="36" height="10" fill={t.shirt} />
            <rect x="12" width="12" height="10" fill="#000" opacity="0.09" />
          </pattern>
        )}
        <pattern id={`mesh${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="#000" opacity="0.13" />
          <circle cx="3" cy="3" r="0.7" fill="#fff" opacity="0.1" />
        </pattern>
        <filter id={`grain${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0" />
        </filter>
        <linearGradient id={`side${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.04" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`drop${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`blade${id}`} cx="0.5" cy="0.28" r="0.42">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* Prints sit on knit, not glass: a hair of displacement and a faint fabric texture. */}
        <filter id={`print${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="f" />
          <feColorMatrix in="f" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0" result="fa" />
          <feComposite in="fa" in2="d" operator="in" result="tex" />
          <feMerge>
            <feMergeNode in="d" />
            <feMergeNode in="tex" />
          </feMerge>
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="200" cy="432" rx="150" ry="7" fill="#000" opacity="0.14" filter={u("soft")} />

      <g clipPath={u("clip")}>
        <rect width="400" height="440" fill={striped ? u("cloth") : t.shirt} />
        <rect width="400" height="440" fill={u("mesh")} />
        <rect width="400" height="440" filter={u("grain")} style={{ mixBlendMode: "multiply" }} />
        <rect width="400" height="440" fill={u("side")} />
        <rect width="400" height="440" fill={u("drop")} />
        <rect width="400" height="440" fill={u("blade")} />

        {/* folds: soft creases from the underarms and a lazy wave above the hem */}
        <g filter={u("soft")} fill="none" strokeLinecap="round">
          <path d="M92 160 C130 200 150 250 156 300" stroke="#000" strokeOpacity="0.12" strokeWidth="9" />
          <path d="M100 150 C140 190 162 240 168 290" stroke="#fff" strokeOpacity="0.12" strokeWidth="6" />
          <path d="M308 160 C272 205 252 255 246 310" stroke="#000" strokeOpacity="0.12" strokeWidth="9" />
          <path d="M300 150 C262 192 242 242 236 300" stroke="#fff" strokeOpacity="0.1" strokeWidth="6" />
          <path d="M90 392 C150 378 250 400 312 384" stroke="#000" strokeOpacity="0.12" strokeWidth="10" />
          <path d="M120 60 C150 70 250 70 280 60" stroke="#000" strokeOpacity="0.1" strokeWidth="8" />
        </g>

        {/* armhole seams + stitching */}
        <g fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.4">
          <path d="M100 41 C108 80 104 118 86 142" />
          <path d="M300 41 C292 80 296 118 314 142" />
        </g>
        <g fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2 2.5">
          <path d="M104 42 C112 80 108 120 91 144" />
          <path d="M296 42 C288 80 292 120 309 144" />
          <path d="M82 418 C160 426 240 426 318 418" />
        </g>

        {/* cuffs */}
        <path d="M394 148 L340 178 L334 167 L388 137 Z" fill={t.trim} />
        <path d="M6 148 L60 178 L66 167 L12 137 Z" fill={t.trim} />
        <path d="M388 137 L334 167" stroke="#000" strokeOpacity="0.2" strokeWidth="1.2" />
        <path d="M12 137 L66 167" stroke="#000" strokeOpacity="0.2" strokeWidth="1.2" />
        {/* hem band shade */}
        <path d="M80 412 C160 422 240 422 320 412 L320 440 L80 440 Z" fill="#000" opacity="0.08" />
      </g>

      {/* back collar: the band rises above the neckline, with a shadowed inner face */}
      <path d="M146 22 C170 34 230 34 254 22 L250 30 C230 40 170 40 150 30 Z" fill={t.trim} />
      <path d="M150 30 C170 40 230 40 250 30 L250 33 C230 43 170 43 150 33 Z" fill="#000" opacity="0.18" />
      <path d="M146 22 C170 34 230 34 254 22" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />

      <g filter={u("print")} fill={t.ink}>
        <text
          x="200"
          y="122"
          textAnchor="middle"
          style={{
            fontFamily: isHebrew ? "var(--font-body)" : "var(--font-latin-display)",
            fontWeight: isHebrew ? 900 : 400,
            fontSize: nameSize,
            letterSpacing: isHebrew ? 0 : nameSize * 0.1,
          }}
        >
          {display}
        </text>
        <text
          x="200"
          y="322"
          textAnchor="middle"
          stroke={t.trim}
          strokeWidth="2.5"
          paintOrder="stroke"
          style={{ fontFamily: "var(--font-latin-display)", fontSize: numSize, letterSpacing: -2 }}
        >
          {number}
        </text>
      </g>
    </svg>
  );
}
