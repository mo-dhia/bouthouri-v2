# Vision implementation contract

Implemented 2026-10-28 from the public EN/AR Gazzar Vision HTML and focused source math. This document describes the Vision-owned content and controllers; the root agent owns route wiring, metadata, shared navigation/background and footer. Project routes remain outside this work.

## Entry and shell

`src/sections/vision/vision.tsx` exports the server component `VisionContent({ locale })` as default. It renders its own header and all five body sections, without a main, shared navigation or footer. Its root has `data-vision-root` and the locale direction. All copy, eleven narrative headings, metadata lists, decorative SVGs and both invitation links are in server HTML. Identity is MED D. BOUTHOURI / محمد ضياء بوثوري. Invitation links are `/{locale}/services` and `/{locale}/contact`.

The shared main uses `editorial-page practice-page thinking-page`. The enclosing shell exposes `data-editorial-page`; the fixed header has `.editorial-nav`. The controller measures that sibling navigation through the enclosing shell for the leadership safe area and follow-the-thought destination. The shared material pose is source time 448, environment .28 and surface quiet .65. The retained route-entry registry holds/releases the current physical owner after fonts and measurement. A visible opening also publishes a successful graphics draw or static depth fallback before the shared surface reveals it. Entry stays on Vision's existing RAF, starts once, and settles immediately for history/reduced or restored deep arrivals; late imports adopt the completed decision.

## Owned files

- `vision.tsx`, `content.json`, `vision.module.css`: complete server content and fixed-profile geometry.
- `vision-gate.tsx`, `vision-gate.logic.ts`: null client gate and dynamic controller import.
- `vision.animate.ts`, `masked-reveal.ts`: one demand RAF and DOM-only line-mask enhancement.
- `1-opening/practice-hero.ts`, `1-opening/practice-objects.ts`: source logo camera/pose and deferred Three renderer, reused by Services with root authorization.
- `2-perspective/system-geometry.ts`, `system.animate.ts`, `word-outlines.json`: word extraction, thread/structure drawing, reading remap and source font outlines.
- `3-narrative/narrative-math.ts`, `narrative.animate.ts`: four thought states, leadership voices and closing masks.
- `vision.test.ts`, `2-perspective/source-fixtures.json`: focused reference-math and endpoint checks.

No shared shell/HOME/store/route/package files were edited by the Vision implementation agent. All implementation artifacts, generators and source analysis are persistent under `.artifacts/pages-parity-20261028/vision/`.

## Deferred renderer API

Services dynamically imports `src/sections/vision/1-opening/practice-objects.ts` and uses:

```ts
createPracticeObjects(canvas, kind: 'about' | 'services', signal: AbortSignal)
  : Promise<PracticeObjects | null>

interface PracticeObjects {
  resize(actualWidth: number, actualHeight: number): number;
  render(progress: number, pointerX: number, pointerY: number,
    reduced: boolean, seconds?: number, entry?: number): void;
  dispose(): void;
}
```

`resize` returns the actual pixel extent. Width chooses the fixed reference canvas; actual height does not recompose the camera. DOM/pointer measurements normalize once before reference-camera calculations. `practiceHeroLayout`, `practiceHeroPointer` and `practiceHeroPose` take reference dimensions. The renderer has no clock, RAF or shared-store writes. It clones the selected geometry from `/assets/models/logo-finished-components.glb`; Vision uses Logo_Part_01_Finished and Services uses Logo_Part_02_Finished. It retains the source center/half rotation, camera, RoomEnvironment, material and lights. Owned GPU resources are disposed. Context loss reveals Vision's server SVG fallback and makes the next render fail into the controller's fallback latch.

## Source behavior

Public source graph: entry/content `077ip09mx02jh.js`, focused editorial/system/narrative module `2mzrkx5gfk3t8.js`, deferred object module 14697 through `11dg_viff64mz.js` to `1net0t0ybywaq.js`, `14joyask99ils.js`, `2nts7tjhwch04.js`. Compiled application/React/GSAP bundles are analysis artifacts only. No copied runtime bundle is shipped.

The system passage uses three natural articles and a ten percent extension of its measured reading distance. Its DOM translation remaps scroll without changing native input. SYSTEM./DETAILS. and their Arabic counterparts extract into subdivided source-font outlines; the extracted material becomes the escaped thread and structural path. Extraction, escape and tail thresholds retain the source intervals. Copy masks follow 0–.13, .34–.52 and .73–.94. The structural drawing settles from .81 to .95.

The four thoughts reveal at 0, .23, .46 and .69, then shrink and move into retained context at .14–.27, .37–.5, .59–.72 and .83–.96. The leadership voices begin at .015, .185, .355 and .525, each over .18 of leadership progress. Contours draw before word beats; punctuation and word length determine speech timing. Leadership title/copy reveal at .72–.88 and .84–.98. The other-side section and final invitation retain their independent source mask windows. These are focused math ports rather than generic intersection fades.

## Sizing and fallback

CSS is generated from the owned source selectors at 1920×1080, 768×1024 and 412×915, then uniformly width scaled in three exclusive ranges. Source geometry queries and clamps are evaluated at those canvases. There are no height/orientation layout queries or viewport-height design dimensions in the shipped stylesheet. Non-scaling SVG strokes have their own outer width-scaled thickness. `:where(.vision)` scopes selectors without increasing the source specificity; source page-root selectors map directly to `.vision`. The data-only passage padding, reading transform and word nowrap rules are retained.

