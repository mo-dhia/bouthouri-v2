# HOME continuous review — R14

2026-10-27. Fresh adversarial review of the frozen **5b921d7 application** at
`http://localhost:3000/en`, against the public source. **Full HOME parity is not
accepted.** The hero clock stall and both R13 reading findings pass the measured
controls, but a smaller **P2 early-story/footer cadence deficit remains**. This
continues the user's whole-route smoothness blocker; the hero result does not
close it. No additional P1/P2 appearance or reading-history defect was established
in this round's bounded scope.

The parent reported check 176 tests / 4,460 assertions, build and SSR/14 assets
passing. Those are parent engineering results, not this review's visual
acceptance. This reviewer ran no application tests, check, typegen, build,
package command, server operation or commit, and edited no application files.
During the loan HEAD advanced to **5709bde**, containing only two documentation
updates; `git diff 5b921d7..5709bde` has no application changes. The measured
production build ID is `9GiJIJC0sLhZlXm7MATl4`.

## Capture conditions and repeatability

Only the granted Vawzen tabs **source37/local36**, original window
`0x5400a09`, were used. No tabs, windows, iframes, profiles, emulation, OS focus
commands, trusted/native input injection, source clocks, storage edits, forced
renderer draws or canvas conversions were used. Real window resizes produced
**2544×1392** and **538×825 CSS, DPR1**. The browser remained foregrounded during
both baseline and video runs: every recorded frame was visible and focused.

Both EN baseline documents were really reloaded. Each received an actual QUIET
button activation after ready controls, then observed complete entry/world0,
loaded fonts, closed menu, sound off and motion enabled. Source appBoot was
ready; local's actual scene/environment/boot equivalents were ready. No literal
source appBoot value was invented locally. These are **fresh documents with
cached assets and prior browser/GPU history**, not controlled cold-cache runs.

`/tmp/gazzar-continuous-r14/` contains the raw evidence. The unchanged 86.1-second,
2,040-input plan is byte-identical to the R13 original, SHA-256
`07a6cf0e4d50ed0076086a04e82fd1be92c701b79c08f1de88e4bad99ce87707`.
Only the copied baseline function's served-commit metadata was made configurable;
its math and protocol were unchanged. It uses timer-driven **untrusted wheel
intent plus instant scrollBy when unprevented**, observing real scroll events.
This is not physical wheel/trackpad/APZ latency evidence.

The bounded observer used cached datasets/inline styles, native unwrapped RAF,
and no per-frame geometry/computed-style queries. Export happened only after
stop. No video, extraction, encoding, build or test ran during the cadence pair.
There were 5,136 source / 5,112 local observer frames, no focus/visibility
transitions, no prevented inputs, and **all 2,040 corresponding post-input native
y positions matched exactly**. Actual input lateness p95/max was 2/19ms source
and 4.33/64ms local. Observer cost p95 was 0–1ms at approximately 1ms clock
resolution; the observer is still a workload.

Source received no new resource entries. Local received two cached script
entries around replay +2.952s, taking 11/12ms with transferSize0. No recorded
boot/readiness marker changed. The later early-story/footer intervals are not
contemporaneous with those arrivals; first-use GPU/CPU work remains unmeasured.

## Hero clock result and whole-route P2

The previous foreground local baseline held its hero pose on **243/303 moving
frames (80.2%)**, versus source9/360. The new pair holds **1/357 (0.28%) locally**
versus source **9/360 (2.5%)**, using the unchanged visible-hero/moving-y predicate.
This supports the clock correction under this replay, including reverse return
and small-input stops/reversals. It does not establish every idle/global ticker
phase, hidden interval, physical input path or presented frame.

Common native-y boundaries, rather than possibly lagging displayed score, give:

| Region | Source RAF gap p95 | Local p95 | Gaps >25ms source/local |
| --- | ---: | ---: | ---: |
| Hero | 17.14ms | 17.16ms | 4 / 2 |
| Pre270 | 17.16ms | 17.20ms | **21 / 39** |
| Work | 17.14ms | 17.14ms | 0 / 0 |
| Systems | 17.14ms | 17.14ms | 0 / 0 |
| Footer | 17.16ms | 17.16ms | **1 / 12** |

