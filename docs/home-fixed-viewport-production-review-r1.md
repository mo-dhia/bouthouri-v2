# Fixed viewport production browser review R1

Reviewed 2026-10-28. Frozen production build: `cL22eAwGwLUwnTK7WEQ4b`, served at localhost:3000. Candidate base HEAD: `a55a6a01e5807f58c4d7bebca92d4a4adcf8d1df`. Read AGENTS.md and docs/viewport-design.md.

## Result

No additional P1/P2 conversion-parity finding emerged in the sampled EN/AR reference-canvas comparisons. Two P2 physical-viewport limits were reproduced on this build; both had already been identified by the root agent and queued for a later build. This is bounded visual and geometry coverage, not a universal parity or animation-cadence claim.

No application, test, package, build, generated, server, staging or commit changes were made by this reviewer. The root agent began unserved source fixes during this review; the served build ID remained unchanged through restoration. Previously reported checks (244 tests / 7240 assertions, build and SSR / 13 assets) were supplied context and were not rerun here.

## P2 findings on the frozen build

1. **The final motion score is unreachable when physical height exceeds the width-scaled stage.** At local EN 768×1400 / DPR 1, native bottom is y=29665, document height=31065, chapter start=1024 and pin distance=29017. The required chapter end is y=30041: a 376px shortfall. Settled score is **702.7504**, with the stage still correctly 768×1024. The same limit appeared at 412×1100 (706.7375), 640×1024 (707.8725; stage approximately 640×853.333) and 1440×1080 (703.7876; stage 1440×810). Reference canvases and shorter physical heights reached 714. A physical scroll tail outside the measured chapter is the appropriate boundary to revisit; preserve stage composition and pin distance. Evidence: `review-summary.json:tallBottom`, `geometry-final.json`, and the matching `local-*-714.png` captures.

2. **The short physical viewport cannot scroll to the lower menu controls.** At local EN 768×600 / DPR 1, the open dialog is 768×1024, overflow hidden; its inner scroller also has clientHeight=scrollHeight=1024. Setting both scroll positions to their end leaves both at zero. LinkedIn occupies y=623.2167–653.2167, below the physical 600px viewport; Contact also extends below it. The inner design remains correctly fixed, but the physical outer menu needs a real scrollable viewport. Evidence: `local-tablet-short-menu.png` and `review-summary.json:shortMenu`. Root already queued the outer-dialog fix.

## Reference comparisons

All source comparisons used only the exact reference canvases, DPR 1:

| Profile | CSS viewport | Locales | Paired coverage |
| --- | --- | --- | --- |
| Desktop | 1920×1080 | EN, AR | Hero/header, menu, forward/reverse journey |
| Tablet | 768×1024 | EN, AR | Hero/header, menu, forward/reverse journey |
| Mobile | 412×915 | EN, AR | Hero/header, menu, forward/reverse journey |

Both existing tabs were driven through explicit quiet entry, with audio off and matching ordered native scroll seeks. Forward checkpoints: hero y=0, then 128, 174, 270, 312, 489, 580 and 714; 640 was additionally captured except in the initial mobile EN sweep. Reverse checkpoints: 580, 489, 312, 270, 174 and 128. Local/source settled score differences were below 0.011. Source clocks were read from main.experience; local clocks from #top. No clocks or GPU state were forged.

The pairs were inspected for the portrait/header, SDF title and sculpture framing, Ideas composition, work SVG, systems fields, footer, RTL text and menus. No tuning was inferred from another source aspect ratio. Free-running material/field history and live clock text were not treated as conversion defects. The check used discrete ordered scroll targets and settling, not a new continuous-cadence benchmark.

## Local proportional-width and height checks

EN geometry and screenshots were sampled at hero, 128, 312, 489 and requested 714:

| Profile | Width scaling | Same-width physical height changes | Return |
| --- | --- | --- | --- |
| Desktop | 1920 → 1440 (0.75) | 1920×1080 → 1920×800 | 1920×1080 |
| Tablet | 768 → 640 (5/6) | 768×1024 → 768×600 → 768×1400 | 768×1024 |
| Mobile | 412 → 515 (1.25) | 412×915 → 412×350 → 412×1100 | 412×915 |

Selected stage-relative rectangles and computed fonts were identical across the same-width height changes and reference returns at matched scores. Tablet and mobile checks crossed portrait/landscape orientation. Normalized SDF/camera and work screenshots retained their composition. At proportional widths, selected computed font residuals were at most 0.017 reference pixels.

A small nonreference metric caveat remains: the hidden footer DOM word mirror's normalized origin differs by up to 3.37 reference pixels at tablet 640, 2.32 at desktop 1440 and 0.87 at mobile 515. Sampled visible rectangle residuals were under 0.97 reference pixels. Footer fitting still samples actual-size ink metrics; this is recorded as a bounded metric residual, without asserting an independently demonstrated visible P2. Tall-viewport footer captures with a clamped score were excluded from matched-score geometry comparisons.

The known non-scaling-stroke reading paths remain a current-candidate limitation: .systems-still path and .work-quiet-symbol path need the root's queued width-scaled screen-stroke treatment at nonreference widths. No additional stroke forensics were performed. Root-reported environment scroll-velocity and physical footer-overlay buffer fixes were unserved and were not certified here.

## Reading and restoration

Local EN mobile 412×915 switched into the unpinned reading experience, exposed headings/project links, reached the contact footer and showed no horizontal overflow; motion resumed afterward. Local AR desktop 1920×1080 also exposed RTL reading headings with no horizontal overflow, then returned to motion. Screenshots: `local-mobile-en-reading*.png` and `local-desktop-ar-reading.png`.

Browser use stayed in assigned Vawzen tabs **37 source / 36 local**, existing Zen window **0x5400a09**. Native desktop input was used only for the existing RDM dimension controls. RDM stayed open, custom Responsive, DPR 1, touch off and native Linux UA. These were CSS-viewport tests using desktop input, not physical mobile/touch tests. The outer window remains 878×1134 at (-47,-5).

Both tabs were restored to **EN, y=0, motion enabled, entry phase complete, audio muted, menu closed, RDM 1920×1080 / DPR 1**. Local tab **36** is active. No persistent page probes, clock overrides or renderer mutations were installed. RDM and root-owned window hints were left in place.

## Evidence

All temporary evidence is under `/tmp/gazzar-fixed-vw-review/`:

- `evidence-final.json`: 190 reference/menu capture states, paired PNG names, exact viewport, locale, native y, clock, stage and DOM/canvas measurements.
- `geometry-final.json`: 70 local geometry capture states across scaling, height and return checks.
- `review-summary.json`: normalized comparison bounds, taller-bottom proof, short-menu measurements, reading checks and final restored states.
- `*-contact.jpg`, `*-reverse-contact.jpg`, `*-menu-contact.jpg` and `local-scaling-contact.jpg`: inspected comparison sheets; full PNGs remain alongside them.
- `final-source-en-1920x1080.png`, `final-local-en-1920x1080.png`, `final-rdm.png`: restoration evidence.

