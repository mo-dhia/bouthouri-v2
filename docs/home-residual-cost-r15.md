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
