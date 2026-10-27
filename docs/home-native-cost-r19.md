# HOME native costs and history isolation — R19

2026-10-27. Captured application: **`6f55075`**, production BUILD
`buyy0OD6hWPIKX2N4wX5-`. This report concerns EN at 2544×1392 CSS/DPR1,
optical/footer diagnostic slices. It does not evaluate the subsequent R20
navigation patch or accept whole-page smoothness, AR/narrow parity, or presented
FPS. Capture operation and restoration belong to
[the capture provenance](home-native-capture-r19.md).

## Result and supported action

**Repeated native history checkpoint writes are a demonstrated avoidable CPU
load under the programmatic scroll plan.** The largest measured local excess
in the source/local pairs is Firefox's shared parent GeckoMain, with named
browser location-change, URL-bar and related system JS work. A subsequent
same-document intervention withheld only matching checkpoint writes: parent
thread CPU fell **958→136ms** across the two 3.8s phases, and sampled browser
`onLocationChange` work disappeared. This supports fixing checkpoint persistence
before changing rendering quality, easing, clocks, or geometry.

**It does not demonstrate a stutter cure.** The intervention's observed RAF
counts changed 207→210, gaps over 25ms 14→13, and p95 gap 26→27ms. One ordered
before/after recording establishes a substantial load contribution for this
input method, not the cause of every remaining callback gap or a general
physical-wheel result.

Content-main CPU totals in the original paired slices were similar, with lower
local style/reflow totals. Neither those costs nor the material-loop samples
justify a speculative graphics simplification. Shared rendering/paint tails
remain visible and require separate interpretation after the checkpoint fix.

## Coverage and comparable ranges

All retained files are local processed Firefox Profiler JSON, raw format 37 /
processed format 76. JavaScript, native stacks, process CPU and ordinary memory
tracking were enabled; screenshots/allocation tracing/IPC tracing were off.
Analysis reads no browser state and makes no network or symbolication requests.

- **Optical:** `source-optical.json.gz` and `local-optical.json.gz`, named
  Graphics-derived filters,16MiB/1ms. Comparison phase **[506,3801]ms**,
  duration 3295ms. Source PID 18913 / innerWindowID 803158884387 retains both native
  task boundaries and surrounding samples. Its fast-run receipt export was
  lost: the similarly named old source driver is **not** evidence for this run.
  Local PID 52983 / innerWindowID 2304249954305 retains the end marker and all 70
  actual receipts; samples begin207.47ms and relevant native marker stamps
  203.91ms before its first receipt. The missing start is evicted idle lead.
  This is a common relative-phase comparison, not a receipt-by-receipt source
  timing or geometry match. Exported track coverage differs: source12 threads /
  4 PIDs, local349 /39. Identical recorded settings do not prove identical
  background load or export coverage.
- **Footer:** `source-footer.json.gz` plus
  **`local-footer-replacement.json.gz`**,64MiB/1ms; filters respectively
  `pid:2,pid:18913` and `pid:2,pid:53900`. Common phase **[501,18401]ms**,
  duration 17900ms. Both sets of450 receipts lie inside that window. Planned
  times, native before/after positions and prevented-input flags match
  row-for-row; native travel is33385.33203125→40201. Source samples/marker
  stamps begin61.38/56.16ms before its first receipt. Replacement local
  samples/marker stamps begin241.68/233.06ms before its first receipt. The
  replacement end marker identifies PID 53900 and innerWindowID 2347199627265;
  its actual driver lasts 18411ms, so the comparison omits its last 10ms of tail.
  Exported coverage is160 versus154 threads, two PIDs each.

For receipt-backed runs, native phase origin is **retained end-marker time
minus actual driver elapsed time**. Each receipt uses its actual elapsed
timestamp, not its planned deadline. Allow roughly millisecond clock
quantization. Source optical instead uses its retained native start. Relevant
style/reflow/refresh marker extents and sample extents cover the selected
ranges; selected page-marker families have no incomplete interval pairs.
An extent check alone does not prove completeness of every possible marker.

PID 2 is the actual Firefox Flatpak namespace parent. Exported PIDs are not host
OS PIDs. The old **`local-footer.json.gz` contains only parent PID 2**, no
localhost identity or task marker: its stale52983 filter missed the new
document's53900 process. It remains excluded. The earlier12s source attempt
`source-optical-range-incomplete.json.gz` is also excluded. Evicted idle lead is
not reconstructed or presented as measured coverage.

## Original source/local cost pairs

Values below are source→local. Thread CPU is the sum of recognized nanosecond
`threadCPUDelta` values within the selected interval, converted to milliseconds.
It is not elapsed main-thread blocking time. Assigning those deltas to sampled
functions/categories is statistical and can attach preceding work to an Idle
or waiting stack.

