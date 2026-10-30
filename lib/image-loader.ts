// Shopify's CDN resizes on the fly and negotiates WebP/AVIF from the Accept
// header (it answers with `Vary: Accept`), so no `format` param is needed —
// verified with curl: `&format=webp` is ignored, the Accept header decides.
// `quality` is honoured and saves ~30% at 75 versus Shopify's default.
export default function shopifyLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Local files are served as-is; the width param only keeps Next satisfied.
  if (!src.includes("cdn.shopify.com") && !src.includes("/cdn/shop/")) return `${src}?w=${width}`;
  const url = new URL(src.startsWith("//") ? `https:${src}` : src);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  return url.toString();
}
