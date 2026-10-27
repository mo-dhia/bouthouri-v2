# HOME adversarial review — round 3

Date: 2026-10-27. Scope: independent verification of R2-01 through R2-04 and bounded root/integration review on the latest **dev port 3000**. This is **not full HOME parity acceptance**. Hero/shell and scene owners are still finishing their assigned work; their known footer/SDF/hero restoration work is not recast as new root findings.

This reviewer changes only this document and temporary evidence. No implementation changes, commits, check/build/typegen, production audit, server management or broad process termination. Port 3100 is not used for fix acceptance. Initial port-3000 connection failures were retried with cold navigation after the parent restored its server; unavailable snapshots are excluded.

## Current disposition

- **R2-01 passes the independent desktop trigger.** EN 1400×850 DPR1, quiet audio entry, score 579.9867/y21218 → reading y10265 → re-enabled y10265/score185.1918. Lenis is absent in reading and present again in motion. The source at the same viewport clamps to its reading extent y10298 and retains y10298/score186.38 on re-enable. Both preserve the current clamped native offset; semantic autosnapping on this mode toggle is not required. The small difference between reading extents is not accepted as full reading-layout parity.
- **R2-02 passes simulated context-loss integration and same-mount latching.** At EN 1400×850 DPR1, score127.9984/y8678, dispatching a cancellable `webglcontextlost` on the live `.canvas-layer canvas` produces `#top[data-story-failed=true][data-story-scene=failed]`, removes `data-enhanced`, exposes `.quiet-journey` and the original poster, removes the object canvas and destroys Lenis. Native y8678 is retained. Two motion-button toggles do not retry the failed scene or restore pinning. All four project links become non-inert and keyboard-focusable. This tests the installed failure handler, **not physical GPU loss**.
- **R2-02 route lifetime passes the exercised locale remount.** Invoking the visible EN→AR locale link after failure clears the old latch, mounts a ready new scene with `data-story-text-renderer=troika-sdf`, and restores the captured native-reading work fraction into the motion clock: work fraction .3680549 → score358.2773/y15067. No scene-failure flag remains on the new HOME. Complete shell entry/restoration acceptance remains with its owner.
- **R2-03 passes the independent Arabic computed-style check.** AR 1400×850 DPR1 quiet prose and chapter person use Cairo/450. Quiet philosophy/outlook compute 16.32px/29.376px; post-extension computes 23.562px/40.0554px; chapter person computes 11.44px/18.304px. These size/weight/leading values match the source. This is DOM typography evidence, not an SDF/raster pixel pass.
- **R2-04 passes the sampled EN/AR CSS breakpoint checks.** A visible same-origin frame in each owned source/local tab supplies real 700/701/760/761/392×865 CSS viewports, DPR1. At each width the systems/closing computed size, line height, tracking and type-scale agree. At 392px English systems-shared is 44.6645px and closing is 52.5221px. English heading type-scale is 1.055 through 760 and 1.085 at 761; post-line retains 1.085. Arabic systems/closing preserve 1.01 through 760 and 1.035 at 761. Source frames that had not reached the requested score are excluded from rendered-position acceptance. No DPR2 or full responsive pixel pass is claimed.

**Two P2 integration corrections remain:** the localized native-reading paragraph margins and the missing footer navigation-top rule below. Passing the targeted R2 triggers must not close the original full visual/interactions matrix.

## Confirmed new findings

### R3-01 · P2 — Reading paragraphs lose the source margins, shortening the page by 32.78125px

**Location:** `src/app/globals.css:14` resets paragraph margins; `src/sections/landing/3-journey/journey.module.css:91` defines quiet paragraph typography without restoring its margins.

**Repro:** fresh own-tab EN source/local at 1400×850/DPR1, fonts ready, enter reading mode through `.motion-access`. Document heights are source **11148px**, local **11115px**. Exact stage bounds are 10298.03125 versus 10265.25px. Hero and post-lens panel match. The entire difference starts in `.quiet-journey`: `.quiet-philosophy` is 16.390625px short, and `.quiet-outlook` is 16.390625px short. All four work cards, systems articles and footer have matching heights, then inherit the accumulated −32.78125px top offset.

**Cause verified in the live DOM:** source quiet paragraphs have `margin-block: 1em` (16.4px computed), while local paragraphs compute zero margins. Margin collapse hides the difference between principle headings; the last principle paragraph's bottom margin and the outlook kicker's top margin contribute the two missing layout increments.

**Minimal diagnostic:** injecting only `[data-journey-root] .quiet-journey p { margin-block:1em }` into this reviewer's local tab changes the document height to **11148px**, quiet philosophy to **825.734375px**, outlook to **422.421875px**, work top to **3985.15625px**, systems top to **8190.03125px**, and footer top to **10400.03125px** — exact source matches. The temporary style is removed afterward. No implementation edit is made.

