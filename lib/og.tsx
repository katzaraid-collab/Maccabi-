// Open Graph image renderers (next/og). Poster-like: hard edges, navy/paper,
// yellow only as a sharp accent, massive condensed Latin + heavy Hebrew.
//
// Satori (the engine behind next/og) has no bidi support: it lays Hebrew out
// left-to-right in logical order, which prints every word backwards. `rtl()`
// converts a line to visual order, and multi-line Hebrew is wrapped here
// (`wrap()`) because satori's own wrapping would run lines bottom-up.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Product } from "./types";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = "מכבי תל אביב – החנות הרשמית";

const NAVY = "#000e62";
const YELLOW = "#f9d716";
const PAPER = "#f4f2ea";
const INK = "#0b0b0f";

const KIT_CODE: Record<string, string> = { home: "HOME", away: "AWAY", third: "THIRD", fourth: "FOURTH", keeper: "GK" };

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
let fonts: Promise<Fonts> | null = null;

function loadFonts(): Promise<Fonts> {
  const dir = join(process.cwd(), "assets/fonts");
  fonts ??= Promise.all([
    readFile(join(dir, "Anton-Regular.ttf")),
    readFile(join(dir, "Heebo-Black.ttf")),
    readFile(join(dir, "Heebo-Medium.ttf")),
  ]).then(([anton, black, medium]) => [
    { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
    { name: "Heebo", data: black, weight: 900 as const, style: "normal" as const },
    { name: "Heebo", data: medium, weight: 500 as const, style: "normal" as const },
  ]);
  return fonts;
}

const LTR_RUN = /[A-Za-z0-9À-ɏ]+(?:[./:\-+×][A-Za-z0-9À-ɏ]+)*%?/g;
const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "<": ">", ">": "<", "«": "»", "»": "«" };

/** One line of RTL text (Hebrew with embedded Latin/numbers) in visual left-to-right order. */
export function rtl(line: string) {
  const runs: { text: string; ltr: boolean }[] = [];
  let last = 0;
  for (const m of line.matchAll(LTR_RUN)) {
    if (m.index! > last) runs.push({ text: line.slice(last, m.index), ltr: false });
    runs.push({ text: m[0], ltr: true });
    last = m.index! + m[0].length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), ltr: false });
  return runs
    .reverse()
    .map((r) => (r.ltr ? r.text : [...r.text].reverse().map((c) => MIRROR[c] ?? c).join("")))
    .join("");
}

