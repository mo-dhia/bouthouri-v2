# Home Three scene integration

The scene controller is owned by `src/sections/landing/2-story/`. The parent owns
all SSR content, stage pinning, and the central clock under `3-journey/`.

## Stage / clock contract

- Mount with `mountStoryScene(stage)` where `stage` is `#top.stage` and contains
  `.canvas-layer`. The function returns synchronous cleanup, including cancellation
  of an in-flight boot. A null-rendering deferred gate is supplied separately.
- The scene reads `stage.dataset.storyTime`, `openingTime`, and `progress` at
  startup, and listens on **the stage** for `journey-frame`, whose detail is
  `{ time, openingTime, progress }`. No second scroll mapping or DOM animation.
- Clock/history sampling is synchronous in that event, including before GPU
  readiness. GPU draws are coalesced into the scene's one demand RAF alongside
  idle/pointer work; they are not synchronous child draws in the parent RAF.
  The scene consumes the latest available shared frame without changing scrub
  duration or authored camera sampling. Scores >=306 still project the settled
  Ideas origin directly on the CPU and cancel object GPU demand. Finite warm
  and static boot draws retain their existing readiness/failure gates.
- Integrate the default `StorySceneGate` from
  `src/sections/landing/2-story/story-scene-gate.tsx` once in the server journey.
  It defers both renderers. Its motion mode mounts the fixed visible environment
  independently of the object scene, so scores 306..714 retain the material.
  Quiet/reduced mode retains the slower, lower-amplitude background material.
- `time` is original story score **0..714**; `openingTime` is **0..26**.
  `progress` is display progress `(openingTime + time) / 740`, not pin progress.
- The renderer owns only its canvas and scene-state data attributes. Keep the SSR
  fallback visible until `data-story-scene="ready"`; failure sets `"failed"`.
- The canvas projects the terminal period in “put to work.” and dispatches
  `story-origin` **on #top**, with detail
  `{ x, y, radius, ready: true, direction: 'ltr' | 'rtl' }`. x/y are normalized
  stage coordinates, radius is CSS pixels. Parent can `Object.assign` this
  detail into its `workOrigin.current` and invoke `current.changed?.()` before
  updating the SVG work renderer. Listen before the first scene render.
- Initialize the work origin synchronously with
  `getSettledStoryOrigin(stage.clientWidth, stage.clientHeight, rtl)` from
  `src/sections/landing/2-story/story-origin.ts`. It imports only a 1,144-byte
  numeric JSON table, with no Three, Troika or browser dependency. Use actual
  stage dimensions, including the short-viewport minimum. Recompute before work
  resize when those dimensions change; same-size/font-ready measures must not
  replace a live Ideas origin. Real `story-origin` events remain authoritative.
- Quiet/reduced reading remounts a **static** glasses-only controller, with time
  zero, opening 26, emergence 1, and idle 0. It omits sculpture/font/LTC loading,
  pointer interaction and the idle loop. `mountStoryScene(stage, { staticMode:
  true })` is the imperative equivalent. The source's initial camera/pose is
  retained. No mode toggle or scene function writes scroll position.
- The host's original opacity and display declarations are restored on cleanup.
  Static mode exposes the canvas host even when the parent's unenhanced-reading
  CSS hides optional hosts. All other server reading layout stays with the parent.

## Startup and fallback

`data-story-boot` reports `context`, `models`, `environments`, `typography`,
`compile`, `warm`, `ready`, or `failed`. A successful initial frame sets
`data-story-scene="ready"` and invokes `onReady`; it releases the shared scene
boot slot. The initial frame deliberately compiles lens-transmission variants
and draws once below the fold while the document is visible. The actual current
score and opacity are used, so the warm-up introduces no visible model flash.
No offscreen animation loop follows. A hidden tab warms when it becomes visible.

Subsequent object activity uses an intersection threshold of .001, avoiding the
sticky-stage edge case where a zero-area intersection at the viewport boundary
never causes a later threshold-zero notification. `data-story-activity` exposes
the current `visible`, `offscreen`, `hidden`, or `menu` gate on clock events.

