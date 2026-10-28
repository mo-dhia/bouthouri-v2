# Fixed viewport integration validation

2026-10-28. The sizing migration replaces the fluid baseline at `a55a6a0` with
the user-confirmed canvases in [the design contract](viewport-design.md).
Source content, Storio ownership, custom scroll clocks and deferred graphics
boundaries remain intact. This records the final integration rather than
reclassifying the historical review candidates as accepted builds.

## Automated validation

- `bun run check`: ESLint, route type generation, TypeScript, architecture audit,
  **252 tests / 7,562 assertions**, all pass.
- `bun run build`: EN/AR statically prerendered; final build
  **`QJTj_MU6uWWybPQ5AtMGp`**.
- `bun run test:ssr -- http://localhost:3000`: both locales, RTL, metadata,
  redirects, 404s and **13 static assets** pass.
- `bun install --frozen-lockfile`: passes without changes; Storio patch retained.
- Architecture audit: 110 application modules, 20 client entries, 27 initial client
  graph modules, 41 server-frontier modules, 10 stylesheets. No new initial
  graphics/controller import or client-owned route content.
- CSS audit rejects fixed pixel/rem design lengths, clamps and height-based
  composition queries. Border/outline hairlines and filter kernels are explicit
  paint exceptions. SVG-local strokes/dashes remain numeric; the two
  `non-scaling-stroke` paths receive outer width scaling separately.

The sole `dvh` expression is the physical native scroll tail, repeated in the
three profiles. It does not size the stage, typography, objects or camera.

## Reference review

[Production review R1](home-fixed-viewport-production-review-r1.md) inspected
all three reference canvases in EN/AR on build `cL22eAwGwLUwnTK7WEQ4b`: 190
reference/menu states and 70 local scaling/height states, with ordered forward
and reverse score captures. No additional P1/P2 reference-conversion finding
was established. Same-width height changes preserved the selected geometry and
font samples; proportional widths retained the composition within the recorded
native font/rectangle residuals.

That review reproduced the queued short-menu and tall-scroll-end defects.
It did not certify later, unserved corrections. The final build above contains
those corrections plus the footer-buffer, pressure and SVG fixes. R3 and the
separate narrow tail/cache review found no remaining concrete P1/P2 in source.

## Corrected boundaries and final browser retests

| Boundary | Correction and evidence |
| --- | --- |
| SVG local coordinates | Unitless ordinary stroke widths and normalized dash endpoints; explicit vw screen widths for systems-still/work-quiet paths. At 1440px, the pause has a 10.5px frame, 16-unit viewBox and 1.2 local stroke; non-scaling paths compute to 0.933333px after browser app-unit quantization, versus the analytic 0.9375px target. |
| Environmental input | Scroll pressure uses cached design-canvas height. Pointer bounds share the fixed top-anchored camera, avoiding a geometry read on every scroll input. Tests cover equal native input across actual heights and proportional input across widths. |
| GPU buffers | Unchanged design dimensions/effective DPR skip WebGL buffer resizing; real width/DPR changes retain the original setter sequence and source capture scheduling. |
| Footer overlay | Existing resize ownership updates the physical Canvas buffer independently of mask geometry. Unit regressions cover morph/wave history; live word-mode buffer changes 412×1100→412×600 with the same412×915 stage. No live logo-history claim follows from this word-mode control. |
| Short menu | Native outer dialog scrolls; inner composition stays at fixed design height. At 1920×540,768×600 and412×350, outer heights are 540/600/350 while inner heights remain 1080/1024/915. Native default focus scrolls the lower link fully into view; reopening at the same mobile size resets scrollTop to 0. |
| Tall viewport | A motion-only tail after the chapter supplies missing physical scroll extent. Stage geometry and pin distance remain unchanged; natural document bottom now reaches 714 in all three category controls below. |

Final natural-bottom controls:

| Physical viewport | Fixed stage | Tail | Native bottom | Settled score |
| --- | --- | --- | --- | --- |
| 1440×1080 desktop | 1440×810 | 270px | 23763 | 714.0000 |
| 768×1400 tablet | 768×1024 | 376px | 30041 | 714.0000 |
| 412×1100 mobile | 412×915 | 185px | 23030 | 714.0000 |

At native 1920×1080, the final hero/stage heights are 1080px and the tail is 0.
The sampled hero information heading and paragraph match the original baseline
rectangles and computed fonts exactly, including 75.3167px /18.6833px font sizes.
The full reference review remains bounded coverage, not a universal pixel,
presentation-FPS, cross-browser or physical-touch certification. Native font
rasterization and subpixel metric residuals remain documented in R1.

## Evidence and cleanup

Original root logs, source/reference snapshots and correction receipts were
recorded under `/tmp/gazzar-fixed-vw/`; the review's190/70 state records and
paired images were under `/tmp/gazzar-fixed-vw-review/`.

Before the requested shutdown, these were copied persistently into the ignored
`.artifacts/viewport-validation-20261028/root/` and `review/` directories.
The same archive preserves source runtime/scene snapshots and the earlier R23
accepted video with its evidence. `index.json` maps the original paths.
Historical reports retain their original recording paths; use this archive
after reboot if `/tmp` has been cleared. Large local media are intentionally
excluded from Git. The final shutdown acceptance pass saves its new evidence
directly under `.artifacts/final-parity-20261028/`.

The existing two Vawzen tabs are left at EN/y0, native 1920×1080/DPR1, entry
complete, motion enabled, sound off and menus closed; local 36 is selected and
focused. RDM is closed on both tabs, original window hints restored, no new
tabs/windows retained, and no page probes or recording jobs remain. The local
production preview continues on port 3000. Local assistant guides stay untracked.


## Final moving review and menu correction

[The final reference review](home-final-reference-acceptance.md) recorded all
six EN/AR reference contexts on build`X_EOoaHYngRR_fHNpOwl-`: twelve complete
forward/footer/reverse native-wheel videos,6,080 trusted inputs,284 paired
whole-route samples and seven contiguous transition windows. Its sole actionable
finding was a selected-menu dash measured while the dialog was closed.

Commit`fd6f513` retains selection but measures the visible row after opening,
and refreshes it on selection, viewport or font-ready layout changes. It adds
no journey-frame work or RAF. The full check, new static production build above
and both-locale SSR/13-asset audit pass after that correction. Tooling now excludes
the ignored local evidence archive from ESLint/TypeScript; it remains outside
the application graph. [The independent menu recheck](home-final-menu-acceptance.md) confirms fresh-open
alignment at all six references and preserves the full moving evidence hashes.
It found a separate pre-existing reopening policy: source resets to VISION after
a complete close. Commit`19b2e0c` now resets the row, description and rail only
on a new open; an interrupted reverse retains selection. The full validation
counts/build above include both corrections. [The final focused review](home-final-menu-reset-acceptance.md) accepts the tested
HOME scope: all six fresh/reopen selection, description and rail controls pass,
with a maximum measured rail-center residual of0.067px. Native EN/AR interrupted
closes retain selection; open resize preservation and native menu scroll reset
also pass. Combined with the full moving and subsequent transition recordings,
both actionable menu findings are resolved. Earlier reports remain frozen
historical evidence rather than being rewritten as passes.

The final application is`19b2e0c`, build`QJTj_MU6uWWybPQ5AtMGp`. All new videos,
receipts, review images and validation logs are saved under
`.artifacts/final-parity-20261028/`, including the final`menu-reset-recheck/`.
The final review released both original tabs at EN0/1920×1080, motion enabled,
audio off, entry complete and menus/RDM closed. All recording/input/decoder jobs
are finished. The user-requested machine shutdown follows the final saved commit.