These are **callback scheduling measurements, not presented FPS**. The prior
focused pre270 result was 17.18/33.26ms p95 and 22/78 gaps, so the candidate is
substantially better. The remaining local tail is still visible in two distinct
regions and in both directions. Specific bounded reproductions for the parent:

- **Early optical forward, +8.3–9.8s:** both traverse native3274.25→11022.67,
  roughly story0–77. Local has15 gaps >25ms versus source11. Reverse
  **+70.0–71.3s** traverses the same optical band back toward hero; local has15
  versus source10, reaching50.42ms versus source33.62ms. Across pre270,
  callback-receipt-minus-RAF-stamp p95 is15.10ms local versus7.52ms source.
- **Footer small continuous input and reversal, +32.5–36.5s:** native40201–40569,
  score700–708.1, local has8 long gaps versus source0, including50.40ms at
  +33.397s. **+42.6–46.6s**, reverse and immediate forward reversal around
  native39833–40201/score691.9–700, has4 versus0. Footer callback delay p95 is
  9.12ms local versus3.54ms source.
- Both two-second footer stops have zero >25ms gaps in the primary pair, as
  does the final seven-second origin stop. Work and systems have zero such
  gaps throughout. This does not look like an unconditional runaway loop in
  this replay.

Raw `source-baseline.json`, `local-baseline.json`, `baseline-analysis.json`,
`fixed-y-cadence.json` and `actionable-intervals.json` preserve timestamps,
directions, stops, native positions and observer provenance. `analyze-baselines.cjs`
reproduces the original baseline metrics.

**Cost attribution is unresolved.** Vawzen exposes neither the needed native
Firefox profiler/presentation tracks nor trusted Firefox wheel replay. No causal
milliseconds for Three, optical filters, layout, SVG, history, GC or GPU were
invented. The smallest remaining owner investigation is the optical/journey
render interval and footer material tick/draw during these exact moving spans:
`journey.animate.ts:55` and `:227` still query/write optical/cue nodes, and
`footer-material.ts:252` / `:394` read word/mask geometry around drawing. These
are inspected paths, not measured culprits. The existing R13 audit also identifies
source-equivalent work that must be preserved. No extra method-wrapper sweep
was needed to establish this remaining question; R13 query counts are not
relabelled as new-candidate counts or causal durations. Do not add a wheel
smoother, merge clocks or tune authored curves from this evidence.

## New moving comparison

New original/local **EN-wide full forward/reverse recordings** replayed the same
2,040-input plan after one complete traversal in each document. Both remained
focused/visible and received no new resource entries. All corresponding native
post-input positions again matched. Video adds overhead: input lateness p95/max
was6.33/16.33ms source and9/217ms local, so these runs are not substituted for
the primary cadence pair.

Evidence: `r14-source-motion-wide.mp4`, `r14-local-motion-wide.mp4`, their record
metadata and `source-video.json` / `local-video.json`. The aligned
`comparison-en-wide.mp4` covers replay **0.5–86.0s** with no time warp. Source
first-frame wall time was50.207ms after replay start; local was172.238ms before
start. Trimming **before** sampling used0.449793s source /0.672238s local.
The recorder crops2544×1392 at window offset55,45; its encoded1600×876 height
rounds the exact scaled875.47 to an even876. `video-alignment.json` records this.

All **342 paired 4fps samples**, in eleven `en-sequence-*.jpg` sheets, were
inspected through hero departure, opening/optical, sculptures/type, all projects,
work→systems, people/closing/footer and the reverse journey. Geometry and order
track closely; no new repeatable resting/layout/asset finding was established.
Small transition-phase differences and the measured stalls remain; 30fps video
and 4fps sheets cannot certify smooth presentation near the display refresh.
The R12 EN-wide and R11 other locale/width motion videos remain historical
comparators. **This round does not renew full ordinary AR-wide, AR-narrow or
EN-narrow video acceptance.** No universal full-parity claim follows.

## R13 reading findings accepted in measured scope

**R13-01 passes** in EN and AR, wide and narrow. Wide native696→context loss
leaves mask empty on both; the real next native wake697 applies the identical
five-stop6.491/24.491/42.491/60.491/78.491% mask. Narrow412→loss→413 gives
6.522/24.522/42.522/60.522/78.522%. The photographed fallback and geometry were
inspected in paired PNGs. Context restoration alone retains that mask; the next
native wake at696/412 removes it on both. Every existing context was restored
before proceeding. No loss/readiness wake was fabricated.

