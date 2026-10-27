# HOME continuous review — R16

2026-10-27. Independent LIVE review of frozen application **1ebf932**, documentation
HEAD **149cd32**, production build **oi3pQ7VnQr5QQgH7A98dl**, against the public
Gazzar HOME. **Full identical EN/AR HOME experience is NOT accepted.** The new
background handoff passes actual shader-phase and duplicate-submission controls.
The smaller early-story/footer cadence P2 repeats, and the menu control exposes
a separate background-clock parity P2. Passing the newest helper does not close
the user's whole-page lag/flicker and same-experience requirement.

Only this new document and `/tmp/gazzar-continuous-r16/` were written. No application
edit, test, check, typegen, build, package command, staging, commit, server action,
child delegation, or other browser surface was used. Parent-reported 188 tests /
5,397 assertions, lint/type/build and EN/AR SSR/14-assets passes are engineering
validation supplied with the candidate, not this review's acceptance.

## R16-01 — P2: residual moving cadence deficit repeats

Two **unrecorded**, sequential source/local pairs use the unchanged 86.1-second,
2,040-input R13 plan, SHA-256
`07a6cf0e4d50ed0076086a04e82fd1be92c701b79c08f1de88e4bad99ce87707`.
The first pair uses freshly reloaded EN documents, real ready/non-inert QUIET
activation and complete entry/world0, loaded fonts, ready scene/environment,
closed menus, motion on and audio off. The repeat reverses run order: local
then source, after each fresh EN-narrow document's full traversal and the same
real wide resize. It is a matched warm repeat, not another cold-load experiment.
All **2,040 corresponding post-input native positions match exactly in each
pair**. Every recorded frame is focused and visible; no lifecycle transition or
prevented input occurs. No recording, extraction, encoding, build or test runs
alongside these pairs.

Common native-y boundaries are 3474.432, 20663.93799, 28615.03225 and 38519.82396;
regions are not selected by a potentially lagging displayed story clock.

| Native-y region | Fresh gaps >25ms source / local | Repeat source / local | Fresh RAF gap p95 source / local |
| --- | ---: | ---: | ---: |
| Hero | 0 / 1 | 0 / 9 | 17.14 / 17.16ms |
| Pre270 | **19 / 27** | **25 / 34** | 17.16 / 17.18ms |
| Work | 0 / 0 | 0 / 0 | 17.14 / 17.18ms |
| Systems | 0 / 0 | 0 / 0 | 17.14 / 17.16ms |
| Footer | **0 / 5** | **1 / 15** | 17.16 / 17.18ms |

Reproduce using the entire immutable plan, preserving its stops and reversals:

| Replay interval | Trigger | Fresh long gaps source / local | Repeat source / local |
| --- | --- | ---: | ---: |
| +8.3–9.8s | Optical forward, native about3274–11023 | 9 / **14** | 13 / **16** |
| +70.0–71.3s | Optical reverse toward hero | 10 / **14** | 12 / **17** |
| +32.5–36.5s | Footer native40201–40569, small input, 2s stop, reverse | 0 / **4** | 0 / **12** |
| +42.6–46.6s | Footer native39833–40201, reverse/stop/forward reversal | 0 / **1** | 1 / **3** |

This is substantially better than the old R13 stall, but the same two moving
regions still carry a repeatable local scheduling tail. The hero clock fix
survives: unchanged moving-hero predicate gives source9/359 versus local1/298
holds in the fresh pair, and source9/360 versus local1/345 in the repeat.
Different eligible-frame counts are retained, not normalized away.

Input delivery also differs. Fresh lateness p95/max is source2/12.33ms versus
local6.33/219ms; repeat is source1.67/21ms versus local4/207ms. The largest local
delays begin at the first input after the footer's two-second stops, including
requested+45.6s arriving at+45.819s fresh and+45.807s repeat. These timer receipts
are not physical input latency or a proven main-thread blocking duration. The
fresh local pair receives two cached chunks at+2.957s, 5ms each/transferSize0;
source receives none. Neither repeat receives new resources. There is no causal
GPU/layout/GC attribution here.

