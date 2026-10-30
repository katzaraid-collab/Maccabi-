"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";
import s from "./Rail.module.css";

export function Rail({ id, eyebrow, title, href, products }: { id?: string; eyebrow: string; title: string; href: string; products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });

  // RTL: scrolling "forward" moves toward negative scrollLeft.
  const nudge = (dir: 1 | -1) => track.current?.scrollBy({ left: -dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  // Scroll-linked progress rule; written straight to the DOM so scrolling never re-renders.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? Math.min(1, Math.abs(el.scrollLeft) / max) : 1;
      const visible = max > 0 ? el.clientWidth / el.scrollWidth : 1;
      bar.current?.style.setProperty("--p", String(p));
      bar.current?.style.setProperty("--v", String(visible));
      setEdge((prev) => {
        const next = { start: p < 0.01, end: p > 0.99 };
        return prev.start === next.start && prev.end === next.end ? prev : next;
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className={s.section} id={id} aria-label={title}>
      <div className={`wrap ${s.head}`}>
        <div className={s.titles}>
          <p className={`tag-he ${s.eyebrow}`}>{eyebrow}</p>
          <h2 className={`display ${s.title}`} data-reveal>
            {title}
            <sup className={`idx ${s.count}`}>{String(products.length).padStart(2, "0")}</sup>
          </h2>
        </div>
        <div className={s.controls}>
          <Link href={href} className={s.all}>
            לכל המוצרים <span aria-hidden="true">←</span>
          </Link>
          <div className={s.arrows}>
            <button onClick={() => nudge(-1)} aria-label="הקודם" disabled={edge.start}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <button onClick={() => nudge(1)} aria-label="הבא" disabled={edge.end}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M16 10H4M9 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className={s.track} ref={track}>
        {products.map((p, i) => (
          <div key={p.id} className={s.cell}>
            <span className={`idx ${s.cellIdx}`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
      <div className="wrap">
        <span className={s.progress} ref={bar} aria-hidden="true" />
      </div>
    </section>
  );
}