**R13-02 passes its original history**, independently from fresh EN and AR
documents: at538×825, complete motion entry, native825, then reading with hidden
hero; real648×935→2654×1502 outer resize gives2544×1392 CSS. **Both stay native825,
world.5927**, with image/canvas rect(0,-977,2544,1696), and draw exit.7805. No
manual local correction occurs. Native return0 freezes the partial alpha field
on both. `*-original-resize825.png`, `*-positive-frozen0.png`, corresponding
case states and `*ResizeTrace.json` preserve the natural sequence.

Fresh reading-at-wide0 controls in **both languages** initialize, spend on
native0→1, clear on a true wide→narrow image-size change and remain blank after
return wide. These are required spent branches, not generic blackout fixes.
Height-only1392→1292, same-size no-op and reverse1392 controls preserve native1;
canvas1536×1024 does not receive a new image-size write on the height-only
portion. Per-language paired spent PNGs and `*SpentTrace.json` show two portrait
drawElements calls across initialization/first native draw and no resize redraw.

## Controls, exclusions and remaining unknowns

- Arabic reading MENU still matches source at wide
  (2327.9834,75.8500,114.2667×44) and narrow
  (431.4667,16,74.2667×44). Default focus from1892/1325 scrolls to793.84998/450.5
  on both and then blurs as that pose hides. LTR positioning and Arabic ink
  survive the header cache. Two initial local probes used source-only
  `.chapter-side`; those selector errors were excluded and repeated with the
  real shared `[data-nav-side-roll] button` selector.
- Eligible AR312→EN312 locale links retain motion312 at wide22572px, narrow
  source11532/local11531.884, and wide return. Reading maps to6043/6043.25 and
  motion returns312. Back restores AR312; Forward restores EN714/native40837.
  Source performs new-document back_forward visits, while local keeps Next's
  document. An initial offscreen **inert hero-link** diagnostic and premature
  source zero-before-restoration samples are excluded; they do not override
  the accepted native/inert navigation contract. Valid repeats use eligible,
  non-inert persistent links and settled native/story state.
- Ordinary reload from completed score40/native7260.667 resets0 with manual
  restoration. Matched real ready QUIET entries complete0 after reload. An
  earlier source QUIET attempt while still loading found no control; its
  subsequent mode/clamp sequence is excluded. The clean repeat uses an actual
  ready/non-inert choice on both. Fresh580/native34748.734→reading clamps both
  to14102.5; motion retains that offset within source pixel rounding
  (source14103/125.60, local14102.5/125.5857), without semantic312 anchoring.
- Eight actual rapid mode clicks per page retain one portrait canvas through
  pending preparations and finish ready in reading. Requested5ms intervals
  were **actually35–80ms source and30–310ms local**, recorded in
  `*RapidResult.json`; do not call these equal-rate input. Only the surviving
  owner initializes/draws after the superseded preparations. No stale owner
  overwrite was observed. Existing-context loss was completed-owner coverage;
  no loss-during-compileAsync or forced cold-network failure was injected.
- Console capture is disabled in this Vawzen session. Its tool returned that
  limitation for both pages; no clean browser hydration-log claim is made.
  Parent SSR/check results and successful control settlement are separate
  evidence. Physical input, native main-thread/compositor cost, presented FPS,
  fully cold resources and the other three renewed ordinary video combinations
  remain outside this round.

Only this review document and `/tmp` evidence were written by this reviewer.
No application correction or acceptance beyond the stated measured scope is
implied. The early-story/footer P2 and the user's whole-experience smoothness
blocker remain open for the parent.

**EXPLICIT VAWZEN RELEASE:** 2026-10-27T17:26:43.294Z. All browser calls have finished;
no recording, observer, replay, timer, prototype wrapper or review global remains.
Existing portrait contexts are restored. Both original tabs are plain EN/y0,
world0/story0, entry complete, motion on, sound off, menu closed,
2544×1392 CSS/DPR1; source37 is selected. No extra surface was created.
`/tmp/gazzar-continuous-r14/release.json` records the final states and native
RAF/canvas/WebGL descriptor checks. The parent owns subsequent browser work.
