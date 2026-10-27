# HOME navigation contract

Navigation owns only `src/lib/navigation/**` and `tests/home-navigation.test.ts`.
The R5-01 integration also adds a fresh-entry reset call and decision flag in
`1-hero/hero.animate.ts`; it does not change the entry animation/lifecycle.
This module renders no content, imports no React, Three, Storio or Lenis runtime,
and installs nothing at import time. HOME copy, hrefs and locale markup remain
server-rendered. The pure `journey-clock.ts` is the sole score/input clock.

## Integration API

```ts
import {
  getHomeRestoreIntent,
  prepareHomeFreshEntry,
  mountHomeNavigation,
  HOME_NAVIGATION_READY_EVENT,
  HOME_NAVIGATION_RESTORE_EVENT,
  type HomeRestoreDetail,
} from "@/lib/navigation/home-navigation";
```

1. **Hero owner:** call `prepareHomeFreshEntry()` and then
   `getHomeRestoreIntent()` synchronously before choosing entry/loading mode.
   The former returns true for the first ordinary fresh reload entry decision
   in this document and resets native/Lenis scroll to zero. Use
   `(freshReloadEntry || scrollY < 20)` in `shouldEnter`, retaining the existing
   entry-phase/hash/restore guards. The reset never repeats on a quiet/motion or
   Strict Mode remount. Before load it temporarily uses manual browser scroll
   restoration, releasing on load without another scroll reset.
   A non-null restore result has `skipEntry: true`, including a
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
   geometry. A restore is applied/emitted once per stable geometry/mode
   transaction; completion does not await any heavy model or sound runtime.
   After first application a restored mount keeps its original semantic intent.
   Real geometry or effective reading-mode changes reapply that same intent
   through the adapters/shared snap, even if later scrolling updated history to
   another scene. Same-size ready signals, display-progress/frame attributes,
   transforms and insignificant DOMRect floating-point differences do not seek.
   Fresh ordinary mounts retain the parent's current clamped offset on mode
   changes; capturing a checkpoint does not convert one into a restored mount.

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
The integrated `reading-navigation.ts` adapter follows the source reduced
locale target: hero fraction of absolute chapter start; opening/perspective at
chapter start; work at the nearest source project moment's article top minus
100px (ties choose the first); other scenes at `#beyond`. The chapter absolute
document start is used because the local sibling hero/wrapper differs from the
source's combined main element. Reading capture and restore targeting have
different responsibilities.

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
nonlinear opening and the input compression after score 100. Locale/work/query
restoration uses semantic position. The current implementation's **initial
history visit uses that entry's saved pixels**, clamped to the current extent.
This matched the accumulated R5 source history, where Back to an EN entry
captured at desktop y16362 restored y16362/score489.35 at the narrow viewport.
It is not established as a universal source rule: R6's pristine control instead
returns source EN y12091/312 while local returns16362/489.35. This remains open
for source lifecycle diagnosis and a further correction.
After this first history application, the actual restored frame supplies that
visit's semantic annotation for subsequent in-mount layout changes. Later
captures update the history checkpoint without replacing that active anchor.

Locale handoff expires after **2 minutes**; a pending project return expires
after **30 minutes**. Future timestamps, malformed versions/positions, unknown
slugs, wrong target paths and out-of-range fractions are rejected. History
checkpoints live for the tab session, with at most 40 storage entries. They are
keyed by an entry ID plus exact pathname/search, never merely by locale.
Existing Next history state fields are preserved; its router internals and
`pushState`/`replaceState` functions are not patched.

Next soft traversals can retain `PerformanceNavigationTiming.type=navigate` and
can unmount the old HOME root before its popstate listener runs. The listener
uses capture phase, and synchronous destination selection also recognizes an
already visited entry ID plus its exact pathname/search in this document. That
bounded, 40-entry map survives route-controller remounts. It does not carry into
a new document, so an ordinary reload still chooses fresh entry. A new locale
push creates a distinct ID and continues to use the pending locale intent.
This avoids consuming the outgoing locale's position as the destination and
preserves its saved footer for Forward even when route teardown runs first.

