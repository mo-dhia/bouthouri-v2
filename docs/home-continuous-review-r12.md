# HOME continuous review — R12

2026-10-27. Fresh adversarial review of the production candidate **c4c36bf**
(including **218d9ca**, the new native reading hero). Checkout HEAD was
**73513cd**, its subsequent documentation-only commit. **Not accepted: one
established P2 clone defect remains in Arabic reading navigation.** No new P1
or repeatable broad normal-motion divergence was established. This is a visual
review disposition, not acceptance based on the parent's checks/build/SSR run.

## R12-01 [P2] — Arabic reading MENU changes sides and overlaps the logo

Reproduce on both existing `/ar` pages, with entry complete and menu closed:

1. Activate the existing reading-mode control.
2. At **2544×1392**, scroll natively to **y1392**; at **538×825**, use **y825**.
3. Look at the persistent header as the opening chapter reaches its start.
4. Return to motion and re-enter reading; the same horizontal error returns.

Source keeps the side MENU on the right. Local moves the actual control to the
left, where the Arabic label overlaps the persistent identity mark. The error
is visible during the moving sweep, not only in a DOM measurement.

| Reading chapter start | Source button x/y | Local button x/y | Equal button size |
| --- | --- | --- | --- |
| EN wide, y1392 | 2340.52 / 75.85 | 2340.52 / 75.85 | 101.73×44 |
| AR wide, y1392 | **2327.98 / 75.85** | **101.75 / 75.85** | 114.27×44 |
| EN narrow, y825 | 441.73 / 16 | 441.73 / 16 | 64×44 |
| AR narrow, y825 | **431.47 / 16** | **32.27 / 16** | 74.27×44 |

Primary evidence in `/tmp/gazzar-continuous-r12/`:

- `ar-reading-menu-paired.png` is a native-scale paired header crop.
  `source-ar-narrow-reading-chapter.png` and
  `local-ar-narrow-reading-chapter.png` show the right-side source label and
  local logo overlap directly.
- `ar-reading-menu-repeat.json`, paired
  `*-ar-wide-menu-overlap-repeat.png`, and the `ar-{wide,narrow}-reading.json`
  state records repeat the error at identical native positions and viewports.
- `{source,local}-reading-ar-wide-clean.mp4` and
  `{source,local}-reading-ar-narrow.mp4` show it during the continuous native
  reading sweep, especially around replay4–6s.

Fix target: `src/components/layout/header/header.module.css` `.sideMenu`,
`.readingNavigation`, `.readingFrame`, and `header.logic.ts`'s
`positionSideMenu()`. The normal `.utilities` establishes `direction:ltr`.
After relocation into the new reading frame, the control inherits RTL and
`inset-inline-end` resolves to the physical left. Source's chapter-side control
uses the physical right in Arabic too. Preserve Arabic ink direction while
restoring the original placement coordinate system. Retain the document flow
and focus-scroll behavior already corrected by c4c36bf.

The vertical/focus correction itself passed in all four pairs. Actual default
`HTMLElement.focus()` from y1892 moves both wide pages to **793.8499756**, with
the button at **723.2833252**, and then loses focus as the nav pose hides. From
y1325, both narrow pages move to **450.5**, button top **439.7833252**, and lose
focus. These are browser default-focus observations, not physical keyboard claims.

## R11 regressions retested

The exact footer → work345 → reading-footer history was repeated. At native
y24100, source story345.63/local345.6262, both clamp to **y14102.5** in reading
mode and display the current Cairo minute **18:10**. Evidence:
`work345-reading-repeat.json`. Later EN wide/narrow lifecycle repetitions also
retain matching work/footer positions.

Both clocks were then held already visible across actual minute boundaries.
No Date/clock emulation or forged time was used:

| Page | Observation | Visible change | Intersection changes after initial callback |
| --- | --- | --- | --- |
| Local | 2026-10-27T15:08:00.019Z | 18:07 → 18:08 | none, ratio1/y14102.5 |
| Source | 2026-10-27T15:09:00.021Z | 18:08 → 18:09 | none, ratio1/y14102.5 |

See `local-visible-minute.json`, `source-visible-minute.json`. Returning to each
tab also refreshed its clock to the current minute, recorded in
`return-tab-and-motion-positive.json`.

