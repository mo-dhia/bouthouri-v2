# Architecture audit

2026-10-28. Audited the HOME implementation against the scroll library README,
`animations.md`, local assistant styling/splitting guides, load architecture,
SSR/CSR and Storio contracts. The initial cleanup below preserved the existing
fluid geometry. A subsequent user-confirmed migration now fixes the three
[reference canvases](viewport-design.md) and scales design geometry by width.
The initial validation numbers below are historical baseline evidence; current
viewport validation is recorded separately in the fixed-viewport review reports.

## Results

| Area | Result |
| --- | --- |
| Server content | Locale routes remain statically prerendered. Landing, Hero, Journey, Header, Footer and structured data now have explicit `server-only` guards. Dictionaries and journey content stay in server markup. |
| Code boundaries | Null gate views delegate effects/imports/cleanup to colocated `.logic.ts` hooks. Controllers stay behind dynamic imports; type-only scene interfaces do not load Three. |
| Scroll engine | Native scroll only. Removed the unused Lenis package, CSS, initializer and compatibility hooks. Hero raw input now registers once through `scrollManager` with `useRAF: false`, without a duplicate native/range subscription. Journey retains the ranged custom trigger and its presentation owner. |
| Animation ownership | Source clocks, easing, pin geometry, GPU demand scheduling and current-frame background handoff are preserved. Frame values stay outside React and Storio. Lifecycle tests cover retained resources, cancellation, modes and restoration. |
| Storio | Primitive/stable hook slices and use-prefixed React aliases remain. Entry/audio/failure are shared UI transitions; route mapping and animation clocks remain outside stores. The Bun patch stays registered and reproducible. |
| Styling | All 10 stylesheets follow one-line selector declarations. The initial formatter preserved 1,161 rules and 3,202 declarations. The subsequent sizing migration intentionally replaces fluid geometry queries and lengths with three exclusive width-scaled profiles; URL payloads remain intact. |
| Cleanup | Removed the unused transition-state placeholder and normalized debug statistics to a serialized payload. Owned scroll keys, gate effects and async adoption retain explicit teardown. |
| Maintained guides | Replaced obsolete baseline-hero/Lenis descriptions with the actual gate, scheduler, reading and resource ownership map. Local `assistant/` guides remain untracked. |

## Deliberate reference-specific policies

`useDeferredMotion` is for optional viewport-owned effects. The persistent shell,
fixed hero and pin/navigation coordinator must also mount for restored/offscreen
entry and reading mode. Their hooks dynamically import on mount; their heavy
visual resources still have separate scene/idle/material boundaries. Replacing
these hooks with a generic quiet-disabled observer would break accepted reading
and restoration behavior.

Reading retains the source-required static glasses renderer and background
history. It does not destroy/recreate every context on mode changes. The source
background's visible ambient drift and MENU quiet tail have their own cadence;
hidden/offscreen owners still park. Audio resource creation remains gated by
explicit SOUND intent. See the adjacent scene and audio contracts.

The user replaced the former Gazzar fluid-breakpoint exception with explicit
1920×1080, 768×1024 and 412×915 reference compositions. Design lengths and scene
framing scale by width; height/orientation do not recompose them. CSS-pixel paint
hairlines/filter kernels and physical browser measurements remain intentional
exceptions. SVG-local strokes/path lengths stay in their viewBox coordinate
space. Physical left/right coordinates are retained for deliberately LTR controls
in Arabic. Static article custom properties are server data; live transforms
and measurements stay controller-owned. See the fixed viewport contract.

The local SVG renderers remain section-owned JavaScript modules in the deferred
journey graph; the engine's inherited camel-case public paths remain compatible.
No file was split solely to meet a line count. No original GSAP/R3F application
bundle is shipped.

## Enforcement and verification

- `bun run check:architecture` follows runtime import/re-export edges, excluding
  type-only edges. It rejects graphics, server content and animation/audio
  controllers in the initial client graph; server routes also cannot import
  browser graphics. It rejects prohibited runtimes and non-hook Storio calls.
  Current audit: 108 application modules, 20 client entries and 27 nodes in the
  initial client graph, with no heavy graphics/content import violation.
- `bun run format:css` uses development-only PostCSS. It checks normalized
  ordered AST equivalence before writing, including preserved URL payloads.
  Cascade overrides are not merged across rules/media queries. Formatting is
  included in the architecture check; negative fixtures verify that misplaced
  imports and formatting violations actually fail.
- `bun run check`: **215 tests / 5,945 assertions**, ESLint, generated route types,
  TypeScript and architecture checks pass. `bun install --frozen-lockfile`
  completes without changes, retaining the Storio patch.
- Production build **HEXLldxu_FpOoLP-KcjYX** prerenders EN/AR. The HTTP SSR audit
  passes both locales, RTL, metadata, redirects, 404s and 13 static assets.
- Vawzen production regression: at EN hero0 and work312, all 11 sampled DOM
  elements have identical geometry and computed styles before/after cleanup.
  EN312→AR312, narrow resize, retained reading3794.6→motion11531.8838/312 and
  Back→EN312 pass. MENU opens/closes, and reverse seek40→hero0 completes with
  the new shared scroll subscription. These are targeted regressions, not a
  new whole-route video or physical-input/FPS certification.

Raw validation, CSS equivalence hashes and browser measurements are retained in
`/tmp/gazzar-architecture-audit/`. The architecture guard is a source-graph check,
not a bundle-size/performance benchmark or proof of every runtime lifetime.
Production SSR checks and real lifecycle/interaction regressions remain required.
