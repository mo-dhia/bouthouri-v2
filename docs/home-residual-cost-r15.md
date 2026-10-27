# HOME residual submission investigation — R15

2026-10-27. Bounded SOURCE/LOCAL investigation of the remaining R14 P2 on the
**frozen served 5b921d7 application**, using only the granted Vawzen pair
source37 / local36. **Whole-route EN/AR smoothness and full parity remain open.**
No application change, check, typegen, build, package command, server/process
operation, test, recording, screenshot, commit or staging was performed. Only
this new document and `/tmp/gazzar-residual-r15/` were written.

## Result: the background double-submission is real

Local submitted **two background default-framebuffer draws in 444 document
timeline bins**. Source submitted at most one in every observed bin. These are
actual delegated native WebGL calls on
`canvas[data-surface='stateful-sculptural']`, not inferred renderer requests,
canvas conversions, RAF registration counts, presented frames or GPU timings.

| Span | Source default draws / bins | Local default draws / bins | Source / local bins with two default draws |
| --- | ---: | ---: | ---: |
| Optical forward, moving 1,500ms | 76 / 76 | 128 / 65 | 0 / **63** |
| Optical reverse, moving 1,300ms | 61 / 61 | 102 / 51 | 0 / **51** |
| Footer forward/reversal, 4,000ms including 2s stop | 236 / 236 | 317 / 220 | 0 / **97** |
| Footer reverse/reversal, 4,000ms including 2s stop | 230 / 230 | 329 / 232 | 0 / **97** |
| Entire bounded 24.8s protocol, including setup/settling | 1,380 / 1,380 | 1,802 / 1,358 | 0 / **444** |

The local total consists of 914 bins with one default draw and 444 with two.
Offscreen field-target calls are counted separately: source2,928 / local2,941
over the whole protocol. The default submission difference must not be
misreported as that many extra full field simulations.

A representative local bin proves the ordering suspected in R13/R14:

```text
document.timeline.currentTime = native observer RAF stamp = 884070.4ms
native y = 4321.33349609375 throughout

callback wall884077ms: default draw, story4.3271
callback wall884079ms: default draw, story5.9852
callback wall884079ms: journey-frame listener receipt, story5.9852
```

The observer received the same native RAF stamp before those calls. Other
examples show the same old-pose/new-pose ordering, with field passes explicitly
distinguished from the final default draw. Wall times have approximately1ms
resolution. The local public `journey-frame` listener was registered after the
application's listeners, so its receipt follows the synchronous background
submission; there is no equivalent source event count implied.

This matches frozen `5b921d7`'s `story-environment.animate.ts:153–161`: the background's already
scheduled settling callback can draw before journey's callback; the journey
event then cancels only a future callback and synchronously calls
`render(performance.now())`. Cancellation cannot undo the earlier submission.
The actual method rows establish extra submission work. They do **not** prove
how much of R14's scheduling tail comes from WebGL, GPU work, layout, or another
owner, nor that both submitted images reached presentation.

**Smallest supported correction to test:** coalesce the background's demand
and journey update paths into one final submission per refresh while retaining
the latest authored pose, simulation timing, and original idle/tail policy.
A guard that merely discards the second draw after an old pose was already
submitted could retain stale visual state; validate forward/reverse phase and
stops with the correction. No DPR, detail, filtering, easing, assets, field
resolution, quality, or forced drawing change is supported by this evidence.
Do not merge unrelated hero/object clocks or introduce GSAP.

## Footer: source uses Canvas during partial reveal too

The source material renderer is the cached public
`/tmp/gazzar-runtime/1lbueqoir1wno.js:1032–1579`, separate from the footer DOM
component in `2gz902oulp4x8.js`.

- Lines1205–1210 update the cached mask top only when native scroll or stored
  top changes. It does not read both live word and mask bounds twice per tick.
- Its surface update has a signature guard at628–684. Path2D masks update only
  when that surface version changes at1381–1382.
- The paint key at1421–1432 contains surface version, left/top, reveal, thought,
  concept, mode, pull state and rounded hover. Clear/fill occurs only when the
  key changes. Position/reveal changes can repaint existing Path2D objects
  without regenerating contours.

