# Route clock and production parity review R5

> Recovery note: the reviewer wrote this report and explicitly released all browser/CPU work before its task ended with a model-capacity error. No terminal final-report notification was delivered. The written report, raw measurements and explicit release are retained; this is not approval of any later build. The original written file is preserved in `.artifacts/pages-parity-20261028/root/r5-capacity-recovery/`.

**Disposition: the narrow callback-clock correction passes independent code review. Full Gazzar→Bouthouri same-experience parity is not accepted for this candidate. One bounded P2 remains: repeated JavaScript-reduced EN desktop Contact→Vision reveals advance in visibly larger steps locally.** The 130ms clock itself is correct in the new controls. The visible finding survives three repeats without RAF, MutationObserver, sampler or GL probes. Its underlying cause is not established.

Exact reviewed HEAD: **`497e628d00c16aadb61f415813341f207b50d952`**, code commit `0eecb6d`, production3100 BUILD **`iTxQ9za0P2IZUlsc_NBns`**. This is neither R3 `f98957d`/`xqr5J4NXtkoga9N948wij`, old R2 `yWFD32LNWavnwkZN_JMni`, nor dev3000. Only this report and [route-clock-review-r5](../.artifacts/pages-parity-20261028/route-clock-review-r5/) were authored. No delegation, app/existing-test/package/build/server/stage/commit changes. Root owns subsequent corrections and builds; they are outside this grade.

## Frozen identity and review basis

[Initial audit](../.artifacts/pages-parity-20261028/route-clock-review-r5/initial-audit.json) and [final audit](../.artifacts/pages-parity-20261028/route-clock-review-r5/final-candidate-audit.json) verify **255 code/config inputs, zero mismatches**. Final audit:2026-10-28T20:38:38.990695Z, same HEAD/BUILD, HTTP200 and exact BUILD in `/en/contact`. Root manifest SHA256: `414724de5ed9434c117c601e0a41e3ac37a9ea7bc3f3b9bd8d686e80ef3c76d2`. Exactly two manifest inputs differ from R3: `route-surface.animate.ts` and `tests/route-surface.test.ts`; documentation changes are separate. The observed browser script-src inventory after full production reload contains all9 initial scripts from the exact candidate HTML; its11 additional dynamically inserted chunks also exist in that output. [Browser build proof](../.artifacts/pages-parity-20261028/route-clock-review-r5/browser-build-proof.json) records the inventory. A later boolean inline-script BUILD search can match its own injected probe literal and is excluded as identity proof.

Read AGENTS, browser protocol, loading/splitting/viewport/animation/editorial/HOME navigation and route source contracts, page contracts, background source/ownership guides, complete final R2/R3/R4 reports and R3 final manifest, R10/R13 findings and repair responses, actual controller/registry and cached primary modules61157/74812/32919/25017. Installed Next navigation documentation was consulted. Bouthouri name/approved portrait/email/Tunis time/taller heavier footer are intentional. Projects remains excluded.

Root's364PASS/15,615assertions, lint/types/architecture, build and20-assetSSR are attributed validation, not this reviewer's execution or visual acceptance.

## Code result: tiny clock correction passes

The sole runtime delta preserves synchronous `tick(start)`, the original `performance.now()` segment anchor, linear `from + elapsed/duration`, clamp, single sine, profile durations, reveal progress, selection/presentation guards, cancellation and ownership. Subsequent RAF callbacks now sample `win.performance.now()` instead of forwarding the refresh timestamp into the finite segment. No scheduler, global parent clock, GSAP runtime, smoothing, duration change, body/CSS/renderer or loading-boundary change was introduced.

The actual cached source ticker32919 samples callback `Date.now()` and ignores the supplied RAF timestamp for progress. Its fresh route `to` path, rather than HOME retargeting, supports this narrow correction. R4's current-parent controlled80/96ms samples are `.322698/.159492`, compared with the previous mixed-clock `.844206503/.290176464`. R5's actual mounted controller gives `.322697556/.159492071` under the stale supplied stamps.

Independent [10 mounted controls](../.artifacts/pages-parity-20261028/route-clock-review-r5/mounted-clock.jsonl) pass: ordinary/reduced at1920/768/412, canceled queued real wrappers, and physical owner replacement preserving linear reveal phase despite stale callbacks. Every case ends with zero controlled frames/timers. The inert DOM/clock adapter is extracted from the existing harness; the assertions are separately authored and the real controller/registry are evaluated. This is not a Next/GPU/browser fixture.

