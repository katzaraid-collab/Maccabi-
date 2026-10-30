// Shared (server + client) shop vocabulary: how products are grouped for
// filters, the mega menu and search. Pure functions only, no server imports.
import type { Kit, Product } from "@/lib/types";

/* ---------- Hebrew-aware normalisation ---------- */

const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

// ג'קט / ג׳קט / גקט, 26/27 / 26.27, case and niqqud all collapse to one form.
export function norm(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[֑-ׇ]/g, "") // niqqud + cantillation
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/['"`׳״’‘“”.\/\-–—]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/* ---------- facets ---------- */

export type Facet = { key: string; label: string };

const firstWord = (p: Product) => norm(p.title).split(" ")[0] ?? "";
const hasTag = (p: Product, ...t: string[]) => t.some((x) => p.tags.includes(x));

type Rule = Facet & { test: (p: Product, w: string) => boolean };

export const TYPES: Rule[] = [
  { key: "shirts", label: "חולצות", test: (_, w) => ["חולצת", "חולצה", "פולו", "גופיית", "גופית"].includes(w) },
  { key: "shorts", label: "מכנסיים", test: (_, w) => ["מכנס", "מכנסי", "שורט"].includes(w) },
  { key: "jackets", label: "ג׳קטים ועליוניות", test: (_, w) => ["גקט", "מעיל", "עליונית", "קפוצונ", "קפוצון", "פוטר"].includes(w) },
  { key: "sets", label: "סטים וחליפות", test: (_, w) => ["סט", "חליפת"].includes(w) },
  { key: "socks", label: "גרביים", test: (_, w) => ["גרבי", "גרביימ"].includes(w) },
  { key: "headwear", label: "כובעים וצעיפים", test: (p, w) => ["כובע", "צעיפ", "בנדנה"].includes(w) || hasTag(p, "כובע", "כובעים", "צעיפים") },
  { key: "bags", label: "תיקים וארנקים", test: (p, w) => ["תיק", "ארנק", "נרתיק"].includes(w) || hasTag(p, "תיקים", "ארנקים") },
  { key: "phone", label: "סלולר ואוזניות", test: (p, w) => hasTag(p, "סלולר", "אוזניות") || ["כיסוי", "אוזניות"].includes(w) },
  { key: "play", label: "כדורים ומשחקים", test: (p) => hasTag(p, "כדורים", "משחקים", "בובות", "גיימינג") },
  { key: "home", label: "לבית ולרכב", test: (p) => hasTag(p, "לבית", "לרכב", "בקבוקים") },
  { key: "watches", label: "שעונים ותכשיטים", test: (p, w) => hasTag(p, "שעונים", "תכשיטים") || ["שעונ", "שרשרת"].includes(w) },
];

export const KITS: (Facet & { key: Kit; latin: string })[] = [
  { key: "home", label: "בית", latin: "HOME" },
  { key: "away", label: "חוץ", latin: "AWAY" },
  { key: "third", label: "שלישית", latin: "THIRD" },
  { key: "fourth", label: "רביעית", latin: "FOURTH" },
  { key: "keeper", label: "שוער", latin: "GK" },
];

export const AUDIENCES: Rule[] = [
  // Tags are inconsistent in the store, so titles are checked too.
  { key: "men", label: "גברים", test: (p) => p.title.includes("גבר") || hasTag(p, "גברים") },
  { key: "women", label: "נשים", test: (p) => p.title.includes("נשים") || hasTag(p, "נשים") },
  { key: "kids", label: "ילדים", test: (p) => /ילד|תינוק/.test(p.title) || hasTag(p, "ילדים", "לילדים", "ילד", "תינוקות") },
];

export const PRICES = [
  { key: "u100", label: "עד ₪100", min: 0, max: 100 },
  { key: "100-200", label: "₪100–200", min: 100.01, max: 200 },
  { key: "200-300", label: "₪200–300", min: 200.01, max: 300 },
  { key: "300", label: "מעל ₪300", min: 300.01, max: Infinity },
];

// Canonical size order: adult letters, then kids numbers, then ranges.
const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export function sizeRank(s: string) {
  const i = LETTERS.indexOf(s);
  if (i >= 0) return i;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 9999 : 100 + n;
}
const cleanSize = (s: string) => (s === "Default Title" ? null : s.replace(/^0(\d)$/, "$1").trim());

// Latin display names for posters and technical labels.
export const DEPT_LATIN: Record<string, string> = {
  new: "26/27",
  kits: "MATCH KITS",
  training: "TRAINING",
  fashion: "LIFESTYLE",
  kids: "JUNIOR",
  accessories: "GEAR",
  sale: "SALE",
};

/* ---------- slim client item ---------- */

// What a grid card and the filters need, nothing more: keeps 300+ products
// cheap to serialise and filter in the browser.
export type ShopItem = {
  id: number;
  handle: string;
  title: string;
  price: number;
  compareAt: number | null;
  available: boolean;
  images: string[];
  kit: Kit | null;
  type: string | null;
  aud: string[];
  sizes: string[]; // every size offered
  inStock: string[]; // sizes currently available
  createdAt: string;
  label: string; // technical line, e.g. "26/27 · HOME · PUMA"
};

export function typeOf(p: Product) {
  const w = firstWord(p);
  return TYPES.find((t) => t.test(p, w))?.key ?? null;
}

export function techLabel(p: Product) {
  const bits: string[] = [];
  const season = p.title.match(/(\d\d)[./](\d\d)/);
  if (season) bits.push(`${season[1]}/${season[2]}`);
  const kit = KITS.find((k) => k.key === p.kit);
  if (kit) bits.push(kit.latin);
  else {
    const t = TYPES.find((x) => x.key === typeOf(p));
    if (t) bits.push(t.label);
  }
  if (/puma/i.test(p.title)) bits.push("PUMA");
  return bits.join(" · ");
}

export function toItem(p: Product): ShopItem {
  const sizes = new Set<string>();
  const inStock = new Set<string>();
  for (const v of p.variants) {
    const s = cleanSize(v.size);
    if (!s) continue;
    sizes.add(s);
    if (v.available) inStock.add(s);
  }
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: p.price,
    compareAt: p.compareAt,
    available: p.available,
    images: p.images.slice(0, 2).map((i) => i.src),
    kit: p.kit,
    type: typeOf(p),
    aud: AUDIENCES.filter((a) => a.test(p, "")).map((a) => a.key),
    sizes: [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b)),
    inStock: [...inStock],
    createdAt: p.createdAt,
    label: techLabel(p),
  };
}

