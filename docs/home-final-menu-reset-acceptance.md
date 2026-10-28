# Final HOME menu reset acceptance — independent delta review

2026-10-28. **Accepted for the tested HOME scope. The complete-close/reopen selection P2 is resolved in all six agreed contexts, and the earlier fresh-open rail correction remains intact. No remaining actionable P1/P2 was established by this round.** This decision combines the frozen whole-route moving review, the subsequent native smoke review, and the focused live reset checks below. Browser/input ownership is released; no power action was issued or scheduled.

Application candidate: **`19b2e0cfcb4b817588220b107d5229a575b43727`**. Production BUILD: **`QJTj_MU6uWWybPQ5AtMGp`**, confirmed in `.next/BUILD_ID` and every freshly loaded local test document. The original local document was refreshed before grading. Concurrent root documentation commit `d19b63d3b4f4c43b7126653f1ff3dcf24945a855` changes only four documentation files relative to the candidate; it does not change the reviewed application. Public deployment revision is unknown.

Only assigned Vawzen **source37/local36** and the existing Zen window **0x5400a09** were used. All new evidence is persistent under **`.artifacts/final-parity-20261028/menu-reset-recheck/`**. The earlier two reports and their evidence remain historical and unchanged by this reviewer.

## All six fresh-open and complete-reopen checks pass

Each source/local document was loaded fresh at its exact reference canvas, DPR1, native y0, fonts loaded, motion enabled, quiet entry explicitly chosen and entry complete. Native pointer input opened the menu without primary-row hover/focus. After the settled first capture, native pointer movement selected SERVICES/الخدمات. Pointer movement outside the page followed by native Tab/Tab selected and focused PROJECTS/المشاريع. Native Escape completed the close. A native pointer click reopened it; the pointer then moved outside the primary navigation before the settled capture.

**All twelve documents selected the first row on initial open and on complete reopen.** Both pages reset the selected text, description and rail together. No accepted initial/reopen capture has primary-row hover or focus. The reopened description is “The thinking behind the work” in EN and “الأفكار والقرارات وراء ما يتم بناؤه” in AR. Mobile hides the preview visually as designed, while its corresponding description state also resets correctly.

The numeric centers and painted rail rows below are the same for each context's initial and reopened captures:

| Exact CSS canvas / locale | Source / local rail center Y | Local minus source | Source / local bright rail pixel row |
| --- | ---: | ---: | ---: |
| 1920×1080 EN | 344.300 / 344.333 | +0.033px | 344 / 344 |
| 1920×1080 AR | 260.133 / 260.117 | −0.017px | 260 / 259 |
| 768×1024 EN | 415.250 / 415.250 | 0px | 415 / 415 |
| 768×1024 AR | 337.050 / 337.117 | +0.067px | 337 / 337 |
| 412×915 EN | 137.500 / 137.500 | 0px | 137 / 137 |
| 412×915 AR | 152.000 / 151.983 | −0.017px | 152 / 151 |

Actual initial and reopened rail pixels were inspected in all six contexts, alongside the six full reopened source/local pairs. The two adjacent Arabic raster rows are retained as measured; this is not a claim of exact pixel equality. Rails remain approximately 11px wide and 1px high. The original 29–97px displacement does not recur.

`pixel-results.json` preserves every scan, row center and rail rect. Individual full PNGs retain the exact CSS viewport dimensions. Six `*-initial-pair.png`, six `*-reopen-pair.png`, twelve `*-rail-pair.png`, and `initial-rail-contact.png` / `reopen-rail-contact.png` preserve the comparisons. Per-document `gate`, `initial`, `pointer`, `keyboard`, `closed` and `reopen` JSON receipts retain dimensions, native y, focus/hover, descriptions, scrolling owners, rail transform and build gates. `review-status.json` records the complete six-context result matrix.

Full PNGs preserve live clock, sound-wave and native focus-decoration states. In the current reopen stills the local close control retains its keyboard outline while the source does not; the prior source reopen still also displays that outline (`preexisting-focus-comparison.png`). No new reset-owned P1/P2 follows from these state-dependent focus decorations. The accepted comparison concerns the reproduced selection, description and rail defect, not globally identical live canvases.

## Interrupted close, resize and scrolling controls

At desktop **EN and AR**, both source and local passed a native interrupted-close control. With PROJECTS selected, native Escape initiated closing and focused the actual close button. The saved receipt explicitly shows **dialog open + phase closing + close button focused + PROJECTS retained**. Native Return activated that same focused close control while closing; subsequent receipts show phase opening, then open, with PROJECTS and its description retained throughout. This avoids a mid-close pointer click accidentally reaching page content or another route.

