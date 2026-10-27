# HOME smoothness evidence — R21 (offline triage)

2026-10-27. **The 213–217ms maxima establish late programmatic input issuance,
not a 213–217ms scene or presentation stall.** The responsible scheduling owner
is unresolved. A separate, useful native-input finding is that the local
observer usually samples the preceding native-y story metadata. That needs a
phase-aware observation before it can be called additional presented lag.
Neither finding closes the user's whole-page stutter complaint or accepts
identical moving EN/AR HOME.

This analysis reads the [R20 continuous review](home-continuous-review-r20.md),
[R19 native-cost report](home-native-cost-r19.md), small R20 helper/code files,
and bounded JSON telemetry only. It does not operate the browser, OS or app,
extract or inspect media, analyze profiler dumps, run tests/builds/typegen or a
server, stage/commit, or delegate. Only this document and
`/tmp/gazzar-smoothness-r21/` are written. Root retains the browser pair and owns
the separate navigation/history-owner P2 correction.

The captured runtime is **aea68ea / eUFqAvDuekvahEqjq_QdT**. Parent application
HEAD **0de3432** is supplied context, not a new measured runtime. R19 measured
**6f55075 / buyy0OD6hWPIKX2N4wX5-**; its CPU intervention is retained as earlier,
separate evidence. Source-side `servedCommit`/`candidate` labels name the local
comparison candidate, not an identified public-source Git revision. No result
here applies automatically to the concurrent navigation change.

The reproducible offline arithmetic is
[`analyze.py`](/tmp/gazzar-smoothness-r21/analyze.py), with all values and input
SHA-256/byte manifest in
[`analysis.json`](/tmp/gazzar-smoothness-r21/analysis.json). Four unrecorded JSON
exports, two native observer exports and two native host exports are analyzed;
each is below 1MB. No original telemetry is rewritten. Frozen application code
is read with `git show aea68ea:<path>`, avoiding the mutable working tree.

1. **The driver preserves input order and pixels, but does not preserve elapsed
   input timing after a late timer.** `baseline.function.js` establishes
   `started = performance.now()` once. It schedules the first event with
   `setTimeout(issue, max(0, first.atMs))`; subsequent requests use
   `setTimeout(issue, max(4, started + next.atMs - performance.now()))` after
   dispatch and instant `scrollBy`. `actualNow` is sampled at the beginning of
   `issue()`, before constructing/dispatching its wheel. Thus the recorded
   outlier already exists before that particular input's application handlers.
   There is no synchronous catch-up loop, but overdue events are subsequently
   compressed by the minimum-delay chain until absolute deadlines are regained.
   Exact enqueue time, requested timeout argument and timeout callback exit are
   not recorded; the complete scheduling path cannot be reconstructed.

   The immutable plan SHA-256 is
   `07a6cf0e4d50ed0076086a04e82fd1be92c701b79c08f1de88e4bad99ce87707`:
   86,100ms, 2,040 events. Its 2,039 intervals comprise 839×40ms,
   1,180×16.666667ms, ten×2,016.666667ms and ten×516.666667ms, rounded here to six
   decimals. Each pair matches every planned time, delta, prevented flag and
   native before/after coordinate exactly. That validates the spatial input
   sequence; it does not make same-time source/local frames equivalent.

2. **The large local tail consists of a few post-stop delays and their catch-up
   descendants.** All indices below are zero-based. Fresh local event890,
   `footer.forward.immediate-reverse`, is due at35,500ms and issues at35,654ms:
   **154ms late**, after native40569. Events890–902 account for thirteen
   consecutive lateness values over25ms. That first delay does not recur in
   warm local: event890 is on time.

   Event1150, `footer.reverse.immediate-reverse`, is due at45,600ms after the
   prior event due43,583.333ms, at native **39833 / story691.9024**. Fresh local
   issues it at45,813ms (**213ms late**); warm local at45,817ms (**217ms late**).
   Events1150–1165 and1150–1167 respectively remain over25ms late. Their
   succeeding issue intervals are approximately3–8ms in the quantized records,
   instead of the planned16.667ms. These are not sixteen/eighteen independent
   200ms blocks. Both source runs issue event1150 at45,599ms; source event890
   issues at35,499/35,500ms.

   Fresh source/local p95 lateness is **2/2ms**, p99 **5/68.85ms**, maximum
   **38/213ms**; warm source/local p95 **3/2ms**, p99 **4.67/7.20ms**, maximum
   **12/217ms**. Counts over25ms are **2/29** fresh and **0/18** warm. Both fresh
   source outliers are isolated footer reverse-travel events1037/1039, not
   these stop resumptions. The stable local feature is a specific authored
   resume phase, not a demonstrated regular160ms housekeeping period or a
   delay after every2s pause. No periodic culprit is established.

3. **Callbacks continue throughout the local late-input window.** From the
   event1150 deadline until its issue, each local run contains **13 observer RAF
   callbacks**. Their actual callback intervals are15–18ms; their RAF-stamp
   intervals are approximately16.06–17.20ms. Every observed nativeY remains39833
   and every story attribute remains691.9024 until input issues. Probe costs in
   these windows are0–1ms. The first fresh event890 delay similarly contains
   nine callbacks, with15–18ms actual intervals.

   These callbacks rule out one continuous content-JS block spanning the entire
   recorded213–217ms interval. The unchanged story while nativeY is unchanged
   is not evidence of a scene failing to consume new scroll input. Scheduling
   policy, intervening short work, task prioritization and presentation are not
   identified by this observation. Calling it an input-path measurement symptom
   does not prove it is harmless or independent of application load.

