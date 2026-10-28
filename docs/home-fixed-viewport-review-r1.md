# Fixed viewport migration — adversarial static review R1

Reviewed the frozen uncommitted migration against `a55a6a0` in the shared
checkout. Only this report was written. No implementation files, packages,
servers, browser sessions, staging or commits were changed; no work was delegated.

## Findings

### P2 — Preserve SVG-local stroke metrics at the conversion boundary

**Locations:** `scripts/lib/fixed-viewport-css.ts:49–55`;
`src/sections/landing/1-hero/hero.module.css:24` (also tablet/mobile at
101/183); `src/components/layout/header/header.module.css:16` (also 140/281);
`src/sections/landing/3-journey/journey.module.css:295–298` (also 793–796 and
1395–1398).

**Trigger:** render an affected SVG at any width other than its category's
reference width, for example desktop at 1440px, with the pause/sound icon visible
or the work-line-light animation running.

The migration treats every `px` stroke metric as an outer CSS design length.
These SVGs already scale their fixed local geometry through their CSS frame and
viewBox. For strokes without `vector-effect: non-scaling-stroke`, converting the
local stroke width to `vw` applies the category scale twice. The pause SVG has
`viewBox="0 0 16 16"` (`hero.tsx:259`). At 1920px its original 14px frame and
1.2-user-unit stroke paint a 1.05px stroke. At 1440px, uniform scaling requires
0.7875px. The migrated frame is correctly 10.5px, but `stroke-width: .0625vw`
becomes 0.9 local units, painting only **0.590625px**. The sound SVG and the
ordinary systems/chapter SVG strokes have the same coordinate-boundary problem.
Work strokes explicitly using `non-scaling-stroke` need separate treatment:
their screen-space widths should continue to scale with the outer design.

The same blanket conversion also changes normalized path animation values.
`work-line-light` originally animates `stroke-dashoffset` from `.12px` to `-1px`
against unchanged normalized dash lengths (`stroke-dasharray: .12 1` and
`pathLength=1`). At 1440px its migrated endpoints become **.09 and -.75**,
instead of the original normalized **.12 and -1**. This changes the highlight's
path coverage and its loop boundary rather than merely scaling its drawing.

**Correction:** retain SVG-local widths and normalized dash offsets as unitless
local numbers where the viewBox owns scaling; convert genuine screen-space
strokes separately. The audit can allow these unitless values without restoring
layout `px` or introducing another responsive design. Add a focused assertion
for painted stroke scaling and normalized dash endpoints at a non-reference
width. Existing DOM/SVG camera tests do not inspect these CSS paint metrics.

**Evidence:** a standalone read-only calculation using the current PostCSS
declarations reproduced both numeric mismatches above. This is a static
coordinate analysis, not a browser screenshot comparison.

## Checks and non-findings

- All ten `/tmp/gazzar-fixed-vw/baseline/` CSS files exactly match original HEAD.
  All ten current CSS files exactly match the migration utility's output from
  those originals. The new CSS audit reports no problems on these files.
- An independent reference evaluator compared 324 original media-query cases
  and 4,986 numerically evaluable declaration cases across 1920×1080,
  768×1024 and 412×915; no numeric mismatches were found. Variable fallbacks,
  representative title-line/type variables and nested arithmetic were included
  where independently evaluable. This does not prove every computed style.
- `bun test tests/viewport-design.test.ts`: four tests pass, 74 assertions.
- No additional P1/P2 found in exclusive profile selection, reference clamp
  evaluation, variable-length conversion, fixed environment/peripheral/material
  host heights, server reading fallback, or the reviewed hero/header/journey
  non-CSS integration. The navigation fallback now measures chapter minus stage
  and converts a `vw` distance fallback correctly. Native maximum-scroll clamps
  appropriately retain actual viewport height. Reference-camera/path/clock
  fixtures remain distinct from CSS measurements.

## Release assessment and limits

No P1 found. The P2 above should be corrected before claiming strict uniform
scaling throughout each category. The reported integrated 244-test/7,236-assertion
check and production build/SSR results were supplied by the parent; this review
did not rerun the full pipeline. No server/browser/OS/package operations were
performed. Visual matching to live Gazzar, painted output, entry/history-dependent
motion and GPU rendering remain outside this static review; no full parity claim
is made.