/** Greedy word wrap by character budget (Heebo Black is near-monospaced enough for this). */
export function wrap(text: string, maxChars: number, maxLines = 3) {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (cur && (cur + " " + word).length > maxChars) {
      lines.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

async function asDataUrl(path: string) {
  const buf = await readFile(join(process.cwd(), path));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// Satori can't decode WebP, and Shopify serves WebP to clients that accept it,
// so the image is fetched here asking for JPEG/PNG only.
async function remoteImage(src: string, width: number) {
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    const res = await fetch(url, { headers: { Accept: "image/jpeg,image/png" }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!/jpe?g|png/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

const label = { fontFamily: "Anton", fontSize: 18, letterSpacing: 4, textTransform: "uppercase" as const };

/** Site-wide card: crest, "MACCABI" bleeding off the edge, yellow strip with the Hebrew line. */
export async function renderSiteOg() {
  const [f, crest] = await Promise.all([loadFonts(), asDataUrl("public/icons/icon-512.png")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: NAVY, color: PAPER, position: "relative", overflow: "hidden" }}>
        {/* Technical header strip on a visible rule */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "30px 48px 22px", borderBottom: `2px solid rgba(244,242,234,0.28)`, ...label }}>
          <span>N°1906 · TEL AVIV</span>
          <span style={{ color: YELLOW }}>OFFICIAL STORE · 26/27</span>
        </div>

        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          {/* Crest block, start side (right) */}
          <div style={{ position: "absolute", right: 48, top: 40, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={crest} width={170} height={170} alt="" />
          </div>

          {/* Hebrew line on a hard-edged yellow bar */}
          <div style={{ position: "absolute", right: 0, top: 236, display: "flex", background: YELLOW, color: NAVY, padding: "6px 48px 14px 40px" }}>
            <span style={{ fontFamily: "Heebo", fontWeight: 900, fontSize: 64, lineHeight: 1 }}>{rtl("החנות הרשמית")}</span>
          </div>

          <div style={{ position: "absolute", left: 48, top: 44, display: "flex", flexDirection: "column", ...label, fontSize: 16, color: "rgba(244,242,234,0.7)", lineHeight: 1.5 }}>
            <span>01 — KITS</span>
            <span>02 — PRINTING</span>
            <span>03 — 120 YEARS</span>
          </div>

          {/* Massive condensed wordmark, cropped by the bottom and left edges */}
          <div style={{ position: "absolute", left: -18, bottom: -86, display: "flex", fontFamily: "Anton", fontSize: 330, lineHeight: 1, letterSpacing: -6, color: PAPER }}>
            MACCABI
          </div>
        </div>

      </div>
    ),
    { ...OG_SIZE, fonts: await f },
  );
}

/**
 * Product card: white packshot panel (packshots are shot on white) against a
 * navy type panel with the title, a SKU-like code derived from the real
 * product id/kit, and the price in condensed numerals.
 */
export async function renderProductOg(product: Pick<Product, "id" | "title" | "price" | "compareAt" | "kit" | "images" | "available">) {
  const [f, crest, shot] = await Promise.all([
    loadFonts(),
    asDataUrl("public/icons/icon-192.png"),
    product.images[0] ? remoteImage(product.images[0].src, 900) : Promise.resolve(null),
  ]);
  const title = wrap(product.title, 15, 3);
  const season = /26[./]27/.test(product.title) ? "26/27" : null;
  const code = ["MTA", season, product.kit ? KIT_CODE[product.kit] : null, String(product.id).slice(-6)].filter(Boolean).join(" · ");
  const whole = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  // Size to the longest line so satori never re-wraps a (reversed) line itself.
  const longest = Math.max(...title.map((l) => l.length));
  const titleSize = Math.min(66, Math.floor(472 / (longest * 0.58)));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: NAVY }}>
        {/* Type panel: left in the image, i.e. the end side of an RTL layout */}
        <div style={{ width: 560, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 44px", color: PAPER, borderRight: `8px solid ${YELLOW}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "2px solid rgba(244,242,234,0.28)", ...label, fontSize: 16 }}>
            <span>{code}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={crest} width={56} height={56} alt="" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {title.map((line) => (
              <span key={line} style={{ fontFamily: "Heebo", fontWeight: 900, fontSize: titleSize, lineHeight: 1.02, whiteSpace: "nowrap" }}>
                {rtl(line)}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 18, borderTop: "2px solid rgba(244,242,234,0.28)" }}>
            <span style={{ ...label, fontSize: 16, color: "rgba(244,242,234,0.7)", paddingBottom: 10 }}>SHOP.MACCABI-TLV.CO.IL</span>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              {product.compareAt && (
                <span style={{ fontFamily: "Anton", fontSize: 40, color: "rgba(244,242,234,0.55)", textDecoration: "line-through", marginRight: 16, paddingBottom: 8 }}>{whole(product.compareAt)}</span>
              )}
              <span style={{ fontFamily: "Anton", fontSize: 96, lineHeight: 1, color: YELLOW }}>{whole(product.price)}</span>
              <span style={{ fontFamily: "Heebo", fontWeight: 900, fontSize: 44, color: YELLOW, marginLeft: 6, paddingBottom: 10 }}>₪</span>
            </div>
          </div>
        </div>

        {/* Packshot panel */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", position: "relative" }}>
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="" style={{ width: 600, height: 600, objectFit: "contain" }} />
          ) : (
            <span style={{ fontFamily: "Anton", fontSize: 220, color: NAVY }}>MTA</span>
          )}
          {!product.available && (
            <div style={{ position: "absolute", top: 32, right: 32, display: "flex", background: INK, color: PAPER, padding: "6px 14px 10px" }}>
              <span style={{ fontFamily: "Heebo", fontWeight: 900, fontSize: 30 }}>{rtl("אזל מהמלאי")}</span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await f },
  );
}
