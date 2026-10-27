# HOME smoothness audit — R13, offline

2026-10-27. Read-only inspection of the shared checkout and cached public source.
Required context: [user review](home-smoothness-user-review-r13.md),
[load architecture](load-architecture.md), [ownership](code-splitter.md).
The reported defect concerns the **whole EN/AR HOME experience**. Navigation
departure is one reproduction. R10 fixes and R11/R12 geometry/video comparisons
do not close cadence acceptance; 30fps capture and 4fps sampling cannot do so.

The initial offline pass used no browser calls, app edits, test runs,
check/typegen/build, server/package work, process inspection/control, or commits.
Only this document and a small isolated `/tmp` numerical analysis were written.
The separately authorized live continuation is recorded at the end. The root's
uncommitted reading-portrait work was not reviewed or changed; portrait comments
below concern the ordinary motion branch only. These are profiling priorities,
not a measured diagnosis or an acceptance claim.

## Highest priority: clock start time is a distinct contract

The additional clock hypothesis has **offline source and numerical support**.
Its prevalence in actual Firefox event ordering remains unmeasured.

Local hero input calls `retarget(next, performance.now())` in
`src/sections/landing/1-hero/hero.animate.ts:601`; `tick(now)` passes the RAF
timestamp into `worldClock.sample(now)` at line 548.
`hero-world.ts:86–106` preserves explicit displayed FROM, sets `started` from
event wall time, and clamps later samples with `latestTime = max(latestTime, now)`.
Thus a newly changed target received after a frame's timestamp but before its
callback executes can receive zero advancement in that callback. Repeating that
ordering can hold the displayed hero pose until input pauses. Events a little
before the frame timestamp can still produce much less than a frame of progress.
This is an algorithmic possibility, not evidence that the browser delivered it.

Cached reference `2gz902oulp4x8.js.pretty:504–505` / the more legible
`2gz902oulp4x8.js:4787–4828` uses `.1s / power2.out` and
`w(e.progress, l.progress)`. **Keep that explicit FROM.** In the actual cached
GSAP 3.15.0 core (`/tmp/gazzar-scene-reference/gsap-32919.js`, zero-based text
offsets):

- `quickTo` at 46994 forwards its second argument into `resetTo`'s explicit start.
- `e5` at 34528 selects that explicit value, including zero, for the property FROM.
- `resetTo` at 39799 derives time from `(this._dp._time-this._start)*this._ts`,
  then calls `t$(this,0)` and `render(0)`.
- `t$` aligns `_start` to the smooth parent's `_time`, not event `performance.now()`.
- Ticker `eD` at 13830 samples `Date.now()` inside its callback; it does not use
  the RAF timestamp argument. `updateRoot` at 30828 advances the root from ticker
  time. While the ticker is awake, an intervening event does not itself advance
  the parent. A sleeping ticker's `wake()` is a separate case.

R10's `/tmp/gazzar-continuous-r10/clock-fixtures/quick-to.cjs` manually sets
`parent._time = parent._tTime = ms/1000` **for target events as well as samples**.
It proves explicit FROM `.271` versus implicit `.578125`, but makes parent time
equal event time by construction. It does not prove between-tick start alignment.
`hero-world.test.ts:36–59` checks that golden and the stale-time invariant, not
the running-parent ordering below. Do not replace the explicit hero FROM with
the journey's implicit advance as a response.

Reproducible isolated evidence is in `/tmp/gazzar-smoothness-clock-r13.cjs` and
`/tmp/gazzar-smoothness-clock-r13.json`. This evaluates the actual cached core
with a fake `Date.now`, inert timers, an awake ticker, and explicit tick actions.
No project modules or test runner are loaded. Local columns are direct scalar
translations of the inspected clock formulas; they are not execution of the app.
GSAP property writes round to six decimals. Representative **raw input** values:

```text
Hero: target 1 at 0; tick 10; target .6 at wall 25; tick 40
                         cached GSAP     local formula
after tick 10                .271000          .271000
retarget FROM at wall 25     .271000          .271000
retarget START time ms          10               25
after tick 40                .487153          .397953
target 1 at 53; tick 70      .824093          .655757
after stop, tick 153        1.000000         1.000000

Hero continuous pre-callback events:
target time ms / target: 17/.1, 34/.2, 51/.3, 68/.4
callback wall ms:         18,    35,    52,    69
RAF timestamp ms:         16.667,33.333,50,    66.667
GSAP displayed input:     .044863,.111295,.192101,.281126
local displayed input:    0,      0,      0,      0
stop; wall86 / RAF83.333:  .340230 versus .157229

Hero reversal: tick20 displays .488; target0 at wall37;
wall38 / RAF33.333 displays .269068 versus local .488000.
```

