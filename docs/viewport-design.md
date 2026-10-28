# Fixed viewport design

The user confirmed these reference canvases on 2026-10-28. They replace the
earlier exception that preserved every live Gazzar width/height breakpoint.

| Category | Actual CSS viewport width | Reference canvas | Design height |
| --- | --- | --- | --- |
| Desktop | >1024px | 1920×1080 | 56.25vw |
| Tablet | >600px through 1024px | 768×1024 | 133.333333333333vw |
| Mobile | through 600px | 412×915 | 222.087378640777vw |

Match the original at each reference canvas. Within each category, scale the
entire composition by `actualWidth / referenceWidth`. A shorter or taller
browser crops/reveals the same design; it does not change its type, camera,
spacing or layout. Tablet at 650px still uses the 768px tablet composition.
Height, orientation and a separate 700px test cannot select another design.

## CSS

Design lengths use `vw`. Font-relative `em`/`ch`, percentages, ratios and unitless
animation values remain relative to their width-scaled containing design.
All three profile cascades are explicit, exclusive media ranges. This prevents
a desktop-only rule leaking into tablet/mobile when it has no matching override.
Accessibility and pointer/hover queries remain behavioral queries.

The migration evaluates original geometry queries and constant clamp/min/max
expressions at each reference canvas before converting their measured result.
For example, the desktop marquee's `clamp(130px,20.4vw,390px)` is 390px at 1920,
so its new design size is20.3125vw. Blindly keeping20.4vw would change parity.
Content-dependent title-line and typography variables remain live, with bounds
expressed in width units. The production CSS serializer retains six significant
figures; migrated coefficients round upwards at that precision so an exact 915px
reference height cannot truncate to 914.983px. Bounded font references retain the
measured reference font-resolution boundary before the outer type-scale is
applied. Browser font rasterization and subpixel layout can still quantize edges.

`--design-height` is available in CSS. The menu uses a physical fixed/inset
dialog scrollport around a fixed design-height inner canvas, so a short browser
can scroll to every control without shrinking/reflowing the composition. Its
surface covers the physical viewport independently. Opening resets the outer
dialog and inner content scroll positions. This needs no viewport-height unit.
Hairline border/outline thickness and
filter kernels retain CSS pixels as permitted by the styling guide. The sole
viewport-height expression is a motion-only native scroll tail after the journey:
`max(0vw, calc(100dvh - var(--design-height)))`. A browser taller than the design
stage otherwise runs out of document scroll before score 714. This adds only the
missing physical scroll extent, outside the measured pin/chapter; it does not
resize the design or its camera. It is zero at the reference height and in
shorter viewports, and absent from reading/SSR fallback layout.
The architecture audit permits exactly this selector/property/expression.
Future `vh` usage requires an equally concrete physical browser constraint;
it must not become a second design sizing input.

`scripts/lib/fixed-viewport-css.ts` is the tested migration utility, not a runtime
layout system. Styles remain ordinary colocated CSS Modules. The architecture
audit rejects fixed pixel/rem layout lengths, clamp expressions, viewport-height
design sizing and geometry queries outside the fixed profile policy.

## DOM, SVG, Canvas and Three

`src/lib/viewport-design.ts` is a pure shared profile selector and conversion
boundary. It imports neither React nor graphics code. Do not fake the browser's
dimensions store or replace physical viewport APIs globally.

- DOM measurements already include CSS scaling. Use them directly for native
  hit testing; convert measured output with `pixelsToVw` when writing CSS.
  Never apply `designScale` to the same measured rectangle a second time.
- Source SVG/path math stays in the reference camera. Renderers normalize the
  measured stage by the width scale and let the SVG viewBox scale the result.
  Pure source paths, score fixtures and clock/easing math remain unchanged.
  Ordinary stroke widths and normalized dash endpoints stay in SVG-local units.
  A `non-scaling-stroke` is a screen-space width and needs its own outer `vw`
  scaling; it must not inherit the ordinary viewBox stroke exception.
- Three hosts use the fixed profile height. Camera/type layout and responsive
  branches use the reference dimensions. World units remain world units: the
  fixed camera aspect and width-scaled host make text and objects scale together.
- Footer Canvas draws in reference pixels through one context transform. DOM
  glyph boxes and native pointer coordinates cross that boundary exactly once.
  Its separate body overlay covers the physical viewport; that buffer coverage
  does not control the design size of its typography, morphs or waves.
  Height/DPR-only changes resize that physical buffer and repaint the current
  pose without resetting morph, idle or wave history. Width/layout measurement
  still owns the reference geometry reset.
- Portrait pixel buffers follow the width-scaled image rectangle and actual DPR.
  Texture/grid sizes, font metric sampling, angles, elapsed time, noise fields
  and GPU quality caps are computational parameters, not CSS design lengths.

Actual `innerHeight` remains necessary for native maximum-scroll clamps,
visibility/IntersectionObserver, overlay buffer coverage and document lifecycle
behavior. Pin distance, layout offsets and framing derive from the fixed stage.
Background scroll excitation likewise divides by the design canvas height;
changing browser height alone must not change pressure from the same input.
Navigation's fallback measures chapter minus stage height and understands `vw`
custom-property distances. Native scroll positions/history stay physical pixels.

## Validation

Run `bun run check`, `bun run build` and `bun run test:ssr -- <production-url>`.
Tests cover profile boundaries, uniform scaling, height invariance, source
SVG/clock fixtures, inline geometry, Canvas typography and pointer mapping.
Browser comparison must use the reference dimensions and the same locale,
input, entry and graphics history. A source screenshot from another aspect
ratio cannot be used to retune a fixed composition.

Also compare within-category widths and change physical height while keeping
width fixed. Geometry/type/camera must remain unchanged, apart from physical
visibility and scroll limits. Preserve EN/AR, reading/motion, restoration,
failed enhancement and SSR content guarantees from the architecture guides.
