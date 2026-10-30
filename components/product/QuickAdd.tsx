"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product, Variant } from "@/lib/types";
import { isSingle, sortedVariants } from "./sizes";
import s from "./ProductCard.module.css";

// Hover panel on product cards (fine pointers only): pick a size and it lands in the cart.
export function QuickAdd({ product }: { product: Product }) {
  const { add } = useCart();
  const [done, setDone] = useState<number | null>(null);
  const single = isSingle(product);
  const variants = sortedVariants(product);

  useEffect(() => {
    if (done === null) return;
    const t = setTimeout(() => setDone(null), 1600);
    return () => clearTimeout(t);
  }, [done]);

  const put = (v: Variant) => {
    add({
      variantId: v.id,
      handle: product.handle,
      title: product.title,
      size: single ? "" : v.size,
      price: v.price,
      image: product.images[0]?.src ?? null,
    });
    setDone(v.id);
  };

  return (
    <div className={s.quick} role="group" aria-label={`הוספה מהירה: ${product.title}`}>
      {single ? (
        <button type="button" className={s.quickOne} onClick={() => put(variants[0])}>
          {done ? "נוסף ✓" : "הוספה מהירה לסל"}
        </button>
      ) : (
        <>
          <span className={s.quickLabel}>{done ? "נוסף לסל ✓" : "הוספה מהירה · מידה"}</span>
          <div className={s.quickSizes}>
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!v.available}
                data-done={done === v.id}
                onClick={() => put(v)}
                aria-label={v.available ? `הוספה לסל במידה ${v.size}` : `מידה ${v.size} אזלה`}
                dir="ltr"
              >
                {v.size}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