Actual Canvas2D `fill` and `clearRect` counts, filtered by the existing footer
canvas, confirm partial-reveal painting on both sites:

| Span | Source clear / fill calls | Local clear / fill calls |
| --- | ---: | ---: |
| First footer 1s movement | 59 / 354 | 50 / 300 |
| Its 2s internal stop | **0 / 0** | 2 / 12 |
| Its 1s reversal | 56 / 336 | 44 / 264 |
| Following 1s stop | 0 / 0 | 2 / 12 |
| Second footer 1s movement | 55 / 330 | 41 / 240 |
| Its 2s internal stop | **0 / 0** | **0 / 0** |
| Its 1s reversal | 54 / 324 | 35 / 210 |
| Following 1s stop | 0 / 0 | 1 / 6 |

Source's first footer preparation paints once (1 clear /6 fills), then retains
that canvas during the stationary partial pose. Local does the same during
that preparation. Local has a few additional boundary/settling paints in the
first stop sequence, but **fewer paint calls during movement**. There is no
evidence here for a blanket local repaint-count excess or a runaway at rest.
The partial word is not eligible for the fully revealed idle deformation:
local mode stays `word`, idle kind-1, amount0, wave energy0, held/grabbable false;
neither page reports a hovered DOM element. Source's inspected eligibility
requires reveal>.98. No glyph, idle-event or deformation retuning follows.

At the native40201 partial pose, source reports story700.00, word transform
69.8589%, material`ready`, blank inline visibility and computed visibility
`visible`. Its live CSS rule
`.portfolio-content .footer-word-text[data-material="ready"]` sets transparent
text color. Its canvas remains visible. Local reports story700.0019, transform
69.8573%, hidden DOM word and visible canvas. Thus retaining DOM text layout
does not mean source uses visible DOM ink instead of Canvas for this partial
state. Inline states and changes are preserved in the raw evidence.

Frozen `5b921d7`'s `footer-material.ts:252–288,394–411,515–518` rebuilds contours and
Path2D objects whenever `draw()` runs, and reads live word/mask bounds in both
tick and draw. These are concrete inspected policy differences from source's
cache. These references describe the immutable served commit; concurrent
unserved checkout edits are outside this review. This round did **not** wrap all geometry APIs, count those reads live,
or obtain forced-layout/GC milliseconds. Equivalent contour mathematics must
not be called the regression; caching and invalidation are the relevant
remaining question after the proven background duplication is addressed.

The bounded native Canvas call durations for the two four-second footer spans
sum to approximately271/171ms source and261/172ms local, respectively, with
approximately1ms clock granularity. These include only time inside delegated
native paint methods, exclude contour/Path2D construction and tick CPU, and
do not measure GPU completion. They do not establish a footer causal cost
difference. No native JS/style/layout/presentation profiler is exposed by the
available Vawzen tools; no causal GPU/layout milliseconds were invented.

## Protocol and limits

Read `home-continuous-review-r14.md` and `home-smoothness-audit-r13.md` first.
The served preview was left immutable. Existing cached documents and prior
GPU history were retained; this is not a cold-cache or first-boot experiment.
No locale/mode/menu/audio change, context loss, new tab/window/iframe/profile,
emulation, native input, source clock manipulation, source asset mutation,
storage operation or renderer invocation was performed.

Both sequential runs were actually focused and visible, with no lifecycle
transition. Both were EN, entry complete, fonts loaded, motion enabled, menu
closed, audio muted/quiet, 2544×1392 CSS/DPR1. There were no new resource
entries during either run. No capture, encoding, build or test ran alongside
measurement. Hover was neutral. Ready state and inline styles were read from
cached nodes; no per-frame computed style or geometry polling was added.

The 24.8-second plan extracts native positions from R14's source input receipts
for original8.3–9.8s,70.0–71.3s,32.5–36.5s and42.6–46.6s. Each interval has a
2s preparation at its recorded starting native y and a1s trailing stop; the
protocol ends with native0 and a2s stop. Every one of **315 requested/actual
post-input native positions matched exactly between source and local**, with
no clamping mismatch. Absolute instant `scrollTo` targets provide real native
scroll events, **not physical wheel/trackpad/APZ latency evidence**. This bounded
history intentionally differs from R14's uninterrupted86.1s traversal.