These fixtures demonstrate a contract difference without proving presented FPS,
actual event phase, or a cause of whole-page lag. Other orderings, including a
ScrollTrigger update after the ticker has advanced, need separate live evidence.
The analysis disables lag smoothing to isolate short intervals; all listed
intervals are below GSAP's default 500ms lag threshold. Long stalls/background
resume require their own comparison.

Journey has a **different** sampling path: `journey.animate.ts:283–287` ignores
the RAF argument and calls `clock.sample(performance.now())`. It therefore does
not have the hero's stale-RAF zero-elapsed mechanism. It advances its old value
at event wall time before retargeting (`journey-scrub.ts:35–41`). Cached
ScrollTrigger module 43340 in `2mptg809nyngd.js` instead performs:

```js
j._dp._time-j._start !== j._time && j.render(j._dp._time-j._start);
j.resetTo("totalProgress", x, r._tTime/r._tDur);
```

That advance and new start share GSAP parent time. The fixture emulates those
operations, including explicit FROM after the pre-render. For target1 at0,
tick10, target.6 at wall25, tick40, cached input is `.297035` and local formula
`.359473`; both match `.134134` at tick10. For the four pre-callback events above,
at wall69 cached input is `.175244`, local `.116448`. These are contract probes
of the scrub scalar, **not live HOME story scores**; real HOME snaps at target
story time >=270 (`journey.animate.ts:337`; source `:7822–7830`). Profile the
optical/type portion separately from the later direct work/systems response.

## Hot paths, ranked by what a profile should resolve

1. **Header repeats work throughout HOME; hero publication inserts reads after
   writes.** `header.logic.ts:451–503` reads computed `utilities.top` and a child
   `clientHeight` every application, then writes transforms, visibility, inert,
   ARIA, and datasets without a pose guard. It queries/hides
   `.masthead .chapter-side` every time. Native scroll always invokes
   `onQuietScroll` (`:542–566`), including ordinary motion; changed hero poses
   also invoke `onWorld` synchronously. The native path can replay the previous
   published pose before the new pose is published. This is proven duplicate
   same-owner application, not proof of two independent nav clocks fighting.
   Hero `renderWorld` writes style/display before publishing (`hero.animate.ts:
   419–441`), so the synchronous header geometry reads can require style/layout
   synchronization. A forced layout and its duration still need a trace.
   Reference caches height in its measure function and skips unchanged progress
   (`2gz…js:4557–4563,4627–4649`); it caches its elements once. Header work can
   affect later chapters too, so measuring only navigation exit is insufficient.

2. **Normal portrait reads transformed geometry on every active hero tick.**
   `hero-portrait.ts:647–650` reads `image.getBoundingClientRect()` after the
   hero's transforms and synchronous world listeners; retained pointer protection
   can also reach `hit()`'s bounds read (`:354–364,641`). This runs even when the
   WebGL draw is clean: the dirty check follows the bounds read at line 652.
   Hero marquee keeps its owner active while visible (`hero.animate.ts:551–570`).
   Reference's portrait tick derives view from cached measurement plus supplied
   translation/scale (`2gz…js.pretty:451,475`; full source around `:4340–4395`),
   with pointer hit reads remaining event-dependent. This is a concrete geometry
   policy difference, limited to hero activity; it cannot alone explain the
   whole journey. The frozen reading branch is outside this finding.

3. **Journey frame fan-out does redundant hidden DOM work.**
   `journey.animate.ts:55–106,227–281` re-queries optical/post panels and lines,
   chapter/header, concept steps, progress, cues, and load status every render.
   It writes unchanged text, styles, ARIA and datasets outside their active
   chapters. `--focus-tracking` feeds actual letter spacing
   (`journey.module.css:138,143,227`), and opening blur is a paint/compositing cost
   as well as JS. Those effects belong to the target; establish their cost and
   unchanged-write frequency before changing anything. Reference caches chapter,
   progress and cue strings and writes only changes (`2gz…js:7635–7674`), while
   its authored timeline owns optical property intervals. Our DOM-query and
   unchanged-text policy is a concrete difference; reference effects are not
   presumed free.

