"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { price } from "@/lib/config";
import type { Kit, Product } from "@/lib/types";
import { KIT_EN } from "./labels";
import { sortedVariants } from "./sizes";
import s from "./Bundle.module.css";

type Item = { part: "shirt" | "shorts" | "socks"; product: Product };
const PART_HE = { shirt: "חולצה", shorts: "מכנס", socks: "גרביים" } as const;

export function Bundle({ items, kit, current }: { items: Item[]; kit: Kit; current: string }) {
  const { add } = useCart();
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.product.handle, i.product.available])));
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  const chosen = items.filter((i) => on[i.product.handle] && i.product.available);
  const missing = chosen.filter((i) => !sizes[i.product.handle]);
  const total = chosen.reduce((n, i) => {
    const v = i.product.variants.find((x) => String(x.id) === sizes[i.product.handle]);
    return n + (v?.price ?? i.product.price);
  }, 0);

  const addAll = () => {
    setTried(true);
    if (!chosen.length || missing.length) {
      document.getElementById(`bundle-size-${missing[0]?.product.id}`)?.focus();
      return;
    }
    chosen.forEach((i, n) => {
      const v = i.product.variants.find((x) => String(x.id) === sizes[i.product.handle])!;
      const last = n === chosen.length - 1;
      add(
        { variantId: v.id, handle: i.product.handle, title: i.product.title, size: v.size, price: v.price, image: i.product.images[0]?.src ?? null },
        1,
        { open: last },
      );
    });
    setDone(true);
    setTried(false);
    setTimeout(() => setDone(false), 2200);
  };

  return (
    <section className={s.section} aria-labelledby="bundle-title" style={{ "--n": items.length } as React.CSSProperties}>
      <div className={s.head}>
        <p className={s.tech}>N°02 · FULL KIT · {KIT_EN[kit]}</p>
        <h2 id="bundle-title" className={s.title}>
          הקיט המלא
        </h2>
        <p className={s.lede}>
          {items.map((i) => PART_HE[i.part]).join(" + ")} מאותה תלבושת. מידה לכל פריט, סל אחד.
        </p>
      </div>

      <ol className={s.items}>
        {items.map((it, idx) => {
          const p = it.product;
          const variants = sortedVariants(p);
          const id = `bundle-size-${p.id}`;
          const err = tried && on[p.handle] && p.available && !sizes[p.handle];
          return (
            <li key={p.handle} className={s.item} data-off={!on[p.handle] || !p.available}>
              <div className={s.media}>
                <Image src={p.images[0].src} alt="" fill sizes="(max-width: 900px) 33vw, 260px" />
                <span className={s.idx}>{String(idx + 1).padStart(2, "0")}</span>
              </div>
              <div className={s.info}>
                <label className={s.check}>
                  <input
                    type="checkbox"
                    checked={Boolean(on[p.handle]) && p.available}
                    disabled={!p.available}
                    onChange={(e) => setOn((o) => ({ ...o, [p.handle]: e.target.checked }))}
                  />
                  <span aria-hidden="true" />
                  <b>{PART_HE[it.part]}</b>
                  <span className="sr-only">: לכלול בקיט</span>
                </label>
                {p.handle === current ? (
                  <span className={s.name}>{p.title}</span>
                ) : (
                  <Link href={`/product/${p.handle}`} className={s.name}>
                    {p.title}
                  </Link>
                )}
                <span className={s.price}>{p.available ? price(p.price) : "אזל מהמלאי"}</span>
                {p.available && (
                  <>
                    <label htmlFor={id} className="sr-only">
                      מידה ל{PART_HE[it.part]}
                    </label>
                    <select
                      id={id}
                      className={s.select}
                      value={sizes[p.handle] ?? ""}
                      disabled={!on[p.handle]}
                      aria-invalid={err}
                      onChange={(e) => setSizes((z) => ({ ...z, [p.handle]: e.target.value }))}
                    >
                      <option value="" disabled>
                        מידה
                      </option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={!v.available}>
                          {v.size}
                          {v.available ? "" : " · אזל"}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={s.foot}>
        <div className={s.total}>
          <span>{chosen.length} פריטים</span>
          <strong>{price(total)}</strong>
        </div>
        <button type="button" className={s.cta} onClick={addAll} disabled={!chosen.length} data-done={done}>
          {done ? "הקיט בסל ✓" : "הוסף הכל לסל"}
        </button>
        <p className={s.msg} aria-live="polite">
          {tried && missing.length ? `חסרה מידה: ${missing.map((m) => PART_HE[m.part]).join(", ")}` : ""}
        </p>
      </div>
    </section>
  );
}
