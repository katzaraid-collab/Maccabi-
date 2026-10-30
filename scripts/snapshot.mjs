// Pulls the public catalog from the live Shopify store and writes a trimmed
// copy to data/catalog.snapshot.json. The app falls back to this file when
// the store can't be reached at build time.
import { writeFile } from "node:fs/promises";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "shop.maccabi-tlv.co.il";
const all = [];
for (let page = 1; page < 20; page++) {
  const res = await fetch(`https://${domain}/products.json?limit=250&page=${page}`);
  if (!res.ok) throw new Error(`products.json page ${page}: ${res.status}`);
  const { products } = await res.json();
  if (!products.length) break;
  all.push(...products);
}

const trimmed = all.map((p) => ({
  id: p.id,
  handle: p.handle,
  title: p.title,
  body_html: p.body_html,
  tags: p.tags,
  created_at: p.created_at,
  options: p.options.map((o) => ({ name: o.name, values: o.values })),
  images: p.images.map((i) => ({ src: i.src, width: i.width, height: i.height })),
  variants: p.variants.map((v) => ({
    id: v.id,
    title: v.title,
    option1: v.option1,
    price: v.price,
    compare_at_price: v.compare_at_price,
    available: v.available,
  })),
}));

await writeFile(new URL("../data/catalog.snapshot.json", import.meta.url), JSON.stringify(trimmed));
console.log(`Wrote ${trimmed.length} products`);