Both import/asset failure and WebGL creation/context failure retain the parent's
SSR poster: `.fallback-glasses img` uses
`/assets/images/glasses-fallback.png`. Hide the poster only when the scene flag
is `ready`. Object import, asset, typography or context failure latches
`#top[data-story-failed="true"]` and `uiStore.homeSceneFailed` for the current
HOME mount, releases the boot slot and unmounts both scene controllers. The
parent uses that shared flag for its effective reading layout. Mode changes do
not retry the failed scene. Only HOME gate unmount clears the latch, allowing a
route revisit to retry. No content waits on optional GPU readiness.

The fixed background reports `data-story-environment="ready"|"failed"` and owns
its `.global-environment` child inside `.experience`. Its canvas uses DPR <=1.5,
no antialiasing and low-power preference. No root layout/content boundary changes
are required. The parent owns DOM/SVG systems cards, native paths and their copy.

## Recovered reference timing

Reference chunk `0or6--g23od4n.js`, modules 38311 / 99317, and entry chunk
`2gz902oulp4x8.js` establish: world transition enabled; opening input length 22;
story input length 394.72; total input length 416.72; opening score duration 26;
story duration 714. Desktop scroll distance is
`round(6.8 * viewportHeight * 416.72 / 100)`. The native wrapper height adds one
stage height. At 1036px this is 29357px scroll + 1036px stage = 30393px.
Mobile uses the original 700px breakpoint and 5.8svh per input unit; its source
end subtracts stage height and padding from the chapter computed min-height.
Story input is linear through score 100, then compressed at .48 input units per
score unit. Source scrub is .48 seconds through score 270, then synchronized.

## Recovered camera contract

Perspective camera: vertical FOV 34°, near .005, far 60. Canvas: alpha,
antialias, ACES filmic tone mapping, exposure 1.1, transmission resolution .5;
DPR bounded at 2 desktop / 1.5 at <=700px. The actual glasses are scaled by 30,
with the source scene shifted by negative Lens_L center Z before scaling.

Initial score pose: distance 9.8, x 0, y .12, rx -.13, ry .25, rz -.14, focus 0.
At 0..22: distance 9.4, x/y 0, rotation [-.055,.07,-.035], sine.inOut.
At 23..48: focus 1, distance 3.2, x -.12, y .06,
rotation [.018,-.025,.025], idle 0, sine.inOut.
At 48..70: distance .035, rotation zero, power2.in (cubic).
At 60..69: darkness 1, power1.inOut. At 66..71: optical veil 1,
power1.inOut. At 70..75: distance -.24. Glasses hidden at score >=75.
Distance compensates aspect using `lerp(max(1, 1.52/aspect), 1, focus)`.
The camera target blends [0,.12,0] toward the rotated/transformed Lens_L center
by focus; camera position adds the compensated distance to target Z. After 75,
camera resets to [0,0,10*max(1,.88/aspect)] looking at the origin.

`story-score.ts` remains the authored, history-free sampler. The small
`story-camera-history.ts` adapter preserves an observed source refresh rule:
ScrollTrigger's 200ms resize refresh initializes still-uninitialized camera
tweens from the displayed pose, retaining already-initialized starts. At score
40.000852, refresh captures distance 4.638657 and rotation
[.001061,-.002956,.011078] for both future 48..70 and 70..75 camera tweens.
Without that refresh, a normal forward scrub crossing 48 captures authored
distance 3.2 / rotation [.018,-.025,.025], and crossing 70 captures .035.
Reverse preserves those cached starts. A restored first frame captures the
remaining starts; a new HOME/motion mount resets the adapter. No camera offset
is tuned and no general timeline/GSAP runtime is emulated.

Every shared `journey-frame` is sampled before GPU readiness, including hidden
or offscreen frames. The resize timer reads that current numeric pose and is
cancelled with its listener on cleanup. A same-size resize can affect future
camera starts while leaving environment capture untouched: these are separate
source behaviors.

## Sculpture and text contract

Original `Logo_Part_01_Finished`, `02`, and `03` become `Logo_Part_01..03` on
owned clones. Their embedded titanium microroughness image is retained. Material
RGB is linear [.043,.043,.043], metalness 1 and roughness 1.1. The individual
curve/circle/dash paths settle at scores 128/174/218 and depart through 278;
the object group is visible from 98 through 306. The source does not show an
assembled GLTF after that point: the parent owns the later SVG assembly/systems.

