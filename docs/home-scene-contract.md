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
source transparent-transmission clear state during compilation. Both raw cubes
recapture only when measured stage width or height actually changes. No-op
measurements, idle rendering and scroll frames do not recapture them.

Studio cards, raw cube targets and their texture maps are owned per mount and
explicitly disposed. Model cleanup excludes those externally owned environment
textures. The renderer owns its derived CubeUV targets/scratch; renderer
disposal and the existing context release retire that whole isolated cache.
There are no node_modules changes or hidden recapture loops.

Measured using only the loaned main-window source5/local11 at **1912x1009/DPR1**:

| Geometry history | Source/local red Float32-bit FNV-1a | Source/local mean red |
| --- | --- | --- |
| Cold HOME, before geometry change | 1985076677 / 1985076677 | .2260496046918282 / .2260496046918282 |
| Same-size window resize | unchanged | unchanged |
| Canvas width 1912→1910→1912 | 1639153093 / 1639153093 | .1720630727537961 / .1720630727537961 |
| Canvas height 1009→1007→1009 | 1639153093 / 1639153093 | .1720630727537961 / .1720630727537961 |

Those hashes describe the GPU atlas on this driver, including unused texels;
they are diagnostic fixtures, not cross-GPU pixel guarantees. Source raw/cached
versions were 6/6 cold, 10/10 after width, 12/12 after height; own versions were
2/2, 4/4 and 6/6. Source performs extra equivalent captures during React layout;
the resulting fields match. Both cold sharp-card and refreshed broad-charcoal
states were checked, rather than forcing the latter at every boot.

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
are covered by the focused tests. A separate **OPEN root flow check** remains:
hard reload from y5263 restarted source entry at 0 while local restored score40.
Those were unlike boot histories and were not graded as matching camera images.
The next independent review must control URL/session/entry completion to assess
that route/restore behavior; this scene pass does not change root navigation.

## Verification and remaining scope

Verified on 2026-10-27 using owned Vaelix tabs, at 1400x950 CSS pixels / DPR 1:

- Original asset SHA-256 values match the independent home audit.
- Scoped ESLint, `tsc --noEmit --incremental false`, and
  `bun test tests/story-scene.test.ts` pass (7 tests, 413 assertions). Full
  build/typegen and production SSR auditing remain parent-owned, as requested.
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

No known open scene defect remains from the focused pass-2 cases and R4-01
material/camera checks above. This is
not full-home pixel-parity acceptance: the parent still owns the fresh production
visual adversary. Physical coarse-touch hardware, other GPU/browser combinations
and a comprehensive DPR/breakpoint screenshot sweep remain unverified coverage.
The previous raster-text, missing idle drift, missing shell-pressure bridge and
settled/cold work-origin differences are closed, rather than deferred.

Reference bundles remain research-only under `/tmp/gazzar-scene-reference/` and
the independent `/tmp/gazzar-home-audit-r1/`. None are shipped as application JS.
