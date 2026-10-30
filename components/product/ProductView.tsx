"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { price } from "@/lib/config";
import { KIT_THEME } from "@/lib/kits";
import type { Product } from "@/lib/types";
import { Jersey } from "./Jersey";
import s from "./ProductView.module.css";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
const sizeRank = (v: string) => {
  const i = SIZE_ORDER.indexOf(v.toUpperCase());
  if (i >= 0) return i;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 999 : 100 + n;
};

export function ProductView({ product }: { product: Product }) {
  const { add } = useCart();
  const params = useSearchParams();
  const variants = useMemo(() => [...product.variants].sort((a, b) => sizeRank(a.size) - sizeRank(b.size)), [product.variants]);
  const single = variants.length === 1;
  const [variantId, setVariantId] = useState<number | null>(single ? variants[0].id : null);
  const [active, setActive] = useState(0);
  const [view, setView] = useState<"photo" | "print">("photo");
  const [wantPrint, setWantPrint] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [nudge, setNudge] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const shown = variant ?? variants.find((v) => v.price === product.price)!;
  const kit = product.kit;

  // Arriving from the home print studio carries the name and number along.
  useEffect(() => {
    const n = params.get("name");
    const num = params.get("number");
    if (kit && (n || num || window.location.hash === "#print")) {
      setWantPrint(true);
      setView("print");
      if (n) setName(n.slice(0, 12));
      if (num) setNumber(num.replace(/\D/g, "").slice(0, 2));
    }
  }, [params, kit]);

  const onAdd = () => {
    if (!variant) {
      setNudge(true);
      setTimeout(() => setNudge(false), 600);
      return;
    }
    add({
      variantId: variant.id,
      handle: product.handle,
      title: product.title,
      size: variant.size,
      price: variant.price,
      image: product.images[0]?.src ?? null,
      print: wantPrint && kit && (name || number) ? { name, number } : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const off = shown.compareAt && shown.compareAt > shown.price ? Math.round((1 - shown.price / shown.compareAt) * 100) : 0;

  return (
    <div className={s.grid}>
      <div className={s.gallery}>
        <div className={s.stage} style={kit ? ({ "--bg": KIT_THEME[kit].bg } as React.CSSProperties) : undefined} data-view={view}>
          {view === "print" && kit ? (
            <Jersey kit={kit} name={name || "שם שלך"} number={number || "10"} className={s.jersey} />
          ) : product.images[active] ? (
            <Image
              key={product.images[active].src}
              src={product.images[active].src}
              alt={product.title}
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
              className={s.main}
            />
          ) : null}
          {kit && (
            <div className={s.viewToggle} role="tablist" aria-label="תצוגה">
              <button role="tab" aria-selected={view === "photo"} onClick={() => setView("photo")}>
                תמונה
              </button>
              <button role="tab" aria-selected={view === "print"} onClick={() => setView("print")}>
                הגב שלך
              </button>
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className={s.thumbs}>
            {product.images.map((img, i) => (
              <button
                key={img.src}
                className={s.thumb}
                aria-label={`תמונה ${i + 1}`}
                aria-pressed={view === "photo" && i === active}
                onClick={() => {
                  setActive(i);
                  setView("photo");
                }}
              >
                <Image src={img.src} alt="" fill sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={s.panel}>
        <div className={s.sticky}>
          {kit && <p className="eyebrow">חולצת {KIT_THEME[kit].label} · 26/27</p>}
          <h1 className={s.title}>{product.title}</h1>
          <div className={s.price}>
            <strong>{price(shown.price)}</strong>
            {off > 0 && (
              <>
                <s>{price(shown.compareAt!)}</s>
                <span className={s.off}>-{off}%</span>
              </>
            )}
          </div>

          {!single && (
            <fieldset className={s.sizes} data-nudge={nudge}>
              <legend>
                מידה
                {variant && <span> · {variant.size}</span>}
              </legend>
              <div className={s.sizeGrid}>
                {variants.map((v) => (
                  <label key={v.id} className={s.size} data-disabled={!v.available}>
                    <input
                      type="radio"
                      name="size"
                      value={v.id}
                      disabled={!v.available}
                      checked={variantId === v.id}
                      onChange={() => setVariantId(v.id)}
                    />
                    <span>{v.size}</span>
                  </label>
                ))}
              </div>
              {nudge && <p className={s.hint} role="alert">בחר מידה כדי להמשיך</p>}
            </fieldset>
          )}

          {kit && product.available && (
            <div className={s.print} id="print">
              <label className={s.printToggle}>
                <input
                  type="checkbox"
                  checked={wantPrint}
                  onChange={(e) => {
                    setWantPrint(e.target.checked);
                    setView(e.target.checked ? "print" : "photo");
                  }}
                />
                <span className={s.switch} aria-hidden="true" />
                <span>
                  <strong>הדפסת שם ומספר</strong>
                  <small>רואים את התוצאה בזמן אמת</small>
                </span>
              </label>
              {wantPrint && (
                <div className={s.printFields}>
                  <label>
                    <span>שם</span>
                    <input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} onFocus={() => setView("print")} maxLength={12} placeholder="עד 12 תווים" />
                  </label>
                  <label>
                    <span>מספר</span>
                    <input
                      value={number}
                      onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      onFocus={() => setView("print")}
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="0–99"
                      dir="ltr"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          <button className={`btn btn-block ${s.add}`} onClick={onAdd} disabled={!product.available} data-added={added}>
            {!product.available ? "אזל מהמלאי" : added ? "נוסף לסל ✓" : "הוספה לסל"}
          </button>

          <ul className={s.perks}>
            <li>תשלום מאובטח · Apple Pay · Google Pay</li>
            <li>מוצר רשמי של מועדון הכדורגל מכבי תל אביב</li>
          </ul>

          {product.description && (
            <details className={s.details} open>
              <summary>על המוצר</summary>
              <p>{product.description}</p>
            </details>
          )}
          <details className={s.details}>
            <summary>משלוחים והחזרות</summary>
            <p>
              כל הפרטים ב
              <a href="https://shop.maccabi-tlv.co.il/policies/shipping-policy">מדיניות המשלוחים</a> וב
              <a href="https://shop.maccabi-tlv.co.il/policies/refund-policy">מדיניות ההחזרות</a>.
            </p>
          </details>
        </div>
      </div>

      {product.available && (
        <div className={s.mobileBar}>
          <div>
            <strong>{price(shown.price)}</strong>
            <small>{variant ? `מידה ${variant.size}` : single ? "" : "בחר מידה"}</small>
          </div>
          <button className="btn" onClick={onAdd}>
            {added ? "נוסף ✓" : "הוספה לסל"}
          </button>
        </div>
      )}
    </div>
  );
}
