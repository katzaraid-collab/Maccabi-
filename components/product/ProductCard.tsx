import Image from "next/image";
import Link from "next/link";
import { price } from "@/lib/config";
import type { Product } from "@/lib/types";
import { QuickAdd } from "./QuickAdd";
import s from "./ProductCard.module.css";

export function ProductCard({ product, priority, index = 0 }: { product: Product; priority?: boolean; index?: number }) {
  const [a, b] = product.images;
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const isNew = /26[./]27/.test(product.title);
  const href = `/product/${product.handle}`;

  return (
    <article className={s.card} data-reveal style={{ "--d": `${(index % 4) * 0.06}s` } as React.CSSProperties} data-soldout={!product.available}>
      <div className={s.mediaWrap}>
        {/* The title link is the accessible one; the image link is a pointer convenience. */}
        <Link href={href} className={s.media} tabIndex={-1} aria-hidden="true">
          {a ? (
            <>
              <Image src={a.src} alt="" fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw" className={s.img} priority={priority} />
              {b && <Image src={b.src} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className={s.alt} />}
            </>
          ) : (
            <span className={s.placeholder}>MTA</span>
          )}
        </Link>
        <div className={s.flags}>
          {!product.available && <span className={s.flag}>אזל</span>}
          {product.available && off > 0 && <span className={`${s.flag} ${s.sale}`}>-{off}%</span>}
          {product.available && !off && isNew && <span className={`${s.flag} ${s.new}`}>חדש</span>}
          {product.kit && product.available && <span className={`${s.flag} ${s.print}`}>הדפסה אישית</span>}
        </div>
        {product.available && <QuickAdd product={product} />}
      </div>
      <div className={s.body}>
        <h3 className={s.title}>
          <Link href={href}>{product.title}</Link>
        </h3>
        <div className={s.price}>
          <strong>{price(product.price)}</strong>
          {product.compareAt && <s>{price(product.compareAt)}</s>}
        </div>
      </div>
    </article>
  );
}