Executed serially, before live measurement:

- `bun .../route-clock-review-r5/mounted-clock.ts`:10 controls pass, empty stderr.
- `bun test tests/route-surface.test.ts tests/route-handoff.test.ts tests/home-navigation.test.ts`: **106PASS,0FAIL,1,930assertions**,3files. Cancellation, saved0/1700, suspension/resume, owner replacement and HOME precedence retain their scoped coverage.
- Attributed rerun of R4's retained actual-core fixture: **7 schedules pass**, exact cached-core SHA256 `e1899cd720c6c19111d45a94334434ebb3fd826e1cdb191dda8b312e17b0fef8`, zero fake RAFs. This rerun is not a newly authored independent source fixture.

R4's boundaries remain: current parent start phase, between-tick creation/interposed cost, sleeping wake and default500/33ms long-stall smoothing differ from a local wall segment. No blanket GSAP-clock equivalence or visible cure follows. R10's async URL/no-DOM-before-Back seam and R13's unknown-publisher/manual-disconnect seams remain ungraded absent normal reachability; they were not artificially reopened.

## Positive reuse of the full18-context body scope

[Positive reuse proof](../.artifacts/pages-parity-20261028/route-clock-review-r5/positive-reuse-proof.json) independently hashes35 R3 clips plus22 explicitly reusable R2 body/control clips,12 compact setup receipts and8 freshly fetched immutable source assets: all match. All58 R2→R3 scoped body/content/control inputs also equal R5. R3's CSS proof retains only six AR mask-rule changes and three editorial inherited-weight declarations relative to R2; all R3 body/CSS/renderer inputs are unchanged in R5.

| Body scope | Evidence carried forward, with original limits |
| --- | --- |
| Vision/Services/Contact EN desktop | R3 fresh complete native forward/end/reverse bodies; R5 exact unchanged-input proof |
| All9 AR page/profile bodies | R3 fresh complete bodies and typography/all-row geometry; R5 exact unchanged-input proof |
| Six EN tablet/mobile bodies | R2 body-only evidence, positively checked by R3 and again R5 |
| Representative HOME EN desktop | R3 complete native forward/reverse and current-journey/mode controls, unchanged inputs; new R5 route/HOME smoke below |

R3's old Arabic Services mask, Vision weight/wrap and route canvas/clock replacement triggers stay closed **only within its named controls**. R5 does not recollect or broaden those closures. R3's74sheets/1,540source+1,538local ordinary frames,38ordinary+2denseHOME excluded candidates, its incomplete later local bulk-GPU trace and bounded allocation/field-content limits all remain. All R2 exclusions remain, including118 original native-unmatched candidates, Contact ENdesktop24/48 original candidates and their separate dense replacement, early Services top still, failed focus/short wheel plans and mock/synthetic limits. No excluded pose becomes accepted through a hash.

Unchanged Contact six-context validation/mock-success/error/reset and Services gate controls remain R2-attributed. R5 made no valid submit, real mail/calendar or clipboard action. No new full18body recapture or all18fresh cold-entry acceptance is claimed.

## Fresh production coverage and normal timing

Only granted Vawzen source33/local34 and Zen60817575 were operated. Desktop1920×1080DPR1 uses outer2030×1190@(-47,-5), crop(8,40); tablet768×1024 uses outer878×1134; mobile412×915DPR1 uses the existing per-tab RDM, desktop UA/touchdisabled. Independent mobile crop calibration selects(770,80); mean pixel difference `.3232`, versus>2 at adjacent vertical offsets. No extra tabs/windows or personal-window input.

Fresh normal cycles at **EN/AR × desktop/tablet/mobile**, each side: Contact→MENU Vision→MENU Services→plain footer Contact. Thus18 actual route activations per side, all three pages at all six locale/profile setups. Fresh snapshots establish committed URLs, y0, fontsloaded, complete page entry and idle surface at the later marks. Normal dense strips show cover above the menu and usable arrivals. MCP clicks are real UI paths with synthetic activation, not trusted hardware/physical touch.

| Normal finite fit, ms | Source range, six activations | Local range, six activations |
| --- | ---: | ---: |
| Desktop cover / reveal |299.22–300.51 /378.48–379.83 |299.96–300.29 /379.93–380.19 |
| Tablet cover / reveal |299.58–300.60 /378.46–380.23 |299.79–300.16 /379.76–380.15 |
| Mobile cover / reveal |249.47–250.51 /298.47–300.04 |249.92–250.12 /299.84–300.19 |

