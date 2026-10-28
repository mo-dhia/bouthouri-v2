# Final HOME menu acceptance — independent delta review

2026-10-28. **The original fresh-open dash finding is resolved in all six agreed contexts. Final HOME parity acceptance is withheld for one reproducible P2: reopening the menu retains the previous selection locally, while the source resets to its first row.** This review is complete and the browser/input slot is released. No power action was issued or scheduled.

Frozen candidate: application fix `fd6f51347b383a1af5839bcaba6784381cbcb82a`, tooling HEAD `46508977e9508ac776447555a25b61a3daa313c1`, production BUILD **`XSwsCMlhqi9I8msFQiqzn`**. The new build was verified in the actual freshly loaded local documents, as well as `.next/BUILD_ID`. Only original Vawzen tabs **source37/local36**, original Zen window **0x5400a09**, were used. Public deployment revision is unknown.

All new evidence is persistent under **`.artifacts/final-parity-20261028/menu-recheck/`**. The earlier report, recordings and evidence index were preserved.

## P2 — reopening retains the wrong selected row

Reproduction, independently repeated at 1920×1080, 768×1024 and 412×915, EN and AR:

1. Fresh HOME document, quiet entry complete, native y0; open navigation without primary-row hover or focus.
2. Native pointer selects SERVICES; move the pointer outside the page. Native Tab/Tab from the close button focuses and selects PROJECTS.
3. Native Escape completes the close. Reopen without hovering or focusing a primary row, then wait for completion.

Both pages select PROJECTS before closing. On every settled reopen, source selects **VISION / الرؤية**, while local retains **PROJECTS / المشاريع**. The corresponding dash, bright text and desktop/tablet description differ visibly. Neither page has a primary-row hover or focus at the accepted reopened capture. Desktop EN was independently repeated on a second fresh document.

| Exact CSS viewport, DPR1 | Locale | Source reopened dash center Y | Local reopened dash center Y |
| --- | --- | ---: | ---: |
| 1920×1080 | EN | 344.300 | 491.333 |
| 1920×1080 | AR | 260.133 | 461.133 |
| 768×1024 | EN | 415.250 | 490.233 |
| 768×1024 | AR | 337.050 | 461.117 |
| 412×915 | EN | 137.500 | 202.500 |
| 412×915 | AR | 152.000 | 246.000 |

Minimal proof: `reopen-finding.json`, `reopen-selection-contact.png`, and six `<profile>-<locale>-reopen-pair.png` files. Original full PNGs and pointer/keyboard/closed/reopen rect receipts remain alongside them. Desktop EN confirmation receipts have `desktop-en-confirm-<side>-...` names.

Code explanation: `header.logic.ts:343` opens a closed dialog, resets scroll and repositions the previously retained `selectedMenuItem` at 365; it does not reset selection. `selectMenu` at 439 changes selection and description. The cached source runtime `.artifacts/viewport-validation-20261028/source-runtime/15ud0rwi-a_3n.js:480` explicitly calls `C(0)` in its fully closed opening branch, corroborating the six current live reproductions. Source does not perform this reset merely for an interrupted closing timeline.

This selection-retention difference already exists in the parent implementation; it is **not attributed as a new regression introduced by fd6f513**. The new mounted regression explicitly asserts retention across a complete close/reopen, so it currently codifies behavior that differs from the source. A narrow follow-up should reset row/description selection on a new open from fully closed, retain selection during an already-open resize/font layout update, and measure the now-visible default row. Preserve the current timeline and scroll policy. This reviewer made no application change.

## Original finding resolved — fresh-open measurements and pixels

All six initial evidence captures use the exact agreed CSS canvas and DPR1, y0, fonts loaded, motion enabled, entry complete, quiet audio preference, and no primary-row hover/focus. Closed dialog layout was not modified. Menus settled before measurement and screenshots. Source and local both select their first row.

