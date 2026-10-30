"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/lib/types";
import { flyToCart } from "./fly";

type NewLine = Omit<CartLine, "key" | "qty">;

export type AddOptions = {
  /** Element the product was added from (a packshot or the button). Enables the
      "flying thumbnail" into the header cart icon. */
  from?: Element | null;
  /** Open the drawer after adding (default true). With false a toast confirms instead. */
  open?: boolean;
};

export type CartToast = { id: number; title: string; image: string | null; detail: string };

type CartState = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: NewLine, qty?: number, opts?: AddOptions) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  /** Put a removed line back where it was (undo). */
  restore: (line: CartLine, index: number) => void;
  /** Key of the most recently added line, for a one-shot highlight. */
  lastAdded: string | null;
  toast: CartToast | null;
  dismissToast: () => void;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "mta-cart-v1";
export const MAX_QTY = 99;

const keyOf = (l: NewLine) => [l.variantId, l.print?.name ?? "", l.print?.number ?? ""].join("|");

const isLine = (l: unknown): l is CartLine =>
  !!l && typeof l === "object" && typeof (l as CartLine).key === "string" && (l as CartLine).qty > 0;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [toast, setToast] = useState<CartToast | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setLines(saved.filter(isLine));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  // A cart changed in another tab updates this one.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const next = JSON.parse(e.newValue ?? "[]");
        if (Array.isArray(next)) setLines(next.filter(isLine));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback<CartState["add"]>((line, qty = 1, opts = {}) => {
    const key = keyOf(line);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...prev, { ...line, key, qty }];
    });
    setLastAdded(key);
    const shouldOpen = opts.open ?? true;
    if (opts.from && line.image) flyToCart(opts.from, line.image);
    if (shouldOpen) {
      setOpen(true);
    } else {
      const print = line.print ? `${line.print.name} ${line.print.number}`.trim() : "";
      const detail = [`מידה ${line.size}`, print].filter(Boolean).join(" · ");
      setToast({ id: ++toastId.current, title: line.title, image: line.image, detail });
    }
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    const q = Math.min(MAX_QTY, Math.floor(qty));
    setLines((prev) => (q <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: q } : l))));
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);

  const restore = useCallback((line: CartLine, index: number) => {
    setLines((prev) => {
      if (prev.some((l) => l.key === line.key)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, line);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      restore,
      lastAdded,
      toast,
      dismissToast,
    }),
    [lines, open, add, setQty, remove, restore, lastAdded, toast, dismissToast],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
