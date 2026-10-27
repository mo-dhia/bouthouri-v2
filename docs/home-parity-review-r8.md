# HOME adversarial review — round 8

2026-10-27, live browser review approximately **09:54–10:30 UTC**. **Changes requested: two P2 findings.** The R7 optical correction and the exercised reading-scene lifetime/cue corrections receive bounded production acceptance below. This is **not full HOME parity acceptance**.

Reviewed the frozen production candidate **f155d0c**, checkout **a94435e**, at `http://localhost:3100/en` and `/ar`, against the public source HOME. No implementation changes, children, commits, package actions, checks, builds, typegen, server operations or process management were performed. The parent's reported check **89 tests / 3,286 assertions**, production build and production SSR audit remain attributed parent evidence, not independently rerun checks.

Only Vaelix source **175555005** and production **175555011** in original window **175554986** were used. Initial and final inventory: **one window / four original tabs**. New Tab **175555200** and Proton onboarding **175555201** were untouched. No new browser surfaces, launches, profiles, proxies, iframe workarounds, Vawzen/Veyra or CUA were used. Narrow testing used Vaelix's emulation-first `resize_page`; it is not physical-mobile or proven OS-native resizing.

## Confirmed findings

### R8-01 · P2 — Locale navigation retains reading mode when the source starts the new HOME in motion mode

**Exact healthy trigger**, EN desktop **1912×1009 CSS / DPR1**, motion initially enabled, audio entered with trusted QUIET, menus closed:

1. Freshly assign plain `/en` in the existing foreground tab; wait for the real ready choices, choose QUIET and allow the foreground entry to complete.
2. Seek native **5263 / story40**, invoke the actual reading toggle, then seek native **1009**. Both pages are now reading experiences: `aria-pressed=true`, document height **12446**, DOM story/opening/progress zero. Their sampled reading layouts agree before navigation.
3. Click the **visible Arabic locale link** and wait four seconds for the destination to settle.

| Settled destination | Source | Production |
| --- | --- | --- |
| URL | `/ar` | `/ar` |
| Reading toggle | **false — motion** | **true — reading** |
| Document height | **30610** | **12866** |
| Native y | **1009** | **915** |
| Hero | complete, departing | static |
| Story/opening | 0 / 0; world .4790 | 0 / 0; full static opening |

The source shows the motion opening/hero transition, while production presents the large static Arabic reading headline and glasses. This is a whole-layout/interaction difference, not merely a Next same-document versus source hard-navigation Performance entry difference. The source destination reports `localeReady=true`, route idle and restore mode, not a loading/fallback capture. No OS preference, storage or clock was forged.

An earlier AR reading → visible EN navigation after local context-loss recovery also left production in reading while the source returned to motion. That observation prompted the fresh **healthy** EN→AR reproduction above; the confirmed finding does not depend on failure state.

**Code fact:** `src/store/uiStore.ts` owns `quietMode` in a module singleton; `motion-toggle.logic.ts` changes that singleton, and `story-scene-gate.tsx` consumes it. The locale link uses Next `Link`. The observed locale transition retains this preference locally. **Ownership inference:** reconcile explicit reading-mode lifetime with the source's new-HOME/locale behavior in the route/navigation/motion owner. Preserve reading mode inside one HOME, retained semantic positions, the independent audio choice, OS reduced motion and the failure latch; do not fix this by globally resetting scroll or rebuilding the renderer on every mode toggle.

**Evidence:** `reading-locale-{source,local}-40-reading`, `reading-locale-{source,local}-after` in `evidence.json`; `reading-locale-before-pair.png` and **`reading-locale-after-pair.png`**. Source is left, production right. Source destination timeOrigin **1793096266723.4**; production document timeOrigin **1793096271396**. Both destination snapshots and the finding's primary images are retained completely.

### R8-02 · P2 — Persistent MENU uses the hero control's smaller typography and wrong width

**Trigger:** complete EN entry at **1912×1009 / DPR1**, traverse to a pinned chapter or footer714, menu closed. Reproduces after fresh entry/large312 seek, full traversal and menu open/close; it is not a transient roll pose.