| Viewport / locale | Row center Y, source / local | Dash center Y, source / local | Local minus source | Bright dash pixel row, source / local |
| --- | --- | --- | ---: | --- |
| 1920×1080 EN | 344.017 / 344.042 | 344.300 / 344.333 | +0.033px | 344 /344 |
| 1920×1080 AR | 259.767 /259.767 | 260.133 /260.117 | −0.017px | 260 /259 |
| 768×1024 EN | 414.500 /414.500 | 415.250 /415.250 | 0px | 415 /415 |
| 768×1024 AR | 336.600 /336.650 | 337.050 /337.117 | +0.067px | 337 /337 |
| 412×915 EN | 137.175 /137.175 | 137.500 /137.500 | 0px | 137 /137 |
| 412×915 AR | 151.550 /151.550 | 152.000 /151.983 | −0.017px | 152 /151 |

Pixel rows are zero-based original PNG rows, measured over the rail's horizontal span. The two Arabic captures paint on adjacent raster rows despite nearly identical fractional DOM centers; those one-pixel results are retained, not reported as exact pixel equality. Actual paired rail pixels were inspected in all six contexts. The original 29–97px misplaced-dash defect is absent. All rails remain approximately 11px wide and 1px high at the agreed references.

`initial-pixel-results.json` retains every numeric scan, selected-row center, rail rect/transform and initial gate. Six `*-initial-pair.png` files preserve full source/local canvases; six `*-rail-pair.png` files show the inspected detail. The original individual PNGs retain their CSS viewport dimensions. Native rect receipts include actual inner/outer dimensions, native y, menu/scroller geometry, selection, focus and hover. Source controls/text were read without altering them.

## Interaction, layout and moving delta coverage

Native pointer selection of SERVICES and native keyboard selection of PROJECTS work on source and local in all six contexts; the local rail follows the selected row. All ordinary open, settled Escape reverse, close and reopen controls completed. The selection reset discrepancy above is the only additional actionable P1/P2 established by this round.

At **412×400 AR**, native wheel scrolling exposed the lower controls on both pages. Native keyboard navigation reached the actual LinkedIn anchor without activating it. Source scroller scrollTop was 459.400; local dialog scrollTop was 476.050 with its scroller at 0. Both had focused/visible documents and an in-viewport lower link. Complete close/reopen reset both actual scrolling owners to 0. Native page y stayed 0. These controls and reset states have `short-mobile-ar-*-native-focused-lower` and `*-reset-confirmed` PNG/JSON evidence. Source height-dependent composition outside the agreed references was not graded against the intentionally fixed local profile.

Local AR retained and remeasured its selected CONTACT row during an open **412→360→412 width** resize: rail center 433.000→377.783→433.000, with corresponding row centers 432.050→377.508→432.050. Fonts were naturally loaded; the existing `document.fonts.ready` promise was observed without font/event mutation. This live round does not simulate a late font swap. The mounted fake-layout regression was read: it covers zero closed offsets, six locale/profile cases, pointer/focus changes, width resize, font completion and cleanup. It was not rerun here.

Twelve new bounded native smoke recordings cover settled menu reverse plus **two hero/header departures and returns per source/local/profile/locale**. Each uses 80 native XTest wheel inputs, pixel mode ±114px: **960 trusted inputs total**. The new probe reads `defaultPrevented` in capture phase, so its false values are not claimed as a post-dispatch prevention check. Every run reaches approximately native 2280 and returns to **native/story/opening/world zero**, menu closed, with no sampled focus/visibility loss. Passive probes sample existing datasets at 80ms and capture input events; they install no RAF, render, conversion, clock, uniform or application callback wrapper. Every probe was stopped and removed.

Reviewed **72 paired smoke samples** in six `*-smoke-sheet.jpg` files, spanning menu close, both departures, both returns and final holds. `smoke-inspection-manifest.json` records selected original sample files, approximate common wheel-relative times and preceding passive observations. Raw twelve `*-smoke.mp4`, native receipts, states and record logs remain available. The new captures request 30fps and mobile has one black encoder padding row. These captures and samples establish bounded motion/pose continuity, **not universal FPS or physical-touch certification**. No new repeatable app-owned hero/header pose or cadence defect was isolated. Equal capture time is not an identical graphics history or native presentation boundary.

