# HOME adversarial review — round 2

Date: 2026-10-27. Scope: parent-owned server content, native SVG/story clock, sticky geometry, reading modes and navigation integration. **Changes requested: three P1 findings and one P2 remain. This is not full HOME acceptance.** Scene rendering, origin handoff, hero overlay/entry gating, sound and footer identity remain with their existing owners and are not presented here as new root defects.

This review is read-only except for this document and temporary evidence. No implementation edits, commits, build/typegen, production audit, server restart or process management were performed. Focused tests: `bun test tests/journey.test.ts tests/home-navigation.test.ts` — **29 pass, 0 fail, 2,458 assertions**. Parent owns final validation.

## Confirmed open findings

### R2-01 · P1 — Re-enabling motion resets the journey to its opening

**Location:** `src/sections/landing/3-journey/journey.animate.ts`, `mountJourney`/`sync` around lines 115–130 and motion teardown/recreation; reading/navigation integration around lines 358–368.

**Repro, rechecked after the parent's sticky/clock patch:** at EN 1400×850 DPR1, seek score 580, activate `.motion-access`, then activate it again after the reading layout settles. Before: y=21218, score=579.9867. Reading: document height=11115, y=10265. Re-enabled: **y=850, score=0**. The same reset occurred at 392×932: reading y=8837, re-enabled y=932/score=0. A separate cold-query/reload tab reproduced the desktop reset from the closing section. The interaction was invoked through the real button handler in reviewer-owned tabs.

**Expected/actual:** in the equivalent source test, reduction also clamps the long page to the reading extent, but re-enabling retains y=10298 and renders score≈186.38. Locally, changing the native layout loses even that current scroll position. `docs/load-architecture.md` also explicitly requires re-enabling from the current position. This is independent of the shell's known restore/entry work: the latest repro starts after entry is complete. Instrumenting `window.scrollTo` during the mobile transition recorded **no explicit call** while the viewport jumped, consistent with an unowned layout/scroll-anchor transition rather than an intentional restore.

**Suggested fix:** make mode changes an explicit position transaction in the journey owner. Capture the current offset/reading position before changing the layout, recreate the pin, then restore the agreed destination and synchronously set target/displayed/frame through the existing shared renderer. Do not rely on browser scroll anchoring or a previously applied one-shot navigation intent to preserve it. Check both directions and interaction with Lenis destruction/recreation.

### R2-02 · P1 — Scene failure never exposes the visible server reading fallback

**Location:** parent mode selection in `3-journey/journey.animate.ts`; failure integration in `2-story/story-scene-gate.tsx` around lines 44–54; fallback CSS in `3-journey/journey.module.css` around lines 86–99 and the final scene-failure rules.

**Repro:** in a reviewer-owned EN 844×390 tab at score≈129.985, dispatch a cancellable `webglcontextlost` event on `.canvas-layer canvas`. This exercises the installed loss/failure handler; it is a simulated failure signal, not a claim of a physical GPU failure. Observed `data-story-boot=failed` and `data-story-scene=failed`, while `.experience` remained enhanced/pinned, `.quiet-journey` remained `display:none`, and the alternative `.spatial-description` blocks remained clipped to 1×1px. The sunglasses poster became visible during the principle chapter; the principle/meaning copy did not become visible reading content.

**Expected/actual:** failure must retain a useful visible path through all server copy. The public source explicitly computes its effective reading mode as `N || P || k` (system preference, user preference, failure) and propagates failure into that mode. Locally, both `onFailure` and the controller-import rejection only settle the scene boot gate/set attributes. The parent considers only quiet preference and OS motion. Thus the fallback is a poster inside the long pin, while the content that replaces the failed visual typography stays hidden. This is a **failure-signal/SSR-mode integration defect**, separate from the scene owner's SDF/material/origin work.

**Suggested fix:** propagate a scene-failure state/event to the journey's effective mode, dispose the pinned presentation, and expose the existing server reading layout without changing the user's audio or explicit motion preference. Handle controller import rejection as well as model/context failure. Avoid automatically mounting the same failed runtime again just because the fallback mode changed.

