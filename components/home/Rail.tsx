"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";
import s from "./Rail.module.css";

export function Rail({ id, eyebrow, title, href, products }: { id?: string; eyebrow: string; title: string; href: string; products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  // RTL: scrolling "forward" moves toward negative scrollLeft.
  const nudge = (dir: 1 | -1) => track.current?.scrollBy({ left: -dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className={s.section} id={id} aria-label={title}>
      <div className={`wrap ${s.head}`}>
        <div data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display">{title}</h2>
        </div>
        <div className={s.controls}>
          <Link href={href} className={s.all}>
            לכל המוצרים
          </Link>
          <button onClick={() => nudge(-1)} aria-label="הקודם">
            →
          </button>
          <button onClick={() => nudge(1)} aria-label="הבא">
            ←
          </button>
        </div>
      </div>
      <div className={s.track} ref={track}>
        {products.map((p, i) => (
          <div key={p.id} className={s.cell}>
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
