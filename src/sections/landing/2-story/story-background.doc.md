# Fixed HOME background lifecycle

`createStoryEnvironment(stage, { reduced })` returns
`{ setReducedMode(enabled), dispose() }`. The gate retains that handle for one
HOME mount. Its latest-mode ref covers changes before idle startup or while the
dynamic import is pending. `mountStoryEnvironment()` remains a cleanup-only
adapter. Background failure stays optional and separate from the object-scene
failure latch.

The offline reference is `/tmp/gazzar-runtime/1nvdbh89vm0tk.js`, module 20109,
line 106 (`v`, the visible material component). Its `G` field is memoized on
`[x, A]`, where `x = size.width / size.height` and `A = size.width < 700`.
`w.current` retains material time, pulse, remaining settle time, previous stroke
coordinates and work travel. Reduced mode changes input gain `.32`, pulse decay
`10` instead of `4.8`, material phase speed `.035`, and settled cadence `250ms`
instead of `1000/24ms`; it is not a field-allocation key. The source pointer hook
also reruns its transient input setup when reduced changes, while retaining the
shared pointer object and field history. The controller's mode update mirrors
that transient reset through `pointer.resetInput()`, retaining smoothed/field
coordinates, material protection and the native pointer listeners.

The parent source `2gz902oulp4x8.js.pretty:567–577` resets the narrative in its
`useLayoutEffect([F])` before reading sets idle `0`, emergence `1` and opening
`26`. `45adsxrqjjj5i.js:14` defines `initialNarrative` from `initialJourney`;
environment and surface quiet therefore reset to `0` independently of DOM story
time. The background selects that reading score even after a late motion frame.
`initialJourney` in `0or6--g23od4n.js.pretty:115` also supplies work travel `-1.35`.
The adjacent reduced `ep(e).update(0)` updates only the concept header; it does
not replace that travel. Reading therefore selects effective travel `-1.35`
while retaining `previousTravel`: its first draw applies the source horizontal
reset impulse, and following unchanged draws contribute zero horizontal force.
Motion return reads the current stage clock and `.work-world.dataset.travel`,
rereading both before the first draw unless a newer precise `journey-frame`
arrived with its associated DOM travel. No score/travel selection clears the
field or resets material time. Initial background boot also reads current DOM
travel, so an import that finishes after a work restore does not inject the
opening's stale negative travel impulse into that scene.

Hero gain/presence consume the displayed `gazzar:hero-world` progress. Late boot
reads `readHeroWorldPose(#identity)` at full precision, using native geometry only
without a publisher. Journey opening time and raw `gazzar:hero-world-input` do
not override that independent 100ms clock. The measured gain/amplitude formulas
remain unchanged.

Resize updates renderer size/DPR and surface aspect. The clip-space camera does
not have a perspective projection to resize. Only a changed aspect/mobile key
replaces the pressure field; only the mobile key replaces the plane grid
(`192×128` desktop, `96×96` mobile). Same-size, DPR-only and same-aspect resizes
keep both targets and wave history. Native resize still resets transient pointer
input through its existing listener. A changed field resets stroke initialization
and clear state, retaining material time, pulse and settle history as in source.
Field initialization/clearing waits for the next permitted draw. Context restore
invalidates field contents but retains the controller, CPU histories and canvas.

There is one existing RAF/timer scheduler. Mode changes wake it without drawing
synchronously or starting another loop. Hidden, offscreen, lost-context and
menu-open states submit no background GPU work; resize can prepare CPU resources
while paused. Disposal is idempotent and releases the field, plane, material,
fallback texture, renderer/context, listeners, pointer owner and scheduled work.

R15's native draw trace (`docs/home-residual-cost-r15.md`) found two background
default-framebuffer submissions in 444 local document-timeline bins, versus none
in source. A settling callback drew an older pose before the parent's journey
callback synchronously drew again. Journey events now store the newest precise
score and associated travel, then invalidate the existing demand RAF. Multiple
events share its pending draw; if the settling draw already ran, the newest pose
remains pending for the next refresh. Hero, pointer, resize and mode changes use
that same scheduler. This follows source's demand-root ownership without
discarding a newer pose or changing field resolution, equations, quality or idle
cadence. The focused regression exercises both callback orders and hidden-state
resume. Native submission counts and whole-route moving parity require a new
production review; no presented-FPS claim follows from the CPU harness.

`story-environment.test.ts` executes the real controller and native pointer code
in an isolated event/renderer harness. It checks allocation identity and disposal,
material time/rates, retained pulse/stroke coordinates, same-size/same-aspect/DPR
resizes, the exact aspect/mobile allocation keys, mobile grid replacement,
idle cadence, paused resize/context restore, optional failure and idle/import
cancellation with the latest mode. Additional regressions cover `174 → reading`
zero-score selection, current-clock resume, reading travel impulse/current-travel
resume and displayed hero clock ownership.
These are CPU/resource/history regressions,
not shader-pixel, continuous-motion or full-HOME acceptance. Root owns the
integrated build, full checks and continuous Vawzen comparison. This lifecycle
correction does not explain the R8 Arabic sculpture-lighting difference.