Static HTML and failed controller imports remain readable. Before motion enhancement, thoughts are ordinary stacked content, leadership remains in document flow, voice sentences/contours are visible and the natural system articles remain complete. Reduced/quiet mode selects that readable layout, completes masks and parks ambient motion. A blocked object chunk leaves the decorative server SVG. That SVG is a stable approximation; the deferred renderer supplies the source material appearance.

One direct custom `scrollManager` registration uses `useRAF: false`. Vision's demand RAF presents all scroll DOM, entry, pointer easing and visible ambient logo motion. It parks after the opening when no update is needed, on hidden documents, and under MENU. Shared Storio state supplies UI preferences only. Listeners, observer, subscription, scroll key, RAF, abort signal, styles, masks and renderer resources are released on unmount. Async renderer adoption checks cancellation.

## Verification and remaining review

Scoped ESLint passes. `bun test src/sections/vision/vision.test.ts` passes 5 tests / 755 assertions. Fixtures execute the focused public source extraction functions offline and check both locale outlines at endpoints and interior poses. Additional tests check reading-extension continuity, width-selected reference poses, retained thought destinations and voice completion/order.

Root reported the integrated plain TypeScript check empty and the broader pre-freeze check passing. Those commands and the production build are root-owned. The Vision agent made zero browser/native/OS input calls.

Root's settled EN tablet 768×1024 measurement after the CSS corrections reports all five section heights equal to source: 2556.3667, 1024, 2867.2, 3276.8 and 880.6333 pixels. The hero-foot top is 717.2667 pixels and visually aligns with the source copy/cue. Evidence: `reference/vision-en-tablet-study-geometry.json`, `reference/vision-en-tablet-top-settled.png`, `root/vision-en-tablet-after-geometry-fix.png` under `.artifacts/pages-parity-20261028/`.

Final visual acceptance is outstanding. Root still owns production SSR/failure/reduced checks, matched desktop/mobile and Arabic captures, continuous native-scroll comparison, pointer/ambient history, restoration, category resize and independent adversarial review. The approximately .0667px tablet title-height quantization reported before the final geometry correction was not retuned offline. No completed continuous-motion or full EN/AR visual parity claim is made here.

Application/CSS files frozen at root's production-build request; further implementation changes require coordination with root.

## R6 reduced readiness separation

After root's explicit `CODE_EDIT_CLEAR` and `MEASUREMENT_CLEAR` following R5
release, Vision's registered `assetsReady` predicate no longer accepts reduced
mode alone. It still accepts its existing failure latch, a successful
`canvas.dataset.heroRendered` publication, or the opening's physical offscreen
visibility. Object boot, first static draw, ready/presented publication,
`ready(reduced)`, reduced entry skip, one demand RAF and cleanup are unchanged.

The cached source RouteSurface module61157, function D in
`.artifacts/viewport-validation-20261028/source-runtime/2gz902oulp4x8.js.pretty`
lines31–39, first requires W(main). It accepts depth fallback, no canvas or
heroRendered; otherwise its objectsReady/deep-scroll gate precedes physical
offscreen acceptance. It has no reduced readiness shortcut and retains two
settled observations. Source practice initialization in
`reference/runtime/2mzrkx5gfk3t8.js` under the pages-parity artifact directory
imports createPracticeObjects after locale/fonts even when reduced matches.
This correction removes the reduced exception; it does not change the local
offscreen policy, route settlement, clocks, durations or the4500ms asset ceiling.

Source review also found that the shared registry treated entry-animation skip
as assets readiness. Root explicitly authorized the minimal internal
`fallback` flag in `src/lib/navigation/route-entry.ts`: initialize false, reset
on register, set by fallback(). Assets readiness now evaluates explicit
readable fallback, absence of an assets predicate, or the actual predicate.
Reduced/history/already-started entry skip retains its original semantics.
No public API or current/held owner, release or once-only start policy changed.

`vision.animate.test.ts` mounts the actual Vision controller through the
existing isolated loader. Passage/narrative/masks/DOM/GPU are inert adapters;
object creation is held asynchronously. A registration wrapper captures the
real handler and delegates to the actual route-entry registry. Tests query
that registry and the handler while boot is pending, after adoption before
first draw, and after the successful static draw. Rejection/null/draw failure,
both physical offscreen directions, readable skipped entry, canceled late
adoption, disposal and at most one queued RAF are covered. Shared registry
regressions are in `tests/route-handoff.test.ts`; Services retains its real
opening/physics/body fixture coverage.

Raw logs are retained under
`.artifacts/pages-parity-20261028/reduced-readiness-r6/`. The unchanged-runtime
`before-fix-first.log` records19pass/5expectedfail/224assertions: both mounted
controllers returned registered=true/assets=true during held boot, and three
pure registry controls exposed skip/fallback separation. No fixture error or
correction occurred. The same24tests passed after the runtime correction
(259assertions). Final focused validation:

```text
bun test src/sections/vision src/sections/services tests/route-handoff.test.ts tests/route-surface.test.ts
71 passed, 0 failed, 4,187 assertions across 9 files

Scoped installed ESLint over the three runtime files, registry test,
two mounted readiness tests and three test-support files
exit0, no output
```

Every validation process exited. Root owns full check/types/build/SSR,
candidate manifests, commits and fresh independent production review. These
inert controller/registry results establish the readiness contract only;
they do not establish a cause or cure for R5's visible reduced reveal finding,
actual GPU presentation, visual parity or presented FPS. No browser/native/OS
input, server, package operation, stage, commit or delegation was used.