| EN persistent control | Source | Production |
| --- | ---: | ---: |
| MENU font size | **11.44px** | **9.225px** |
| Control width | **101.75px** | **88px** |
| Left / top | **1733.78125 / 49.625** | **1747.53125 / 49.625** |
| Letter spacing | **normal / 0** | **.49815px** |
| Inherited type / tracking scale | **1.04 / .8** | **1.025 / .6** |

Both controls end at x1835.53125 and are 44px tall. The source's language/sound/talk utilities consequently sit about **14px farther right** than production's. The label is visibly smaller locally, not just a different invisible hit box.

**AR narrow repeat:** at **392×865 / DPR1**, footer714, source menu font **14.56px**, width **74.234375px**, x294.25; production **12.24px**, width **64px**, x304.484375. Both end at x368.484375/top16. Original Arabic label and loaded main fonts are present.

**Source/code facts:** the visible source persistent control lives under `.chapter-side`, whose specific rules set the 11px/14px typography, zero tracking and width behavior. Production replaces that owner with the shared header's `.sideMenu`; the button keeps the generic `menu.module.css` 9px/12px rules and header scale. The source main Latin and Arabic faces report loaded despite its optional fallback-font error/`localeFontFallback=true` flag. This is not evidence that the primary source typeface failed.

**Requested correction:** reproduce the source's persistent-control rules and variable ownership in the replacement shell. Preserve the separate hero/menu-dialog control styles; applying the larger type globally would change another source arrangement.

**Evidence:** `source-header-measure`, `local-header-measure`, `*-menu-ancestry`, `source-menu-font-evidence`, `ar-reading-*-nav-measure`; **`persistent-header-pair.png`**, plus original `r8-header-*-confirm` PNGs. Owner files: `src/components/layout/header/header.module.css`, `menu.module.css`, `header.logic.ts` and `header.tsx`.

## R7 optical adjudication

The original universal broad/white expectation is not supported. R8 independently observed **both source conversion branches**, then compared matching branches rather than grading the unlike second pair as a defect.

The history remains fresh EN → trusted QUIET → other existing task tab four seconds → foreground seek40 → same-size resize → actual canvas width1912→1910 with resize and immediate native174 → wait1s → restore1912/resize/wait1s → reverse40 → neutral pointer(0,0)/settle1.9s. The parent480ms scrub, clocks and materials were not altered. Native cache/conversion diagnostics observed existing work; no extra renders, conversions, atlas restoration or target-score scheduling were introduced.

| Native 256 conversion on return | Source | Production |
| --- | --- | --- |
| Matched white branch | run1, score68.29, Z1.028434, white/alpha.5 | run1, score70.4495, Z4.200102, white/alpha.5 |
| Unlike second pair, preserved | run2, score69.12, Z.566987, dark/alpha0 | run2, score70.2309, Z4.413387, white/alpha.5 |
| Matching dark production control | same source run2 | fresh run3, score69.9274, Z.080469, dark/alpha0 |

The first run's initial bounds diagnostic had a declaration error and did not execute; its attempted restore then failed. These failures and the premature “return” image are retained/excluded. The successful source bounds operation was subsequently performed in that same fresh document. Source run2 and production run3 provide uninterrupted fresh dark controls. Do not describe the first run as an error-free exact timing repeat.

8-bit RGB optical crop **(200,180)–(1500,800)**, activated foreground captures:

| Matched branch | Return40 MAE / p99 | Continue60 | Continue67 |
| --- | --- | --- | --- |
| White / white | **.314482 / 7** | **.027699 / 1** | **.000766 / 0** |
| Dark / dark | **.384203 / 9** | **.055901 / 1** | **.000541 / 0** |

At60, matching refreshed cameras have Z **3.8948863 / 3.8948750**; at67 **1.6776109 / 1.6775704**. Return40 retains small unsynchronized idle/pose differences; its MAE is not an assertion of identical geometry. Native conversion consumer/material/target ownership, not an arbitrary bound GL texture, identifies256 here. The draw trace's `visible` field was the **Lens_L leaf flag**, not ancestor/world visibility; it must not be presented as proof that glasses were visible at the earlier sculpture scores. The actual env-consuming draw/conversion records identify the relevant return pose.