Intent precedence: valid locale handoff; an unconsumed explicit `?work=slug`;
native hash; matching history checkpoint on Back/Forward; pending project
return; matching reload checkpoint **only with a valid consumed work query**;
native Back/Forward/scroll restoration. An ordinary HOME reload without those
explicit intents is fresh, even when the browser restores a previous scroll
offset or retains a history checkpoint. It awaits the authored entry choice at
zero instead of treating those pixels as restore intent (R5-01).
A direct fresh visit does not restore an unrelated old history position.
Successful query application marks that history entry, retaining its original
URL; query reload/Back then restore the latest checkpoint instead of repeatedly
seeking the query's nominal project moment. Locale/project records are consumed
only after successful application. A BFCache `pageshow.persisted` starts a new
history visit without entry replay; its initial selection follows the saved-pixel
history rule. Handoff expiry is checked on intake, not used to discard an active
mount's restoration anchor later. Storage/security failures leave native
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
`home-navigation.ts`. R5 targeted validation: **35 navigation tests / 427 assertions
pass** (with the parent's reading-adapter regression: **36 tests / 439 assertions**).
ESLint passes for the owned TypeScript files, tests and minimal hero integration;
plain `tsc --noEmit --incremental false` passes (no Next build/typegen).

Tests cover every scene/fraction through desktop/mobile geometry, the nonlinear
opening, measured Wujhat coordinates, project query moments, displayed-frame
capture, record expiry/rejection, per-entry history/query consumption, native
click guards, actual document click storage, fonts/extent readiness, one-shot
application/remount, cleanup, BFCache viewport changes, popstate isolation,
reading adapters and denied storage. R5 adds ordinary reload/reset/remount
guards, retained locale work312 through desktop/mobile and reading/motion,
latest-capture/original-intent separation, ordinary fresh mode-offset retention,
and rejection of same-geometry/frame/style/DOMRect-noise reapplication. The fake
event target now models capture/bubble order and listener removal during
dispatch. Its route-remount regression places Next's teardown listener before
our capture listener, keeps performance type `navigate`, and verifies synchronous
history selection, the source EN pixel visit and the retained AR footer.

The existing journey geometry/reading adapters, shared restore snap and ready
notifications need no changes for R5. Parent corrected the source reduced
reading target separately. The only hero change is the explicit one-document
fresh reload reset integration. No shell/journey route, package configuration
or case-page changes belong to this pass.

Bounded live verification used only the explicitly granted original Vaelix pair:
source175555005/local175555011 in window175554986. Local was current development
port3000; frozen production3100/8540377 was not used to claim these fixes.
Viewport changes used Vaelix `chrome_computer` action `resize_page`. The installed
tool attempts CDP device-metrics emulation before a native-window fallback; the
executed branch was not verified. No OS-native resize or explicit clearing of
device metrics was performed. Earlier "native resize" wording was incorrect.

- Ordinary plain `/en` reload from confirmed completed QUIET entry at score40,
  y5263: source and final local settle y0/story0/opening0, hero `ready`, awaiting
  entry. Final local repeated40→60→67→71→40 before its reload.
- EN312→AR312 at1912×1009 restores y16362. At392×865 both restore y12091/311.99;
  reverse desktop returns y16362/312.01. After scrolling footer714, reading mode
  reaches y3827 (project0 absolute top3926.8125 minus100, rounded by native scroll),
  and motion returns y12091/312. The offscreen mode button's actual click handler
  was invoked programmatically; this is not a physical touch/keyboard test.
- A later footer position survives same-size resize/ready, frame-attribute and
  irrelevant root-style updates without a new restore event.
- Fresh ordinary EN580/y25188→reading clamps to y11437 in the12446px document;
  motion retains y11437/162.47 in source and local, with no entry replay/reset.
- Bounded AR-footer→Back→Forward: source hard `back_forward` restores
  EN y16362/489.35 then AR y21772/714. Final local's single native
  `history.back()`/`history.forward()` calls produce the same positions through
  Next soft traversals. Its timeOrigin stays1793071494610.4 and performance type
  stays `navigate`; actual restore events are `history`, and the distinct entry
  IDs/checkpoints retain the AR footer. Earlier local `native` fallback lost the
  footer; this evidence drove the synchronous visited-entry recognition fix.
  Source history included an earlier same-URL `/ar` navigation intended as tab
  activation, so it was accumulated rather than a pristine two-entry control.
  R6's clean source result differs as noted above; this run cannot establish
  universal source history semantics.
- Direct local `?work=wujhat` restores308 without entry; `#beyond` remains a
  native hash at y865 in the narrow layout and skips entry.

Evidence and setup exclusions are recorded in
`/tmp/gazzar-home-navigation-r5-pass2/evidence.json` (41 labeled records). Initial
inert-choice/offscreen-click attempts and pre-fix history samples are explicitly
excluded from acceptance. Temporary internal trace code was removed before the
final clean-document run. Final native document replacements/reload removed the
page collectors; final local audit-global inventory is empty.

**Browser ownership RELEASED** with no calls pending. Both original tabs are
ordinary EN HOME at1912×1009/DPR1, y0, entry complete, motion enabled and menus
closed. No tabs, windows or iframes were created. The parent owns the fresh
independent R6 review and production validation; these development observations
do not claim production or broad browser/GPU parity.

The parent owns full check/build/typegen and production SSR audit. No server was
stopped, restarted or otherwise managed by this pass. No commit is requested or
created by this implementer.
