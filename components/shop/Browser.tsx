"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CardSkeleton, ShopCard } from "./ShopCard";
import { AUDIENCES, KITS, PRICES, sizeRank, TYPES, type ShopItem } from "./taxonomy";
import s from "./Browser.module.css";

const SORTS = {
  featured: { label: "מומלץ", fn: null },
  new: { label: "החדשים ביותר", fn: (a: ShopItem, b: ShopItem) => b.createdAt.localeCompare(a.createdAt) },
  low: { label: "מחיר: מהנמוך לגבוה", fn: (a: ShopItem, b: ShopItem) => a.price - b.price },
  high: { label: "מחיר: מהגבוה לנמוך", fn: (a: ShopItem, b: ShopItem) => b.price - a.price },
} as const;
type SortKey = keyof typeof SORTS;

const PAGE = 24;
type Patch = Partial<Record<"type" | "kit" | "aud" | "size" | "price" | "all" | "sort", string | null>>;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Filters live in the URL (?type=shirts&size=M,L&sort=low) so a filtered view
// can be shared and the back button walks through filter changes. Native
// history.pushState keeps it instant: Next syncs useSearchParams without a
// server round trip.
export function Browser({ items }: { items: ShopItem[] }) {
  const sp = useSearchParams();
  const type = sp.get("type");
  const kit = sp.get("kit");
  const aud = sp.get("aud");
  const band = sp.get("price");
  const showAll = sp.get("all") === "1";
  const rawSort = sp.get("sort") ?? "featured";
  const sort: SortKey = rawSort in SORTS ? (rawSort as SortKey) : "featured";
  const sizeParam = sp.get("size") ?? "";
  const sizes = useMemo(() => sizeParam.split(",").filter(Boolean), [sizeParam]);

  const [limit, setLimit] = useState(PAGE);
  const [cols, setCols] = useState<2 | 4>(4);
  const [side, setSide] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [mobile, setMobile] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const storeKey = useRef("");

  // Restore per-viewer conveniences: grid density, and how far you'd loaded
  // before opening a product and coming back.
  useIsoLayoutEffect(() => {
    storeKey.current = `mta-more:${location.pathname}${location.search}`;
    try {
      if (localStorage.getItem("mta-cols") === "2") setCols(2);
      const n = Number(sessionStorage.getItem(storeKey.current));
      if (n > PAGE) setLimit(n);
    } catch {}
  }, []);

  useEffect(() => {
    const mq = matchMedia("(max-width: 900px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheet(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const closeSheet = () => {
    setSheet(false);
    toggleRef.current?.focus();
  };

  const update = (patch: Patch) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString().replace(/%2C/g, ",");
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
    setLimit(PAGE);
    storeKey.current = `mta-more:${location.pathname}${location.search}`;
    // Keep the top of the results in view when the bar is stuck.
    const el = top.current;
    if (el && !mobile && el.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
    }
  };

  const toggleSize = (z: string) => {
    const next = sizes.includes(z) ? sizes.filter((x) => x !== z) : [...sizes, z];
    update({ size: next.sort((a, b) => sizeRank(a) - sizeRank(b)).join(",") || null });
  };

  const pool = useMemo(() => (showAll ? items : items.filter((p) => p.available)), [items, showAll]);

  const filtered = useMemo(() => {
    const pb = PRICES.find((p) => p.key === band);
    const list = pool.filter(
      (p) =>
        (!type || p.type === type) &&
        (!kit || p.kit === kit) &&
        (!aud || p.aud.includes(aud)) &&
        (!pb || (p.price >= pb.min && p.price <= pb.max)) &&
        (!sizes.length || sizes.some((z) => (showAll ? p.sizes : p.inStock).includes(z))),
    );
    const fn = SORTS[sort].fn;
    return fn ? [...list].sort(fn) : list;
  }, [pool, type, kit, aud, band, sizes, showAll, sort]);

  // Facet options only list what this collection actually contains.
  const facets = useMemo(() => {
    const tally = (get: (p: ShopItem) => string | string[] | null) => {
      const m = new Map<string, number>();
      for (const p of pool) {
        const v = get(p);
        for (const k of Array.isArray(v) ? v : v ? [v] : []) m.set(k, (m.get(k) ?? 0) + 1);
      }
      return m;
    };
    const pick = (list: { key: string; label: string }[], m: Map<string, number>) =>
      list.filter((o) => m.get(o.key)).map((o) => ({ key: o.key, label: o.label, n: m.get(o.key)! }));
    const allSizes = new Set<string>();
    for (const p of pool) (showAll ? p.sizes : p.inStock).forEach((z) => allSizes.add(z));
    return {
      types: pick(TYPES, tally((p) => p.type)),
      kits: pick(KITS, tally((p) => p.kit)),
      auds: pick(AUDIENCES, tally((p) => p.aud)),
      prices: PRICES.map((b) => ({ ...b, n: pool.filter((p) => p.price >= b.min && p.price <= b.max).length })).filter((b) => b.n),
      sizes: [...allSizes].sort((a, b) => sizeRank(a) - sizeRank(b)),
    };
  }, [pool, showAll]);

  const soldOut = useMemo(() => items.filter((p) => !p.available).length, [items]);

  const active = [
    type && { k: "type", label: TYPES.find((t) => t.key === type)?.label ?? type, clear: { type: null } },
    kit && { k: "kit", label: `ערכת ${KITS.find((t) => t.key === kit)?.label ?? kit}`, clear: { kit: null } },
    aud && { k: "aud", label: AUDIENCES.find((t) => t.key === aud)?.label ?? aud, clear: { aud: null } },
    band && { k: "price", label: PRICES.find((t) => t.key === band)?.label ?? band, clear: { price: null } },
    ...sizes.map((z) => ({ k: `size-${z}`, label: `מידה ${z}`, clear: { size: sizes.filter((x) => x !== z).join(",") || null } })),
    showAll && { k: "all", label: "כולל פריטים שאזלו", clear: { all: null } },
  ].filter(Boolean) as { k: string; label: string; clear: Patch }[];

  const clearAll = () => update({ type: null, kit: null, aud: null, price: null, size: null, all: null });

  const more = () => {
    const n = limit + PAGE;
    setLimit(n);
    try {
      sessionStorage.setItem(storeKey.current, String(n));
    } catch {}
  };

  const setDensity = (c: 2 | 4) => {
    setCols(c);
    try {
      localStorage.setItem("mta-cols", String(c));
    } catch {}
  };

  const shown = filtered.slice(0, limit);

  const option = (key: string, label: string, n: number, on: boolean, toggle: () => void) => (
    <button key={key} type="button" className={s.opt} aria-pressed={on} onClick={toggle}>
      <span className={s.box} aria-hidden="true" />
      <span className={s.optLabel}>{label}</span>
      <span className={s.n}>{n}</span>
    </button>
  );
  const group = (title: string, children: React.ReactNode) => (
    <div className={s.group} role="group" aria-label={title}>
      <p className={s.legend}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className={s.root} ref={top}>
      <div className={s.bar}>
        <div className={s.barStart}>
          <button
            ref={toggleRef}
            type="button"
            className={s.toggle}
            aria-expanded={mobile ? sheet : side}
            aria-controls="shop-filters"
            onClick={() => (mobile ? setSheet(true) : setSide(!side))}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M3 7h11M18 7h3M3 17h3M10 17h11" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="8" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className={s.toggleText}>{mobile ? "סינון" : side ? "הסתרת סינון" : "הצגת סינון"}</span>
            {active.length > 0 && <span className={s.badge}>{active.length}</span>}
          </button>
          <p className={s.count} aria-live="polite">
            <span className="latin">{filtered.length}</span> מוצרים
          </p>
        </div>
        <div className={s.barEnd}>
          <div className={s.density} role="group" aria-label="צפיפות תצוגה">
            <button type="button" aria-pressed={cols === 2} onClick={() => setDensity(2)} aria-label="תצוגה גדולה">
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <rect x="1" y="2" width="8" height="16" fill="currentColor" />
                <rect x="11" y="2" width="8" height="16" fill="currentColor" />
              </svg>
            </button>
            <button type="button" aria-pressed={cols === 4} onClick={() => setDensity(4)} aria-label="תצוגה צפופה">
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                {[1, 6, 11, 16].map((x) => (
                  <rect key={x} x={x} y="2" width="3" height="16" fill="currentColor" />
                ))}
              </svg>
            </button>
          </div>
          <label className={s.sort}>
            <span className={s.sortLabel}>מיון</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={s.layout} data-side={side}>
        <aside
          id="shop-filters"
          ref={sheetRef}
          className={s.side}
          data-sheet={sheet}
          aria-label="סינון מוצרים"
          inert={mobile ? !sheet : !side}
          role={mobile ? "dialog" : undefined}
          aria-modal={mobile ? true : undefined}
        >
          <div className={s.sheetHead}>
            <strong>סינון</strong>
            <button type="button" onClick={closeSheet} className={s.close}>
              סגירה
            </button>
          </div>
          <div className={s.groups}>
            {facets.kits.length > 1 && group("ערכה", facets.kits.map((o) => option(o.key, o.label, o.n, kit === o.key, () => update({ kit: kit === o.key ? null : o.key }))))}
            {facets.types.length > 1 && group("סוג מוצר", facets.types.map((o) => option(o.key, o.label, o.n, type === o.key, () => update({ type: type === o.key ? null : o.key }))))}
            {facets.auds.length > 1 && group("למי", facets.auds.map((o) => option(o.key, o.label, o.n, aud === o.key, () => update({ aud: aud === o.key ? null : o.key }))))}
            {facets.sizes.length > 0 &&
              group(
                "מידה",
                <div className={s.sizes}>
                  {facets.sizes.map((z) => (
                    <button key={z} type="button" className={s.size} aria-pressed={sizes.includes(z)} onClick={() => toggleSize(z)}>
                      {z}
                    </button>
                  ))}
                </div>,
              )}
            {facets.prices.length > 1 && group("מחיר", facets.prices.map((o) => option(o.key, o.label, o.n, band === o.key, () => update({ price: band === o.key ? null : o.key }))))}
            {soldOut > 0 && group("זמינות", option("all", "כולל פריטים שאזלו", soldOut, showAll, () => update({ all: showAll ? null : "1" })))}
          </div>
          <div className={s.sheetFoot}>
            {active.length > 0 && (
              <button type="button" className={s.ghost} onClick={clearAll}>
                ניקוי
              </button>
            )}
            <button type="button" className={s.solid} onClick={closeSheet}>
              הצגת {filtered.length} מוצרים
            </button>
          </div>
        </aside>

        <div className={s.main}>
          {active.length > 0 && (
            <ul className={s.active} aria-label="סינונים פעילים">
              {active.map((a) => (
                <li key={a.k}>
                  <button type="button" onClick={() => update(a.clear)} aria-label={`הסרת סינון: ${a.label}`}>
                    {a.label}
                    <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className={s.clearAll} onClick={clearAll}>
                  ניקוי הכל
                </button>
              </li>
            </ul>
          )}

          {filtered.length === 0 ? (
            <div className={s.empty}>
              <p className={s.emptyBig}>אין התאמה.</p>
              <p>אף מוצר לא עונה על כל הסינונים יחד. נסו להסיר אחד מהם.</p>
              <button type="button" className={s.solid} onClick={clearAll}>
                ניקוי כל הסינונים
              </button>
            </div>
          ) : (
            <div className={s.grid} data-cols={cols}>
              {shown.map((p, i) => (
                <ShopCard key={p.id} item={p} priority={i < 4} stagger={Math.min(i % PAGE, 8)} wide={cols === 2} />
              ))}
            </div>
          )}

          {filtered.length > limit && (
            <div className={s.more}>
              <p>
                מוצגים <span className="latin">{shown.length}</span> מתוך <span className="latin">{filtered.length}</span>
              </p>
              <div className={s.progress} aria-hidden="true">
                <span style={{ transform: `scaleX(${shown.length / filtered.length})` }} />
              </div>
              <button type="button" className={s.ghost} onClick={more}>
                עוד {Math.min(PAGE, filtered.length - limit)} מוצרים
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrowserSkeleton() {
  return (
    <div className={s.root} aria-busy="true" aria-label="טוען מוצרים">
      <div className={s.bar}>
        <span className={s.skelBar} />
      </div>
      <div className={s.grid} data-cols={4} style={{ marginTop: 28 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