Reading-footer focus with `preventScroll:true` followed by Vawzen synthetic
Enter leaves **word / aria-pressed=false** on both. The same focus+Enter at the
settled motion footer **y40837/story714** produces **logo / true** on both.
See `reading-footer-disabled-enter.json`,
`motion-footer-positive-repeat.json`, and their paired PNGs. Thus R11-01 and
R11-02 were not reproduced on this candidate.

## Moving experience and reading coverage

Fresh `{source,local}-en-wide.mp4` cover the entire ordinary EN forward journey
and full reverse. I inspected the complete aligned **4fps** paired sequence,
`en-sequence-01.jpg` through `en-sequence-12.jpg`, including holds. Portrait
departure, opening masks/glasses, optics crossing, BUILT ON LOGIC, sculptures,
Ideas/connector, all four projects, systems/waves, footer and complete return
track closely. No additional repeatable broad visual gap was established.
`comparison-en-wide.mp4` is the aligned side-by-side review artifact.

The R11 complete AR wide/narrow and EN narrow ordinary-motion videos remain the
baseline explicitly retained for the unchanged motion pipeline. This review
does not claim new full normal-motion recordings for those three combinations.

New **12-second source/local reading sweeps** were recorded and their complete
2fps moving sequences inspected for EN/AR, wide/narrow. They hold 1s, scroll
natively over 4s to 1.36 viewport heights, hold 1s, reverse over 4s and hold 2s.
Use `*-reading-en-wide.mp4`, `*-reading-en-narrow.mp4`,
`*-reading-ar-narrow.mp4`, and **`*-reading-ar-wide-clean.mp4`**. The native
hero fade, hidden interval and reverse restoration track source. EN wide raw
y348/696/1044 gives world.25/.5/.75, copy.784/.104/.104, scene
visible/visible/hidden on both; the new behavior was also checked in pixels,
not accepted from those numbers alone. The pause control is visibly disabled
on both reading heroes.

Paired `*-{en,ar}-{wide,narrow}-reading-{0,quarter,half,threequarter,chapter,side,body,footer}.png`
and contact sheets cover the hero, body, persistent header, fixed background
and footer. The Arabic side MENU defect above is an exception to this otherwise
close correspondence.

Lifecycle repetitions exercised near-hero reading entry, six fast alternating
mode activations with 85ms requested holds, deep footer/work visits, reading
entry, return to hero and return to motion. Actual timestamps are in
`{en-wide,en-narrow,ar-narrow}-lifecycle.json` and
`ar-wide-lifecycle-repeat.json` (source) and
`ar-wide-lifecycle-local-repeat-excerpt.json` (later completed local repeat,
transcribed from its MCP response). Local has one reading wrapper while reading
and zero on return; locale navigation and fresh documents also dispose the old
wrapper. The fixed environment canvas retains element identity; local material
time stays monotonic through toggles instead of resetting. This supports the
lifetime check but does not prove internal GPU target identity or every field
pixel. No new repeatable background jump was established from the visual checks.

Fresh document → direct reading selection → native body scroll was observed on
both EN narrow pages; the local field appeared without a later pose jump being
established. See `direct-reading-after-load.json` and
`*-en-narrow-direct-reading-body.png`. This used natural loading; there was no
network delay, chunk-failure injection, OS/reduced-motion emulation or storage
mutation. It does not prove every possible delayed-runtime ordering.

Actual reading-menu open and close controls completed on both pages, retaining
y0, with matching settled Arabic menu layout/current Cairo digits. See
`reading-menu-control-repeat.json`, `*-ar-wide-reading-menu.png`. A final
settled project eligibility/reverse repetition matched in
`project-gate-reverse-repeat.json`: Wujhat's text link is eligible around
story308/314, then inert/tab-1 at the hero. The first gate probe had no matching
mark-path selector, so it does not renew R11's precise drawn-mark hit-gate claim.

## Source resize anomaly and failed controls

A real **source-origin resize difference** must remain visible in the record.
While already reading, resizing AR narrow → wide clears the source portrait
canvas; local retains its portrait. The source canvas remains visibly blank
through the reading sweep and restores after motion → reading. The disappearance
repeated even with source foregrounded. See
`source-ar-wide-resize-active-repeat.png`, paired
`*-ar-wide-resize-portrait-before.png`, `*-ar-wide-resize-portrait-retoggle.png`,
and `portrait-resize-investigation.json`.

