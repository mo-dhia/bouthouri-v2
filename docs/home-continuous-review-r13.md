# HOME continuous review — R13

2026-10-27. Fresh adversarial review of **31f4beb**, the frozen hero-only
change against **ccecf64**. Production was `http://localhost:3000`, served by
the parent's single preview PID 1066364. **Not accepted: two confirmed P2
reading-history defects remain.** The Arabic reading MENU correction passes.
The user's **whole-experience flicker/stutter blocker remains open**, independently
of the reading surface results below. No universal appearance, experience or
animation parity is claimed.

The parent reported 151 tests / 4,233 assertions in check, plus build and an SSR audit of 14 assets passing.
This reviewer ran no tests, typegen, check, build, package operation, application
server operation or commit, and changed no application code. Those engineering
checks are context, not visual acceptance.

## R13-01 [P2] — reading fallback omits the departure mask after context loss

Paired live reproduction in the existing AR documents, **2544×1392/DPR1**,
reading enabled, entry complete, menu closed and sound off:

1. Scroll to native **y696** with the hero still visible.
2. Lose only the portrait canvas's existing WebGL2 context through its
   `WEBGL_lose_context` extension on each page. Both report ready=false and
   expose the server photograph. Neither initially writes a fallback mask.
3. Scroll natively from **696 to 697**, then observe the actual pixels.

Both pages now have world **.5007**, image rect **(0,-849,2544,1696)** and a
visible photograph. Source applies this mask to `[data-portrait-entrance]`:

```text
linear-gradient(rgb(0, 0, 0) 6.491%, rgba(0, 0, 0, 0.844) 24.491%,
rgba(0, 0, 0, 0.5) 42.491%, rgba(0, 0, 0, 0.156) 60.491%,
transparent 78.491%)
```

Local retains an empty inline mask. The local lower face, neck and shirt remain
plainly visible with a hard photo edge, where source fades into the background.
This is a pixel difference, not only a dataset or model assertion.

Evidence under `/tmp/gazzar-continuous-r13/`:

- `source-ar-reading-contextlost-nextwake697.png` and its local counterpart.
- `source-contextlost-state.json`, `local-contextlost-state.json`.
- `source-native-trace.json`, `local-native-trace.json`, whose context marks and
  native scroll/attribute timestamps preserve the ordering. Local state was
  sampled at **16:03:53.540Z**; source at **16:03:56.289Z**.

The source's cached portrait tick, in
`/tmp/gazzar-runtime/2gz902oulp4x8.js.pretty` around lines 472–509, writes the
five-stop fallback before its `!en` return. The reduced `tU` supplies translation 0
and scale 1. `hero-reading.ts` samples/render-calls the optional portrait before
its body early return, but never updates that fallback mask; the available mask
handling in `hero.animate.ts` belongs only to normal motion. The reading
graphics branch returns immediately while its context is lost.

The inspected cache SHA-256 is
`89f51c401d9cc48c6ba2da1d0b0bde6418cd1b354a5f71a4ff00f51beb0227de`.

Fix target: reading's eligible native-wake render path in
`src/sections/landing/1-hero/hero-reading.ts`, using the existing
`portraitFallbackMask(exit,0,1,heroHeight)` and owned entrance-style cleanup.
Preserve the document/menu guard and update before hidden/cached-body returns.
Readiness itself must not invent a reading wake. Cold preparation/failure may
share this missing path, but the live proof here is the completed-context-loss
history.

**Do not require an immediate loss-event wake from this finding.** The source's
lost-before-native-wake sample also had an empty mask. The visible difference
is established on the next native wake. Both contexts were explicitly restored;
the following native wake at696 removed source's mask. No source renderer draw,
canvas conversion, clock override, storage change or asset mutation was used.

## R13-02 [P2] — a real reading resize changes local scroll position and draw history

Reproduction repeated in **AR and EN**, and again from freshly reloaded EN
documents to remove locale-navigation history as a confound:

1. At narrow **538×825/DPR1**, complete entry in motion mode, scroll to native
   **825**, then activate reading. Confirm reading-ready while the hero is hidden.
2. Keep that tab foregrounded and actually resize the existing window from
   outer 648×935 to 2654×1502, producing CSS **2544×1392**.
3. Observe position and the following portrait wake before issuing another scroll.

| Fresh EN control | Before resize | After resize | Result |
| --- | --- | --- | --- |
| Source | native 825, narrow reading | **native 825**, world .5927, wide | Hero becomes visible; positive budget permits exit .7805 draw. |
| Local31f4beb | native 825, narrow reading | **native 1392**, world 1, wide | Hero remains hidden; no corresponding partial draw occurs. |

