// Shopify CDN images accept a width parameter and resize server-side.
export default function shopifyLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.includes("cdn.shopify.com") && !src.includes("/cdn/shop/")) return src;
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  return url.toString();
}