4. **Independent draw paths need same-refresh counts.** Hero owns one RAF;
   journey owns another; object Three demand rendering owns another. Background
   `story-environment.animate.ts:153–161` cancels its pending RAF/timer and draws
   synchronously during `journey-frame`, then may schedule its settling RAF.
   Cancellation cannot undo a background callback that already drew earlier in
   the same refresh. Thus two submissions in a refresh are possible depending
   on ordering, not established from source alone. During hero events the same
   background merely wakes; objects coalesce into their own RAF
   (`story-scene.animate.ts:95–96,164–186`). Count draw order and displayed story score per
   refresh before calling different RAF owners an error or merging clocks.

5. **Input and periodic work have whole-route reach.** Entry's non-passive
   capture `wheel` and `touchmove` handlers remain installed until hero teardown
   (`hero.animate.ts:703–710,810–811`); after release their callback returns
   without preventing default. Cached entry lock uses overflow/gutter/inert
   (`2gz…js:3315–3336`), with no matching entry wheel blocker there. Determine
   Firefox input/APZ wait in the native trace; listener presence alone does not
   measure it. `home-navigation.ts:222–249,379` can measure position, serialize
   session storage and call `history.replaceState` about every 160ms while input
   continues, subject to the progress-change guard. Correlate periodic spikes;
   no source-equivalent cost or actual stall has been established. No active
   Lenis initializer call exists under `src`; residual optional calls are not
   evidence of the old extra wheel smoother.

6. **Work/systems have expensive operations, but much is source-equivalent.**
   Work caches nodes/geometry and clamps time 264–470 with equality exit
   (`work-renderer.js:191–240,284–288`), so it is not continuously regenerating
   paths throughout earlier/later chapters. Systems similarly guards400–714
   (`systems-renderer.js:303–307`), precomputes 315 path frames on resize, then
   allocates interpolated typed arrays and SVG `d` strings each changed frame
   (`:83–133`). `systems-geometry.js:386–409` slices/allocates and formats each
   visible cubic segment. Cached source does the same major interpolation,
   segmentation and path writes (`2gz…js:7217–7303,7415–7435`), and work has the
   same clamp guard (`0or6…js:305–309`). Local additionally recomputes the two
   constant work-symbol layouts per systems render (`systems-renderer.js:
   135–150`); source caches those in resize (`2gz…js:7436–7457`). Profile SVG
   parsing/painting and GC before treating inherited allocation as a regression.

7. **Object rendering stops, but its CPU listener continues past time 306.**
   `story-scene.animate.ts:164–184` samples camera/veil histories for every
   journey event, then after 306 calls `typography.update` even though drawing
   stops. `story-type.ts:117–153` updates all groups and forces
   `scene.updateMatrixWorld(true)` to project the origin, with a change guard on
   publication. A changed origin synchronously invalidates work's equality guard
   and can redraw it a second time (`work-renderer.js:503–509`). Actual changing
   origin frequency after 306 is unknown. Source invalidates objects only while
   current or previous time <307 (`2gz…js:7643–7648`). Preserve required restore/
   history semantics; measure wasted tail CPU separately from offscreen GPU work.

8. **Footer and resize/startup costs are concentrated, not universal.** Footer
   lazily boots near time 630 and gates material on visibility/inert
   (`footer.logic.ts:52–93`). Its tick reads word/mask bounds, changes visibility, then
   `draw()` reads bounds again and allocates contour points/Path2D
   (`footer-material.ts:252–288,394–411,515–518`). Footer measurement writes font/line
   height before geometry reads and runs a bounded three-iteration fit
   (`footer-geometry.ts:58–124`); source contains a comparable fit
   (`2gz…js.pretty:175–181`), so it is not automatically a regression. Local
   ResizeObserver measures immediately; source debounces footer resize 90ms
   (`2gz…js.pretty:188`). Work and systems each install resize listeners while
   journey's measure calls both again (`journey.animate.ts:322–347`): work
   always constructs a new pen, which can defeat systems' pen identity guard
   and repeat the 315-frame precompute on resize/fonts-ready. Keep these bursts
   separate from steady scrolling at a fixed viewport.

## Ownership and offscreen checks that constrain the diagnosis