`story-paths.ts` exports responsive/RTL authored routes and the source Hermite
translation sampler (.72 tangents), smoothstep rotation/scale and authored bows.
The logo root tilt remains -.12 radians. `story-score.ts` exports the sampled
camera/light state independently of Three. Animation progress never enters React.

`story-type.ts` reads the first three `.spatial-description h2 + p` pairs and
`.quiet-outlook h2`/`.eyebrow` from server HTML. It uses the actual studio fonts:
`/assets/textures/questrial-studio.woff` (source `/fonts/Questrial-studio.woff`)
and `/assets/textures/cairo-studio.woff` (source `/fonts/Cairo-studio.woff`).
These are intentionally separate from the DOM WOFF2 files. The approved focused
`troika-three-text` 0.52.4 renderer supplies the source-equivalent SDF shaping,
tracking, wrapping, glyph bounds and Arabic collision fits. It runs under plain
Three, with no R3F or animation framework. The recovered 3D coordinates,
clipping, depth flags and render order are retained. Semantic text remains
server-rendered.

Both font bytes and generated codepoint coverage are local. Font coverage is
validated before text layout, so missing glyphs fail to the readable SSR path
instead of requesting Troika's external fallback font service. The worker is
bundled locally; there are no external font, worker or WASM requests. Worker
failure is bounded by a 10-second readiness timeout. The original Questrial/Cairo
font files cover every character used by both HOME scenes.

The `story-origin` detail is projected from the terminal period in the second
Ideas line. The projection includes the original SDF margin correction. It is
updated during the reveal and is stable by score 270; the parent's score
264..300 handoff can consume it directly. Direct seeks past score 306 still
project the clamped settled period without restarting object rendering. The
final logical caret selects the terminal period even when RTL glyph order differs.
`story-origin.generate.mjs` reproduces the four local metric rows offline with
the pinned typesetter and original fonts; it is never imported into the page.

## Visible environment

The background is the recovered two-target RGBA16F height/velocity/orientation
simulation, not an environment-map backdrop or radial glow. Simulation height
is 128 desktop / 96 mobile, width <=288, step 1/120; wave speed .3, restoring
10, damping 7.2 and viscosity .0018. It handles pointer strokes, held pressure,
irregular click impulses, scroll forcing, work travel and three sculpture guards.
Its fixed studio reflection shader clamps linear grayscale to .0008..022.

Object rendering emits internal `journey-scene-interaction` on the stage with
`{ guards, grabbed }`, consumed by the background to avoid applying pressure
through the sculptures. Shell `gazzar:hero-world` events drive initial
background presence/interaction gain; `gazzar:hero-world-input` remains an optional
override with the same `{ progress }` shape. Display progress is not fed back.
The footer material remains shell-owned.

The window event `gazzar:material-protection` carries
`{ source: 'portrait' | 'footer', active, pressureScale, influence, clientX,
clientY }`. Active publishers combine by minimum pressureScale; releasing one
does not erase the other. Portrait publishes its actual alpha/exit-scaled
`1 - .88 * exitVisibility * pointerStrength`; footer publishes pressureScale 1
and influence .75 while hit or pulling. The source field context cap is
`min(contextTarget, grabbed ? .28 : 1, 1 - .62 * footerInfluence)`, giving .535
for footer influence .75. Shell releases on cancel, blur, hidden, resize and
disposal. The background owns no portrait/footer hit testing.

Visible idle normal drift is intentional source content. It renders at 24fps
after the physical tail, or 4fps with .035 phase speed/.32 input gain in reduced
mode. A stationary fine-pointer hover retains the original .024 forcing.
Hidden, offscreen and menu-open states cancel RAF and timers; close/visibility
resume wakes the material. The object canvas continues to stop when settled.

## R4-01 material correction