/* ---------- search ---------- */

// A few Latin words fans actually type.
const SYNONYMS: Record<string, string> = {
  home: "בית",
  away: "חוצ",
  third: "שלישית",
  fourth: "רביעית",
  keeper: "שוער",
  gk: "שוער",
  goalkeeper: "שוער",
  jersey: "חולצת",
  shirt: "חולצת",
  scarf: "צעיפ",
  hat: "כובע",
  cap: "כובע",
  kids: "ילד",
  retro: "רטרו",
  maccabi: "מכבי",
};

export function queryWords(q: string) {
  return norm(q)
    .split(" ")
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w);
}

const index = new WeakMap<Product, { title: string; hay: string }>();
function indexed(p: Product) {
  let hit = index.get(p);
  if (!hit) {
    const kit = KITS.find((k) => k.key === p.kit);
    const type = TYPES.find((t) => t.key === typeOf(p));
    const title = norm(p.title);
    hit = { title: ` ${title}`, hay: ` ${title} ${norm(p.tags.join(" "))} ${kit ? norm(kit.label) : ""} ${type ? norm(type.label) : ""}` };
    index.set(p, hit);
  }
  return hit;
}

const PREFIXES = ["ה", "ו", "ל", "ב", "מ", "ש"];

// Every word must match somewhere; title hits (especially word starts) rank first.
export function searchProducts(list: Product[], q: string) {
  const words = queryWords(q);
  if (!words.length) return [];
  const scored: { p: Product; score: number }[] = [];
  for (const p of list) {
    const { title, hay } = indexed(p);
    let score = 0;
    let ok = true;
    for (const w of words) {
      // Match at a word start, allowing one attached Hebrew prefix (ה/ו/ל/ב/מ/ש).
      const starts = (s: string) => s.includes(` ${w}`) || PREFIXES.some((x) => s.includes(` ${x}${w}`));
      if (!starts(title) && !hay.includes(` ${w}`)) {
        ok = false;
        break;
      }
      score += title.startsWith(` ${w}`) ? 4 : starts(title) ? 3 : 1;
    }
    if (ok) scored.push({ p, score: score + (p.available ? 2 : 0) });
  }
  return scored
    .sort((a, b) => b.score - a.score || b.p.createdAt.localeCompare(a.p.createdAt))
    .map((x) => x.p);
}

/* ---------- department photography ---------- */

// Official club photos (public/media). `pos` keeps faces in frame when cropped.
export type DeptPhoto = { src: string; alt: string; pos: string; tall?: boolean };
export const DEPT_PHOTO: Record<string, DeptPhoto> = {
  new: { src: "/media/trophy-celebration.webp", alt: "שחקני מכבי בצהוב מניפים גביע מול היציע", pos: "50% 30%" },
  kits: { src: "/media/match-home-1.webp", alt: "שחקן מכבי בתלבושת הבית הצהובה עם הכדור בבלומפילד", pos: "62% 40%" },
  training: { src: "/media/player-fourth.webp", alt: "שחקן מכבי בחולצה הכחולה", pos: "50% 6%" },
  fashion: { src: "/media/lifestyle-editorial.webp", alt: "שלושה גברים בצילומי אופנה של המועדון", pos: "60% 35%" },
  kids: { src: "/media/lifestyle-kid.webp", alt: "ילד בחולצה צהובה של מכבי", pos: "30% 30%" },
  accessories: { src: "/media/stadium-tifo.webp", alt: "כוריאוגרפיה צהובה-כחולה של האוהדים על היציע", pos: "50% 50%" },
  sale: { src: "/media/match-fans.webp", alt: "שוער מכבי בועט, מאחוריו שלט אוהדים", pos: "45% 40%" },
};

// Suggested searches (curated, not analytics): each returns results today.
export const SUGGESTED = ["חולצת בית", "חולצת חוץ", "ג׳קט", "שוער", "צעיף", "כובע", "רטרו", "ילדים", "תיק"];
