"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { price } from "@/lib/config";
import s from "./RecentlyViewed.module.css";

type Seen = { handle: string; title: string; price: number; image: string | null };
const KEY = "mta-recent-v1";
const MAX = 12;

function read(): Seen[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.handle === "string") : [];
  } catch {
    return [];
  }
}

// Client-only: renders nothing on the server and until storage has been read.
export function RecentlyViewed({ current }: { current: Seen }) {
  const [list, setList] = useState<Seen[]>([]);

  useEffect(() => {
    const prev = read().filter((x) => x.handle !== current.handle);
    setList(prev.slice(0, 8));
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...prev].slice(0, MAX)));
    } catch {}
  }, [current]);

  if (!list.length) return null;

  return (
    <section className={s.section} aria-labelledby="recent-title">
      <div className={s.head}>
        <h2 id="recent-title" className={s.title}>
          צפית לאחרונה
        </h2>
        <span className={s.count}>{String(list.length).padStart(2, "0")}</span>
      </div>
      <ul className={s.row}>
        {list.map((p) => (
          <li key={p.handle}>
            <Link href={`/product/${p.handle}`} className={s.item}>
              <span className={s.media}>{p.image && <Image src={p.image} alt="" fill sizes="160px" />}</span>
              <span className={s.name}>{p.title}</span>
              <span className={s.price}>{price(p.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
