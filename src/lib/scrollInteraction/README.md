# Custom scroll interactions

Ported from Artifact and prepared for the Gazzar clone. This library interpolates
numeric values from native window scroll position. It is not GSAP ScrollTrigger
and does not provide its timeline/pinning API.

## Mount from a deferred controller

```ts
import { getScrollTrigger } from '@/lib/scrollInteraction/scrollTrigger';

export function mount(element: HTMLElement) {
  const trigger = getScrollTrigger();
  if (!trigger) return () => {};
  trigger.createInstance('unique-section-key', element, {
    values: [[0, 1], [16, -16]],
    startPoint: [0],
    endPoint: [0],
    callback: ({ v, ref }) => {
      ref.style.transform = `translate3d(0, ${v[1]}px, 0)`;
    },
  });
  return () => {
    trigger.removeInstance('unique-section-key');
    element.style.transform = '';
  };
}
```

Import optional, viewport-owned motion through `useDeferredMotion` from a small client gate.
Render all meaningful content in the server section. `getScrollTrigger()` returns
null on the server; avoid reading the default export from a Server Component.
Persistent shell, restoration/pin geometry and reading controllers have a different
lifetime: their null gates dynamically import them on mount, including in quiet
mode. See [the animation ownership map](../../../docs/animations.md).

## Progress and range semantics

`values: [[from, to], ...]` defines the values returned in `v`; they are not
implicitly percentages. `mapProgress(min, max, percent)` accepts 0–100, while
the internal interpolation progress is 0–1.

- `startPoint: [0]`: the element's top reaches the viewport bottom.
- `startPoint: [0.5]`: its top reaches the viewport center.
- `startPoint: [1]`: its top reaches the viewport top.
- `endPoint: [0]`: its bottom reaches the viewport top.
- `endPoint: [0.5]`: its bottom reaches the viewport center.
- `endPoint: [1]`: its bottom reaches the viewport bottom.
- `[0, 0, absoluteScrollY]` sets an explicit start/end position.

Longer tuple forms and `VzSIFactor` remain for compatibility; inspect `calcTop`
and `calcBot` before using them. Scale factors must be finite and positive.
Equal start/end coordinates resolve to a finite endpoint rather than NaN.

## Scheduling

One passive window listener dispatches registered callbacks. Core callbacks are
RAF-batched by default. Do synchronous, cached style writes in that callback.
If a controller owns a larger RAF transaction, pass `useRAF: false` to its
trigger. Do not nest `createOptimizedCallback({ enableRAF: true })` around a
default-batched trigger; use `enableRAF: false` for state tracking alone.

`scrollManager.createInstance(key, callback, { enabled, throttle, useRAF })`
supports direct callbacks when range interpolation is unnecessary.
`toggleInstance`, `removeInstance`, and `cleanup` release pending work.
`kickScroll()` requests a frame-coalesced update. Initial measurement also
updates state, including restored scroll positions.

The hero consumes raw input across the whole document and computes its own
measured remap. It therefore uses the direct manager instead of an unused
interpolation range plus a second native scroll listener:

```ts
import scrollManager from '@/lib/scrollInteraction/scrollManager';

scrollManager.createInstance('identity-world', updateScroll, { useRAF: false });
// updateScroll samples native input; the existing hero RAF presents the pose.
// During teardown:
scrollManager.removeInstance('identity-world');
```

Direct instances do not perform initial geometry measurement. Their owner must
sample its initial/restored position, as `mountHeroMotion` does before waking.

## Geometry and lifecycle

Element geometry is cached and refreshed on window/root-document size changes.
Call `refreshScrollMeasurements()` and `kickScroll()` after layout changes that
do not change those sizes. Re-registering a key updates its element/options.
Cleanup removes the exact listener function that was attached.

Use stable, untransformed anchors for pinned/sticky animations. Keep pin logic
local to its section. RAF batching does not automatically separate all layout
reads from writes or guarantee compositor-only rendering.

## Utilities

- `createRAFBatch`: keyed callback coalescing, cancellation, and safe next-frame self-rescheduling.
- `createStateTracker` / `createSmartStyleSetter`: skip repeated writes; clear caches on cleanup.
- `createDOMCache`: cache queries per mount and clear when those nodes are replaced.
- `createIntersectionOptimizer`: optional visibility tracking; callers register targets explicitly.
- `createInstanceRegistry`: track IDs/instances; remove engine instances explicitly by key.
- `createScrollMarquee`: Site Entry's reusable velocity-coupled typography/track controller.
- `createPerformanceMonitor`: synchronous callback timing only; not GPU, presentation FPS, or a whole-page benchmark.

See `examples.ts`, `src/sections/landing/1-hero/hero.animate.ts` and
`src/sections/landing/3-journey/journey.animate.ts` for live
TypeScript examples. Run `bun test` for lifecycle, scheduling, and state tests.
Performance numbers depend on the final scenes and devices; no fixed percentage
improvement is asserted.
