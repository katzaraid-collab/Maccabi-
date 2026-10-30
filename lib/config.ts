// Shared between server and client.
export const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "shop.maccabi-tlv.co.il";
// The seven department slugs (see DEPARTMENTS in lib/catalog.ts). Middleware needs them
// without pulling in the catalog.
export const DEPARTMENT_SLUGS = ["new", "kits", "training", "fashion", "kids", "accessories", "sale"] as const;

export const CLUB_SITE = "https://www.maccabi-tlv.co.il";

export function checkoutUrl(lines: { variantId: number; qty: number }[]) {
  // The same variant can sit on two lines (with and without a print); the cart
  // permalink wants one entry per variant, so quantities are merged.
  const qty = new Map<number, number>();
  for (const l of lines) qty.set(l.variantId, (qty.get(l.variantId) ?? 0) + l.qty);
  return `https://${STORE_DOMAIN}/cart/${[...qty].map(([id, n]) => `${id}:${n}`).join(",")}`;
}

const ils = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const price = (n: number) => ils.format(n);
