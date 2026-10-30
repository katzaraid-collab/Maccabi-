"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// One observer for the whole page: anything with data-reveal fades up when it
// enters the viewport. Elements that arrive in the same frame are staggered in
// reading order, so a row of cards ripples instead of popping at once.
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        hits.sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          // Top to bottom, then right to left (RTL reading order).
          return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : rb.right - ra.right;
        });
        hits.forEach((el, i) => {
          el.style.setProperty("--stagger", `${Math.min(i, 6) * 0.07}s`);
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    scan();
    // Client-rendered lists (filters) add nodes after mount.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}