The original unsigned-byte RGBA softbox is **sRGB**. Source R3F `applyProps`
automatically marks material maps that way; plain Three `DataTexture` defaults
to no color space. `softboxTexture()` must retain its explicit
`SRGBColorSpace` assignment. Removing it brightens the sculpture capture and
also changes the scratch field sampled by later glasses refreshes. The lens
material constants and authored light-card constants were unchanged in this fix.

The source's glasses 256px and private sculpture 512px raw cubes share one
renderer-owned r180 CubeUV/PMREM cache. A later refresh of the existing 256px
target retains the 512px scratch layout. Separate one-shot PMREM generators
produced a different visible field despite identical model/material constants.
The owned controller now uses the native shared cache, with a finite clean
256px boot refresh before the sculpture cache initializes. It preserves the
source transparent-transmission clear state during compilation. The later R6
investigation below corrected the capture trigger from width/height alone to
the full measured canvas bounds, and delayed private-studio cache activation
until entry readiness. Identical bounds and idle rendering do not recapture.

Studio cards, raw cube targets and their texture maps are owned per mount and
explicitly disposed. Model cleanup excludes those externally owned environment
textures. The renderer owns its derived CubeUV targets/scratch; renderer
disposal and the existing context release retire that whole isolated cache.
There are no node_modules changes or hidden recapture loops.

Measured using only the loaned main-window source5/local11 at **1912x1009/DPR1**:

| Geometry history | Source/local red Float32-bit FNV-1a | Source/local mean red |
| --- | --- | --- |
| Sampled sharp state, before explicit geometry change | 1985076677 / 1985076677 | .2260496046918282 / .2260496046918282 |
| Same-size window resize | unchanged | unchanged |
| Canvas width 1912→1910→1912 | 1639153093 / 1639153093 | .1720630727537961 / .1720630727537961 |
| Canvas height 1009→1007→1009 | 1639153093 / 1639153093 | .1720630727537961 / .1720630727537961 |

Those hashes describe the GPU atlas on this driver, including unused texels;
they are diagnostic fixtures, not cross-GPU pixel guarantees. Source raw/cached
versions were 6/6 cold, 10/10 after width, 12/12 after height; own versions were
2/2, 4/4 and 6/6. Source performs extra equivalent captures during React layout;
the resulting fields match. These are sampled cache states, not proof that all
fresh navigation or reload lifecycles choose the sharp state. The old evidence
does not contain a complete document-start recapture trace. R6 supplied the
missing controlled lifecycle check, described separately below. Earlier browser
resize work used Vaelix's emulation-first action; it was not verified as an
OS-native resize.

After the width cycle, settled score-40 crop mean RGB source/local was
19.6297/19.5793 at (30,300)-(160,440), 24.1940/24.3841 at
(850,330)-(1100,570), and 22.4161/22.6717 at (1200,400)-(1280,620).
Crop MAEs were .0937, .1901 and .2556 respectively. The R4 pre-fix baseline at
its different 1360x1000 viewport was 22.5690/12.7096 in its recorded lens crop.

With matched refresh/camera history, the (200,180)-(1500,800) optical crop MAE
was .1551 at 60, .0135 at 67 and .2080 at 71 (8-bit RGB levels); p99 absolute
error was 1 at all three. The same atlas persisted through the crossing and
reverse to 40. Sculpture 128/174 were rechecked; the 512px GPU atlas matched
source hash 2799271365 / mean .010923630587058142. A cold/remounted 174 capture
retained the complete CLARITY title. Intermediate HMR captures are not used as
cold acceptance evidence.

Paired images, geometry/cube-version history and optical metadata are indexed
under `/tmp/gazzar-scene-pass3/evidence.json` and `camera-evidence.json`.

The quiet/motion round trip kept one ready static glasses canvas without a
512px studio, then created a fresh motion renderer/history. Normal forward
scrub, reverse, future-start refresh, restored-frame scalar fixtures and cleanup
are covered by the focused tests. The pass-3 **root flow observation** was:
hard reload from y5263 restarted source entry at 0 while local restored score40.
Those were unlike boot histories and were not graded as matching camera images.
The parent subsequently fixed ordinary reload entry reset; independent R6
repeated it successfully in frozen production d8509fc. This scene pass does not
change root navigation.

## R6-01 bounds and child-readiness correction

