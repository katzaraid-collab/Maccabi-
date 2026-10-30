import s from "./Marquee.module.css";

export function Marquee({ items, tone = "navy" }: { items: string[]; tone?: "navy" | "yellow" }) {
  const row = [...items, ...items];
  return (
    <div className={s.marquee} data-tone={tone} aria-hidden="true">
      <div className={s.track}>
        {row.map((t, i) => (
          <span key={i} className={s.item}>
            {t}
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M12 2l2.9 6.9L22 9.6l-5.4 4.9L18.2 22 12 18.2 5.8 22l1.6-7.5L2 9.6l7.1-.7z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