Fits summarize DOM sample/write intervals, not exact visible duration. Normal source's cached RAF bypassed the newly installed wrapper; prior actual sample→MO delivery bounds are used there. Local callbacks have before/after bounds. Commit/assets/native compositor histories are independent. Some source Contact native clip tails remain covered/in entry, and source ENdesktop's initial Vision native pose differs from its later y0 snapshot; those pixels are not promoted to matched resting/body acceptance. They do not invalidate the separately bounded normal clock samples. No load-race or native-scroll cause is invented.

New shared smoke on both sites: Services1700→MENU Vision→862→purpose Back1700→Forward862→Contact0→HOME0→verified quietfalse/true/false→MENU Vision0. Same connected canvas/context/host at all sampled boundaries; source `uTime`17.403→67.844, local4.638→54.936, without reset. Rectangles1920×1080 and stage .28→HOME0→.28 retained. The local/source initial phases are unequal and not a pattern-color comparison. Saved reload Services1700 and0 pass on both after fresh post-load observations. R5 does not newly certify texture allocation, field content, current-journey duplicate budgets, hidden pause, size/DPR, object failure or full HOME narrative; stronger named R3 controls remain attributed with their limits.

## P2: reduced Vision visible reveal still steps abruptly

All reduced controls use the same **JavaScript MediaQueryList getter simulation**, native getter/CSS/OSfalse on both. Vawzen exposes no tab-scoped reduced-media emulation. No source clock/style/asset mutation or forced render occurred. Ordinary routes/mounts were used, not a direct router call.

Instrumented controls: three ENdesktop cycles through Vision/Services/Contact,9 activations per side; two ARmobile cycles,6 per side. The passive RAF wrapper preserves callback/stamp/this/result. It samples cached field opacity immediately before/after real callbacks; MO old styles/delivery and previous actual reads are separate. In reduced controls the source ticker subsequently captured the wrapper after wake, providing **real before/after write bounds too**, unlike the normal captures. Interior brackets are0–2ms wide at the available clock precision; they are not setter instants or presentation times.

[Raw traces and interval analysis](../.artifacts/pages-parity-20261028/route-clock-review-r5/clock-analysis.json) give reduced reveal midpoint fits source128.52–131.55ms and local129.92–131.11ms across15 each. Six-decimal opacity, integer/coarsened clocks and source Date sampling explain why exact130ms interval intersections can miss by up to2ms; these fits do not establish exact setters. The previous sparse65ms wall fit is **not reproduced as the candidate's authored duration**.

ENdesktop Vision's three source reveals have8/8/8 interior writes; local3/4/4. Local first repeat includes a73ms interval between `.975528` and `.24652` cover observations. Source has intervening changes. Distinct supplied stamps, callback entry/exit, MO delivery and MP4 PTS are retained. Fewer writes alone would not establish visible parity failure.

The [additional unwrapped clips](../.artifacts/pages-parity-20261028/route-clock-review-r5/videos/local-reduced-unwrapped-en-desktop-repeat3.mp4) settle that narrower question: fresh equivalent ENContact documents, three warm footer Contact↔Vision repeats each side, **no RAF/MO/sampler/GL wrapper at all**, only the reduced getter and boundary marks. Every original encoded frame is retained/decoded. The source visibly brightens through intermediate states; local holds near dark and jumps brighter in all three Vision repeats.

Within each own settled heading image, the recorded contrast10→90% crossings are:

| Repeat | Source original PTS, seconds | Local original PTS, seconds |
| --- | --- | --- |
|1 |8.666667→8.733333 |9.000000→9.000000 |
|2 |14.100000→14.166667 |14.700000→14.733333 |
|3 |19.533333→19.600000 |20.500000→20.533333 |

Source spans two encoded intervals(~66.7ms) each; local zero/one/one(~0/33.3/33.3ms). **Zero means both thresholds occur in the same retained encoded frame, not instantaneous browser presentation.** [Contrast method/raw values](../.artifacts/pages-parity-20261028/route-clock-review-r5/unwrapped-vision-contrast.json):320px decoded JPEG, heading ROI(108,59)–(250,125), own settled bright-glyph mask>100, cover baseline5, normalized within side. Tiny first nonblack pixels and threshold choices differ; the table is not a total fade-duration or FPS measurement. Detailed contiguous native-PTS sheets and manual inspection support the same larger-step observation. Capture phase/33.3ms quantization, document/GPU histories and source/local framework differences remain.