- **Optical 3295ms:** content main **1221→1192ms**; shared parent main
  **116→1017ms**; Renderer346→389ms; Compositor98→103ms. The parent excess is
  about 901ms; renderer excess is about 43ms. Page-associated stack subsets account
  for993→830ms, not all native-only content work.
- **Footer 17900ms:** content main **5135→5081ms**; shared parent main
  **619→2929ms**; Renderer2043→2405ms; Compositor548→538ms. Parent excess is
  about 2309ms versus 362ms on Renderer. Page-associated stack subsets account for
  3814→3240ms. These are selected-thread results, not whole-machine CPU totals.

The parent is shared with other Firefox windows, extensions and browser UI.
The original pairs alone cannot assign all its excess to the page. Nevertheless
the local parent contains a concrete named pattern: inclusive
`browser.js:onLocationChange` samples account for about 286ms optical and 631ms
footer; corresponding sampled work is absent in the reference intervals.
Overlapping local stacks include URL-bar `setURI`, browser-category listeners,
translations and extension dispatch. Inclusive values overlap and must not be
added. These names support a browser navigation/UI path, not a GPU explanation.

There are **no collected IPC markers** in the inspected parent/content ranges,
and `ipcmessages` was not enabled. The files cannot supply SessionHistory IPC
message counts, round-trip durations, or a cross-process causal trace. Absence
of those markers does not mean absence of IPC.

## Assigned-page JS and native marker costs

Packed shared source/function tables were decoded against the actual v76
exports. Local function positions were checked in the preserved 29-file
`/tmp/gazzar-native-r19/local-build-6f55075-chunks/` copy, not a later `.next`
build. Source URLs/columns remain in the narrow JSON outputs. Many native
`fun_*`/address frames remain unsymbolicated and are not assigned invented names.

Relevant sampled JS owners include:

- Optical: local scene `eW` in `1xdpdod6ux-4a.js:189:22177` has about260ms
  inclusive sample-associated CPU, mapping to the natural story scene render;
  journey `eQ` in `1v9qo3e6m73uo.js:1:41380` has 105ms, including dispatched
  background work. Source R3F `eK` has 295ms inclusive. These roots cover different
  work and are not interchangeable per-render costs.
- Footer: local material tick `tC` in `2e_i-6dpxny7b.js:1:170738` has 468ms
  inclusive, with paint helper `tL` at167624 accounting for 425ms. The reference
  material loop `_` in `1lbueqoir1wno.js:1:18742` has 965ms inclusive. Activity,
  early returns and native child work differ; the subtraction is not an
  equivalent-work optimization budget.
- Local Next's native-history wrapper is visible in
  `216iyidhmrh3u.js:1:10996`: about 38ms optical /90ms footer as the nearest
  assigned JS owner. Its short synchronous call cost does not include later
  browser-parent work.

Page-identified native interval results, source→local:

- Optical **Styles 197→101ms** summed intervals, maxima 5.10→5.18ms;
  **Reflow 72.5→34.3ms**, maxima 13.35→1.33ms;
  **RefreshDriverTick 1840→1325ms**, maxima 48.91→34.94ms.
- Footer **Styles 535→428ms**, maxima 1.51→1.90ms;
  **Reflow 71.5→44.1ms**, maxima 0.68→1.04ms;
  **RefreshDriverTick 4839→4630ms**, maxima 14.33→19.80ms. Neither footer has a
  page refresh interval >25ms in this profiled common range.

The positive page-specific local excess is **scrollend handling**: page-tagged
DOMEvent marker wall intervals total 6.89→119.78ms optical and 28.18→374.78ms
footer; their unions equal those totals here. These are marker records, not
unique DOM-event or native-input counts. Conversely scroll-handler marker
totals are lower locally, especially footer 1012→230ms. More expensive
scrollend work can therefore coexist with similar aggregate content CPU.

Native-only paint/display-list markers lack a page identity and stay
**content-process scoped**: WrDisplayList sums 236→174ms optical and 764→612ms
footer; maxima 10.12→12.98ms and 4.32→2.02ms. Shared Renderer `Composite #34`
wall-interval p95 is 23.59→27.40ms optical and 13.24→17.98ms footer. Those
intervals may include waits and are not hardware GPU durations or presented FPS.
Do not add display-list, refresh, composite and presented-payload spans: they
overlap and can belong to shared browser work.

Content-process GC does not show a dominant local excess. Optical GCMinor
sums 10.50→3.78ms, maxima 2.03→0.97ms; footer 36.74→35.07ms,
maxima 0.46→0.96ms. Source footer also contains a 47.06ms GCMajor **cycle
envelope**, with seven GCSlice intervals totaling 15.94ms, maximum 8.62ms. The
cycle envelope is not a 47ms continuous pause. GC/CC without a page identity
remains process-scoped; nested cycle/slice totals are not additive.

