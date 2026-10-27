# HOME adversarial review — round 4

Date: 2026-10-27. Independent integrated HOME review in progress. This document records live source/dev evidence and final frozen-production rechecks; it is **not final parity acceptance**. The initial port3100 build was excluded as stale. Parent supplied frozen production **b279deb** (including shell07e3acc / scenec61bccf) at01:02UTC, with reported check57tests/2894assertions, build and HTTP SSR audit pass. Final review now uses that build in the granted local tab11; no reviewer build/server management is performed.

Parent disposition: this round was stopped after the confirmed lens P1 to
transfer the sole permitted browser pair to its implementer. Evidence below is
preserved; unfinished temporal/morph checks remain unaccepted. A fresh independent
round will review the corrected production build.

Scope: cold entry, forward/reverse motion and handoffs, object/text chapters, project gates, systems/footer, material interactions and locale/menu/reading integration in EN/AR desktop and narrow layouts. Vaelix only. No implementation edits, commits, build/typegen, server restart or process management.

## Review provenance

- Fresh reviewer-owned EN source/local tabs: 175555163 / 175555165. Unique `qa=independent-r4-en-20261027` URLs. Reserved parent/owner tabs are not used.
- Actual initial CSS viewport: **1360×1000, DPR1** in both tabs. Window creation and `resize_page` requests do not determine the measured inner viewport in this environment.
- Source score/opening/world attributes are read from `.experience`; local story attributes from `#top`. Tabs are activated and allowed to paint before rendered comparisons.
- Dev scene cold boot reports ready, local Troika SDF typography. Both entry choices are ready and their QUIET control bounds match `(469.203125,590,90,48)` at the measured viewport. Selecting QUIET uses the existing control handler and is not a trusted-audio test.
- Working tree is concurrently edited by owners. Initial base commit `8222d4d5023eeac4525705b92cf2628a1bbeb76d` is not a frozen implementation revision.
- Memory-pressure override: parent closed reviewer extras **175555163 / 175555188 / 175555181 / 175555183**; reviewer had already closed **175555165**. Continuing only in explicitly granted main-window pair **175555005 / 175555011**, actual1912×1036/DPR1. No new tabs/windows will be created. Earlier screenshots predate this override and are retained only as bounded evidence; temporal/morph timing under the former concurrent-window GPU load is not accepted.

## Confirmed findings

### R4-01 · P1 — Sunglasses lenses are materially darker and lose the source reflection field

**Repro:** fresh EN source/dev, **1360×1000 CSS px / DPR1**, QUIET audio entry, seek forward to **y5216**, opening26, source score40.00 / local39.9999. Activate each tab, wait two paint frames plus **1.8 seconds**, capture. Repeated after the score67/74 crossing and reverse seek to40; the discrepancy persists. Both object position/silhouette and optical caption agree, and local scene reports ready/visible. This is not an audio/quiet-reading mixup or a hidden stale source capture.

**Actual:** source lens interiors retain a broad charcoal reflection field and brighter right/bottom reflected rim; local lenses are nearly black with a narrow top highlight. The local bridge/top highlight remains bright, so this is a substantial material/reflection difference, not a uniform page-opacity difference. The source gray veil during the score67 crossing is also brighter; that transient frame is supporting evidence, not the primary reproducible trigger.

**Single-window recheck:** parent-granted source5/local11, **1912×1036/DPR1**, y5404, source40.00/local40.0034, opening26, 1.8-second activated settle. Reflection mismatch remains: local left lens has a large bright rectangular reflection absent from source; right lens lacks the source's broad low-contrast reflection. Pair: `/home/jarvis/Downloads/r4-source-main-t40_2026-10-27T01-01-09-555Z.png` and `/home/jarvis/Downloads/r4-local-main-t40_2026-10-27T01-01-12-902Z.png`. This eliminates concurrent visible QA windows as the explanation. Source/local geometry remains aligned. At the earlier1360 trigger, an interior sample crop `(600,350)-(900,600)` has mean RGB22.57/source versus12.71/local (median22 versus13).

**Evidence:** `/home/jarvis/Downloads/r4-source-en-t40-recheck_2026-10-27T00-55-49-867Z.png` and `/home/jarvis/Downloads/r4-local-en-t40-recheck_2026-10-27T00-55-53-094Z.png`. Original first-forward pair and score67/74 captures are indexed in `/tmp/gazzar-home-review-r4/evidence.json`. Scene material/environment setup is in `2-story/story-glasses.ts` and `story-scene.animate.ts`; the underlying cause is not yet isolated by this reviewer.

**Acceptance:** compare the actual lens/frame reflection field at the matched score40 and during60..71 after correction, with the frozen build. Matching original GLB/material constants alone does not close this visible mismatch.

**Implementation investigation, not yet independent acceptance:** a controlled
cold source reload at1912×1009/DPR1 showed the sharp left rectangle too
(cubeVersion6). Reducing only `.canvas-layer` width by2px and restoring it
produced the previously captured broad-charcoal atlas (cubeVersion10); a
synthetic window resize with unchanged geometry did not. The scene implementer
traced the difference to the shared mixed-resolution PMREM refresh sequence,
not the authored lens constants. The correction must preserve the clean cold
state and match the real remeasure transition. Fresh review must record matching
geometry history, viewport and capture state, not compare unlike PMREM states.

### Excluded observation — initial hero capture before a fresh foreground paint

The first local hero PNG lacked copy/signature despite complete entry and matching DOM metrics. A second activated capture shows the correct name, support and signature with exact source rectangles. The first PNG is excluded as settled-state evidence; no hero-copy defect is claimed.

## Bounded desktop evidence before the memory override

EN1360×1000/DPR1 settled foreground checkpoints: opening16.58 at y1800; story40/67/74/128/174/218/265/280/312/349/385/417/442/480/580/658/700/714. Scene text and sculpture composition at128/174/218, Ideas at265/280, four work compositions, work→systems442, both systems chapters and closing/footer closely match in paired captures, apart from R4-01. Dynamic idle/background time is not frozen and is not graded as a pixel difference. Final footer information is exactly `(108.796875,350,1142.40625,92.890625)` in both; word mask is exactly `(27.1875,600.265625,1305.625,319.734375)`.

At312/349/385/417 the corresponding project is the sole non-inert/tab0 section; all other links are inert/tab−1. The active completed mark has draw1 and pointer hit `stroke`; pointer-enter sets emphasis/work-hover in both source/local and leave removes them. Original localized project destinations are retained. Programmatic focus is accepted by the active button in both; this does not establish default physical keyboard behavior. These are live handler/gate checks, not a physical pointer certification.

Footer Enter handler reaches morph then logo in both and original Perspective thought is announced locally. Initial morph/return timings and one local thought capture under memory pressure are **not accepted**: concurrent windows starved frames and the local phase/paint lagged wall time. Retest in the granted same-window pair/frozen build before deciding whether this is a defect. No timing failure is asserted from those captures.

## Limits

No claims about physical touch, real coarse pointer, DPR2, native default keyboard acceptance, audible balance or GPU loss are made from this browser automation. Parent-provided failure/audio/clipboard checks remain parent evidence and are not mislabeled as repeated here.
