# Services and shared footer repairs — offline review R5

Fresh independent review on 2026-10-28 of `770aa24055a6404262a43bb9c88a4a0c46dd6e36` plus the uncommitted footer observer follow-up. **The three prior Services P2s and footer observer-history finding are corrected. One separate P2 remains in the shared footer's runtime Canvas2D failure path; no P1 was established.** This failure gap predates the observer split.

## P2 — A footer Canvas2D failure leaves the DOM word hidden behind an empty canvas

**Locations:** `src/components/layout/footer/footer-material.ts:586`–589 hides the DOM word before drawing; the unchanged-rest early return is at lines 402–408. The context setup at lines 59–63 handles only initial context unavailability. The event lifecycle at lines 997–1037 has no Canvas2D `contextlost`/`contextrestored` handling.

**Trigger:** After the footer material has successfully painted and hidden the DOM BOUTHOURI word, its Canvas2D context is lost and its bitmap is cleared. Remain at the same resting footer pose. The standard footer retains this material in reduced/quiet mode too. A post-startup exception from the drawing transaction has the same missing-fallback path.

**Cause and impact:** The loss does not invoke `reset()`/`restore()` or otherwise restore `word.style.visibility`. `setActive(true)` can wake the controller, but an unchanged resting pose takes the `paintedRest` early return without checking context health or invalidating the prior paint. A restoration event also does not invalidate that cache. The identity can therefore remain visually absent even though its server-rendered DOM is present. In normal motion a later idle episode or changed pose may repaint after restoration; in a reduced resting footer there is no idle-episode redraw. This does not claim that the footer links or all page text disappear.

**Executed offline proof:** The retained probe executes the actual `mountFooterMaterial` through the existing isolated fixture, with inert DOM and Canvas adapters. It first verifies nine painted glyphs and a hidden DOM word, then models the lost bitmap/no-op drawing and dispatches `contextlost`. It repeats in EN/AR and normal/reduced mode. A healthy-context restoration event at the same pose and an explicit reset provide separate controls. Representative reduced-mode output:

```json
{"case":"active-2d-context-loss","locale":"en","reduced":true,"domWord":"hidden","overlay":"visible","paintedGlyphs":0,"queued":0,"lossPrevented":false}
{"case":"2d-context-restored-same-rest-pose","locale":"en","reduced":true,"domWord":"hidden","paintedGlyphs":0,"queued":0}
{"case":"reset-control","locale":"en","reduced":true,"domWord":"","overlay":"hidden"}
```

A separate post-startup `fill()` exception, after a one-pixel placement change forces a real redraw, escapes the frame after its canvas clear and DOM hide:

```json
{"case":"post-startup-2d-draw-failure","locale":"en","error":"Injected Canvas2D draw failure","domWord":"hidden","paintedGlyphs":0,"queued":0}
```

The AR outputs match. These are bounded failure-injection reproductions, not a live GPU/context-loss test or evidence that a healthy Canvas2D renderer routinely throws.

**Smallest fix:** Give this material an owned failure path: on Canvas2D context loss, stop its work and restore the DOM word; subsequent eligibility/input wakes must not hide it again while the context is unusable. Route drawing exceptions through the same fallback. Retaining a latched static fallback until teardown is sufficient; if automatic restoration is supported, invalidate `paintedRest` and repaint successfully before hiding the DOM again. Remove any added context listeners on disposal. Cover post-startup loss and restoration/fallback in normal and reduced standard footers, while preserving HOME's journey eligibility and single material RAF.

## Corrected findings

- **Services RAF accumulation:** `schedule()` is shared by external `wake()` and frame continuation (`services.animate.ts:21` and `:79`). A synchronous wake from the actual opening's measurement/reset reserves the single next frame; continuation reuses it. The mounted regression covers repeated resize/font refresh, unchanged ambient composition work, MENU suspension and teardown. Its maximum outstanding RAF count is one.
- **Services WebGL failure:** Draw, import/create/null and resize failures converge on `failRenderer()` (`services.animate.ts:25`). It clears the owned renderer before guarded disposal, hides the decorative canvas, publishes the depth fallback and wakes independent DOM work. Focused tests complete the finite entry and operate the actual Services gate after failure; a disposal exception does not strand the presentation transaction.
- **Shared practice profile selection:** `practice-objects.ts:58` chooses the composition with `window.innerWidth`. Measured host width supplies the physical buffer and a single reference normalization. Tests cover both variants/locales, narrower scrollbar-style hosts on both sides of 600/1024 boundaries, repeated measurements and an existing renderer changing profile. No second scale or physical-height profile branch was found in this repair.
- **Footer independent ownership and fallback:** The successful standard-footer owner still creates/removes its own physical tail and updates it on viewport/mode changes. It does not depend on the editorial controller loading. The all-profile CSS `transform: none` fallback remains available when the footer controller fails to import or JavaScript is unavailable. Initial `getContext('2d') === null` leaves readable DOM in the executed EN/AR endpoint probes; that startup case is distinct from the P2 above.
- **Upstream Contact shrink:** The footer still observes its parent and preceding `main`, so unchanged mask dimensions do not suppress a position refresh. The targeted shrink test now supplies the actual content entry target. The root reports a live textarea resize/shrink reproduction in both source and local; this review treats the repair as robustness work, not an independently isolated source/local parity difference.
- **R4 height-only observer reset:** `measureStandardPosition()` (`footer.logic.ts:58`) reads only the document top/height and refreshes reveal/eligibility. The single RO performs full word/material measurement only when an entry targets the mask (`:147`–159). A mixed batch containing the mask still gets one full measurement. Parent/main-only notifications cannot call `material.measure()` and clear its idle/wave state.

