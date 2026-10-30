# Maccabi Tel Aviv FC shop: concept storefront

A pitch-grade redesign of https://shop.maccabi-tlv.co.il (Shopify) as a Next.js 15 front end. Hebrew first, RTL.
See README.md for the stack, data flow and scripts.

## Art direction (client requirement: it must NOT look AI-generated)
Nike / Jordan / PSG-store level editorial design:
- Typography as the hero: massive condensed uppercase Latin (Anton, `.latin`) + condensed heavy Hebrew (`.display`), tight leading, scale contrast with tiny technical labels (`.tag`, e.g. "26/27 · HOME · PUMA") and index numbers (`.idx`).
- Hard edges (`--radius` 3px), thin rules, visible grid. No soft pills, glows, blobs, emoji or bento grids.
- Real photography from `public/media/` (official club images, see `public/media/CREDITS.md`, usage rights to be confirmed by the club) and the transparent kit cut-outs in `public/kits/`.
- Restrained palette: navy / paper / black, yellow as a sharp accent.
- Precise motion (masked reveals, clip-path wipes, scroll-linked). Always honour prefers-reduced-motion.
- Short, confident Hebrew copy in a fan's voice. No marketing clichés.

## Honesty rules
Never invent facts: shipping prices, return windows, sizes, player data, payment methods, social handles. Printing (name/number) is concept-only until the Storefront API is wired; the UI says so.

## Working
- `npm run dev`, `npx tsc --noEmit`, `npx next build`, `node scripts/audit.mjs http://localhost:3000` (a11y/perf smoke test).
- Verify visual changes with Playwright screenshots at 1440x900 and 390x844.
- Map of the code: `components/home` (ScrollFilm hero + home sections), `components/product` (PDP, PrintStudio, Jersey SVG, Bundle, Gallery), `components/shop` (Browser filters, taxonomy/search normalisation), `components/shell` (Header/mega menu/search overlay, Footer, transitions), `components/cart`, `lib/catalog.ts` (live products.json + snapshot fallback).

## Next steps
1. Run the audit-suite plugin (`full-audit`, `web-animation-design`, `make-interfaces-feel-better`) and fix findings.
2. English locale (/en).
3. Storefront API: real cart with line attributes for printing.
4. Optional scroll-film video: pass `video` to `<ScrollFilm>`.