R6 established a separate visible failure: completed score 40 → ordinary reload →
trusted QUIET → score 40 gave source broad reflections while production d8509fc kept
the sharp field (primary crop MAE 5.4907, p99=30). No reviewer size change occurred
inside that source document. Material constants were not the remaining cause.

The cached public Drei Environment has a layout effect depending on its
`children` array. Source rebuilds that array when its scene component renders.
R3F's canvas measurement compares x/y/top/bottom/left/right/width/height, listens
to scroll with a 50ms debounce, and propagates top/left into its store. The first
pin changes canvas bounds from (0,1009,1912,1009) to (0,0,1912,1009). That position
change alone recaptures the private 512px cube then the glasses 256px cube. This was
observed without requesting any additional draws or conversions.

The order relative to the first 512px PMREM conversion determines the field.
Foreground fresh assignment and foreground reload both produced broad fields.
A controlled fresh assignment → trusted QUIET → immediate switch to the other
existing tab for 4s → reactivate and seek score 40 produced the sharp field, including
after entry and sculpture readiness finished. The trace explains both:

| Source history | Entry complete, ms | First 512px conversion, ms | Pin scroll, ms | Glasses recapture, ms | Field hash |
| --- | ---: | ---: | ---: | ---: | ---: |
| Foreground assignment | 17926.3 | 18343.1 | 19528.5 | 19598.9 | 1639153093 |
| Foreground reload from 40 | 12145.4 | 12560.1 | 13348.9 | 13426.0 | 1639153093 |
| Hidden entry tail | 15818.3 | 16316.7 | 15806.0 | 15838.4 | 1985076677 |

Times are document-relative and describe order, not animation-duration targets.
An entirely unprobed foreground assignment also showed broad reflections. These
results reconcile the different observed states without a navigation-type
condition or an unconditional mixed-resolution refresh.

`story-environment-lifecycle.ts` owns the small numeric bounds/order adapter.
It snapshots all eight coordinates explicitly because DOMRect exposes them as
prototype accessors. The renderer keeps the finite glasses warm draw; models,
type and programs may prewarm, while conversion of the 512px studio waits for the
existing `identity-entry-complete` event and one idle callback. Initial
`uiStore.entryPhase` covers late mounts/remounts. A pending bounds measurement is
processed before that child-ready commit; a direct sculpture frame activates
the studio before drawing. Only physical sculpture materials are compiled by
that commit. No hero or journey event changes are required. Static mode omits
the 512px studio. Hidden/menu state defers activation and capture; cleanup removes
the scroll/entry listeners and cancels the 50ms timer/idle callback. The separate
200ms camera-history refresh rule is unchanged.

At actual 1912×1009/DPR1, source/local glasses fields matched exactly: sharp
hash 1985076677 / mean .2260496046918282, broad hash 1639153093 /
mean .1720630727537961. Identical-size resize preserved the sharp state; actual
canvas width 1912→1910→1912 changed it to broad. The 512px field remained exactly
hash 2799271365 / mean .010923630587058142 through 128/174. These remain
driver-specific diagnostic hashes, not cross-GPU guarantees.

Matched foreground reload optical crops (200,180)–(1500,800):

| Score | MAE, 8-bit RGB levels | p99 absolute error |
| --- | ---: | ---: |
| 40 | .4909 | 7 |
| 60 | .3251 | 2 |
| 67 | .0439 | 1 |
| 71 | .0468 | 1 |
| Reverse 40 after 174 | .4061 | 5 |

The settled hidden-entry-tail score 40 crop MAE was .9351/p99=12, with exact sharp atlas
equality. Static mode reached ready with camera [0,.12,9.8], time 0 and one object
canvas; enabling motion created a new ready renderer. This is bounded lifecycle
verification, not acceptance of every text/pointer/entry frame.

**OPEN:** cold dev 3000 captures and a subsequent motion remount omitted the C
in CLARITY at 174. The complete source title was visible. The reload 174 crop
MAE was 3.9769/p99=68, and remount 174 MAE 4.0414/p99=68. This is a real remaining
rendered-text symptom; matching sculpture atlases does not close it, and it is
not dismissed as HMR. R6's frozen production title was complete. Root owns the
fresh production check and R7 control; no SDF/type implementation was changed
in this focused material-lifecycle pass.

