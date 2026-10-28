# Vision and Services — offline source review R1

Reviewed the frozen working tree against `ac78d8b` on 2026-10-28. Both section directories are new relative to that commit. There are **three actionable P2 findings; no P1 finding was established**. No application files were changed.

## P2 — Services starts additional persistent RAF chains after remeasurement

**Locations:** `src/sections/services/services.animate.ts:28`, `:30`, `:37` and `:61`; synchronous wake paths at `src/sections/services/2-opening/opening.animate.ts:46`, `:97`, `:137` and `:157`.

**Trigger:** With Services motion enabled and the hero visible, resize the window, or otherwise request a geometry/font remeasurement. Repeat the resize while remaining in the hero.

**Evidence:** `frame()` clears `raf` at entry and calls `measure()`. The real opening controller calls `release()`/`reset()` during that measurement, and those call the supplied `wake()`. Because `raf` is now zero, `wake()` schedules a successor. At the end of the same frame, the page schedules another successor unconditionally whenever entry, the gate, or the visible hero needs animation. This overwrites the tracked ID without cancelling the earlier request. Both callbacks subsequently schedule successors, so the duplication persists; later remeasurements add further chains. A redraw can also be requested synchronously from the opening tick's input/reset paths.

A bounded offline harness evaluated the actual `mountServices` and `createServicesOpening` functions, substituting inert DOM, line-mask and graphics adapters and a queued RAF implementation. It loaded the hero at scroll zero, ran a normal frame, dispatched resize, and drained each queued browser-frame batch:

```json
{"ordinary":1,"afterResize":2,"nextFrame":2,"afterSecondResize":3}
```

These are queued presentation callbacks, not FPS measurements. The duplicate calls repeat gate/DOM work and can repeat object draws while a pointer is moving. They violate the single-presentation-owner contract even though progress remains outside React and Storio. The existing pure score/spring fixtures do not exercise this scheduling path.

**Smallest fix:** Use one guarded scheduling helper for both external wakes and continuation at the end of `frame()`. Keep the dirty flag separate from scheduling, so continuing ambient animation does not unnecessarily dirty all scroll compositions. If a synchronous wake already scheduled the next frame, reuse that request. Add a focused scheduler reproduction covering repeated resize/font refresh and cleanup, asserting at most one outstanding presentation callback.

## P2 — A Services render-time WebGL failure bypasses fallback and stops presentation

**Locations:** `src/sections/services/services.animate.ts:58` and `:61`; renderer loss behavior at `src/sections/vision/1-opening/practice-objects.ts:50` and `:73`.

**Trigger:** Lose the Services hero's WebGL context after the renderer has successfully mounted, while the hero is visible. Any later exception from `renderer.render()` has the same path.

**Evidence:** The shared renderer deliberately latches `contextLost` on `webglcontextlost` and throws on its next `render()`. Vision wraps this call in a failure handler; Services calls it without a try/catch. Its import/create promise catch only handles startup. Since the current RAF ID was cleared at frame entry, the exception escapes before the continuation is scheduled. The failed renderer stays installed, is not disposed, and does not set `rendererFailed`, hide the canvas, or publish the Services depth fallback. A later external wake while the hero is visible invokes the same failed renderer again. Leaving the hero can allow subsequent wakes to present the other sections, so this is not a claim that all page scrolling is permanently disabled.

The offline Services controller harness injected a renderer whose next draw throws the exact error emitted by the shared implementation. After one successful hero frame:

```json
{"error":"The editorial WebGL context was lost.","queued":0,"draws":2,"disposed":0,"canvasHidden":false,"depthFallback":null}
```

This demonstrates the controller's failure path without creating a real WebGL context. A loss during entry interrupts the finite text/object entry sequence until another input wakes the controller, and subsequent visible-hero draws continue to throw.

**Smallest fix:** Add a common Services renderer-failure handler that latches failure, disposes and clears the renderer, hides the decorative canvas and publishes the existing fallback state. Catch draw failures inside the presentation transaction and continue scheduling the independent DOM/entry/gate work. Apply the same handler to resize/adoption failures so the failed renderer cannot remain installed. Verify a post-startup draw failure as well as an import failure.

## P2 — Shared practice objects can choose a different viewport profile from the page

**Locations:** `src/sections/vision/1-opening/practice-objects.ts:54`–`:68`; callers at `src/sections/vision/vision.animate.ts:38`–`:45` and `src/sections/services/services.animate.ts:30`–`:31`.