**Actionable disposition:** preserve this as a P2 within the repeated JS-reduced ENdesktop Contact→Vision path. The clock correction is valid; stretching130ms or claiming a clock cure is unsupported. Native OS/CSS reduced behavior, other machines and universal refresh/performance remain ungraded. Services/Contact and ARmobile reduced samples add coverage, not a blanket same-experience pass or the same categorical visible finding.

## Independently confirmed readiness gaps; cause remains open

Cached primary source61157 `D`, lines31–39, has **no reduced bypass** after `W(main)`: visible practice assets require explicit depth fallback, no canvas or `heroRendered`; otherwise `objectsReady`/offscreen bounds must qualify, followed by the two-observation `routeSettled` guard. Primary25017 still imports `createPracticeObjects` after locale/fonts even when reduced.

Frozen local Vision:30 and Services:29 instead begin their asset predicates with `reduced || ...`, although they still boot/render static objects. Additionally `route-entry.ts:47` returns `record.skip || handler.assetsReady()`, while controller `ready(reduced)` latches that skip. Removing only the two handler shortcuts would therefore leave the registry bypass. Entry-skip and asset readiness are different decisions; explicit readable fallback needs its own preserved eligibility.

These are independently verified source-contract differences. **The saved R5 traces do not retain heroRendered/objectsReady/ready-event ordering during reveal.** Settled marks and visible objects later do not reconstruct that ordering. Consequently the bypass is a plausible lead, not a proved cause of the pixels, missing opportunities or specific boot work. Root's post-release correction/regressions, including actual registry observation, require a new candidate grade and do not change this report.

## Evidence, exclusions and release

22 new MP4s,0metadata failures;20 canonical clips decoded successfully with decoder/filter/output threads2 and no overlap with tests, capture or input.18 instrumented clips have3,026 selected original-PTS frames,1,108 whole-finite2fps observations and156 retained dense phase windows. The two unwrapped clips decode713+756 original frames, with101 overview observations. Inspected all46 overview sheets through12 packs, all72 normal dense windows through6 packs, all60 reduced dense windows through5 packs, plus detailed repeated Vision native-PTS sheets. HOME's24 dense windows are retained but were not separately inspected; its whole finite overview was. Small sheets do not certify full-resolution glyphs/every presented frame. [Selections/coverage](../.artifacts/pages-parity-20261028/route-clock-review-r5/inspection-coverage.json) retain exact paths/PTS.

Excluded/retained: preliminary source normal clip ends before later activations; preliminary local probe was lost across document replacement and candidate document identity was not yet proven, so its clip is excluded/replaced by `*-fresh`. Canonical source ENdesktop is `*-complete`; JSON trace names omit that suffix. No cause is assigned to the initial replacement. The first preliminary trace export exceeded shell argument length and was lost after disposal; no claim uses it. Initial UID-regex failure made no click. Two source post-reload in-page responses timed out; fresh post-load1700/0 snapshots replace them. Initial reuse audit used a wrong relative video path; corrected audit passes. Two packing scripts initially had syntax errors, retained logs; corrected offline packs supply no app finding. No scoped test failed. Root's wrapper exit143 notice arrived during offline work: no coincident live failed control; root verified SAME PID723157/listening3100/200/exact BUILD, without restart. It does not establish an outage.

All prior R2/R3 failed descriptors, incomplete GPU bulk controls, native exclusions, mock and artificial-boundary limits remain. No full source/local ambient phase matching, exact write→presentation latency, physical touch, all fonts/import failures/BFCache combinations, every HOME locale/history narrative or universal full parity is certified.

**EXPLICIT RELEASE sent after final actual OS check2026-10-28T20:39:25.397358464Z**, root message `r5-explicit-release-20261028`. Only tabs33/34; XID60817575active, outer2030×1190@(-47,-5), local34focused. Both fresh plain ENContact/y0/fontsloaded/idle surface/entryopacity1+transformnone;1920×1080DPR1, menuRDMclosed, native reducedfalse/motionon/audiooff, blank forms. Native RAF/MQL getter/fetch restored, R5 globals absent, no owned recorder/input/decoder/test job. Source's hidden pending entry was allowed to complete visibly before the final saved state. [Final state](../.artifacts/pages-parity-20261028/route-clock-review-r5/final-release-state.json) and [process cleanup](../.artifacts/pages-parity-20261028/route-clock-review-r5/final-process-cleanup.json) retain exact observations. No browser/native/probe/record/decode call followed release. Only saved-evidence report/manifest writing followed.