Input timers were independent of the observation RAF, without catch-up loops.
Requested-versus-delivered timer lateness p95/max was4/28ms source and12/44ms
local, rounded to1ms. This is not equal delivered-time or presented-FPS proof.

One native, unwrapped RAF observer per document recorded callback wall time,
native RAF stamp, `document.timeline.currentTime`, native y and cached story.
Draws were binned by the document timeline value, which matched native RAF
stamps in the illustrated bins. This avoids attributing calls to a previous
observer frame merely because that observer ran later in the callback order.
A timeline bin is a refresh-cycle observation, not a compositor presentation
receipt; timer work between refresh updates can share a bin.

The existing background Three surface's already-created WebGL2 context was
requested only as`webgl2`; no alternative context type or new canvas/context
was created. One initial read of draw-framebuffer binding seeded state. The
native `bindFramebuffer` delegate tracked subsequent DRAW/FRAMEBUFFER changes;
four native draw methods distinguished default target from field targets.
Five Canvas2D native paint methods were filtered to the footer canvas only.
Original calls, arguments, return values, exceptions and descriptors were
preserved. Restoration closures were registered before descriptor changes.
Main-world evaluation was explicitly requested and succeeded without CSP
fallback; hooks intercepted natural application calls in that page world.
No `G.render`, forced invalidation, shader alteration or conversion was used.

The wrappers, numeric method rows and observer add work. Their native method
durations are coarse CPU call observations, not application-owner or GPU cost.
This protocol proves a submission-policy mismatch and supplies a focused fix
target; it is not a replacement broad benchmark or an R14 acceptance run.

## Evidence and browser release

`/tmp/gazzar-residual-r15/` contains `submissions.function.js`, `plan.json`,
`source.json`, `local.json`, `analysis.json` and `release.json`. Raw rows retain
all native method calls, timeline/RAF/wall timestamps, frame/input receipts,
inline state changes, resource/lifecycle checks and exact descriptor
restoration receipts. Export occurred after the probes had stopped and
restored their descriptors. Both review globals were then disposed.

**EXPLICIT VAWZEN RELEASE: 2026-10-27T17:36:47.065Z.** All calls/probes,
observer RAFs, input timers, listeners and globals from this investigation are
finished/removed. All ten native descriptors were restored to their original
identities; final checks also show native method bodies and unwrapped RAF.
No context was lost or mutated. Both original tabs are plain EN/y0, world0,
story0, entry complete, motion on, audio muted/quiet, menus closed, loaded
fonts, 2544×1392 CSS/DPR1. Source37 is active; no extra surface exists. Browser
ownership is returned to the parent. No further browser call follows release.

## Continuation: actual shader phase on frozen 1fa0242

2026-10-27, second explicitly granted browser loan. The parent reports the
journey DOM cache, footer rest cache and background demand-RAF change integrated
in **1fa0242**, documentation HEAD682c98b, build
**DMkSpaWORysMgQzHYeuaQ**. Its reported185 tests /5,317 assertions, lint/type
check, build and SSR pass are parent validation, not this research's acceptance.
No application edit, build/restart, test, check, package/process operation,
recording, screenshot, renderer invocation or commit was performed here.
Only this appendix and `/tmp/gazzar-residual-r15-phase/` were written.

**The duplicate submission fix passes this bounded control, but a genuine
source/local background phase mismatch remains.** This conclusion uses actual
uploaded `uStage` at the native default-framebuffer draw, not merely callback
order or the DOM score seen by an observer. Full HOME EN/AR moving parity and
the user's whole-page smoothness concern remain open.

### Document identity was corrected before accepting local results

The first short local probe reproduced the old double-draw behavior. Its tab
was still the document born at **17:19:29.801Z**, predating the candidate. Those
rows are saved as `excluded-stale-local-phase.json`, explicitly excluded; the
initial metadata's configured candidate/build labels were unverified assumptions
and are not evidence that the stale document ran1fa0242.