**Trigger:** Use a viewport just above a profile boundary with a classic vertical scrollbar. For example, CSS viewport/`innerWidth` 1025px and measured content/canvas host width 1010px. The same problem occurs just above 600px if the scrollbar moves the host width below that boundary. It affects both locales and both practice-object variants.

**Evidence:** CSS and the page controllers choose their design with viewport width. The renderer instead calls `viewportDesign(nextWidth)`, where `nextWidth` is the measured hero border-box width. The hero is an ordinary full-width block, so a non-overlay scrollbar can make that measurement narrower than the CSS viewport. At the example above, CSS/controller select desktop, but the renderer selects tablet, ignores the supplied desktop stage height and writes the tablet `133.33333333333334vw` host height. This changes the logo camera, scale, framing and portrait/pointer policy inside a desktop composition.

A second bounded harness evaluated the actual renderer factory/resize code with an in-memory Three mesh and inert renderer/environment adapters. No GPU or browser was used:

```json
{"viewportWidth":1025,"hostWidth":1010,"expectedProfile":"desktop","selectedProfile":"tablet","stageHeight":576.5625,"returnedExtent":1346.6666666666667,"cssHostHeight":"133.33333333333334vw"}
```

The exact extent above uses the test mesh; the wrong profile selection is independent of model geometry. The renderer's extent is at least the selected reference height. This is a deterministic host/viewport mismatch reproduction, not a claim that the root's reference-browser captures used classic scrollbars. Current profile tests supply one width to the pure pose helpers and do not cover a differing viewport and host width.

**Smallest fix:** Select the renderer's design profile from the same CSS viewport width as its controller, either directly or by passing the selected profile/viewport width into `resize`. Keep the measured host dimensions for physical buffer and hit-geometry calculations; do not use them to select another composition. Check both boundaries with a narrower host and preserve width scaling within each profile.

## Scope, verification and limits

- Read `AGENTS.md`, `docs/load-architecture.md`, `docs/code-splitter.md`, `docs/viewport-design.md`, `docs/animations.md`, and both route implementation contracts. Inspected the new Vision/Services content, gates, controllers, CSS, pure math, deferred renderer and cleanup/input paths. Consulted the retained public EN/AR HTML/runtime manifest and the formatted `2mzrkx5gfk3t8.js` and `1fxjprk_uhktp.js` source graph and fixture generators. Shared shell/footer implementation is outside these findings; Projects is excluded.
- Ran only `bun test src/sections/vision/vision.test.ts src/sections/services/2-opening/opening.test.ts`: **9 passed, 0 failed, 2,979 assertions**. Ran the two bounded in-memory controller/renderer reproductions described above. The controller reproduction used the real opening code, not only the spring fixture functions.
- No browser, native/OS automation, network requests, full check, build, type generation, server/process management, staging, commits or delegation. Only this report was intentionally written.
- The restored Vision selector specificity and passage padding, the bounded Services top, the runtime `vw` transforms, and the documented SVG user-space band font are not findings. No new actionable RTL-specific or physical-height-dependent composition defect was established in the inspected section code. The root-reported .60px tablet index difference was not treated as a code defect without independent evidence of its cause.
- Passing source-math fixtures and inspecting cached geometry do **not** establish on-screen or continuous-motion parity. Matched production EN/AR captures, moving glyph/band/gate behavior, real touch capture/native scrolling, restoration and actual GPU loss remain root-owned browser acceptance.

Relevant reviewed SHA-256 values:

```text
80b78ce9dad52d8ea6e67ef29bf5d9ec23610a2618302aa693c03106dd52f9ad  src/sections/services/services.animate.ts
1d914933bc754e2ec576e48f86a7a7d97578c0b1bca78db38c315e656cff6e8d  src/sections/services/2-opening/opening.animate.ts
5ecabfe59321276c87d1ca6abbdc9937c285326c69f5410570d29c05c6952ec8  src/sections/vision/1-opening/practice-objects.ts
57b101ac6a6fb292f845b04d2a5d41a9c993cf2d599bd696f403b92470d9a53d  src/sections/vision/vision.animate.ts
20f8de808357a4ceedf499cf51e2b9196a423a0c6a487f6beb346a63ce83b148  src/sections/vision/2-perspective/system.animate.ts
7c919e71a15738384a25869a416750c0dfa0d67afe0b6b72b2c2ceee30e6e46a  src/sections/vision/3-narrative/narrative.animate.ts
00887da9773fac0fb0a3bc94ce8c30359d9766f33d4f050ad6c785e0bfea0d71  src/sections/vision/vision.module.css
8a5987c9f51e28ba5aa4b082139c9e386060bbee8cbabb7a8209807a7f76d5a0  src/sections/services/services.module.css
```