## Observer, history and HOME checks

The new standard-footer regression checks unchanged word/material measurement counts across a physical height change and parent/main notifications, followed by a mask-target control that increments both. To go beyond its material stub, the independent probe mounts the actual footer material under the actual interactions controller, reaches a fully revealed standard footer, starts a real idle episode and then a real wave, and dispatches height-only resize plus parent/main entry batches in both locales.

For each phase, the probe compares the complete material dataset, drawn path coordinates, word-measure count, thought-instance count and timer identities before/after the notifications. They remain identical. Both phase samples retain one pending material frame; word measurements remain two initial measurements and there is one thought instance. Representative values:

```text
EN/AR idle:  kind=4, amount=0.00034, waveEnergy=0.00000
EN/AR wave:  kind=-1, amount=0.00000, waveEnergy=0.01294
```

The position-only path writes reveal transforms/opacity/inert state, without changing word geometry or writing another tail extent. No height-only observer feedback loop was established. The tail's one resulting parent size notification is position-only. The RO remains local to the footer and is disconnected on disposal; parent/main observation is standard-only. HOME continues to observe its mask and use its prior full geometry path, journey event, reading eligibility and single material scheduler. Existing HOME clock/reversal/material tests pass.

The real-material probe also invokes stale captured parent/main callbacks after disposal and verifies zero frames, timers, store subscribers and observed targets. The interactions teardown retains scroll-key removal, viewport/mode/visibility/intent/journey listener removal, tail removal, material disposal and prior inline-style restoration. Pending font/import continuations keep their disposed checks. No new cleanup defect was established in the observer follow-up.

## Executed verification and limits

One explicitly scoped Bun run completed: **30 passed, 0 failed, 4,209 assertions across seven files**:

```sh
bun test src/sections/services/services.animate.test.ts src/sections/services/2-opening/opening.test.ts src/sections/vision/1-opening/practice-objects.test.ts src/components/layout/footer/footer.logic.test.ts src/components/layout/footer/footer-geometry.test.ts src/components/layout/footer/standard-footer-pose.test.ts src/components/layout/footer/standard-footer-extent.test.ts
```

Independent reproduction and output are retained in `.artifacts/pages-parity-20261028/repairs-review-r5/footer-probes.ts` and `footer-probes.jsonl`. Run the script from the repository root with Bun when measurement is clear. Its assertions intentionally verify the observed failure state as well as the successful repair controls; a successful script exit is not a claim that the Canvas2D failure is fixed.

Read `AGENTS.md`, `docs/editorial-pages-architecture.md`, `docs/load-architecture.md`, `docs/code-splitter.md`, `docs/animations.md`, `docs/viewport-design.md`, and the prior Services/shared-footer review reports. Review scope was the three Services/shared-renderer repairs, footer observer ownership/history/cleanup, and concrete footer readability failures. Concurrent global navigation, route entry/HOME/page handshakes and route-surface implementation were excluded. Projects was excluded.

No browser/OS calls, external requests, full checks, lint, build, TypeScript/type generation, server/process management, package changes, staging, commits or delegation were performed. Only this report and ignored review evidence were written. All CPU commands completed before acknowledging the root's native-video measurement hold; no further test/fixture work was started after that hold. The served build and browser capture belong to root. This review makes no FPS, full visual parity, moving-parity or production-acceptance claim.

Reviewed SHA-256 values:

```text
ac46b78b2f48d0e57959ae08b9979fbce17da4b5c7b3b63c149c26197618559d  src/components/layout/footer/footer.logic.ts
4017e804d142a21d0051b58093c6e89e5b4e9f39a8341a076f5cc8ea69349493  src/components/layout/footer/footer.logic.test.ts
d313c01b19237c74355f9689683142411eb391def2f41810301771d696f9daa5  src/components/layout/footer/footer-material.ts
f4efd0f4a2be00fab0df4c597612e95bb3ba5b6dc3c95c6fbff257947a3021e4  src/components/layout/footer/footer-geometry.ts
8a9a49e33268e10a210d8341d6471e025c35a7ff9298d363423b015f3cb7798f  src/components/layout/footer/standard-footer-pose.ts
fedb4552e2070929f978af07eebe6be12205dae91f51066ccfabdf9913e27faf  src/sections/services/services.animate.ts
b84c90152a115f1b4e324a1dfbcf130968e006294380c2f1432cf8b6ea7b2fce  src/sections/services/services.animate.test.ts
1d914933bc754e2ec576e48f86a7a7d97578c0b1bca78db38c315e656cff6e8d  src/sections/services/2-opening/opening.animate.ts
e6da1f191cfae33438cc399755e614af624283e8c72ac60e297981f2de820dc6  src/sections/vision/1-opening/practice-objects.ts
90a2263a7d353285b7ef334957f2b328cf586f7a3c0bbbe02dd5946b41f88b54  src/sections/vision/1-opening/practice-objects.test.ts
```