Existing local36 was force-loaded at **17:50:20.039Z**, keeping the same tab and
viewport. Its real Next flight payload contains
`DMkSpaWORysMgQzHYeuaQ`; the disk BUILD_ID agrees. After real ready QUIET
activation, the accepted local run starts at native0/world0, entry complete,
loaded fonts and ready scene/environment/boot. No server operation occurred.
The source remains the existing cached document. This is a phase/control
comparison with different document/GPU histories, not a cold or cadence pair.

### Source ownership contract: current published story, one final draw

Cached `11dg_viff64mz.js:615` authors environment as a110-unit `sine.inOut`
tween starting at story84. Cached `1nvdbh89vm0tk.js` assigns that mutable
score's environment to `uStage` in its measured R3F frame subscriber; the
background Canvas uses `frameloop:"demand"`. The expected scalar is:

```js
p = clamp((storyTime - 84) / 110, 0, 1)
expectedStage = (1 - Math.cos(Math.PI * p)) / 2
```

This is also the inspected local authored mapping. The formula was checked
against actual source uniforms; it was not inferred from local appearance.

At every actual final default-target draw, the probe records native
`getUniform(program, cachedUStageLocation)`, cached `uTime`, native y, current
DOM story, document timeline value and callback wall time. Only the existing
background WebGL2 context is used. Program and uniform locations are cached
once per existing/naturally activated program. `useProgram` and
`bindFramebuffer` delegates track the active program and draw target. Field
passes are excluded from the phase rows. There is no compilation, forced
render/invalidation, clock manipulation, context loss, shader or uniform write,
conversion, storage operation, or source asset mutation.

One unwrapped native RAF observer records the matching RAF/timeline stamp.
A narrowly filtered MutationObserver records only the story node's
`data-story-time` publication; the last publication in the same timeline bin
defines its final DOM score. This captures publication later than the draw
without wrapping GSAP, RAF, all DOM operations or app internals. The actual
uniform distinguishes a genuinely older shader pose from an older observer
receipt. Coarse wall-time ties alone are not used to infer ordering.

The13.5s plan uses immutable R14 native positions, including the optical band
and forward/reverse environment movement with stops. Its planned native-y
selection initially used a provisional score-to-y conversion; the measured
forward story range is about100–158 and reverse109–159. The **actual128–159
subset still contains80 forward /84 reverse draws on each site**, satisfying
the requested changing-environment control without extrapolating to200.
Optical0–77 has `uStage=0`, so it controls counting/order but cannot identify
environment phase by itself. All158 corresponding native post-input positions
match exactly. Both accepted runs remain focused and visible throughout.

| Changing environment control | Source draws matching final same-bin story | Local draws matching final same-bin story |
| --- | ---: | ---: |
| Entire1.5s forward window | **90 /90** | **0 /89** |
| Entire1.5s reverse window | **90 /90** | **0 /90** |
| Actual story128–159 forward subset | **80 /80** | **0 /80** |
| Actual story128–159 reverse subset | **84 /84** | **0 /84** |

All80 /84 selected local uniforms instead match the **preceding timeline
bin's last story publication**. All selected source uniforms match the current
bin's final publication and none match its previous bin's publication. This
establishes the source/live ownership contract in these controls: one final
background draw consumes the current story update. It does not support treating
the local background-before-parent ordering as source-equivalent.

For example, in local timeline31829.44, native15211, the draw uploads
`uStage=0.4144599735736847`, representing story132.98018. The draw-time DOM
score is132.9802; that bin subsequently publishes136.4753, whose expected
stage is0.4639786008073706. At timeline31846.52, the actual uploaded stage is
0.46397864818573, representing the preceding136.4753 publication, while that
bin ends at139.2368. Source timeline1783310.70 instead uploads
0.45985400676727295 at draw-time/final DOM136.19, representing136.18562:
the small difference is within source DOM rounding.

Source DOM story is rounded to two decimals; local uses four. Stage tolerances
are therefore0.000075 source and0.000001 local, allowing the authored sine
derivative, GSAP scalar/float32 rounding and DOM quantization. Maximum observed
source forward/reverse residuals against current story are about0.000068 /
0.000067. Local residuals against **draw-time** story are below0.000001, but
against the final story reach0.109909 /0.055516. These are scalar differences,
not causal milliseconds or visual severity estimates.

