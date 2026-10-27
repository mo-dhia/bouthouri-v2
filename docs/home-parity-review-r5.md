# HOME adversarial review — round 5

Date: 2026-10-27. **Not accepted: four P2 interaction/history findings remain.** Read-only review of frozen production port3100 (parent identifies implementation8540377). Only this document and temporary evidence are written. No implementation edits, commits, checks/build/typegen, server or process management. Only the loaned Vaelix source175555005/local175555011 pair in window175554986 is used; no tabs/windows or iframes are created.

## Confirmed findings

### R5-01 · P2 — Ordinary HOME reload resumes the journey instead of replaying source entry

At 1912×1009 CSS px/DPR1, plain `/en` (empty search/hash), complete QUIET entry using the trusted CDP double-click path. Seek forward40→60→67→71→40; native y5263, opening26, source40.00/local40.0008. Call `location.reload()` in each existing foreground tab. After the new document has fonts/scene ready and another2.5 seconds:

- Source: navigation type`reload`, y0, story0/opening0, `data-home-entry=fresh`, `data-hero-boot=ready`, hero phase`ready`; entry choices await selection.
- Production: navigation type`reload`, y5263, story40.0008/opening26, hero phase/boot`complete`, world1; entry is skipped. Its history checkpoint is `/en`, perspective progress.57144, scrollY5263.

The source trigger was repeated after an already-completed trusted entry, so this is not an incomplete-entry capture, query intent, hidden stale paint or unlike viewport. It confirms the previously open reload observation as a HOME flow mismatch. Local `resolveHomeRestoreIntent` in `src/lib/navigation/home-navigation-state.ts` explicitly chooses a semantic reload checkpoint; source ordinary reload restarts its entry. Preserve the separately verified locale/history/work-return semantics when correcting reload behavior. No case-page implementation is requested here.

### R5-02 · P2 — Keyboard footer activation omits the source's220ms resolve phase

At EN1912×1009/DPR1, score714/y29601, focus the footer word and press Enter. The source's custom key handler was exercised first through trusted CDP Enter, then observed in a controlled repeated handler run. A distinct-mode MutationObserver records `resolving` at5.1ms, `to-logo` at222.4ms, and `logo` at2467.4ms. The frozen local records `to-logo` at1.1ms and `logo` at2254.4ms. Its thought therefore begins about220ms early too.

This is a concrete timing difference in the same-window pair, with active foreground rendering. The public source `45adsxrqjjj5i.js` confirms `activate()` starts`resolving` and waits.22s before`to-logo`; pointer pull release starts`to-logo` directly. Local `footer-material.ts`'s shared `activate()` immediately starts`to-logo` and resets the idle/wave geometry, so keyboard activation also lacks the source's geometry resolve/capture transition. Add the small source keyboard resolve phase while retaining the direct drag-release path. A final foreground run without screenshots during either transition measured source Enter→logo2469.4ms/local2260.3ms and Escape→word2929.9ms/local2947.6ms. The reverse duration passes this bounded check.

### R5-03 · P2 — Resizing a locale-restored HOME loses the restored semantic position

Start EN1912×1009/DPR1 at score312.0114/y16362 and use the HOME language link to AR. Both locales restore Wujhat correctly at the same viewport, with no entry replay. Resize the same tab to392×865 and wait for rendering/layout: source recomputes y12091/score311.99, whereas local retains y16362 and displays score489.3488 in systems.

Independently repeated the reverse geometry on stable, fully revealed `/ar` documents (`routePhase=idle` on source). At392×865 both tabs are explicitly settled at y12091/score311.99. Resize to1912×1009: source recomputes y16362/score312.01; local retains y12091 and displays score182.3269. Both object canvases have the correct new1912×1009 size. This is a root restore/resize transaction difference, not stale GPU pixels or a font measurement mismatch.

The source also reapplies its locale work position on reading-layout changes in this restored mount: footer714→reading yields y3827, then motion returns y12091/312. Local footer714→reading clamps y8541 and motion retains8541/164.5805. The same narrow AR reading document/section/footer dimensions match exactly in both. Treat this as related restore-lifetime evidence; the ordinary fresh-mount current-offset mode-toggle behavior previously accepted in R3 is a different history and should remain covered.

