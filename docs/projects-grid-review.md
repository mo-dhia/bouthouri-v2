# Projects grid implementation review

Historical grid-only snapshot. The later local-detail routes and caption/background corrections are documented in [the experiment integration review](projects-experiments-review.md). The external-link statements below describe the original frozen build.

The Projects route now implements the grid view of
[Carter Ogunsola's Lab](https://carterogunsola.com/lab), with the existing
Bouthouri navigation, retained background, local fonts, warm ink and borders.
The source header, view-mode switcher, theme controls, presence and notifications
are excluded. The user explicitly requested keeping the nine reference previews
and links for now. Visible attribution identifies their author; individual
experiment destinations remain external.

## Implementation

English and Arabic routes prerender nine ordinary linked cards, posters,
heading, instructions and attribution. A null gate imports the imperative
controller separately. A failed controller or disabled JavaScript leaves a
scrollable three/two/one-column document. The enhanced surface repeats the cards
into the source 6×6 grid; only the original nine links enter the accessibility
tree and keyboard tab order.

One demand RAF owns grid projection, damping, the finite entrance and input
physics. Source geometry, wrapping, radial bow, pointer pressure, image parallax,
drag threshold, release expiry, capped velocity and momentum decay are ported
without GSAP or Lenis. A child owns one reused muted video element and its intent
timers. No reel source is assigned before eligible interest. Hidden documents,
menu and reduced motion pause media; disposal removes its source and element.
The existing locale background retains its resource through Projects navigation.

The [colocated contract](../src/sections/projects/1-grid/grid.doc.md) describes
the source constants and ownership. [Media provenance](../public/assets/projects/lab/README.md)
lists original URLs, formats and dimensions; the adjacent SHA256SUMS covers all
18 locally served poster/reel files (approximately 5.7MiB total).

## Frozen local validation

Build `Ee6it4myApYbPb1Ru2uZC`, based on `bb21749` plus this Projects change:

- `bun run check`: lint, generated route types, TypeScript, architecture and
  **424 tests / 17,624 assertions / 48 files** pass. The architecture audit
  covers 185 modules, 30 client entries, 41 initial-client modules, 93 server
  modules and 17 CSS files.
- `bun run build`: HOME and four editorial routes prerender in both locales.
- `bun run test:ssr -- http://localhost:3100`: all ten localized routes,
  metadata, RTL, redirects, 404s and 22 static assets pass. Both Projects
  responses contain all nine cards, local poster/reel data and attribution.
- Nineteen focused Projects tests pass. Geometry fixtures execute the cached
  original controller with inert shell adapters at all three references, across
  initial, pointer and wheel states. Actual mounted-controller tests check
  one/zero RAF ownership, capture/cancel/click behavior, hidden/menu/reduced
  transitions, cleanup and late-font cancellation. Media tests cover delayed
  intent, rejected eligibility, hidden suspension and complete disposal.

The raw initial failures remain retained. They include test-authoring/type
corrections, a stale development metadata cache resolved by restarting the same
development command, and an SSR assertion that initially assumed every route
had a footer. Projects intentionally omits that footer. None is represented as
a passing control. The final full check/build/SSR results above are separate.

## Reference screens and scaling

Fresh English and Arabic local screenshots and card rectangles were compared
with the original grid at 1920×1080, 768×1024 and 412×915, all DPR1. The seven
sampled indices include central, edge and wrapped/offscreen cards. Among sampled
cards with reference opacity above .1, maximum absolute x/y/width/height error
is **.0168px desktop, .0334px tablet and .0168px mobile**, within Firefox's
subpixel/stylesheet serialization quantization. EN and AR geometry is identical.
Typography and shell/background pixels are deliberate design adaptations.

The reference's fractional CSS inset, versus its integer offsetLeft subtraction,
is retained; it explains the earlier .15/.47px compact offset. This was corrected
from the measured source inset, without changing the source projection math.

Additional local 1440×900 and 650×900 checks retain the desktop/tablet reference
composition scaled once by width. At 1920×780 the design canvas remains 1080px
tall. Default focus brings an original offscreen card into the visible crop,
native scroll remains y0, its center hit test succeeds, and the fixed attribution
remains reachable. A route-scoped physical crop prevents native focus from
scrolling the design canvas out from under pointer coordinates. No viewport
height unit controls its design geometry.

## Moving and functional checks

The final native desktop pair uses matching fresh grid states and the same
79-event XTest plan: hover, diagonal drag, release/momentum, vertical and
horizontal wheels, opposite drag, release and leave. Both runs finish without
focus/input abort and with recorder exit0. Source has 396 encoded frames/13.2s;
local has 398/13.2667s. The comparison is source left/local right, 1920×540,
396 encoded frames. **All seven sheets / 53 paired 4fps samples were inspected.**
Grid wrapping, pointer deformation, direction changes and momentum track closely;
no additional actionable defect was established in that finite sample.

The recordings are sequential, actual input times differ slightly, and encoded
PTS is not the presentation clock. They establish behavior under that protocol,
not exact simultaneous poses, sustained presented FPS or every encoded frame.
The earlier pair is retained as historical footage and predates the final media
child/focus-crop changes; the final pair above is the canonical moving review.

Actual browser controls additionally verify:

- Zero reels before interest; trusted pointer hover starts one muted local reel.
- A hidden tab pauses time immediately. Returning can generate PointerLeave and
  reset to the poster; the original does the same in the paired tab control.
  The no-leave suspension/resume branch is separately covered by media tests.
- MENU pauses media. Projects→Vision keeps the same background canvas/host and
  disconnects the old video with its src removed. Native Back restores Projects
  y0, the 36-card surface and the retained background.
- Default keyboard focus recenters an original card. Trusted Enter follows its
  original Dial destination; native Back returns to the Projects surface.
- Script-blocked desktop and Arabic mobile documents retain nine usable poster
  links. A separate proxy returning503 only for the optional grid controller
  chunk retains the Arabic mobile fallback with the shared shell functional.
  Both controlled proxies were stopped after inspection and the page reloaded
  from the normal preview origin.

Reduced/Save-Data/coarse-input and cancellation branches have meaningful mounted
and pure tests. Physical hardware touch, native OS reduced-preference changes,
Arc/macOS graphics and 60Hz presentation were not certified in this new grid
review. Prior HOME/editorial reports keep their original finite scope and limits.
No source render, clock, asset or stylesheet was modified for these controls.

## Evidence

Local source HTML/CSS/JS, fixtures, logs, code/source hashes, six-screen receipts,
fallback screenshots and final recordings are retained under
`.artifacts/projects-grid-20261029/`. The canonical comparison is
`videos/comparison-desktop-final.mp4`; actual native event receipts and original
recordings are adjacent. These local review artifacts are intentionally ignored
by Git. This document and the media provenance remain portable repository records.

Deployment is verified separately after the validated commits are pushed. No
unconditional full-experience or performance certification is inferred from the
finite checks recorded here.