The four `desktop-<locale>-<side>-interrupt-{selected,closing,opening,settled}.json` sequences preserve partial authored link transforms and clipping, plus settled PNGs. They establish a valid native reversal and selection preservation, not a new frame-by-frame easing certificate. The source cached branch at `.artifacts/viewport-validation-20261028/source-runtime/15ud0rwi-a_3n.js:480` resets with `C(0)` only when its phase is closed; closing goes directly back into the existing timeline's play path. The candidate follows that contract. Its timeline implementation is unchanged.

Local mobile AR retained PROJECTS during a native open **412→360→412** width resize: rail center **246.000→214.767→246.000**, corresponding row centers **245.050→214.108→245.050**. The first row was not reselected merely by layout changes. These receipts have `mobile-ar-local-resize-*` names. This round did not simulate a late font swap; the updated mounted test still covers font completion.

A bounded **412×400 AR** native wheel control scrolled the source scroller to **479.400** and the local dialog to **515**, with native page y remaining zero. After verified page focus, native Escape fully closed each menu. Native reopen returned the source scroller and local dialog/scroller to **0** and selected the first row. `short-mobile-ar-*-focused-scrolled`, `*-closed-confirmed` and `*-reset` receipts preserve this control. An earlier local Escape with browser-toolbar focus did not close the menu; those misleading preliminary receipts are explicitly prefixed `excluded-toolbar-focus-` and are replaced by the focused control. No lower-control keyboard or long video replay was needed in this round.

## Code review and inherited moving acceptance

The runtime delta replaces the former visible-row reposition call inside `if (!dialog.open)` with a first-row query and the existing `selectMenu(first)` after `showModal()` and ink measurement. That existing helper updates row state, description state and visible rail position together. An interrupted close leaves `dialog.open` true, so it bypasses the reset. The new query/selection occurs only on a new fully closed opening; no geometry read, state update, listener, timer or RAF is added to ordinary journey frames. Existing tracked description-animation cleanup and disposal ownership remain intact. There is no CSS, scrolling policy, menu timeline, graphics, clock, audio or import-boundary change in this candidate.

The updated mounted regression models zero closed offsets across all six locale/profile combinations, layout/font updates, full close/reopen row/description/rail reset and disposal. A separate test retains nonfirst selection through interrupted closing/opening, then verifies reset after actual reverse completion. Root-owned `menu-reset-check.log`, `menu-reset-build.log` and `menu-reset-ssr.log` were read: **252 tests / 7,562 assertions pass**, the check command completes, EN/AR statically build, and the production SSR audit passes both locales and 13 static assets. These commands were not rerun by this reviewer.

The original full-route acceptance evidence remains the twelve recordings covering all six contexts, full forward score714, footer hold and full reverse/native zero, **6,080 trusted inputs**, **284 paired route samples** and **seven contiguous windows**. The prior delta adds twelve native smoke recordings, **960 inputs**, **72 paired samples**, and two hero/header departures/returns per context. Both reports were read, including the retained SHA verification of the original recordings. Their established moving conclusion is inherited here; this reviewer did not newly replay or decode those unchanged videos. This menu-only reset delta does not invalidate the previously reviewed motion, assets, copy, EN/AR composition or native scrolling.

Combining that coverage with the present six-context selection/pixel review and EN/AR reversal controls supports **final acceptance within the tested HOME scope**. Both previously actionable P2 menu findings are resolved. No universal hardware FPS, physical-touch, every-frame pixel identity or case-route claim is made.

## Explicit release and root handoff

**BROWSER / NATIVE INPUT RELEASED: 2026-10-28 01:36:54 UTC.** No browser or native-input call followed release. Offline evidence inspection and report writing subsequently completed.

- Original source37/local36 only; both plain **EN/y0**, **1920×1080/DPR1**, quiet entry complete, motion on, audio off and menu closed.
- RDM closed on both tabs. Original Zen window **2030×1190 at (−47,−5)**, XID **0x5400a09**. **Local36 is active and focused.**
- `release-proof.json`, per-tab JSON/PNG, `release-tabs.json`, `release-active-tab.json`, `release-native.png` and `release-processes.json` preserve the final state. Native process inventory has no reviewer capture/input/decoder job.
- No page probes or render/runtime wrappers were installed. Bounded native helpers completed or were terminated by their timeout. No pending heavy job remains, including offline analysis. Production preview was not managed or stopped.
- Only this report and this round's artifact subtree were written. No application/test/config/package edit, build/install/typegen/check execution, staging, commit, server management, delegation or power action was performed by this reviewer.

**Review complete; root owns the final documentation commit and any already-authorized shutdown.**
