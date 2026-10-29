# Custom animation workflow

Native browser scrolling supplies input. `src/lib/scrollInteraction/` is the
only scroll engine; no Lenis, GSAP or React Three Fiber runtime is installed.
Storio stores shared UI transitions, never animation progress or mesh state.
The source's clocks/material history are reproduced by local controllers;
they are not a second third-party timeline engine.

## Server content and loading

Routes, sections, header/footer markup, translations, images and structured data
are server-rendered. Content-owning modules use `server-only`. Gates render no
visible content; their colocated `.logic.ts` hooks own eligibility, dynamic
imports and cleanup. Loading a controller never supplies the only copy of text.

Use `useDeferredMotion` for optional, viewport-owned motion. Its module-scoped
loader imports a local controller; quiet mode, OS reduced motion and scene
failure disable that optional path. It is not the mount policy for every HOME
controller: shell navigation, reading behavior and pin/restore geometry must
also work when motion is disabled or restoration starts below the hero.
Those gates dynamically import their small controllers on mount. Three and
interactive footer material still load through later, independent boundaries.
See [loading](load-architecture.md) and [ownership](code-splitter.md).

## Input and frame ownership

| Path | Input and scheduling | Lifetime |
| --- | --- | --- |
| Hero motion | Direct `scrollManager` instance, `useRAF: false`; cached raw native input, then the existing 100ms clock/remap and hero RAF | Entry, marquee, magnet and portrait share this presentation owner. Sample initial/restored positions explicitly; remove the manager key on cleanup. |
| Pinned journey | `getScrollTrigger()` interpolates `values: [[0, 1]]`, `useRAF: false`; the journey owns its 480ms scrub and the source 270 cutoff | Geometry refresh and restoration synchronously snap the shared clock. Work, opening and systems consume that frame, not React state. |
| Object scene | Samples shared clock/history synchronously; its retained controller owns the GPU demand RAF | Near-viewport boot is serialized. Render only eligible poses/ambient motion; park offscreen, hidden, under MENU and after the object interval. |
| Background material | Current journey transaction owns moving submissions; an explicit handoff parks the independent idle/tail scheduler | A locale owner retains the renderer, field and time across HOME/editorial route leases and reading changes. Submit one current pose, without duplicate or previous-pose draws. |
| Reading hero | Native scroll/measure/visibility wakes; no presentation RAF or advancing animation clock | Lightweight body/pose publication remains active. Its deferred portrait performs source-defined finite draws and resize/failure fallback handling. |
| Editorial pages | Shared shell/menu and optional field; page-owned Vision/Services RAF or Contact finite entry/scrub owner | Server copy stays present. Custom scroll keys feed cached measured ranges; practice objects are a deferred renderer with no second clock. |
| Projects grid | Pointer/trackpad manipulation on its own surface; one demand RAF for wrapping, homography, inertia and finite entry | Fixed reference geometry; sleeps at rest and under MENU/hidden documents. Its preview child owns one intent-loaded video and timers. Ordinary server cards remain if enhancement fails. |
| Footer material | Small clock/eligibility controller first, then dynamic Canvas/contour import | Its own interaction RAF handles morph, drag and waves; unchanged rest paths are cached. HOME reading disables the morph. |

Choose one scheduler per update path. Default scroll-engine batching is suitable
for synchronous cached DOM updates. Pass `useRAF: false` when a controller owns
the presentation transaction; do not add another optimized RAF wrapper around
it. A scene's GPU demand RAF is a separate render path, not another scroll clock.

`journey-render-owner.ts` defines the background handoff. Do not replace it with
an independent subscriber RAF: callback registration order previously produced
both duplicate draws and a consistently old pose. The object renderer's demand
cadence and environment-capture ordering likewise carry source material history.
Changing them requires a matched continuous regression, not only resting pixels.

## Geometry, state and cleanup

Design geometry follows the [three fixed reference canvases](viewport-design.md).
Scale the composition by width; use actual viewport height only for physical
visibility/scroll limits. DOM measurements are already scaled. SVG/Canvas/Three
normalize once into their reference camera or drawing space; do not multiply
measured geometry by the design scale again.

Read [the engine API](../src/lib/scrollInteraction/README.md) before choosing
range tuples. `v` contains configured values, not implicit percentages. Pinning
and sticky geometry belong to the section; the engine does not implement a
GSAP-style pin/timeline API. Direct callbacks are appropriate when interpolation
is unnecessary, as with the hero's full-document raw input.

Cache DOM nodes and geometry per mount. Refresh after real layout/font changes,
read before writes where possible, skip unchanged poses, and invalidate caches
when ownership or dimensions change. Do not add a store write or React render
per scroll frame. Native history persistence also stays out of the hot path;
see [the navigation contract](home-navigation-contract.md).

Quiet/OS-reduced mode restores readable layout and changes controller policy.
It retains source-required static glasses/background resources rather than
recreating every renderer. Pending motion-only assets/fonts cannot block reading
readiness. Hidden documents pause work; visible source-authored background drift
and MENU quiet tails are intentional, lower-cadence material content. They are
not permission to run arbitrary offscreen loops. Explicit SOUND intent is
required before creating audio resources.

Every owner releases its keys, listeners, observers, timers, subscriptions,
RAF work, owned GPU resources and inline mutations. Async adoption checks
cancellation/generation so an old mount cannot publish readiness into a new one.
Pending scene-boot cancellation removes its queued request immediately. If that
queue no longer needs a quiet-window waiter, it releases only its own waiter and
stops the shared sampler when empty, including while hidden. A newly queued scene
gets its own wait; independent quiet callers and an already-granted slot retain
their existing ordering and release/watchdog ownership.
The HOME scene-failure latch survives mode toggles and resets at HOME unmount.
The background has a separate locale lifetime: route cleanup releases its
attachment and parks the connected surface, while locale disposal releases its
GPU resources. A failed optional HOME object does not dispose that surface.
See [background ownership](../src/components/layout/environment/environment.doc.md)
for the deferred boundary, route leases and excluded-route policy.

## Verification

`bun run check` includes architecture checks, lint, types and lifecycle/source
fixtures. Build and run `bun run test:ssr -- <production-url>` after boundary
changes. Compare motion at matching viewport/DPR, input and resource history;
verify EN/AR, reading/motion, restoration, resize and failure behavior. RAF gaps,
synchronous callback timing and encoded video rate are not presented FPS. No
fixed performance gain or full visual parity follows from architecture checks.
