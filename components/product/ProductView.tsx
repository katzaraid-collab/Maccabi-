"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { price, STORE_DOMAIN } from "@/lib/config";
import type { Product } from "@/lib/types";
import { Gallery } from "./Gallery";
import { KIT_EN, techLabel } from "./labels";
import { nameError, NAME_MAX, numberError, PrintStudio } from "./PrintStudio";
import { SizeGuide } from "./SizeGuide";
import { isSingle, sizeSystem, sortedVariants } from "./sizes";
import s from "./ProductView.module.css";

export function ProductView({ product }: { product: Product }) {
  const { add } = useCart();
  const variants = useMemo(() => sortedVariants(product), [product]);
  const single = isSingle(product);
  const system = sizeSystem(product);
  const kit = product.kit;

  const [variantId, setVariantId] = useState<number | null>(single ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<"photo" | "print">("photo");
  const [wantPrint, setWantPrint] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [nudge, setNudge] = useState(0);
  const [added, setAdded] = useState(0);
  const [guide, setGuide] = useState(false);
  const [barVisible, setBarVisible] = useState(false);

  const sizesRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const shown = variant ?? variants.find((v) => v.price === product.price) ?? variants[0];
  const off = shown.compareAt && shown.compareAt > shown.price ? Math.round((1 - shown.price / shown.compareAt) * 100) : 0;
  const soldOutCount = variants.filter((v) => !v.available).length;

  // Arriving from the home print studio carries the name and number along.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("name");
    const num = params.get("number");
    if (kit && (n || num || window.location.hash === "#print")) {
      setWantPrint(true);
      setView("print");
      if (n) setName(n.slice(0, NAME_MAX));
      if (num) setNumber(num.replace(/\D/g, "").slice(0, 2));
    }
  }, [kit]);

  // The mobile buy bar only shows while the real add button is off screen.
  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(0), 2200);
    return () => clearTimeout(t);
  }, [added]);

  const printInvalid = wantPrint && Boolean(nameError(name) || numberError(number));

  const onAdd = () => {
    if (!variant) {
      setNudge((n) => n + 1);
      const el = sizesRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          el.animate([{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 380 });
      }
      return;
    }
    if (printInvalid) {
      nameRef.current?.focus();
      return;
    }
    add(
      {
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        size: single ? "" : variant.size,
        price: variant.price,
        image: product.images[0]?.src ?? null,
        print: wantPrint && kit && (name || number) ? { name: name.trim(), number } : undefined,
      },
      qty,
      { from: document.querySelector("[data-gallery-lead]") ?? addRef.current },
    );
    setAdded((n) => n + 1);
  };

  const togglePrint = (on: boolean) => {
    setWantPrint(on);
    setView(on ? "print" : "photo");
  };

  return (
    <>
      <div className={s.grid}>
        <Gallery
          images={product.images}
          title={product.title}
          kit={kit}
          view={view}
          onView={(v) => {
            setView(v);
            if (v === "print" && !wantPrint && product.available) setWantPrint(true);
          }}
          printName={wantPrint ? name : ""}
          printNumber={wantPrint ? number : ""}
        />

        <div className={s.panel}>
          <div className={s.sticky}>
            <p className={s.tech}>{techLabel(product)}</p>
            {kit && (
              <p className={s.kitWord} aria-hidden="true">
                {KIT_EN[kit]}
              </p>
            )}
            <h1 className={s.title}>{product.title}</h1>
            <div className={s.price}>
              <strong>{price(shown.price)}</strong>
              {off > 0 && (
                <>
                  <s aria-label={`במקום ${price(shown.compareAt!)}`}>{price(shown.compareAt!)}</s>
                  <span className={s.off}>-{off}%</span>
                </>
              )}
              {!product.available && <span className={s.soldTag}>אזל</span>}
            </div>

            {!single && (
              <div className={s.sizes} ref={sizesRef} data-nudge={nudge > 0 && !variant}>
                <div className={s.sizeHead}>
                  <span id="size-label">
                    מידה{variant && <b> · {variant.size}</b>}
                  </span>
                  <button type="button" className={s.guideBtn} onClick={() => setGuide(true)} aria-haspopup="dialog">
                    מדריך מידות
                  </button>
                </div>
                <div className={s.sizeGrid} role="radiogroup" aria-labelledby="size-label" aria-describedby="size-msg">
                  {variants.map((v) => (
                    <label key={v.id} className={s.size} data-disabled={!v.available}>
                      <input
                        type="radio"
                        name="size"
                        value={v.id}
                        disabled={!v.available}
                        checked={variantId === v.id}
                        onChange={() => setVariantId(v.id)}
                        aria-label={v.available ? v.size : `${v.size}, אזל`}
                      />
                      <span dir="ltr">{v.size}</span>
                    </label>
                  ))}
                </div>
                <p id="size-msg" className={s.sizeMsg} data-alert={nudge > 0 && !variant} aria-live="polite">
                  {nudge > 0 && !variant
                    ? "בחר מידה כדי להמשיך"
                    : !product.available
                      ? "כל המידות אזלו"
                      : soldOutCount > 0
                        ? "מידה מסומנת בקו אזלה"
                        : ""}
                </p>
              </div>
            )}

            {kit && product.available && (
              <PrintStudio
                ref={nameRef}
                kit={kit}
                on={wantPrint}
                onToggle={togglePrint}
                name={name}
                number={number}
                onName={setName}
                onNumber={setNumber}
                onFocusField={() => setView("print")}
              />
            )}

            <div className={s.buyRow}>
              {product.available && (
                <div className={s.qty} role="group" aria-label="כמות">
                  <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="הוספת יחידה" disabled={qty >= 10}>
                    +
                  </button>
                  <output aria-live="polite" aria-label={`כמות ${qty}`}>
                    {qty}
                  </output>
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="הפחתת יחידה" disabled={qty <= 1}>
                    −
                  </button>
                </div>
              )}
              <button ref={addRef} type="button" className={s.add} onClick={onAdd} disabled={!product.available} data-added={added > 0}>
                <span className={s.addLabel}>{!product.available ? "אזל מהמלאי" : "הוספה לסל"}</span>
                <span className={s.addDone} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
                  </svg>
                  נוסף לסל
                </span>
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {added > 0 ? `${product.title} נוסף לסל` : ""}
            </p>

            <ul className={s.facts}>
              <li>
                <span>01</span>מוצר רשמי של מועדון הכדורגל מכבי תל אביב
              </li>
              <li>
                <span>02</span>התשלום בקופה המאובטחת של החנות הרשמית
              </li>
            </ul>

            <div className={s.details}>
              {product.description && (
                <details open>
                  <summary>על המוצר</summary>
                  <p>{product.description}</p>
                </details>
              )}
              <details>
                <summary>משלוחים והחזרות</summary>
                <p>
                  כל הפרטים ב<a href={`https://${STORE_DOMAIN}/policies/shipping-policy`}>מדיניות המשלוחים</a> וב
                  <a href={`https://${STORE_DOMAIN}/policies/refund-policy`}>מדיניות ההחזרות</a> של החנות.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {product.available && (
        <div className={s.mobileBar} data-visible={barVisible} inert={!barVisible}>
          {product.images[0] && (
            <div className={s.barThumb}>
              <Image src={product.images[0].src} alt="" fill sizes="48px" />
            </div>
          )}
          <div className={s.barText}>
            <strong>{price(shown.price * qty)}</strong>
            <small data-alert={!variant && nudge > 0}>
              {variant ? (single ? product.title : `מידה ${variant.size}${qty > 1 ? ` · ×${qty}` : ""}`) : "בחר מידה"}
            </small>
          </div>
          <button type="button" className={s.barAdd} onClick={onAdd} data-added={added > 0}>
            {added > 0 ? "נוסף ✓" : variant ? "הוספה לסל" : "בחר מידה"}
          </button>
        </div>
      )}

      {guide && <SizeGuide system={system} onClose={() => setGuide(false)} />}
    </>
  );
}