Root checked fresh production a315984 at1912×1009/DPR1, y11817/story174.0071:
CLARITY was complete on cold entry and after a quiet→motion remount. The remount
PNG and states are indexed at `/tmp/gazzar-root-production-check/evidence.json`.
Repeated source captures at the same settled score separately omitted C and then
CLA, with partial shell/body text as well. These observations require stable
capture controls in R7; they do not establish a deterministic clone-only text
defect or universal text acceptance. No type implementation was changed.

**Root guard a315984:** after scene commit d4b4fe7, offline review found that an
already-active `activateStudio()` can clear a pending bounds timer before its
lifecycle returns early. Root added the early active guard before that clear,
then ran the full check before rebuilding. The scene child did not edit
implementation after the freeze.

Evidence and original PNG paths are indexed under `/tmp/gazzar-scene-r6/`:
`source-final.json`, `local-final.json`, `final-metrics.json`,
`source-fresh-hidden-entry-tail.json`, `local-hidden-tail-final.json` and
`source-final-controls.json`. Source method wrappers were restored, the research
module cleared by a clean reload, and the temporary local canvas hook removed
from implementation and fresh documents. `release.json` records EN/y0,
1912×1009/DPR1, entry complete, menus closed and audio QUIET. Source5/local11 were
explicitly released to navigation with no pending calls. No later browser calls
belong to this scene pass.

## R7-01 capture, veil history and GPU demand correction

Independent R7 found a distinct branch: hidden entry tail →40 sharp →same-size
resize →actual canvas width1912→1910 plus immediate native174 →restore1912 at174
→reverse40. Production's darker field remained after settling, with MAE3.39/3.63.
The camera at60/67 already matched; lens constants were not changed.

Three separate source behaviors matter here:

1. Source react-use-measure connects ResizeObserver to its scroll-debounced
   callback (`glasses-runtime-formatted.js`,1923), not an immediate capture.
   Our existing50ms full-bounds measure now owns both notifications. This avoids
   recapturing/converting256 on a stale40 pose before the next shared frame.
   A geometry-only change still flushes and invalidates without another scroll
   or clock event; identical bounds remain a capture no-op.
2. The public extension adds a second opticalVeil tween74..82 to0, sine.inOut
   (`11dg_viff64mz.js`,687). The200ms refresh can initialize its FROM from the
   displayed veil0 at40. Reversing below74 restores that FROM; the completed
   66..71 tween does not write again until its own time changes below71.
   `story-optical-history.ts` preserves only this property history, alongside
   the separate camera adapter. The authored sampler, camera and parent scrub
   remain unchanged. Each shared frame is recorded synchronously before GPU
   readiness; new motion/HOME mounts reset the adapter and cancel its refresh
   timer/listener on disposal.
3. Source R3F demand invalidation queues GPU work. `journey-frame` now requests
   our existing Three RAF instead of cancelling it and drawing synchronously
   in the parent callback. CPU/history sampling and the direct >=306 origin
   handoff remain synchronous. Idle/pointer/resize use the same draw owner.
   Finite warm/static draws and hidden/menu/failure gates remain unchanged.

This is not an alternate-native-frame rate limiter. Bounded request/draw traces
show both source and local can queue/draw on consecutive native RAFs; callback
order and ongoing interaction determine which shared frame is consumed. In the
changed local trace the queued scene draw precedes the next parent clock event,
consuming the last available frame. No fixed frame interval, synthetic target
score, parent clock change or forced hidden256 conversion was added. The
scene.environment-forces-hidden-conversion hypothesis was falsified.

Native r180 PMREM consumes the current renderer clear state. A transmission
prepass changes that clear to white/alpha.5. At the very near return pose a
transmissive nose pad can be culled, leaving the dark/alpha0 clear instead; that
state affects unused mixed-resolution scratch texels. Probes identified the
native CubemapToCubeUV target and verified it was exactly
`renderer.properties.get(Lens_L.material).envMap`, not an arbitrary bound
texture. Probes observed natural captures/conversions without requesting any.