Evidence: `source-baseline.json`, `local-baseline.json`, `source-repeat.json`,
`local-repeat.json`, `baseline-analysis.json`, `fixed-y-cadence.json`,
`repeat-fixed-y-cadence.json`, `run-summary.json` and the four new comparison
videos below. Callback gaps are **not presented FPS**. The available tools expose
neither native Firefox presentation profiling nor trusted wheel/APZ replay.
The smallest supported next investigation remains these exact optical/footer
spans; this result does not justify easing, asset, DPR or quality reductions.

## R16-02 — P2: local freezes the background clock during an open menu

Bounded EN-wide reproduction on the current build: stop at native15270,
story151.28; move the pointer to viewport(1480,550); open the actual persistent
MENU; leave native y unchanged; observe natural draws while the menu is open;
close it. Both samples below are actually focused/visible and menu-open.

| Natural background observation | Source | Local |
| --- | ---: | ---: |
| Time between menu-open samples | 5,284ms | 6,502ms |
| New default-framebuffer draws | **162** | **0** |
| Actual uploaded uTime | 288.415009→293.679993 | 254.474533→254.474533 |
| uTime advance | **5.264984s** | **0s** |
| Native y / story at both samples | 15270 /151.28 | 15270 /151.2819 |

Absolute uTime values belong to different document histories and are not compared
as initial phases. The within-document advance/freeze is the finding. Local
resumes natural submission after close; no permanent dead loop was observed.
The same background canvas/context survives. Source continues its menu-quiet
tail and normal drift; local suspends that history until the menu closes.
The opaque menu limits direct visibility while open, but the resumed background
has a different material-time/tail history. Do not report an observed flash or
quantify its visual size from these uniform receipts.

The cached public `1nvdbh89vm0tk.js` explicitly samples menu-open, disables
excitation, sets `uQuiet=1`, decays `remaining`, advances the existing field when
eligible, increments `h.time`, and retains its idle/tail invalidation policy.
`source-menu-contract.txt` preserves that inspected excerpt. Current local
`src/sections/landing/2-story/story-environment.animate.ts:64` instead excludes
menu-open from `active()`, and its menu observer at185–188 calls `cancel()`.
This is a whole-experience parity finding; this round does **not** establish that
1ebf932 introduced it. It is separate from the now-correct moving draw handoff.

Smallest supported correction to test: preserve the source's quiet background
tail/time policy while the journey is menu-paused, retaining the single current
pose submission for actual journey ticks. Re-run menu/close history together
with current-phase and zero-duplicate controls. Do not restore the old concurrent
background/journey double-render path.

Evidence: `source-controls.json`, `local-controls.json`, `control-states.json`,
`menu-analysis.json`, `control.function.js`, `source-menu-contract.txt`. Actual
`getUniform` reads occur only on natural default-target native draws. These
reads can stall; this control is not a cadence measurement or GPU timing test.

## New handoff passes its focused live contract

Local36 was actually force-loaded before any accepted current-candidate probe.
Its real flight payload contains **oi3pQ7VnQr5QQgH7A98dl**. The short local phase
run's document timeOrigin is1793124080697; later fresh baseline and locale loads
were checked again. No result from the previous loaded application is accepted.

The existing R15 13.5-second/158-target phase plan and native wrappers were reused,
changing only candidate/build metadata. At each natural background default draw,
actual `uStage` is checked against the final story publication in the same
`document.timeline.currentTime` bin. Source's two-decimal DOM uses tolerance
0.000075; local's four-decimal DOM uses0.000001. Expected stage remains
`(1-cos(PI*clamp((story-84)/110)))/2`, verified against the actual source uniforms.

| Moving window | Source matches current final story | Local matches current final story |
| --- | ---: | ---: |
| Entire forward environment window | 90 /90 | **88 /88** |
| Entire reverse environment window | 89 /89 | **89 /89** |
| Actual story128–159 forward subset | 80 /80 | **79 /79** |
| Actual story128–159 reverse subset | 83 /83 | **83 /83** |

