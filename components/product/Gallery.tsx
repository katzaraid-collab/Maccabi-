"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Kit, ProductImage } from "@/lib/types";
import { Jersey } from "./Jersey";
import { Lightbox } from "./Lightbox";
import s from "./Gallery.module.css";

type Props = {
  images: ProductImage[];
  title: string;
  kit: Kit | null;
  view: "photo" | "print";
  onView: (v: "photo" | "print") => void;
  printName: string;
  printNumber: string;
};

// Follow-the-cursor zoom: the image scales from wherever the pointer is, mouse only.
function useZoom() {
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
    e.currentTarget.dataset.zoom = "true";
  };
  const onPointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.dataset.zoom = "false";
  };
  return { onPointerMove, onPointerLeave };
}

export function Gallery({ images, title, kit, view, onView, printName, printNumber }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const zoom = useZoom();
  const flipped = kit !== null && view === "print";
  const slides = Math.max(images.length, 1);

  // Mobile carousel: derive the active dot from scroll position (scrollLeft is negative in RTL).
  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    setSlide(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  }, []);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: -i * el.clientWidth, behavior: "smooth" });
  };

  // Switching to the print view on mobile should bring the first slide back.
  useEffect(() => {
    if (flipped && slide !== 0) goTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  const tile = (img: ProductImage, i: number, priority: boolean) => (
    <button
      type="button"
      className={s.zoomable}
      onClick={() => setOpen(i)}
      aria-label={`הגדלת תמונה ${i + 1} מתוך ${images.length}`}
      {...zoom}
    >
      <Image src={img.src} alt={i === 0 ? title : `${title} – תמונה ${i + 1}`} fill sizes="(max-width: 900px) 100vw, 60vw" priority={priority} className={s.img} />
    </button>
  );

  return (
    <div className={s.gallery} data-count={images.length}>
      <div className={s.track} ref={track} onScroll={onScroll}>
        <div className={`${s.tile} ${s.hero}`}>
          {kit ? (
            <div className={s.flip} data-flipped={flipped} data-kit={kit}>
              <div className={s.face} inert={flipped}>
                {images[0] && tile(images[0], 0, true)}
              </div>
              <div className={`${s.face} ${s.back}`} inert={!flipped} aria-hidden={!flipped}>
                <span className={s.backLabel}>תצוגה מקדימה · קונספט</span>
                <Jersey kit={kit} name={printName || "שם שלך"} number={printNumber || "10"} className={s.jersey} />
              </div>
            </div>
          ) : images[0] ? (
            tile(images[0], 0, true)
          ) : (
            <div className={s.empty} aria-hidden="true">
              MTA
            </div>
          )}
          {kit && (
            <div className={s.toggle} role="group" aria-label="תצוגת המוצר">
              <button type="button" aria-pressed={!flipped} onClick={() => onView("photo")}>
                חזית
              </button>
              <button type="button" aria-pressed={flipped} onClick={() => onView("print")}>
                הגב שלך
              </button>
            </div>
          )}
          <span className={s.index} aria-hidden="true" dir="ltr">
            01/{String(slides).padStart(2, "0")}
          </span>
        </div>
        {images.slice(1).map((img, j) => (
          <div key={img.src} className={s.tile}>
            {tile(img, j + 1, false)}
            <span className={s.index} aria-hidden="true" dir="ltr">
              {String(j + 2).padStart(2, "0")}/{String(slides).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className={s.dots} role="group" aria-label="מעבר בין תמונות">
          {images.map((img, i) => (
            <button key={img.src} type="button" aria-label={`תמונה ${i + 1}`} aria-current={slide === i} onClick={() => goTo(i)} />
          ))}
        </div>
      )}

      {open !== null && <Lightbox images={images} title={title} start={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