| Trace | First return256 score | Camera Z | Clear/alpha | Lens atlas hash |
| --- | ---: | ---: | --- | ---: |
| Earlier coalescing+veil attempt1 |73.5771|1.14839|white/.5|1639153093|
| Earlier coalescing+veil attempt2, **failed** |73.9648|.77013|dark/0|3618864581|
| Changed GPU demand repeat1 |73.4808|1.24230|white/.5|1639153093|
| Changed GPU demand repeat2 |73.3849|1.33596|white/.5|1639153093|
| Source repeat1 |72.67|2.03017|white/.5|1639153093|
| Source repeat2 |73.15|1.56908|white/.5|1639153093|

Both changed local native Lens_L fields match source mean.1720630727537961.
The private512 field remains2799271365/mean.010923630587058142. Exact first-visible
scores differ with scheduling; the evidence does not certify an identical RAF
phase or immunity to every performance history. Earlier failed attempts are
retained; the veil correction alone was insufficient.

Actual1912×1009/DPR1 dev3000 crops (200,180)–(1500,800),8-bit RGB:

| Controlled image | MAE | p99 |
| --- | ---: | ---: |
| Exact-trigger repeat1 return40 |.5383|9|
| Exact-trigger repeat2 return40 |.5231|11|
| Continuing60 /67 |.3144 /.0144|3 /1|
| Foreground fresh /completed40 reload |.3150 /.2520|7 /5|
| Hidden-entry sharp /geometry-only2px broad |.6066 /.5584|13 /13|
| Neutral complete CLARITY remount174 |.0784|1|
| Neutral128 repeated pointer control |.1153|1|

The first source40/60 captureVisibleTab PNGs had stale1036px image height despite
the measured1009px DOM. They are preserved and excluded. Matching1009px CDP
captures are graded; repeat1's usable source40 capture is a later reverse40 in
the same mount/atlas after60/67, explicitly indexed. Repeat2 has the direct
exact-trigger return capture. Initial sculpture captures had unlike residual
pointer or partial source caption glyphs; actual200,150→0,0 input after the
object is visible and2.5s settling gives the neutral128/174 controls above.
Those earlier images also remain in the evidence index.

### Separate reading-mode boundary remains open

Motion40→Reduce motion was checked separately, without changing its implementation.
Both documents retain nativeY5263,1912×1009/DPR1, and document height12446. The
actual `#top.stage` has client dimensions1912×11437, rect top−4254 and height
11436.828125. Source's main score owner becomes time0/opening0/progress0 and its
canvas draws0. Local parent stage attributes retain40.0008/26/.08919 while its
new static canvas draws0 at camera[0,.12,9.8],envVersion2. The settled static
object has one canvas and zero draws during500ms, which is a readiness/demand
check, **not static pixel acceptance**.

At subsequent nativeY1009, source has a fitted headline/PERSPECTIVE00 and broad
static lens field; local has a clipped larger headline/LOOKCLOSER09 and sharp
field. Source may retain the motion renderer/cache whereas local mounts a new
glasses-only renderer. Direct fresh-reading startup was not tested in this pass;
it must not be conflated with this retained-history transition. Parent owns the
opening/chrome correction; static renderer/cache behavior is a separate focused
task. No parent journey, shell, navigation or root files changed here.

Canonical evidence: `/tmp/gazzar-scene-r7/demand-evidence.json`,
`demand-metrics.json`, `demand-{source-,}trace-{1,2}.json`, and
`reading-transition.json`. The latter includes exact fields, all8canvas bounds
and original static PNG paths; copied images are under `screenshots/`.
Scoped lint/plain TypeScript and9 focused tests/446 assertions pass. Root owns
production build and independent R8 acceptance; R7-01 is a measured dev correction,
not a declaration of full HOME or reading-mode parity.

The original source5/local11 pair was explicitly RELEASED after fresh assignment
and QUIET entry atEN/y0,1912×1009/DPR1, motion enabled, menus closed and audio off.
All method wrappers/listeners/RAF probes were restored; fresh documents clear the
research module cache. Probe globals/width overrides/iframes are absent. Local
heroPhase/root heroBoot are complete, entry buttons hidden and scroll lock empty.
`/tmp/gazzar-scene-r7/release.json` records the final state. No later scene browser
calls are authorized without a new slot; root owns subsequent changes/review.