**Acceptance:** restore the source margins in the owned quiet paragraph rule; cold-retest EN reading extent and all downstream section tops. Keep the correction scoped to these paragraphs, since a global paragraph change would affect other verified layout. Confirm the corresponding Arabic/narrow reading margins when validating the parent patch.

### R3-02 · P2 — Footer information ignores the measured navigation clearance

**Location:** `src/sections/landing/3-journey/journey.module.css:581`, `.journey .portfolio-content .global-footer:not(.standard-footer) .footer-information`.

**Repro in the same reading snapshot:** footer information has the matching **93.890625px height**, but its top relative to the footer is **59.828125px local versus 102.34375px source**, a separate **−42.515625px** placement error. Its absolute top differs by −75.296875px before R3-01 is corrected; the word mask and colophon differ only by the R3-01 accumulated offset. This absolutely positioned information block does **not** cause the document-extent gap.

**Cause verified:** the local footer runtime already sets the exact source `--footer-nav-top:102.34375px`, but the rule applying `top:max(var(--footer-information-top),var(--footer-nav-top,0px))` requires a `.portfolio-content` descendant. The local document has **zero `.portfolio-content` elements**, so it falls back to the base 8% top (59.828125px). Removing just that nonexistent ancestor requirement in a temporary tab-only style makes the relative top exactly **102.34375px**. This is a selector/integration defect, independent of the active footer material/SDF/physics work.

**Acceptance:** apply the measured top rule to the actual owned HOME structure and retest quiet/motion footer information clearance at the matching desktop viewport. Do not accept the existence of the CSS variable as proof its consumer matches.

## Reading-layout localization requested by the parent

Fresh EN 1400×850/DPR1, reading mode, fonts ready. Values are CSS pixels; tops are absolute document coordinates. Table values are rounded to three decimals; exact values are in temporary JSON. The two tab-only diagnostic styles were removed after measurement.

| Element | Source top | Local top | Source height | Local height |
| --- | ---: | ---: | ---: | ---: |
| Hero | 0 | 0 | 850 | 850 |
| Stage | 850 | 850 | 10298.031 | 10265.250 |
| Post-lens panel | 1700 | 1700 | 935 | 935 |
| Post concept | 1871.922 | 1871.922 | 272.188 | 272.188 |
| Post extension | 2176.891 | 2176.891 | 63.344 | 63.344 |
| Quiet principles | 2635 | 2635 | 825.734 | 809.344 |
| Quiet outlook | 3460.734 | 3444.344 | 422.422 | 406.031 |
| Whole quiet journey | 2635 | 2635 | 1350.156 | 1317.375 |
| Work world | 3985.156 | 3952.375 | 4204.875 | 4204.875 |
| Wujhat card | 4044.656 | 4011.875 | 876.703 | 876.703 |
| Tranche card | 5040.359 | 5007.578 | 1062.234 | 1062.234 |
| Remoteplatz card | 6221.594 | 6188.813 | 814.859 | 814.859 |
| 8returns card | 7155.453 | 7122.672 | 856.078 | 856.078 |
| Systems section | 8190.031 | 8157.250 | 2958 | 2958 |
| Systems build article | 8190.031 | 8157.250 | 765 | 765 |
| Systems human article | 8955.031 | 8922.250 | 765 | 765 |
| Systems ending article | 9720.031 | 9687.250 | 680 | 680 |
| Footer | 10400.031 | 10367.250 | 748 | 748 |
| Footer word mask/text | 10759.078 | 10726.297 | 329.125 | 329.125 |
| Footer information | 10502.375 | 10427.078 | 93.891 | 93.891 |
| Footer colophon | 11093.859 | 11061.078 | 28 | 28 |

## Evidence and limits

Owned Vaelix tabs: 175555129/130/132/134/136; all five are closed at completion. No reserved parent tab is used. Source tabs are activated before motion sampling; nested frames remain visible during their responsive checks. Top-level desktop comparisons record 1400×850 CSS pixels/DPR1. Responsive frames are desktop/fine-pointer environments, **not physical touch devices or dynamic mobile browser bars**.

Failure screenshots: `/home/jarvis/Downloads/gazzar-r3-contextlost-reading_2026-10-27T00-39-48-063Z.png` and `/home/jarvis/Downloads/gazzar-r3-failed-poster-work_2026-10-27T00-40-09-403Z.png`. Structured EN/AR responsive and reading metrics are saved in `/tmp/gazzar-home-review-r3/measurements.json`; footer placement and temporary diagnostic results are in `/tmp/gazzar-home-review-r3/footer-information.json`. A poster's computed display alone is not proof of correct poster placement or all fallback composition.

Still unaccepted by this reviewer: controller-import/network rejection, physical context loss/recovery, DPR2, real touch/coarse pointer, native OS motion preference changes, dynamic svh/dvh/browser bars, full mount/GPU resource accounting, all query/Back/reload branches, denied storage/BFCache, physical/default-action Escape, trusted audio/clipboard, complete motion continuity, final production loading and SSR validation. Parent-provided successful tests are useful handoff context and are not mislabeled as independently repeated here.
