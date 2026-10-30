"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchResponse } from "@/app/api/search/route";
import { SUGGESTED } from "@/components/shop/taxonomy";
import { price } from "@/lib/config";
import s from "./SearchOverlay.module.css";

type Option = { id: string; href: string };

// Full-width predictive search. The input is an ARIA combobox: arrows move
// through suggestions/departments/products, Enter opens the active one or
// runs a full search at /search?q=.
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [idle, setIdle] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  // Debounced fetch; stale responses are aborted.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term && idle) {
      setData(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
          const json = (await res.json()) as SearchResponse;
          if (term) setData(json);
          else setIdle(json);
          setActive(-1);
        } catch {
          /* aborted or offline: keep the last results */
        } finally {
          if (!ctrl.signal.aborted) setLoading(false);
        }
      },
      term ? 140 : 0,
    );
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open, idle]);

  const term = q.trim();
  const shown = term ? data : idle;
  const chips = term ? [] : SUGGESTED;
  const options: Option[] = [
    ...chips.map((c, i) => ({ id: `${uid}-c${i}`, href: `/search?q=${encodeURIComponent(c)}` })),
    ...(term ? (shown?.links ?? []).map((l, i) => ({ id: `${uid}-l${i}`, href: l.href })) : []),
    ...(shown?.products ?? []).map((p, i) => ({ id: `${uid}-p${i}`, href: `/product/${p.handle}` })),
  ];
  const optId = (prefix: string, i: number) => `${uid}-${prefix}${i}`;
  const isActive = (id: string) => options[active]?.id === id;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(options.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].href);
      else if (term) go(`/search?q=${encodeURIComponent(term)}`);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (q) setQ("");
      else onClose();
    }
  };

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(options[active]?.id ?? "")?.scrollIntoView({ block: "nearest" });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const listId = `${uid}-list`;
  const nothing = term && data && !loading && data.total === 0 && data.links.length === 0;

  return (
    <div className={s.root} data-open={open} inert={!open}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.panel} role="dialog" aria-modal="true" aria-label="חיפוש מוצרים">
        <div className={`wrap ${s.top}`}>
          <Image src="/crest.png" alt="" width={36} height={36} className={s.crest} />
          <form
            className={s.form}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (term) go(`/search?q=${encodeURIComponent(term)}`);
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className={s.glass}>
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-4.8-4.8" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <label htmlFor={`${uid}-q`} className="sr-only">
              חיפוש מוצרים
            </label>
            <input
              ref={input}
              id={`${uid}-q`}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="חיפוש: חולצת בית, צעיף, ג׳קט…"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={options.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
            />
            {loading && <span className={s.spinner} aria-hidden="true" />}
          </form>
          <button type="button" className={s.close} onClick={onClose}>
            ביטול
          </button>
        </div>

        <div className={s.body} id={listId} role="listbox" aria-label="תוצאות חיפוש">
          <div className={`wrap ${s.grid}`}>
            <aside className={s.side}>
              {chips.length > 0 && (
                <div role="group" aria-label="חיפושים מוצעים" className={s.block}>
                  <p className={s.label}>חיפושים מוצעים</p>
                  <ul className={s.chips}>
                    {chips.map((c, i) => (
                      <li key={c} id={optId("c", i)} role="option" aria-selected={isActive(optId("c", i))} data-active={isActive(optId("c", i))} onClick={() => go(`/search?q=${encodeURIComponent(c)}`)}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {term && shown && shown.links.length > 0 && (
                <div role="group" aria-label="מחלקות" className={s.block}>
                  <p className={s.label}>מחלקות וקטגוריות</p>
                  <ul className={s.links}>
                    {shown.links.map((l, i) => (
                      <li key={l.href} id={optId("l", i)} role="option" aria-selected={isActive(optId("l", i))} data-active={isActive(optId("l", i))} onClick={() => go(l.href)}>
                        <span>{l.label}</span>
                        <span className={s.n}>{l.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {term && shown && shown.total > 0 && (
                <Link href={`/search?q=${encodeURIComponent(term)}`} className={s.all} onClick={onClose}>
                  לכל <span className="latin">{shown.total}</span> התוצאות ←
                </Link>
              )}
            </aside>

            <div className={s.results}>
              <p className={s.label} aria-live="polite">
                {!term ? "חדש בחנות · 26/27" : nothing ? `אין תוצאות ל״${term}״` : shown ? `מוצרים · ${shown.total}` : "מחפש…"}
              </p>
              {nothing ? (
                <div className={s.nothing}>
                  <p>נסו מילה אחרת, או אחד מאלה:</p>
                  <ul className={s.chips}>
                    {SUGGESTED.slice(0, 6).map((c) => (
                      <li key={c} onClick={() => setQ(c)}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className={s.products} data-loading={loading}>
                  {(shown?.products ?? []).map((p, i) => (
                    <li
                      key={p.handle}
                      id={optId("p", i)}
                      role="option"
                      aria-selected={isActive(optId("p", i))}
                      data-active={isActive(optId("p", i))}
                      data-soldout={!p.available}
                      style={{ "--i": i } as React.CSSProperties}
                      onClick={() => go(`/product/${p.handle}`)}
                    >
                      <span className={s.img}>{p.image && <Image src={p.image} alt="" fill sizes="(max-width: 700px) 45vw, 180px" />}</span>
                      <span className={s.title}>
                        <Highlight text={p.title} q={term} />
                      </span>
                      <span className={s.price}>
                        {p.available ? price(p.price) : "אזל מהמלאי"}
                        {p.available && p.compareAt && <s>{price(p.compareAt)}</s>}
                      </span>
                    </li>
                  ))}
                  {!shown && Array.from({ length: 8 }, (_, i) => <li key={i} className={s.skel} aria-hidden="true" />)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bold the typed words inside a title (plain substring match is enough here).
function Highlight({ text, q }: { text: string; q: string }) {
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}