The browser-visible chapter position is different as well as the portrait's
later retained contents. On the original sequence, returning directly to 0 draws
the full local portrait using its still-unspent budget; source retains the
partial field drawn at825. Correcting local to 825 first is useful as a surface
control but **does not repair or close this original trigger/history defect**.

Evidence:

- `fresh-reload-resize-states.json` and paired
  `{source,local}-fresh-en-resize-history.png` are the strongest history control.
- `resize-native-position-repeat.json` and paired
  `*-en-positive-original-resize-history.png` reproduce it in the earlier EN run.
- `local-native-trace.json` has repeated `positive-exact-hidden825` /
  `positive-resize-native-anchor` marks, size writes and the subsequent y1392
  scroll, preserving the earlier AR observations.

The final control **force-reloaded both existing EN documents**. Both reported
`PerformanceNavigationTiming.type=reload`; actual MCP QUIET clicks were followed
by observed complete/motion/y0 in the foreground before each narrow protocol.
Source reported appBoot=ready and localeRestored=none. Local had main.page=landing
and no equivalent restore marker. This fresh repetition again produced825→825
on source and825→1392 locally. It is not dependent on the earlier local same-doc
AR→EN navigation or the inherited source's older document.

Owner diagnosis remains open. Computed `overflow-anchor` was **auto on both**
html, body, main, identity, scene and the following chapter wrapper. A temporary
delegating `window.scrollTo` probe recorded no application call for the local
shift. That excludes only this API; it does **not** prove native scroll anchoring
or rule out Element.scrollTop, source restoration, another scroll API or a
layout-driven adjustment. No scroll policy was changed to obtain these results.
Review targets are reading layout/resize integration and the surrounding native
scroll ownership, not a change to the portrait material or a universal blackout.

## Surface controls that passed

The new reading gate was checked against the supplied source trace
`/tmp/gazzar-reading-resize-r13/native-trace-final.json` and independently in
live pixels. Its conditional behavior is required; a generic resize-hide rule
would fail the positive-budget control.

- **Spent budget:** fresh foreground reading remount at wide 0 produces prepared
  initialization. Native0→1 draws once. A real wide→narrow image-size change
  then clears without another draw; returning wide remains blank on both.
  Paired `*-ar-spent-{narrow,wide}.png` show the disappearance. Source's first
  preliminary run spent on visibility return; a separate controlled repeat
  removed that tab switch and demonstrated the explicit first native wake.
- **Positive budget / frozen alpha:** source's hidden-hero narrow 825 remount
  keeps the draw budget. Its wide resize at unchanged native 825 draws exit .7805;
  native return 0 freezes that partial noise/luminance alpha field. Because of
  R13-02, local required an explicitly recorded native 825 correction after its
  resize. At that controlled position it also draws .7805, then freezes on return 0.
  `source-ar-positive-frozen-return-zero.png` and
  `local-ar-positive-frozen-matched-native0.png` were inspected directly and
  track closely. This supports the material/view calculation only under those
  measured equal positions; it is not an original-history pass.
- **Initial reading pixels:** fresh AR wide/narrow and EN wide reading portraits
  were captured. No new repeatable resting asset, size, alpha or layout defect
  was established in those controls.
- **Moving reading:** fresh 12-second EN-wide and AR-narrow source/local sweeps
  hold 1s, travel natively to1.36 viewport heights over 4s, hold 1s, reverse over 4s
  and hold 2s. Their complete 4fps paired sequences were inspected, including
  departure, hidden hero, chapter-side navigation and return. They track closely
  without a resize in the sweep. Use `*-reading-en-wide.mp4`,
  `*-reading-ar-narrow-clean.mp4`, associated telemetry and the three
  `*-sequence-*.jpg` sheets for each pair.

These controls do not close the two failures above. The real height-only resize
control 2544×1392→2544×1292, with unchanged image 2544×1696 and no size writes,
remains source evidence from the implementer's recorded trace; it was not newly
repeated by this reviewer.

## R12 Arabic MENU and focus regression

The 50edb80 reading-frame LTR coordinate correction passes in the served candidate.
The Arabic side MENU remains on the right and no longer overlaps the identity
mark. Paired wide/narrow PNGs and `controls.json` preserve these measurements:

| Reading chapter start | Source and local button rectangle |
| --- | --- |
| Wide native 1392 | x2327.9834 / y75.8500 /114.2667×44 |
| Narrow native 825 | x431.4667 / y16 /74.2667×44 |

Default `.focus()` without preventScroll was also repeated. From wide 1892 both
move to 793.8499756, button top 723.2833252, then lose focus as that navigation
pose hides. From narrow 1325 both move to 450.5, top 439.7833252, and lose focus.
This retains the R12 focus correction. These are browser default-focus
observations, not physical keyboard coverage.

## Async ownership, cleanup and limits