Stops converge. Source matches current story on60 /60 draws in each1s stop.
Local matches final story on35 /60 forward-stop and34 /60 reverse-stop draws;
the earlier stop frames still carry the preceding publication as the scrub
settles. This is a continuous-update phase defect, not an unbounded divergence.

**Smallest supported correction:** order the single background submission after
the current journey publication, while retaining independent settling/idle
eligibility. The verified1fa0242 demand RAF is commonly queued before the
parent's next tick and consumes the preceding publication. A single shared
final flush or equivalent explicit ordering can implement the observed source
contract. Do not restore the old unconditional synchronous path alongside its
settling RAF: that reintroduces the proven duplicate work. Preserve authored
curves, simulation/history/step timing, tail policy, assets, filtering and
quality. This evidence does not justify merging unrelated clocks or adding
GSAP. The parent's unserved work after this evidence is outside this review.

### Duplicate bins: corrected on the same24.8s native-target protocol

A separate count-only pair reuses the first R15 plan's exact315 native targets
and24.8s duration. It performs **no getUniform reads**. Both sites remain
focused/visible with no new resources. Every corresponding post-input native
position matches exactly.

| Count-only span | Source default draws / bins | Current local default draws / bins |
| --- | ---: | ---: |
| Optical forward1.5s | 81 /81 | 71 /71 |
| Optical reverse1.3s | 64 /64 | 59 /59 |
| Footer forward/reversal4s including stop | 240 /240 | 224 /224 |
| Footer reverse/reversal4s including stop | 239 /239 | 232 /232 |
| Entire24.8s protocol | **1,402 /1,402** | **1,378 /1,378** |

Neither page has a duplicate default draw bin. Local's old444 duplicate bins
are absent. Source2,933 /local2,927 field-target native calls are counted
separately. The accepted short uniform pair also has no duplicate bin
(source799 /local790 draws, one per bin). Count differences between separate
sequential runs are **not presented FPS** or a new cadence acceptance claim.
The footer cache's visual/interaction parity was not re-reviewed in this task.

### Limits, evidence and second explicit release

Native `getUniform` can stall and changes the workload. Its coarse accumulated
read overhead is261ms source /478ms local across the13.5s protocol; these are
probe read costs, not shader/GPU execution times or app cost attribution.
Actual callback delivery and observer counts are preserved in the raw files.
No presented-frame, GPU-completion, native wheel/APZ or native layout-profiler
claim follows. The fresh local document received two scripts at replay+24/25ms
(15/26ms duration, one transfer0); these are not contemporaneous with the
environment control at+6.5s onward. The source received no new resources.
Source starts with no hovered DOM nodes; local's fresh QUIET activation leaves
BODY/MAIN/SECTION hover ancestry at the short run's start, with no held grab.
The count-only pair reports neutral hover on both. Those histories are recorded
and not presented as fully controlled simulation histories or FPS conditions.

`/tmp/gazzar-residual-r15-phase/` contains `phase.function.js`,
`phase-plan.json`, accepted `source-phase.json` /`local-phase.json`,
`phase-analysis.json`, `phase-version-checks.json`, the explicitly excluded
stale-document file, `count-plan.json`, `source-count.json` /`local-count.json`,
`count-analysis.json` and `release.json`. Six delegated native WebGL descriptors
are restored by identity after each probe. Every probe stops before export;
its RAF, input timers, story observer and lifecycle listeners are removed and
its global is disposed. Main-world evaluation succeeded without isolated CSP
fallback. Native call arguments/results/exceptions are delegated unchanged.

**SECOND EXPLICIT VAWZEN RELEASE: 2026-10-27T17:54:01.136Z.** All browser
calls/probes, wrappers, observers, listeners, timers and globals from this loan
are finished/removed. Final descriptor checks show native WebGL/Canvas methods
and unwrapped RAF; no context was lost or changed. Both original tabs are
plain EN/native0, world0/story0, entry complete, motion on, audio muted/quiet,
menus closed, fonts loaded,2544×1392 CSS/DPR1. The current local flight build
receipt is retained. Source37 is active; no extra surface exists. Ownership
returns to the parent; no browser call follows this second release.