All observed forward/reverse stop draws match current story too. Maximum local
moving residual is below0.0000007. Both short runs have **zero duplicate default
draw bins**. This corrects the actual previous-publication mismatch measured on
1fa0242; it is not merely an observer-order assertion.

A separate **count-only**, no-getUniform pair reuses the exact R15
24.8-second/315-target protocol. All315 corresponding post-input native positions
match. Source has1,402 default draws in1,402 bins; local1,394 in1,394 bins:
**zero duplicate bins on either page**. Offscreen field calls are separate:
source2,932/local2,920. Neither count run receives resources or loses focus.
Counts are native submissions, not rendered/presented FPS.

Only the page's existing WebGL2 context is reused. Draw/default-versus-field
targets and active programs are tracked through native delegates. No renderer
call, forced invalidation, clock write, shader/uniform write, conversion, new
canvas/context, source asset/storage edit or built-in source performance mode
is used. Six native descriptors restore by identity after every probe; observers,
RAF, timers, listeners and globals are disposed. Raw phase/count JSON retains
each receipt and restoration check.

## Four new full-route moving comparisons

New source/local recordings cover full forward and reverse HOME, including
small continuous inputs, stops and immediate reversals, in **EN-wide, AR-narrow,
AR-wide and EN-narrow**. Wide uses the unchanged2,040-input plan. Narrow uses
one shared immutable2,040-input plan with the same phase timings, measured
538×825 geometry and narrow authored hero mapping; it is not generated
independently for local. All video runs complete, remain focused/visible and
start at complete/world0/ready/fonts-loaded, motion on/audio off/menu closed.

| New paired video | CSS viewport /DPR | Reviewed continuous sampled coverage |
| --- | --- | --- |
| [EN wide](/tmp/gazzar-continuous-r16/comparison-en-wide.mp4) | 2544×1392 /1 | 342 paired4fps samples |
| [AR narrow](/tmp/gazzar-continuous-r16/comparison-ar-narrow.mp4) | 538×825 /1 | 342 paired4fps samples |
| [AR wide](/tmp/gazzar-continuous-r16/comparison-ar-wide.mp4) | 2544×1392 /1 | 342 paired4fps samples |
| [EN narrow](/tmp/gazzar-continuous-r16/comparison-en-narrow.mp4) | 538×825 /1 | 342 paired4fps samples |

Every one of the **1,368 paired samples** in44 sequence sheets was inspected,
covering replay0.5–85.75s (videos extend through86.0s): hero/nav/portrait
departure and return, light/glasses optical travel, typography, all sculptures,
Ideas, all work gates/connectors, systems, closing and partial/full footer.
No additional repeatable asset, text, geometry or route-order P1/P2 was established
in this sampled scope. Moving transition-phase differences remain visible;
neither those nor the scheduling finding are erased by resting alignment.

All recorders were stopped before extraction. Alignment uses each recorder's
**firstFrameWallTime** and the replay's actual start epoch, trimming **before**
sampling; there is no duration-derived alignment or time warp. Trim offsets
source/local are EN-wide0.625305/0.627807s, AR-narrow0.574614/0.579713s,
AR-wide0.743946/0.640942s, EN-narrow0.576555/0.563929s. Wide encoding is1600×876;
narrow538×826 (even-height encoding of825CSS). Capture requests30fps; source
AR-narrow's actual encoded rate is30000/1001. `video-probes.json` and
`video-alignment.json` retain these facts.

Both wide video pairs match all2,040 native positions exactly. Each narrow pair
has891 differing receipts after its bottom clamp, maximum **0.05078125 CSS px**,
from source's subpixel maximum20765.05078125 versus local20765; earlier positions
match. This is not reported as a layout/asset defect. Actual timer differences
remain in the videos: maximum local delay is26ms EN-wide,25ms AR-narrow,
219ms AR-wide and179ms EN-narrow. Local narrow fresh documents also load two
cached chunks near their first traversal. Video workload and unequal receipt
phase preclude treating these as replacement cadence baselines.