- Engine geometry is cached between measurement invalidations
  (`scrollTrigger.ts:299–313,458–465`). Scroll dispatch iterates registered
  instances and creates closures/percentage arrays, but there is no evidence of
  per-frame offset-parent traversal with valid caches. Both HOME triggers use
  `useRAF:false`; the journey request guard supplies its RAF. Do not infer a
  nested default batch on this path. Boundary skipping intentionally can call
  both endpoints in one scroll (`scrollTrigger.ts:506–544`), so boundary bursts
  need context rather than being counted automatically as competing writers.
- Hero also registers direct native `updateScroll` plus an `identity-world`
  trigger (`hero.animate.ts:702,715–720`). Within the trigger range this can
  retarget twice for one scroll; identical targets exit without restarting the
  clock (`hero-world.ts:98–100`). Magnet input is passive and settling writes
  only after its gesture/target policy; it is not a continuous wheel smoother.
- No unconditional full-page object WebGL loop was found: object activity checks
  visibility/hidden/menu/time<306, and uses demand requests. Shadow rendering
  has visible/pose guards (`story-shadow.ts:32–39`). Background intentionally
  spans HOME, pauses hidden/menu/offpage, simulates until a finite tail, and
  retains 24Hz normal drift/30Hz tail (`story-environment.animate.ts:63–68,
  109–131,178–184`). Cached background is also demand-rendered with 24/30Hz idle
  timers (`1nvdbh89vm0tk.js`, offsets about14726–15015; Canvas around16569).
  Those intentional timer rates must not be reported as whole-site FPS failures.
- Work's last connector is also written during systems takeover and work resize;
  source shares that handoff. Entry and navigation mostly write different nested
  layers. These were not established as independent contradictory per-frame
  owners. Geometry-read ordering, duplicate same-pose calls and draw scheduling
  are better-supported questions than a blanket double-writer claim.
- Artifact's README was read together with real hero/media/how-it-works usage.
  Its hero uses immediate manager dispatch plus one owned RAF batch
  (`artifact/src/components/landing/sections/1-hero/hero.animate.tsx:143–151`);
  media similarly uses `useRAF:false` for an owned scheduler. DOM caches and
  smart setters are useful examples. Other examples add nested batches and do
  layout work; the README's performance percentages are not measurements of
  either HOME. No Artifact reveal effect or generic smoothing is proposed.

## Low-overhead matched Vawzen profile, only after an explicit browser loan

1. Root completes the portrait freeze and its current live review first. Obtain
   its existing **Firefox/Vawzen source/local tab IDs** and running production
   URL; reuse those tabs only, with one capture owner. No new window/tab, Chrome
   substitution, build, benchmark, worker analysis, or other agent capture during
   recording. Record the audited code snapshot and any changes since it.
2. Match EN/AR and both agreed widths from R11/R12; record actual CSS viewport,
   DPR, physical display/refresh, browser version, zoom, motion/quiet/sound/menu
   state, load completion and cache state. Use ordinary motion as the primary
   comparison. Warm both routes with the same one traversal, then run source
   and local sequentially in the foreground. Never compare a background tab
   with a foreground tab. Treat cold first activation as a separate pair.
3. First take one unprofiled forward/reverse run with no video/screenshots or
   console streaming. For the native profile use the same recorded Firefox
   settings on both sides: bounded buffer, initially 2–4ms sampling, main-thread
   JS plus style/layout/paint/input markers, and compositor/renderer/VSync/
   presentation tracks when available. Disable screenshots, allocations,
   network payload capture, debug draw counters and stack capture on every DOM
   operation. Export through Vawzen if supported without opening a profile tab;
   otherwise report that capability gap before changing the tab arrangement.
4. Replay the same trusted input sequence at the same viewport coordinate. Cover
   the complete forward route and reverse route, including optical 74, sculpture/
   type 98/124/168/211/241, work 270/306/345/381/413, takeover~430–445,
   systems 514/604 and footer 630/663/690/714. Use source/local chapter crossings
   to align analysis; identical elapsed time is not necessarily identical score.
   At hero nav exit and representative optical, work, systems and footer
   transitions, include sustained input, a 2s stop, immediate reversal, and small
   continuous input (for example 8–16 CSSpx per delivered wheel step for 1–2s).
   Include a >6s final stop to separate intended background tails from runaway
   work. Record requested and delivered event spacing. Prefer one Vawzen native
   batch if supported; command round trips must not become the input cadence.
   If only manual input is available, record that repeatability limit. A
   `scrollTo` replay is a separate animation experiment, not native wheel proof;
   dispatching synthetic WheelEvents does not establish real default scrolling.
