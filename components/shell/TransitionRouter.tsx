"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Progressive enhancement: same-origin link clicks that change the path run
// through the View Transitions API, so pages cross-fade instead of cutting.
// Browsers without it, reduced-motion users and modified clicks fall through to
// the normal next/link behaviour untouched. Opt a link out with data-no-transition.
export function TransitionRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // The new route has committed: let the browser snapshot it and animate.
  useEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduce.matches) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;

      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      const vt = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // Never hold the old frame hostage to a slow route.
            const timer = window.setTimeout(resolve, 1200);
            settle.current = () => {
              window.clearTimeout(timer);
              // Not requestAnimationFrame: rAF doesn't fire while a view transition
              // is pending, which froze the old page until Chrome timed out (~4 s).
              resolve();
            };
            router.push(href);
          }),
      );
      // An aborted or skipped transition (slow route, rapid clicks) is not an
      // error: navigation still completes, just without the animation.
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
      vt.updateCallbackDone.catch(() => {});
    };

    // Capture phase runs before next/link's handler, which then sees
    // defaultPrevented and stands down.
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