This is complete **4fps sampled route coverage**, not an inspection of every
captured30fps frame, a60Hz presentation certificate, or universal acceptance.
The new original eight recordings and JSON receipts are preserved alongside
the comparisons. AR-wide blue browser-strip contamination did not recur.

## Focused controls and scope limits

- Reading/motion change retains the existing background canvas/context and
  monotonic material clock within each document, settles to its reading idle
  policy, then resumes motion. Both clamp from native15270 to14102.5 on reading
  entry; motion returns at source14103/local14102.5. Same-size wide resizes and
  real narrow/wide changes retain expected canvas dimensions/DPR. Field texture
  contents/allocation identities and every quality parameter were not read back;
  no universal field-history/quality certificate follows.
- EN-wide ordinary footer Enter passes resolving→to-logo→logo, then a second
  Enter during logo passes clearing→to-word→word. In the bounded common sequence,
  first observed resolving→to-logo is220ms source/233ms local, to-logo→logo about
  2,250ms on both, to-word→word about2,050ms on both. RAF quantization and actual
  untrusted key receipts are retained. Local hover raises grabbable and wave
  energy; source hover also becomes grabbable. No physical pointer/keyboard
  claim is made. Partial-word visual coverage is in all four full-route pairs.
- HOME reading Enter remains in word mode for both scheduled presses on both
  pages. Cairo footer time advances over actual foreground minute boundaries:
  source21:34→21:35, local21:35→21:36. No source clock is altered.
- Eligible persistent EN→AR locale links at story312 retain settled312 through
  narrow and wide return: source11532/local11531.7832 narrow, both22572 wide.
  Initial booting samples (including transient source0/local714) are excluded;
  ready state is required before interpretation. Arabic reading MENU stays on
  the right with LTR control direction. Default focus from native1892 reaches
  **793.84998** on both at wide; from1325 reaches **450.5** on both at narrow.
  Width/x are114.2667/2327.9834 wide and74.2667/431.4667 narrow.
- Ordinary real reload from complete EN story40/native7260.6665 resets both to0
  with manual restoration. Actual ready QUIET entries then finish complete0.
  R14's Back/Forward precedence, pending HOME return, original825 portrait
  resize, spent/positive field branches and context-loss fallback are **not
  independently re-run in R16**. Their prior bounded passes are not upgraded
  into current universal claims. No hardware or OS preference matrix is forged.

`*-footer-logo.png` are different thought-cycle instants, approximately14.84s
source/16.39s local after their probes started. The local image catches a
retracting thought; these are **not matched-pose visual evidence**. An initial
local reverse attempt began after automatic clearing and was excluded; the
accepted common500/3100ms key sequence above repeats while both are in logo.
Paired resting reading PNGs likewise have different foreground histories.

## Evidence ownership and explicit release

All raw data, scripts, original recordings, four paired videos,44 sheets,
navigation/control receipts, analyses and release state are under
`/tmp/gazzar-continuous-r16/`. `visual-inspection.json` records actual reviewed
sampling coverage. No app fix is included in this review.

**EXPLICIT VAWZEN RELEASE: 2026-10-27 18:40:42 UTC.** Both original tabs36/37 are
fresh plain EN, native/world/story0, entry complete, loaded fonts, motion on,
audio muted/quiet and menus closed. Actual geometry is2544×1392CSS/DPR1, outer
2654×1502 at(−47,−5), not a claim of maximization. Source37 is selected and focused;
local36 is not focused. Every recorder has been stopped. Native RAF, all six
observed WebGL delegates and five Canvas methods are native; review globals are
absent, and every installed descriptor had already restored by identity. No
context loss was requested. No extra tab/window/iframe/profile exists.
`release.json` retains both actual states and the current local flight-build
receipt. **No browser call follows release.** All extraction, visual inspection
and report writing occur offline afterward.
