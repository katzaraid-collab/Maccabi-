// Shared between server and client.
export const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "shop.maccabi-tlv.co.il";
export const CLUB_SITE = "https://www.maccabi-tlv.co.il";

export function checkoutUrl(lines: { variantId: number; qty: number }[]) {
  return `https://${STORE_DOMAIN}/cart/${lines.map((l) => `${l.variantId}:${l.qty}`).join(",")}`;
}

const ils = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const price = (n: number) => ils.format(n);
