# Viewport design

The user confirmed these reference canvases on 2026-10-28. On 2026-10-29 the
user asked for every stage to fill the physical window height at any aspect,
like the original. That replaces the fixed design height of the first version,
which left a black band under the stage in taller windows and cropped it in
shorter ones.

| Category | Actual CSS viewport width | Reference canvas |
| --- | --- | --- |
| Desktop | >1024px | 1920×1080 |
| Tablet | >600px through 1024px | 768×1024 |
| Mobile | through 600px | 412×915 |

Width selects the category and the uniform scale `s = actualWidth /
referenceWidth`. Tablet at 650px still uses the 768px tablet composition. Stages
fill the physical viewport height. The composition is the original laid out at
the reference width with the window's proportions: an effective reference
canvas of `referenceWidth × physicalHeight / s`. At the reference dimensions it
matches the original exactly. A window with the reference width and another
height matches the original at that size. Other widths in the category scale
that composition uniformly.

## CSS

Width lengths (`px`, `rem`) use `vw` at the reference width. Viewport-height
units (`svh`, `dvh`, `vh`) stay live: stage heights, vertical padding and
height-bounded type follow the physical window as in the original.
Font-relative `em`/`ch`, percentages, ratios and unitless animation values remain
relative to their width-scaled containing design. All three profile cascades are
explicit, exclusive width ranges. This prevents a desktop-only rule leaking into
tablet/mobile when it has no matching override. Accessibility and pointer/hover
queries remain behavioral queries.

The migration resolves width queries at each reference width. Height queries
become aspect-ratio queries on the reference canvas: `(max-height:H)` becomes
`(min-aspect-ratio:refW/H)` and `(min-height:H)` becomes
`(max-aspect-ratio:refW/H)`. Orientation and aspect-ratio queries stay live.
Constant clamp/min/max expressions are evaluated at the reference width. For
example, the desktop marquee's `clamp(130px,20.4vw,390px)` is 390px at 1920, so
its size is 20.3125vw. A clamp with a live height term becomes
`max(min, min(preferred, max))` with width-unit bounds. The production CSS
serializer retains six significant figures. Migrated coefficients round upwards
at that precision. Bounded font references keep the measured reference
font-resolution boundary before the outer type-scale is applied.

Hairline border/outline thickness and filter kernels retain CSS pixels as
permitted by the styling guide. The menu is a physical `100dvh` dialog whose
scroller reaches every control in a short window.

`scripts/lib/fixed-viewport-css.ts` is the tested migration utility, not a runtime
layout system. Styles remain ordinary colocated CSS Modules. The architecture
audit rejects fixed pixel/rem layout lengths, clamp expressions, `vmin`/`vmax`,
and width or height media features outside the profile policy.

## DOM, SVG, Canvas and Three

`src/lib/viewport-design.ts` is a pure shared profile selector and conversion
boundary. It imports neither React nor graphics code. Do not fake the browser's
dimensions store or replace physical viewport APIs globally.
`referenceStage(width, height)` returns the physical stage in reference pixels:
`{ key, width: referenceWidth, height: height / s, scale: s }`.

- DOM measurements already include CSS scaling. Use them directly for native
  hit testing; convert measured output with `pixelsToVw` when writing CSS.
  Never apply `designScale` to the same measured rectangle a second time.
- Stage lengths for scroll ranges, reveals and pins use `innerHeight` or the
  measured stage height. Reference-unit geometry uses `referenceStage`.
- Source SVG/path math stays in the reference camera. Renderers normalize the
  measured stage by the width scale and let the SVG viewBox scale the result.
  Pure source paths, score fixtures and clock/easing math remain unchanged.
  Ordinary stroke widths and normalized dash endpoints stay in SVG-local units.
  A `non-scaling-stroke` is a screen-space width and needs its own outer `vw`
  scaling; it must not inherit the ordinary viewBox stroke exception.
- Three hosts cover the physical stage. Camera aspect and portrait/landscape
  type composition follow the host's proportions, as in the original. World
  units remain world units.
- Footer Canvas draws in reference pixels through one context transform. DOM
  glyph boxes and native pointer coordinates cross that boundary exactly once.
  Its separate body overlay covers the physical viewport. Height/DPR-only
  changes resize that buffer and repaint the current pose without resetting
  morph, idle or wave history.
- Portrait pixel buffers follow the width-scaled image rectangle and actual DPR.
  Texture/grid sizes, font metric sampling, angles, elapsed time, noise fields
  and GPU quality caps are computational parameters, not CSS design lengths.

Native scroll positions/history stay physical pixels. Navigation's fallback
measures chapter minus stage height and understands `vw` custom-property
distances.

## Validation

Run `bun run check`, `bun run build` and `bun run test:ssr -- <production-url>`.
Tests cover profile boundaries, uniform scaling, physical-height stages, source
SVG/clock fixtures, inline geometry, Canvas typography and pointer mapping.
Browser comparison uses the same width, height, locale, input, entry and
graphics history as the original. Compare each reference width at its
reference height, then at a taller and a shorter height: every stage must fill
the window with no band below it, and positions must match the original at that
size. Preserve EN/AR, reading/motion, restoration, failed enhancement and SSR
content guarantees from the architecture guides.
