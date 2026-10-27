# HOME navigation contract

Navigation owns only `src/lib/navigation/**` and `tests/home-navigation.test.ts`.
This module renders no content, imports no React, Three, Storio or Lenis runtime,
and installs nothing at import time. HOME copy, hrefs and locale markup remain
server-rendered. The pure `journey-clock.ts` is the sole score/input clock.

## Integration API

```ts
import {
  getHomeRestoreIntent,
  mountHomeNavigation,
  HOME_NAVIGATION_READY_EVENT,
  HOME_NAVIGATION_RESTORE_EVENT,
  type HomeRestoreDetail,
} from "@/lib/navigation/home-navigation";
```

1. **Hero owner:** call `getHomeRestoreIntent()` synchronously before choosing
   entry/loading mode. A non-null result has `skipEntry: true`, including a
   history return to hero fraction zero. Finish the existing hero entry immediately
   in this case; do not reset scroll, play the loader, or require a sound choice.
   The function is SSR-safe (returns null), read-only and repeatable. It does not
   consume a pending record before the journey geometry exists.
2. **HOME gate/parent:** call `mountHomeNavigation({ root })` once per HOME mount
   from a small client effect/controller and call the returned cleanup on unmount.
   `root` can be the HOME main or `[data-journey-root]`; all link observation is on
   `document`, so a server Header outside main is covered. Omitting root selects
   `[data-journey-root]`. No content boundary needs to become a Client Component.
3. **Journey owner:** expose final measured pin geometry using `getGeometry`
   below, or keep the default attributes/style contract. Install a synchronous
   `onRestore(detail)` callback **or** a window listener for
   `HOME_NAVIGATION_RESTORE_EVENT` (`home-navigation-restore`). Set your existing
   target and displayed input progress to `detail.pinProgress`, reset interpolation
   time, and render the shared frame immediately. Reset any stale RAF target so
   it cannot animate back from the previous frame. Refresh/kick your existing
   scroll trigger, hero world, Three, work, systems and shell using their existing
   shared frame path. Do not start a second RAF owner.
4. After creating/recreating the pin (including quiet/motion changes), dispatch
   `window.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT))`
   (`home-navigation-ready`). Fonts, resize and observed layout changes also wake
   a pending restore. The ready event is a wake-up, not permission to use old
   geometry. A restore is applied/emitted once after fonts and stable, scrollable
   geometry; completion does not await any heavy model or sound runtime.

```ts
const disposeNavigation = mountHomeNavigation({
  root,
  getGeometry: () => pinReady ? {
    start: chapter.getBoundingClientRect().top + scrollY,
    distance: measuredPinDistance,
    heroInput: 100 / (innerWidth <= 700 ? 5.8 : 6.8),
  } : null,
  onRestore: ({ pinProgress, frame }) => {
    // Journey's owner supplies this synchronous integration.
    if (pinProgress !== null) target = displayed = pinProgress;
    last = 0;
    // Use the normal shared render path here, including hero/Three/systems.
    // frame is computed by journey-clock, not inferred from display progress.
  },
});
```

Default geometry requires `[data-journey-root][data-enhanced]`, an experience
without `is-reduced`, `.glasses-chapter`, `#top`, and a positive computed
`--journey-distance` on the journey root. It reads the actual chapter start and
distance; it does not infer mobile extent from viewport height. The parent must
fix its own `svh/dvh`, stage minimum and bottom-compensation measurements. The
renderer and navigation must use the same `heroInput`. Optional `getFrame()`
supplies the displayed shared `JourneyFrame`; by default `#top`'s
`data-story-time` and `data-opening-time` supply it. `data-progress` is display
progress and is never used as physical pin progress.

`HomeRestoreDetail` includes `intent`, semantic `position`, absolute `scrollY`,
`pinProgress` and `frame` (the latter two can be null in an unpinned/native path).
The controller synchronizes an existing `__bouthouriLenis` with immediate/forced
scroll, then uses native instant scrolling. `scrollTo(y)` can override that
adapter. It never imports or starts Lenis. Position capture is throttled on
scroll, with immediate checkpoints on valid navigation, scroll end, page hide,
hidden visibility and cleanup. It does not subscribe React to frames.

Unpinned/reduced reading may supply `getPosition()` and `getTarget(position)`
using actual readable section geometry. Without those adapters the controller
does not invent pinned coordinates for reduced layout; native scrolling and
server content remain usable and the semantic intent remains pending. No
content is made inert, hidden or scroll-locked by navigation.

## Semantics and record lifetime

