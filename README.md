# מכבי תל אביב – החנות הרשמית (קונספט)

**בקצרה:** חזית חנות קונספט לחנות הרשמית של מועדון הכדורגל מכבי תל אביב, שנבנתה כהצעה למועדון. היא קוראת את הקטלוג האמיתי מהחנות הקיימת ב-Shopify ‏(shop.maccabi-tlv.co.il), מציגה אותו בעיצוב חדש בעברית ומימין לשמאל, ושולחת את הקונה לקופה האמיתית של Shopify. אין כאן מערכת הזמנות משלנו: מחירים, מלאי ותמונות מגיעים מהחנות החיה, ואם היא לא זמינה האתר עובר לעותק שמור של הקטלוג. חלק מהיכולות (למשל הדפסת שם ומספר בסל) הן קונספט בלבד עד לחיבור ל-Storefront API.

---

## What this is

A concept storefront for the Maccabi Tel Aviv FC club shop, built to pitch a new front end to the club. It replaces the generic Shopify theme with a Hebrew-first, RTL, editorial design while keeping Shopify as the commerce backend.

- Real catalog: ~470 live products read from the store's public `products.json`.
- Real checkout: the cart hands off to Shopify through a cart permalink.
- No backend, no database, no secrets required.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components), React 19 |
| Language | TypeScript (strict) |
| Styling | CSS Modules + design tokens in `app/globals.css` (no Tailwind) |
| Fonts | Heebo (Hebrew + Latin body) and Anton (Latin display) via `next/font`; TTFs vendored in `assets/fonts/` for OG images |
| Images | `next/image` with a custom loader that resizes on Shopify's CDN (`lib/image-loader.ts`) |
| Social images | `next/og` (`app/opengraph-image.tsx`, renderers in `lib/og.tsx`) |
| Tooling | `tsc`, Playwright (audit script, not a dependency) |

## How data flows

```
shop.maccabi-tlv.co.il/products.json ──fetch (tag "catalog", 15 min)──┐
                                                                       ├─> lib/catalog.ts ─> Server Components ─> HTML/RSC
data/catalog.snapshot.json (only if the store is unreachable) ─────────┘          │
                                                                                   └─> unstable_cache (15 min) + React cache() per request
Cart (client, localStorage) ──> https://shop.maccabi-tlv.co.il/cart/<variant>:<qty>,... ──> Shopify checkout
```

1. **Catalog.** `lib/catalog.ts` (server-only) fetches `products.json` pages in parallel, normalizes them into the `Product` type (`lib/types.ts`) and caches the result in the Next data cache for 15 minutes under the tag `catalog`. Within one request, `getCatalog()` is memoized with React `cache()`, so the page, its metadata and its OG image share one result.
2. **ISR.** Pages export `revalidate = 900`, so they are regenerated at most every 15 minutes. To refresh immediately (e.g. from a Shopify product webhook), call `revalidateTag("catalog")` in a route handler.
3. **Snapshot fallback.** If the store can't be reached (offline dev, CI, outage), the app loads `data/catalog.snapshot.json`, a trimmed copy of the feed. Refresh it with `npm run snapshot`.
4. **Departments.** The live store has 100+ overlapping collections; `DEPARTMENTS` in `lib/catalog.ts` maps its tags onto seven curated doors (`/shop/new`, `/shop/kits`, …).
5. **Images.** Shopify's CDN resizes from the `width` param and negotiates WebP/AVIF from the browser's `Accept` header (`Vary: Accept`); the loader also sends `quality`.
6. **Checkout.** The cart lives in the browser. "Checkout" builds a Shopify cart permalink (`checkoutUrl()` in `lib/config.ts`) and the customer finishes on the real Shopify checkout.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run snapshot` | Re-download the live catalog into `data/catalog.snapshot.json` |
| `node scripts/audit.mjs [baseUrl]` | Playwright audit of home, a department, a product and search at 390×844: console errors, requests/bytes, LCP, CLS, images without alt, unnamed controls, duplicate ids, h1 count. Exits 1 on failures. `AUDIT_WIDTH`/`AUDIT_HEIGHT` change the viewport. Needs Playwright installed (globally or locally). |

Environment variables are documented in `.env.example`; none are required.

## Deploying

Vercel builds the `main` branch for production (`wip/shop-v1` is the working branch and is pushed to `main` when it should go live). Previews stay out of search engines unless `NEXT_PUBLIC_ALLOW_INDEX=1` is set, and `metadataBase`/canonicals follow `VERCEL_PROJECT_PRODUCTION_URL`, or `NEXT_PUBLIC_SITE_URL` when it is set.

## SEO and sharing

- `app/sitemap.ts`: home, departments and every product (with `lastModified`, main image).
- `app/robots.ts`: allows everything except `/search` and `/api/`.
- `app/manifest.ts`: PWA manifest (RTL, navy theme), icons in `public/icons/`.
- `components/seo/SiteJsonLd.tsx`: Organization + WebSite (with SearchAction → `/search?q=`) JSON-LD; `lib/seo.ts` also has `breadcrumbJsonLd()`, `canonical()` and `absoluteUrl()`.
- OG images: `app/opengraph-image.tsx` for the site, `renderProductOg()` in `lib/og.tsx` for products. Satori has no bidi support, so `lib/og.tsx` reorders Hebrew lines (`rtl()`) and wraps them itself (`wrap()`).
- `next.config.ts` sets security headers (nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, HSTS) and cache headers for unhashed public assets.

## Plugging in the Shopify Storefront API later

The public `products.json` feed is read-only and has no cart. Moving to the [Storefront API](https://shopify.dev/docs/api/storefront) unlocks the parts that are concept-only today:

1. **Catalog.** Replace `fetchLive()` in `lib/catalog.ts` with a GraphQL `products` query (paginate with cursors) and map the result into the same `Product` shape. Everything that imports `getCatalog()`/`getProduct()` keeps working. Keep the snapshot fallback.
2. **Real cart.** Create a cart with `cartCreate`, store the cart id in a cookie, and use `cartLinesAdd` / `cartLinesUpdate` / `cartLinesRemove` from server actions behind the existing `useCart()` API in `components/cart/CartProvider.tsx`. Checkout then goes to `cart.checkoutUrl` instead of the permalink.
3. **Personalization.** Send name/number printing as line attributes, e.g. `attributes: [{ key: "שם", value: "ZAHAVI" }, { key: "מספר", value: "7" }]` on the cart line. The print service itself should be a separate product/variant (or a Shopify bundle) so it is priced and fulfilled in Shopify; the store owner decides that.
4. **Freshness.** Add a route handler that verifies a Shopify webhook (`SHOPIFY_REVALIDATION_SECRET`) and calls `revalidateTag("catalog")` on product/inventory updates.
5. Tokens go in `.env.local` (see the commented variables in `.env.example`).

## What is concept-only

- **Name/number printing.** The UI collects a name and number and shows them in the cart, but the cart permalink can't carry line attributes, so the print details are **not** sent to Shopify yet (see step 3 above).
- **Cart.** Lives in the browser only; it isn't synced with a Shopify cart until the Storefront API is wired.
- **Copy and figures.** Any marketing copy, size guides or service claims marked as placeholder/concept in the UI must be confirmed by the club before launch. Shipping, returns and fan-club terms are linked or left as placeholders and are not invented here.
- **Search.** Simple word matching over titles and tags on the server, not Shopify search.
- **Domain.** Canonical URLs default to `https://shop.maccabi-tlv.co.il`; set `NEXT_PUBLIC_SITE_URL` for previews.