5. Analyze by chapter and direction: input→scroll→clock→style/draw→presentation;
   callback counts per refresh; native scroll displacement; unchanged-pose
   applications; time in header/portrait/optical/SVG/history/Three; long tasks
   and shorter budget overruns; style/layout flush stacks; GC and GPU/compositor
   waits. Check background submissions against journey and object RAF ordering.
   Compare native-wheel latency with the non-passive entry handlers present.
   A quiet-mode comparison can help isolate work, but is a different layout and
   cannot by itself attribute a normal-mode regression to GPU cost.
6. Resolve the clock hypothesis with event and owner timestamps, not a new RAF
   loop. If native tracing cannot expose the needed values, authorize a separate
   bounded diagnostic task recording only in existing input/tick owners to a
   fixed numeric ring buffer: event wall time, RAF timestamp, callback wall time,
   last displayed raw input, target, start time, sampled raw input, chapter and
   a few call counters. For reference add GSAP ticker/root time and resetTo
   start if accessible without changing behavior. Sample a short focused pass;
   export after stopping. No per-frame console, DOM inspection, stack strings,
   geometry polling, monkey-patching every RAF/style operation, or full-profile
   plus heavyweight instrumentation together.
7. Compare instrumented/uninstrumented behavior and repeat once only if overhead
   or input mismatch makes a conclusion uncertain. RAF delta measures callback
   scheduling; update counts measure application work; neither is presented FPS.
   Count presented/dropped frames only from supported native compositor/
   presentation data. If those tracks are unavailable, leave presented FPS
   unknown. A later 30fps video may document geometry/symptoms, not certify smooth
   presentation at the display's refresh rate.

Stop after evidence supports a specific cause and give root the trace interval,
matching source interval, cost/order, confidence and smallest justified next
experiment. No extra smoother, RAF, easing change, optimization patch or parity
acceptance follows from this offline audit.

Snapshot anchors (SHA-256 prefixes): hero-world `6a826f0b3a86`, hero controller
`8348dbcc10de`, header `2c6bde00fd27`, journey scrub `c23698200b0c`, journey
controller `683c246eb05c`. Cached GSAP file SHA-256:
`e1899cd720c6c19111d45a94334434ebb3fd826e1cdb191dda8b312e17b0fef8`.
Cached main readable source `f8f739adaaf7`, `.pretty` `89f51c401d9c`.

## Authorized live continuation — served 31f4beb

The root explicitly loaned Vawzen source tab37 and local tab36 after the portrait
review released them. No app/build/server/package/test changes were made.
The root's unserved fallback-mask edits did not change the frozen production
assets being measured. The earlier mismatched loading/assembling entry capture
was excluded; no data from it is used here.

**All browser calls finished and the pair was explicitly released at
2026-10-27 16:33:00 UTC.** Both pages were restored to plain EN, native x/y0,
world0, motion on, entry complete, audio off, menus closed,2544×1392 CSS/DPR1.
Source37 was selected; all installed probes, listeners, timers, RAF work,
prototype wrappers and globals were removed. Cleanup metadata is saved in
`/tmp/gazzar-r13-prep/release.json`.

Observed conditions and scope:

- Fresh preflight snapshots and DOM checks found source `heroPhase=complete`,
  `appBoot=ready`, world0; local complete/world0 with scene, environment and
  scene-boot ready. Local has no literal `appBoot` attribute; no value was
  invented. Fonts were loaded, menus closed, reading/reduced layout disabled.
- The selected pages were visible, but OS focus remained false throughout every
  captured frame. After the root authorized matched unfocused diagnostics, these
  were collected with that provenance. No foreground acceptance is claimed.
- Vawzen exposed no trusted Firefox wheel injection or native profiler. Input
  was an explicitly untrusted wheel intent followed by instant `scrollBy` when
  unprevented, with actual receipt times and real resulting scroll events logged.
  Physical wheel/APZ latency and presented FPS remain unknown.
- One shared86.1s plan issued2040 inputs through the entire forward/reverse
  route: hero, pre270, work, systems and footer, small continuous pulses,
  two-second stops, reversals and a seven-second final stop. **Native y after
  each of the2040 corresponding inputs matched exactly between source/local.**
  Receipt timing was recorded rather than assumed equal: input lateness p95
  was5ms source/7ms local. Neither prevented any planned input.