Evidence: `/tmp/gazzar-home-review-r2/screenshots/gazzar-r2-local-contextlost-t130_2026-10-27T00-28-00-429Z.png`.

### R2-03 · P1 — The Arabic root inherits the Latin font stack

**Location:** `3-journey/journey.module.css:4` and `:503`.

**Repro:** load `/ar`, enable reading mode, inspect `.quiet-philosophy p`, `.quiet-outlook p`, `.post-extension p` and `.chapter-person`. At 1400×850 the local quiet prose computes to **Questrial/Arial, weight 400**; source computes to **Cairo, weight 450**, at the same 16.32px/29.376px size/leading. The local post-extension also inherits the Latin family despite its explicit 450 weight. Elements with their own Arabic family rule, such as quiet headings, do use Cairo. The difference persists in the no-JS reading path.

**Cause:** `.journey` sets `font-family:var(--font-latin)`. The attempted Arabic correction is scoped as `html[lang=ar] .journey body`, which cannot match this document: body is an ancestor of the journey. The global Arabic body font therefore cannot replace the nearer Latin declaration. The root also never receives the source's inherited Arabic 450 weight. Small chapter/person width and baseline differences were measurable in both desktop and mobile samples.

**Suggested fix:** apply the Arabic family and inherited weight directly to the journey root under the Arabic html selector, and preserve explicit Latin project-name/`lang=en` exceptions. Recheck prose ink, chapter/person alignment, reading layout and locale switches, not only Arabic headings.

### R2-04 · P2 — Scoped desktop typography overrides the English mobile metrics

**Location:** `3-journey/journey.module.css:587–595` versus `src/app/globals.css:55`.

**Repro:** EN 392×932 DPR1, score≈650. The source closing headline computes to **52.5221px**, local to **54.0156px**. At score≈580, source `.systems-shared` is **44.6645px**, local **45.9346px**, with different tracking and a roughly 6.56px wider text box. At score≈480, the build layout is roughly 7.12px wider/3.12px taller locally. Matching source/local closing screenshots are saved in the evidence directory.

**Cause:** the global <=760px rule correctly sets heading `--type-scale:1.055`, but the more specific scoped journey rule reasserts `1.085`. The scoped mobile override exists only for Arabic. This changes visible mobile typography even when the clocks and SVG paths match.

**Suggested fix:** preserve the English <=760px override at the same specificity, or remove the duplicate typography cascade and use the global source metrics consistently. Check post-lens, systems and closing headings, including 700/701 and 760/761 widths.

## Parent fixes independently rechecked during this round

### Short-stage geometry and native clipping — resolved at the tested sizes

The original override forced `min-height:0` and `height:100svh + distance`. This was a concrete parent defect, not a model/shader problem. At 1400×500, source stage height was 600px versus local 500px; source document height was 15268 versus local 15168. At score≈308 the Wujhat SVG width was 439.56 versus 366.30px, title top 156 versus 130px, and metadata top 462 versus 385px.

Fresh dev tabs after the parent's patch measured:

| Viewport, DPR1 | Stage height source / old local / fixed local | Document height source / old local / fixed local | Wujhat SVG width source / old local / fixed local |
| --- | --- | --- | --- |
| 844×390 | 600 / 390 / **600** | 12041 / 11831 / **12041** | 439.56 / 285.71 / **439.56** |
| 392×500 | 560 / 500 / **560** | 13145 / 13085 / **13145** | 295.88 / 264.18 / **295.88** |

The correction also reproduces the source's native release after score 714. At 844×390 the score ends at y=11441; native maximum is y=11651, where stage top becomes **−210px** in both source and fixed local. At 392×500 the corresponding values are y=12585, maximum y=12645, stage top **−60px**. Footer/colophon coordinates at those endpoints also matched in the measurements. The source deliberately clips the larger work composition in a short viewport; shrinking everything to fit was visibly wrong.

`getGeometry` now reports the measured pin distance rather than treating the CSS distance property as universally authoritative. **Real mobile browser-bar `svh != dvh` changes and existing-window orientation/resize are still untested.** The narrow browser used here has equal svh/dvh.

