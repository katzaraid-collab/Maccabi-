import s from "./Marquee.module.css";

// A technical ticker: condensed type, a numbered slash between items, thin
// rules top and bottom. Decorative copy of words that appear elsewhere, so it
// is hidden from assistive tech.
export function Marquee({ items, tone = "navy" }: { items: string[]; tone?: "navy" | "yellow" }) {
  const row = [...items, ...items];
  return (
    <div className={s.marquee} data-tone={tone} aria-hidden="true">
      <div className={s.track}>
        {row.map((t, i) => (
          <span key={i} className={s.item}>
            <span className={`idx ${s.n}`}>{String((i % items.length) + 1).padStart(2, "0")}</span>
            <span className={`display ${s.word}`}>{t}</span>
            <span className={s.slash} />
          </span>
        ))}
      </div>
    </div>
  );
}
