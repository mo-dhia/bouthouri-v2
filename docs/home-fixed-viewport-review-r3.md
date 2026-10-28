# Fixed viewport migration — independent correction review R3

2026-10-28. Read-only review of the **four corrected R2 P2s only**, against
the frozen uncommitted source at HEAD `a55a6a0`, using
`docs/viewport-design.md` and both R1/R2 reports. **No actionable P1/P2 found
within this scope. All four corrections are supported by source inspection;
native menu reachability still requires root's browser validation.**

Only this report was written. No application edits, browser/OS operations,
check/build/typegen, server/package operations, staging, commits or delegation
were performed. Root's integrated check is separate. The corrected source is
unserved; production browser review on immutable `cL22` cannot certify it.

## Correction assessment

### Corrected — environment scroll pressure uses design bounds

`src/sections/landing/2-story/story-environment-pointer.ts:7`, `:63`, `:86`;
`story-environment.animate.ts:74`; `story-environment.test.ts:439`, `:462`.

Scroll excitation now divides the native `scrollY` delta by
`Math.max(1, bounds().height)`. The environment supplies its actual canvas
rectangle; that canvas has the width-scaled design height. Standalone callers
default to `designHeight(innerWidth)`. Physical browser height no longer selects
the excitation basis. The native scroll position, delta accumulation, factor
three, signed clamp, exponential decay, small-value cutoff and cleanup remain
unchanged.

The focused regressions exercise all three profiles with equal widths and
different physical heights, then proportionally larger widths/input deltas.
They compare initial pressure and the resulting field `uScroll` after a frame,
and verify disposal. The standalone regression covers the default design basis
and finite zero-sized supplied bounds. These are CPU/input results, not GPU or
paint acceptance.

### Corrected — footer buffer resize retains material history

`src/components/layout/footer/footer-material.ts:149`, `:388`, `:455`, `:981`,
`:1021`; `footer.logic.test.ts:471`, `:534`.

The material reuses its existing owned window resize registration. Equal-width
height/DPR notifications update only the physical backing buffer, invalidate
`paintedRest`, and perform one eligible current-pose draw. The draw path also
checks the buffer before its rest-paint early return. This prevents a cleared or
resized buffer being mistaken for already-painted geometry. Rest path geometry
remains cached; the resize does not call `measure()` or reset material clocks,
morph state, idle episodes or waves. Ineligible drawing remains gated. Width
changes retain the existing reset policy, with buffer coverage refreshed.

The same-controller regression mounts the real material through the parent,
without a mask ResizeObserver notification. Short/tall height and DPR changes
retain path coordinates, datasets, thought/font allocations, timers and RAF
registrations, including rest, idle, waves, forward morph, logo and reverse
morph. It checks the current transform, subsequent control-path equality,
no-op notifications and cleanup. Disposed/no-context handles are safe. The
resize listener is removed on disposal, and
`src/components/layout/footer/footer.logic.ts` has **no net diff**.

### Corrected — local SVG metrics and screen-space exceptions stay separate

`scripts/lib/fixed-viewport-css.ts:49`, `:170`;
`src/sections/landing/3-journey/journey.module.css:497`, `:1013`, `:1635`;
`tests/viewport-design.test.ts:66`.

The converter retains local `stroke-width`, `stroke-dasharray` and
`stroke-dashoffset` pixel numbers as unitless SVG values. Only
`.systems-still path` and `.work-quiet-symbol path` receive the appended
screen-space `vw` override; both retain `non-scaling-stroke`. Ordinary paths
retain their local widths, and `work-line-light` retains normalized `.12`/`-1`
endpoints.

The focused test verifies the ordinary icon's physical paint factor and the
screen-space exception. An additional read-only assertion checked **both**
shipped selectors at reference and 0.8 widths in every profile: painted widths
are within 0.00001 CSS px of 1.25 and 1 respectively. It also checked the shipped
dash endpoints. This is a coordinate calculation with the documented serializer
rounding tolerance, not rendered-pixel evidence.

All ten baseline stylesheets match `a55a6a0`; regenerating each in memory with
the current converter exactly matches the shipped CSS. The CSS policy audit
returns no problems. No generated file was written by these checks.

### Corrected in source — physical menu scrollport around fixed composition

`scripts/lib/fixed-viewport-css.ts:174`;
`src/components/layout/header/menu.module.css:14`, `:106`, `:122`, `:222`,
`:238`, `:374`; `header.logic.ts:351`.

Each profile's effective dialog constraints are fixed `inset:0`, `height:auto`,
zero margin/padding/border, no maximum-height cap, and `overflow:hidden auto`.
These make the outer box the physical scrollport. The inner canvas retains
`width:100vw`, design height and minimum height from `--design-height`, and
visible overflow. Global border-box sizing preserves its width despite padding;
the explicit width keeps the composition independent of the outer scrollbar's
content width. The surface is independently fixed with `inset:0`. At the
reference dimensions, the inner design dimensions remain the reference canvas,
subject to the previously documented coefficient precision.

Opening now resets `dialog.scrollTop` immediately after `showModal()`, alongside
the existing inner scroll reset. The correction adds no lifecycle registration
and leaves the close-button focus, focus restoration, document position lock,
cancel/route close, timeline ownership and disposal paths intact. Header
ownership/focus-eligibility tests and menu track tests pass. They do **not**
exercise native dialog layout, wheel/touch scrolling or keyboard traversal.
Actual lower-control reachability, reopen-after-scroll behavior and surface
coverage at short/tall physical heights remain root's browser checks for the
corrected production candidate, in both locales and modes.

## Validation and retained limits

One focused test invocation:

```sh
bun test tests/viewport-design.test.ts src/sections/landing/2-story/story-environment.test.ts src/components/layout/footer/footer.logic.test.ts src/components/layout/header/header.logic.test.ts src/components/layout/header/menu-timeline.test.ts
```

**41 pass, 0 fail, 1,598 assertions across five files.** The separate in-memory
CSS/source assertions described above also passed. The broad 199-test suite was
not repeated, and no fresh integrated/build/SSR result is claimed here.

The root's pure 1/60-reference-pixel font calibration remains the R2-documented
Firefox reference compatibility decision. This review neither reopens it nor
turns it into a cross-browser font/layout guarantee.

Inherited pixel/optical, footer-cadence and performance questions remain separate
and unresolved by R3. No visual acceptance, live-Gazzar parity, presented-frame
performance, GPU history/pixel identity or cross-browser raster acceptance is
granted. Passing CPU/source checks for these four corrections closes neither
those older claims nor the pending native menu browser checks.
