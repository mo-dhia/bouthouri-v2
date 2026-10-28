# Final HOME reference acceptance review

2026-10-28. **Acceptance withheld for one concrete P2 visual-parity finding: the selected navigation dash starts above the selected row when the local menu first opens.** It repeats in all six agreed viewport/locale contexts. Root should repair and verify this before shutdown. This reviewer made no power action.

Frozen application: `eca97d0`; production BUILD `X_EOoaHYngRR_fHNpOwl-`, checked on disk and in the actual local document. Documentation HEAD supplied at assignment: `1970e3e`. Compared public HOME `/en` and `/ar` with `localhost:3000/en` and `/ar`, using only assigned Vawzen source **37** / local **36**, original Zen window **0x5400a09**. Public deployment revision is unknown.

## P2: selected menu dash is initialized against a hidden dialog

Trigger: load HOME, choose quiet entry, wait for entry completion at native y=0, open navigation without hovering or focusing a primary menu item, then let the menu settle. The first item is selected on both pages. The source dash aligns with that row; the local dash remains at the primary navigation container's top. This is visible in every saved paired menu, independent of live time text and background animation.

The zero-based painted dash rows below were measured from the original full CSS-viewport PNGs, DPR1. The local dash uses the same horizontal position and approximately 11px width but is vertically displaced:

| Reference viewport | Locale | Source y | Local y | Local displacement | Paired evidence |
| --- | --- | ---: | ---: | ---: | --- |
| 1920×1080 | EN | 344 | 274 | −70px | `desktop-en-menu-pair.jpg` |
| 1920×1080 | AR | 260 | 163 | −97px | `desktop-ar-menu-pair.jpg` |
| 768×1024 | EN | 415 | 381 | −34px | `tablet-en-menu-pair.jpg` |
| 768×1024 | AR | 337 | 278 | −59px | `tablet-ar-menu-pair.jpg` |
| 412×915 | EN | 137 | 108 | −29px | `mobile-en-menu-pair.jpg` |
| 412×915 | AR | 152 | 108 | −44px | `mobile-ar-menu-pair.jpg` |

The frozen implementation explains the result: `header.logic.ts` calls `selectMenu(first)` during initialization (around line711), while the dialog is closed. `selectMenu` positions `[data-menu-rail]` using `item.offsetTop + item.offsetHeight / 2` (around line448). The menu's `open()` shows the dialog and measures ink, but does not reposition the selected rail. CSS places the rail at `top:0`. Root's repair should measure the current selected item after the dialog is shown, retaining pointer/focus selection, fixed design sizing and physical menu scrolling. No application fix was made by this reviewer.

Machine-readable proof: `menu-rail-finding.json`. Full PNGs are named `<profile>-<locale>-<side>-menu.png`; six paired JPGs retain the original visible mismatch. Early desktop AR transition captures were excluded and retained with an `excluded-early-` prefix; the accepted AR desktop pair was recaptured after entry and menu completion.

## Moving coverage on this production build

All **12 accepted native recordings** cover a complete forward journey, a full-footer pause, complete reverse and final hero hold, across all **six** agreed contexts. Every recording reaches score **714** and returns to native/story zero. No additional actionable P1/P2 was established in this moving coverage.

| Exact CSS canvas, DPR1 | Locales | Same plan per source/local pair | Wheel receipts per recording | Replay duration |
| --- | --- | --- | ---: | ---: |
| 1920×1080 | EN, AR | 283 forward /283 reverse, 80ms spacing | 566 | 51.28s |
| 768×1024 | EN, AR | 269 forward /269 reverse, 80ms spacing | 538 | 49.04s |
| 412×915 | EN, AR | 208 forward /208 reverse, 80ms spacing | 416 | 39.28s |

All **6,080** observed wheel inputs were trusted, pixel-mode ±114px; none was prevented. Passive observers recorded no focus/visibility-loss lifecycle event. Each accepted run passed exact viewport/DPR, native zero, entry complete, scene/boot ready, fonts loaded, visible/focused and motion-enabled gates. Quiet entry was explicitly chosen for the accepted fresh documents. Pointer placement and wheel plans were shared within each profile. Browser cache, deferred enhancement and free-running field histories were preserved, not normalized or forged.

Reviewed **284 paired whole-route samples** at one-second replay intervals in **34 sheets**, including every route region in both directions. Additionally inspected all **126 source +126 local original frames** in seven contiguous approximately 0.3s windows: desktop EN perspective arrival/reverse; desktop AR direction arrival; tablet EN Wujhat travel; tablet AR perspective arrival; mobile EN and AR direction arrival. The window selections and original frame indices are in `reviewed-coverage.json` and `capture-manifest.json`. Other extracted windows remain supplemental evidence and are not claimed as inspected.

Coverage includes hero/header departure and return; glasses/emergence; SDF titles and all three sculptures; Ideas; all four projects/connectors; systems and closing typography; full footer and reverse. EN/AR copy, logos, framing and text direction remained consistent in this coverage. Full-footer and hero holds provide matched native endpoint poses in every context. Independent browser stills additionally matched native positions for desktop EN and mobile AR project interaction checks.