The original twelve full-route recordings remain unchanged: SHA256 matched every video against the original index. Their accepted prior coverage comprises 6,080 trusted wheel inputs, full forward score 714/full reverse 0 in all six contexts, 284 paired whole-route samples and 126 source +126 local contiguous-window frames. See the preserved `docs/home-final-reference-acceptance.md`, prior `reviewed-coverage.json` and this round's `prior-evidence-verification.json`. This round inherits that completed whole-route review; it does not claim to have newly replayed all twelve unchanged journeys. Combining it with the header-only code delta and fresh bounded smoke supports retaining that moving-route conclusion, subject to the concrete menu reopen finding.

## Code, provenance and capture limits

The exact fix adds one retained element reference and a helper guarded by `dialog.open`. Geometry reads occur on visible open, selection or existing layout invalidation. No helper call, geometry query or new RAF is introduced into the ordinary journey callback. Existing resize/font-ready ownership and disposal remain intact; the font-ready continuation checks `disposed`, listeners/observers are removed, and timeline cleanup is unchanged. No journey clock/graphics, menu timeline, CSS, scroll policy, audio or import boundary changes occur in these two candidate commits. The tooling commit only excludes the gitignored evidence archive from code checks.

Root-owned logs were read and support 251 tests/7,534 assertions, lint/typegen/TypeScript/architecture checks, static EN/AR build and both-locale SSR/13-assets success. No tests, build, install, package, typegen, staging, commit or application/server process management was run by this reviewer. Only the reviewer's bounded capture/input/decoder helpers were started and completed. No further agents were used. Only this report and this round's artifact subtree were written; concurrent root documentation changes were left alone.

Source cache, field history, clocks and storage were not forged or normalized. Browser focus, viewport changes and responsive mode were real native operations. RDM used DPR1, touch off and desktop Firefox UA. Current native content crops were calibrated separately from the older helpers: desktop(8,40), tablet(592,80), mobile(770,80), with the same native 2030×1190 window. Full MCP PNGs remain authoritative for menu pixels. Offline extraction used one decoder at a time and began after release; no recording/cadence run overlapped a decoder.

Excluded attempts are retained with `excluded-` names. An initial extra mid-reverse native click was not a valid reopen control; the local attempt reached the unimplemented contact route and was restored with the purpose-built history-back tool. It contributes no route or interaction finding. Both initial smoke attempts were excluded and replaced by the twelve accepted ordinary Escape/scroll controls. An early tablet AR capture raced asynchronous reload and was captured with the menu closed; all of those receipts are explicitly excluded and replaced. An initial short-height keyboard attempt retained browser-toolbar focus; only the later verified native page-focus/LinkedIn receipts establish keyboard reachability. No unimplemented case route was graded.

## Release and root handoff

**EXPLICIT BROWSER/INPUT RELEASE: 2026-10-28 01:19:44 UTC.** No browser or native-input call followed release. `release-proof.json`, `release-source.png`, `release-local.png` and `release-native.png` preserve the exact final provenance:

- Original source37 and local36 only, both plain **EN/y0**, **1920×1080/DPR1**, entry complete, motion enabled, audio off and menu closed.
- RDM closed on both tabs; original native window **2030×1190 at(−47,−5)**, XID **0x5400a09**. **Local36 is active and focused.**
- All reviewer probes removed and all reviewer input/recording jobs completed before release. Subsequent offline decoder work has also completed; no pending heavy job remains. Production preview was not managed or stopped.

**Fresh-open dash correction: accepted. Final clone parity: not accepted pending the single reproduced menu reopen reset difference.** Root can make that narrow correction and validate it without changing the accepted route graphics or broadening the scope. This completed reviewer has released all browser/input ownership and issued no shutdown, suspend, restart or scheduled power action.
