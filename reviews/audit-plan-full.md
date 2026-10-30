# Full Spectrum Audit: Maccabi Tel Aviv FC shop concept

**Date**: 2026-10-30
**Mode**: Repo Health
**Source**: branch `wip/shop-v1`, audited at `8df82e7` (live deploy `1ae6789` for runtime checks)
**Lenses Run**: 8/10
**Lenses Skipped**: Backend Engineer (no Rust/Tauri; the only server code is Next route handlers, covered by Frontend/Prod), DX Engineer (a storefront, not a developer tool)

---

## Master Verdict: APPROVE WITH CHANGES → changes applied

Seven lenses approved with changes; Performance said NEEDS REWORK because of a ~4 s freeze on every link click, a 0.87 layout shift on kit product pages and uncached product pages. All three, every Critical issue that a code change could fix, and the cross-cutting robustness and honesty problems were fixed in commits `aefe0eb`, `0b34ea4` and `1a8f159` on `wip/shop-v1` (see the Status column). What remains open is structural debt (duplicated season/kit vocabulary, no lint/tests), production-cutover planning and a few UX refinements; none blocks the pitch.

## Verdict by Lens

| # | Lens | Verdict | Critical | Recommendations |
|---|------|---------|----------|-----------------|
| 1 | Design Engineer | APPROVE WITH CHANGES | 5 | 9 |
| 2 | UX Engineer | APPROVE WITH CHANGES | 2 | 9 |
| 3 | Frontend Engineer | APPROVE WITH CHANGES | 2 | 6 |
| 4 | Backend Engineer | Skipped | – | – |
| 5 | Structural Engineer | APPROVE WITH CHANGES | 2 | 5 |
| 6 | Repo Maintainer | APPROVE WITH CHANGES | 5 | 6 |
| 7 | Production Readiness | APPROVE WITH CHANGES (not launch-ready) | 9 | 7 |
| 8 | DX Engineer | Skipped | – | – |
| 9 | Performance Engineer | NEEDS REWORK | 3 | 5 |
| 10 | Accessibility Engineer | APPROVE WITH CHANGES | 4 | 6 |

## All Critical Issues (Must Fix), with fix status