Acceptance: recheck locale/history restored mounts through real viewport and effective-layout changes, after the route cover has completed. Coordinate the transaction with current geometry and shared frame; avoid blindly retaining a pixel offset when source reapplies its semantic restoration.

### R5-04 · P2 — Menu closing substitutes a short surface wipe for the source's reversed timeline

EN1912×1009/DPR1, ordinary HOME, motion enabled. Open the real menu and allow1.5s for its complete opening. Observe dialog`open`, source`data-phase`, and html`data-menu-open`, then invoke the actual Close handler. Source enters`closing` at0.9ms and removes the modal/lock at665.8ms. Local removes them at364.9ms. A preceding independent close sample still had source open at500.3ms while local was already closed at501ms.

Source public shell code reverses the current complete opening timeline at`timeScale(1.55)`. Local `src/components/layout/header/header.logic.ts`, `close()` around251, cancels those animations and starts a new340ms surface clip plus180ms content fade. This visibly changes the order/duration of the menu departure and releases scroll/focus early. Match the authored reversible timeline and interruption behavior using the existing plain animation tools; GSAP remains prohibited.

An unsettled native seek immediately before opening also exposed different clock policies: source40→174 completes under the modal, while local holds40 until closing and then resumes. This is related closing-state evidence, not a fifth blocker based only on hidden attributes. Both ultimately settle174 and both restore the invoking menu control's focus. Keep the previously accepted pause/lifecycle contract in view while reproducing the visible close transition.

## Independent bounded acceptance matrix

“Pass” below applies to the exercised trigger/captures, not every animation frame or device. Parent validation numbers and prior-round evidence remain attributed to their owners.

| Area | Round5 result | Evidence / practical boundary |
| --- | --- | --- |
| R4-01 reflection correction | **Pass at the matched captured states** | Source/local clean sharp rectangular reflection state at40 and the broad charcoal state after an actual canvas-width1912→1910→1912 cycle agree closely. Same-size`resize` before/after captures preserve the reflection state in both. No new lens-material blocker reproduced. GPU atlas hashes are implementer evidence, not independently re-read here. |
| Camera / optical crossing | **Pass at sampled histories** | Ordinary forward40→60→67→71→reverse40 and the separate40-refresh history were captured with matching viewport/native y. Refreshed optical crop MAE at60/67/71 is.0203/.0008/.0486 RGB levels, p99≤1. Cold first-forward60/67 are.1473/.0075;71 is.3931/p99=4. Small pointer/idle differences are not called failures. |
| Sculpture / Ideas handoff | **Pass at sampled desktop frames** | EN128/y10302 and174/y11817 have complete matching type/sculpture compositions; crop p99=1. Ideas265/y14814 and280/y15308 match text and continuing pen origin at the sampled settled frames. Wujhat312/y16362 composition is close. Prior R4 four-project inert/draw/hover checks are reused, not claimed as repeated for every project. |
| Hero / entry / reverse | **Bounded pass; reload fails R5-01** | Trusted QUIET entry completes in both. Activated resting portrait/name/support/signature and shell align. Forward lens/sculpture traversal and reverse to40 remain usable. Returning to native0 restores the hero and shell. Marquee phase and pointer lighting are naturally time-dependent; no continuous-frame hero certification is claimed. |
| Footer word→logo→thought→word | **Not accepted: R5-02** | Both real Enter handlers reach logo and original Perspective thought; first source Enter was trusted CDP. Settled EN/AR thought layout and reverse silhouettes agree closely. Source clearing→to-word→word trace takes about.88+2.04s; local returns after the same bounded interval. Initial keyboard resolve is missing locally. |
| Footer pointer clipping / drag | **Pass at exercised desktop coordinates** | Trusted drag from G counter(95,700)→(95,790) does not capture/activate in either. Trusted drag from painted stroke(80,700)→(160,760) sets held/capture, crosses threshold and enters`to-logo` in both. Release clears held. This is actual CDP pointer dispatch, not a synthetic touch claim. |
| Menu | **Not accepted: R5-04** | Full-open layout/copy/geometry is close once hover/focus selection is accounted for. Native offset remains locked against a500px programmatic seek; both restore opener focus. Closing timing/sequence differs. No physical Escape/default-key certification is inferred from Vaelix key events. |
| Locale / responsive restoration | **Not accepted: R5-03** | EN→AR at312 initially restores y16362/312 without entry replay in both. Semantic restoration across viewport/effective-layout changes differs as described above. |
| EN reading layout / R3 margins and clearance | **Pass at1912×1009** | Both document12446, quiet-philosophy y3127.890625/h896.5, outlook y4024.390625/h452.640625, work-track y4668.734375/h4053.9375, systems y8934.546875/h3511.28125, footer y11557.921875/h887.90625, information y11671.546875/h99.890625. Fresh ordinary580→reading clamps y11437; re-enable retains11437/162.47 in both. |
| Arabic narrow smoke / R3 fixes | **Pass at392×865/DPR1 for sampled geometry/copy** | AR128/280/312/580/714 sampled at y7660/11321/12091/18545/21772. Text, mark, systems and footer geometry align. The final thought fits above the colophon without unintended clipping in the sampled phase. Both reading documents9406; footer8644.53125, information8724.53125/h195.3125 (relative80). Cairo prose uses the Arabic face. This is a narrow desktop viewport, not a physical phone. |
| Background | **Bounded cold-input pass; accumulated histories not graded** | After fresh ordinary EN navigation, score580 and the same trusted center hover followed by3.5s, both fields are subtle and close (empty crop mean7.914/7.979). An accumulated AR locale/reading/resize history produced a much brighter source field; fresh controls removed that difference, so it is explicitly excluded as a generic pixel/material blocker. |
| Failure, SSR, sound, clipboard | **Parent/prior evidence retained** | Parent supplied actual blocked scene chunk503, simulated context-loss latching/route retry, trusted SOUND/mute/COPY, local-font network check and build/SSR audits. These were not independently repeated here. Supporting case/vision/services/contact pages remain later scope; HOME hrefs are original destinations, not claims those pages exist. |