Accordingly the original **`*-reading-ar-wide.mp4`** pair contains this source
rendering anomaly and must not be used to claim ordinary hero parity or a local
portrait defect. The **clean** repeat enters reading at the final viewport size
and restores a valid paired portrait control. Deliberately making the local
portrait disappear is not proposed here; the parent must resolve the intended
source-bug contract before claiming parity for that resize history. This source
exception is separate from the established local Arabic MENU regression.

Other controls/exclusions:

- The first recorder command used unavailable `python`; no recorder started.
  Its preliminary replay was stopped/reset at y0 before the authoritative
  source recording. All actual recordings use `python3`.
- A textContains search for the reading control matched no visible text;
  a selector snapshot then identified the actual button. Failed uid calls
  made no activation. Narrow language controls are hidden outside the menu;
  locale switching used the visible menu language link instead.
- Reading-control MCP clicks warned that the hero could intercept them. Both
  actual reading states were checked; these are synthetic handler activations,
  not physical pointer-hit evidence for that control.
- The first normal-footer Enter control happened before the motion layout
  finished restoring and remained around y14102/story125. It was invalid as a
  positive control. The settled y40837/story714 repeat succeeded on both.
- An initial scripted Escape failed to close the reading menus. Subsequent
  scripted hidden mode activations in that open-menu run are excluded from
  normal-use parity conclusions (`ar-wide-lifecycle.json`). Actual visible
  close buttons and closed-menu lifecycle repetitions replaced it. The local
  close animation had not finished at the first repeat's entry guard; it
  completed later. No durable menu-close defect was established.
- The initial post-locale gate probe sampled pending source navigation/pose
  restoration. Its first y0 and transient inert observation are excluded; the
  stable repeat matches. Source console capture was disabled, so no console
  diagnosis of its portrait anomaly is claimed.
- Thin blue edge/scrollbar pixels occur in some MCP captures. They are not
  treated as design differences. Initial marquee/field ages are not perfectly
  synchronized. No defect is inferred from a lone event-phase offset.

## Provenance and scope

Only **Vawzen**, existing source tab37/local tab36, and existing window
**0x5400a09** were used for browser control. No new tabs/windows/iframes/profiles,
width-style changes, native input, app-code changes, tests, typegen, builds,
package operations, preview-server operations or commits were performed.
This report is the sole repository edit owned by this reviewer.

The ordinary replay dispatches 580 **untrusted WheelEvents**, applying simulated
default `scrollBy` only if unprevented. It reaches native40837/story714 and
returns to y0/story0 on both. It is not hardware wheel/trackpad evidence.
Reading sweeps use per-RAF `scrollTo`; focus uses actual default `.focus()`;
Enter is Vawzen's synthetic key path. Requested cadence and actual timestamps
are preserved in the telemetry/protocol files.

Window-only X11 recording used crop offset **55,45**, wide 2544×1392 or
narrow 538×825, DPR1. Wide output is 1600×876/30fps; narrow output 538×826/30fps.
No offscreen-capture workaround or new window was needed. Each recorder logs
`firstFrameWallTime`; extraction trims before sampling. No extraction/encoding
ran concurrently with a live capture. Unequal post-roll is not used to infer
origins. Evidence is under `/tmp/gazzar-continuous-r12/`.

Finite coverage cannot establish universal equality of appearance, experience
and animation. In particular, R12-01 prevents visual acceptance of this candidate.

## Browser release

**Explicitly released at 2026-10-27T15:28:34Z**, after every pending browser call
completed. No browser calls followed the release.

`local-release.json` at 15:28:32.379Z and `source-release.json`
at 15:28:33.982Z verify both original tabs at plain `/en`, x0/y0, entry complete,
motion enabled, menus closed, sound disabled, story/opening/world zero,
**2544×1392 CSS / DPR1**, zero reading wrappers, zero iframes and no remaining
review probe globals. Source tab37 is active; inventory contains only 37 and 36.
All twelve R12 recorder processes were checked against their own metadata:
none remained live and all output logs had finalized. The reviewer made no
page style changes requiring restoration.

Actual outer dimensions are **2654×1502 at -47,-5**, with the original content
offset 55,45 and screen content origin 8,40. Root retains ownership of all fixes,
builds and preview processes. R12-01 is reported for correction and a fresh
paired verification; no fix was implemented or accepted by this reviewer.