Offline review covered both callers' import/abort ordering, decode ownership,
the single-canvas WeakMap, compilation completion/disposal ordering, geometry
invalidation, preparation versus first native draw, and reading's lack of
pointer/audio/frame-loop installation. The normal render/shader body remains
unchanged by the frozen patch. The added tests use a real controller with a
non-GPU renderer double; their manual compile promises do not prove driver or
presented-pixel behavior.

Live EN rapid toggles exercised eight alternating actual mode controls, requesting
5ms holds. The actual intervals were much longer and unequal, approximately
32–69ms on source and113–201ms locally, recorded rather than represented as
5ms input. Readiness remained false through successive pending preparations;
after settlement both retained the original single portrait canvas and ready
prepared reading surface. Seven intermediate replacements never drew. In each
trace, eight program creations/deletions and four buffer creations/deletions
were observed across the existing-owner replacement and final surviving owner.
Only the final prepared renderer submitted a new draw during the rapid run.
See `*-rapid-mode-trace.json`, `controls.json` and paired `*-after-rapid.png`.
No stale completion clearing or drawing over the final owner was observed.

Native texture counts include Three's renderer setup and are not a complete
GPU leak audit. This review does not establish every internal target identity,
allocation lifetime, driver failure or ordering during context loss *while
compileAsync itself is pending*. Context loss/recovery above exercised completed
reading controllers. No failure/delay chunk injection, CPU profile or physical
pointer/wheel/trackpad input was performed in this portrait slot.

The R12 full EN ordinary forward/reverse and the retained R11 AR-wide/narrow
and EN-narrow ordinary videos remain the prior baseline for unchanged normal
rendering. This reviewer did not renew full ordinary HOME coverage in R13.
A new short EN normal-entry attempt is explicitly **excluded as an ordinary
parity pass**: source/local telemetry shows mismatched boot histories. Source
remained loading/ready while the intended QUIET activation should have started
assembly; local was assembling. That local per-RAF seek run also contains stale
hero-world samples followed by jumps. These artifacts are retained in
`*-normal-entry-en-wide.mp4`, telemetry and sequence sheets for controlled
follow-up, not dismissed as a proven harmless offset or promoted to a new
isolated rendering finding. The open user smoothness investigation must resolve
actual update/presentation behavior with controlled boot and input conditions.

**The whole-page flicker/stutter report in
`docs/home-smoothness-user-review-r13.md` remains OPEN.** Reading pixel matches,
the prior 30fps recordings, these 4fps inspection sheets and engineering checks
cannot close it. No presented-frame FPS or CPU-cause claim is made here.

## Provenance, exclusions and release

All evidence is in `/tmp/gazzar-continuous-r13/`. Only Vawzen and the original
source tab37 / local tab36 in window 0x5400a09 were used. No new tab, window, iframe, profile,
emulation, native input, source clock/storage change or source asset mutation was
made. Native GL draw/size/resource probes delegated exactly to their originals;
their restore closures removed observers/listeners and restored descriptors.
They never requested a renderer draw or canvas conversion. Both contexts were
restored after their paired failure controls; later full reloads also removed
document instrumentation.

Video used window-only X11 crop 55,45, with wide output 1600×876/30fps and narrow
538×826 / 30fps. Requested replay timing, actual RAF/native positions and recorder
firstFrameWallTime are retained. Extraction aligned to replay start and occurred
only after every capture finished. Four authoritative reading files contain
12-second replays; excess post-roll is excluded. The initial non-clean AR-narrow
pair timed out at the MCP's in-page result limit and was replaced by an
asynchronously launched, completion-verified clean pair. The initial normal
recorder's automatic finish caused its first metadata-stop command to find no
process; metadata was finalized from its own log without touching another PID.
All eight recorder logs subsequently finalized and none remained live.

The initial positive-budget local repeat that scrolled immediately after mode
activation returned to 0 during layout restoration; that invalid setup is not
used as the825 resize control. Later repetitions explicitly verified825 after
settlement. Thin blue capture-edge/scrollbar pixels are not design findings.
MCP mode-click interception warnings are retained; actual resulting modes were
checked. Synthetic handler activation is not a physical hit-test claim.

**Explicit browser release: 2026-10-27T16:15:54Z.** No reviewer browser call
followed it. Final state/flags were sampled at 16:15:53.094Z(local) and
16:15:53.199Z(source), preserved in `release.json`: both original plain `/en`
documents, x0 / y0, motion enabled, entry complete, menus closed, sound off,
2544×1392 CSS/DPR1, one portrait canvas, no reading hero/probe global/iframe;
source tab37 active. Outer 2654×1502 at -47,-5 and the original content offset 55,45
were retained. `recorder-completion.json` confirms no live reviewer recorder.
The sole repository edit owned by this reviewer is this report. Fixes and a
fresh served review belong to the parent; 31f4beb is not accepted.
