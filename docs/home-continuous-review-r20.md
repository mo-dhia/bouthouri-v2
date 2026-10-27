# HOME continuous production review — R20

2026-10-27. Independently reviewed frozen application **aea68ea**, production
build **eUFqAvDuekvahEqjq_QdT**, at `http://localhost:3000/en` and `/ar`
against [the public HOME](https://www.thisisgazzar.com/en).
**Full identical EN/AR HOME acceptance is withheld.** A repeatable P2 loses the
correct history destination after a fresh AR reload. The new moving comparisons
establish broad current-candidate coverage, but do not close the user's stutter
complaint or certify presented-frame parity.

Only this report and `/tmp/gazzar-continuous-r20/` were written by this reviewer.
No application, server, build, package, typegen, test, staging or commit operation,
or delegated agent was used. The supplied 199 tests /5,672 assertions, lint,
TypeScript, production build and EN/AR SSR/14-asset passes are parent evidence.
The build ID was independently read from disk and found in the actual local
document payload, including final cleanup.

## R20-01 — P2: Back is correctly restored, then loses its destination

Two runs without native-method hooks finish at the wrong EN destination. The
second removes reading-mode changes from the reproduction:

1. Fresh plain EN, wide **2544×1392 /DPR1**. Wait for actual ready, choose QUIET,
   and confirm complete entry, motion enabled, native/world/story zero.
2. Seek and settle work score312: native **22572.19921875**. Click the visible
   persistent Arabic link. Wait for actual AR ready/complete312.
3. Resize the existing window to outer648×935, giving **538×825 CSS /DPR1**.
   AR retains312 at source11532/local11531.883789.
4. Reload AR as a real fresh document. Confirm that the pending generic EN
   return is absent, choose its actual ready quiet entry, and finish at zero.
5. Reach complete AR footer714/native20765. Invoke exactly one Vawzen
   `navigate_page_history({ direction: "back" })`.
6. Wait for the resulting EN document/controller to settle.

The public source stays at **native20765/story714**: the old wide EN pixels are
clamped to the current narrow extent. Local instead settles at **native825,
opening0/story0, hero world0.5187**. Local entry is complete; fonts, scene,
environment and boot are ready. This is not an accepted booting/assembly sample.
At this particular wide/narrow ratio the saved22572 pixels exceed the narrow
maximum; the expected raw fallback is the footer, rather than the systems
position seen in earlier reviews at other viewport sizes.

The minimal local trace is decisive about ordering:

- Native popstate capture and bubble each see the correct selected EN ID
  `21d9bdab-6741-4b5a-88b2-7d750ff7ae5d`, exact `/en` path and both inline and
  external **22572.19921875/work312** checkpoints. Native position is20765.
- `home-navigation-restore` then reports **kind history**, original pixel
  target22572.19921875, applied/clamped native20765, footer position and frame714.
- A later settled observation is825/opening0. Thus the demonstrated defect is
  **loss after a successful history application**, not a proven null-intent,
  missing-checkpoint or fresh-boot classification failure.

Local retains the fresh AR document's timeOrigin **1793133386356** and original
navigation timing type `reload` through the Next soft return. The source creates
a hard `back_forward` document. Those different mechanisms are recorded rather
than treated as equivalent provenance. An earlier run with reading→motion in
the setup ends at the same wrong local825; its source remains20765.

Evidence: `functional-final.json`, `minimal-before-reload.json`,
`minimal-fresh-trace.json`, `local-minimal-fresh-back.png` and
`source-minimal-fresh-back.png`. The minimally repeated local/source settled
observations have epochs1793133443365/1793133443679. The screenshots show the
different resulting page regions.

The frozen navigation implementation explicitly selects saved pixels for the
first history application (`home-navigation.ts:303–307`), then records an applied
transaction and a geometry signature (:288–292,317–344). State is retained per
Document (:92–122); cleanup/remount behavior is at:454–487. These are relevant
investigation points, not a proven offending writer or an accepted correction.
This review does not establish that aea68ea introduced the defect.

### Instrumented follow-up is a qualified pass, not a retraction

After all videos/cadence runs, one bounded local repeat added WeakMap DOM-owner
IDs, DOM heights, event/RAF samples and native scroll-method/setter delegates.
It **finished correctly at20765**. Its geometry reads and wrappers can alter
the ordering, so it cannot erase the two prior failures or supply the missing
owner identity in those failures.

It observes popstate while outgoing AR root1/hero2 is still connected; then new
EN root3/hero4 appears. Document height temporarily falls **21590→9462** and
native y clamps to8637.200195; native825 is then observed at height21590. No
explicit825 write is seen among Window.scrollTo/scrollBy, Element.scrollTo,
scrollIntoView and scrollTop-setter delegates. A later navigation
`scrollTo({top:20765,behavior:"instant"})`, with stack locations in
`3fsl06704_hcc.js:1:24135/27970`, applies on **new EN root3**, and its history
restore event reports714. All five observed descriptors restore by identity.

See `root-owner-trace.function.js` and `root-owner-trace.json`. Temporary layout
clamps are directly observed in this passing run. An outgoing-root application
in the failing runs, an explicit825 writer, and the final causal fix remain
unproven.

## New unrecorded cadence: smaller residuals, no stutter cure

After explicit **MEASUREMENT_CLEAR**, four sequential, focused/visible,
unrecorded runs use the unchanged **86.1s /2,040-input** plan, SHA-256
`07a6cf0e4d50ed0076086a04e82fd1be92c701b79c08f1de88e4bad99ce87707`.
The first pair is source→local from fresh complete quiet EN documents. The warm
repeat uses those same documents, local→source, without another resize/reload.
All2,040 corresponding post-input native positions match **exactly in each
pair**. No lifecycle change or prevented input occurs.

No encoder, extractor, native profiler, native-method wrapper or GPU uniform
read runs alongside these four measurements. Input is the original **untrusted
wheel intent plus instant native scrollBy**, with timers independent of the
observation RAF. It is not native wheel/APZ or physical-input latency evidence.

Fixed native-y region boundaries remain3474.432,20663.93799,28615.03225,
38519.82396. Counts of observed RAF timestamp gaps over25ms:

| Region | Fresh source/local | Warm repeat source/local |
| --- | ---: | ---: |
| Hero | 1 /1 | 2 /2 |
| Early story | **20 /25** | **25 /26** |
| Work | 0 /0 | 1 /0 |
| Systems/people | 0 /0 | 1 /0 |
| Footer | **8 /3** | **1 /4** |

Early-story p95 is about17.16ms on both. The local excess is now small, and the
footer comparison changes direction. These observations do **not** re-establish
R16's stable two-region local scheduling deficit at its previous strength, nor
demonstrate a uniform footer regression. They also do not establish a stutter
cure. Local maximum timer lateness still reaches **213ms and217ms**, versus
source38ms and12ms. Timer lateness is not a continuous blocking duration.

The prior hero hold regression does not recur: the unchanged moving-hero
predicate counts source **9/360**, local **1/358** holds/eligible frames, then
source **9/325**, local **1/357** on repeat. Eligible counts are not normalized
away. Fresh local loads two cached chunks; the other three runs load no new
resources. Root's earlier history-write CPU A/B is separate evidence, not a new
R20 cadence result or presented-frame improvement.

Evidence: `source-baseline.json`, `local-baseline.json`, `local-repeat.json`,
`source-repeat.json`, `cadence-summary.json` and immutable plan/helpers.
The reused helper's `nativeProfilerAvailable:false` is a legacy metadata field,
not a capability inventory: a Firefox profiling route existed in R19, but no
live profiler was used here. The root's measurement clearance reported the
native analyst finished and profiling stopped.

## Five newly recorded moving comparisons

Full forward and reverse movement, stops and reversals were recorded
sequentially, one recorder at a time. All accepted macros start at actual
complete/ready/fonts-loaded zero, motion on, audio muted, menus closed,
foreground focus and visibility. All finish2,040 inputs without lifecycle loss.

| New paired comparison | Actual CSS viewport /DPR | Boot/history | Reviewed whole-route samples |
| --- | --- | --- | ---: |
| [EN wide](/tmp/gazzar-continuous-r20/comparison-en-wide.mp4) | 2544×1392 /1 | Retained fresh EN document after two cadence traversals | 342 |
| [AR wide](/tmp/gazzar-continuous-r20/comparison-ar-wide.mp4) | 2544×1392 /1 | Fresh direct AR document and actual quiet entry | 342 |
| [AR narrow](/tmp/gazzar-continuous-r20/comparison-ar-narrow.mp4) | 538×825 /1 | Retained AR document after wide traversal and real resize | 342 |
| [EN narrow](/tmp/gazzar-continuous-r20/comparison-en-narrow.mp4) | 538×825 /1 | Fresh direct EN narrow document and actual quiet entry | 342 |
| [Native EN wide](/tmp/gazzar-continuous-r20/comparison-native-en-wide.mp4) | 2544×1392 /1 | Retained complete EN after the macros | 260 |

Every one of the **1,628 paired4fps samples in53 sequence sheets** was inspected.
They cover the entire moving body: hero departure/return and header motion,
opening typography/glasses/lens travel, all three sculptures, Ideas, every
project and connector, systems, people/closing, partial/full footer and reverse
travel. Macro native positions reach source714/local713.9963 at wide and714
at narrow; the native pass reaches714 on both.

Five additional one-second windows were inspected at every encoded frame:
EN-wide hero2.8s, footer wake45.5s, AR-narrow opening8.1s, EN-narrow reverse
sculptures63.8s, native optical6.8s. These contain **149 paired encoded frames**
(29 in the29.97fps narrow window,30 in the others).
`visual-inspection.json` and `contiguous-windows.json` record actual coverage.

No additional repeatable asset, text, section-order or layout P1/P2 was
established in this bounded moving coverage. Transition-phase differences
remain visible, especially during fast travel; they are not erased by resting
alignment. Thumbnail sampling and a few contiguous windows do not certify every
original frame, exact pose equality or continuous60Hz monitor presentation.
No universal bright/broad optical-background criterion is imposed on different
material/visibility histories.

### Native browser wheel provenance

The authorized existing-window XTest helper supplies the **same host plan** to
both pages:367 forward notches at80ms, a3s stop,367 reverse notches, with lead/tail.
Both receive **734/734 trusted**, pixel-mode events at±114px, **zero prevented
events**, no focus/visibility loss and no new resources. Both return to zero and
reach full footer714. Source's fractional native maximum is40837.035156;
local's is40837. This is native Firefox wheel/default/APZ input, **not physical
hardware, touch or an OS reduced-motion test**. No page WheelEvent/scroll driver
runs in this native pass.

The light observer uses cached stage attributes and native RAF; it neither
wraps rendering nor reads GPU uniforms. The source/local capture-listener
native positions differ on730/734 corresponding wheels, by up to
**109.716796875px**, less than one notch. They are recorded before default/APZ
application. Host delivery lateness also differs (maximum48.75/44.51ms).
Therefore equal host time/event ordinal is not a guarantee of equal displayed
native position. Actual native-y/story/receipt data remains alongside the
videos; unmatched native frames are not graded as an application pose defect.

Evidence: `native-plan.json`, `*-native-host.json`, `*-native-video.json`,
`native-summary.json`, and the ten original `r20-*.mp4` recordings.

### Geometry, crop and alignment

Only original source37/local36 in window **0x5400a09** were controlled through
Vawzen. Native OS focus and XTest used that guarded existing window. No new
tab/window/profile/player/profiler UI was created or other browser surface
operated.

Wide outer geometry is **2654×1502 at(−47,−5)**, producing2544×1392CSS/DPR1;
narrow outer648×935 produces538×825CSS/DPR1. Vawzen performed real window
resizes. Actual dimensions and native roots were checked before accepted runs.
The full-window X11 pixmap crop uses **inside-window[55,45]**, not the wide
screen-content origin[8,40]. Both wide and narrow crops were checked against
Vawzen screenshots/first frames before long captures.

Wide encoding is1600×876; narrow538×826 is an even-height encoding of825CSS.
Requested capture is30fps. Both EN-narrow originals encode at30000/1001;
the other originals at30/1. These are recording rates, not presented FPS.
All recorders receive SIGINT/finalization before extraction. Long stationary
raw tails are retained; paired videos cover the authored86s replay region or
65s native plan region without accelerating them.

Alignment uses recorded **firstFrameWallTime** and actual replay start epoch
(native host start epoch for XTest), with a constant trim **before**4fps
sampling. No duration-derived alignment, event-dependent shift or time warp
is used. Source/local trim seconds:
EN-wide0.648937/0.688777; AR-wide0.677404/0.631349;
AR-narrow0.577404/0.569435; EN-narrow0.568976/0.576627;
native0.928707/0.899853.
See `video-alignment.json`, `video-probes.json` and `extract.py`.

Both wide macro pairs match every post-input native position. Both narrow
pairs have891 differing receipts after their fractional bottom clamp, maximum
**0.05078125CSS px**. This is not reported as an asset/layout defect. Video-run
local maximum timer lateness is36ms EN-wide,215ms AR-wide,11ms AR-narrow and24ms
EN-narrow. Recording workload precludes using these as unrecorded cadence
replacement measurements.

## Functional passes and explicit exclusions

- The pristine visible EN312→AR312→narrow→footer→single purpose Back restores
  **EN312 on both**: source11532/local11531.883789. Local Forward restores AR714
  at20765; source Forward714 is observed after the wide return at40837.
  Pending generic HOME return is consumed. This pass uses purpose-built browser
  history; it is separate from the fresh-AR-reload failing branch.
- Retained AR312 survives resize, a later footer, reading and motion return.
  Reading lands on Wujhat at source3795/local3794.600098, work top
  99.6/100CSS px; motion returns to312 at11532/11531.883789.
- Fresh ordinary EN580→reading clamps both to8637; returning to motion retains
  native8637/source and8637.200195/local, rather than restoring semantic580.
- From independently confirmed complete score40/native7260.666504, ordinary
  reload settles to ready zero/manual restoration on **both**, including the
  load-plus2200ms observation. Actual quiet entry is then completed normally.
- Focused HOME reading footer Enter stays in word mode on both. Actual Cairo
  footer time advances from00:08 through00:09 to00:10 across real time, without
  changing clocks. EN narrow reading side-menu focus reaches native450.5 with
  the same right-side64×44 rect at441.7333,390.5 and LTR control direction.
- Motion footer Enter passes resolving→to-logo→logo, then a second Enter passes
  clearing→to-word and later word on both. Observed resolving→to-logo is
  source219/local233ms; to-logo→logo about2248/2249ms. Same-size narrow resize
  leaves both at714/native20765 without a seek.
- At matched312, Wujhat is eligible and the other three work links are inert
  with pointer-events:none on both. Subsequent hover/menu snapshots have
  different native positions and do not establish comparative interruption
  behavior. A local synthetic small pull/cancel returns held=false/word.
  The source's tight-loop hover scan did not settle a hit; it is excluded from
  pointer/cancel parity, not called a source or clone defect.

`controls.json`, `controls-summary.json`, `functional-final.json` and
`excluded-final.json` preserve receipts and rejected setups. In particular:

- Initial direct-evaluation `history.back()` controls reached an older
  about:profiling setup history entry. No settings/profiling page was operated;
  extension reads there failed. Purpose-built single Back/Forward controls
  reach the expected adjacent EN/AR entries. The direct-evaluation anomaly is
  excluded and its transport cause is not proven.
- An early source Forward was issued while its returned EN document was still
  booting; that history attempt is rejected, not used for acceptance.
- Initial local AR-wide/EN-narrow video gates reject non-complete starts after
  tab activation. In the EN case assembling was explicitly observed. No macro
  input/observer was installed in rejected attempts; their short recordings
  remain separately named. Accepted restarts require actual foreground complete0.
- Inert hero-button focus, empty UID lookups, initial unfocused reading Enter,
  and score40 requests overridden during a menu/resize transition are excluded.
  The valid focused-reading Enter and fresh complete40 controls are separate.
- Fresh reading-locale boundary/lifetime reset, AR reading-menu focus, cold
  work/query/hash, intro skip/back-to-start, a complete pointer/Escape matrix,
  storage-denial fixtures, BFCache/hardware and OS preference-change coverage
  are **not newly certified in R20**. Earlier passes are not upgraded into new
  universal acceptance. Browser storage, clocks and source state were not
  forged to manufacture these controls.

## Explicit release and evidence

**EXPLICIT RELEASE: 2026-10-27 21:19:00.864 UTC. No browser call follows it.**

Both original tabs are independently checked plain EN, native/world/story/
opening0, entry complete, boot ready, fonts loaded, motion on, audio muted,
menus closed,2544×1392CSS/DPR1; outer2654×1502 at(−47,−5). Local36 is the final
selected/focused tab. States in `release.json` were sampled sequentially while
each tab was selected, not a claim that both can be foreground simultaneously.

Probe globals are absent. Native RAF, Window.scrollTo/scrollBy,
Element.scrollTo/scrollIntoView/scrollTop-setter and WebGL draw/getUniform
methods are verified native; the bounded write trace had already restored all
five delegates by identity. Recorders, observers, timers and temporary event
listeners are stopped/disposed or removed by final real document replacement.
No source scene context loss or synthetic storage/preference fixture was used.

After release, extraction runs sequentially with bounded threads and the parent
is informed of its duration. All encoders/decoders have exited. The parent owns
subsequent browser or application work. This report covers only the frozen
aea68ea build, not any correction prepared after release.

