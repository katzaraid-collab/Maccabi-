import Image from "next/image";
import Link from "next/link";
import { price } from "@/lib/config";
import type { ShopItem } from "./taxonomy";
import s from "./ShopCard.module.css";

// Grid card for collection + search pages: hard edges, product first,
// technical label underneath. `stagger` orders the entrance within a batch.
export function ShopCard({ item, priority, stagger = 0, wide }: { item: ShopItem; priority?: boolean; stagger?: number; wide?: boolean }) {
  const [a, b] = item.images;
  const off = item.compareAt ? Math.round((1 - item.price / item.compareAt) * 100) : 0;
  const sizes = wide ? "(max-width: 700px) 100vw, 50vw" : "(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw";
  const left = item.sizes.length > 1 ? item.inStock.length : 0;

  return (
    <Link href={`/product/${item.handle}`} className={s.card} data-soldout={!item.available} style={{ "--s": stagger } as React.CSSProperties}>
      <div className={s.media}>
        {a ? (
          <>
            <Image src={a} alt={item.title} fill sizes={sizes} className={s.img} priority={priority} />
            {b && <Image src={b} alt="" fill sizes={sizes} className={s.alt} />}
          </>
        ) : (
          <span className={s.placeholder} aria-hidden="true">
            MTA
          </span>
        )}
        {!item.available ? (
          <span className={s.flag}>אזל מהמלאי</span>
        ) : off > 0 ? (
          <span className={`${s.flag} ${s.sale}`}>
            <span className="latin" dir="ltr">-{off}%</span>
          </span>
        ) : null}
      </div>
      <div className={s.body}>
        {item.label && (
          <p className={s.label}>
            {item.label}
            {item.kit && item.available && <span className={s.print}> · הדפסה אישית</span>}
          </p>
        )}
        <h3 className={s.title}>{item.title}</h3>
        {left > 0 && left < item.sizes.length && <p className={s.meta}>{left} מידות זמינות</p>}
        <p className={s.price}>
          <strong>{price(item.price)}</strong>
          {item.compareAt && (
            <s>
              <span className="sr-only">במקום </span>
              {price(item.compareAt)}
            </s>
          )}
        </p>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className={s.skel} aria-hidden="true">
      <div className={s.media} />
      <div className={s.lines}>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
