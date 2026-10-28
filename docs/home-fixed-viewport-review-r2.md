# Fixed viewport migration — independent review R2

Reviewed the current uncommitted migration against `a55a6a0`, using
`docs/viewport-design.md` and R1. **No P1; four actionable P2 findings.** The SVG
and menu findings were supplied by root during review and independently checked
against the frozen source. The other two were reproduced with CPU probes.
Only this report was written. No application edits, full check/build/typegen,
package/server/OS/browser operations, staging, commits or delegation were done.
Production browser review continues separately on immutable `cL22`; it is not
validation of subsequent source corrections.

## Findings

### P2 — Refresh the footer overlay buffer on a height-only resize

**Locations:** `src/components/layout/footer/footer-material.ts:57`, `:148–157`,
`:404–407`, `:972`; `src/components/layout/footer/footer.logic.ts:30–33`,
`:110–111`.

The body-level Canvas correctly covers the physical viewport, while its paths
and context transform use the fixed design scale. Its backing dimensions are
updated only by `measure()`. The window resize listener calls only `reset()`;
the parent observes the word mask with ResizeObserver. With the new width-only
composition, changing physical height need not resize that mask, so no measure
follows. After reactivation, the old bitmap is stretched into the new CSS box.
Painted glyph geometry and pointer hit coordinates then disagree.

**Exact CPU fixture/repro:** reuse `harness()` in
`src/components/layout/footer/footer.logic.test.ts` and its real material loader
(`material(false, true)`, with caching enabled and real FooterThoughts). Set:

```ts
Object.assign(h.globals, { innerWidth: 1920, innerHeight: 540 });
h.mask.rect.width = h.word.rect.width = 1843.2;
h.word.offsetHeight = h.word.rect.height = 460.8;
h.mask.rect.top = h.word.rect.top = 180;
const material = h.material(false, true);
const canvas = h.paint.canvases[0];
material.setActive(true); h.step();
h.globals.innerHeight = 1080;
h.window.dispatchEvent(new Event("resize"));
material.setActive(true); h.step();
```

Observed buffer height remains **540**, despite physical height **1080**;
the drawing transform remains `[1,0,0,1,0,180]`. A reference point at local y=40
is consequently displayed at y=440 rather than y=220 under the Canvas CSS
scaling. Calling `material.measure(); h.step()` updates the buffer to **1080**
without changing that design transform. The probe evaluated the existing test
harness prefix in memory, stopping before `const flushImports`; no fixture file
was written. The buffer/transform observations are CPU results; displayed-pixel
placement is the consequent Canvas coordinate calculation, not a screenshot.

**Correction:** give the physical overlay buffer its own resize invalidation,
including physical height/DPR changes even when the mask is unchanged. Ensure
the next draw uses current backing dimensions while retaining one design scale,
and clean up the registration. Add this same-controller height-only resize
regression; the current tests compare separately mounted heights instead.

### P2 — Remove physical height from environmental scroll excitation

**Locations:** `src/sections/landing/2-story/story-environment-pointer.ts:62`;
`story-environment.animate.ts:109`; `story-environment-shaders.ts:44`.

Pointer position and the field camera now use the fixed canvas, but scroll
excitation still divides native scroll delta by `innerHeight`. This value feeds
`uScroll`, which adds pressure to the simulated surface and changes its visible
displacement. Thus the same width, native input and elapsed time produce a
different material response solely because the browser is shorter.

**Exact CPU fixture/repro:** call the real `createEnvironmentPointer` in a fresh
EventTarget window/document with `document.hidden=false`, a fine-pointer media
query, `innerWidth=1920`, `scrollY=0`, and bounds callback returning
`{left:0, top:0, width:1920, height:1080}`. Separately run physical heights 1080
and 540. After construction set `scrollY=100`, dispatch window `scroll`, record
`state.scrollVelocity`, then call `advance(1/60, false)`:

| Physical height | Initial scroll pressure | After one identical frame |
| --- | --- | --- |
| 1080 | 0.2777777777777778 | 0.24718938083000663 |
| 540 | 0.5555555555555556 | 0.49437876166001327 |

Dispose each pointer before the next case. The current environment regression
at `story-environment.test.ts:412` covers camera/pointer mapping, not this scroll
input. This is a retained source height dependency exposed by the new policy.

**Correction:** normalize this authored field excitation by the width-scaled
design/canvas height, retaining native scroll positions and existing decay,
clamps and clocks. Test equal-width/different-height inputs and proportionally
scaled scroll deltas within each profile.

### P2 — Scale the two remaining non-scaling SVG stroke widths explicitly

**Locations:** `src/sections/landing/3-journey/journey.module.css:120`, `:136`,
`:282–283`, plus corresponding tablet/mobile profile rules;
`scripts/lib/fixed-viewport-css.ts:49–53`.

The ordinary viewBox stroke and normalized dash correction is sound. However,
`.systems-still path` and `.work-quiet-symbol path` retain
`vector-effect: non-scaling-stroke` with numeric `stroke-width:1.25`. Their CSS
frames scale with width, but their painted strokes remain 1.25 CSS pixels.
The later `vector-effect:none` override applies only to `.work-stroke` and
`.work-carry-field`, so it does not resolve these two cases.

