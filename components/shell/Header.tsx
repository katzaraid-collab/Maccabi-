"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CLUB_SITE } from "@/lib/config";
import s from "./Header.module.css";

const NAV = [
  { href: "/shop/new", label: "26/27" },
  { href: "/shop/kits", label: "תלבושות משחק" },
  { href: "/shop/training", label: "אימון וייצוג" },
  { href: "/shop/fashion", label: "אופנה ורטרו" },
  { href: "/shop/kids", label: "ילדים" },
  { href: "/shop/accessories", label: "אביזרים" },
  { href: "/shop/sale", label: "SALE", hot: true },
];

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [bump, setBump] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Pages that open on a dark hero get a transparent header until you scroll.
  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const solid = scrolled || !overHero || menu;

  return (
    <>
      <header className={s.header} data-solid={solid}>
        <div className={`wrap ${s.inner}`}>
          <button className={s.burger} onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-menu" aria-label="תפריט">
            <span />
            <span />
          </button>

          <Link href="/" className={s.logo} aria-label="מכבי תל אביב – חנות רשמית, לדף הבית">
            <Image src="/crest.png" alt="" width={48} height={48} priority />
            <span className={s.wordmark}>
              <strong>מכבי תל אביב</strong>
              <small>החנות הרשמית</small>
            </span>
          </Link>

          <nav className={s.nav} aria-label="ראשי">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={s.link} data-hot={n.hot} aria-current={pathname === n.href ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className={s.actions}>
            <button className={s.icon} onClick={() => setSearch((v) => !v)} aria-label="חיפוש" aria-expanded={search}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button className={s.icon} onClick={() => setOpen(true)} aria-label={`הסל שלי, ${count} פריטים`}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              {count > 0 && (
                <span className={s.badge} data-bump={bump}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <form
          className={s.search}
          data-open={search}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q")?.toString().trim();
            if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <div className="wrap">
            <label htmlFor="q" className="sr-only">
              חיפוש מוצרים
            </label>
            <input id="q" name="q" type="search" placeholder="חולצת בית, צעיף, שם שחקן…" autoComplete="off" tabIndex={search ? 0 : -1} />
          </div>
        </form>
      </header>

      <div id="mobile-menu" className={s.menu} data-open={menu} inert={!menu}>
        <nav aria-label="תפריט נייד">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} className={s.menuLink} style={{ "--i": i } as React.CSSProperties} data-hot={n.hot}>
              {n.label}
            </Link>
          ))}
        </nav>
        <a href={CLUB_SITE} className={s.menuClub}>
          לאתר המועדון ↗
        </a>
      </div>
    </>
  );
}