`HomePosition = { section, progress }`, with a fraction in `[0, 1]`. The bands
match the recovered public source exactly:

| Section | Shared score |
| --- | --- |
| hero | Before pin; fraction of absolute chapter start |
| opening | -26 to 0 (opening time minus 26) |
| perspective | 0 to 70 |
| philosophy | 70 to 112 |
| curve | 112 to 156 |
| circle | 156 to 201 |
| dash | 201 to 241 |
| ideas | 241 to 306 |
| work | 306 to 448 |
| systems | 448 to 547 |
| people | 547 to 627 |
| closing | 627 to 663 |
| footer | 663 to 714 |

These differ from chapter/whisper labels and visual overlap ranges. Semantic
fraction is mapped through the destination clock/geometry, including the
nonlinear opening and the input compression after score 100. Saved pixels are
diagnostics and native fallback, not the semantic destination.

Locale handoff expires after **2 minutes**; a pending project return expires
after **30 minutes**. Future timestamps, malformed versions/positions, unknown
slugs, wrong target paths and out-of-range fractions are rejected. History
checkpoints live for the tab session, with at most 40 storage entries. They are
keyed by an entry ID plus exact pathname/search, never merely by locale.
Existing Next history state fields are preserved; its router internals and
`pushState`/`replaceState` functions are not patched.

Intent precedence: valid locale handoff; an unconsumed explicit `?work=slug`;
native hash; matching history checkpoint on Back/Forward; pending project
return; matching reload checkpoint; native Back/Forward/scroll restoration.
A direct fresh visit does not restore an unrelated old history position.
Successful query application marks that history entry, retaining its original
URL; reload/Back then restore the latest checkpoint instead of repeatedly
seeking the query's nominal project moment. Locale/project records are consumed
only after successful application. A BFCache `pageshow.persisted` starts a new
restore cycle without entry replay. Storage/security failures leave native
navigation functional; the current history state can still retain a checkpoint.

## Links and scope

The controller observes eligible same-origin HOME EN↔AR anchors and these exact
case destinations. It does not prevent the click, replace its href, force a
router, synthesize a page or point to the public site's case pages:

| Slug | HOME return score | Preserved href |
| --- | ---: | --- |
| wujhat | 308 | `/{locale}/projects/wujhat` |
| tranche-finance | 345 | `/{locale}/projects/tranche-finance` |
| remoteplatz | 381 | `/{locale}/projects/remoteplatz` |
| 8returns | 413 | `/{locale}/projects/8returns` |

Project click stores the displayed work fraction, so Back returns to the actual
position. An explicit `/{locale}?work=slug` uses the listed source moment.
Ctrl/Meta/Alt/Shift clicks, middle/right clicks, downloads, non-self targets
(including a base target), inert links, external/protocol links, and cancelled
clicks produce no handoff. Ordinary same-locale HOME/hash behavior stays native.

Only HOME exists locally at this handoff. Case pages, `/en|ar/projects`, the
source case-page “Back to projects” destination
`/{locale}/projects?project=slug`, vision/services/contact routes, route-cover
animation and shared project-mark transitions are outside this implementation.
Back from a real local 404 can exercise the HOME history contract; that is not
evidence that case-page parity or a case router has been implemented.

## Validation and handoff status

Implemented in `home-position.ts`, `home-navigation-state.ts` and
`home-navigation.ts`. Targeted validation: **25 tests / 314 assertions pass**;
ESLint passes for the owned TypeScript files and tests; a scoped strict
`tsc --noEmit` invocation passes (no Next build/typegen).

Tests cover every scene/fraction through desktop/mobile geometry, the nonlinear
opening, measured Wujhat coordinates, project query moments, displayed-frame
capture, record expiry/rejection, per-entry history/query consumption, native
click guards, actual document click storage, fonts/extent readiness, one-shot
application/remount, cleanup, BFCache viewport changes, popstate isolation,
reading adapters and denied storage.

**Pending integration:** hero's synchronous skip-entry decision, mounting the
controller in HOME, journey's immediate shared render callback/event listener,
and final-geometry ready notification. Reduced/quiet semantic reading needs the
parent's measured reading adapters. This subtask changes no hero/shell/journey
files, route components or package configuration. No case pages are added.

The parent owns full check/build/typegen, production SSR audit and live
EN/AR/viewport/history/BFCache parity. Unit lifecycle tests are not a claim of
live-browser parity. Port 3000/session 32289 was not stopped/restarted or otherwise
managed. No commit is requested or created.
