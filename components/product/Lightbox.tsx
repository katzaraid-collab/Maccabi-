"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductImage } from "@/lib/types";
import s from "./Lightbox.module.css";

type Props = { images: ProductImage[]; title: string; start: number; onClose: () => void };

export function Lightbox({ images, title, start, onClose }: Props) {
  const [i, setI] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const n = images.length;

  const go = (d: number) => {
    setZoomed(false);
    setI((v) => (v + d + n) % n);
  };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      root.style.overflow = prev;
      opener?.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // RTL: the next image sits to the left.
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowLeft") go(1);
    else if (e.key === "ArrowRight") go(-1);
    else if (e.key === "Tab") {
      const f = dialog.current?.querySelectorAll<HTMLElement>("button");
      if (!f?.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const st = swipe.current;
    swipe.current = null;
    if (!st || zoomed) return;
    const dx = e.clientX - st.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - st.y)) go(dx > 0 ? 1 : -1);
  };

  const onImageClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
    setZoomed((z) => !z);
  };

  return createPortal(
    <div className={s.overlay} ref={dialog} role="dialog" aria-modal="true" aria-label={`${title} – גלריה`} onKeyDown={onKeyDown}>
      <div className={s.bar}>
        <span className={s.count} dir="ltr">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
        <span className={s.title}>{title}</span>
        <button ref={close} type="button" className={s.close} onClick={onClose} aria-label="סגירת הגלריה">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      <div className={s.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <button
          type="button"
          className={s.frame}
          data-zoomed={zoomed}
          onClick={onImageClick}
          aria-label={zoomed ? "הקטנה" : "הגדלה"}
          key={images[i].src}
        >
          <Image src={images[i].src} alt={`${title} – תמונה ${i + 1}`} fill sizes="100vw" className={s.img} priority />
        </button>
        {n > 1 && (
          <>
            <button type="button" className={`${s.nav} ${s.prev}`} onClick={() => go(-1)} aria-label="התמונה הקודמת">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <button type="button" className={`${s.nav} ${s.next}`} onClick={() => go(1)} aria-label="התמונה הבאה">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className={s.thumbs}>
          {images.map((img, k) => (
            <button
              key={img.src}
              type="button"
              aria-label={`תמונה ${k + 1}`}
              aria-current={k === i}
              onClick={() => {
                setZoomed(false);
                setI(k);
              }}
            >
              <Image src={img.src} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