**Disposition:** bounded acceptance of the correction underlying R7-01. Both branches and the unlike pair remain evidence. Probe overhead can affect native cadence; no branch frequency or universal first-visible score is certified. Parent countercontrols remain separately attributed under `/tmp/gazzar-reading-scene/`.

## Other production acceptance and limits

| Area | Independent R8 result |
| --- | --- |
| Reload entry / late replay | Completed40 ordinary reload returns ready0/manual restoration. The174→reading/motion remount→174→40/650ms→reload history and following completed40 reload both stay at ready0 through the later wait. Subsequent trusted foreground QUIET/3.1s→40 produces the broad field. No late native replay reproduced. |
| Foreground reading / hidden-entry reading | Foreground broad40→reading and hidden sharp40→reading converge to matching static lens fields. Broad-crop MAE/p99 **.140992/1** and **.058199/1**. Same canvas/context retained. EN opening fit **.8101939248682843**, zero DOM clocks and fully open reading reveal agree. AR narrow/wide row/font samples also agree; evidence includes screenshots and some truncated geometry excerpts. |
| Retained scene work | Quiet same-size resize performs no capture; actual2px changes update existing256. Settled static samples show zero object draws; offscreen reading transition records no local capture, followed by finite visible work. Camera static pose is[0,.12,9.8]. Motion return upgrades and complete174 render successfully; rapid warm toggles/resize end in the latest motion mode. |
| Private atlas disposal | Three production cycles were executed successfully. The preserved GPU-result prefix fully records **two** reading transitions, each disposing one1536×2048 private derived target, textures7 and zero settled draws; intervening motion records textures13. Canvas/context/renderer/glasses/raw256/cache identities persist. The third cycle's detailed returned values were truncated from the saved output: do not treat them as a fully retained independent three-cycle log. Parent's full three-cycle dev log remains prior evidence. |
| Failure / HOME unmount | Actual production `WEBGL_lose_context` removes the object canvas, exposes reading and latches failed across two mode toggles. Actual locale navigation clears failure and mounts a new ready canvas. R8-01 still applies to the separate reading preference. Fresh physical OS-reduced startup and production held-font/held-logo cancellation were not independently repeated; those retain code/offline/parent-dev evidence. |
| Reading cue | EN and AR,1912×1009 and392×865: three actual reading-cue handler activations separated by mode cycles each call `#beyond.scrollIntoView({behavior:'auto',block:'start'})` **once**. Landing y2018 desktop /1730 narrow. Temporary call counters are restored. No duplicate listener reproduced. |
| Pristine HOME return | Fresh EN312 wide→visible AR→392/footer→single Back gives EN12091/≈312; Forward gives AR21772/714 in both. An initial source wide-read raced hard navigation and is excluded as a verified wide frame. The later retained setup independently records ready AR312 at wide before resizing. |
| Cleared generic return | Separate fresh setup without an intervening Back: AR reload→ready0→QUIET→footer→Back restores saved EN16362/**489.35** in both; Forward restores AR21772/714. An earlier reload after Back/Forward restored the already-updated EN12091 in both; it is preserved as a different history, not this fallback oracle. |
| Retained intent / no-op footer | Locale-restored AR footer714 stays714 after same-size resize/ready/irrelevant attribute transaction. Reading gives3827; motion gives12091/312 in both. The temporary attribute is removed. |
| Menu | Full-close removal/focus return **676.7ms source /681.1ms production**. Interrupted open600ms→reverse200ms→reopen keeps modal/lock and completes. Native500px seek remains locked.40→174 immediately before opening settles174 beneath the modal in both. EN/AR full-open captures retained. Local style selectors in the early interruption probe did not resolve CSS-module nodes, so this is not fresh all-track pose-continuity certification. |
| Footer | Trusted CDP custom Enter records source to-logo219.2ms/logo2467.4ms; production227.6/2471.6. Trusted reverse reaches word2924.9/2925.3ms. Do not time local resolving from its first observer row, which preceded the probe's key timestamp reset. Painted-G drag takes the direct to-logo path and releases held; counter drag stays word. Settled EN/AR thought copy matches; AR thought CSS-viewport MAE.107236/p99=1. |
| Work | Sole active project links/inertness and focus behavior exercised at308/312/349/385/417. At308 draw≈.8502 does not emphasize; completed312 focus/native Wujhat stroke hover emphasizes. Final gate-result arrays are saved prefixes, not complete per-project raw logs. Four composition captures and original routes remain available. |
| HOME visuals | Refreshed EN captures with current camera/cache/score records cover40/60/67/71/128/174/218/280/312/349/385/417/500/580/658/714; final hero/menu and large initial312 captures also retained. EN full-viewport sampled MAE **.044655–.322073**; p99≤1 except40/p99=6. These numbers do not close R8-02 or certify continuous motion. |

AR392 captures cover hero,40/60/67/71,128/174/218,Ideas280, all four projects,500/580/658/footer and menu/thought. One accumulated history pair has different optical/sculpture lighting, especially174 (whole CSS viewport MAE4.1065/p99=119). It is **retained and not accepted as universal narrow visual parity**. Fresh narrow174 and reading/motion remount controls subsequently match at MAE **.093077/.147942**, p99=1, with complete Arabic title. Those controls do not prove why the earlier lighting history diverged; no material retuning request is inferred from it. Main source fonts were loaded. Source missing-glyph/compositor failures are not copied as intended design.

Physical touch/coarse-pointer hardware, DPR2/other GPUs/browsers, dynamic mobile bars, real OS preference changes, short landscape, every breakpoint, audible balance/autoplay denial, exhaustive pending-resource/failure permutations, actual BFCache/denied storage/expiry, physical keyboard default actions and continuous frame-for-frame motion remain unverified. Current SSR/no-JS/failed-chunk guarantees retain parent/prior evidence. HOME destination-page content is outside this review. The ordinary fresh580→reading→motion offset policy retains prior acceptance; it was not freshly isolated in R8.

## Evidence integrity and handoff

Canonical temporary evidence: **`/tmp/gazzar-home-review-r8/`**. `evidence.json` contains **693 recovered labeled/unlabeled records**, `printed-tool-outputs.jsonl` preserves printed responses, `review-operations.jsonl` preserves browser-operation scripts, `capped-tool-output-blocks.jsonl` preserves capped waits, `metrics.json` records crop metrics, and `screenshot-manifest.json` maps all **152 original PNGs** into `screenshots/`. Source is left in the new horizontal pairs. Narrow metrics crop CSS(0,0)–(392,865); larger physical screenshot padding is excluded.

The original in-memory logger used `load().push()` without re-storing the changed value, so its checkpoint file was empty. After browser release the index was rebuilt from **this session's saved tool outputs**, without further browser use. **20 printed records are partial excerpts**, and capped wait output omitted some intermediate records. Missing content was not invented or reclassified as full raw evidence. The two findings' primary state measurements/images and final release records are complete. `provenance.json` documents the recovery. The wider screenshot sweep has stronger pixel evidence than exhaustive retained per-frame metadata; it is not universal acceptance.

**EXPLICIT RELEASE at10:30:27UTC**, with no pending browser calls and no browser use afterward. Both assigned tabs remain plain EN/y0,1912×1009 CSS/DPR1, entrycomplete, motionenabled, menusclosed, audioOFF/quiet, heldfalse, manual document restoration, no width overrides, no R8 globals or temporary attributes, iframe0. Fresh document assignments after diagnostic cleanup removed injected research-module/prototype state. Final actual sound controls say Enable sound/false in both. Final inventory is the original one window/four tabs; local3100 is active. `release.json` preserves the final audits/inventory. Restoring1912×1009 is not claimed to clear CDP emulation.

Only this repository report is written; no implementation change or commit is made. The parent owns subsequent fixes, validation and another independent review of **R8-01/R8-02**.