| # | Issue | Lens(es) | File(s) | Impact | Status |
|---|-------|----------|---------|--------|--------|
| 1 | View transition resolved inside rAF → old page frozen ~4 s on every link click | Perf, A11y | `components/shell/TransitionRouter.tsx` | Site feels broken | **Fixed** (resolve directly; measured 277 ms) |
| 2 | One malformed product / feed change → every route 500s; no error boundaries | Structural, Prod, Frontend | `lib/catalog.ts`, `app/layout.tsx`, `components/shell/Header.tsx` | Whole site down | **Fixed** (per-product skip, snapshot fallback with logging, resilient header, `app/error.tsx`, `app/global-error.tsx`) |
| 3 | Home hero crashes if no kit shirts match; PrintTeaser links `/product/undefined` | Frontend, Prod | `ScrollFilm.tsx`, `lib/catalog.ts`, `app/page.tsx` | Home 500 after a rename | **Fixed** (tiered kit match, sections render only with data) |
| 4 | Product share images: `og:image` on the wrong host, double-encoded, route 500 on Vercel | Frontend, Structural, Prod, Repo | `app/layout.tsx`, `lib/og.tsx`, product OG route | Broken WhatsApp/FB previews | **Fixed** (`metadataBase` = deploy URL, `/og/product/[handle]` route, file tracing for fonts/icons) |
| 5 | Kit PDP layout shift 0.87 (Suspense without fallback around `useSearchParams`) | Perf | `app/product/[handle]/page.tsx`, `ProductView.tsx` | Content jumps | **Fixed** (CLS 0.000) |
| 6 | Product pages rendered on every request despite `revalidate` | Perf, Frontend, Prod | `app/product/[handle]/page.tsx` | Slow, costly | **Fixed** (ISR; `x-nextjs-cache: HIT`) |
| 7 | `/shop/<unknown>` answers 200 | Frontend, Prod | `app/shop/[slug]` | SEO | **Fixed** (middleware → real 404) |
| 8 | Root canonical inherited by every page | Frontend, Repo, Prod | `app/layout.tsx` | SEO | **Fixed** (per-page canonicals) |
| 9 | Search overlay and mobile filter sheet let focus escape; Escape only from input; mouse-only chips; unnamed sort select | A11y | `SearchOverlay.tsx`, `Browser.tsx`, `Browser.module.css` | Keyboard/SR users lost | **Fixed** |
| 10 | Yellow focus rings on light surfaces (1.3:1), clipped card ring | A11y | product/* modules | Focus invisible | **Fixed** (focus token; inset ring) |
| 11 | Printed shirt silently loses the print at checkout; duplicate variants in permalink | UX | `CartDrawer.tsx`, `lib/config.ts` | Wrong order | **Fixed** (explicit confirm step, merged quantities) |
| 12 | Mobile: first product 4.3 screens down, skip link invisible | UX | `ScrollFilm.*` | Bounce | **Fixed** (300vh on phones, visible skip link) |
| 13 | Hero seams (headline shadow outruns its mask) | Design | `ScrollFilm.module.css` | Visual defect | **Fixed** (exit fade) |
| 14 | Tunnel frames a player's shorts | Design | `ScrollFilm.module.css` | Awkward first frame | **Fixed** (object-position) |
| 15 | Rival red in UI (preview dot, newsletter errors, `--error`) | Design | `PrintTeaser`, `Footer`, `globals.css` | Brand rule broken | **Fixed** |
| 16 | Blurred red opponents still visible in `match-home-1` | Design | `public/media/match-home-1.webp` | Brand rule | **Kept by client decision** (blur, don't recolour) |
| 17 | Print preview SVG lacks the real back sponsors / "רואים בדיוק" overclaim | Design | `Jersey.tsx`, `PrintTeaser.tsx` | Trust | **Partly fixed** (honest copy + concept note); real back-packshot overlay open |
| 18 | Repeated "X. Y." headline formula, "X, not Y" line | Design | home sections | AI-ish | **Partly fixed** (Story120 rewritten); headline variety open |
| 19 | Accessibility statement overclaims AA | A11y | `app/accessibility/page.tsx` | Honesty | **Fixed** |
| 20 | No working lint, no tests, no CI | Repo, Structural | `package.json` | Regressions | Open |
| 21 | "26/27", kit and department vocabulary copied across ~18 files and already drifting; two `techLabel()` | Repo, Structural | many | Season rollover pain | Open |
| 22 | Production cutover: domain collision with Shopify, no redirects for Shopify URLs, no monitoring | Prod | config | Launch blocker | Open (cutover plan) |
| 23 | Unused `toCard()`; unreachable toast/fly-to-cart | Frontend, Repo | `lib/catalog.ts`, cart callers | Dead code | **Fixed** (removed / wired) |

## Cross-Cutting Concerns

| Concern | Flagged By | Root Cause | Unified Fix | Status |
|---------|-----------|------------|-------------|--------|
| Single points of failure in data loading | Structural, Prod, Frontend | All-or-nothing normalisation, async header in root layout, no boundaries | Defensive normalisation + fallbacks + error boundaries | Fixed |
| Hard-coded domains and URLs | Frontend, Structural, Repo, Prod | `metadataBase`, store/club URLs inline | One `SITE_URL`/config source | Mostly fixed (`metadataBase`, JSON-LD); Footer/sizeChart literals open |
| Duplicated vocabulary (season, kits, departments, labels) | Repo, Structural, UX (count mismatches) | No single taxonomy module | `lib/taxonomy` as the only source | Open |
| Modal plumbing copied 5-6× | Structural, A11y | No shared `useModal` | Extract hook (focus trap, scroll lock, Escape) | Open (bugs fixed in place) |
| Honesty of claims | Design, UX, A11y | Concept copy written as fact | Label concept features, soften claims | Fixed for print, checkout, accessibility |

## All Recommendations (open)

| # | Recommendation | Lens | File(s) | Fix |
|---|---------------|------|---------|-----|
| 1 | Split cart context (state vs actions) to stop app-wide re-renders | Frontend | `CartProvider.tsx` | Two contexts |
| 2 | Resize local images (loader only appends `?w=`) | Perf, Design | `lib/image-loader.ts` | Pre-sized variants or Next optimizer for local files |
| 3 | Filters behave like radio buttons under checkbox visuals; counts disagree between hero/bar/index | UX | `Browser.tsx`, `Bento.tsx` | Multi-select or radio visuals; one count source |
| 4 | Bundle re-asks the shirt size and adds a second shirt without print | UX | `Bundle.tsx` | Prefill from PDP selection |
| 5 | Hebrew set with wide letter-spacing in ~7 modules | Design | various | Use `.tag-he` for Hebrew labels |
| 6 | Hover rules not gated for touch; Bento animates padding | Design | various | `@media (hover: hover)`; transform only |
| 7 | Film lamp strikes may approach the WCAG 2.3.1 flash threshold on fast scroll | A11y | `ScrollFilm.tsx` | Cap strike contrast / rate |
| 8 | Password-protect the preview (rights-pending photos, "official store" branding) | Prod | Vercel | Deployment Protection |
| 9 | Catalog webhook → `revalidateTag(CATALOG_TAG)` | Prod | new route | On-demand refresh |
| 10 | Add ESLint flat config + a smoke test in CI | Repo | repo root | `eslint.config.mjs`, Playwright smoke |
| 11 | English locale seam (`lang`/`dir`, copy extraction) | Structural | layout, components | i18n layer before `/en` |

---

# Lens Reports


---

## 1. Design Engineer

### Design Engineering Audit: Maccabi Tel Aviv FC concept storefront (repo health)

**Perspective**: Design Engineer
**Date**: 2026-10-30
**Plan**: Repo mode (no plan, no diff). Committed HEAD `8df82e7` on branch `wip/shop-v1` at /home/user/maccabi- (the working tree is being edited concurrently; uncommitted changes such as `app/error.tsx` were not audited) plus the live deploy https://1maccabi.vercel.app (Playwright screenshots at 1440x900 and 390x844, including reduced motion). The mobile full-screen menu (HeaderBar.tsx / Header.module.css) is excluded because the lead is redesigning it.

#### Plan Summary
This is a Hebrew-first, RTL editorial storefront: a 420vh scroll-film hero, editorial home sections, a department browser, a PDP with a print studio, and a cart drawer. It is built on a small token system in `app/globals.css` (navy/paper/yellow, hard 2-3px edges, Anton + Karantina + Heebo + JetBrains Mono). The craft level is high. The type system, grid rules and photography usage mostly hit the "Nike/PSG studio" brief. The problems are a few visible rendering and art-direction defects, the brand breaking its own rules (rival red, Hebrew tracking), and a repeated section and copy formula that undercuts the "must not look AI-generated" requirement.

#### Files Reviewed
| File | Visual Role | Risk |
|------|-------------|------|
| app/globals.css | Tokens, type classes, buttons, reveal system, view transitions, reduced motion | Medium (blur reveal, dead red `--error`, few alpha tokens) |
| app/layout.tsx | Font loading (Karantina size-adjust 128%) | Medium (the size-adjust feeds the hero residue bug) |
| app/page.tsx + page.module.css | Home composition, FOREVER band | Low-Med (copy/honesty) |
| components/home/ScrollFilm.tsx + .module.css | Hero film, 3 chapters, slate, reduced-motion poster | **High** (text residue seams, portal crop, slate contrast) |
| components/home/PrintTeaser.tsx + .module.css | Home print studio, live SVG preview | **High** (red LIVE dot, clip-art jersey, "exactly" claim) |
| components/home/Story120.tsx + .module.css | 120 anniversary block | Low (copy tell, mobile echo) |
| components/home/Bento.tsx + .module.css | Department index with :has() photo frame | Medium (padding animation, touch hover, naming) |
| components/home/Rail.tsx + .module.css, Marquee.* | Product rails, ticker | Low |
| components/shell/Header.tsx, HeaderBar.tsx (desktop parts), Header.module.css (desktop parts) | Bar, mega menu | Medium (header tone mismatch live, Hebrew tracking, crest rotate) |
| components/shell/Footer.tsx, Newsletter.tsx, Footer.module.css | Footer, newsletter states | Medium (red error colours, dead photo band, glow) |
| components/shell/SearchOverlay.module.css, app/search/* | Search overlay and page | Low-Med (Hebrew tracking, display font on small copy) |
| components/product/ProductView.*, PrintStudio.*, Jersey.tsx, Gallery.*, KitStory.*, Bundle.* | PDP | **High** (rival red in KitStory, jersey fidelity, error-state salience) |
| components/shop/ShopCard.*, Browser.module.css, taxonomy.ts | Grid cards, filters, dept photos | Medium (Hebrew tracking, dangling separator, white tiles) |
| components/cart/* | Drawer, toast, fly-to-cart | Low |
| lib/kits.ts, lib/image-loader.ts, public/media/* | Kit palette, image delivery, photography | Medium (photo reuse, low-res sources, no local resizing) |

#### Verdict: APPROVE WITH CHANGES

The foundation is strong: one token file, consistent hard edges, a real type hierarchy, reduced motion handled almost everywhere, and real club photography. Nothing needs architectural rework. But five issues are visible to a client in the first minutes of a pitch, and they must be fixed before this is shown.

#### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | **Chapter-1 headline leaves horizontal "seams" across the rest of the film, including the final money frame and the reduced-motion poster.** The masked lines exit with `translate3d(0, calc((1 - var(--k)) * 112%), 0)` inside `overflow:hidden` masks. Karantina is loaded with `size-adjust: 128%` against `line-height: .86`, and `.h1` carries `text-shadow: 0 2px 30px rgba(0,0,0,.35)`. At k=2 the glyph overflow and shadow are not fully cleared, so two light/grey bands (x≈60-740, y≈115 and y≈240 at 1440x900) cut across "FOUR KITS" and across the collar of the hero shirt. | ScrollFilm.module.css:230-241 (`.mask`), :265-271 (`.h1` text-shadow), :745-746 (RM sets `--h1a/--h1b: 2`); app/layout.tsx:25 (size-adjust) | The single most-viewed frame of the pitch (ch.3 "הצהוב של 26/27") looks like a compositing glitch. Verified in d-home-film-055/07/095 and d-rm-home screenshots. Cause is likely as described (deduced from geometry; not stepped through in DevTools). | Exit to ≥ -140% or hide fully at the end of the run: `.mask > span { opacity: calc(2 - var(--k)) }` clamped, or `visibility:hidden` when chapter ≠ 0 (`.stage:not([data-ch="0"]) .c1 .mask{visibility:hidden}`). Drop or shrink the 30px text-shadow. In the RM block, hide `.c1` outright instead of relying on the translate. |
| 2 | **Rival red on brand surfaces, against the codebase's own rule** ("Never red: it is the rival's colour", globals.css:23). (a) Every home-kit PDP opens its KitStory with full-bleed `match-home-1.webp`, where the two blurred red opponents fill the left and right thirds of the frame. The same photo is the /shop/kits hero (red blob on the left edge, desktop and mobile). (b) A red blinking dot on "LIVE PREVIEW" (`#ff3b3b`). (c) Newsletter errors in pink-red (`#ff6b70`, `#ff8a8e`). (d) The token itself: `--error: #c4141d`. | KitStory.tsx:10; components/shop/taxonomy.ts:228; public/media/CREDITS.md (blur note); PrintTeaser.module.css:181; Footer.module.css:95, :140; globals.css:26 | The flagship product page shows big red smudges. The blur also reads as an edited, manipulated photo, which is exactly the "AI / fake" impression the client wants to avoid. Verified in d-pdp-full-p1, d-shop-full-p0, m-shop-full-p0. | Crop the rivals out instead of blurring: `pos` + a narrower `aspect-ratio` on `.hero` for this shot, or use `match-home-2.webp` for the KitStory hero. Change the LIVE dot to yellow (on navy it already reads as a broadcast cue). On dark, show newsletter errors in yellow with an icon. Delete `--error` or redefine it as a non-red alert treatment (see Rec 4). |
| 3 | **The print preview is a generic vector shirt that contradicts the real product next to it.** `Jersey.tsx` draws a stock t-shirt silhouette with approximated cloth. It omits the back sponsors ("Amy GROUP" above the name, "CARGO" under the number) that the product's own back packshot shows two tiles away. The fourth kit becomes a flat grey. The home teaser promises "רואים בדיוק מה יעלה על הגב" and has no concept note (the PDP does have one). | components/product/Jersey.tsx (whole); PrintTeaser.tsx:43, :82; Gallery print view; lib/kits.ts:4-10 | On a "Nike/Jordan-level" pitch, the clip-art shirt is the element most likely to read as template or AI work, and "בדיוק" overclaims a concept feature (honesty rule). Verified in d-pdp-print-top, d-home-s01, d-cart-full. | Composite the name and number onto the real back packshot (`product.images[1]`, which is the back for kits): absolutely positioned SVG/HTML text with `mix-blend-mode: multiply` and a light displacement, sized relative to the image box. Keep `Jersey` only as the fallback when no back shot exists. Change the copy to "רואים איך זה ייראה על הגב" and add the same "קונספט" tag the PDP uses. |
| 4 | **The hero's first frame centres a player's crotch in the tunnel portal.** The tunnel's portal shows `match-home-2.webp` cropped mid-torso: yellow shorts, a hand and the number 12. On mobile it is the dead centre of the opening screen. | ScrollFilm.tsx:241; ScrollFilm.module.css:84-92 (`.plateImg`, transform-origin 60% 45%), :648-650 (mobile `object-position: 64% 50%`) | A first impression of the pitch that a client will notice and may find awkward. Verified in d-home-film-0 and m-home-film-0. | Art-direct the portal. Either give `.plate1 .plateImg` an `object-position` that puts the floodlit stand or a face in the portal at `--tun:0`, or show a separate, tighter crop (stadium lights, no players) inside the portal and only reveal the action plate as the camera passes through. |
| 5 | **Formulaic section grammar and AI copy tells, against the client's #1 requirement.** Every block repeats the same recipe: mono micro-tag, then a giant condensed two-beat headline "X. Y.", then an index number. The headline couplets: "הלילה / של בלומפילד.", "ארבע חולצות. / צבע אחד.", "הצהוב / של 26/27.", "השם שלך. / הגב שלנו.", "120 שנה. / אותו צהוב.", "הדרופ הבא. / אצלך קודם.", "הכדור / בחוץ.". There is also a literal "X, not Y" reveal: "לובשים היסטוריה, לא מסתכלים עליה." Pseudo-technical labels sit on nearly every section ("REEL 01 · NIGHT · FLOODLIGHTS", "SCROLL FILM · 3 CHAPTERS", "INDEX · 06 DEPARTMENTS", "N°03 · MORE", "LIVE PREVIEW", "ERROR 404 · OUT OF PLAY", "MACCABI TEL AVIV · STORE"…). | ScrollFilm.tsx:273-276, :312-315, :334-338, :280, :372-378; PrintTeaser.tsx:37-40; Story120.tsx:24-27, :30; Newsletter.tsx:146-148; app/not-found.tsx:19-26; Bento.tsx:32; app/product/[handle]/page.tsx (Rail eyebrow "N°03 · MORE") | Each instance is well made, but the repetition makes the signature read as generated. Reviewers spot "X, not Y" and couplet cadence quickly. | Keep the couplet for two moments (hero ch.3 and print). Write the other headlines as plain fan statements of different lengths. Remove the "X, not Y" line. Keep about a third of the micro-tags (product specs, kit codes, index numbers that carry information) and delete the decorative ones (REEL 01, SCROLL FILM · 3 CHAPTERS, MACCABI TEL AVIV · STORE, LIVE PREVIEW). |

#### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| 1 | **Hebrew set with wide tracking, breaking the system's own rule** (globals.css:264-265, "spaced-out Hebrew letters fall apart"). Hebrew strings inside classes tracked 0.12-0.18em: film shirt tags ("רביעית" visibly spaced), "קונספט" tag, mega-menu column titles ("ערכות / לפי סוג / למי"), search labels ("חיפושים מוצעים", "מחלקות וקטגוריות"), filter legends, "מיון", "הדפסה אישית" on every grid card, KitStory "תקריבים מחולצת הבית". | ScrollFilm.module.css:395-409; PrintStudio.module.css:58-61; Header.module.css:334-340; SearchOverlay.module.css:117-121; Browser.module.css:88-91, :142-146; ShopCard.module.css:81-85 + ShopCard.tsx:40; KitStory.module.css:129-137 | Visible in screenshots on the PDP, grid, mega menu and search. It is the kind of detail a typographer at the club will catch. | Use `.tag-he` (or `letter-spacing: .02em`) on Hebrew spans. Where labels mix Latin and Hebrew, wrap the Hebrew in a `<span class="tag-he">`. A `:lang(he)` rule doesn't help because the whole document is `lang=he`. |
| 2 | **Blur-in reveal on every `[data-reveal]`** (opacity + 24px rise + `filter: blur(6px)`, 0.8-0.9s). | globals.css:411-425 | Off-brief: the art direction asks for masked reveals and clip-path wipes, and the blur-up fade is a well-known template signature. Filter blur is also the most expensive property to animate. | Remove the blur. Use opacity plus an 8-12px translate at ~450-500ms, or route headings to `mask` and images to `wipe`, which already exist. |
| 3 | **Slate turns navy while still on black.** `.stage[data-ch="2"] .slate { color: navy }` switches at p=.64, but the letterbox collapses over .64-.76, so "MACCABI TEL AVIV · 26/27", "03 / 03" and the side labels sit as navy on #01020c for ~12% of the film. | ScrollFilm.module.css:565-567, :590-592, :603-613; ScrollFilm.tsx:146, :156 | Illegible chrome during a scroll-linked moment (d-home-film-07). | Drive the slate colour from `--frame` (`color: color-mix(in srgb, var(--paper) calc(var(--frame)*100%), var(--navy))`), or flip at p≥.76. |
| 4 | **Error states have almost no salience.** `--sale` (= `--blue`) is used for sale, links and errors. Field errors are 12px text going from slate to blue with no icon. In PrintStudio the invalid outline (inset 2px blue) is nearly identical to the focus outline (inset 2px navy). | PrintStudio.module.css:127-133, :147-149; ProductView.module.css:161, :170-172, :413-415 | Users can't tell "focused" from "wrong". The no-red rule shouldn't remove the error affordance. | Add an `--alert` treatment: navy text plus a small square "!" glyph, or a 3px yellow blade on the field's inline-start edge. Make invalid ≠ focus (e.g. a dashed or double rule) and put text weight behind it. |
| 5 | **Token fragmentation.** About 60 distinct raw `rgba()` values (navy alphas `0,14,98,.05/.1/.2/.25/.3/.35`, paper and ink alphas) and 15 raw hex values outside globals. `--radius` (3px, per CLAUDE.md) is used 11× while literal `2px` appears 14×. There is dead or duplicate CSS: `[dir="rtl"] .c2::before` repeats `.c2::before` verbatim, and `.video` is declared 4×. | ScrollFilm.module.css:321-334, :692-698, :68-141; PrintTeaser.module.css:178, :183, :251, :261, :301; Gallery.module.css:223; PrintStudio.module.css:168 | The system stays consistent today only because one person holds it in their head. The next contributor will drift. | Add alpha tokens (`--navy-a10`, `--paper-a70`, … or `color-mix()` from the base tokens), a `--night` film token in globals, and use `--radius-sm` for the 2px corners. Delete the duplicate rules. |
| 6 | **Hover is not touch-safe, and one hover animates layout.** There are 96 `:hover` rules but only 4 `@media (hover: hover)` blocks. On phones a tap leaves the Bento row in its navy "hover" state, and the same goes for Rail arrows, film CTAs and footer links. The Bento row hover animates `padding-inline-start` (a layout property) over 0.6s. | Bento.module.css:40, :52-60, :113-115; Rail.module.css (`.arrows button:hover`, `.all:hover` animates `gap`); ScrollFilm.module.css:526-541; globals.css:403-405 | Sticky states on touch, and layout thrash on hover. | Wrap decorative hovers in `@media (hover:hover)`. Replace the padding shift with `transform: translateX()` on the inner text, and the `gap` shift with an arrow transform. |
| 7 | **Product tiles are pure `#fff` on a paper page.** Lifestyle/model shots with grey studio backdrops sit as boxed photos inside white padded cards (Rail "02" jacket model, search overlay). White products almost vanish: the search overlay's "חולצת מלון לבנה" tile renders as an empty white square (likely white-on-white; it may also have been a slow image). | ShopCard.module.css:14-27; ProductCard.module.css; SearchOverlay grid; Story120.module.css:155-160 | Inconsistent imagery is the first thing that breaks an "editorial" grid. | Use a warm off-white tile (`--paper-2` or a new `--tile`) with `mix-blend-mode: multiply` on packshots. Detect non-white-background images (aspect or tag) and render them `object-fit: cover` with no padding. |
| 8 | **Photo reuse and resolution.** `trophy-celebration.webp` appears 3× (film ch.3, Story120, dept "new") and `match-night-away.webp` 4× (film plate 2, footer, 404, KitStory away), so the home page shows both twice in one scroll. The `macro-*` details are 355×250 but render in ~330px tiles (soft on 2× screens). `stadium-tifo.webp` is 1200×500 stretched full-bleed. The custom loader returns local files unresized for every srcset width (`${src}?w=${width}`), so phones download the 1920px plates. | Bento.tsx:8-14; KitStory.tsx:9-25; Footer.tsx:47; app/not-found.tsx:15; taxonomy.ts:226-234; lib/image-loader.ts:7 | Repeated images make the asset library look thin. Low-res macros undercut the "detail" story. | Give each home section its own image (the club site has plenty; credit them). Source 2× macros. Route `/media/*` through Next's optimizer (a `loader` branch that returns the default `/_next/image` URL for local paths) or pre-generate widths. |
| 9 | **The `#print` anchor lands under the fixed header.** No `scroll-margin-top` exists anywhere, so "עצב עם שם ומספר" deep links put the PrintStudio labels (שם / מספר, the counter) beneath the 72px bar. | PrintStudio.tsx:44; globals.css (none) | The CTA from the hero lands on a clipped form (d-pdp-print). | `[id] { scroll-margin-top: calc(var(--header-h) + 16px); }` in globals. |
| 10 | **The grid card label wraps with a dangling separator.** `"26/27 · PUMA · FOURTH" + " · הדפסה אישית"` breaks after the "·", leaving it orphaned at line end on most cards (desktop and mobile). | ShopCard.tsx:37-41; ShopCard.module.css:81-85 | Small, but repeated on every kit card. | Render the label as flex items with CSS separators (`span + span::before{content:"·"}`) and `flex-wrap`, or put the print badge on its own line. |
| 11 | **Search empty-state hint is set in Karantina at 16px inside the `<h2>`.** | app/search/page.tsx:53-56; app/search/page.module.css:88-95 | Condensed poster face at body size is hard to read, and the instruction becomes part of the heading. | Move the `<small>` out of the h2 into a `<p>` set in `--font-body`. |
| 12 | **The footer opens with a ~420px band of near-black duotone photo** holding only the crest, and the crest has a 40px blurred drop-shadow (a glow, which the brief rules out). The photo is the same one used in film plate 2. | Footer.module.css:9-44 (:43 drop-shadow); Footer.tsx:46-51 | Reads as dead space on every page (d-home-s07, d-pdp-full-p3). | Cut the band height in half or give it content (fixtures / season ticket CTA). Use a hard 1px paper ring or no shadow on the crest. |
| 13 | **Live header tone differs from the code (uncertain).** The code intends a transparent "hero" header over the film at the top of `/` (`overHero`, Header.module.css:17-32; ScrollFilm.module.css:50 comment). The live deploy renders `data-tone="solid"` at scrollY 0, both in SSR HTML and after hydration. | HeaderBar.tsx (`overHero`); Header.module.css:17-32 | The film's top letterbox and the RM-poster comment assume a dark, transparent bar. Cause not found: pathname is "/" and the logic matches the deployed chunk. Worth a 5-minute check. | Verify in DevTools. If the solid bar is now intended, delete the hero tone CSS and the comments. |
| 14 | **JS smooth scrolling ignores reduced motion** (CSS is handled globally, these calls aren't). | Rail.tsx:15; Browser.tsx:102; Gallery.tsx:53; ProductView.tsx:79 | CLAUDE.md: "Always honour prefers-reduced-motion". | `behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"` via a tiny helper. |
| 15 | **Forced-colors (Windows High Contrast) parity.** Borders drawn with `box-shadow: inset` disappear: ghost buttons, the film's "עצב עם שם ומספר", PrintStudio focus/invalid states. There is no `@media (forced-colors: active)` anywhere. | globals.css:379-385; ScrollFilm.module.css:534-537; PrintStudio.module.css:127-133 | The light-only design makes this the real "theme parity" risk. | Add `@media (forced-colors: active) { .btn-ghost, … { border: 1.5px solid ButtonText; } }` or use real borders. |
| 16 | **Honesty in decorative copy (verify with the club).** "FAN CLUB · SINCE 1906" implies the fan club dates from 1906. The benefits "עדיפות בכרטיסים, הטבות במנוי ומתנת הצטרפות" are stated as fact. | app/page.tsx:135, :138 | CLAUDE.md honesty rules. | Source the benefits from the club page or soften them ("כל ההטבות באתר המועדון"). Change the tag to "FAN CLUB · MACCABI TEL AVIV". |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Rename `Bento` → `DepartmentIndex` (file, classes, `bento-title`) | The component is an index list, not a bento. The name contradicts the art direction ("no bento grids") and invites the wrong future change. |
| 2 | Stop rotating the crest on logo hover (Header.module.css:56-58) | Club marks usually may not be rotated or distorted. Check the brand guide. A colour or underline cue is safer. |
| 3 | Mobile 120 block: the decorative "120" sits directly above the headline "120 שנה." (m-home-s02) | Typographic echo on narrow screens. Hide `.big` or move it behind the photo under 560px. |
| 4 | Pause the infinite film grain when the film is offscreen (IntersectionObserver toggling `animation-play-state`) | It is a 200%-size overlay-blended layer animating forever, even on the footer. |
| 5 | Pull "בלי תעודת זהות" from the newsletter lead (Newsletter.tsx:167) | It jabs at the current store in a pitch to the people who run it. Keep the email-only form and drop the dig. |
| 6 | Home shirt tag "N°01 HOME" collides with the "ארבע חולצות" headline at ch.2 (d-home-film-042) | Offset the home tag or hide tags while `--h2a` > .5. |
| 7 | `.btn:hover .arrow` (globals.css:403) and film CTA hovers outside `@media (hover:hover)` | Consistency with Rec 6. |
| 8 | Promote `--night`, the tunnel blues and `#e9e6dc` (Gallery/PrintStudio) to tokens | They are reused and semantically "film" and "fabric" colours. |

#### Design System Compliance
- **Tokens:** The core palette, spacing, type scale and easing live in `app/globals.css` and are used widely (navy/paper/yellow everywhere, `--ease-out` on most transitions). Fragmentation comes from about 60 raw alpha colours, film-only hex values, and the radius token being bypassed by literal `2px` (Rec 5). The project uses hex/rgba, not oklch. That's fine for this codebase: the skill's oklch/`html.dark` assumption doesn't apply here.
- **Own rules broken:** "Never red" (Critical 2), "no wide tracking on Hebrew" (Rec 1), "no glows" (footer crest drop-shadow, Rec 12; the 30px headline text-shadow, Critical 1), "masked reveals / clip-path wipes" vs the default blur-fade (Rec 2), "no bento" naming (Nice 1).
- **Hard edges:** Respected. Round shapes appear only on the swatches, the crest ring and the LIVE dot. 2px vs 3px is a token-hygiene issue, not a visual one.
- **Typography:** Strong scale contrast. Karantina for Hebrew display with Anton fall-through for digits and Latin is a smart choice. Issues: the size-adjust interacts with masks (Critical 1), the display face is used at body size (Rec 11), and Hebrew tracking (Rec 1).
- **Photography:** Real club images, credited, with the rights caveat documented. Weak points: the blurred rivals (Critical 2), reuse and low-res sources (Rec 8), and boxed model shots in white tiles (Rec 7).

#### Visual State Coverage
| Component/Element | Hover | Focus | Active | Disabled | Loading | Empty | Error | Dark Mode* |
|-------------------|-------|-------|--------|----------|---------|-------|-------|-----------|
| `.btn` family (globals) | ✅ fill wipe (hover-gated) | ✅ global ring | ✅ 1px press | ✅ .4 opacity | ✅ `aria-busy` sweep bar | n/a | n/a | ✅ `.on-dark` ghost + yellow ring |
| Film CTAs (לקנייה / עצב) | ⚠️ not hover-gated | ✅ 3px navy | ❌ | n/a | n/a | n/a | n/a | ⚠️ no forced-colors border |
| Desktop nav + mega menu | ✅ underline wipe, hover-intent delays | ✅ hidden disclosure button revealed on focus, ArrowDown | ❌ | n/a | n/a | ✅ cols hidden when <2 links | n/a | n/a |
| Rail arrows / "לכל המוצרים" | ⚠️ not gated; `gap` animation | ✅ global ring | ❌ | ✅ .25 at ends | n/a | ⚠️ the sale rail is conditional, the new rail is not | n/a | n/a |
| Bento department rows | ⚠️ padding animation, sticky on touch | ✅ same as hover (:focus-visible) | ❌ | n/a | n/a | n/a | n/a | n/a |
| PrintTeaser inputs / kit radios | ✅ kit hover | ⚠️ input focus = navy→blue underline + 5% tint (weak) | ✅ checked = navy fill | n/a | n/a | ✅ placeholders ("כהן", "10") | n/a (input sanitised) | n/a |
| ShopCard / ProductCard | ✅ alt-image swap, hover-gated | ✅ global ring | ❌ | ✅ sold-out grayscale + flag | ✅ `CardSkeleton` | ✅ "MTA" placeholder | n/a | n/a |
| PDP size chips | ✅ | ✅ | ✅ checked | ✅ diagonal strike + aria label | n/a | ✅ "כל המידות אזלו" | ⚠️ nudge = blue 12px text + shake | n/a |
| PrintStudio fields | n/a | ⚠️ inset navy | n/a | n/a | n/a | ✅ placeholder + counter | ❌ invalid ≈ focus (blue vs navy inset) | ⚠️ box-shadow borders vanish in forced colours |
| Add to cart / qty | ✅ | ✅ | ✅ "נוסף לסל" state | ✅ "אזל מהמלאי" | n/a (sync) | n/a | ✅ routes to size nudge | n/a |
| Newsletter | ✅ | ✅ yellow underline on focus-within | n/a | n/a | ✅ `aria-busy` | n/a | ⚠️ pink-red border + shake (off-brand) | ✅ on-dark |
| Search overlay / page | ✅ | ⚠️ underline hue shift only | n/a | n/a | ✅ `data-loading` on results | ✅ chips + dept tiles | n/a | n/a |
| Cart drawer | ✅ | ✅ | ✅ remove/undo | ✅ qty bounds | n/a | ✅ "עוד אין פה כלום." + links | n/a | n/a |
| Route-level | n/a | n/a | n/a | n/a | ✅ shop/search `loading.tsx`; ❌ PDP has none | ✅ 404 page | ❌ no `app/error.tsx` at HEAD (uncommitted one in progress) | n/a |

\* The product is light-only by design (`color-scheme: light`, no theme switch), so "dark mode" here means **dark surfaces** (`.on-dark`: Story120, footer, 404, film) and forced-colours parity.

#### Verdict Details
- Design Token Fidelity: **CONCERNS** (about 60 raw alpha colours, red literals against the brand rule, radius token bypassed)
- Visual State Coverage: **CONCERNS** (error states lack salience, invalid ≈ focus, touch-sticky hovers, no PDP loading or app error state)
- Dark Mode Parity: **PASS (dark surfaces) / CONCERNS (forced colours)**: the `.on-dark` focus flip works; box-shadow borders vanish in high contrast
- Animation Quality: **CONCERNS** (hero residue seams, slate contrast flip, blur reveal, padding/gap hover animations, JS smooth scroll ignores RM). The scroll film itself is otherwise excellent: frame-rate-independent inertia, custom properties written once per frame, a composed RM poster.
- Visual Consistency: **CONCERNS** (Hebrew tracking, white tiles vs model shots, photo reuse, a formulaic section recipe)

---

## 2. UX Engineer

### UX Audit: Maccabi Tel Aviv FC concept storefront (repo health)

**Perspective**: UX Engineer
**Date**: 2026-10-30
**Plan**: Repo mode. I audited committed HEAD `8df82e7` on `wip/shop-v1` (/home/user/maccabi-) and the live deploy https://1maccabi.vercel.app with Playwright at 1440x900 and 390x844: journeys walked, counts read from the DOM, tab order recorded. The mobile full-screen menu is excluded (being redesigned). Note: the working tree is being edited concurrently (uncommitted `app/error.tsx`, `global-error.tsx`, and QuickAdd/Bundle changes). Findings say where an in-progress edit already touches them.

#### Plan Summary
A fan lands on a cinematic, scroll-linked home film. From there they browse seven curated departments with URL-synced filters, search through a predictive overlay, personalise a kit on the PDP (name/number, marked concept), and hand off to the real Shopify checkout through a cart permalink. The flows are unusually complete for a concept: empty states, undo, size nudges, restore-on-back and cross-tab cart sync are all there. The friction sits at the ends of the main journey: getting from the hero to a product, and getting from a personalised cart to a checkout that drops the personalisation. Number and navigation inconsistencies in between erode trust.

#### User Journey Map

**A. Buy the new home shirt with a name (the pitch's hero flow, mobile)**
1. Land on `/`: the film starts (ch.1 "הלילה של בלומפילד"). **OK**
2. Want to shop: the film is 3,545px (4.2 screens) pinned. The buy CTAs only appear at ~80% progress (~2,160px). The first product rail starts at 3,609px. The only skip ("דלג על הסרט") is invisible until keyboard focus. **WARN**
3. Tap "עצב עם שם ומספר" and arrive at `PDP#print`: the form opens, but its labels (שם / מספר, counter) sit under the fixed 72px header (no `scroll-margin-top`). **WARN**
4. Type name and number: there is a live preview, inline validation ("אותיות בעברית או באנגלית בלבד", "שפה אחת בשם") and a 0/12 counter. **OK** The preview shows a sample "שם שלך / 10" while the fields are empty, and that sample won't be added. **WARN**
5. Choose a size: sold-out sizes are struck through and labelled. Without a size, "הוספה לסל" focuses the chips, shakes, and says "בחר מידה כדי להמשיך". **OK**
6. Add: the button flips to "נוסף לסל" and the drawer opens with the print shown on the line. **OK**
7. "הקיט המלא" below: the shirt size must be picked again, and "הוסף הכל לסל" adds a second, unprinted shirt. **WARN**
8. "לקופה" sends the user to the real Shopify checkout. The print is silently dropped. The only notice is a small concept note that mentions "Storefront API". Lines of the same variant with and without print go into the permalink as duplicate `id:qty` pairs. **FAIL**

**B. Browse a department and filter (desktop)**
1. The home index row says "אביזרים ומתנות · 123 מוצרים". Clicking it opens a grid that says "95 מוצרים" (SALE: 188 on the index, menu and page hero vs 175 in the bar). **WARN**
2. Tick "שוער", then tick "בית": the first filter is replaced. The controls look like checkboxes but act as radios. The counts next to options never change after a filter is applied. **WARN**
3. A combination with no results shows "אין התאמה." with an explanation and "ניקוי כל הסינונים". **OK**
4. "עוד 24 מוצרים" shows a progress bar and "מוצגים 24 מתוך 175". The loaded depth is restored after visiting a product and coming back. **OK**
5. The browser back button walks back through filter changes (pushState). **OK**

**C. Search**
1. The header button opens an overlay with suggested searches and new arrivals. **OK**
2. Typing gives debounced, abortable results. Arrow keys work as a combobox and Enter runs a full search. **OK**
3. No results: "נסו מילה אחרת, או אחד מאלה" plus chips. **OK** A failed request (offline) shows nothing and no message. **WARN**
4. The `/search?q=` page shows the grid, or an empty state with chips and departments. **OK**

**D. Non-kit product (e.g. a scarf)**
1. The breadcrumb "בית / החנות / …": "החנות" goes to `/shop/new` (the 26/27 collection), not to the product's department. **FAIL**
2. "עוד מהמדף → לכל המוצרים" also goes to `/shop/new`. The section is labelled "N°03" on a page with no N°01 or N°02. **WARN**

**E. Cart management**
1. Qty ± and remove, with a 6s "הוסר: … · ביטול" undo and a screen-reader status. **OK**
2. Empty cart: "עוד אין פה כלום." plus three entry links. **OK**
3. The cart survives reloads and syncs across tabs (storage event). **OK**

**F. Newsletter**
1. Email-only input, a clear error ("זה לא נראה כמו אימייל. בדוק שוב?"), busy state, and a success message tagged "קונספט · לא נשלח בפועל". **OK** The copy switches between masculine singular and plural address forms. **WARN**

**G. Failure states**
1. Unknown URL: a well-written 404 with department links. **OK**
2. Runtime error: no `app/error.tsx` at HEAD, so the user gets Next's default error screen. **WARN** (an uncommitted `app/error.tsx` is in progress)

#### Verdict: APPROVE WITH CHANGES

The building blocks are excellent: feedback, undo, empty states, keyboard support and URL state. Two journey-level problems must be fixed before anyone outside the team clicks "לקופה" or opens the home page on a phone. The rest is consistency work.

#### Critical Issues (Must Fix)
| # | Issue | Step in Journey | Impact on User | Fix |
|---|-------|----------------|----------------|-----|
| 1 | **Personalisation is dropped at a real checkout with no checkpoint.** The deploy is public and "לקופה" builds a live Shopify cart permalink. A fan who typed "ZAHAVI 7" and saw it on the cart line pays for a plain shirt. The warning is a 12px note under the subtotal, and it uses developer language ("היא תתחבר דרך Storefront API"). Lines of the same variant with and without print go into the URL as duplicate `variant:qty` pairs. How Shopify resolves duplicates is unverified: it may keep one or sum them. | A8 | A real-money order that doesn't match what the UI just sold. This is the one place where "concept" can hurt a fan. | When `hasPrint`, change the CTA to an explicit choice: "המשך לקופה בלי ההדפסה" with a one-line explanation, or block checkout for print lines in the concept build. Rewrite the note in shopper language ("שם ומספר עוד לא נשלחים לקופה – החולצה תגיע בלי הדפסה"). Aggregate quantities per `variantId` in `checkoutUrl()` (lib/config.ts:5-7). Files: components/cart/CartDrawer.tsx:268-276, lib/config.ts:5-7, CartProvider.tsx:40 (`keyOf`). |
| 2 | **On mobile, the store's home is 4.3 screens away from any product, and the escape hatch is invisible.** `.film` is `height: 420vh` (3,545px at 390x844). The CTAs appear at ~0.8 progress and the first rail starts at 3,609px. "דלג על הסרט" is `opacity:0` until keyboard focus, so touch and mouse users can't see it. | A2 | Most mobile visitors decide within a screen or two. A shop home where scrolling 4 screens is the only way to commerce will bleed visitors, however beautiful the film. | Make the film shorter on phones (e.g. 260-300vh via the portrait media query and the JS spans). Show a visible, tappable "לחנות ↓" in the slate from chapter 1 (the `#drop` target already exists), and/or a small persistent "לקנייה · ₪269" chip in the slate so purchase is never more than one tap away. Files: ScrollFilm.module.css:4-8, :624-640, :642-730; ScrollFilm.tsx:221-223, :359-373. |

#### Recommendations
| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | **The same department shows different product counts on different surfaces.** The home index, mega menu and dept hero count every product (`list.length`, Header.tsx / app/page.tsx tiles / shop page hero `products.length`). The grid hides sold-out items by default and counts only available ones. Live: accessories 123 vs 95, SALE 188 vs 175 (on the same screen: hero "188 פריטים", bar "175 מוצרים"), fashion 35 vs 34. | It looks like products are missing. Trust erodes on the first click. | Count available items everywhere, or label the difference ("175 במלאי · 188 סה״כ"). The grid's "כולל פריטים שאזלו" toggle can then explain the gap. |
| 2 | **Filter controls look like checkboxes but behave like radios (except sizes), and counts are static.** Kit, type, audience and price replace each other within a group. Size is multi-select. Option counts are tallied over the whole pool and never reflect other active filters, so users walk into "אין התאמה". | Breaks the checkbox mental model. Users can't predict results. | Either make the groups multi-select (OR within a group, AND across groups) or draw them as radios or segmented chips. Compute counts against the list filtered by the other groups (standard faceting). File: components/shop/Browser.tsx:128-148, :180-186, :265-280. |
| 3 | **Bundle ignores the main PDP state.** The shirt size picked above isn't preselected. The bundle shirt carries no print. Adding the bundle after adding the shirt puts two shirts in the cart. | Double entry, then a silently wrong cart (a duplicate, unprinted shirt). | Preselect the main size and carry `print` into the bundle's shirt line. Or, when the current product is already in the cart, change the module to "complete the kit" (shorts + socks only). File: components/product/Bundle.tsx:15-45; ProductView state. |
| 4 | **Non-kit PDPs point "back" to the wrong place.** The breadcrumb "החנות" and the rail "לכל המוצרים" both go to `/shop/new` for every non-kit product. | Wayfinding: a scarf's breadcrumb leads to the new-season kits. | Derive the department from `DEPARTMENTS.find(d => d.match(product))` (prefer a non-"new" one) and use its title and href. File: app/product/[handle]/page.tsx:66, :76. |
| 5 | **Deep links land under the fixed header** (`#print` from the hero, the home teaser and the PDP toggle). There is no `scroll-margin-top` in the codebase. | The user arrives at a form whose labels are hidden (verified at 1440x900). | `[id]{scroll-margin-top:calc(var(--header-h) + 16px)}` in globals.css. |
| 6 | **What you see in the print preview ≠ what you add.** Opening "הגב שלך" silently ticks "שם ומספר על הגב" (ProductView.tsx:119-121), and the preview shows "שם שלך / 10". If the fields stay empty, nothing is printed. | The preview implies a default "10" print. Users may think they ordered a number. | Render the placeholder print ghosted (outline only) with a "דוגמה" tag. Don't auto-tick the checkbox on view switch, or untick it again when both fields stay empty. |
| 7 | **The home print teaser and the PDP validate differently.** The teaser accepts anything (digits, mixed scripts, symbols, up to 12 characters). The PDP then rejects it with an error on arrival. | The user is told "wrong" after a flow that said "fine". | Share `nameError()` / `numberError()` from PrintStudio.tsx in PrintTeaser.tsx:46-60 and show the same inline messages there. |
| 8 | **The "לקולקציית 120" CTA opens the whole fashion department** (34 items: retro, hoodies…), not the 4 anniversary items it promises. | Broken expectation right after the collection's own story block. | Link to a filtered view (`/search?q=120`, or add a `tag=120` facet) or a dedicated `/shop/120`. File: components/home/Story120.tsx:31. |
| 9 | **Inconsistent Hebrew address (gender and person).** Masculine singular: "בחר מידה" (ProductView.tsx:175, :265, :269), "בדוק שוב" and "אתה ברשימה… אתה שומע ראשון" (Newsletter), "תתחיל מהחולצה" (CartDrawer.tsx:164). Plural/neutral elsewhere: "בדקו… נסו… התחילו" (search), "השאירו ריק" (PrintStudio), "נסו להסיר" (Browser). | It reads as unedited and excludes women fans (the store sells women's kits). | Standardise on the plural imperative ("בחרו מידה", "אתם ברשימה" or a neutral "נרשמת"). Add a short voice rule to CLAUDE.md. |
| 10 | **Quick add opens the full drawer from home rails (at HEAD), and quick add exists only on rails.** It isn't on the department grid or search results. The toast path (`open:false`) exists but HEAD doesn't use it. | Browsing gets interrupted by a modal drawer. The same card offers a feature on one page and not on another. | Use the toast for quick add (an in-progress working-tree edit does this). Add quick add to ShopCard as well, or remove it from rails. Files: QuickAdd.tsx, ShopCard.tsx. |
| 11 | **Quantity limits disagree.** The PDP stepper caps at 10 (ProductView.tsx:202). The cart allows 99 (`MAX_QTY`, CartProvider.tsx:38). | Users meet two different rules for the same item. | One constant, shared by both. |
| 12 | **Club links switch language.** "משחקים וכרטיסים" and "מנויים" link to `/en/...` pages from a Hebrew store (Footer.tsx:36-37). Whether Hebrew equivalents exist is unverified. The fan-club CTA goes to the club homepage, not a fan-club page (app/page.tsx:140). | Context and language jump on exit. | Use the Hebrew URLs if they exist. Otherwise label the links ("באנגלית ↗"). Deep-link the fan club if the club provides a URL. Don't invent one. |
| 13 | **Search failure is silent.** `catch {}` keeps the previous results. With none, the overlay shows nothing. | The user can't tell "no results" from "broken". | On error, show "החיפוש לא זמין כרגע · לחיפוש מלא ←" linking to `/search?q=`. File: components/shell/SearchOverlay.tsx (fetch effect). |
| 14 | **No runtime error screen at HEAD**, and no PDP `loading.tsx`. Product navigation holds the old page for up to 1.2s in the view transition, then pops. | Blank or default Next error screen, and a frozen-feeling click. | Land the in-progress `app/error.tsx` and `global-error.tsx`. Add `app/product/[handle]/loading.tsx` with a gallery and panel skeleton. |
| 15 | **The filter sidebar is a nested scroll area** capped at `100vh − header − bar`. At 1440x900 the size and price groups sit below its fold with only a thin scrollbar (screenshot). | Users miss the size filter. Two scroll contexts compete. | Let the sidebar scroll with the page (sticky only while shorter than the viewport), or collapse groups into accordions with sizes near the top. File: Browser.module.css:117-126. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Use `replaceState` for consecutive filter taps inside the mobile filter sheet, and push one history entry on close | Five taps currently cost five Back presses to leave the page. |
| 2 | Header cart label pluralisation: "הסל שלי, 1 פריטים" → "פריט אחד" / "N פריטים" (HeaderBar.tsx cart button) | Small polish for screen-reader and tooltip text. |
| 3 | Desktop nav at 1101-1240px on touch laptops and iPads: the mega menu opens only on `pointerType === "mouse"`, and the disclosure button is 0px wide unless keyboard-focused | Touch users can't reach subcategory columns (dept filters still work, so this is low severity). Show the chevron when `(hover: none)`. |
| 4 | Two tab stops per nav item (link + hidden disclosure) means 14 stops before search and cart | Consider one roving pattern: ArrowDown on the link already opens the panel. |
| 5 | Remove "Storefront API" and other developer terms from shopper-facing copy (cart note, PrintStudio note) | Keep the honesty, drop the jargon. Move the technical detail to README. |
| 6 | Make the rail eyebrow on PDPs a label rather than "N°03 · MORE" when N°01 and N°02 are absent (non-kit products) | Numbering that skips reads as a bug. |
| 7 | Offer "דלג לסוף הסרט" (jump to ch.3) as well as "skip film" for users who want the shirt, not the store | Cheap, and it respects intent. |

#### Interaction Consistency Check
- **Add-to-cart feedback** comes in three variants at HEAD: PDP (button state + drawer + sr announcement), rails quick add (drawer), and bundle (drawer opened once, after an in-progress edit). The toast component exists but isn't used yet. Pick one rule: the drawer for deliberate PDP adds, the toast for quick and bundle adds.
- **Selection controls:** PDP sizes are radio chips, bundle sizes are native `<select>`s, filter sizes are multi-select toggles, and the other filters are single-select toggles drawn as checkboxes. The last is the only real mental-model break (Rec 2).
- **Disclosure:** The desktop mega menu is hover-intent plus keyboard. Everything else is click-to-open (search, cart, size guide, filters). That's acceptable, but touch-capable wide screens fall through the gap (Nice 3).
- **Sold-out handling** is consistent and honest everywhere (strike-through chips, grayscale cards, "אזל מהמלאי", hidden by default with an opt-in toggle). The counts upstream don't follow the same rule (Rec 1).
- **Concept honesty** is consistent: print, newsletter, footer and cart notes all say "קונספט". The gap is the checkout moment itself (Critical 1).
- **Voice:** fan voice in headlines, but the grammatical person and gender shift between components (Rec 9).

#### Verdict Details
- Discoverability: **CONCERNS** (an invisible film skip, the mega menu unreachable on touch-wide screens, quick add only on some surfaces)
- Flow Completeness: **CONCERNS** (print lost at checkout, bundle vs PDP conflict, wrong breadcrumb destination for non-kit items)
- Error Recovery: **PASS with gaps** (size nudge, print validation, empty-filter recovery and cart undo are strong; silent search failure and no runtime error page at HEAD)
- Feedback & Status: **PASS** (live counts, "נוסף לסל", busy states, progress on load-more, sr announcements). The exception is the placeholder print preview (Rec 6).
- Consistency: **CONCERNS** (counts, filter semantics, qty limits, address forms, add-to-cart feedback variants)

---

## 3. Frontend Engineer

### Frontend Engineering Audit: Maccabi Tel Aviv concept storefront (repo health)

**Perspective**: Frontend Engineer
**Date**: 2026-10-30
**Plan**: none (repo mode). Branch `wip/shop-v1`. The audit started at `1ae6789`. During the audit the branch was rebased to `732aac7`, which has an identical tree, and the lead then added `8df82e7`. That commit only touches mobile-menu code in `HeaderBar.tsx` and `Header.module.css`; every line cited below was re-checked at `8df82e7`. Working tree clean. Runtime evidence from https://1maccabi.vercel.app (same code).
**Stack translation**: Zustand becomes the React-context cart (`components/cart/CartProvider.tsx`). Tailwind becomes CSS Modules plus tokens in `app/globals.css`. Tauri does not apply; it is Next 15 App Router with RSC and client islands.
**Out of scope**: the mobile menu markup and styles in `components/shell/HeaderBar.tsx` / `Header.module.css`, which are being redesigned.

#### Plan Summary
Repo-health audit of the React/TypeScript layer. Server components read a cached live Shopify catalog (`lib/catalog.ts`) and pass props into about 20 client islands: cart, header/mega menu, search overlay, PDP, filters and scroll film. Cart state lives in one React context backed by localStorage.

Checks run:
- `npx tsc --noEmit`: **passes, 0 errors** (strict mode).
- No ESLint in the repo: no dependency and no config.
- Every claim below was checked against the source. Runtime claims were checked with `curl` against the live deploy.

#### Files Reviewed
| File | Frontend Role | Risk |
|------|--------------|------|
| `app/layout.tsx` | Root layout, fonts, metadata, providers, `Header` (async RSC) | **High** (metadataBase/canonical, catalog in root layout) |
| `app/page.tsx` | Home RSC, builds props for the hero, rails and tiles | **High** (unguarded kit data) |
| `app/product/[handle]/page.tsx` | PDP RSC, JSON-LD, Suspense around `ProductView` | Medium-High |
| `app/product/[handle]/opengraph-image.tsx`, `lib/og.tsx` | Product share images (satori) | **High** (500 in prod) |
| `app/shop/[slug]/page.tsx` + `loading.tsx` | Department page (dynamic), `Browser` island | Medium (soft 404) |
| `app/search/page.tsx`, `app/api/search/route.ts` | Search page and predictive API | Low |
| `components/cart/CartProvider.tsx` | Global cart context and localStorage sync | Medium (render fan-out, weak guard) |
| `components/cart/CartDrawer.tsx`, `CartToast.tsx`, `fly.ts` | Drawer dialog, toast, flying thumbnail | Medium (dead toast/fly path) |
| `components/shell/Header.tsx` / `HeaderBar.tsx` (desktop parts) | Mega menu built from the catalog on the server; client bar | Medium |
| `components/shell/SearchOverlay.tsx` | Combobox overlay, debounced fetch | Medium (no focus trap) |
| `components/shell/RevealObserver.tsx` | Global IO + MutationObserver | Medium (perf) |
| `components/shell/TransitionRouter.tsx` | Capture-phase click interception, View Transitions | Low (well guarded) |
| `components/home/ScrollFilm.tsx` | Scroll-linked rAF film, writes to the DOM directly | Medium |
| `components/home/Rail.tsx`, `PrintTeaser.tsx`, `Bento.tsx`, `Story120.tsx`, `Marquee.tsx` | Home sections | Low-Medium |
| `components/product/ProductView.tsx` | PDP state: variant, print, qty, mobile bar | Medium |
| `components/product/Gallery.tsx`, `Lightbox.tsx`, `SizeGuide.tsx`, `PrintStudio.tsx`, `Jersey.tsx` | PDP subcomponents, dialogs, live SVG | Low-Medium |
| `components/product/ProductCard.tsx`, `QuickAdd.tsx`, `Bundle.tsx`, `RecentlyViewed.tsx` | Cards and cart entry points | Medium |
| `components/shop/Browser.tsx`, `ShopCard.tsx`, `taxonomy.ts` | URL-driven filters over a slim `ShopItem` | Low (good design) |
| `lib/catalog.ts`, `lib/types.ts`, `lib/config.ts`, `lib/seo.ts`, `lib/bundles.ts` | Data, types, helpers | Medium (no runtime validation) |

#### Verdict: APPROVE WITH CHANGES

The code base is careful overall:
- Effects clean up their listeners and timers.
- The hot scroll paths write to the DOM directly instead of re-rendering React.
- Filters live in the URL, use the native `pushState`, and are memoized correctly.
- `Browser` gets a deliberately slim `ShopItem`.
- Dialogs restore focus.
- Reduced motion is honoured in both JS and CSS.

Two issues must be fixed before the pitch: a crash path on the home page that depends on live data, and product share images that are broken in production. A set of medium issues then follows: render fan-out from the single cart context, an ISR intent that the PDP does not get, a soft-404, canonical inheritance, and dead code.

#### Critical Issues (Must Fix)
| # | Issue | File(s) | Why It Breaks | Code Fix |
|---|-------|---------|---------------|----------|
| C1 | **Home page crashes if the live catalog stops matching four exact titles. There is no error boundary.** | `components/home/ScrollFilm.tsx:40` (`const home = kits.find(...) ?? kits[0]`), then `:344` `home.title`, `:347` `home.handle`, `:349` `home.price`. `lib/catalog.ts:179-187` (`currentKits`). `app/page.tsx:15,19` (`p.kit!`). `components/home/PrintTeaser.tsx:73` (`links[kit]`). No `app/error.tsx` or `app/global-error.tsx` exists. | `currentKits()` keeps only products whose title matches `/26[./]27/`, contains "גבר" and contains "חולצת". The live feed has **exactly one** match per kit today (checked against live `products.json` and the snapshot). If the club renames or delists those four shirts, `kits` is `[]` and `home` is `undefined`. `ScrollFilm` then throws during SSR and the landing page returns 500 on Next's default unstyled error page. A partial miss is also wrong: if home is gone, `kits[0]` (e.g. the away shirt) is sold under "הצהוב של 26/27 · HOME". `PrintTeaser` would link to `/product/undefined`. The season is hard-coded, so the 27/28 rollover will make this stale or broken. | Guard at the source: `if (!kits.length) return <StaticHero/>` in `app/page.tsx`, or render ScrollFilm's chapter 3 only when `kits.find(k => k.kit === "home")` exists. Make `ScrollFilm` take `home: FilmKit \| null` explicitly. Hide `PrintTeaser` when `Object.keys(links).length === 0`. Add `app/error.tsx` (branded, client) so one bad section is not a white page. Put the season in one constant (see the structural report). |
| C2 | **Product share images are broken in production twice over: wrong host, and the route returns 500.** | `app/layout.tsx:32` hard-codes `metadataBase: new URL("https://shop.maccabi-tlv.co.il")` instead of `SITE_URL` (`lib/seo.ts:5`). `app/product/[handle]/opengraph-image.tsx`; `lib/og.tsx:28-38` (`loadFonts`), `:78-81` (`asDataUrl(path)` = `readFile(join(process.cwd(), path))`), `:149-154`. | (a) On the deploy, `og:image` is `https://shop.maccabi-tlv.co.il/opengraph-image?…`, which returns **404** on the real Shopify store (verified). No preview link shares an image. (b) Even on the right host, `GET /product/<handle>/opengraph-image` returns **500** for every product tried (4 handles, verified). The site OG (`/opengraph-image`) works only because it was prerendered at build time. **Likely cause (unverified, no server logs):** `asDataUrl("public/icons/icon-192.png")` builds the path dynamically, so file tracing does not include it in the serverless function, and the request-time render hits ENOENT. `public/` is not part of the function bundle on Vercel. There is no try/catch, so any asset miss becomes a 500 rather than a degraded card. | Use `metadataBase: new URL(SITE_URL)` and set `NEXT_PUBLIC_SITE_URL` per deploy. In `lib/og.tsx`, load assets with statically analysable URLs (`readFile(new URL("../assets/og/crest-192.png", import.meta.url))`, with the crest copied into `assets/`) or add `outputFileTracingIncludes: { "/product/[handle]/opengraph-image": ["./assets/**", "./public/icons/**"] }` in `next.config.ts`. Wrap the crest and font loads so a failure renders the card without them. Check the Vercel function log once to confirm the cause. |

#### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| R1 | **One cart context feeds every consumer.** `value` changes on `lines`, `open`, `toast` and `lastAdded`. | `components/cart/CartProvider.tsx:118-134`. Consumers: `HeaderBar.tsx:17`, `CartDrawer.tsx:22`, `CartToast.tsx:11`, `ProductView.tsx:17`, `QuickAdd.tsx:11` (one per card), `Bundle.tsx:17`. | Components that only need the stable `add` (QuickAdd ×28 on home, ProductView, Bundle) re-render whenever the drawer opens or closes or the toast changes. `HeaderBar` re-renders all 7 `MegaPanel`s (about 45 KB of header markup on the live home page) on each of these changes. A PDP add-to-cart re-renders ProductView, Gallery and up to two live `Jersey` SVGs with turbulence filters. | Split into `CartActionsContext` (`add`, `setQty`, `remove`, `restore`, `setOpen`, `dismissToast`; stable by construction) and `CartStateContext`. Optionally add `CartUiContext` for `open`/`toast`. Then `useCartActions()` in QuickAdd, ProductView and Bundle, and `useCartCount()` in HeaderBar. `MegaPanel` could also be wrapped in `memo`. |
| R2 | **The PDP's `revalidate = 900` has no effect. Every product request is SSR'd. Enabling ISR would blank the server HTML.** | `app/product/[handle]/page.tsx:16,66-68`; `ProductView.tsx:18,45-54` (`useSearchParams`). | Live PDP responses are `cache-control: private, no-cache, no-store` with `x-vercel-cache: MISS`; `/` and `/accessibility` are prerendered HITs. A dynamic segment without `generateStaticParams` renders per request. The README's "regenerated at most every 15 minutes" is not true for PDPs. If someone adds `generateStaticParams(){return []}`, `useSearchParams` inside a **fallback-less** `<Suspense>` makes Next client-render that subtree. The h1, price, sizes and description would then disappear from the HTML. | Add `export async function generateStaticParams(){ return []; }` (on-demand ISR). **At the same time**, stop `ProductView` depending on `useSearchParams`: it only reads `name`/`number` once on mount, so read `new URLSearchParams(location.search)` inside the existing effect, or use lazy `useState` initialisers guarded by `typeof window`. Then remove the `<Suspense>`. |
| R3 | **Unknown departments are a soft 404 (HTTP 200).** | `app/shop/[slug]/page.tsx:44-46` plus `app/shop/[slug]/loading.tsx` | `GET /shop/nope` returns **200** with the 404 UI (verified). `loading.tsx` wraps the page in Suspense. The dynamic shell streams with status 200 before `notFound()` throws. | Validate the slug outside the loading boundary: add `app/shop/[slug]/layout.tsx` that calls `notFound()` when `!getDepartment(slug)`. Alternatively use `generateStaticParams` over `DEPARTMENTS` with `dynamicParams = false`. |
| R4 | **Every page without its own `alternates` inherits the root canonical "/".** | `app/layout.tsx:36` | Verified: `/shop/kits` and `/accessibility` both emit `<link rel="canonical" href="https://shop.maccabi-tlv.co.il">`. This is harmless while `INDEXABLE` is false. The day `NEXT_PUBLIC_ALLOW_INDEX=1` is set, every department page tells Google it duplicates the home page. | Remove `alternates` from the root layout. Set `alternates: canonical("/")` in `app/page.tsx` and `canonical(\`/shop/${slug}\`)` in the department `generateMetadata`. |
| R5 | PDP JSON-LD bypasses the escaping helper | `app/product/[handle]/page.tsx:74` uses `JSON.stringify(jsonLd)`; `components/seo/JsonLd.tsx` and `lib/seo.ts:75-77` (`jsonLdString`) exist for this | Title and description come from the external feed. `stripHtml` removes `<…>` pairs but not a lone `<`, so a `</script` without `>` can survive. Risk is low, the fix costs nothing, and the current code is inconsistent with the existing helper. | `<JsonLd data={jsonLd} />` |
| R6 | **A single malformed live product takes the whole site down.** | `lib/catalog.ts:38-65` (`normalize`, no guard), `:93-97`, `:106-113`; `Header` in the root layout (`app/layout.tsx:62`) calls `productsIn` | If `fetchLive` succeeds but one product lacks `images` or `title`, `normalize` throws. `unstable_cache` rejects, the catch calls `loadCatalog()` again, which throws again. Every route returns 500, including 404 and `/accessibility`, because the root layout needs the catalog. The snapshot fallback never runs, because it only covers fetch failures. External data is cast (`as { products: RawProduct[] }`, `:74`), never validated. | Normalise each product inside a try/catch (or a small hand-written guard: zod is not a dependency and isn't needed) and drop bad rows. If the live result normalises to `[]`, fall back to the snapshot. Treat `variants.length === 0` explicitly: today `Math.min()` gives `Infinity` as the price. |
| R7 | **The toast and flying-thumbnail features are dead code.** QuickAdd opens the full drawer on every add. | `CartProvider.tsx:89-97` (only runs with `opts.from` / `open:false`); `components/cart/fly.ts`; `CartToast.tsx` + `.module.css`. Callers: `QuickAdd.tsx:23-30`, `ProductView.tsx:90-101`, `Bundle.tsx:38`, none of which pass `opts`. | Shipped in the layout chunk but unreachable. A size-click quick add from a grid slams a modal drawer over the browsing context, which is the very thing the toast comment says it avoids. | Wire it: in `QuickAdd`, `add(line, 1, { open: false, from: e.currentTarget.closest("article") })`. Or delete `fly.ts`, `CartToast*` and the toast state. |
| R8 | Re-adding the same line is not announced, and the highlight does not replay | `CartProvider.tsx:88` `setLastAdded(key)`; `CartDrawer.tsx:84-90` effect deps `[lastAdded]` | A second add of the same variant/print leaves `lastAdded` unchanged, so the effect doesn't fire. Screen readers hear nothing; `said` keeps the old text. | Store `lastAdded` as `{ key, n }` (n increments on every add), or call `setSaid` from the action path instead of an effect. That also removes the `eslint-disable`. |
| R9 | The localStorage cart guard is weak | `CartProvider.tsx:42-43` (`isLine` checks only `key` and `qty > 0`); `:86` a new line's `qty` is not clamped | Old or corrupt entries flow into `subtotal` as `NaN` and into `checkoutUrl()` as `undefined:1`. Prices are snapshotted at add time and never re-checked. | Check that `variantId` is a finite number, `price` is finite, and `qty` is an integer in 1..`MAX_QTY`. Clamp new lines with `Math.min(MAX_QTY, qty)`. Bump `STORAGE_KEY` when the shape changes. |
| R10 | **Unverified:** duplicate variant ids in the checkout permalink | `lib/config.ts:5-7` | Lines are keyed by variant plus print (`CartProvider.tsx:40`). The same shirt with two different names becomes two lines, which produces `/cart/V:1,V:1`. Printing is not sent to Shopify yet, and how Shopify handles a repeated variant in a permalink (sum, last-wins or error) was not tested. | Combine quantities per `variantId` in `checkoutUrl()` until line attributes exist. |
| R11 | `SearchOverlay` is `aria-modal` but has no focus trap. Escape only works from the input. Results are not links. | `SearchOverlay.tsx:93-97` (Escape only in the input's `onKeyDown`), `:111`, `:160,172,205-213` (`<li role="option" onClick>` with `router.push`) | Tab leaves the dialog into the page underneath, which is not inert. Escape from the "ביטול" button or a link does nothing. Results get no middle-click, no open-in-new-tab and no prefetch. | Reuse one modal hook (see the structural report) for trap, Escape and scroll lock. Render each option as `<Link role="option" tabIndex={-1}>` so pointer users get real links and the combobox keeps `aria-activedescendant`. |
| R12 | A state setter runs inside another setter's updater | `HeaderBar.tsx:65-69` (`setMega(cur => { setSwap(...); return slug; })`) | Updaters must be pure. StrictMode calls them twice in dev. It works today by accident. `show`'s `useCallback([mega])` (`:61-75`) also buys nothing: the handlers are inline closures that are recreated anyway. | Read `mega` from render scope: `setSwap(mega !== null && mega !== slug); setMega(slug);`. Drop the `useCallback`. |
| R13 | `RevealObserver` rescans the whole document on every DOM mutation | `RevealObserver.tsx:29-33` (MutationObserver on `body` with `subtree`, calling `querySelectorAll` each time); `:15-20` sorts with `getBoundingClientRect()` inside the comparator | Each keystroke in search results, cart row, toast or flying `<img>` triggers a full-document query. The comparator forces layout O(n log n) times per batch. | Debounce `scan` to one `requestAnimationFrame`. Sort on `entry.boundingClientRect` (already computed) instead of calling gBCR again. |
| R14 | `toCard()` is unused, and its type would hide a crash | `lib/catalog.ts:132-139` | It is documented as a "drop-in change for Rail and Browser", yet it returns `Product` with `variants: []`. `QuickAdd` needs variants: `isSingle` is false, the size list is empty, and single products call `put(variants[0])` with `undefined`. The type system can't catch it, because the shape still says `Product`. Rails meanwhile ship full products: 28 on home, with about 20 KB of variant JSON and 4 KB of descriptions in the flight data. | Delete it, or replace it with a real `CardProduct = Pick<Product, ...> & { variants: Pick<Variant, "id"\|"size"\|"available"\|"price">[] }` and type `ProductCard`/`QuickAdd` against that. |
| R15 | Scroll locks use three strategies on two elements | `HeaderBar.tsx:52-54` (body, no restore, also runs on mount); `Browser.tsx:67-81` (body); `CartDrawer.tsx:35-36,67` (html, resets to `""`); `Lightbox.tsx:26-31` and `SizeGuide.tsx:15-20` (html, restore prev) | No live collision was found, but any future overlay pairing (e.g. opening the cart from search) will unlock the page under an open dialog. | One ref-counted `useScrollLock()`, folded into the shared modal hook. |
| R16 | First paint on mobile filters is the desktop state | `Browser.tsx:42,59-65,202-211,254` (`mobile` starts `false`) | The SSR and first client render show the desktop toggle text, and the sheet is not inert until the effect runs. | Drive the visibility differences from CSS media queries; keep JS only for `role="dialog"` and the trap after mount. Do not initialise state from `matchMedia` during render: the island is SSR'd (the department route is dynamic), so that would cause a hydration mismatch. The current code has no mismatch; the cost is a visible flip after hydration. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | Lazy-load `SearchOverlay`, `CartDrawer` and `CartToast` with `next/dynamic` (mount on first open); likewise `Lightbox` and `SizeGuide` in the PDP chunk | They are hidden until interaction. The layout chunk is 14.1 KB gzip and the PDP page chunk is 10.1 KB gzip (live). The gain is small but free. |
| N2 | `ScrollFilm`: skip the render when `target` hasn't changed and `intro >= 1` | `wake` (`ScrollFilm.tsx:183-190`) runs `measure()` (gBCR + offsetHeight) and a full `render()` with about 35 `setProperty` calls plus 4 transforms on **every** scroll event, even long after the film has scrolled past. *Uncertain* whether browsers skip same-value custom-property writes. An IntersectionObserver gate would also work. |
| N3 | Memoise the photo tiles in `Gallery` and debounce the turbulence `Jersey` while typing | Every keystroke in `PrintStudio` re-renders `Gallery` (all `<Image>` tiles) and two SVGs with `feTurbulence` + `feDisplacementMap` (`Jersey.tsx:46-50,72-83`), which is noticeable on low-end phones. |
| N4 | `PrintStudio` uses `forwardRef` (`PrintStudio.tsx:35`) | In React 19 `ref` is a regular prop, and `forwardRef` will be deprecated. |
| N5 | A typed CSS-variable helper | About 20 `style={{ "--x": v } as React.CSSProperties}` casts. Augmenting `CSSProperties` with `[key: \`--${string}\`]: string \| number` once removes all of them. |
| N6 | Clean up timers in `Bundle` (`Bundle.tsx:42`) and `Newsletter` (`Newsletter.tsx:30`) | They are not cleared on unmount. React 19 doesn't warn, but navigating within 2.2 s still sets state on a dead tree. |
| N7 | `Bundle` re-declares `Item` (`Bundle.tsx:13`) instead of `import type { BundleItem } from "@/lib/bundles"` | Type-only imports from a `server-only` module are erased, so this is safe and prevents drift. Also guard `p.images[0].src` (`:66`): the current product isn't filtered for images in `kitBundle` (`lib/bundles.ts:38`). |
| N8 | `getProduct` calls `decodeURIComponent` on params (`lib/catalog.ts:122`) | Page and metadata-route param decoding differ. `/product/%25/opengraph-image` returns 500 while `/product/%25` returns 404 (verified). Wrap it in try/catch and return `null`. |
| N9 | Trim `images.deviceSizes`/`imageSizes` in `next.config.ts` | `srcSet` attributes are about 106 KB of the 358 KB live home HTML, because Shopify URLs are long and the default breakpoints are many. |
| N10 | `ShopCard` repeats the title as image alt and h3 inside one link (`ShopCard.tsx:20,43`) | Screen readers read the name twice. Use `alt=""` on the image, since the link already has the h3 text. |

#### Render Path Analysis

**Server.** `RootLayout` awaits `Header`, which calls `productsIn()` seven times. Each call filters and sorts the full catalog, then tallies `typeOf()` regexes over KITS/TYPES/AUDIENCES. `getCatalog()` is cached per request with React `cache()` and across requests with `unstable_cache`, so each request deserialises the normalised catalog from the data cache once. Consequences:
- `/` and `/accessibility` are prerendered, so this runs once per ISR window.
- `/product/*`, `/shop/*` and `/search` are dynamic (verified headers), so the menu derivation and catalog read run **on every request**. For `/shop/*` that is intended (`await searchParams`). For `/product/*` it is not (R2).
- The catalog sits in the root layout, which couples every route's availability to catalog health (R6).

**Client triggers and what re-renders downstream:**
1. **Any cart change** (`lines`, `open`, `toast`, `lastAdded`) creates a new context `value`. All `useCart()` consumers re-render:
   - `HeaderBar`, with 7 `MegaPanel`s, the mobile menu and `SearchOverlay` (which re-renders with it).
   - `CartDrawer` and `CartToast`.
   - Every `QuickAdd` on the page (14 to 28 on home, up to 8 in the PDP rail).
   - `ProductView`, then `Gallery`, `PrintStudio` and two `Jersey`s.
   - `Bundle`.
   
   **Unnecessary**: QuickAdd, ProductView and Bundle only use `add`, and HeaderBar only uses `count`/`setOpen`. Opening or closing the drawer re-renders all of them (R1).
2. **Typing in `PrintStudio`**: `ProductView` state changes and re-renders the whole PDP panel, `Gallery` (all image tiles) and both `Jersey` SVGs. The Jerseys must update, but the tiles need not (N3).
3. **Scroll**: `ScrollFilm`, `Rail` and `Gallery` write CSS variables and transforms directly or update state only on threshold changes:
   - `Rail` bails out with the same object reference.
   - `Gallery` re-renders only when the dot index changes.
   - `HeaderBar` re-renders only when `scrolled` flips at 40px.
   
   Good. The only waste is ScrollFilm's per-scroll render after the film (N2).
4. **Filter changes** (`Browser`): `history.pushState` updates `useSearchParams`, then `filtered` and `facets` memos recompute with correct deps. `limit` resets. Cards are keyed by `id`. This is efficient and correct.
5. **Search typing**: each keystroke `setQ` re-renders the overlay; a debounced (140 ms), abortable fetch runs, and `options` is rebuilt every render, which is cheap. With `RevealObserver`, every result-list mutation also triggers a full-document rescan (R13).
6. **Route change**: `pathname` effects in `HeaderBar` (close menus), `RevealObserver` (re-create observers) and `TransitionRouter` (settle the view transition). Each adds one extra commit after navigation, which is acceptable.

#### Type Safety Assessment
- `strict: true` and `tsc --noEmit` passes clean. No `any` appears in app code, and there are no `@ts-ignore` comments.
- **External data is trusted by cast:**
  - Shopify feed: `as { products: RawProduct[] }` (`lib/catalog.ts:74`). `RawProduct` is inferred from the trimmed snapshot JSON, so the type follows whatever the snapshot happens to contain.
  - API response: `as SearchResponse` (`SearchOverlay.tsx:48`).
  - localStorage: `isLine` checks only 2 fields (`CartProvider.tsx:42-43`); `RecentlyViewed.read` checks only `handle`.
  
  No runtime validation exists at any of these three boundaries (R6, R9).
- **Type that lies:** `toCard(): Product` with `variants: []` (R14).
- **Stringly-typed keys:**
  - Department slugs are plain `string`: `DEPT_LATIN`, `DEPT_PHOTO`, Bento `PHOTO`/`CODE` are `Record<string, …>`, and `DEPARTMENTS.find(...)!` appears at `app/page.tsx:28,35` and `Header.tsx:37`. A typo compiles and fails at runtime.
  - Fix: declare `DEPARTMENTS` `as const satisfies readonly Department[]` and derive `type DeptSlug`.
- **Non-null assertions on data that may be missing:** `p.kit!` (`app/page.tsx:19`, safe by construction), `find(...)!` (`Bundle.tsx:37`, `Header.tsx:50`), `shown.compareAt!` (guarded).
- **Duplicated types and helpers that can drift:**
  - `Bundle.Item` vs `lib/bundles.BundleItem`.
  - Two `sizeRank` with different orderings (`components/product/sizes.ts:5` vs `components/shop/taxonomy.ts:68`).
  - Two `techLabel` with different output (`components/product/labels.ts:8` vs `taxonomy.ts:113`).
  - The `CartToast` name is used for both a type (`CartProvider.tsx:17`) and a component (`CartToast.tsx:10`).
- **No ESLint** (no dependency, no config, and `npm run lint` → `next lint` cannot run). The several `eslint-disable react-hooks/exhaustive-deps` comments refer to a rule that never runs. The three disabled sites were reviewed by hand and are intentional; R8 shows one where the effect hides a missed case.

#### Verdict Details
- Component Architecture: **CONCERNS**. The server/client split is good: RSC builds the data, islands stay small, and `ShopItem` is slim. Concerns: the home hero has no empty-data path (C1); no error boundary exists; there is dead toast/fly code (R7); and the root layout depends on the catalog (R6).
- State Management: **CONCERNS**. URL state for filters is correct, and all localStorage access is in try/catch. Concerns: one monolithic cart context (R1); a weak persisted-state guard (R9); impure updater (R12); announce via effect (R8).
- Type Safety: **CONCERNS**. Strict and clean, but external boundaries are unvalidated, slug keys are stringly typed, `toCard` lies about its type, and ESLint is missing.
- Rendering Performance: **CONCERNS**. The scroll paths are excellent. Concerns: context fan-out (R1); PDP dynamic on every request (R2); MutationObserver rescans (R13); ScrollFilm post-film work (N2).
- Bundle Impact: **PASS**. On the live deploy, the layout chunk is 14.1 KB gzip, the home page chunk 6.9 KB and the PDP chunk 10.1 KB, with no heavy dependencies (only `next`, `react`, `server-only`). The snapshot is split out by dynamic import. Only N1-level gains remain.

---

## 4. Backend Engineer

**Skipped**: no Rust/Tauri code; server code is Next route handlers, covered by the Frontend and Production lenses.

---

## 5. Structural Engineer

### Structural Audit: Maccabi Tel Aviv concept storefront (repo health)

**Perspective**: Systems/Structural Architect
**Date**: 2026-10-30
**Plan**: none (repo mode). Branch `wip/shop-v1` at `8df82e7`; the tree matches `1ae6789` except for the lead's mobile-menu commit. Working tree clean.
**Layer model used (translated from the skill's Tauri/monorepo model)**:
```
Shopify (products.json, CDN, checkout)   ← external system, not owned
  lib/            domain + data + config  (catalog, bundles, seo, og, config, types, kits)
  components/*    feature UI              (shell, home, product, shop, cart, seo)
  app/            routes / composition    (RSC pages, route handlers, metadata routes)
```
Server/client is a second, orthogonal boundary: `import "server-only"` guards `lib/catalog.ts` and `lib/bundles.ts`.
**Out of scope**: mobile menu markup/styles in `HeaderBar.tsx` / `Header.module.css`.

#### Plan Summary
This is a health check of the system's shape:
- Dependency direction between `lib/`, `components/<feature>/` and `app/`.
- Where the domain vocabulary (season, kits, departments, product labels) lives.
- How data crosses the Shopify, server, client and localStorage boundaries.
- How far the two roadmap items in CLAUDE.md (English locale; Storefront API cart) would ripple.

Method:
- Import graph extracted mechanically from every `.ts`/`.tsx`.
- No value-level import cycles were found.
- `tsc --noEmit` passes.

#### Files Reviewed
| File | Structural Role | Layer | Risk |
|------|----------------|-------|------|
| `lib/catalog.ts` | Data source adapter, normaliser, cache, **and** merchandising config (`DEPARTMENTS`) and queries | lib (server-only) | **High**: low cohesion, root dependency of every route |
| `lib/config.ts` | Store domain, club URL, checkout permalink builder, price formatter | lib (shared) | Medium: commerce adapter hidden in "config" |
| `lib/seo.ts` | `SITE_URL`, canonical, JSON-LD builders, `INDEXABLE` | lib (shared) | Medium: bypassed by `app/layout.tsx` |
| `lib/types.ts` | Domain types (`Product`, `Variant`, `CartLine`, `Kit`) | lib (shared) | Medium: numeric ids leak into the cart and checkout |
| `lib/bundles.ts` | Kit-bundle domain query | lib (server-only) | Low: re-implements season/audience rules |
| `lib/og.tsx` | Share-image renderers, reads `process.cwd()` files | lib (node) | **High**: environment-coupled (prod 500) |
| `lib/kits.ts` | Kit colour theme | lib (shared) | Low |
| `components/shop/taxonomy.ts` | Hebrew normaliser, facet rules, `ShopItem` DTO, search engine, department photos, suggested searches | components/shop (shared server+client) | **High**: a domain module in a feature folder, 5 concerns, 7 importers across 3 layers |
| `components/shell/Header.tsx` / `HeaderBar.tsx` (desktop) | Async RSC builds the menu from the catalog; client bar holds overlay orchestration | components/shell | **High**: the global shell depends on live data; type cycle |
| `components/shell/SearchOverlay.tsx` | Predictive search client | components/shell | Medium: imports its contract from `app/api/search/route.ts` |
| `components/shell/TransitionRouter.tsx`, `RevealObserver.tsx` | Global DOM behaviours (capture-phase link interception; `[data-reveal]`) | components/shell | Medium: implicit global contracts |
| `components/cart/*` | Cart state + persistence + UI state + drawer + toast + fly | components/cart | **High**: the seam for roadmap step 3 is not ready |
| `components/product/*` | PDP, cards, quick add, gallery, dialogs, labels, sizes | components/product | Medium: duplicated helpers, two card models |
| `components/home/*` | Home sections; `Rail` is also used by the PDP | components/home | Medium: misplaced shared component |
| `app/page.tsx`, `app/product/[handle]/page.tsx`, `app/shop/[slug]/page.tsx`, `app/search/page.tsx` | Composition roots, plus some data shaping | app | Medium: `inDept` duplicates `productsIn` |
| `app/api/search/route.ts` | Route handler, plus link-suggestion business logic and the exported DTO types | app | Medium |
| `app/layout.tsx` | Root shell: fonts, metadata, providers, Header, Footer, global observers | app | **High**: hard-coded `metadataBase`, inherited canonical, catalog dependency |
| `scripts/*.mjs`, `scripts/*.py` | Snapshot, audit, asset pipeline | tooling | Low: Python/Pillow deps undeclared |

#### Verdict: APPROVE WITH CHANGES

The macro shape is sound:
- `lib/` never imports `components/` or `app/`.
- The server-only boundary is enforced with `server-only`.
- The catalog has one adapter seam (`fetchLive()`) with a snapshot fallback.
- The filter UI uses a deliberately slim DTO (`ShopItem`).
- CSS is almost entirely logical properties: 117 logical vs 13 physical declarations, which is good for `/en`.

The system's problems are at the **edges and in the vocabulary**:
- There is no fault isolation around a volatile external data source.
- Configuration has no single source of truth, and that has already produced a production defect.
- Domain vocabulary is copy-pasted across 10–19 files, and the copies have already drifted.
- The two seams the roadmap needs next (i18n, Storefront cart) don't exist yet.

None of this needs a rewrite, but items C1–C2 and R1–R3 should land before the season rollover and before roadmap steps 2–3.

#### Critical Issues (Must Fix)
| # | Issue | Files Involved | Structural Impact | Fix |
|---|-------|---------------|-------------------|-----|
| C1 | **No fault isolation around the live catalog. The global shell depends on it, and there are zero error boundaries.** | `app/layout.tsx:62` renders async `Header`, which calls `productsIn()` ×7 (`components/shell/Header.tsx:35-74`). No `app/error.tsx`, `app/global-error.tsx` or per-segment `error.tsx` exists. `lib/catalog.ts:38-65,93-97,106-113`: normalisation is all-or-nothing and the fallback only covers fetch failure. | Blast radius = the whole site. Any exception in catalog normalisation or menu derivation breaks **every** route, because the root layout awaits it: `/accessibility`, the 404 page and policy-adjacent pages that never needed products all go down. A data-shape surprise in one feed row therefore has the same failure mode as a total outage, except that the snapshot fallback does not engage (snapshot only covers `fetchLive() === null`). Any thrown section (e.g. frontend C1, the empty-kits hero) lands on Next's unbranded default error page. | (1) Isolate the shell: render `Header` with a static fallback nav built from `DEPARTMENTS` (no catalog), and load the counts, columns and featured product inside a `Suspense` + error boundary. (2) Make normalisation per-row tolerant and fall back to the snapshot when the live result is empty or invalid. (3) Add `app/error.tsx` (client, branded) and `app/global-error.tsx`. Add `error.tsx` under `product/[handle]` and `shop/[slug]` so one route's failure stays local. |
| C2 | **Configuration has no single source of truth for origins, and the duplication already shipped a production defect.** | Correct sources: `lib/seo.ts:5` (`SITE_URL`) and `lib/config.ts:2-3` (`STORE_DOMAIN`, `CLUB_SITE`). Hard-coded bypasses: `app/layout.tsx:32` (`metadataBase`), `components/shell/Footer.tsx:7` (`POLICY`), `components/product/sizeChart.ts:3`, `lib/seo.ts:38` (club URL), `app/page.tsx:68` (club URL). Environment coupling: `lib/og.tsx:28,78-81` (`process.cwd()` + `public/…`). | Verified on the live deploy: `og:image` points at `https://shop.maccabi-tlv.co.il/opengraph-image…`, which returns 404 on the real Shopify store, because `metadataBase` ignores `SITE_URL`. Product OG routes return 500: assets are read through dynamic `process.cwd()` paths, which couples the renderer to the build machine's filesystem (likely missing from the serverless trace; unverified without logs). Changing the store domain today means editing 5 files, and the env var silently doesn't apply to two of them. | One `lib/site.ts` (or keep `lib/config.ts`) exporting `SITE_URL`, `STORE_ORIGIN`, `CLUB_ORIGIN`, `policyUrl(slug)`, `sizeChartUrl`. Ban literal origins elsewhere (a lint rule or a one-line grep check in CI). Have `lib/og.tsx` load assets through statically analysable `new URL("../assets/…", import.meta.url)`, or declare `outputFileTracingIncludes` in `next.config.ts`. Keep OG assets out of `public/`. |

#### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| R1 | **Domain vocabulary is copy-pasted and already drifting. Change propagation for certain-to-happen events is 10–19 files.** | **Season**: `26/27` or `/26[./]27/` appears **30 times in 19 files**. Behaviour depends on it in `lib/catalog.ts:153,184`, `components/product/ProductCard.tsx:11`, `lib/og.tsx:155` and `app/api/search/route.ts:34`; copy and labels use it in the rest. The 27/28 rollover is a certainty. Missing one regex silently empties the home hero (frontend C1) or mislabels "NEW". **Kits**: 7 separate label maps: `labels.ts:3` `KIT_EN`, `taxonomy.ts:44` `KITS`, `lib/kits.ts:4` `KIT_THEME.label`, `lib/og.tsx:22` `KIT_CODE`, `ScrollFilm.tsx:12-13` `LATIN`/`HEB`, `PrintTeaser.tsx:19` `CODE`, plus `kitOf` (`catalog.ts:28`). Adding a kit (e.g. a special 120 edition) touches about 11 files. `Partial<Record<Kit,…>>` maps in `ScrollFilm`/`KitStory` fail silently. **Departments**: `DEPARTMENTS` (`catalog.ts:152`), `NAV` (`Header.tsx:22`), `DEPT_LATIN`/`DEPT_PHOTO` (`taxonomy.ts:77,226`), Bento `PHOTO`/`CODE` (`Bento.tsx:8-22`), the tile order in `app/page.tsx:33`, Footer `COLUMNS` (`Footer.tsx:9-21`), not-found `WAYS`, CartDrawer `START`, manifest `shortcuts`. **Drift already present**: Bento says `KIDS`/`ACCESSORIES` while `DEPT_LATIN` says `JUNIOR`/`GEAR`; the sale photo differs between Bento and `DEPT_PHOTO`. **Helpers that diverge**: two `sizeRank` with different orderings and case handling (`product/sizes.ts:5` vs `shop/taxonomy.ts:68`); two `techLabel` with **different output** (PDP falls back to "MACCABI TEL AVIV", the grid and mega menu fall back to a Hebrew type label: `labels.ts:8` vs `taxonomy.ts:113`); two `seasonOf` (`labels.ts:5`, `bundles.ts:22`); two audience classifiers with different rules (`bundles.ts:16` vs `taxonomy.ts:52`); `has` vs `hasTag`. | Create `lib/merch.ts` (server+client safe, pure) as the single vocabulary: `CURRENT_SEASON = { label: "26/27", re: /26[./]27/ }`, `KITS` (key, he, latin, code, theme, cutout, photos), `DEPARTMENTS` (slug, title, kicker, latin, photo, `match`) declared `as const satisfies …`, with `type DeptSlug`. Derive NAV, Bento, Footer, manifest, not-found and drawer links from it. Make every per-kit and per-department map a full `Record<Kit \| DeptSlug, …>` so the compiler enumerates the change. Keep one `sizeRank`, `techLabel`, `seasonOf` and `audienceOf`. |
| R2 | **Shared domain logic lives in a feature folder, the dependency arrows point the wrong way, and there is a type-level cycle.** | `components/shop/taxonomy.ts` (normaliser, search engine, facet rules, DTO, photos, suggestions) is imported by `app/api/search/route.ts`, `app/search/page.tsx`, `app/shop/[slug]/page.tsx`, `components/shell/Header.tsx`, `components/shell/SearchOverlay.tsx`, `Browser` and `ShopCard`. The shell depends on the shop feature; the route handler depends on a component folder. `components/shell/SearchOverlay.tsx:7` imports its contract from `@/app/api/search/route` (component → route). `HeaderBar.tsx:9` imports `MenuDept` from `./Header`, which imports `./HeaderBar`: a type-only cycle across the server/client boundary (safe at runtime, but the contract is owned by the implementation). `Bundle.tsx:13` re-declares `BundleItem` instead of importing it. | Move `norm`, the facet rules and `searchProducts` to `lib/search.ts` / `lib/taxonomy.ts`. Leave UI-only bits (photos, suggestions) in `components/shop`. Put the client contracts (`SearchResponse`, `SearchHit`, `MenuDept`, `BundleItem`, `ShopItem`) in `lib/dto.ts` (types only, client-safe) and import them with `import type` from both sides. |
| R3 | **The cart seam promised in README ("behind the existing `useCart()` API") does not hold for the Storefront API (roadmap step 3).** | `CartProvider.tsx:19-34` mixes commerce state (`lines`, `add`, `setQty`, `remove`) with UI state (`open`, `toast`, `lastAdded`) and an undo affordance (`restore(line, index)`) in one context. The actions are synchronous (`add(): void`) with no pending or error states, which server actions and `cartLinesAdd` require. `Variant.id`/`CartLine.variantId` are `number` (`lib/types.ts:2,31`), while the Storefront API uses `gid://shopify/ProductVariant/…` strings. Checkout is a free function in `lib/config.ts:5-7`, called straight from `CartDrawer.tsx:274`. Persistence is fused into the provider (`:53-79`). Every consumer, plus localStorage, would change in the migration. | Introduce a `CartStore` interface (`lines`, `add(line): Promise<void>`, `update`, `remove`, `checkoutUrl(): string \| Promise<string>`, `status`) and implement `LocalCartStore` (today's behaviour, permalink checkout) behind it. Move `open`/`toast`/`lastAdded` into a separate `CartUiContext`. This also fixes the re-render fan-out (frontend R1). Carry a `variantGid` (or make ids opaque strings) in the domain type now, while only the snapshot and localStorage depend on it. |
| R4 | **There is no i18n seam, and English (roadmap step 2) would touch nearly every file.** | Root `<html lang="he" dir="rtl">` is hard-coded (`app/layout.tsx:51`). Hebrew copy is inline in every component and also in **data**: `DEPARTMENTS` titles/kickers, `TYPES` labels, `KIT_THEME.label`, size-chart strings, metadata, manifest. RTL-specific maths is scattered: `Rail.tsx:14-15,23` (scroll sign), `Gallery.tsx:47,53`, `Lightbox.tsx:37-40` (arrow mapping), `RevealObserver.tsx:19` (sort direction), `ScrollFilm.tsx:102`, `lib/og.tsx` (`rtl()`). `text-align: right` appears 6 times. The CSS is otherwise logical (117 vs 13), which is the hard part already done. | Before `/en`: (a) decide the route shape (`app/[locale]/…` with `generateStaticParams` for `he`/`en`, so `dir` and `lang` come from the segment); (b) extract copy into `messages/{he,en}.ts` keyed per feature, and split department/kit *labels* out of the matching rules; (c) centralise direction maths in one helper (`const fwd = dir === "rtl" ? -1 : 1`); (d) replace `text-align: right` with `start`. |
| R5 | **Overlay infrastructure is copy-pasted five or six times with different semantics.** | Focus traps: `CartDrawer.tsx:39-62`, `Lightbox.tsx:41-53`, `SizeGuide.tsx:25-39`, `HeaderBar` mobile menu. `SearchOverlay` has **none** and the `Browser` sheet has only Escape. Scroll lock: three strategies on two elements (`body` without restore: `HeaderBar.tsx:52-54`, `Browser.tsx:67-81`; `html` reset to "": `CartDrawer.tsx:35-36,67`; `html` restoring prev: `Lightbox.tsx:26-31`, `SizeGuide.tsx:15-20`). Escape handling: 6 implementations (window vs document vs element listeners, with `stopPropagation` ordering assumptions). Portals are used for Lightbox and SizeGuide only. | A `useModal({ open, onClose, panelRef, initialFocus, returnFocus })` hook doing a ref-counted scroll lock, Tab trap, Escape (stack-aware) and focus return. Optionally a `<Dialog>` primitive that portals. Each overlay then shrinks to markup. Coordinate with the in-flight mobile menu redesign so it adopts the hook rather than a seventh copy. |
| R6 | **Cross-feature contracts are untyped strings scattered across files.** | Filter query params: built in `Header.tsx:41-44` (`?kit=`/`type=`/`aud=`) and `app/api/search/route.ts:58` (`/shop/kits?kit=`), parsed in `Browser.tsx:28-35`. Print hand-off: `PrintTeaser.tsx:73` (`?name=&number=#print`) and `ScrollFilm.tsx:351` produce it, `ProductView.tsx:45-54` consumes it, and `PrintStudio`/`PrintTeaser` both own `id="print"`. Skip-link anchor `#drop` (`app/page.tsx:44` ↔ `ScrollFilm.tsx:221`). The cart trigger is found by `'[data-cart-trigger], header button[aria-label^="הסל שלי"]'`, duplicated in `fly.ts:6` and `CartDrawer.tsx:71`, and couples behaviour to Hebrew label copy. Renaming any of these silently breaks the other side. | Typed builders and parsers in `lib/routes.ts`: `shopHref(slug, { kit, type, aud, size, price })`, `parseShopFilters(sp)`, `productHref(handle, { print })`, `readPrintParams(sp)`, and an exported `CART_TRIGGER = "[data-cart-trigger]"`. Drop the aria-label fallback. |
| R7 | **Six product view-models, two card implementations, and the raw domain type leaks to the client.** | Card shapes: `Product` (to `Rail`/`ProductCard`/`QuickAdd`, `ProductView`, `Bundle`), `ShopItem` (`taxonomy.ts:91`), `SearchHit` (route), `MenuProduct` (`Header.tsx:7`), `Seen` (`RecentlyViewed.tsx:9`), `FilmKit` (`ScrollFilm.tsx:10`). Two grid cards (`ProductCard` + 200-line CSS, `ShopCard` + 159-line CSS) with different flags, labels and quick-add behaviour, so the same product looks different on a home rail and in a department grid. `toCard()` (`catalog.ts:137`) was meant to slim the rail payload but is unused, and would break `QuickAdd` (`variants: []` typed as `Product`). | Keep slim DTOs; they are good. Make *one* card DTO (extend `ShopItem` with minimal `variants` for quick add) and one `ProductCard` with variants (`wide`, `withQuickAdd`). Delete `toCard`. Only `ProductView` should receive the full `Product`. |
| R8 | **Business logic sits in composition roots and a route handler.** | `app/page.tsx:28` `inDept` re-implements `productsIn` (`catalog.ts:166-170`). Home data shaping (`filmKits`, `printLinks`, tiles) lives in the page. Search link suggestions (department/type/kit matching) live only in `app/api/search/route.ts:40-60`, so `/search` can't reuse them. | Add `lib/home.ts` (`getHomeData()`, returning typed view-models with explicit empty states, which also helps frontend C1) and `lib/search.ts` (`suggestLinks(catalog, q)`). Pages and routes become thin. |
| R9 | **No test seam on the most fragile logic.** | The behaviour is driven by Hebrew title regexes against a feed the team doesn't control: `kitOf`, `DEPARTMENTS.match`, `currentKits`, `kitBundle`, `typeOf`, `norm`/`searchProducts`, `rtl()`/`wrap()`. All of it is pure and trivially testable, and none of it is tested. There is no test runner. `scripts/audit.mjs` is a page smoke test, not a contract. | Add `node --test` (zero dependencies) or vitest for the pure modules, plus a **catalog contract test** against `data/catalog.snapshot.json`: 4 current kits found, every department non-empty, the home shirt bundle has 3 parts, top searches return results. Run it after `npm run snapshot` so a feed change fails loudly in CI instead of on the home page. |
| R10 | **Tooling gaps make the structure hard to defend.** | There is no ESLint dependency or config, yet `package.json` has `"lint": "next lint"` (deprecated in 15.5 and unrunnable here), and several `eslint-disable` comments refer to rules that never run. `scripts/cutout-kits.py` and `blur-rivals.py` need Pillow, which is declared nowhere. There is no CI config. | Add `eslint` + `eslint-config-next` (flat config) with `react-hooks` and a `no-restricted-syntax` rule for literal origins (C2). Add `scripts/requirements.txt`. Add a minimal CI job: `tsc`, lint, contract tests (R9). |
| R11 | **Misplaced shared component and folder intent.** | `components/home/Rail.tsx` is imported by `app/product/[handle]/page.tsx:6`, so a "home" module is a shared catalog module. `components/home/PrintTeaser.tsx` depends on `components/product/Jersey` (acceptable, but Jersey is really shared). | Move `Rail`, `ProductCard` and `Jersey` to `components/catalog/` (or `components/common/`). Keep `components/home` for home-only sections. |
| R12 | **Dead and unwired modules ship in the global chunk.** | `components/cart/fly.ts`, `CartToast.tsx` + CSS and the toast state in `CartProvider` are unreachable, because no caller passes `AddOptions` (`QuickAdd.tsx:23`, `ProductView.tsx:90`, `Bundle.tsx:38`). `toCard` is unused. | Wire them (QuickAdd → `{ open: false, from }`) or delete them. Dead paths invite people to "fix" the wrong code. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | Extract `ScrollFilm`'s timeline into a pure `frame(p, intro, W, H) → { vars, shirts[] }` module | 383 lines that mix maths, DOM writes and markup. A pure timeline is testable and reusable for the optional `video` path (roadmap step 4). |
| N2 | Split `HeaderBar.tsx` (desktop bar + mega + mobile dialog + search orchestration) into `DesktopNav`, `MegaPanel`, `MobileMenu` and `useHeaderOverlays` | Three jobs in one 377-line client file. The mobile redesign in progress is the natural moment to do this; coordinate with the lead rather than doing it in parallel. |
| N3 | Split `lib/catalog.ts` into `catalog/source.ts` (fetch + snapshot), `catalog/normalize.ts`, `catalog/cache.ts` and `catalog/queries.ts`, with merchandising moving to `lib/merch.ts` (R1) | Four concerns in one file today. The README's Storefront migration step then becomes "replace `source.ts`". |
| N4 | Rename `lib/config.ts`: move `checkoutUrl` into the cart adapter (R3) and `price` into `lib/format.ts` | "config" currently hides a commerce integration point. |
| N5 | Own the localStorage keys in one module (`mta-cart-v1`, `mta-recent-v1`, `mta-cols`, `mta-more:*`) | Four keys in three files. Versioning and migration become visible when the cart shape changes (R3). |
| N6 | Global DOM behaviours (`TransitionRouter` capture-phase interception, `RevealObserver` `[data-reveal]`, `html.js`) deserve a short contract note in README | They are implicit, cross-cutting contracts; new links or components inherit behaviour without knowing it (opt-out via `data-no-transition`). |

#### Dependency Map
```
                        ┌──────────────── external: Shopify ────────────────┐
                        │ products.json        CDN images       /cart/ perm │
                        └──────┬───────────────────┬────────────────▲───────┘
                               │fetch (cast, no     │image-loader    │href
                               │validation)         │                │
 data/catalog.snapshot.json ──►│                    │                │
                        ┌──────▼──────────────────────────┐   ┌──────┴──────────┐
 lib (server-only)      │ catalog.ts  ◄── bundles.ts      │   │ config.ts       │ (shared)
                        │  DEPARTMENTS (merch config!)    │   │  checkoutUrl()  │
                        └──────┬──────────────────────────┘   │  STORE_DOMAIN   │
 lib (shared)   types.ts  kits.ts  seo.ts(SITE_URL)  og.tsx(fs: process.cwd) ✗  │
                               │                                └──────▲──────────┘
     ┌─────────────────────────┼───────────────────────────────┐       │
     │                         │                               │       │
 ┌───▼──────────────┐   ┌──────▼─────────────────┐    ┌────────▼───────┴──────────┐
 │ app/layout.tsx   │   │ app/page, product,     │    │ app/api/search/route.ts   │
 │  metadataBase ✗  │   │ shop, search, sitemap  │    │  exports DTO types ✗      │
 │  (hard-coded)    │   └──┬─────────┬───────────┘    └──────────▲────────────────┘
 └───┬──────────────┘      │         │ ✗ app/product → home/Rail │ type import ✗
     │ awaits catalog ✗    │         │                           │
 ┌───▼──────────────────────────┐   ┌▼──────────────────┐   ┌────┴──────────────────┐
 │ components/shell             │   │ components/home   │   │ components/shell/     │
 │  Header (RSC) ──► HeaderBar  │   │  Rail ─► product/ │   │  SearchOverlay        │
 │        ▲  type cycle ✗  │    │   │  PrintTeaser ─►   │   └───────────────────────┘
 │        └────────────────┘    │   │    product/Jersey │
 └───┬───────────┬──────────────┘   └───────┬───────────┘
     │ ✗ shell → shop/taxonomy              │
 ┌───▼───────────▼──────┐   ┌──────────────▼────────────┐    ┌──────────────────────┐
 │ components/shop      │   │ components/product        │───►│ components/cart      │
 │  taxonomy.ts ◄───────┼───┤  (ProductView, QuickAdd,  │    │  CartProvider (state │
 │  (DOMAIN in a        │   │   Bundle use useCart)     │    │  + UI + persistence) │
 │   feature folder) ✗  │   └───────────────────────────┘    └──────────▲───────────┘
 │  Browser, ShopCard   │                                               │ useCart
 └──────────────────────┘                     HeaderBar, CartDrawer ────┘

 Global implicit contracts (no import arrow, coupled by string):
   [data-reveal] ↔ RevealObserver ↔ globals.css   |  [data-cart-trigger]/aria-label ↔ fly.ts, CartDrawer
   ?kit/type/aud ↔ Header, route.ts, Browser      |  ?name&number#print ↔ PrintTeaser, ScrollFilm, ProductView
   #drop ↔ page.tsx, ScrollFilm                   |  html.js ↔ layout inline script ↔ globals.css
```
**Concerning arrows (✗)**:
- The root layout awaits the catalog (C1).
- `metadataBase` and `og.tsx` bypass the config and are filesystem-coupled (C2).
- Shell, route handler and pages all depend on `components/shop/taxonomy` (R2).
- `SearchOverlay` imports from `app/api/search/route` (R2).
- Type-only cycle between `Header` and `HeaderBar` (R2).
- `app/product` depends on `components/home/Rail` (R11).

No value-level cycles; `lib/` never imports upward.

#### Boundary Crossing Analysis
| Crossing | From -> To | Clean? | Notes |
|----------|-----------|--------|-------|
| Shopify feed → domain | `products.json` → `lib/catalog.ts` `normalize()` | **Partial** | One adapter seam (`fetchLive`) with a snapshot fallback (good). Payload trusted by `as` cast (`:74`). `RawProduct` is inferred from the snapshot file, so the type follows a local artefact rather than the API. One bad row fails the whole catalog (C1). |
| Domain → server components | `getCatalog()`/queries → `app/*`, `Header` | Yes | `server-only` enforced; request `cache()` + `unstable_cache` dedupe. |
| Server → client props | RSC → `Rail`/`ProductCard`/`QuickAdd`, `ProductView`, `Bundle` | **Partial** | Raw `Product` (descriptions, all variants, tags) crosses into client islands. Elsewhere slim DTOs are used (`ShopItem`, `MenuDept`, `FilmKit`, `Seen`). Inconsistent (R7). |
| Client → API | `SearchOverlay` → `GET /api/search` | **No** | Response cast `as SearchResponse`; the contract type is owned by the route module and imported by a component (R2). |
| Client → persistence | Cart, recent, density, load-more → `localStorage`/`sessionStorage` | Partial | All access wrapped in try/catch (good). Keys spread over 3 files; the cart guard checks 2 fields (N5, frontend R9). |
| Client → commerce | `CartDrawer` → `checkoutUrl()` (`lib/config.ts`) → Shopify permalink | Partial | Works, but the commerce adapter lives in "config" with numeric ids. It is not the replaceable seam README describes (R3). |
| Client → CDN | `next/image` → `lib/image-loader.ts` → Shopify CDN | Yes | Single loader, format negotiation documented. |
| Metadata routes → filesystem | `lib/og.tsx` → `process.cwd()/assets`, `/public/icons` | **No** | Environment-coupled; product OG returns 500 in prod (C2). |
| Root metadata → all routes | `app/layout.tsx` metadata → children | **No** | Hard-coded origin (C2). `alternates.canonical: "/"` is inherited by every page that doesn't override it (verified on `/shop/kits`, `/accessibility`). |
| Global behaviours → every anchor/element | `TransitionRouter` (capture click), `RevealObserver` (MutationObserver) | Partial | Opt-out exists (`data-no-transition`), but these are undocumented global contracts (N6). |
| Feature → feature | shell → cart, shell → shop, home → product, product → cart, app/product → home | Partial | Acyclic. `shell → shop/taxonomy` and `app/product → home/Rail` are misplacements (R2, R11). |
| Locale boundary | `<html lang="he" dir="rtl">`, inline Hebrew, RTL maths | **No seam** | Roadmap step 2 would change nearly every file (R4). |

#### Change Propagation (sampled scenarios)
| Change | Files touched today | After fixes |
|--------|--------------------|-------------|
| Season rollover 26/27 → 27/28 | 19 files / 30 occurrences, 5 behavioural regex sites in 4 files, plus `public/kits/*` cut-outs and `KIT_THEME` colours | `lib/merch.ts` + assets |
| Add a kit (e.g. a 120th-anniversary edition) | about 11 (types, kitOf, kits, labels, taxonomy, og, ScrollFilm, PrintTeaser, KitStory, currentKits order, CSS `[data-kit]`) | `lib/merch.ts` + CSS + assets; the compiler lists the rest |
| Rename or add a department | about 9 (catalog, Header NAV, taxonomy ×2, Bento ×2, page tile order, Footer, not-found, CartDrawer, manifest, shop CSS `[data-tone]`) | `lib/merch.ts` (+ CSS tone) |
| Change the store or site origin | 5 code sites + env; 2 ignore env | 1 module + env |
| Rename a filter param | 3 (Header, route, Browser) | `lib/routes.ts` |
| Storefront API cart | every `useCart` consumer + types + localStorage + drawer | one `CartStore` implementation |
| English locale | nearly all components + lib data + root layout | `[locale]` segment + messages + direction helper |

#### Verdict Details
- Dependency Direction: **CONCERNS**. `lib` → nothing upward (good). Inversions: component → route module (types); shell and route → a feature-folder domain module; app/product → home. There is one type-only cycle.
- Module Coupling: **CONCERNS**. The global shell is coupled to live data (C1). Many cross-feature contracts are stringly typed (R6). The cart's commerce and UI state are fused (R3).
- Cohesion: **CONCERNS**. `taxonomy.ts` holds 5 concerns, `catalog.ts` 4, and `HeaderBar.tsx` 3 jobs. Vocabulary is scattered across 7+ maps (R1).
- Layer Boundaries: **CONCERNS**. The server/client boundary is clean (`server-only`, slim `ShopItem`). Config and filesystem boundaries leak (C2). Raw `Product` reaches the client in places (R7).
- Change Propagation: **CONCERNS**. Season, kit and department changes touch 9–19 files, with drift already visible. The two next roadmap items have no seam yet (R3, R4).

---

## 6. Repo Maintainer

### Repo Maintenance Audit: Maccabi Tel Aviv FC concept storefront (repo health, branch `wip/shop-v1`)

**Perspective**: Repo Maintainer
**Date**: 2026-10-30
**Plan**: none (repo-health mode). Audited the working tree at `/home/user/maccabi-` (HEAD `8df82e7`; the only change since the audit started was a rebase that touched the mobile menu in `components/shell/HeaderBar.tsx` / `Header.module.css`, which is out of scope).
**Method**: read every tracked `.ts/.tsx/.mjs/.py` file and the config files; grep-based checks for unused exports, assets and tokens; `npx tsc --noEmit` (passes, 0 errors); `npm audit --omit=dev`; spot checks against the live deploy https://1maccabi.vercel.app. No dev server or build was run.
**Exclusion**: mobile-menu findings inside `components/shell/HeaderBar.tsx` / `Header.module.css` are skipped (the lead is redesigning them now).

#### Plan Summary
This is a small, mostly well-organised Next.js 15 App Router codebase: about 100 source files, CSS Modules next to each component, `@/` aliases, strict TypeScript and no barrels. The main health problems are (1) no lint gate at all, even though the code carries ESLint suppressions, (2) domain vocabulary (kits, departments, season "26/27", size order, tech labels) copied between 3 and 8 times with drift that users can already see, (3) dead code and assets, including a helper whose doc comment would cause a bug if anyone followed it, and (4) documentation that has drifted from the code.

#### Files Reviewed
| File | Convention Status | Risk |
|------|------------------|------|
| `package.json` | `lint` script is `next lint`: ESLint isn't installed, there's no config, and the command is deprecated in the installed Next (verified string in `node_modules/next/dist/cli/next-lint.js`: "`next lint` is deprecated and will be removed in Next.js 16"). No `engines`, no aggregate `check` script | High |
| `.gitignore` | Missing `.vercel`, plain `.env` (only `.env*.local`), `*.log`, `__pycache__/`, `test-results/`, `playwright-report/` | Medium |
| `tsconfig.json`, `next.config.ts` | Clean | Low |
| `README.md`, `CLAUDE.md`, `.env.example` | Drift (see R6) | Medium |
| `lib/catalog.ts` | Good structure. Dead `toCard` (L137) with a misleading comment. `/26[./]27/` hardcoded twice | Medium |
| `lib/config.ts` | Good: single source for `STORE_DOMAIN`, `CLUB_SITE`, `price`. Several files bypass it | Medium |
| `lib/seo.ts` | `breadcrumbJsonLd` (L61) unused (README advertises it). `SITE_NAME` is not reused by layout/manifest/og, which repeat the literal 5×. L38 hardcodes the club URL instead of `CLUB_SITE` | Medium |
| `lib/og.tsx` | `KIT_CODE` (L22) is a 5th copy of the kit Latin codes. Hardcoded domain string (L182). 3 orphan `eslint-disable` comments | Medium |
| `lib/bundles.ts` | `seasonOf` (L22) duplicates `components/product/labels.ts:5`. `audienceOf` overlaps `AUDIENCES` in taxonomy | Medium |
| `lib/kits.ts` | Kit Hebrew labels duplicate `KITS[].label` in taxonomy | Low |
| `lib/types.ts`, `lib/image-loader.ts` | Clean | Low |
| `app/layout.tsx` | `metadataBase` hardcoded (L32) instead of `SITE_URL`. Root `alternates.canonical: "/"` (L36) is inherited by every page that doesn't set its own | High |
| `app/page.tsx` | Re-implements `productsIn`/`getDepartment` with `DEPARTMENTS.find(...)!` (L28, L35). Hardcoded club URL (L68) | Low |
| `app/product/[handle]/page.tsx` | Builds JSON-LD with raw `JSON.stringify` (L74) instead of the existing `JsonLd`/`jsonLdString` helper. Import order (L2) | Medium |
| `app/shop/[slug]/page.tsx`, `app/search/page.tsx` | Import domain logic from `components/shop/taxonomy` | Low |
| `app/api/search/route.ts` | Exports shared response types from a route file. A client component imports them (`SearchOverlay.tsx:7`) | Low |
| `components/shop/taxonomy.ts` | Domain and search logic used by server routes, a server component and client components. It lives in `components/`. Second `techLabel` (L113) and second `sizeRank` (L68) | Medium |
| `components/product/labels.ts`, `sizes.ts` | First `techLabel` (L8) and `sizeRank` (L5). They diverge from the taxonomy copies | Medium |
| `components/home/Bento.tsx` | Third copy of department photos/codes (L8, L15) with different values than `DEPT_PHOTO`/`DEPT_LATIN`. The component name contradicts CLAUDE.md ("no bento grids"); it renders an index list | Medium |
| `components/home/PrintTeaser.tsx`, `ScrollFilm.tsx` | Kit code copies (`CODE` L19, `LATIN`/`HEB` L12-13). `12` hardcoded instead of `NAME_MAX` | Low |
| `components/product/Bundle.tsx` | Re-declares `type Item` (L13) instead of `import type { BundleItem } from "@/lib/bundles"` | Low |
| `components/cart/*` | Selector duplicated between `fly.ts:6` and `CartDrawer.tsx:71`. `CartToast` is both a type (`CartProvider.tsx:17`) and a component (`CartToast.tsx:10`). Orphan `eslint-disable` (CartDrawer L89) | Low |
| `components/shell/{Header,Footer,Newsletter,RevealObserver,TransitionRouter,SearchOverlay}.tsx` | Mostly clean. Footer hardcodes the store policy URL (L7). Newsletter borrows `Footer.module.css` | Low |
| Scroll-lock / focus-trap code in `CartDrawer`, `SizeGuide`, `Lightbox`, `Browser`, `HeaderBar` | 5 hand-rolled scroll locks that write to two different elements; 4 focus traps | Medium |
| `app/globals.css` | 15 unused tokens, including `--radius`, the 3px token CLAUDE.md names. 13× hardcoded `border-radius: 2px`. ~201 px font sizes vs 19 `--fs-*` uses | Medium |
| `scripts/*.mjs`, `scripts/*.py` | Python scripts (Pillow dependency) aren't in README. `blur-rivals.py` overwrites its input in place, so it isn't idempotent | Low |
| `assets/fonts/Karantina-Regular.ttf` | Unused | Low |
| `public/media/*` | 6 unreferenced images. `CREDITS.md` is inside `public/` and therefore deployed (live: `/media/CREDITS.md` → 200) | Medium |

#### Verdict: APPROVE WITH CHANGES

The architecture and file layout are sound, and TypeScript is clean. What keeps this from a clean approve: no lint or CI gate, a vocabulary duplicated so heavily that the season rollover alone means editing 18 files, and dead code that misleads. All of it is fixable without restructuring.

#### Critical Issues (Must Fix)
| # | Issue | File(s) | Convention Violated | Fix |
|---|-------|---------|-------------------|-----|
| C1 | **No working lint gate.** `npm run lint` → `next lint`, which is deprecated in the installed Next 15.5.28 and removed in 16. `eslint`/`eslint-config-next` aren't installed and there's no `eslint.config.*`. Yet the code has 8 `eslint-disable` comments for rules nothing runs (`react-hooks/exhaustive-deps`, `@next/next/no-img-element`). There's no CI and no test runner, so nothing beyond a manual `tsc` stops regressions. | `package.json:9`; suppressions at `components/shell/SearchOverlay.tsx:103`, `components/cart/CartDrawer.tsx:89`, `components/product/Gallery.tsx:59`, `components/home/ScrollFilm.tsx:298,329`, `lib/og.tsx:116,169,196` | Lint compliance / no unchecked suppressions | Add `eslint`, `eslint-config-next` and a flat `eslint.config.mjs` (`next/core-web-vitals` + `next/typescript`). Change the script to `"lint": "eslint ."` and add `"check": "tsc --noEmit && eslint ."`. Re-check each existing suppression against the real rule and delete the ones that aren't needed. Add a minimal GitHub Actions job (`npm ci && npm run check`). |
| C2 | **Season "26/27" hardcoded 29 times across 18 files**, as regexes (`/26[./]27/`) and as copy. Rolling over to 27/28 means a scattered manual edit, and missing one fails silently (e.g. `currentKits()` returns `[]`; see the prod report for the crash this causes). | `lib/catalog.ts:153,184`, `app/api/search/route.ts:34`, `components/product/ProductCard.tsx:11`, `lib/og.tsx:155`, plus copy in ScrollFilm, PrintTeaser, layout, manifest, CartDrawer, og etc. (`grep -rn "26/27\|26\[./\]27"`) | Code reuse / single source of truth | Add `lib/season.ts` exporting `SEASON = { label: "26/27", re: /26[./]27/ }` and one `seasonOf()`. Use it in every regex site and in the Latin copy. Leave the Hebrew marketing copy literal if wanted, but have it reference the constant where it states the season. |
| C3 | **Kit and department vocabulary duplicated with drift that users can see.** Kit Latin codes: 5 copies (`labels.ts:3 KIT_EN`, `og.tsx:22 KIT_CODE`, `PrintTeaser.tsx:19 CODE`, `ScrollFilm.tsx:12 LATIN`, `taxonomy.ts:44-50 KITS[].latin`). Kit Hebrew labels: 3 copies (`lib/kits.ts`, `taxonomy.ts KITS`, `ScrollFilm.tsx:13 HEB`). Department metadata: ~8 places (`DEPARTMENTS`, `DEPT_LATIN`/`DEPT_PHOTO`, `Bento.tsx` `PHOTO`/`CODE`, `Header.tsx:22 NAV`, `Footer.tsx:13-19`, `not-found.tsx:5`, `CartDrawer.tsx:15`, `manifest.ts:21`). These already disagree: Bento labels kids "KIDS" and accessories "ACCESSORIES", while the department page shows "JUNIOR"/"GEAR". Bento's sale photo is `lifestyle-hoodie-blue`; `DEPT_PHOTO.sale` is `match-fans`. **Two `techLabel()` implementations produce different labels for the same product**: `components/product/labels.ts:8` falls back to "MACCABI TEL AVIV", while `components/shop/taxonomy.ts:113` falls back to the Hebrew type label and omits it for kits. So the PDP, the mega menu and the grid cards disagree. | as listed | Code reuse / one name for one concept | Make `lib/catalog.ts` `DEPARTMENTS` the only department record, carrying `latin`, `photo`, `navLabel`. Make one `KITS` table in `lib/kits.ts` carrying `label`, `latin` and theme colours. Keep a single `techLabel()` and import these everywhere. Delete the per-component maps. |
| C4 | **Dead helper with a comment that would cause a bug.** `toCard()` is never used. Its comment says it's "a drop-in change for Rail and Browser", but it empties `variants`, and `Rail` → `ProductCard` → `QuickAdd` needs variants: `isSingle()` would be false and no size buttons would render. Browser already uses its own `toItem`. | `lib/catalog.ts:132-139` | Dead code prevention | Delete `toCard`. If RSC payload trimming is wanted later, add a card type that keeps variants (`Pick<Product, ...>`). |
| C5 | **Hardcoded domains bypass `lib/config.ts`/`lib/seo.ts`, and one causes a live bug.** `metadataBase` is a literal, so on the Vercel preview every `og:image`/`twitter:image` points to `https://shop.maccabi-tlv.co.il/opengraph-image…`, which returns 404 on the real Shopify store (verified with curl). Other bypasses: Footer policy URL, size-chart URL, org JSON-LD URL, the fan-club link, and the OG footer string. Separately, the root layout's `alternates: { canonical: "/" }` is inherited, so `/shop/*`, `/search` and `/accessibility` all render `<link rel="canonical" href="https://shop.maccabi-tlv.co.il">` (verified live on `/shop/kits`, `/accessibility`, `/search?q=x`). | `app/layout.tsx:32,36`; `components/shell/Footer.tsx:7`; `components/product/sizeChart.ts:3`; `lib/seo.ts:38`; `app/page.tsx:68`; `lib/og.tsx:182` | Single source of config | Use `metadataBase: new URL(SITE_URL)`. Drop the root `alternates`. Give every page its own `alternates: canonical(path)` (the dept page needs it in `generateMetadata`). Build store URLs from `STORE_DOMAIN` and club URLs from `CLUB_SITE`. |

#### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| R1 | `components/shop/taxonomy.ts` holds domain logic (normalisation, search ranking, facets, department photos) and is imported by `app/api/search/route.ts`, `app/search/page.tsx`, `app/shop/[slug]/page.tsx` and the server `Header.tsx`, as well as by client components | Server routes depending on `components/` inverts the layering. Search logic belongs next to `lib/catalog.ts`. CLAUDE.md's code map documents the current spot, so moving it means updating that too | Move to `lib/taxonomy.ts` (pure, isomorphic), or split into `lib/search.ts` and `lib/facets.ts`. Keep `ShopCard`/`Browser` in `components/shop`. Update the CLAUDE.md map |
| R2 | Two `sizeRank` implementations: `components/product/sizes.ts:5` (includes 3XL/4XL, `parseFloat`, unknown = 999) and `components/shop/taxonomy.ts:68` (no 3XL/4XL, `parseInt`, unknown = 9999). There are also two identical `seasonOf` (`labels.ts:5`, `lib/bundles.ts:22`) | The current catalog has no 3XL/4XL (checked against the snapshot), so the drift is latent. The first such variant would sort differently on the PDP and in the filters | Keep one `sizeRank`/`seasonOf` in `lib/`, and import it in `sizes.ts`, `taxonomy.ts` and `bundles.ts` |
| R3 | Discount-percentage math is repeated 3×; the print-name max `12` is hardcoded 3× outside `NAME_MAX` | Small drifts (e.g. a different rounding rule) creep in | Add `discountPct(price, compareAt)` to `lib/config.ts` (next to `price`). Import `NAME_MAX` in `PrintTeaser.tsx:48` and `Jersey.tsx:18` |
| R4 | Five hand-rolled scroll locks write to `document.body` (HeaderBar L53, Browser L69/79) or `document.documentElement` (CartDrawer L36/67, SizeGuide L16-20, Lightbox L27-31), some restoring `prev` and some forcing `""`. There are four separate focus-trap implementations | Overlapping dialogs (filter sheet + cart, search + cart) can leave the page locked or unlocked depending on close order. The code is copied rather than shared. (The mobile menu is excluded here; the others aren't.) | Add a `hooks/` directory with `useScrollLock()` (ref-counted, one element) and `useFocusTrap(ref)`. Replace the copies |
| R5 | The cart trigger selector `'[data-cart-trigger], header button[aria-label^="הסל שלי"]'` is duplicated and depends on the Hebrew aria-label text | Renaming the label silently breaks both the flying thumbnail and focus return | Put only `data-cart-trigger` on the button, and export `CART_TRIGGER = "[data-cart-trigger]"` from `components/cart/fly.ts` |
| R6 | Docs drift. The README fonts row lists Heebo + Anton but not Karantina (the actual Hebrew display face) or JetBrains Mono. The README says "Pages export `revalidate = 900`", but `/shop/[slug]` and `/search` are dynamic by design. It advertises `breadcrumbJsonLd()`, which is unused. The scripts table omits `scripts/blur-rivals.py` and `scripts/cutout-kits.py` and their Pillow requirement. Tooling claims no linter, but `npm run lint` exists. The `globals.css:24` comment says "Sale and errors use the club blue", but `--error: #c4141d` is red (and unused) | The next contributor will trust the README | Update the README tables. Either wire `breadcrumbJsonLd` into the PDP (the breadcrumb `<nav>` already exists) or delete it. Fix or remove the `--error` comment and token |
| R7 | Unused assets and tokens: `assets/fonts/Karantina-Regular.ttf`. Six images: `public/media/{lifestyle-hoodie-white,model-away-1,model-home-1,model-home-2,model-keeper-black,model-third}.webp` (rights pending, and deployed anyway). Unused CSS tokens: `--radius`, `--radius-lg`, `--radius-pill`, `--error`, `--ok`, `--fs-sm`, `--fs-xl`, `--fs-mega`, `--space-3`, `--space-8`, `--shadow-sm`, `--yellow-hot`, `--ease-snap`, `--dur-4`. Unused global classes `.btn-ghost`, `.btn-sm`. `Marquee`'s `tone="yellow"` variant and `Rail`'s `id` prop are never passed | Dead weight, and unlicensed media shipped for no reason | Delete them, or start using `--radius` (CLAUDE.md's 3px token) in place of the 13 literal `border-radius: 2px` |
| R8 | `public/media/CREDITS.md` is served publicly (`https://1maccabi.vercel.app/media/CREDITS.md` → 200, `text/markdown`). It states that rights are unconfirmed and lists the edited photo | Internal provenance notes don't belong in the deploy output | Move it to `docs/media-credits.md` (or `media/CREDITS.md` at the repo root) and update the CLAUDE.md pointer |
| R9 | The product page JSON-LD uses raw `JSON.stringify` | The repo already has `components/seo/JsonLd.tsx` + `jsonLdString()` precisely to escape `<`. Titles come from Shopify and aren't sanitised (the current data has no `<`, which I checked) | Replace with `<JsonLd data={jsonLd} />`. Consider moving `productJsonLd()` into `lib/seo.ts` next to the other builders |
| R10 | Shared types sit in odd places: `SearchResponse`/`SearchHit` are exported from `app/api/search/route.ts` and imported by a client component; `Bundle.tsx` re-declares `BundleItem` | Route files should only export handlers, and duplicated types drift | Move the search DTOs to `lib/types.ts` (or `lib/search.ts`). Use `import type { BundleItem } from "@/lib/bundles"` (type imports from `server-only` modules are erased) |
| R11 | `.gitignore` covers `.env*.local` but not `.env` | Next loads `.env`. Once `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` exists (README step 5), someone will commit a plain `.env` | Use `.env*` + `!.env.example`, and add `.vercel`, `*.log`, `__pycache__/`, `test-results/`, `playwright-report/` |
| R12 | `app/page.tsx:28,35` uses `DEPARTMENTS.find(...)!` + `byShelfOrder(filter)`; `Header.tsx:37` repeats the `find(...)!` | `getDepartment()`/`productsIn()` already exist in `lib/catalog.ts` | Make a sync `inDepartment(catalog, slug)` helper in `lib/catalog.ts` and use it from page, Header and `productsIn` |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | Rename `components/home/Bento.tsx` → `DeptIndex.tsx` | It's a numbered list, and CLAUDE.md explicitly bans bento grids, so the name misleads reviewers |
| N2 | Rename the `CartToast` type (`CartProvider.tsx:17`) to `ToastData` | Right now one identifier names both a type and a component |
| N3 | Make `Newsletter.tsx` and `QuickAdd.tsx` use their own CSS modules instead of `Footer.module.css` / `ProductCard.module.css` | Keeps the one-component, one-module convention the rest of the repo follows |
| N4 | Pick one type-import style (37 `import type` statements vs 5 inline `type X` specifiers) and fix the out-of-order import at `app/product/[handle]/page.tsx:2` | Consistency, and a future `eslint-plugin-import`/`simple-import-sort` would flag both |
| N5 | Add `import "server-only"` to `lib/og.tsx` (it uses `node:fs`) | Same guard as `lib/catalog.ts`/`lib/bundles.ts` |
| N6 | Pull ScrollFilm's timeline math (easing helpers, ~25 lines) into `components/home/film-math.ts` | `ScrollFilm.tsx` is 383 lines, and the math can be tested on its own |
| N7 | Add `"engines": { "node": ">=20" }` and an `.nvmrc` | Pins the Node used locally and on Vercel |
| N8 | `scripts/snapshot.mjs` keeps `options`, which `normalize()` never reads; `blur-rivals.py` overwrites its source | Trim the snapshot. Have the script read from an untouched original (or refuse to run twice), so re-running doesn't double-blur |
| N9 | Upgrade path for `npm audit`: `postcss@8.4.31`, pinned by Next 15 (1 high, 1 moderate) | Build-time only, and it processes the repo's own CSS, so the practical risk is low. It goes away with Next 16 or an `overrides` entry |

#### Convention Compliance Checklist
| Convention | Status | Notes |
|-----------|--------|-------|
| File placement | ⚠️ Partial | Components co-located with modules ✓. Domain logic in `components/shop/taxonomy.ts` and `components/product/{labels,sizes}.ts` is used server-side ✗. `CREDITS.md` inside `public/` ✗ |
| Naming conventions | ✓ Mostly | PascalCase components, camelCase helpers, `X.module.css` ✓. `Bento` misnamed; `CartToast` type/component collision |
| Barrel exports | ✓ N/A | The repo convention is direct file imports with no `index.ts` anywhere, applied consistently |
| Import ordering | ✓ Mostly | external → `@/` → relative → css. One exception (`app/product/[handle]/page.tsx:2`) |
| Type imports separated | ⚠️ Mixed | 37 `import type` statements vs 5 inline `type` specifiers |
| Path aliases used | ✓ | `@/` across directories; no `../` imports |
| No dead code left | ✗ | `toCard`, `breadcrumbJsonLd`, 6 images, 1 font, 15 tokens, 2 global classes, unused props |
| Structured logging | ✗ (none) | No logger and no logging at all in app code. The catalog's snapshot fallback is silent (see prod report). `console.log` only in scripts (fine) |
| No lint suppressions | ✗ | 8 `eslint-disable` comments for a linter that isn't installed |
| CLAUDE.md present | ✓ | Root CLAUDE.md is accurate on layout. It points to `public/media/CREDITS.md` (move per R8). No sub-directory CLAUDE.md is needed at this size |

#### Reuse Opportunities
- **`lib/config.ts`** already exports `STORE_DOMAIN`, `CLUB_SITE` and `price()`. Use them in `app/layout.tsx:32`, `Footer.tsx:7`, `sizeChart.ts:3`, `lib/seo.ts:38`, `app/page.tsx:68` and `lib/og.tsx:182`, and add `discountPct()` there.
- **`lib/seo.ts`** `SITE_URL`, `SITE_NAME`, `canonical()`, `jsonLdString()` + **`components/seo/JsonLd.tsx`**: use them for `metadataBase`, the five repeated store-name literals, the department/accessibility canonicals and the product JSON-LD.
- **`lib/catalog.ts`** `getDepartment()` / `productsIn()` should replace the `DEPARTMENTS.find(...)!` calls in `app/page.tsx` and `Header.tsx`.
- **`taxonomy.ts` `KITS`** (or a merged `lib/kits.ts`) should replace `KIT_EN`, `KIT_CODE`, `PrintTeaser.CODE`, `ScrollFilm.LATIN`/`HEB`.
- **`taxonomy.ts` `DEPT_LATIN`/`DEPT_PHOTO`** (or fields on `DEPARTMENTS`) should replace `Bento.PHOTO`/`CODE`, and could feed the Footer/not-found/CartDrawer/manifest link lists.
- **`lib/bundles.ts` `BundleItem`** should replace `Bundle.tsx`'s local `Item`.
- **`PrintStudio.NAME_MAX`** should replace the literal `12` in `PrintTeaser.tsx` and `Jersey.tsx`.
- **`--radius` / `--radius-sm` / `--fs-*` tokens** should replace the 13 literal `border-radius: 2px` and many px font sizes.

#### Verdict Details
- File Organization: CONCERNS. Domain logic lives under `components/`, and deployable docs sit in `public/`.
- Naming Consistency: PASS with notes (`Bento`, `CartToast`).
- Import Hygiene: PASS (one ordering slip; mixed type-import style).
- Code Reuse: CONCERNS. Five copies of the kit codes, two diverging `techLabel`/`sizeRank`, the season hardcoded 29×, department metadata in about 8 places.
- Lint Compliance: CONCERNS. `tsc --noEmit` passes cleanly, but there's no ESLint, the lint script is deprecated/broken, there are 8 orphan suppressions, and no CI.

##### Uncertain / not verified
- I didn't run `npm run lint`: it would prompt to install ESLint. The deprecation was verified from the installed Next CLI source.
- "Unused" is based on grep for identifiers and file names. Dynamic string construction could hide a use. I checked `/kits/${kit}.webp` (used) and the `/media/` template patterns (none found).

---

## 7. Production Readiness

### Production Readiness Audit: Maccabi Tel Aviv FC concept storefront (repo health, branch `wip/shop-v1`)

**Perspective**: Production Readiness Engineer
**Date**: 2026-10-30
**Plan**: none (repo-health mode). Code at `/home/user/maccabi-` (HEAD `8df82e7`) plus the live deploy https://1maccabi.vercel.app, probed with curl. No dev server or build was run. Mobile-menu internals (`HeaderBar.tsx` / `Header.module.css`) were skipped per the exclusion.

#### Plan Summary
What ships: a Next.js 15 storefront on Vercel. It reads Shopify's public `products.json` through ISR / `unstable_cache` with a committed snapshot fallback, keeps the cart in `localStorage`, and hands checkout to the real Shopify cart permalink. It has no database and no secrets.

What can break:
- Shopify bot protection and rate limits, and schema or catalog changes, can push the site onto stale snapshot data or crash it. The catalog drives the root layout, so a failure there takes down every page.
- Several live defects are verified: broken OG images, canonicals that point to the homepage, a soft 404, and product pages that are never cached.
- There's no error boundary and no observability, so nobody would see any of this happen.

#### Files Reviewed
| File | Production Role | Risk |
|------|----------------|------|
| `lib/catalog.ts` | Fetches the live feed (2 pages in parallel, 8 s timeout), normalises it, caches 15 min, falls back to the snapshot | **High** |
| `data/catalog.snapshot.json` | Offline/outage fallback (469 products). Identical to the live feed today (checked handles and prices) | Medium |
| `app/layout.tsx` | Root metadata (`metadataBase`, canonical, robots) and the async `Header` that reads the catalog on every page | **High** |
| `components/shell/Header.tsx` | Builds the mega menu from the catalog for 7 departments per render, inside the root layout | **High** (blast radius) |
| `app/page.tsx` + `components/home/ScrollFilm.tsx` | Home page, ISR 900 s. The hero needs `currentKits()` to be non-empty | **High** |
| `app/product/[handle]/page.tsx` | PDP with `revalidate = 900`, but served dynamically on every request on live | **High** |
| `app/product/[handle]/opengraph-image.tsx`, `lib/og.tsx` | Runtime OG rendering with `readFile` from `process.cwd()` and a remote image fetch | **High** (500 on live) |
| `app/shop/[slug]/page.tsx` + `loading.tsx` | Department listing, dynamic per request (`await searchParams`) | Medium |
| `app/search/page.tsx`, `app/api/search/route.ts` | Server search over the cached catalog. The API is CDN-cached 60 s per URL | Medium |
| `components/cart/CartProvider.tsx`, `CartDrawer.tsx`, `lib/config.ts` (`checkoutUrl`) | localStorage cart → Shopify permalink | Medium |
| `next.config.ts` | Security headers and cache headers for `/crest.png` and `/icons/*` | Medium |
| `app/robots.ts`, `app/sitemap.ts`, `lib/seo.ts` (`INDEXABLE`) | Keeps the preview out of search engines; production SEO | Medium |
| `app/not-found.tsx` | Branded 404. There's no `error.tsx` / `global-error.tsx` | **High** (missing) |
| `public/media/*`, `public/media/CREDITS.md` | Official club photos with rights pending; the provenance notes are publicly served | **High** (legal) |
| `app/accessibility/page.tsx`, `app/page.tsx` (fan-club copy) | Legal and claim copy | Medium |

#### Verdict: APPROVE WITH CHANGES

The architecture suits a concept front end over Shopify: read-only public feed, ISR, snapshot fallback, checkout on Shopify, and nothing to corrupt. **It is not launch-ready**, and the public preview itself has defects visible to anyone who gets the link (broken link previews, a 500 on product OG images). C1–C9 are each small, contained fixes. Only C6 (the PDP caching root cause) needs investigation first. Do C1–C5 before the pitch link is shared any wider. C6–C9 block any production cutover.

#### Critical Issues (Must Fix)
| # | Issue | File(s) | Production Failure Mode | Fix |
|---|-------|---------|------------------------|-----|
| C1 | **No error boundaries, and the catalog sits in the root layout.** There's no `app/error.tsx` or `app/global-error.tsx`. The async `Header` in `app/layout.tsx:62` calls `productsIn()` for every page, including the 404 page. | `app/layout.tsx:62`, `components/shell/Header.tsx:34-38`, missing `app/error.tsx` / `app/global-error.tsx` | If the catalog throws (see C3) on a dynamic route (PDP, PLP, search; all are dynamic, see C6), every page shows Next's default unbranded English "Application error", the 404 page included. The root layout fails too, so only `global-error.tsx` could catch it. | Add `app/global-error.tsx` (it renders its own `<html>`, needs no catalog, Hebrew copy plus a link to the Shopify store) and `app/error.tsx` (client, `reset()`). Have `Header` catch catalog failures and render a static nav from `DEPARTMENTS` with no counts. |
| C2 | **The home hero crashes if `currentKits()` returns `[]`.** `home = kits.find(...) ?? kits[0]` is then dereferenced without a guard (`home.title`, `home.handle`, `home.price`). `PrintTeaser` builds `/product/undefined` in the same case. `currentKits()` depends on 4 products whose titles match `/26[./]27/` + "גבר" + "חולצת" (all 4 exist today, checked in the snapshot). | `components/home/ScrollFilm.tsx:40,344-351`, `components/home/PrintTeaser.tsx:73`, `lib/catalog.ts:179-187` | A season rollover (27/28), a renamed title, or a snapshot without those shirts → TypeError while rendering `/`. During `next build` the deploy fails. At runtime, ISR keeps the stale page, so the failure is hidden until the next deploy or a cold cache. | Guard: `if (!home) return <StaticHero/>` (or skip the CTAs). In `PrintTeaser`, render no link when `links[kit]` is missing. Move the season to one constant (repo report C2). |
| C3 | **A transient Shopify failure swaps live data for the committed snapshot. Malformed live data has no fallback at all.** (a) `fetchLive()` turns any error into `null` and `loadCatalog()` returns the snapshot. That result is stored by `unstable_cache` for 15 min under the same tag, replacing the last good live data. Shopify's edge **does** challenge server-side fetches: from this environment, `products.json?page=1` returned **HTTP 429 "Verifying your connection..."** while page 2 succeeded seconds later (both observed). There's no retry and `Retry-After` is ignored. (b) `normalize()` runs **outside** the try/catch. A shape change (e.g. `variants`/`images` missing or renamed) throws → `requestCatalog`'s catch calls `loadCatalog()` again (a second uncached fetch of ~1.3 MB) → it throws again → C1. | `lib/catalog.ts:77-113` | (a) For 15 min after one 429, prices and stock come from a snapshot that could be weeks old: wrong "in stock" flags, wrong prices (Shopify checkout corrects the price, but the UI has misled the customer). Nothing records this happened. (b) The whole site errors. | Throw from the live loader inside `unstable_cache`, so a failed background revalidation keeps the last good entry. Fall back to the snapshot only when there's no cached entry (in `requestCatalog`'s catch). Validate per product: `try { normalize(p) } catch { skip + count }`, and treat "too many skipped" as a failure. Retry once on 429/5xx after a short backoff. Log the source (`live` / `stale` / `snapshot`) and its age. *(Verify: Next's keep-stale-on-error behaviour for `unstable_cache` background revalidation, on Next 15.5 / Vercel.)* |
| C4 | **Social and link previews are broken on the deployed preview.** `metadataBase` is hardcoded to `https://shop.maccabi-tlv.co.il`, so every `og:image`/`twitter:image` on `1maccabi.vercel.app` points to the real Shopify store. `https://shop.maccabi-tlv.co.il/opengraph-image` → **404** (verified). The product `og:image` URL is also **double-encoded** (`/product/%25D7%2597…`, verified in the live HTML). | `app/layout.tsx:32`; `app/product/[handle]/opengraph-image.tsx` | Anyone pasting the pitch link into WhatsApp, Slack or email gets no image. The double encoding would 404 even on the right host. | `metadataBase: new URL(SITE_URL)` and set `NEXT_PUBLIC_SITE_URL=https://1maccabi.vercel.app` on the Vercel project. The sitemap and canonicals currently show the prod domain, so it's either unset or set to the prod domain. For the PDP, set `openGraph.images` explicitly with `absoluteUrl(\`/product/${handle}/opengraph-image\`)`, or decode `params.handle` before Next re-encodes it. Re-test with a Hebrew handle. |
| C5 | **The product OG image route returns HTTP 500 on live** for existing products. An unknown handle correctly returns 404, and the static `/opengraph-image` returns 200. | `lib/og.tsx:27-39,78-81,148-152` | Every product share card fails. Likely cause (unverified, no function logs): `asDataUrl(path)` does `readFile(join(process.cwd(), path))` with a **runtime parameter**, so output file tracing can't include `public/icons/icon-192.png` (and possibly `assets/fonts/*.ttf`) in the serverless bundle → ENOENT. The site OG works only because it's prerendered at build. The module-level `fonts ??=` promise also caches a rejection for the life of the instance. | Add `outputFileTracingIncludes: { "/product/[handle]/opengraph-image": ["./assets/fonts/**", "./public/icons/icon-192.png"] }` in `next.config.ts`, or load the assets with `fetch(new URL("../assets/fonts/Anton-Regular.ttf", import.meta.url))` / static imports. Reset `fonts = null` on rejection. Confirm in the Vercel function logs. |
| C6 | **Product pages are never cached on live despite `revalidate = 900`.** Three consecutive requests to two different PDPs all returned `cache-control: private, no-cache, no-store` and `x-vercel-cache: MISS`, with no `x-nextjs-prerender`. `/` and `/accessibility` are `HIT` with `x-nextjs-prerender: 1`. `/shop/*` and `/search` are dynamic by design (they read `searchParams`). Functions run in **`iad1`** (Washington, D.C., per `x-vercel-id`), far from Israeli users. | `app/product/[handle]/page.tsx:16` (route `x-matched-path: /product/[handle]`); Vercel project region | Every PDP/PLP/search view is a cold-ish function invocation in the US, roughly 0.26–0.5 s TTFB from this vantage before Israel RTT. It costs money at scale. Under a traffic spike (kit launch day), function concurrency becomes the bottleneck instead of the CDN. **Root cause unverified.** Hypotheses: (1) a dynamic API somewhere in the PDP subtree; (2) an ISR cache-key problem with the percent-encoded Hebrew paths (every handle is non-ASCII: 0 of 469 are ASCII). The double encoding in C4 shows Next mishandling these params. | Check the `next build` route table (● vs ƒ for `/product/[handle]`). Add `generateStaticParams` returning the top N handles plus `dynamicParams = true`. Test whether an ASCII-slug route caches. If Hebrew paths are the cause, consider ASCII slugs (`/product/<id>-<slug>`) with a redirect from the Hebrew handle. Set the function region to `fra1` (closest to IL) in project settings or `vercel.json`. |
| C7 | **Unknown departments are soft 404s.** `/shop/nope` and `/shop/%25` return **HTTP 200** with the 404 UI and an injected `noindex`. `/product/<unknown>` correctly returns 404. | `app/shop/[slug]/page.tsx:45-46` + `app/shop/[slug]/loading.tsx` | `loading.tsx` streams the shell with status 200 before `notFound()` runs. Crawlers and monitors see 200, and typos or old links never surface as 404 in analytics. | `export function generateStaticParams() { return DEPARTMENTS.map(d => ({ slug: d.slug })) }` + `export const dynamicParams = false` (unknown slugs 404 before rendering). Or validate the slug in a `app/shop/[slug]/layout.tsx`, which isn't wrapped by the segment's own loading boundary. *(Verify `dynamicParams=false` still 404s while the page reads `searchParams`.)* |
| C8 | **Every page that doesn't set its own canonical points to the homepage.** The root layout's `alternates: { canonical: "/" }` is inherited, so `/shop/kits`, `/search?q=x` and `/accessibility` all render `<link rel="canonical" href="https://shop.maccabi-tlv.co.il">` (verified live). | `app/layout.tsx:36`; `app/shop/[slug]/page.tsx:15-18`; `app/accessibility/page.tsx:4` | At launch (`NEXT_PUBLIC_ALLOW_INDEX=1`), Google folds every department page into the homepage, so the collection pages (the highest-value SEO pages of a store) drop out of the index. | Remove the root `alternates`. Add `alternates: canonical(\`/shop/${slug}\`)` to the dept `generateMetadata` and to `/accessibility`. |
| C9 | **Domain and URL cutover plan is missing.** `STORE_DOMAIN` (Shopify: `products.json`, cart permalink, policies) and `SITE_URL` (this app) both default to `shop.maccabi-tlv.co.il`, but one hostname can't be served by both. The app has no redirects for Shopify's URL scheme: `/products/abc`, `/collections/all`, `/pages/size-chart` and `/cart` all → 404 on live. Policy and size-chart links are hardcoded to `shop.maccabi-tlv.co.il` and don't follow `STORE_DOMAIN` (`Footer.tsx:7`, `sizeChart.ts:3`). | `lib/config.ts:2,5-7`, `lib/seo.ts:5`, `next.config.ts` (no `redirects()`), `components/shell/Footer.tsx:7`, `components/product/sizeChart.ts:3` | If the app takes over `shop.maccabi-tlv.co.il`: (1) checkout permalinks hit the Next app → 404, so no sales; (2) every indexed `/products/*` / `/collections/*` URL, Instagram link and email link → 404; (3) policy and size-chart links 404. | Before launch: move Shopify to a separate host (`<store>.myshopify.com` for the feed plus a `checkout.`/`store.` subdomain for the cart) and set `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`. Add `redirects()`: `/products/:h` → `/product/:h` (308), `/collections/:c` → mapped `/shop/:slug` or `/search?q=`, `/pages/size-chart` → the PDP size guide or the Shopify host. Derive every store URL from `STORE_DOMAIN`. Write this down in the README. |

#### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| R1 | **Public preview with rights-pending media and "official store" branding.** `1maccabi.vercel.app` is reachable without auth. Title, OG and JSON-LD say "החנות הרשמית" / "OFFICIAL STORE" / SportsOrganization, with club crest and player photos; only the footer says "קונספט עיצוב · לא האתר הרשמי". Checkout sends real customers to the real store, so money isn't diverted, but a fan could order there believing the name/number print is included. The cart note does say "concept". `public/media/CREDITS.md` is publicly served and says rights are unconfirmed. | Legal and reputational exposure for an unapproved pitch, and the club could reasonably read it as impersonation. noindex doesn't stop sharing. | Turn on Vercel Deployment Protection (password or Vercel Auth) until the club signs off. Move `CREDITS.md` out of `public/`. Show a "concept, not the official store" banner above the fold, not only in the footer. Consider pointing checkout at a disabled or "concept" page on the preview. |
| R2 | **Zero observability.** No logging, no error tracking (Sentry etc.), no Vercel Analytics/Speed Insights. The snapshot fallback, the OG 500s and search API failures are all silent. | Nothing in this audit's verified live defects would have alerted anyone. | Log `catalog source=live|snapshot age=… pages=… ms=…` at a level that shows in the Vercel function logs. Add `@vercel/analytics` + Speed Insights. Add Sentry (or Vercel's log drains) for server errors. Optionally add an internal `x-catalog-source` response header on dynamic routes. |
| R3 | **No on-demand revalidation, and staleness stacks up.** Page ISR (900 s) on top of `unstable_cache` (900 s) on top of the fetch data cache (900 s) can serve stock/prices roughly 30–45 min old. There's no webhook route; the README describes it as future work. | On drop or launch day, sold-out sizes keep showing as available. | Add `app/api/revalidate/route.ts`: verify the Shopify HMAC with `SHOPIFY_REVALIDATION_SECRET`, then `revalidateTag(CATALOG_TAG)`. Drop either the fetch-level or the `unstable_cache` layer so there's a single 15-min TTL. |
| R4 | **Cart lines are trusted forever.** `price`, `title` and `image` are frozen at add time. `isLine()` only checks `key` and `qty > 0`. Removed or renamed variants stay in the cart. `checkoutUrl()` emits duplicate `variantId:qty` pairs when the same variant has two print lines (`123:1,123:1`). `MAX_QTY` = 99 in the cart vs 10 on the PDP. | The subtotal can disagree with Shopify's total. A dead variant id in the permalink → Shopify error or a silently dropped line *(Shopify's exact behaviour for duplicate or invalid ids is unverified; I didn't test against the real store to avoid creating carts)*. | On drawer open, refresh the lines against a small `/api/cart-check?ids=` (variant → price/available from the cached catalog) and flag changes. Aggregate quantities by `variantId` in `checkoutUrl()`. Validate `variantId` (number), `price` (finite) and `handle` (string) in `isLine`. Align the quantity limits. |
| R5 | **The search overlay has no error state.** It calls `res.json()` without checking `res.ok`. On a 500, `data` stays `null`, so the label reads "מחפש…" with 8 skeletons forever. | A catalog failure (C3b) or a function timeout looks like an endless spinner. | `if (!res.ok) throw …`. Show "החיפוש לא זמין כרגע" plus a link to `/search?q=`. |
| R6 | **Preview noindex relies on `robots.txt: Disallow: /` + meta.** No `X-Robots-Tag` header is sent (verified). Disallow stops crawlers from ever seeing the meta noindex, so an externally linked preview URL can still be indexed URL-only. Images and OG routes have no meta at all. `/sitemap.xml` is still served on the preview with ~470 production-domain URLs that don't exist on Shopify. | Stray indexing next to the club's real store. | When `!INDEXABLE`, send `X-Robots-Tag: noindex, nofollow` from `next.config.ts` `headers()` and allow crawling (or rely on R1's protection). Return an empty sitemap when not indexable. Launch checklist: set `NEXT_PUBLIC_ALLOW_INDEX=1` for the Production environment **only** (build-time var: redeploy). |
| R7 | **No CSP.** Other headers are good (nosniff, Referrer-Policy, XFO, HSTS, Permissions-Policy, `poweredByHeader: false`, all verified live). | Defence in depth for inline JSON-LD and Shopify-sourced strings. The PDP JSON-LD is built with raw `JSON.stringify` (`app/product/[handle]/page.tsx:74`) instead of the escaping `jsonLdString()`. | Use `<JsonLd>` for the product schema. Start with `Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'; img-src 'self' https://cdn.shopify.com data:` and tighten later (nonces for the two inline scripts). |
| R8 | **Search API abuse surface.** `q` is capped at 80 chars ✓, POST → 405 ✓, the CDN caches 60 s per URL (second request `HIT`, verified). Each unique `q` still costs a function invocation (cheap: a linear scan of 469 items). | Random-query floods bypass the CDN. | Add a Vercel Firewall rate-limit rule on `/api/search` at launch. The current risk is low. |
| R9 | **Local photography isn't resized.** The custom loader returns `/media/x.webp?w=N` for local files, so every `srcset` width is the same full file (e.g. `trophy-celebration.webp`, 215 KB, served to phones). `/media/*` and `/kits/*` are served `max-age=0, must-revalidate`, so they're revalidated on each view; only `crest.png` and `icons/*` get the 1-day header. | LCP and data cost on mobile, and an extra round trip per image on repeat views. | Pre-generate width variants (or route local images through Vercel image optimisation with a loader branch). Add `/media/:path*` and `/kits/:path*` to the cache-header rule (filenames are stable; add a version suffix when an image is edited). |
| R10 | **Unverified claims in legal and marketing copy.** `/accessibility` asserts conformance with IS 5568 / WCAG 2.1 AA without an audit. It's flagged as a draft, but Israeli regulations require a statement with coordinator contact details before launch. Home fan-club copy asserts "עדיפות בכרטיסים, הטבות במנוי ומתנת הצטרפות" and "FAN CLUB · SINCE 1906" (`app/page.tsx:63,66`). | CLAUDE.md honesty rules: don't invent facts. I couldn't verify these benefits, and 1906 is the club's founding year, not necessarily the fan club's. | Source the fan-club claims from the club or mark them as placeholder. Say "בתהליך התאמה" instead of asserting conformance until an a11y audit is done. Fill in the coordinator details before launch. |
| R11 | **Cold-cache latency.** With an empty cache (first deploy, tag purge), the first request waits for 2 × `products.json` (0.6–0.75 MB each, ~0.7 s measured) with an 8 s timeout per page. On a normalisation error (C3b) it fetches twice. | A slow Shopify on a cold start means a slow or failed first render. | Keep the 8 s timeout but run the fallback race: if live doesn't finish in ~3 s on a cold cache, serve the snapshot and let the live fetch populate the cache in the background. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | Use the live feed's product-level `updated_at` (currently discarded) for sitemap `lastModified` instead of `created_at` | More accurate recrawl signals at launch. The sitemap comment says the field isn't available, but that's only true of the trimmed snapshot |
| N2 | Product `generateMetadata` replaces the whole `openGraph` object, so PDPs lose `og:site_name`, `og:locale` and `og:type` (verified live). Merge in the layout values and use `type: "website"` plus product-specific `og:image:alt` | Better share cards |
| N3 | Trim the meta description at a word boundary and collapse newlines (it currently ends mid-word: "…אל העתיד, ו") | SERP polish |
| N4 | Add `app/product/[handle]/loading.tsx` | PDP navigations currently hold the old frame (TransitionRouter waits up to 1.2 s) and then cut |
| N5 | Add a snapshot freshness check (fail CI or warn if `catalog.snapshot.json` is more than N days old) and a scheduled `npm run snapshot` | Keeps the fallback close to reality |
| N6 | `npm audit --omit=dev`: `postcss@8.4.31` inside Next 15 (1 high, 1 moderate) | Build-time only, on the repo's own CSS, so low practical risk. Fixed by Next 16 or `overrides` |
| N7 | Put a short "launch checklist" in the README: env vars per environment, domain split, redirects, deployment protection off, `ALLOW_INDEX=1`, accessibility coordinator, rights sign-off | Makes the cutover repeatable |

#### Failure Mode Analysis
| Scenario | What Fails | User Impact | Recovery | Plan Handles It? |
|----------|-----------|-------------|----------|-------------------|
| Shopify unreachable / timeout (>8 s) | `fetchLive` → `null` → snapshot | Site works on snapshot data; stock and prices may be stale | Automatic after 15 min | ⚠️ Partially. Works, but silent, and it can overwrite good live data (C3a) |
| Shopify 429 bot challenge on one page (observed) | Whole live fetch discarded → snapshot cached 15 min | Same as above | Next revalidation | ⚠️ No retry, no `Retry-After`, no log |
| Shopify feed shape changes (field renamed/missing) | `normalize()` throws outside the try → double fetch → throw | Dynamic routes and the root layout error → Next default error page (no `global-error.tsx`). Home serves stale ISR until the next deploy, then the build fails | Manual code fix | ❌ (C1, C3b) |
| Season rollover / kit titles renamed | `currentKits()` → `[]` → `ScrollFilm` TypeError; `PrintTeaser` → `/product/undefined`; "new" dept, search idle list and OG season label go empty | Home build fails; stale page until then | Manual edit in ~18 files | ❌ (C2, repo C2) |
| Product deleted from Shopify | `getProduct` → `null` → 404 (PDP is dynamic, so immediate) | Correct 404 | n/a | ✓ |
| Variant deleted while in a customer's cart | Permalink includes a dead id | Shopify error or silently dropped line *(unverified)* | User edits the cart | ❌ (R4) |
| Same shirt with two different prints | Permalink `123:1,123:1` | Possibly the wrong quantity at checkout *(unverified)*; prints never reach Shopify (UI says so) | — | ⚠️ (R4) |
| Shopify CDN image missing / 404 | `next/image` broken image | Empty tile (no `onError` fallback); cards without images use an "MTA" placeholder | — | ⚠️ Partial |
| Local media file missing | Static 404 | Broken hero or story image | Redeploy | ⚠️ No fallback (low likelihood) |
| Product OG image request | `readFile` of an untraced path → 500 (verified) | No share image for any product | Code fix | ❌ (C5) |
| Sharing any preview URL | `og:image` → `shop.maccabi-tlv.co.il/...` → 404 (verified) | No share image anywhere | Code + env fix | ❌ (C4) |
| Unknown department URL | Streams 200 + 404 UI (verified) | Soft 404; monitors and crawlers see 200 | — | ❌ (C7) |
| Unknown product / random path / malformed `%` encoding | 404 (verified for `/product/%25`, `/product/%25E0%25A4%25A`) | Correct | — | ✓ |
| Search API error | 500 → overlay `res.json()` throws silently | Endless "מחפש…" spinner | Close overlay | ❌ (R5) |
| Search API query flood | Function invocation per unique `q` | None at concept scale | CDN caches repeats 60 s | ⚠️ No rate limit (R8) |
| Launch-day traffic spike | PDP/PLP/search all dynamic in `iad1` | Latency and cost; function concurrency limits | — | ❌ (C6) |
| `localStorage` blocked / private mode / corrupt JSON | `try/catch` around every read and write; `Array.isArray` + `isLine` filter | Cart works for the session only | — | ✓ (shallow validation, R4) |
| Cart edited in another tab | `storage` event resyncs | Consistent | — | ✓ |
| Build with Shopify blocked (CI/Vercel) | Snapshot baked in, ISR refreshes after 15 min | None if the snapshot is fresh | Automatic | ✓ (if snapshot fresh; N5) |
| Bad deploy | Vercel instant rollback. No DB or schema; `unstable_cache` key is versioned (`catalog:v2`) | — | One click | ✓ |
| Production cutover to `shop.maccabi-tlv.co.il` | Cart permalink, policies and size chart point at the same host as the Next app; no legacy redirects | Checkout broken; all old links 404 | — | ❌ (C9) |
| Forgetting `NEXT_PUBLIC_ALLOW_INDEX=1` at launch | Whole store `noindex` + `Disallow: /` | Invisible to Google (fails closed) | Set env + redeploy | ⚠️ Safe default, needs a checklist (R6, N7) |

#### Environment Checklist
| Concern | Dev | Prod | Gap? |
|---------|-----|------|------|
| File paths | `process.cwd()` = repo root; `assets/fonts` and `public/icons` exist on disk | Vercel function bundle contains only traced files. `public/` is CDN-only. `lib/og.tsx` reads `public/icons/icon-192.png` (+ fonts) via a runtime path → product OG 500 (verified) | **Yes** (C5) |
| Network | Laptop IP fetches `products.json` freely | Shared datacenter egress, so Shopify's edge can serve 429 challenges (observed from this environment). Functions in `iad1` | **Yes** (C3, C6) |
| Permissions | n/a (read-only, no writes) | Read-only FS is fine: the app never writes at runtime | No |
| Config | `.env.example` documents 3 optional vars with sane defaults | `NEXT_PUBLIC_SITE_URL` not set on Vercel (sitemap and canonicals show the prod domain), and `metadataBase` ignores it anyway. `STORE_DOMAIN` and `SITE_URL` default to the same host. `NEXT_PUBLIC_ALLOW_INDEX` is build-time | **Yes** (C4, C9, R6) |
| Build output | `next dev` renders everything dynamically | Home/accessibility prerendered ✓. PDP unexpectedly dynamic (C6). PLP/search dynamic by design. A home render failure blocks the deploy (C2) | **Yes** (C2, C6) |
| Caching | No data cache in dev | Three stacked 15-min caches; snapshot result cached like live data | **Yes** (C3, R3) |
| Monitoring | Console | No logs, no error tracking, no analytics | **Yes** (R2) |
| Access / legal | Local only | Public, unauthenticated, rights-pending media, "official store" metadata, `CREDITS.md` public | **Yes** (R1) |

#### Verdict Details
- E2E Flow: CONCERNS. Browse → cart → Shopify checkout works on the preview. Production cutover breaks checkout and every legacy URL without C9. Share previews are broken (C4, C5).
- Error Recovery: CONCERNS. Good: the snapshot fallback, timeouts on every server fetch (8 s / 6 s), the AbortController in search. Missing: error boundaries, a guard on an empty kits list, retry/backoff, keeping the last good data, a search error state.
- Data Integrity: PASS with notes. No server-side writes. The cart is client-only with a versioned key and try/catch. Stale-price and dead-variant lines aren't reconciled (R4).
- Environment Parity: CONCERNS. Untraced runtime file reads, hardcoded `metadataBase`, unset `NEXT_PUBLIC_SITE_URL`, one host assumed for both Shopify and the app, US region.
- Observability: CONCERNS. None at all; every failure mode above is silent.

##### Verified vs uncertain
- **Verified live (curl, 2026-10-30):**
  - Security headers present.
  - `robots.txt` = `Disallow: /`.
  - Meta robots `noindex, nofollow`.
  - Canonical = homepage on `/shop/kits`, `/search`, `/accessibility`.
  - `og:image` on the Shopify host → 404; product `og:image` double-encoded.
  - Product OG 500 (unknown handle 404).
  - PDP `private, no-store` + MISS ×3 on two handles; home/accessibility HIT + prerender.
  - `/shop/nope` → 200 soft 404.
  - Legacy Shopify paths → 404.
  - `/api/search` cached 60 s (MISS then HIT), POST → 405.
  - `/media/CREDITS.md` → 200.
  - No `X-Robots-Tag`.
  - Region `iad1`.
  - Shopify `products.json` 429 challenge seen once from this sandbox.
- **Uncertain:**
  - Root cause of C5 (likely untraced `readFile`) and C6 (dynamic API vs Hebrew-path ISR key).
  - Next 15.5's keep-stale-on-error behaviour for `unstable_cache` (C3 fix).
  - Shopify permalink behaviour with duplicate or dead variant ids (R4).
  - Whether the fan-club benefits are real (R10).
  - Whether Vercel's egress IPs get the same Shopify challenge as this sandbox.

---

## 8. DX Engineer

**Skipped**: this is a storefront for fans, not a developer tool.

---

## 9. Performance Engineer

### Performance Audit: Maccabi Tel Aviv concept storefront (repo health, `wip/shop-v1`: measured at 1ae6789 = live deploy, re-checked at HEAD 0b34ea4)

**Perspective**: Performance Engineer (translated from desktop app to web storefront: rAF/scroll loops, observers, long-session memory, image/JS/data/font weight, LCP/CLS, server fetch caching)
**Date**: 2026-10-30
**Plan**: repo-health audit of `/home/user/maccabi-` (no diff). Runtime evidence from the live deploy https://1maccabi.vercel.app (matches 1ae6789; see drift note), measured with Playwright/Chromium headless at 1440x900 and 390x844, plus CDP metrics, coverage and network logs. Scratch scripts: `/tmp/claude-0/-home-user/d6b30529-0315-5705-a1f6-419bbae3a32d/scratchpad/audit/work/`.
**Exclusion honoured**: the mobile menu inside `components/shell/HeaderBar.tsx` / `Header.module.css` is being redesigned by the lead. One measurement that lands in that markup is reported as an FYI only (see R1 note), not as a finding against it.

> **Code drift during the audit.** The audit started on `1ae6789`. That matches the live deploy: live still says "דלג על הסרט", `/shop/zzz` returns 200 and there is no `X-Robots-Tag`. While I was measuring, the branch moved to `0b34ea4`: 7 rewritten or new commits, 30 files. I re-checked every finding below against `0b34ea4` source. **Still present at HEAD:** C1, C2, C3, R1 (loader), R2, R3, R4, R5, R7–R10 and all nice-to-haves except where noted. **Changed at HEAD:** R6 now logs the snapshot fallback (`lib/catalog.ts` `loadCatalog`); the rest of R6 stands. `toCard()` was deleted (N2 reworded). The seven mobile-menu thumbnails in the R1 FYI were replaced by one feature image (`sizes="(max-width: 600px) 100vw, 480px"`). Whether it still loads while the menu is hidden is not verified, because the new code is not deployed. Live numbers are from the `1ae6789` deploy.

#### Plan Summary
A Next.js 15 / React 19 RSC storefront with no runtime dependencies beyond Next. JS weight and client data payloads are lean. The problems are elsewhere. A view-transition bug freezes the screen for about 4 s on every link click. Product pages are not cached even though they declare ISR. Kit product pages shift by 0.87 CLS. Every page runs an infinite hidden animation. The local-image loader does not resize anything, so small slots download full-size photos (about 0.8 to 1.6 MB of images before the first scroll).

#### Files Reviewed
| File | Performance Role | Risk |
|------|-----------------|------|
| `components/shell/TransitionRouter.tsx` | Wraps every same-origin link click in `document.startViewTransition` | **Critical**: 4 s freeze per navigation |
| `app/product/[handle]/page.tsx` | PDP route: `revalidate = 900`, `<Suspense>` around `ProductView` | **Critical**: not ISR (dynamic every request); CLS 0.87 |
| `components/product/ProductView.tsx` | PDP client island; `useSearchParams` only for print prefill | High: forces the Suspense boundary that causes the CLS |
| `lib/image-loader.ts` | Custom `next/image` loader (Shopify CDN + local files) | High: local files never resized (`?w=` is a no-op) |
| `components/shell/SearchOverlay.tsx` + `.module.css` | Always-mounted overlay; 8 skeleton `<li>` with infinite shimmer | High: ~60 style recalcs/s on every page, forever |
| `components/home/ScrollFilm.tsx` + `.module.css` | rAF scroll-scrub loop, ~35 custom props per frame on the sticky stage | Medium: ~6.5 ms style recalc/frame at 4x CPU; loop sleeps correctly |
| `lib/catalog.ts` | `products.json` fetch, `unstable_cache`, React `cache()`, snapshot fallback | Medium: per-request full catalog deserialisation on dynamic routes; silent snapshot caching |
| `components/shell/Header.tsx` | Server-built mega menu from the whole catalog | Medium: ~18 ms CPU per dynamic render (measured locally) |
| `app/shop/[slug]/page.tsx`, `components/shop/Browser.tsx` | Department page (dynamic by design via `await searchParams`), client filters | Low/Medium: no CDN caching; payloads fine (≤36 KB gz) |
| `components/shop/ShopCard.tsx`, `components/product/ProductCard.tsx` | Grid cards with a hover-only second image | Medium: second image downloaded on touch devices too (~40% of PLP Shopify bytes) |
| `app/page.tsx`, `components/home/Rail.tsx` | Home RSC; Rail gets full `Product` objects | Low: ~35 KB uncompressed unused fields in RSC |
| `components/shell/RevealObserver.tsx` | One IO + a `MutationObserver(body, subtree)` per pathname | Low: cleanup correct; scan on every DOM mutation |
| `app/globals.css` | Reveal transitions animate `filter: blur(6px)`; reduced-motion block | Low: blur transitions are paint-heavy on mobile |
| `app/layout.tsx` | 4 font families, 5 preloads (one TTF) | Low/Medium: preloads contend with the LCP image on slow links |
| `components/cart/*`, `components/home/Rail.tsx`, `components/product/Gallery.tsx`, `Lightbox.tsx`, `SizeGuide.tsx`, `components/cart/fly.ts` | Listeners/timers/portals | Low: all listeners/timers cleaned up; verified no leak |
| `next.config.ts` | Security + cache headers | Low: `/media/*` and `/kits/*` revalidate on every visit |

#### Verdict: NEEDS REWORK

Two issues, each on its own, make the store feel broken on a pitch demo: (1) every in-site link click shows the old page frozen for ~4 s, and (2) the match-kit product pages jump by 0.87 CLS on load. A third (product pages not cached) undermines the README's stated data flow. All three are small code fixes.

#### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| C1 | **View transition never resolves: ~4 s frozen screen on every link click.** The update callback resolves via `requestAnimationFrame(() => resolve())` inside `settle` (line 43). During a view transition's update callback the document's rendering is suppressed, so rAF callbacks do not run. The 1200 ms fallback timer is cleared at that moment (line 42), so the promise only ends when Chrome aborts the transition (`TimeoutError: Transition was aborted because of timeout in DOM update`). | `components/shell/TransitionRouter.tsx:36-47` (rAF at :43, `clearTimeout` at :42) | **Measured on live, 1440x900, Chromium:** dept → product: pathname changed at 395 ms, `ready` rejected with TimeoutError at 4022 ms; header nav → dept: pathname at 45 ms, abort at 4028 ms. `Page.captureScreenshot` could not get a frame for ~4 s (no frames produced). Applies to every same-origin `<a>` click for every non-reduced-motion user on browsers with same-document View Transitions (Chrome/Edge, Safari 18+, recent Firefox). Clicks during the freeze land on the new, invisible DOM. | In `settle`, resolve directly: `settle.current = () => { clearTimeout(timer); resolve(); }`. If a frame of delay is wanted, use `setTimeout(resolve, 0)`, never rAF. Add a Playwright check that `vt.ready` resolves (not rejects) within ~1 s. |
| C2 | **Kit PDPs: CLS 0.87.** `<Suspense>` with no fallback wraps `ProductView`. React streams the large boundary out of order: the shell, including `KitStory`, Bundle and Rail, paints first where the product hero should be. Then `$RC` swaps the hero in and pushes everything down. | `app/product/[handle]/page.tsx:75-77` (HEAD; 66-68 at 1ae6789); cause of the boundary: `components/product/ProductView.tsx:18` (`useSearchParams`) | Live HTML: `<template id="B:…">` at byte 71 840, `KitStory_story` at 71 901, the hidden `S:` segment with the `<h1>` at 127 199–139 074. Layout-shift attribution: one shift of **0.868** on `section.KitStory_story` (781 px tall, in viewport → pushed out) at ~550 ms, reproduced at both 1440x900 and 390x844. Non-kit PDPs measure ~0. Under Slow-4G throttling the swap lands before first paint, so CLS reads 0 there. Fast connections are the ones that shift. | Remove `useSearchParams` from `ProductView`. It only feeds a mount-time effect, so read `new URLSearchParams(location.search)` inside that `useEffect`. Then delete the `<Suspense>` wrapper. If a boundary must stay, give it a fallback with the hero's dimensions. |
| C3 | **Product pages are rendered dynamically on every request despite `export const revalidate = 900`.** A dynamic segment with no `generateStaticParams` is not prerendered. In Next 15.5's `build/static-paths/app.js:629`, `prerenderedRoutes` is `undefined` when the last dynamic segment has no `generateStaticParams`, so the route is ƒ (dynamic). | `app/product/[handle]/page.tsx:17` (HEAD; no `generateStaticParams` anywhere in the route) | Live: `cache-control: private, no-cache, no-store`, `x-vercel-cache: MISS` on repeated requests, no `x-nextjs-prerender` (home, by contrast: `HIT`, `x-nextjs-prerender: 1`). PDP TTFB 230–450 ms warm, plus a server render, a catalog deserialisation and an ~18 ms mega-menu build on every view. The README's "ISR, regenerated at most every 15 minutes" is not true for PDPs. | Add `export async function generateStaticParams() { return []; }` (on-demand ISR), or return the top-N handles. **Order matters:** do C2 first. Under static rendering, `useSearchParams` makes the whole `ProductView` (h1, price, gallery, add to cart) bail out to client-side rendering. |

#### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| R1 | **Local images are never resized.** The loader appends `?w=` to local paths, but Vercel serves the original file for every width. Each `srcset` candidate is the same file, and the same file under different `?w=` values is downloaded more than once. | `lib/image-loader.ts:7` | Home, desktop, first load before any scroll: **16 images, 1 682 KB**. `crest.png` (400x400 PNG, 115 KB) is fetched 3x per first visit (`/crest.png`, `?w=48`, `?w=256` = 345 KB) for a 44 px logo. `trophy-celebration.webp` (211 KB), `stadium-tifo.webp` (173 KB) and `match-home-1.webp` are each downloaded twice (as a `?w=96` thumb and full width). Phones get 1920 px plates. Slow-4G/4x-CPU mobile LCP: home **3.48 s**, dept **4.35 s**, mostly from bandwidth contention. **FYI for the mobile-menu redesign (not a finding against it):** 842 KB of that first load is the seven hidden 56 px mobile-menu thumbnails (`Header_mThumb`, `sizes="72px"`), which load on desktop too because they are `visibility:hidden` but laid out. | Remove the custom loader for local files: return `/_next/image?url=…&w=…&q=…` for non-Shopify `src` so Next's optimizer resizes them, or pre-generate width variants. Ship the crest as an SVG or a ~48/96 px WebP. Make sure hidden menus use `display:none` or render images only when open. |
| R2 | **Infinite hidden animation on every page.** The closed `SearchOverlay` renders 8 `.skel` items whenever `!shown` (always true until the first open). Each runs `shimmer 1.4s linear infinite !important` (a `background-position` animation, not compositable). | `components/shell/SearchOverlay.tsx:225`, `components/shell/SearchOverlay.module.css:256-265` | `document.getAnimations()` on product, dept and home shows 8 running `SearchOverlay_shimmer` animations on HIDDEN targets. Idle 5 s on PDP/dept: **300 style recalcs (60/s), ~200 ms main-thread task time** with nothing on screen moving. Battery drain for the whole session on phones. The `!important` also defeats the reduced-motion override (see a11y report). | Render the skeleton only when `open && loading && !shown`, or pause it with `.root:not([data-open="true"]) .skel { animation: none }`. Drop the `!important`. |
| R3 | **ScrollFilm per-frame style cost.** About 35 custom properties are written on `.stage` each frame. They inherit to the whole subtree, so every frame re-resolves styles for all descendants. The heavy layers (full-viewport `filter`, three `mix-blend-mode` layers, animated `clip-path` polygons, a 2x-viewport feTurbulence grain overlay) are repainted rather than composited. | `components/home/ScrollFilm.tsx:56,64-154`, `components/home/ScrollFilm.module.css:62-66,86,121,133,155-200,215-223,291,311,427-440` (HEAD) | Measured film scrub (wheel, 60 px steps): 1440x900 1x CPU: RecalcStyle 207 ms over 105 frames (~2 ms/frame), but frame interval p50 66.7 ms / p95 133 ms with 68 LoAF >50 ms (headless software raster: treat absolute fps as pessimistic, relative cost as real). 390x844 4x CPU: **RecalcStyle 891 ms over 138 frames ≈ 6.5 ms/frame**, p50 33 ms. Good news, verified: the loop sleeps when idle (0 style mutations in 2 s at rest), stops below the film, honours reduced motion, and cleans up its listeners. | Scope each variable to the element that uses it: set `--wipe` on `.yellow`, `--crest` on `.c3`, and so on, instead of the stage root, so only the right subtrees invalidate. Promote static filtered plates with `will-change: transform` so filters rasterise once. Replace animated `clip-path` with transform-driven masks where possible. Pause `.grain` when the film is off-screen (IntersectionObserver → `data-live`). |
| R4 | **Second "hover" image downloaded on touch devices.** Cards render `b` with `opacity:0`; lazy-loading ignores opacity, so every visible card fetches two images. | `components/shop/ShopCard.tsx:21`, `components/product/ProductCard.tsx:22` | `/shop/kits` at 390x844 DPR3: 14 of 30 Shopify images (**209 of 508 KB**) are hover-alt images a touch user can never see. At 1440: 18 images, 189 KB. | Render the alt image only on `(hover: hover)`. For example, mount it after `pointerenter`, or use a `<picture>` with `media="(hover: hover)"` and a 1x1 fallback. |
| R5 | **Per-request server work on dynamic routes.** `unstable_cache` stores the normalised catalog as JSON (~547 KB, measured from the 469-product snapshot), so every dynamic request (PDP, department, `/search`, `/api/search` on CDN miss) parses it again and rebuilds the `handleIndex` / search `WeakMap` indexes, which then never hit across requests. `Header` rebuilds the mega menu from the full catalog on every render (`typeOf()` with NFKD + Unicode regex inside 11x per-dept filters). | `lib/catalog.ts:118-146` (HEAD), `components/shop/taxonomy.ts:182-193`, `components/shell/Header.tsx:45-86` (HEAD `buildDepts`) | Local Node 22 microbench on the snapshot: JSON.parse ≈ 4 ms, search index build ≈ 3.6 ms, **Header mega-menu build ≈ 18 ms**, `toItem` over the catalog ≈ 10 ms. Lambda CPUs are slower. Fixing C3 removes most of it for PDPs; departments stay dynamic. | Wrap the derived menu (`depts`) in its own `unstable_cache` with the `catalog` tag, or memoise it in module scope keyed by a catalog version string. Compute `typeOf` / `techLabel` / `aud` once in `normalize()` and store them on `Product`. |
| R6 | **Snapshot fallback is cached for 15 min, and there is no stampede protection.** `fetchLive` swallows any error, including Shopify **429** (the audit sandbox got 429 on `products.json` immediately), and returns `null`. The snapshot catalog is then cached under the same tag for 900 s. Concurrent cold renders across lambdas all hit `products.json`. *At HEAD `0b34ea4` the fallback is now logged with `console.error`; the 900 s caching and the missing 429 retry remain.* | `lib/catalog.ts:77-114` (HEAD) | Stale prices/stock served for up to 15 min after one transient failure. Rate limiting is plausible during an ISR burst. Uncertain: whether a live 250-product page stays under the 2 MB fetch-cache limit. Could not verify because of the 429; the comment's 0.6–0.8 MB estimate is plausible. | `console.warn` on fallback. Cache the snapshot result with a short `revalidate` (e.g. 60 s) so live data returns quickly. Fetch pages with a single retry/backoff on 429. |
| R7 | **Reveal transitions animate `filter: blur(6px)`.** That is a paint-heavy property on every `[data-reveal]` element (each Rail card, Story120 picks, footer blocks). | `app/globals.css:412-425` (HEAD) | Up to 14 cards blur-in at once when a rail enters. Filter transitions repaint every frame on low-end phones (not measured in isolation). | Reveal with `opacity` + `transform` only (per the web-animation-design rules). |
| R8 | **Department pages are uncacheable** (`await searchParams` → dynamic) and wait on a full server render (TTFB 230–740 ms observed, cold 1.4 s on `/api/search`). Deliberate, per the comment, so filtered links SSR filtered. | `app/shop/[slug]/page.tsx:48` (HEAD) | Every department view is a lambda invocation. Payloads are small (≤36 KB gz, ≤188 items, slim `ShopItem`), so this is TTFB, not bytes. | Consider ISR for the unfiltered page, with filters applied client-side after hydration. That needs a non-`useSearchParams` read, to avoid a CSR bailout. Or accept and document the trade-off. |
| R9 | **Fonts: 4 families, 8 files, 156 KB; 5 preloads including a TTF.** Karantina is shipped as TTF (25 KB, preloaded). JetBrains Mono (one weight) is used only for micro labels. | `app/layout.tsx:14-29` | Five high-priority preloads compete with the LCP image on slow links (mobile LCP 3.5–4.4 s above). Header nav shifts slightly on font swap (0.0005, harmless). | Convert Karantina to WOFF2 (expect ~40% smaller). Set `preload: false` on JetBrains Mono and on whichever Heebo subset isn't above the fold. Consider a system mono for `.tag`. |
| R10 | **ScrollFilm loads all chapter plates at t=0.** `trophy-celebration` (211 KB, chapter 3), `match-night-away` (78 KB, chapter 2) and the 115 KB crest sit in the sticky stage, so they count as in-viewport and load eagerly next to the LCP plate, even on phones. | `components/home/ScrollFilm.tsx:251,291,330` | ~400 KB contending with the LCP image (`match-home-2`) on first load. | Give non-first plates `fetchPriority="low"`, or set their `src` after the intro completes / on first scroll. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | `RevealObserver`: scan only `addedNodes` in the MutationObserver callback instead of `document.querySelectorAll("[data-reveal]:not(.in)")` on every mutation batch (`components/shell/RevealObserver.tsx:29-33`). | Every search keystroke, filter change and film chapter `textContent` swap triggers a full-document query. Cheap today (~3k nodes), but it scales with DOM size. |
| N2 | Pass a slim card shape to `Rail` (id/handle/title/price/compareAt/available/kit, 2 image srcs, variants `{id,size,price,available}`), not full `Product`. The old `toCard()` couldn't be used because it dropped the variants that `QuickAdd` needs; it was deleted at HEAD. | Home RSC carries ~35 KB uncompressed of unused fields: variants 20.8 KB (full objects), descriptions 5 KB, extra images. |
| N3 | rAF-throttle the gallery zoom `pointermove` (`components/product/Gallery.tsx:22-28`). It writes two custom properties and then reads `getBoundingClientRect` on every move. | Forces a style flush per mouse event on large images. |
| N4 | Cache headers for `/media/*` and `/kits/*` (`next.config.ts:31-35` at HEAD only covers `crest.png` and `icons/`). | Live: `public, max-age=0, must-revalidate`, a 304 round trip per image on every visit. Also fingerprint the filenames or use `stale-while-revalidate`. |
| N5 | `ScrollFilm`: gate the window `scroll` listener with an IntersectionObserver on the section, and skip `render()` when `p` and `intro` are unchanged (`ScrollFilm.tsx:172-200`). | Below the film each scroll event still runs `getBoundingClientRect` plus one rAF that writes ~40 identical values. Measured as 0 mutations, so it's cheap, but it isn't free. |
| N6 | `CartProvider` context value changes on `open`/`toast`/`lastAdded`, re-rendering every `QuickAdd` (28 on home). Split the actions (`add`, stable) from state. | Minor INP win when opening the drawer. |
| N7 | `next/image` default `deviceSizes` run up to 3840, producing ~105 KB of `srcset` text in the home HTML (104 `<img>`). Trim `deviceSizes` in `next.config.ts`. | Home HTML is 340 KB raw / 37 KB br. Mostly harmless after compression. |

#### Resource Budget
| Resource | Current (measured) | After fixes (expected) | Concern? |
|----------|--------------------|------------------------|----------|
| Navigation latency (link click → visible new page) | **~4 000 ms** (VT abort timeout), every click | ~route latency (45–400 ms on fast net) | **Yes, C1** |
| PDP server cost | Dynamic SSR every view, TTFB 230–450 ms warm, `private, no-store` | Edge-cached ISR (`HIT`) | **Yes, C3** |
| CLS (kit PDP) | **0.868** at 1440 and 390 (fast net) | ~0 | **Yes, C2** |
| Images on first load, before scroll (home) | 16 req / 1 682 KB desktop and 390 | ~600–700 KB (resize local + no hidden thumbs) | Yes, R1 |
| Total transfer, first load | home 2.0–2.1 MB; dept 1.6–1.9 MB; PDP 1.4–1.7 MB | ~1 MB | Yes |
| LCP (Slow 4G, 4x CPU, 390x844) | home 3.48 s, dept 4.35 s, kit PDP 2.56 s, search 2.71 s | <2.5 s | Yes |
| LCP (unthrottled, 1440) | 0.67–0.92 s | n/a | No |
| TBT proxy (sum of longtask >50 ms, 4x CPU) | 450–590 ms | n/a | Moderate |
| Idle main-thread work | 60 style recalcs/s on every page (~40 ms/s task time on PDP/dept; home ~85 ms/s with grain + marquee) | ~0 off the home film | Yes, R2 |
| Event listeners / DOM | home 3 263 nodes / 989 listeners; PDP 2 281 / 703; dept 2 207 / 750 | n/a | No |
| Memory growth over a long session | 6 rounds of (dept → product → search → cart → home) via client nav: heap after GC 6.45 → 7.57 MB (~0.2 MB/round), listeners 1071 → 1109, nodes 3365 → 3389. Bounded growth, consistent with the Next router cache; no detached-tree leak observed. | same | No (minor) |
| JS (all routes) | 10 scripts, 155 KB transferred / ~460 KB parsed; 45–61% executed on load; no third-party libs | same | No |
| Client data payload | home RSC 89 KB raw (35 KB unused fields); dept RSC 51–139 KB raw, 25–36 KB gz total HTML | home −35 KB raw | Minor |
| Fonts | 8 files / 156 KB, 5 preloads (1 TTF) | ~130 KB, 3 preloads | Minor |
| Server per dynamic render | catalog JSON.parse ~4 ms + Header menu ~18 ms + search index ~3.6 ms (local bench) | ~0 with memoised derivations | Moderate |

#### Hot Path Analysis
- **Link click (every navigation)**: `TransitionRouter` capture-phase handler → `startViewTransition` → `router.push` → pathname effect → `settle` → rAF that never fires (rendering suppressed) → 4 s browser timeout. This is the hottest user path in the app and is currently its slowest (C1).
- **Scroll on home (film zone, 420vh)**: `wake()` on each scroll event (one `getBoundingClientRect`) → a single rAF loop with eased inertia → `render()` writes ~35 `--vars` + 4 shirt transforms. JS per frame is small (script 51 ms over 105 frames at 1x). Style recalc dominates (2 ms/frame at 1x, 6.5 ms/frame at 4x CPU) because the vars sit on the stage root. Raster/composite of filtered/blended full-viewport layers is the likely remaining frame cost (headless measurement pessimistic). The loop correctly goes idle (p === target, intro done) and is torn down on unmount.
- **Scroll elsewhere**: `HeaderBar` scroll → `setScrolled(bool)` (bails out when unchanged); `Rail` scroll → two `setProperty` calls + bail-out `setEdge`; `RevealObserver` IO. All passive, all cleaned up.
- **Typing in search**: 140 ms debounce + `AbortController` (good) → `/api/search` (CDN-cached for 60 s per query: second hit 130 ms; cold MISS 1.42 s) → re-render 8 results → `RevealObserver` MO full-document scan (N1).
- **Idle**: should be zero but is not: 8 hidden shimmer animations on every page (R2), plus on home the `grain` (steps, 0.5 s) and `Marquee` (46 s linear) loops continue while off-screen.
- **Server (dynamic routes)**: `getCatalog()` → `unstable_cache` read + parse of ~0.55 MB → `Header` menu derivation (~18 ms) → page work (`toItem` over department, `related()` O(n·tags)). Repeated per request because PDPs aren't ISR (C3).

#### Verdict Details
- Memory Management: **PASS**. Every `addEventListener` has a matching removal (ScrollFilm, HeaderBar, Rail, CartProvider, CartDrawer, Browser, TransitionRouter). Observers disconnect on pathname change/unmount. Timers are cleared. `flyToCart` removes its node on finish/cancel. Measured long-session growth is ~0.2 MB/round and bounded.
- IPC Efficiency (network/data round trips): **CONCERNS**. Duplicate downloads of the same local file under different `?w=` URLs (R1). Hover-alt images on touch (R4). PDP never edge-cached (C3). Search API caching and abort/debounce are good.
- I/O Patterns (server fetch/cache): **CONCERNS**. Paired parallel page fetch, tags and the `cache()` + `unstable_cache` layering are well designed. But the derived data is re-computed per request, the snapshot fallback is cached silently, and there is no 429 handling (R5, R6).
- Startup Impact (LCP/CLS/TTFB): **CONCERNS**. CLS 0.87 on kit PDPs (C2). Mobile Slow-4G LCP 3.5–4.4 s from image contention (R1, R10). Five font preloads (R9).
- Long-Session Stability: **CONCERNS**. No leaks, but there is perpetual idle work: hidden infinite animation on every page (R2), and the 4 s freeze compounds with every navigation in a long browse (C1).

---

## 10. Accessibility Engineer

### Accessibility Audit: Maccabi Tel Aviv concept storefront (repo health, `wip/shop-v1`)

**Perspective**: Accessibility Engineer (keyboard-only and screen-reader walkthrough, WCAG 2.2 AA, plus IS 5568, which the site's own statement cites)
**Date**: 2026-10-30
**Plan**: repo-health audit of `/home/user/maccabi-`. Runtime evidence from https://1maccabi.vercel.app via Playwright/Chromium at 1440x900 and 390x844, axe-core 4.10.2 (wcag2a/aa, 21a/aa, 22aa, best-practice), my own contrast/opacity-chain scanner, the Chrome AX tree via CDP, scripted Tab/Shift+Tab/Enter/Escape/Arrow walkthroughs, and `reducedMotion: 'reduce'` runs. Scripts: `/tmp/claude-0/-home-user/d6b30529-0315-5705-a1f6-419bbae3a32d/scratchpad/audit/work/` (`kb-*.js`, `axe.js`, `myContrast.js`, `structure.js`, `flash.js`, `ax*.js`).
**Exclusion honoured**: the mobile menu in `components/shell/HeaderBar.tsx` / `Header.module.css` (being redesigned) is not reviewed.

> **Code drift.** The live deploy matches commit `1ae6789`, where the audit started. During the audit the branch moved to `0b34ea4`. Every finding below was re-checked against `0b34ea4` source, and line numbers are HEAD's. Items found only in new, undeployed code are marked *code-only*. HEAD already fixes one thing: `scroll-padding-top: calc(var(--header-h) + 16px)` in `app/globals.css` keeps keyboard-focused targets from scrolling under the sticky header (2.4.11). HEAD also makes the film skip link visible on the first screen.

#### Plan Summary
A Hebrew-first RTL storefront with a solid accessibility foundation:
- `lang="he" dir="rtl"`, skip link, labelled landmarks, one h1 per page.
- Native radios for sizes, live regions for cart and size messages.
- Properly trapped cart drawer, lightbox and size guide; a disclosure-pattern mega menu.
- A route announcer after client navigation.
- Reduced motion honoured by the film, view transitions and reveals.

The failures sit in four places: the search overlay (no containment, Escape only works from the input, mouse-only chips), the mobile filter sheet (no containment, unnamed sort select), focus rings on light surfaces (yellow on paper, 1.27:1, and clipped on product-card titles), and the view-transition freeze that leaves focus on invisible content for ~4 s after every link. The site publishes a statement claiming WCAG 2.1 AA, visible focus everywhere and full keyboard support. Those claims are not true yet.

#### Files Reviewed
| File | A11y Role | Risk |
|------|----------|------|
| `app/layout.tsx` | `lang="he" dir="rtl"`, skip link → `#main`, landmark shell | Low (good) |
| `components/shell/HeaderBar.tsx` (desktop parts only) | Mega menu: link + disclosure button (`aria-expanded`/`aria-controls`), Esc, ArrowDown, blur-close; search and cart triggers | Low (good) |
| `components/shell/SearchOverlay.tsx` + `.module.css` | Modal dialog + ARIA combobox/listbox with `aria-activedescendant` | **High** |
| `components/shell/TransitionRouter.tsx` | View transition on every link | **High** (4 s frozen frame; focus on invisible content) |
| `components/cart/CartDrawer.tsx`, `CartToast.tsx`, `CartProvider.tsx` | Modal drawer with focus trap/return, live region, undo, toast; HEAD adds a print-confirm `alertdialog` | Medium |
| `components/shop/Browser.tsx` + `.module.css` | Filters (`aria-pressed` toggles), sort `<select>`, active chips, mobile sheet dialog, live count | **High** (mobile) |
| `components/product/ProductView.tsx` + `.module.css` | Size radiogroup, qty, add to cart, print studio, live messages | Medium (focus-ring contrast) |
| `components/product/Gallery.tsx`, `Lightbox.tsx`, `SizeGuide.tsx`, `PrintStudio.tsx`, `Bundle.tsx`, `Jersey.tsx` | Zoom buttons, front/back toggle, dialogs, form errors | Medium |
| `components/product/ProductCard.tsx` + `.module.css`, `QuickAdd.tsx`, `components/shop/ShopCard.tsx` | Card links, hover quick-add size buttons | Medium |
| `components/home/ScrollFilm.tsx` + `.module.css` | sr-only h1 + description, skip link, CTAs that jump to the end frame on focus, lamp-strike flicker | Medium (flash risk) |
| `components/home/PrintTeaser.tsx` | Custom `role="radio"` buttons, live jersey preview | Low/Medium |
| `components/shell/Footer.tsx`, `Newsletter.tsx` | Labelled navs, email field with `role="alert"` error | Low (good) |
| `app/globals.css` | Focus tokens, `.sr-only`, reduced-motion block | Medium |
| `app/accessibility/page.tsx` | Published accessibility statement | Medium (claims exceed reality) |

#### Verdict: APPROVE WITH CHANGES

The structure and most widget patterns are right, and each critical item is a small, local fix. The four critical items below are Level A/AA failures on the core shopping paths (find → filter → product → cart). They must be fixed before the pitch, or the published "WCAG 2.1 AA" statement must be softened.

#### Critical Issues (Must Fix)
| # | Issue | WCAG Criterion | File(s) | Impact | Fix |
|---|-------|---------------|---------|--------|-----|
| A1 | **Search overlay is not contained, Escape only works from the input, and the no-results suggestions are mouse-only.** The panel is `role="dialog" aria-modal="true"`, but nothing traps Tab and the page behind is not `inert`. The Escape handler lives only in the input's `onKeyDown`. The "try one of these" chips are bare `<li onClick>` with no role, tabindex or key handler. | 2.1.1 Keyboard (A), 2.4.3 Focus Order (A), 2.4.11 Focus Not Obscured (AA) | `components/shell/SearchOverlay.tsx:109-111` (dialog, no trap), `:93-97` (Esc only in input), `:196` (chips) | **Measured live, 1440:** from the input, Tab goes to "ביטול", then 10+ links of the page *under* the scrim (dept hero strip, department nav), all `elementFromPoint`-covered. Pressing Escape there leaves the overlay open with focus behind it. Chips report `tabindex=null role=null`. | Trap Tab inside the panel (reuse CartDrawer's handler), or set `inert` on `header`/`main`/`footer` while open. Move Escape to the panel's `onKeyDown`. Render chips as `<button type="button">`. |
| A2 | **Mobile filter sheet is a modal without containment, and the sort `<select>` has no accessible name on phones.** The sheet sets `role="dialog" aria-modal` and moves focus in, but nothing keeps focus there. The select's only label text (`.sortLabel`) is `display:none` under 900px. | 2.4.3 (A), 2.4.11 (AA); 4.1.2 Name, Role, Value (A) | `components/shop/Browser.tsx:67-82,248-257` (sheet), `:234-236` + `Browser.module.css:441-442` (label hidden) | **Measured live, 390:** after 34 Tabs focus leaves the sheet into product cards covered by it. axe: `select-name` (critical) on `/shop/kits` and `/search` at 390. | Trap Tab in the sheet and make the rest of the page `inert` while open. Add `aria-label="מיון"` to the select, or hide the span with `.sr-only` instead of `display:none`. |
| A3 | **Focus rings on light surfaces fail contrast, and product-card title rings are clipped.** Several components override the global sky ring with `outline: 3px solid var(--yellow)` and a positive offset on paper/white: yellow on paper is **1.27:1**, on white 1.42:1 (3:1 needed). On product cards the ring sits on `.title a` inside `.title { overflow:hidden; -webkit-line-clamp:2 }`, so only a sliver shows. | 1.4.11 Non-text Contrast (AA, which covers focus indicators), 2.4.7 Focus Visible (AA) | `components/product/ProductView.module.css:100-102,143-145,200-202,240-242,337-339`; `components/product/Gallery.module.css:35-37,132-134`; `components/product/ProductCard.module.css:87-95,101-103,182-185`; `components/product/Bundle.module.css:116-118,150-152,204-206`; `components/product/RecentlyViewed.module.css:41-43` | Covers the whole PDP buy path: size guide, size radios, qty, **add to cart**, details, front/back toggle, gallery zoom. It also covers every Rail product title and quick-add size. Screenshots (`focus-all.png`) show a pale yellow hairline on paper, and a clipped bar on card titles. The global comment says yellow is for dark surfaces only (`app/globals.css`, `.on-dark`). | Delete these overrides so `:focus-visible` uses `--focus` (sky, 4.19:1 on paper), or use navy on light surfaces. For card titles, put the ring on the card (`.card:has(.title a:focus-visible)`) or use `outline-offset:-3px` / `box-shadow: inset`. |
| A4 | **Every link activation leaves focus on content that isn't painted for ~4 s.** The view-transition update callback resolves via `requestAnimationFrame`, which does not run while rendering is suppressed, so Chrome aborts the transition after its 4 s timeout. The DOM and focus switch to the new page immediately, but the screen keeps showing the old page. | 2.4.7 Focus Visible (AA) (focus moves to elements that are not drawn), 3.2.2 On Input (A) (unexpected frozen context); also a usability blocker for magnifier and cognitive-disability users | `components/shell/TransitionRouter.tsx:36-47` (rAF at :43) | **Measured live:** pathname changes at 45–395 ms, `vt.ready` rejects with `TimeoutError` at ~4 020 ms, and screenshots can't capture a frame for ~4 s. The route announcer reads the *new* title while the *old* page is on screen. Reduced-motion users are spared (handler bails). Same root cause as perf C1. | Resolve the update callback directly or via `setTimeout(resolve, 0)`, never rAF. See the perf report, C1. |

#### Recommendations
| # | Issue | WCAG Criterion | Fix |
|---|-------|---------------|-----|
| R1 | **Removing the last active filter chip drops focus to `<body>`.** The chip list unmounts (`Browser.tsx:295-312`). Measured live: focus goes to BODY, and the next Tab restarts from the top. | 2.4.3 (A) | When a chip is removed, focus the next chip, or "ניקוי הכל", or the filter toggle/results count if none remain. |
| R2 | **Lightbox never tells a screen reader which image is shown.** The frame button's `aria-label` is just "הגדלה"/"הקטנה", which overrides the image's alt (`Lightbox.tsx:94`). Arrow keys change the image with no live region (`:77` counter is visual only). Measured: name "הגדלה"; `[aria-live]` absent. | 1.1.1 (A), 4.1.3 Status Messages (AA) | `aria-label={`${title} – תמונה ${i+1} מתוך ${n}, ${zoomed ? "הקטנה" : "הגדלה"}`}` plus a polite live region announcing "תמונה 2 מתוך 3". |
| R3 | **Reduced motion is not fully honoured.** `.skel` uses `animation: shimmer … infinite !important`, which beats the global reduced-motion `*` rule. Measured with `reducedMotion: 'reduce'` and a slow API: shimmer `running iter=Infinity`. JS smooth scrolls ignore the preference: `Gallery.tsx:53`, `Rail.tsx:15`, `Browser.tsx:102`, `ProductView.tsx:79`. | 2.3.3 Animation from Interactions (AAA, which the club statement implies); best practice | Drop the `!important` (`SearchOverlay.module.css:259`). Pick `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`. |
| R4 | **Film lamp-strike flicker needs a flash check.** `strike()` (`ScrollFilm.tsx:27`) does 0.85→0.08→1→0.3 within ~0.55 s. The intro gives 2 flashes (within the 3/s limit). Banks L1–L3 are scroll-linked (`LAMP_AT`, `:30`), so one fast flick through p 0.135–0.255 (~350 px at 1440x900) can chain 3 strikes (up to 6 transitions) inside a second. Measured luminance swing per strike: ≥0.10 relative-luminance change on 30.5% (L0) and 48.8% (L1) of the worst 10° window (threshold 25%). Mean scene luminance stays low (0.11–0.25). Flash count is the open question. | 2.3.1 Three Flashes or Below Threshold (A): **risk, unverified** | Run a PEAT/Harding-style analysis on a screen recording of a fast scroll. Mitigate: one flicker per bank on scroll (keep the double spark only for the time-based intro), or clamp the strike rate in time rather than in scroll progress. |
| R5 | **English strings are exposed to a Hebrew voice.** Latin labels exposed to AT with no `lang`: nav "SALE", "PRINT STUDIO · 26/27 · HOME", "LIVE PREVIEW", "INDEX · 06 DEPARTMENTS", "MATCH KITS/TRAINING/LIFESTYLE…", "N°01 · ON THE PITCH", "DETAILS", tech labels "26/27 · HOME · PUMA", "EST.", "TEL AVIV · ISRAEL", "FAN CLUB · SINCE 1906" (scan in `structure.js`). Hebrew TTS mispronounces or spells them out. | 3.1.2 Language of Parts (AA) | Add `lang="en"` to exposed `.latin`/`.tag` spans (e.g. bake it into a `<Latin>` helper), and `aria-hidden` the purely decorative ones, as is already done for "FOREVER" with its Hebrew sr-only twin. |
| R6 | **Print-confirm `alertdialog` at checkout (HEAD, *code-only*).** Clicking "לקופה" swaps the focused button for a `role="alertdialog"` block that never receives focus, so focus falls to `<body>` inside the modal and the alert isn't announced. "חזרה לסל" unmounts it again, with the same focus loss. | 2.4.3 (A), 4.1.3 (AA) | On open, focus the "להמשיך בלי הדפסה" link (or the alert text with `tabIndex=-1`). On "חזרה לסל", return focus to the "לקופה" button. Consider plain `role="group"` plus focus instead of a nested alertdialog. (`CartDrawer.tsx:281-293`) |
| R7 | **Timed UI with actions.** The undo bar disappears after 6 s (`CartDrawer.tsx:79`; measured: gone at 6.5 s). The add-to-cart toast with its "לסל" button disappears after 4.5 s (`CartToast.tsx:15`), and HEAD routes every quick add through the toast. | 2.2.1 Timing Adjustable (A) | Keep undo until the drawer closes or the next cart action. Pause both timers on hover or focus-within. |
| R8 | **Quick-add comes before the product name in Tab order and costs up to 8 stops per card.** In the DOM, `QuickAdd` precedes the title link (`ProductCard.tsx:34` vs `:37`). Measured on home: Tab hits "הוספה לסל במידה XS…XXL" (six buttons) before each card's name, so a 14-card rail costs ~100 stops. The group label "הוספה מהירה: …" helps screen readers but not sighted keyboard users. | 1.3.2 Meaningful Sequence (A), 2.4.3 (A) | Put the title link first in the DOM (position visually with CSS). Expose sizes behind one "הוספה מהירה" button, or use a roving tabindex. |
| R9 | **PrintTeaser's custom radiogroup has no arrow keys or roving tabindex** (`PrintTeaser.tsx:63-65`): each `role="radio"` button is its own Tab stop. Its index numbers measure **3.97:1** at 11px (axe `color-contrast`, serious). | 4.1.2 / ARIA radio pattern; 1.4.3 Contrast (AA) | Use native radios (as the PDP does), or add Arrow/Home/End handling with `tabIndex` on the checked radio only. Darken the idx to `--muted` (5.22:1). |
| R10 | **Live-region pile-up on add to cart.** One add triggers ProductView's sr-only "X נוסף לסל" (`ProductView.tsx:223`), CartDrawer's status "נוסף לסל: X, מידה XS" (`CartDrawer.tsx:310`) and the dialog-focus announcement. Measured: both strings present at once. | 4.1.3 (AA): noise rather than failure | Keep one: the drawer's own status, or the toast when the drawer doesn't open. |
| R11 | **Heading order on department and search pages:** h1 → h3 card titles with no h2 (axe `heading-order`). | 1.3.1 (A), best practice | Add an sr-only `<h2>מוצרים</h2>` above the grid, or make card titles `h2`. |
| R12 | **The search listbox holds non-option content:** two `<p>` labels and the "לכל N התוצאות" link (`SearchOverlay.tsx:152,181`). Measured children: `P:2, LI[option]:7, A:1`. | 4.1.2 (A) | Keep only `role="group"` + `role="option"` inside the listbox. Move labels into `aria-label`s on the groups, and move the link outside the listbox. |
| R13 | **The published statement asserts compliance that isn't met yet**: "ניגודיות צבעים ברמת AA", "טבעת מיקוד גלויה בכל רכיב אינטראקטיבי", "ניווט מלא במקלדת" (`app/accessibility/page.tsx:7-10,20,26`). This conflicts with the project's honesty rules (CLAUDE.md). | IS 5568 statement accuracy | Fix A1–A4 first, or phrase the statement as a target ("נבנה בכוונה לעמוד ב…") until an audit date is filled in. The draft note already says the coordinator and date are missing. |

#### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| N1 | `aria-invalid` on Bundle size selects has no `aria-describedby` pointing to the "חסרה מידה" message (`Bundle.tsx:104`). | The error is announced once by the live region but isn't tied to the field. |
| N2 | The cart drawer's `<header>` becomes a second **banner** landmark while open (measured in the AX tree: two `banner()`). Use `<div>` inside dialogs, and the same in SizeGuide. | Landmark noise in the rotor. |
| N3 | Index numbers inside headings are read aloud: "הקולקציה של 26/27 14", "01 קניות" (AX tree). Wrap the `idx`/`sup` in `aria-hidden`. | Cleaner heading list. |
| N4 | Breadcrumb "בית" is 17x19 px (`app/product/[handle]/page.tsx` crumbs). Pad it to 24 px. | 2.5.8 Target Size (AA); the inline-text exception arguably applies, so this is minor. |
| N5 | `aria-current={slide === i}` on gallery dots outputs `aria-current="false"` on the inactive ones. Prefer `aria-current={slide === i ? "true" : undefined}`. | Some SRs announce "current false". |
| N6 | The "MACCABI TEL AVIV FC" photo credit in Story120 is small white text over a bright crowd. Add a scrim or move it onto navy. | 1.4.3 on photographic backgrounds (not machine-verifiable; 54 such nodes on home flagged for manual review, the rest looked fine in screenshots). |

#### Keyboard Navigation Walkthrough
(Live site; Chromium; Tab/Shift+Tab/Enter/Space/Escape/Arrow, scripted. Region and ring captured at each step.)

| Step | Action | Expected Focus | Expected Announcement | Plan Handles? |
|------|--------|---------------|----------------------|---------------|
| 1 | Load `/`, Tab | Skip link "דלג לתוכן" appears (sky ring) | "דלג לתוכן, קישור" | Yes |
| 2 | Tab ×2–18 | Logo ("…לדף הבית"), then per dept a link + a "תפריט {dept}" disclosure button (0-width until focused, then 22x28), then "חיפוש", then "הסל שלי, 0 פריטים" | Names as listed; disclosure "collapsed" | Yes, order is RTL-correct |
| 3 | Enter on "תפריט תלבושות משחק" | `aria-expanded=true`; panel no longer `inert`; Tab → "לכל 26 הפריטים", "ערכת בית 7"… | "expanded" | Yes |
| 4 | Escape inside panel | Focus back to the disclosure button, collapsed | "collapsed" | Yes |
| 5 | ArrowDown on a dept link | Panel opens, focus on its first link; tabbing past the panel closes it (blur) | – | Yes |
| 6 | Tab to film | "דלג על הסרט" → "לקנייה ‏269 ‏₪" / "עצב עם שם ומספר": focus jumps the scroll to the end frame so CTAs are visible (navy 3px ring on yellow) | Link names | Yes |
| 7 | Tab into "חדש בחנות" rail | Per card: up to 6 quick-add size buttons, **then** the product name link | "הוספה מהירה: {title}, group" (SR); sighted users see sizes before name | Partly (R8); title ring clipped (A3) |
| 8 | Click/Enter any internal link | New page painted | Route announcer reads the new `<title>` | **No**: old page frozen ~4 s (A4); after paint, Tab resumes in `main` (good) |
| 9 | Activate "חיפוש" | Focus in combobox input (60 ms delay) | "חיפוש מוצרים, combo box" | Yes |
| 10 | ArrowDown in input | `aria-activedescendant` → first suggestion, `aria-selected=true` | "חולצת בית" | Yes |
| 11 | Type "צעיף" | `aria-expanded=true`; results label live "מוצרים · 6" | "מוצרים · 6" | Yes |
| 12 | Tab from input | "ביטול", **then the page behind the scrim** | – | **No** (A1) |
| 13 | Escape with focus on "ביטול"/behind | Overlay should close, focus to "חיפוש" | – | **No**: only works from the input (A1) |
| 14 | Type nonsense, reach "try one of these" chips | Chips focusable | Chip text | **No**: `<li onClick>` (A1) |
| 15 | Enter on cart button | Focus on dialog panel | "הסל 0 פריטים, dialog" | Yes |
| 16 | Tab/Shift+Tab ×7 | Cycles "סגירת הסל" → start links → back to "סגירת הסל" | – | Yes (trap works) |
| 17 | Escape | Focus back to "הסל שלי, N פריטים" | – | Yes |
| 18 | PDP: Tab order | Crumbs → zoom 1 → "חזית"/"הגב שלך" (`aria-pressed`) → zoom 2/3 → "מדריך מידות" → size radio → print checkbox → qty + → add → details | Radios "XS"; sold-out "M, אזל"; group "מידה" | Yes; rings fail contrast (A3) |
| 19 | Arrow keys in sizes | Moves and checks next enabled size; label updates "מידה · S" | "S, radio, checked" | Yes |
| 20 | Add without a size | Focus to first enabled size; live "בחר מידה כדי להמשיך" | Message announced | Yes |
| 21 | Enter on zoom image | Lightbox, focus "סגירת הגלריה"; Tab cycles 7 buttons; ArrowLeft = next (RTL) | Dialog "{title} – גלריה"; image change **not announced**; frame named only "הגדלה" | Partly (R2) |
| 22 | Escape | Focus back to the zoom button | – | Yes |
| 23 | "מדריך מידות" | Dialog, focus on close; table with `th[scope]`; Escape returns focus | "מדריך מידות, dialog" | Yes |
| 24 | Print checkbox + type "Cohen1" | Error text, `aria-invalid=true`, `aria-describedby`, polite | "אותיות בעברית או באנגלית בלבד" | Yes |
| 25 | Add to cart | Drawer opens, focus on dialog; Tab: close → item link → + → remove-one → "הסרה" → "לקופה" → "להמשיך לקנות" | "הסל 1 פריטים"; plus two overlapping live messages (R10) | Yes |
| 26 | "הוספת יחידה" | Status "כמות …: 2"; focus stays | Announced | Yes |
| 27 | "הסרה" | Focus moves to the panel; status "הוסר מהסל: …"; undo bar shows | Announced | Yes; undo vanishes after 6 s (R7) |
| 28 | `/shop/kits` desktop: Enter on a facet | `aria-pressed=true`, focus stays, live count "7 מוצרים" | Announced | Yes |
| 29 | Enter on the last active chip | Focus should go somewhere meaningful | – | **No**: focus to BODY (R1) |
| 30 | 390: "סינון" | Sheet dialog, focus on "סגירה"; Tab should stay inside | – | **No**: escapes after 34 stops (A2); Escape returns focus to "סינון" (yes) |
| 31 | 390: sort select | Named "מיון" | "מיון, מומלץ, combo box" | **No**: unnamed (A2) |
| 32 | Reduced motion, `/` | Film collapses to the static final frame (100svh, CTAs visible); no VT, no fly-to-cart, reveals static | – | Yes, except skeleton shimmer and JS smooth scrolls (R3) |

#### ARIA Checklist
| Element | Role | Label | States | Keyboard | Notes |
|---------|------|-------|--------|----------|-------|
| Root | `html lang="he" dir="rtl"` | – | – | – | PASS. Latin parts lack `lang="en"` (R5) |
| Skip links | link | "דלג לתוכן" → `#main`; film "דלג על הסרט" → `#drop` (`tabIndex=-1`) | – | Tab | PASS (HEAD makes the film one visible) |
| Mega disclosure | button | "תפריט {dept}" | `aria-expanded`, `aria-controls="mega-*"`; closed panels `inert` | Enter/Space, Esc → trigger, ArrowDown from link, blur closes | PASS |
| Search trigger | button | "חיפוש" (matches visible hint) | `aria-haspopup="dialog"`, `aria-expanded` | Enter | PASS |
| Search panel | dialog, `aria-modal` | "חיפוש מוצרים" | – | Esc from input only | **FAIL**: no containment, no Esc outside input (A1) |
| Search input | combobox | `<label>` sr-only "חיפוש מוצרים" | `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant` | Up/Down/Enter/Esc | PASS |
| Search results | listbox → group → option | "תוצאות חיפוש" | `aria-selected` | via activedescendant | Contains `<p>` and `<a>` (R12); no-result chips not focusable (A1) |
| Results count | `p[aria-live=polite]` | – | – | – | PASS |
| Cart trigger | button | "הסל שלי, N פריטים" | – | Enter | PASS |
| Cart drawer | dialog, `aria-modal`, `tabIndex=-1` | `aria-labelledby` → "הסל N פריטים" | – | Trap, Esc, focus return | PASS. Inner `<header>` adds a banner landmark (N2) |
| Cart status | `div.sr-only[role=status][aria-live=polite]` | – | – | – | PASS; overlaps with ProductView live text (R10) |
| Qty (cart) | group "כמות עבור {title}" + buttons "הוספת יחידה"/"הסרה מהסל"/"הפחתת יחידה" | yes | `disabled` at max | Enter | PASS |
| Print confirm (HEAD) | alertdialog | `aria-labelledby="print-confirm"` | – | Not focused | *code-only* FAIL (R6) |
| Toast | `role=status aria-live=polite` | – | – | "לסל", close "סגירת ההודעה" | 4.5 s auto-dismiss (R7) |
| Size picker | radiogroup (native radios) | `aria-labelledby="size-label"`, `aria-describedby="size-msg"` | `checked`, `disabled` (sold out, label "M, אזל") | Arrows, Space | PASS |
| Front/back toggle | group "תצוגת המוצר" + buttons | "חזית"/"הגב שלך" | `aria-pressed`; hidden face `inert`/`aria-hidden` | Enter | PASS |
| Jersey preview | `svg role="img"` | "תצוגת גב החולצה: {name}, מספר {n}" | – | – | PASS |
| Zoom tiles | button | "הגדלת תמונה i מתוך n" | – | Enter opens lightbox | PASS |
| Lightbox | dialog, `aria-modal` | "{title} – גלריה" | – | Trap, Esc, ←/→ (RTL), focus return | Frame name "הגדלה" hides alt; no live image change (R2) |
| Size guide | dialog, `aria-modal` | `aria-labelledby="sg-title"` | – | Trap, Esc, focus return | PASS; table `th[scope]` |
| Print fields | `input` + `<label for>` | "שם", "מספר" | `aria-invalid`, `aria-describedby` → polite msg | – | PASS |
| Newsletter | `input[type=email]` + label | "אימייל" | `aria-invalid`, describedby hint/error; error `role=alert` | – | PASS |
| Filter options | button | visible label + count | `aria-pressed` | Enter/Space | PASS |
| Filter sheet (≤900px) | dialog, `aria-modal` | "סינון מוצרים" | `inert` when closed | Esc → toggle; **no trap** | FAIL (A2) |
| Sort | select | **none on mobile** | – | native | FAIL (A2); OK at 1440 |
| Active filter chips | list "סינונים פעילים" + buttons | "הסרת סינון: {x}" | – | Enter | Focus lost on last removal (R1) |
| PrintTeaser kits | radiogroup + `button[role=radio]` | "בחירת חולצה" / kit name | `aria-checked` | Tab only, no arrows | R9 |
| Quick add | group "הוספה מהירה: {title}" + buttons | "הוספה לסל במידה S" / "מידה M אזלה" | `disabled` | Tab | Before product name in order (R8); yellow ring on white 1.42:1 (A3) |
| Film CTAs | link | "לקנייה ‏269 ‏₪", "עצב עם שם ומספר" | – | Focus scrolls to the visible end frame | PASS |
| Decorative Latin / slates / giant type | `aria-hidden` | – | – | – | PASS; "FOREVER" has a Hebrew sr-only twin (nice) |

#### Contrast notes (measured)
- Text tokens pass: navy/paper 15.1, muted/paper 5.22 (muted/paper-2 4.77), blue sale/paper 7.51, white/navy 16.95, yellow/navy 11.9, `--muted-dark`/navy 7.24, ok/paper 4.84.
- Failing text: PrintTeaser idx 3.97 at 11px (axe).
- Sold-out size labels (2.24) and disabled qty "−" (1.75) are inactive components, which are exempt.
- Non-text: the sky ring on paper is 4.19 (pass), the yellow ring on paper/white is 1.27/1.42 (**fail**, A3), and the sky ring on yellow buttons is 3.30 (pass).
- `--line-strong` on paper is 1.96. It currently only draws decorative rules, so no 1.4.11 issue was found; don't use it as the sole boundary of an input.
- Over-image text: axe marked 154 nodes on home as "incomplete". Manual screenshots of the film (reduced motion), PrintTeaser and Story120 show navy on yellow and white on navy/dark scrims. Readable, except N6.

#### Verdict Details
- Screen Reader Compatibility: **CONCERNS**. Strong base: names on every icon button, live regions, sr-only film summary, route announcer. Gaps: the lightbox image is never announced (R2), the listbox structure (R12), English parts read with a Hebrew voice (R5), and duplicate announcements (R10).
- Keyboard Navigation: **CONCERNS**. The mega menu, cart, PDP, lightbox and size guide all work. The search overlay (A1) and mobile filter sheet (A2) leak focus. Quick-add order and stop count (R8). PrintTeaser radios (R9).
- Focus Management: **CONCERNS**. Focus return is correct for the cart, lightbox, size guide, search and mega menu. Focus is lost after removing a filter chip (R1) and around the new print confirm (R6, code-only). The ~4 s VT freeze leaves focus on unpainted content (A4).
- Color Contrast: **CONCERNS**. Text palette passes AA. Focus rings on light surfaces fail 1.4.11 (A3). One small idx fails 1.4.3 (R9).
- Motion Sensitivity: **CONCERNS**. Reduced motion is respected by the film (static end frame), view transitions, fly-to-cart, reveals and the marquee. Skeleton `!important` and JS smooth scrolls ignore it (R3). The lamp-strike flicker needs a flash-threshold check on fast scroll (R4).
