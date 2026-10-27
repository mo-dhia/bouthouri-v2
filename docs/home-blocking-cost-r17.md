# HOME blocking-cost research — R17

2026-10-27. Narrow cost research against frozen **application 1ebf932**, actually
served production build **oi3pQ7VnQr5QQgH7A98dl** on localhost:3000, and public
Gazzar HOME. The parent's MENU correction was unserved and is **not evaluated**.
No application edit, check, test, lint, typegen, build, package command, server or
process action, stage, commit, recording, encoding or child delegation occurred.
Only this report and `/tmp/gazzar-blocking-r17/` were written.

**Main finding: the repeated 217–223ms footer timer receipt delay is not a
217–223ms main-thread block.** Natural observation RAF callbacks continue every
16–18ms throughout that delay. Remaining shorter movement gaps are real callback
scheduling observations, but this round does **not** attribute them to a causal
layout, JS, GPU, GC or compositor owner. No owner fix is justified by R17 alone.

## Protocol and actual coverage

The first assigned-window inventory returned only original source37/local36.
A fresh source snapshot verified EN, motion control, closed MENU and two
**Enable sound** controls. Source was focused/visible at native/story/world0,
entry complete/app ready/fonts loaded. Local retained the R16 document at0 with
scene, environment and boot ready; its real flight payload contained the build
above. It was hidden until selected for each local run. Every accepted probe
then stayed focused and visible, with no lifecycle transition or new resource.
Actual viewport remained **2544×1392CSS /DPR1**, outer2654×1502 at(−47,−5).
No OS focus command, native input, emulation, new window, tab, iframe, profile or
context was used. The assigned OS XID was supplied as0x5400a09; no independent OS
focus/XID inspection was performed.

Four sequential source/local pairs used small immutable subsequences of the
R16 native plan: optical original+7.8–10.6s (**70 inputs**) and footer
original+29.7–47.1s (**450 inputs**, both two-second stops and reversals).
Inputs retained the original dy/timing, rebased with500ms lead and500ms tail.
Each page was positioned at R16's recorded nativeBefore, then allowed at least
two seconds to settle: optical551.8333129882812, footer33385.33203125.
All before/after native positions matched exactly in each pair. This preserves
the input subsequences, **not** the omitted full-route excitation history.
No fresh full-route benchmark was run. EN-wide was the only cost-probe scope.

Geometry pairs ran source→local; subsequent callback pairs reversed to
local→source. Footer preceded optical. Both documents retained their original
R16 release timeOrigins: source1793126360410/local1793126361054. Raw metadata
records this history rather than claiming controlled cold documents.

## GPU timer queries unavailable

On each site's existing background and object WebGL2 contexts,
`getSupportedExtensions()` exposed no timer/disjoint extension and
`getExtension('EXT_disjoint_timer_query_webgl2')` returned null. None was lost.
No query was created and there was no polling loop, finish, readback, forced
renderer call, shader/uniform/clock write, source performance-mode activation or
quality change. GPU execution time therefore remains unknown.

Initial canvas inventory also accessed the already-existing portrait WebGL2
context and attempted webgl2 on the already-existing 2D footer canvas, returning
null. No context was created. Timer-extension inspection itself was restricted
to the existing background/object contexts.

## Footer timer delay is not blocking time

In the geometry-instrumented footer pair, original+45.6s maps to requested
slice+16.400s. Source receives it at+16.400s; local at**+16.617s**,217ms late.
The local RAF observer runs **13 times during the overdue interval**, with
maximum gap18ms, still focused/visible at native39833/story691.9024. The callback
probe repeats local receipt at**+16.623s**,223ms late, with**14** observation RAF
callbacks and maximum gap18ms during the overdue interval. Source receives that
input at+16.399s in the second pair; submillisecond deadline rounding is retained.

The first footer stop's reverse input is112ms late in the local geometry run,
again with seven intervening RAF callbacks and maximum gap18ms; it is on time
in the callback run. Local dispatch plus native scroll/native-y read at the
217/223ms delayed input measures0ms at the available clock precision. The long
receipt delay precedes input processing. Timer functions remained native.

These observations exclude a continuous217/223ms main-thread block across that
interval. They do **not** identify why Firefox delivered that timer late, prove
equivalent physical wheel/APZ input, or establish physical input latency. This
qualifies R16's strongest timer receipt; it does not erase R16's separate
movement callback-gap finding.

## Native geometry calls do not identify a slow owner

Only Element and Range `getBoundingClientRect` were delegated in these pairs.
Original descriptors, arguments, results and thrown errors were preserved.
Per-node aggregates and one initial owner stack were collected; native calls
of2ms or more would retain a slow receipt. **There were none.**

| Span | Source calls /total native wall /max | Local calls /total native wall /max |
| --- | --- | --- |
| Footer18.4s slice | 448 /6ms /1ms | 1,263 /5ms /1ms |
| Optical3.8s slice | 16 /0ms /0ms | 220 /14ms /1ms |