## History intervention: stronger causal evidence for CPU load

Root's separate delegating count probe ran the same 70-input optical plan while
offline analysis was active. It found **0 reference native history writes versus
146 local writes, all checkpoint-bearing**; 130 local scrollend receipts were
observed. The probe supports call frequency, not cadence. Frozen `6f55075`
`home-navigation.ts` has `onScrollEnd = () => save(true)`, alongside a 160ms
capture timer; `save` writes session storage and native `history.replaceState`.
Forced scrollend saves bypass its small-progress guard. Instant programmatic
scrolls repeatedly trigger this path, so it must not be assumed to represent
the frequency of a continuous APZ wheel gesture.

`local-history-isolation.json.gz` tests that lead within one capture, same
document53900 / innerWindowID 2347199627265,64MiB/1ms and the same PID filters.
Both phases retain their native start/end markers, sample coverage and all 70
receipts. Planned events, native before/after positions and prevented flags
match exactly between phases. Native durations are 3800.476 and 3800.404ms.

The first phase delegates 139 writes. The second withholds 143 matching writes
while the original URL and checkpoint entry remain current, preserves the
latest arguments, then restores the original descriptor and flushes once after
the phase. The saved record reports descriptor restoration. The final flush is
outside the compared phase; rendering, geometry and clocks were not replaced.

Full marked-phase CPU, before→withheld:

- Parent GeckoMain **957.76→136.18ms**, down 821.58ms (**85.8%**).
- Content main1229.12→919.15ms; Renderer386.58→350.90ms;
  Compositor115.36→107.45ms.
- Parent inclusive `browser.js:onLocationChange` samples 218.62ms→none;
  URL-bar/category-dispatch work likewise leaves the leading system stacks.

The intervention, named stack response, write-count asymmetry and frozen call
site identify a substantial avoidable native-history cost path in this session.
The exact partition of all parent CPU among SessionHistory, browser UI and
extensions is unresolved. The content CPU reduction is also subject to the
fixed before→after order, compilation/warmup and evolving material histories;
do not promise its entire 310ms as a production saving.

There is **no demonstrated cadence cure**: 207→210 observed RAF callbacks;
median gap 17→17ms, p95 gap 26→27ms, maximum 38→31ms, gaps over 25ms 14→13.
These observer statistics are not presented FPS. The A/B does not identify
R17's individual 217–223ms timer receipt delay, which already had intervening
16–18ms RAFs and was not a continuous block.

## Handoff, method checks and evidence

Proceed with reducing/coalescing redundant checkpoint writes while preserving
entry identity, Back/Forward, locale/work return, reload and final lifecycle
flush behavior. Validate the subsequent patch separately. This report gives no
reason to change assets, DPR, field quality, easing or render clocks. After the
checkpoint correction, re-evaluate moving cadence with the now-grounded native
input path and unchanged source/local scenarios; isolate remaining shared
graphics waits if the tail persists. CPU savings alone do not close full HOME
EN/AR parity or whole-site stutter.

Authoritative local extraction artifacts under `/tmp/gazzar-native-r19/`:

- `analyze-profile.py`: raw/processed table reader; known units and URL filtering.
- `analyze-native-cost.py`: paired marker phases, inherited v76 categories,
  assigned source mapping and end-marker/receipt alignment; writes the four
  accepted `*-cost.json` files, using the replacement local footer explicitly.
- `analyze-parent-history.py`: fixed system-module names, history-related marker
  search and page-tagged DOM-event aggregates; `*-history-detail.json`.
- `analyze-history-isolation.py`: single-file intervention analysis;
  `history-isolation-analysis.json` and compact companion.
- Frozen input/profile hashes and utility hashes: `analysis-manifest.json`.

The independent [algorithm review](home-native-analysis-review-r19.md) found no
concrete P1/P2 method defect in its permitted evidence and identified two P3
summaries: inconsistent quantile ranks and mislabeled prevented-input flags.
Both are fixed; the current cost summaries use consistent interpolated
quantiles and `prevented_receipts`. Relevant marker extents exclude timestamps
of long-lived animations predating recording. Phase-0 markers are instants;
start/end interval phases pair before identity filtering. Page attribution
requires assigned identity; native-only/process and parent/graphics scopes stay
explicit. No unrelated user URLs, payload bodies or arbitrary other-thread
names are included in the report.

The analyst performed offline file/code analysis and wrote this report/utilities
only. No analyst browser/native input, application edit, package operation,
build, test, server action, staging or commit occurred. Root's live operations,
independent implementation and later validation remain separately owned.
