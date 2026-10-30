import "server-only";
import { getCatalog } from "./catalog";
import type { Product } from "./types";

export type BundlePart = "shirt" | "shorts" | "socks";
export type BundleItem = { part: BundlePart; product: Product };

const PART: Record<BundlePart, RegExp> = {
  shirt: /^חולצת משחק/,
  shorts: /^מכנס משחק/,
  socks: /^גרבי משחק/,
};

// Audience lives in the title ("גבר"/"גברים", "נשים", "ילדים"); some handles disagree with
// their titles, so never trust the handle.
function audienceOf(title: string) {
  if (/ילדים|ילד/.test(title)) return "kids";
  if (/נשים/.test(title)) return "women";
  return "men";
}

const seasonOf = (title: string) => title.match(/(?<!\d)\d{2}[./]\d{2}(?!\d)/)?.[0].replace(".", "/") ?? null;
const partOf = (p: Product) => (Object.keys(PART) as BundlePart[]).find((k) => PART[k].test(p.title)) ?? null;

/**
 * The full kit a product belongs to: shirt + shorts + socks of the same kit, season and
 * audience. Women's shirts have no women's shorts/socks in the catalog, so they fall back to
 * the men's pieces. Returns [] unless at least two pieces exist (e.g. keeper shirts have none).
 */
export async function kitBundle(product: Product): Promise<BundleItem[]> {
  const part = partOf(product);
  if (!product.kit || !part) return [];
  const season = seasonOf(product.title);
  const audience = audienceOf(product.title);
  const catalog = await getCatalog();

  const pick = (want: BundlePart): Product | null => {
    if (want === part) return product;
    const pool = catalog.filter(
      (p) => p.kit === product.kit && partOf(p) === want && seasonOf(p.title) === season && p.images.length > 0,
    );
    const exact = pool.filter((p) => audienceOf(p.title) === audience);
    const fallback = audience === "women" ? pool.filter((p) => audienceOf(p.title) === "men") : [];
    const list = exact.length ? exact : fallback;
    return list.find((p) => p.available) ?? list[0] ?? null;
  };

  const items = (["shirt", "shorts", "socks"] as BundlePart[])
    .map((k) => ({ part: k, product: pick(k) }))
    .filter((x): x is BundleItem => x.product !== null);
  return items.length >= 2 ? items : [];
}
