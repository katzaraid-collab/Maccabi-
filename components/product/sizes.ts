import type { Product, Variant } from "@/lib/types";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];

export const sizeRank = (v: string) => {
  const i = SIZE_ORDER.indexOf(v.toUpperCase());
  if (i >= 0) return i;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 999 : 100 + n;
};

export const sortedVariants = (p: Product): Variant[] => [...p.variants].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

// Shopify's placeholder option for products without real options.
export const isSingle = (p: Product) => p.variants.length === 1;

export type SizeSystem = "adult" | "kids" | "socks" | null;

export function sizeSystem(p: Product): SizeSystem {
  if (isSingle(p)) return null;
  const sizes = p.variants.map((v) => v.size);
  if (sizes.every((s) => /^\d{2}-\d{2}$/.test(s))) return "socks";
  if (sizes.every((s) => /^\d{3}$/.test(s))) return "kids";
  if (sizes.some((s) => SIZE_ORDER.includes(s.toUpperCase()))) return "adult";
  return null;
}