**Exact source fixture:** display the reading/SSR systems still or quiet work
symbol at desktop width 1440. Scale is 1440/1920=.75; the required painted width
is **0.9375px**, while the current non-scaling stroke remains **1.25px**. At the
1920 reference both are 1.25px. This is the root-queued R1 nuance, still present
in the reviewed source.

**Correction:** add explicit profile-specific screen-space `vw` stroke widths
for these two selectors (`1.25 * 100 / referenceWidth` vw), retaining numeric
local stroke/dash values for ordinary SVG paths. Preserve the correction in the
regeneration pipeline. Add a painted-width regression at a non-reference width
for both vector-effect cases and retain the normalized `.12`/`-1` dash endpoints.

### P2 — Let the physical menu viewport scroll the fixed composition

**Locations:** `src/components/layout/header/menu.module.css:14`, `:17`, `:21`
(tablet `:119`, `:122`, `:126`; mobile `:232`, `:235`, `:239`);
`src/components/layout/header/header.logic.ts:334–353`.

The fixed dialog and its inner scroll area are both design-height boxes.
At **1920×540**, for example, each is 1080px tall. Overflow scrolling is based
on that 1080px inner client area, so it cannot reveal the part of an otherwise
fitting composition that lies below the physical 540px fold. The outer dialog
has `overflow:hidden`, and opening the menu locks document scrolling. Lower
links/settings can therefore be unreachable through wheel/touch scrolling.
The absolute menu surface also stops at design height when the physical
viewport is taller. These conclusions follow from the current ownership and
CSS constraints; this review did not test native dialog rendering.

**Correction:** use a physically bounded outer dialog (`height:auto`, fixed
`inset:0`, vertical overflow scrolling); keep the inner composition's height and
minimum height at the profile's `--design-height`, with overflow visible. Let
the menu surface cover the physical viewport independently. On open, reset
`dialog.scrollTop` as well as the old scroller position. Root's queued proposal
implements this separation without introducing height-dependent composition.
Verify pointer/keyboard reachability and reopening after scroll at each
reference width with a shorter and taller physical height.

## Pipeline assessment and limits

- All ten baseline CSS files under `/tmp/gazzar-fixed-vw/baseline/` match
  `a55a6a0`. All ten current application stylesheets exactly match the current
  converter's output from those originals. Each has the three exclusive profile
  ranges, and `viewportCssProblems` reports no problems. These checks establish
  reproducibility and policy syntax, not complete computed-style parity; they
  do not detect the ownership/input failures above.
- No further material P1/P2 found in profile helpers, parent navigation fallback,
  hero/header measured-length conversion, journey pin distance and reference
  SVG cameras, opening fitting, Three camera/type selection, or the reviewed
  footer path/input normalization. Static route content remains server-owned;
  the migration preserves Storio/custom scroll and deferred heavy runtimes.
- The upward six-significant-figure pass addresses the reported serializer
  truncation direction. It deliberately introduces a small coefficient
  overshoot: `133.334vw` is mathematically 1024.00512px at 768, and `222.088vw`
  is 915.00256px at 412, before browser layout quantization. This is a targeted
  production-precision accommodation, not exact real-number equality or proof
  of every layout/serializer boundary. The new production build remains root's
  validation responsibility.
- The 1/60-reference-pixel bounded-font adjustment is restricted to fully
  evaluable `font-size` min/max/clamp results. It preserves the supplied Firefox
  reference boundary before outer type multiplication; it does not quantize
  runtime clocks. It is an engine-calibrated compatibility decision, not a
  browser-independent computed-font guarantee. No new P1/P2 demonstrated in
  that adjustment from this source review.
- Pure score/path/origin data and clock fixtures inspected against `a55a6a0`
  are unchanged. Existing source-clock/path tests also pass.

## Validation performed

Focused tests only, in two terminal invocations:

```sh
bun test tests/viewport-design.test.ts tests/journey-viewport.test.ts tests/journey-presentation.test.ts tests/reading-navigation.test.ts tests/home-navigation.test.ts src/sections/landing/1-hero/hero.animate.test.ts src/sections/landing/1-hero/hero-reading-portrait.test.ts src/components/layout/header/header.logic.test.ts src/components/layout/footer/footer-geometry.test.ts src/components/layout/footer/footer.logic.test.ts src/sections/landing/2-story/story-design.test.ts src/sections/landing/2-story/story-environment.test.ts
bun test tests/journey.test.ts tests/story-scene.test.ts src/sections/landing/1-hero/hero-world.test.ts src/sections/landing/1-hero/hero-reading.test.ts
```

Results: **199 pass, 0 fail, 6,858 assertions across 16 files**. The two extra
read-only CPU probes above expose cases those passing tests do not cover.
No visual acceptance, live-Gazzar parity, fresh production/SSR validation,
native dialog behavior, cross-browser raster equivalence or GPU acceptance is
claimed. Correct the four findings and validate the resulting production build;
the immutable browser candidate cannot certify those later corrections.
