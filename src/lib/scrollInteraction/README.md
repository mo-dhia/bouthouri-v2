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

Import this controller through `useDeferredMotion` from a small client gate.
Render all meaningful content in the server section. `getScrollTrigger()` returns
null on the server; avoid reading the default export from a Server Component.

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

See `examples.ts` and `src/sections/landing/1-hero/hero.animate.ts` for live
TypeScript examples. Run `bun test` for lifecycle, scheduling, and state tests.
Performance numbers depend on the final scenes and devices; no fixed percentage
improvement is asserted.