Evidence: `short-geometry.json` (before), `recheck-results.json` (after), and the paired `*-landscape-t308*` screenshots under `/tmp/gazzar-home-review-r2/`.

### Skip, chapter, end cue and menu pause — resolved at the tested desktop state

- Skip previously sought score 85 smoothly, leaving the extension hidden. The source seeks 102 immediately. Latest local click returned **y=7957, score=102.0000 immediately**, focused `#beyond`, then settled at 102.0013, matching the source sample y=7957/102.
- The English chapter now reads **STRUCTURE, SET FREE**, matching the source. Previously it read only STRUCTURE.
- At score 710.1072 the cue now reads **BACK TO THE START**. Invoking it settled at **y=2122, opening=26, story≈0.034**, the hero-world endpoint, instead of y=0.
- Opened the actual menu during an unsettled seek to score 20. The journey held at **9.2965** over the following 500ms, then resumed to **19.9868** after closing. This verifies the root settling RAF's menu gate, not complete shell/menu parity.

## Positive evidence and limits

Fresh own-tab source/local samples covered **0, 20, 85, 308, 345, 381, 413, 480, 580, 650, 714**, forward then reverse, at **1400×850** and **392×932**, in **EN and AR**, DPR1. Source tabs were activated before measurement and allowed to paint. Score attributes came from source `.experience`; local values came from `#top`. A first unsettled local score-zero sample was discarded in favor of the settled reverse sample.

At normal desktop height, the sampled native systems text geometry at 480/580/650 and the sampled SVG paths closely matched. Desktop path samples differed by about 0–0.01px at the recorded scores; the mobile 480 comparison had slightly different rounded scores and up to about 1.52px path-sample displacement, so that is not asserted as a same-time pixel pass. Project draw fractions matched in both directions: desktop nominal centers were approximately `.8497/.8508/.8487/.8497`, with the corresponding responsive values on mobile. Flattened EN desktop work measurements confirmed the actual four mark bounds and title geometry, not just path inventory. Deep work rectangles in the original matrix were sanitized by Vaelix and were not used as geometry evidence.

Raw dev `/en` and `/ar` responses, parsed after excluding scripts/Flight payloads, contained the server headings, four local project hrefs, systems/closing and footer text. Correct lang/dir was present before hydration. A same-origin sandboxed **scripts-disabled Arabic iframe** displayed the vertical server reading content; all four project links and footer links remained non-inert and pointer-enabled. This is useful fallback evidence, not a full no-JS accessibility audit.

Live navigation checks passed for EN→AR at Remoteplatz (score≈380.9853, y=15697, correct html lang/dir, no loader), Back from its real local 404, a cold `?work=wujhat` visit (score≈307.9953, y=13672), and reload after advancing that query entry to score≈649.9851/y=23160. These do not establish case-page parity. One earlier 8returns query attempt overlapped active dev edits and showed entry replay; the stable cold Wujhat/reload retest passed. Re-run all four query intents after owners finish rather than treating that transient observation as a confirmed new root defect.

Parent tick cancellation, visibility reset, snap restoration and renderer disposal paths were inspected. No additional confirmed root leak or self-rescheduling defect is claimed from source inspection alone. Full browser BFCache (`pageshow.persisted`), denied storage, repeated mount/GPU resource counts, real OS preference changes, blocked journey/controller chunks, and physical context loss remain untested. Likewise still open: real touch/coarse pointer, DPR2, dynamic browser bars, all breakpoint boundaries, resize while restoring, trusted audio/clipboard, motion continuity between sampled frames, and the final production build/SSR audit. Port 3100 was not used to sign off fixes because it preceded the latest dev patch.

Evidence is in `/tmp/gazzar-home-review-r2/`: `stage-samples.json`, `short-geometry.json`, `recheck-results.json`, and screenshot pairs. Original source material remains in `/tmp/gazzar-runtime` and `/tmp/gazzar-home-audit-r1`. All reviewer-owned Vaelix tabs are closed at completion; parent tabs 175555005/175555011 were not manipulated. A fresh full visual adversarial round remains required after all owners finish.