- RAF APIs were native and unwrapped. The bounded observer read cached node
  datasets and inline nav styles; it did not query geometry/computed style per
  frame. Its measured cost p95 was0–1ms at the browser's roughly1ms wall-clock
  resolution. This is still an observer workload, not a zero-overhead recording.
- These were preserved R13 sessions, not controlled cold documents. First
  observed traversals and subsequent warm method repeats had no new Resource
  Timing entries or readiness-marker transitions. This supplies no evidence of
  a network arrival; it does not rule out first-use shader/GPU/CPU work without
  a native trace. No cold-loading diagnosis was made.

The most specific response finding is now supported by runtime DOM data:

- For moving-y frames in the visible hero band (`40<y<1800`, world.01–.72),
  world pose held unchanged on238/298 local frames versus9/307 source frames.
- On285 local frames the observed scroll receipt occurred after that frame's
  RAF timestamp;229 of those held their prior world pose. Source had270 such
  frames and8 holds. For example, local capture715ms moved y39.417→47.300
  with scroll receipt0.34ms after the RAF stamp, but world stayed.0119.
  At2316ms y354.750→362.633 while world stayed.1204 near navigation departure.
- This establishes applied-pose stalling during this controlled replay, not
  retinal flicker or presented-frame failure. Its ordering is consistent with
  event-wall-time retargeting plus stale-RAF clamping. Private live GSAP parent/
  resetTo timestamps were not accessible: `window.gsap` was absent. A new GSAP
  instance was not substituted for the actual source runtime.

Actual current project helpers were also executed, rather than only a copied
scalar formula: installed TypeScript transpiled the pure helper modules in
memory, with no Next build or test runner. Across all five between-tick cases,
the cached-core outputs reproduced exactly; project output reproduced the
earlier scalar to floating-point precision. Explicit hero FROM remained intact.
The helper hashes are recorded in `project-clock-comparison.json`.
Replaying captured local scroll receipts/RAF stamps through that actual helper
gave median world error.000038 with zero time offset, but p95 error.0180.
Receipt time is not the private retarget call time, and callback ordering/time
quantization remain material; this is supporting fit, not a complete live-clock
proof (`recorded-local-clock-fit.json`).

The whole-route result also leaves a distinct early-story/footer cadence issue.
Using identical native-y chapter boundaries, unwrapped observer RAF gap p95 was:

- Hero:17.18ms source/17.18ms local, with13 versus44 gaps over25ms.
- Pre270:17.20ms source/33.32ms local, with40 versus149 gaps over25ms.
- Work:17.14ms source/17.16ms local; systems:17.14ms/17.16ms.
- Footer:17.16ms/17.16ms, but0 versus26 gaps over25ms.

These are callback scheduling measurements, **not presented FPS**. They do not
attribute early-story or footer cost to Three, SVG, layout, GC or compile work.
The method repeat was separate: a warm43.1s/840-input sweep on each page with
counts and one-in64 sampled timings. Intercepted calls were22,653 local DOM
queries versus0 source,1115 local computed-style reads versus0 source,
3038 versus487 bounds reads, and1108 versus0 `clientHeight` reads. Local queries
continued in work/systems/footer; this supports the offline caching priorities.
Cached references can bypass wrappers, and sampled costs mostly rounded to0ms,
so these counts are neither exhaustive browser work nor proof of its duration.

Recommended smallest next work: investigate the hero start-time alignment while
preserving explicit FROM and the measured100ms curve, with a focused repeat
against this baseline. Cache navigation measurements and skip unchanged poses
as a separate coherent change supported by the source and repeat counts.
Keep the early-story/footer cadence investigation open; no whole-page cure,
foreground/native-input acceptance, AR/narrow parity, or presented-FPS claim
follows. No further live round is warranted until a focused change or a better
trace capability supplies a new question.

Handoff files are under `/tmp/gazzar-r13-prep/`: `baseline.function.js`,
`input-plan.json`, `source-baseline.json`, `local-baseline.json`,
`baseline-analysis.json`, `fixed-y-cadence.json`, `scroll-event-phase.json`,
`source-method-repeat.json`, `local-method-repeat.json`, `method-totals.json`,
`verify-project-clocks.cjs`, `project-clock-comparison.json`,
`fit-recorded-local-clock.cjs`, `recorded-local-clock-fit.json`, and `README.md`.
