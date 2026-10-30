// Quick page-quality audit with Playwright at phone size.
//
//   node scripts/audit.mjs [baseUrl]        (default http://localhost:3000)
//   AUDIT_WIDTH=1440 AUDIT_HEIGHT=900 node scripts/audit.mjs
//
// For each page: console errors, request count/bytes, LCP, CLS, and a few
// static a11y checks (img alt, accessible names, duplicate ids, h1 count).
// Exits 1 when a page has console errors or a11y failures, so it can gate CI.
import { createRequire } from "node:module";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    // Globally installed Playwright is only reachable through NODE_PATH, which ESM ignores.
    return createRequire(import.meta.url)("playwright");
  }
}

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const width = Number(process.env.AUDIT_WIDTH ?? 390);
const height = Number(process.env.AUDIT_HEIGHT ?? 844);

const PAGES = [
  ["home", "/"],
  ["department", "/shop/kits"],
  ["product", "/product/" + encodeURIComponent("חולצת-משחק-בית-puma-עונת-26-27-גבר")],
  ["search", "/search?q=" + encodeURIComponent("חולצה")],
];

// Installed before any page script runs, so early LCP/CLS entries are captured.
const OBSERVERS = `
  window.__audit = { lcp: 0, cls: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__audit.lcp = e.renderTime || e.loadTime || e.startTime; })
    .observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__audit.cls += e.value; })
    .observe({ type: "layout-shift", buffered: true });
`;

function staticChecks() {
  const name = (el) => {
    const label = el.getAttribute("aria-label") || el.getAttribute("title");
    if (label && label.trim()) return label.trim();
    const by = el.getAttribute("aria-labelledby");
    if (by) return by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
    // Visible text plus alt text of images inside (an icon link with a labelled img counts).
    const imgs = [...el.querySelectorAll("img[alt], svg[aria-label]")].map((i) => i.getAttribute("alt") || i.getAttribute("aria-label")).join(" ");
    return `${el.innerText || el.textContent || ""} ${imgs}`.trim();
  };
  // Opening tag only: enough to find the element in source.
  const describe = (el) => el.outerHTML.slice(0, el.outerHTML.indexOf(">") + 1).slice(0, 160);

  const imgNoAlt = [...document.querySelectorAll("img:not([alt])")].map((i) => i.currentSrc || i.src);
  const unnamed = [...document.querySelectorAll("a[href], button, [role=button], input:not([type=hidden]), select, textarea")]
    .filter((el) => {
      if (el.closest("[aria-hidden=true], [inert]")) return false;
      if (el.matches("input, select, textarea")) {
        return !(el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("placeholder") || el.getAttribute("title"));
      }
      return !name(el);
    })
    .map(describe);
  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] ?? 0) + 1;
  const dupIds = Object.entries(ids).filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
  return {
    imgNoAlt,
    unnamed,
    dupIds,
    h1: document.querySelectorAll("h1").length,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
  };
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const rows = [];
const details = [];
let failed = false;

for (const [label, path] of PAGES) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: width < 800, hasTouch: width < 800, locale: "he-IL" });
  const page = await context.newPage();
  await page.addInitScript(OBSERVERS);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  let requests = 0;
  let bytes = 0;
  page.on("requestfinished", async (req) => {
    requests++;
    try {
      const sizes = await req.sizes();
      bytes += sizes.responseBodySize + sizes.responseHeadersSize;
    } catch {}
  });

  const t0 = Date.now();
  const res = await page.goto(base + path, { waitUntil: "networkidle", timeout: 90_000 });
  const loadMs = Date.now() - t0;
  // Let late shifts land, then read the metrics before any scrolling.
  await page.waitForTimeout(1500);
  const perf = await page.evaluate(() => window.__audit);
  const checks = await page.evaluate(staticChecks);

  // Scroll through so lazy images below the fold get checked too.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(500);
  const late = await page.evaluate(staticChecks);
  checks.imgNoAlt = [...new Set([...checks.imgNoAlt, ...late.imgNoAlt])];
  checks.unnamed = [...new Set([...checks.unnamed, ...late.unnamed])];

  const pageFailed = errors.length > 0 || checks.imgNoAlt.length > 0 || checks.unnamed.length > 0 || checks.dupIds.length > 0 || checks.h1 !== 1;
  failed ||= pageFailed;
  rows.push({
    page: label,
    status: res?.status(),
    "load ms": loadMs,
    reqs: requests,
    KB: Math.round(bytes / 1024),
    "LCP ms": Math.round(perf.lcp),
    CLS: Number(perf.cls.toFixed(3)),
    "console err": errors.length,
    "img no alt": checks.imgNoAlt.length,
    unnamed: checks.unnamed.length,
    "dup ids": checks.dupIds.length,
    h1: checks.h1,
    ok: pageFailed ? "✗" : "✓",
  });
  if (pageFailed) details.push({ label, errors, ...checks });
  await context.close();
}

await browser.close();

console.log(`\nAudit ${base} @ ${width}x${height}\n`);
console.table(rows);
for (const d of details) {
  console.log(`\n${d.label}:`);
  if (d.errors.length) console.log("  console:", d.errors.slice(0, 5).map((e) => e.slice(0, 200)));
  if (d.imgNoAlt.length) console.log("  img without alt:", d.imgNoAlt.slice(0, 5));
  if (d.unnamed.length) console.log("  no accessible name:", d.unnamed.slice(0, 8));
  if (d.dupIds.length) console.log("  duplicate ids:", d.dupIds);
  if (d.h1 !== 1) console.log(`  h1 count: ${d.h1}`);
}
console.log("\nLCP/CLS come from a dev server unless you point this at `next start`; treat dev numbers as relative.");
process.exitCode = failed ? 1 : 0;