## Verification and remaining scope

Verified on 2026-10-27 using the explicitly loaned Vaelix pair. Earlier pass-2
checks used 1400x950/DPR1; R4/R6 lifecycle measurements above used 1912x1009/DPR1.

- Original asset SHA-256 values match the independent home audit.
- Scoped ESLint, `tsc --noEmit --incremental false`, and
  `bun test tests/story-scene.test.ts` pass (9 tests, 446 assertions). The
  parent also reports its full check after the active guard:84 tests/3172 assertions.
  Full build/typegen and production SSR auditing remain parent-owned, as requested.
- Compared 205,800 route/sample values against the actual public source at
  aspects .42/.88/1.47/1.85, both directions, all three pieces and score steps
  of .25 through 306. Maximum numeric difference: 4.44e-16.
- Compared original/local object compositions at scores 40, 128 and 174, and
  checked live Arabic score 128. Native parent DOM differences were kept out of
  the isolated object comparison. No pixel-identical acceptance is claimed.
- Fresh EN and AR boot flags reach ready before entry selection. After QUIET
  entry and a large seek, object visual time advances with the parent score.
  Warm-up and the sticky zero-intersection bug are fixed.
- Reduced reading renders the original initial sunglasses frame. A settled
  500ms WebGL draw-call probe returned zero draws. Forced object context loss
  set the persistent failure flag, unmounted the object canvas, exposed the
  poster and reading copy, and left all four project links visible/non-inert.
- Pass 2 uses the source SDF renderer and studio fonts for mobile EN/AR Ideas,
  with glyph-bound collision fitting. At 1400x950/DPR1, the parent's settled
  score-312 production comparison found the connector and symbol path strings
  exactly equal to source, including connector start
  `M-514.0270289711106 673.2825533253982`. No external requests were observed.
- The pure cold-origin helper matches six live source fixtures below, within
  1e-14 normalized coordinates / 1e-12 CSS pixels radius. Direct large-seek and
  forward arrival use the same origin without waiting for font/GPU boot.
- Trusted native mouse drag/release reached grabbing/capture and settled pull
  zero at 392x932 EN/AR and 844x390 landscape. A synthetic touch pointercancel
  during an active native capture released it and restored rest. This does not
  claim a physical touchscreen test.
- Live menu test: material time advanced .3413 seconds while visible, advanced
  zero during 350ms of settled menu-open state, and resumed after closing.
  Shell also observed pressureScale 1 / footerInfluence .75 with nonzero waves.
- The shell/root reports the R1 hero-overlap issue fixed and cold-retested.

Live source fixture values (stage sizes, not necessarily viewport sizes):

| Stage | Locale | x | y | radius, CSS px |
| --- | --- | --- | --- | --- |
| 392x932 | EN | .8660067435143097 | .5672122502866337 | 2.90611074648129 |
| 392x932 | AR | .06853613482513327 | .6120552072123379 | 2.318878042143656 |
| 1400x950 | EN | .857892366197614 | .7087184771846298 | 10.390371267587605 |
| 1400x950 | AR | .16527129364224508 | .7474329737969402 | 7.3850153353333 |
| 844x600 | EN | .8749433619431227 | .7087184771846298 | 6.562339747950105 |
| 844x600 | AR | .149323879595268 | .7474329737969402 | 4.664220211789373 |

R6-01 and complete CLARITY cold/remount controls independently pass in R7.
The additional R7-01 correction above still needs root production/R8 acceptance.
Reading opening/chrome and retained static environment remain explicit open
boundaries. Physical
coarse-touch hardware, other GPU/browser combinations
and a comprehensive DPR/breakpoint screenshot sweep remain unverified coverage.
The previous raster-text, missing idle drift, missing shell-pressure bridge and
settled/cold work-origin differences are closed, rather than deferred.

Reference bundles remain research-only under `/tmp/gazzar-scene-reference/` and
the independent `/tmp/gazzar-home-audit-r1/`. None are shipped as application JS.