## Capture provenance, exclusions and evidence

Primary desktop is **1912×1009 CSS px/DPR1**; responsive smoke is **392×865/DPR1**. Source scores/opening come from`.experience`; production from`#top`. Main native mapping at desktop:40→5263,60→6635,67→7115,71→7390,128→10302,174→11817,265→14814,280→15308,312→16362,580→25188,714→29601. Source prints two decimals; production generally prints four. Opening is26 at these story samples. Navigation/entry and geometry history are recorded with the frames.

Setup briefly exposed a source1912×1036 viewport and stale source canvas sizes while hidden. Those setup captures are excluded. All accepted comparison frames were taken after foreground activation, the actual requested viewport/canvas measurement, and a settling delay. Same-size resize and real2px canvas resize are distinct histories. The early first-boot broad-field40 capture is not used to assert the sharp atlas boot sequence; the separately captured clean/no-op pair and real remeasure pair establish the visible correction. Initial failed capture-script attempts produced hero PNGs with score-like names; they are excluded from the evidence index and pixel metrics.

Some temporal source PNGs contain partial compositor text damage during active footer painting. The settled thought, distinct phase trace and reverse geometry are retained; those damaged DOM pixels are not treated as intended content or a local defect. Sampling delays and screenshot latency are not mistaken for exact intermediate-frame timestamps; mutation traces provide the transition durations above.

Evidence is indexed under`/tmp/gazzar-home-review-r5/evidence.json`, with paired settled PNGs and`pixel-metrics.json` in the same directory. Selected raw screenshots are copied into its`screenshots/` directory; original Vaelix downloads remain in`/home/jarvis/Downloads/`. The review's only repository change is this document.

No physical touch, DPR2, dynamic mobile browser bars, audible balance, native keyboard defaults, actual GPU loss or broad browser/GPU sweep is asserted. Prior R1–R3 coverage is retained rather than reopening every previously passed trigger. Four concrete findings above block the HOME signoff; source-identical continuous motion is not established by passing numeric or build tests.

## Handoff

Browser ownership is **RELEASED** at completion. Both original tab IDs are preserved on ordinary EN HOME at1912×1009/DPR1, y0, entry complete, motion enabled and menus closed. Temporary test observers are disconnected, review globals/session marker removed, and no temporary frames or replacement tabs exist. Parent may resume mutation of the pair after this handoff.