4. **Timestamp precision and lifecycle do not explain away the maxima.** Every
   recorded `actualNow`, input `receivedNow`, input `eventStamp` and observer
   `callbackNow` in the four runs is an integer millisecond. RAF stamps retain
   fractional values. Lateness reaches about−2ms at its minimum; local
   `callbackNow - rafStamp` can be about−0.84ms. Do not infer sub-millisecond
   ordering or exact callback service duration by mixing these fields. Their
   quantization cannot account for a213–217ms difference.

   Both initial and final states are focused/visible, complete at zero, with
   fonts loaded and motion enabled. Every frame records focus1/hidden0; all
   lifecycle arrays are empty; all2,040 wheels issue and none is prevented.
   Native RAF identity is retained. Fresh local loads two cached chunks at
   approximately2.944/2.945s elapsed; the warm local run loads no new resources,
   but repeats the45.6s outlier. These records exclude observed focus loss,
   hidden-tab capture and a resource load at that outlier. They do not certify
   browser foreground scheduling internals or equal machine load.

5. **Native wheel telemetry does not reproduce the same 200ms symptom, but its
   existing stop is not the same experiment.** The host plan supplies734 trusted
   wheels per page, ±114px/mode0, zero prevented, no observed lifecycle loss and
   no new resources. Host issuance maxima are48.75/44.51ms source/local.
   Capture-listener coordinates differ on730/734 wheels by up to109.716796875px;
   these are before default/APZ application. Ordinal or wall-time equality
   remains inadequate for pose grading.

   At the first reverse wheel after the native plan's3s full-footer stop,
   source nativeY first changes **31ms** after its page wheel receipt and its
   story metadata changes in that same sample. Local nativeY changes after
   **22ms**, and story metadata after **39ms**. These are observer-sampled
   responses, not physical-input or presentation latency. This native stop is
   at source40837.03515625/local40837, unlike the approximately2s macro stop at
   39833. Its APZ history and capture workload also differ. It cannot exclude a
   problem at the macro's exact stop or other regions. Epoch-converted host to
   page receipt differences additionally mix clocks; a small negative local
   minimum is retained, not interpreted as negative latency.

6. **A strong native metadata phase difference merits one discriminating
   observation.** For moving native samples with270<story<713.9, invert frozen
   `frameFromProgress` into its implied native coordinate:
   `1392 + (122 + (story - 100) * 0.48) / 416.72 * 39445`.
   This is a metadata timing diagnostic, not a rendered-pose model. The geometry
   matches the retained wide measurements; source metadata has two decimal
   places, local four. On source, **1294/1296** such samples correspond to
   current observed nativeY within0.25px, consistent with score rounding. On
   local, **1308/1309** correspond to the **preceding observer sample's nativeY**
   within0.003px; none corresponds to currentY within that tolerance. The one
   exception is retained in the JSON residual maximum, not normalized away.

   Only **two** moving immediate-region source/local samples match exact nativeY
   and direction: forward40613.91796875 has story709.09/708.5868; reverse
   25142.18359375 has368.56/368.9732. Those attributes are consistent with the
   preceding-sample pattern. Two points do not establish whole-route pose parity
   or a recurring visible defect. ExactY/direction alone still does not match
   velocity, callback phase or material history. No unmatched pose is graded.

   Frozen `journey.animate.ts` retargets on the scroll callback. For target
   story≥270, `journey-scrub.ts` immediately snaps the clock value, but
   `request()` publishes it through a requested journey RAF. Earlier story uses
   the recovered480ms scrub. `journey-presentation.ts` writes the story/opening
   attributes during that render; neither observer records the write time or
   the app callback's RAF stamp. A standing observer can therefore read old
   attributes before a later app callback in the same rendering opportunity.
   The data cannot distinguish that ordering from publication in a later
   opportunity, nor show when Three work or presentation finishes.

**The next useful measurement is a bounded publication-phase trace, not an
optimization.** Root can retain the same candidate/provenance and add a passive
`MutationObserver` for only story/opening attributes, alongside existing
wheel/scroll/RAF receipts and local `journey-frame` notifications. Store rows
in memory, with nativeY, attribute values, `performance.now()` and the most
recent observer RAF stamp. Observe a short native forward/stop/reverse window
in the immediate story region; for the200ms question specifically, preserve
the macro lead-in to39833 and its approximately2s pause, then issue the resume
through the timestamped host native-wheel path. A seek to39833 alone does not
reproduce its history. Do not add storage, geometry reads, renderer wrappers,
GPU uniform reads or an independent page input timer to that trace.

That measurement distinguishes a late input receipt, late native movement and
an attribute publication after the standing probe. If local publication follows
the probe before the next observation, the old-value sample is located within
that interval; it is still not automatically assigned a presentation boundary.
Only refresh/presentation markers or properly matched moving pixels can settle
that final boundary. Matching nativeY and direction is necessary for comparing
those pixels; elapsed time or event ordinal alone is insufficient. The current
files cannot close that presentation question.

There is **no evidence here assigning the213–217ms tail to synchronous checkpoint
storage**. R19's958→136ms parent-CPU intervention isolated native history writes,
not a new R20 storage cause, and did not cure cadence. The frozen R20 `save()`
still uses session storage, but no save/storage entry/exit spans are present.
Intervening RAF callbacks contradict a single continuous213–217ms content-thread
storage call. Short work contributing to timer scheduling remains possible and
unattributed. Routine saves, footer idle timers and graphics loops are not
promoted to culprits on call-site existence alone.

The observed early-story gap excess remains20/25 then25/26 source/local, and
footer8/3 then1/4; this analysis does not turn those unstable differences into a
new stable local scheduling regression. The native metadata finding is from one
recorded EN-wide pass, not new unrecorded cadence, AR/narrow, hardware input,
per-frame Three pose or monitor-presentation coverage. No FPS or stutter-cure
claim is made, and no application fix is proposed by this offline task.
