"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CLUB_SITE, price } from "@/lib/config";
import type { MenuDept } from "./Header";
import { SearchOverlay } from "./SearchOverlay";
import s from "./Header.module.css";

const OPEN_DELAY = 90; // hover intent: brushing past the nav shouldn't flash a panel
const CLOSE_DELAY = 160;

export function HeaderBar({ depts }: { depts: MenuDept[] }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [swap, setSwap] = useState(false);
  const [menu, setMenu] = useState(false);
  const [acc, setAcc] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [bump, setBump] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchBtn = useRef<HTMLButtonElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
    setMega(null);
  }, [pathname]);

  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    document.body.style.overflow = menu || search ? "hidden" : "";
  }, [menu, search]);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const show = useCallback(
    (slug: string, delay = 0) => {
      clear();
      const go = () => {
        setMega((cur) => {
          // Moving between departments swaps content without replaying the reveal.
          setSwap(cur !== null && cur !== slug);
          return slug;
        });
      };
      if (delay && mega === null) timer.current = setTimeout(go, delay);
      else go();
    },
    [mega],
  );

  const hide = (delay = CLOSE_DELAY) => {
    clear();
    timer.current = setTimeout(() => setMega(null), delay);
  };

  // Escape closes whatever is open and puts focus back where it came from.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mega) {
        const t = triggers.current[mega];
        setMega(null);
        t?.focus();
      } else if (menu) {
        setMenu(false);
        burger.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mega, menu]);

  // Mobile menu: move focus in, and keep Tab inside menu + burger.
  useEffect(() => {
    if (!menu) return;
    const el = menuRef.current;
    el?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const items = [burger.current, ...el.querySelectorAll<HTMLElement>("a,button")].filter((x): x is HTMLElement => !!x && x.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const overHero = pathname === "/" && !scrolled && !mega && !search;
  const tone = menu ? "menu" : overHero ? "hero" : "solid";

  return (
    <>
      <header className={s.header} data-tone={tone} data-mega={mega !== null} onPointerLeave={(e) => e.pointerType === "mouse" && hide()} onPointerEnter={clear}>
        <div className={`wrap ${s.inner}`}>
          <button
            ref={burger}
            className={s.burger}
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "סגירת תפריט" : "תפריט"}
          >
            <span />
            <span />
          </button>

          <Link href="/" className={s.logo} aria-label="מכבי תל אביב – חנות רשמית, לדף הבית">
            <Image src="/crest.png" alt="" width={44} height={44} priority />
            <span className={s.wordmark}>
              <strong>מכבי תל אביב</strong>
              <small className="latin">OFFICIAL STORE</small>
            </span>
          </Link>

          <nav className={s.nav} aria-label="ראשי">
            <ul>
              {depts.map((d) => {
                const open = mega === d.slug;
                return (
                  <li
                    key={d.slug}
                    onPointerEnter={(e) => e.pointerType === "mouse" && show(d.slug, OPEN_DELAY)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) open && setMega(null);
                    }}
                  >
                    <Link
                      href={d.href}
                      className={s.link}
                      data-hot={d.hot}
                      data-open={open}
                      aria-current={pathname === d.href ? "page" : undefined}
                      onClick={() => setMega(null)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          show(d.slug);
                          requestAnimationFrame(() => document.querySelector<HTMLElement>(`#mega-${d.slug} a`)?.focus());
                        }
                      }}
                    >
                      {d.label}
                    </Link>
                    <button
                      ref={(el) => {
                        triggers.current[d.slug] = el;
                      }}
                      type="button"
                      className={s.disclose}
                      aria-expanded={open}
                      aria-controls={`mega-${d.slug}`}
                      aria-label={`תפריט ${d.title}`}
                      onClick={() => (open ? setMega(null) : show(d.slug))}
                    >
                      <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
                        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <MegaPanel dept={d} open={open} swap={swap} onNavigate={() => setMega(null)} />
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={s.actions}>
            <button ref={searchBtn} className={s.searchBtn} onClick={() => setSearch(true)} aria-label="חיפוש" aria-haspopup="dialog" aria-expanded={search}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-4.8-4.8" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span className={s.searchHint} aria-hidden="true">
                חיפוש
              </span>
            </button>
            <button className={s.icon} onClick={() => setOpen(true)} aria-label={`הסל שלי, ${count} פריטים`} data-cart-trigger>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M5 8h14l-1.2 12H6.2L5 8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {count > 0 && (
                <span className={s.badge} data-bump={bump}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className={s.scrim} data-open={mega !== null} aria-hidden="true" onPointerEnter={() => hide(60)} />

      <div id="mobile-menu" ref={menuRef} className={s.menu} data-open={menu} inert={!menu} role="dialog" aria-modal="true" aria-label="תפריט">
        <nav aria-label="תפריט נייד" className={s.mNav}>
          <p className={s.mLabel}>החנות</p>
          <ul>
            {depts.map((d, i) => {
              const open = acc === d.slug;
              return (
                <li key={d.slug} className={s.mItem} style={{ "--i": i } as React.CSSProperties} data-open={open}>
                  <div className={s.mRow}>
                    <Link href={d.href} className={s.mLink} data-hot={d.hot}>
                      <span className={s.mTitle}>{d.title}</span>
                      <span className={s.mCount}>{d.count}</span>
                    </Link>
                    {d.cols.length > 0 && (
                      <button
                        type="button"
                        className={s.mToggle}
                        aria-expanded={open}
                        aria-controls={`m-${d.slug}`}
                        aria-label={`קטגוריות ב${d.title}`}
                        onClick={() => setAcc(open ? null : d.slug)}
                      >
                        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div id={`m-${d.slug}`} className={s.mPanel} inert={!open}>
                    <div>
                      {d.cols.map((c) => (
                        <div key={c.title} className={s.mCol}>
                          <p>{c.title}</p>
                          <ul>
                            {c.links.map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} onClick={() => setMenu(false)}>
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <Link href={d.href} className={s.mAll}>
                        לכל {d.count} הפריטים
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        {depts[0]?.photo && (
          <Link href={depts[0].href} className={s.mFeature}>
            <span className={s.mFeatureImg}>
              <Image src={depts[0].photo.src} alt="" fill sizes="(max-width: 600px) 100vw, 480px" style={{ objectPosition: depts[0].photo.pos }} />
            </span>
            <span className={s.mFeatureText}>
              <span className="tag">NEW SEASON · 26/27</span>
              <span>הקולקציה החדשה כבר כאן</span>
            </span>
          </Link>
        )}
        <div className={s.mFoot}>
          <button
            type="button"
            className={s.mSearch}
            onClick={() => {
              setMenu(false);
              setSearch(true);
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            חיפוש מוצרים
          </button>
          <a href={CLUB_SITE}>לאתר המועדון ↗</a>
        </div>
      </div>

      <SearchOverlay
        open={search}
        onClose={() => {
          setSearch(false);
          searchBtn.current?.focus({ preventScroll: true });
        }}
      />
    </>
  );
}

function MegaPanel({ dept: d, open, swap, onNavigate }: { dept: MenuDept; open: boolean; swap: boolean; onNavigate: () => void }) {
  return (
    <div id={`mega-${d.slug}`} className={s.mega} data-open={open} data-swap={swap} inert={!open} onClick={(e) => (e.target as Element).closest("a") && onNavigate()}>
      <div className={`wrap ${s.megaGrid}`}>
        <div className={s.megaHead}>
          <p className={`latin ${s.megaLatin}`}>{d.latin}</p>
          <p className={s.megaTitle}>{d.title}</p>
          <p className={s.megaKicker}>{d.kicker}</p>
          <Link href={d.href} className={s.megaAll}>
            לכל <span className="latin">{d.count}</span> הפריטים
            <span aria-hidden="true">←</span>
          </Link>
        </div>
        <div className={s.megaCols}>
          {d.cols.map((c, i) => (
            <div key={c.title} className={s.megaCol} style={{ "--c": i } as React.CSSProperties}>
              <p className={s.megaColTitle}>{c.title}</p>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>
                      {l.label}
                      <span className={s.megaCount}>{l.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={s.megaFeatures}>
          {d.photo && (
            <Link href={d.href} className={s.feature} tabIndex={-1} aria-hidden="true">
              <span className={s.featureImg} data-photo>
                <Image src={d.photo.src} alt="" fill sizes="280px" style={{ objectPosition: d.photo.pos }} />
              </span>
              <span className={s.featureLabel}>{d.title}</span>
            </Link>
          )}
          {d.product && (
            <Link href={d.product.href} className={s.feature}>
              <span className={s.featureImg}>
                <Image src={d.product.image} alt="" fill sizes="240px" />
              </span>
              <span className={s.featureTech}>{d.product.label}</span>
              <span className={s.featureTitle}>{d.product.title}</span>
              <span className={s.featurePrice}>
                {price(d.product.price)}
                {d.product.compareAt && <s>{price(d.product.compareAt)}</s>}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