Unwarped moving records retain small scrub/phase and lighting differences. Equal replay time is not identical native position or graphics history. No repeatable app-owned material, easing, geometry or cadence defect was isolated from those differences, and no tuning was inferred from them. This review does not claim universal pixel equality or certify a stutter cure.

## Focused interactions

- Menus opened in all six contexts and closed with native Escape. Settled menu copy/layout comparisons exposed the dash finding above. Contact/language/sound controls and route labels were inspected; clipboard copy was not invoked.
- At desktop EN native y=17350, source/local Wujhat link rectangles match exactly: x145.4, y861.4833, width136.6667, height48; both report `pointer-events:auto` and native `:hover=true`, with `/en/projects/wujhat`. At y17100 both links are gated off. `desktop-project-hover-state.json` and paired hover PNGs retain this proof.
- At mobile AR native y=12789.7998, settled scores are source312.00/local312.0013. The Wujhat link and native hover are active on both pages; offscreen project links are gated off, with matching AR routes. At score489 the offscreen project controls are disabled. Still PNGs retain these states; the initial local seek made during menu-close restoration was excluded and replaced by a settled capture.
- Local AR tablet and EN mobile switched through the reading accessibility control, exposed route headings/project links, reached the contact footer using native Ctrl+End, and reported zero horizontal overflow. Motion was restored afterward. `tablet-ar-reading-*.png`, `mobile-en-reading-*.png` and `mobile-en-reading-state.json` are retained. These were control-driven checks, not OS reduced-motion tests.
- At mobile AR full footer, the actual `[data-footer-grab]` role-button received focus. Native Enter changed `word`/pressed=false to `to-logo`/pressed=true. This is bounded keyboard activation; a completed logo/Escape cycle was not established. An earlier attempt targeted the inert scene mirror, did not focus/activate it, and is explicitly excluded. See `footer-keyboard.json` and `mobile-ar-local-footer-keyboard-logo.png`.
- Native clicks on the EN mobile menu sound control changed all shared controls to “Mute sound”/pressed=true, then immediately back to “Enable sound”/pressed=false. `sound-toggle.json` retains both receipts. No audio-audibility certification follows.

## Evidence integrity and limits

All evidence is persistent under **`.artifacts/final-parity-20261028/`**, not `/tmp`:

- `<profile>-<locale>-source.mp4` /`-local.mp4`: twelve accepted originals, no pose/time warp. Desktop and tablet preserve CSS viewport resolution; mobile is 412×915 content with one black bottom padding row for H.264's even dimensions.
- Corresponding `-host.json`, `-record.json`, `-record.log`, `-state.json`; three input plans, `profiles.json`, passive observer and recording helpers.
- `inspection/*-route-*.jpg` and `*-window-*.jpg`: paired annotated samples; labels use the nearest preceding passive observation, not a proven display-presentation boundary. Blank cells preserve unequal sample counts.
- Six menu pair JPGs and full PNGs, project/reading/footer/sound evidence, `capture-manifest.json`, `reviewed-coverage.json`, `menu-rail-finding.json`, `release-state.json`, `review-status.json` and final native/page PNGs.

Accepted originals contain **34,311 encoded frames**. Requested X11 sampling was60fps; median PTS spacing is approximately16.667ms, with a maximum37.059ms across the accepted files and no interval over50ms. These are capture timestamps, not distinct monitor presentations or sustained presented FPS. Original timestamps and frames were retained. No concurrent live capture/decoder or profiler accompanied the replays; offline extraction used one decoder at a time. Storage remained well below2GB.

Excluded media remain alongside the accepted evidence: the initial source entry-gate attempt; a complete source recording whose first telemetry export was lost to a shell argument-size limit and therefore rerun; early AR desktop menu transition images; and the explicitly mismatched control/seek images described above. They do not contribute to the acceptance counts.

The root-supplied 250 tests/7,450 assertions, production build, both-locale SSR/13-assets results, R1/R3 reviews and correction retests were **not rerun** by this reviewer. No application, test, package, build, typegen, server, staging, commit or delegation action was performed. Only this report and the persistent evidence directory were written. Existing root-owned changes were left alone.

## Release and root handoff

**EXPLICIT BROWSER/INPUT RELEASE: 2026-10-28 00:51:35 UTC.** No browser/input calls followed release; subsequent work was offline evidence inspection. Both tabs were restored to plain **EN/y0**, **1920×1080/DPR1**, motion enabled, entry complete, audio off and menu closed. RDM is closed on both. Original outer window2030×1190 at(−47,−5) is restored; **local36 is active and focused**. All reviewer page probes, recorders and input helpers were stopped; no runtime/render wrappers were installed. The production preview remains running on port3000 with the same build.

Offline inspection is complete. Root owns the menu-dash repair, its validation and final acceptance decision. **Do not treat this review as authorization to shut down before that concrete finding is resolved. This reviewer did not shut down, suspend, restart or schedule power actions.**
