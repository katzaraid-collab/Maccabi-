import type { Kit } from "@/lib/types";
import { KIT_THEME } from "@/lib/kits";

type Props = { kit: Kit; name: string; number: string; className?: string };

// The back of the shirt, drawn so the fan's name and number can be previewed
// live. Latin names render in the condensed numeral face; Hebrew in Heebo Black.
export function Jersey({ kit, name, number, className }: Props) {
  const t = KIT_THEME[kit];
  const isHebrew = /[֐-׿]/.test(name);
  const display = (isHebrew ? name : name.toUpperCase()).slice(0, 12);
  const nameSize = display.length > 9 ? 30 : display.length > 6 ? 36 : 42;
  const pattern = `stripe-${kit}`;

  return (
    <svg viewBox="0 0 400 440" className={className} role="img" aria-label={`גב החולצה: ${name || "ללא שם"} ${number}`}>
      <defs>
        {kit === "third" && (
          <pattern id={pattern} width="22" height="10" patternUnits="userSpaceOnUse">
            <rect width="22" height="10" fill={t.shirt} />
            <rect x="10" width="2" height="10" fill={t.trim} opacity="0.85" />
          </pattern>
        )}
        {kit === "away" && (
          <pattern id={pattern} width="34" height="10" patternUnits="userSpaceOnUse">
            <rect width="34" height="10" fill={t.shirt} />
            <rect x="14" width="6" height="10" fill={t.trim} opacity="0.35" />
          </pattern>
        )}
        <linearGradient id="shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      <g>
        <path
          d="M128 22 C150 36 176 42 200 42 C224 42 250 36 272 22 L352 58 C366 64 374 74 378 88 L396 160 L330 182 L318 150 L318 418 C318 428 310 434 300 434 L100 434 C90 434 82 428 82 418 L82 150 L70 182 L4 160 L22 88 C26 74 34 64 48 58 Z"
          fill={kit === "third" || kit === "away" ? `url(#${pattern})` : t.shirt}
        />
        <path
          d="M128 22 C150 36 176 42 200 42 C224 42 250 36 272 22 L352 58 C366 64 374 74 378 88 L396 160 L330 182 L318 150 L318 418 C318 428 310 434 300 434 L100 434 C90 434 82 428 82 418 L82 150 L70 182 L4 160 L22 88 C26 74 34 64 48 58 Z"
          fill="url(#shade)"
        />
        {/* collar */}
        <path d="M128 22 C150 36 176 42 200 42 C224 42 250 36 272 22 L262 18 C242 28 222 32 200 32 C178 32 158 28 138 18 Z" fill={t.trim} />
        {/* cuffs */}
        <path d="M4 160 L70 182 L74 170 L8 148 Z" fill={t.trim} />
        <path d="M396 160 L330 182 L326 170 L392 148 Z" fill={t.trim} />
      </g>

      <text
        x="200"
        y="128"
        textAnchor="middle"
        fill={t.ink}
        style={{
          fontFamily: isHebrew ? "var(--font-body)" : "var(--font-latin-display)",
          fontWeight: isHebrew ? 900 : 400,
          fontSize: nameSize,
          letterSpacing: isHebrew ? 0 : 3,
        }}
      >
        {display}
      </text>
      <text
        x="200"
        y="330"
        textAnchor="middle"
        fill={t.ink}
        style={{ fontFamily: "var(--font-latin-display)", fontSize: 190, letterSpacing: -4 }}
      >
        {number}
      </text>
    </svg>
  );
}