Footer local owners include glasses-chapter688 calls, footer mask269 and word267;
their native totals are2/1/1ms respectively. Source mask has380 calls,6ms total.
Optical local image reads48/10ms total and chapter145/4ms total are the main
measured contributors. Counts alone do not establish a costly flush. Source's
cached geometry path is visible in its lower read count, but native geometry
elapsed time does not support naming the remaining reads as the stutter cause.
This probe does not cover getComputedStyle, offset dimensions, SVG parsing,
inert/style writes, layout performed elsewhere, or paint/composition.

The clock measured **1ms granularity**. Zero means below that resolution for an
individual call, not free; sums of quantized short calls are coarse observations.

## Captured natural RAF callback costs

A separate pair wrapped future native RAF registrations, preserving callback
arguments/receiver, results/errors and returned IDs. Callback identity and one
scheduling stack were retained. Own observation RAF bypassed the wrapper.

Local footer's **tC** maps through the served chunk to
`src/components/layout/footer/footer-material.ts`'s `tick`: **284 callbacks,
730ms cumulative CPU wall, max7ms**. Local journey **eQ** maps to the journey
frame publication/render path:424 callbacks,447ms cumulative, max7ms. Remaining
captured local owners max2ms. Source footer **_** is the material loop in
`1lbueqoir1wno.js`:918 callbacks,975ms cumulative, max7ms. Source R3F **eK** is
max2ms in this footer run. Different activity/early-return coverage makes the
footer averages unsuitable for an equivalent-work cost comparison.

Local optical scene **eW** maps to the natural scene render scheduled from
`story-scene.animate.ts`:172 callbacks,208ms cumulative, max4ms. Local journey
eQ167 callbacks/78ms/max2ms; background tb120/34ms/max2ms. Source R3F eK191
callbacks/217ms/max4ms. Source can combine render roots under this owner, and
its cached GSAP RAF may escape the hook. **No source/local total-app-CPU or
complete-owner-coverage claim follows.** Timers, event callbacks, microtasks,
browser layout/paint work and deferred GPU execution remain outside these totals.

Short callback gaps continue, but fluctuate under instrumentation: footer
geometry source5/local11 gaps>25ms; footer callback source0/local4; optical
geometry5/12; optical callback12/13. These tiny instrumented slices are cost
probes, **not replacements for R16's unrecorded full-history cadence pairs**.
No measured callback exceeds7ms footer or4ms optical; that does not account for
all browser work in a frame or prove a GPU bottleneck. RAF gaps are not presented
FPS, and CPU wall elapsed is not GPU duration.

## Supported next step; no speculative fix

Do not change assets, DPR, fields, filters, geometry, easing, clocks or cadence
from this result. Do not land a rect-cache or footer allocation change as a
causally demonstrated R17 fix. The remaining unknown is the owner of the shorter
optical/footer frame scheduling tail, and separately the overdue timer policy.

The next useful method is a bounded **native Firefox performance profile** of
these same spans, with JS stacks plus layout, paint, graphics/WebRender and GC
markers, preserving focus and explicit stop/restart times. Available Vawzen
tools expose no native profiler/trace operation, and GPU timer queries are absent.
That profile should first distinguish main-thread work, render/compositor/GPU
wait and timer scheduling before selecting an owner change. No application
profiling hook or new build was introduced or selected in this loan.

## Evidence and explicit release

`/tmp/gazzar-blocking-r17/` contains eight raw probe JSONs, three small shared
plans (reverse-optical plan prepared but **not run**), `cost.function.js`,
`analysis.json`, `schema.json`, compact initial receipts, hook checks and release.
Raw slow-call receipts retain timestamps, duration, owner, native y and published
story. Schema explains array columns. No native SVG/inert/Canvas wrapper was
installed in this round; no conclusion about their individual cost is asserted.

**EXPLICIT VAWZEN RELEASE: 2026-10-27 18:58:56 UTC.** Only original tabs37/36
remain, plain EN, native/world/story0, entry complete, fonts loaded, motion on,
menus closed, wide2544×1392/DPR1. Source37 is selected/focused/visible; local36
is background/hidden and unfocused. Local scene/environment/boot remain ready,
and its flight build still matches the frozen candidate. Documents were returned
to0 without reload. Local final sound controls are Enable sound/pressed=false;
source sound was verified off by the first fresh snapshot and never toggled.
The final source narrow sound-selector check matched no nodes, so it is not
presented as a second fresh source audio-state measurement.

Every installed descriptor restored **by identity**; probe timers/listeners and
own RAFs were cancelled, globals deleted, and pending wrapped page callbacks
were allowed to drain over two native RAFs while focused. Final RAF/cancel,
Element/Range geometry and timer functions are native, with no review globals.
No GL/Canvas drawing method was wrapped or field/context lost. No browser call
follows the final release inventory. Subsequent analysis and report writing are
offline. This research neither accepts whole-page parity nor re-evaluates MENU.
