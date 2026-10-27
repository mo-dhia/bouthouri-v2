# Home journey

The original home is a single pinned score, not a stack of independently revealed
cards. `journey-en.json` and `journey-ar.json` contain local semantic content and
SVG paths recovered from the public reference. `journey.tsx` renders those nodes
as React Server Components with real HTML; no client content fetch or HTML
injection supplies the only copy of the page. The footer is a separately owned
server component inserted into the systems chapter.

`journey.module.css` preserves the reference's geometry/cascade under a local
scope. Shared typography metrics live in the global stylesheet. The source's
GSAP-generated pin spacer is replaced by a native sticky stage and a measured
wrapper height. Desktop at 1912 × 1036: 29357px of pin travel, 30393px chapter,
31429px total document. Mobile uses its original 5.8svh/input-unit pace.
Short stages keep the original minimum height (600px desktop, 560px mobile).
Mobile pin measurement uses 100svh and the original dvh/svh stage difference;
navigation reads the actual measured pin range. The skip link immediately
selects score 102. The end cue returns to the hero-world/opening seam.

`journey-clock.ts` maps scroll input to the original 26-unit opening and 714-unit
story. Input is compressed after story time 100. The custom scroll engine owns
the passive scroll registration; one settling RAF owns DOM presentation. Values
remain outside React/Storio. The scene receives `journey-frame` on `#top` with
`{time, openingTime, progress}`; progress is display score divided by 740.
The registration uses `useRAF:false` because presentation owns its RAF. Scrubbing
uses the recovered 480ms Expo.out curve and wall-clock elapsed time; long GPU
frames do not stretch the animation. Scores at270 and later synchronize directly.
Visibility pauses preserve elapsed scrub time, while restored positions snap
both the target and displayed score.

Continuous-input correction: the presentation clock advances the pending scrub
to the input event's timestamp before changing its destination. It does not
restart from the previous RAF's stale value. The source's cached GSAP3.15.0
render-before-resetTo sequence supplies forward/reverse fixtures with inputs
between frames. A monotonic clock prevents an earlier RAF timestamp from
rewinding a newer input transaction. Geometry refresh synchronously measures
and snaps the native position, matching the reference's onRefresh transaction.
Native wheel scrolling is retained; no Lenis smoother precedes this scrub.

`work-paths.js` and `work-renderer.js` contain the original project mark geometry,
measured pen windows, horizontal composition and pointer/focus behavior ported
to ordinary modules. `systems-geometry.js` contains cubic path/arc-length math;
`systems-renderer.js` applies those paths and the typography/footer transitions.
They have no GSAP, React Three Fiber, or original application runtime dependency.

Quiet/reduced mode removes the pin and controller mutations; content keeps its
server-rendered reading path. The Three scene is a separate deferred controller
under `2-story/`. Every controller releases its listeners, observers, keys,
pending frames, and owned inline styles. Browser QA must exercise forward and
reverse scrolling, restored positions, resize, quiet/reduced preferences, and
hidden-tab resumption.
The scalar scrub continues settling beneath an open menu, as in the reference.
The object/material renderers independently pause GPU activity under the modal;
closing the menu reveals the settled score without starting a delayed journey.

Reading navigation captures measured content bands. Restoring a semantic intent
uses the source's separate reduced-layout rule: work selects the nearest authored
project moment and lands 100px above that project; hero/opening/perspective map
to the chapter start, with hero retaining its fraction; other sections use
`#beyond`. It does not interpolate a work fraction across the reading track.

Reading mode keeps its own opening fitter active, including resize/font-ready
measurements and RTL masks. Its reveal paints fully open rather than following
hero-world motion. Score/opening/progress attributes and chapter/concept/cue UI
reset to the source reading pose (0/0/0, PERSPECTIVE00), while actual scroll
preservation and semantic restoration stay with the existing navigation adapter.
EN1912×1009 opening rows and fit.8101939248682843 match source exactly; AR392×865
rows and fit.9774 also match, with document9406 and native8541 preserved through
mode toggles. Evidence: `/tmp/gazzar-reading-ui-root/evidence.json`. The static
lens environment is a separate scene-lifetime concern and is not certified here.
The reading scroll cue now uses the source `#beyond.scrollIntoView({
behavior: 'auto', block: 'start' })` action. Its listener is removed on mode
change and HOME disposal. An independent offline review found this previously
inert control; R8 independently verified three EN/AR activations across modes
at desktop/narrow widths, each invoking the source action once.

R8-01: the navigation mount calls `setQuietMode(false)` only for a new connected
HOME owner or canonical locale. Outgoing reading capture and destination-intent
selection precede this callback; geometry restoration follows it. Same-HOME
mode/Strict remounts and early reading choices retain their preference. Source
locale capture uses hero height and `#beyond`, independently of reading band gaps
and checkpoint capture. The actual1009px hero/104px opening gap restores the new
motion HOME to1009, not915. See the navigation contract for records and evidence.

Mode changes preserve the native offset, clamped to the newly measured document,
then snap target/displayed score through the shared render path. This mirrors
the source's native-position behavior rather than seeking the previous semantic
chapter when toggling reading. A simulated scene/context failure latches the
separate `homeSceneFailed` state, removes the pin, exposes the server reading
layout/poster and suppresses optional motion without changing user audio
or the explicit quiet preference. The scene gate clears that latch on HOME
unmount, allowing a new route mount to retry.

This implementation is being compared in review rounds; matching the scroll
extent alone does not establish full visual/interaction parity. Reference tabs
must be active before capturing a settled frame: their ticker pauses while
hidden, even if the native scroll position has changed.

R15 presentation cache: `journey-presentation.ts` owns only the optical and
chapter/progress/cue/load-status DOM presentation previously in the controller.
Its references belong to one motion mount; `measure()` refreshes the topology
after the opening fitter, before the existing geometry snap. Replaced optical
nodes receive the same unconditional style/ARIA cleanup as disposal. Disposal
releases the references and guarded-style cache; reading and a later HOME mount
continue to initialize from their own semantic DOM.

The public cached source `2gz902oulp4x8.js:7635–7674` caches chapter/progress/cue
references and skips unchanged labels. This extends that source-supported cache
contract to the local optical/post presentation: text and attributes compare
their current values; styles retain requested and CSSOM-normalized values and
also detect external clears. A repeated score therefore avoids redundant writes
without preventing a geometry refresh or restore from repainting presentation.
Module constants replace the per-render chapter arrays and easing closure.
The existing source curves, blur, letter spacing, ARIA/visibility thresholds,
copy and HTML are unchanged. Stage attributes → optical → work → systems →
controls → `journey-frame` remain in that order on every controller render;
no equal-score return suppresses the other owners or independent opening time.

Focused inline-DOM tests in `tests/journey-presentation.test.ts` cover accepted
poses, EN/AR forward/reverse boundaries, unchanged writes and zero render-time
queries, independent opening progress, refreshed topology, external clears and
disposal/remounts. They do not measure browser layout or presented frames. R14's
remaining early-story/footer cadence deficit and its unresolved CPU attribution
remain open; this cache change makes no whole-route cure or FPS claim.

After the profiling release, `bun test tests/journey-presentation.test.ts
tests/journey.test.ts` passed 23 tests / 2,477 assertions. Scoped ESLint of the
controller/helper/test, plain `tsc --noEmit --incremental false`, and
`git diff --check` passed. Full check/typegen/build/SSR, production reprofile,
browser verification and commits remain with the parent.
## Background submission handoff (R15 follow-up)

`journey-render-owner.ts` holds only per-stage pending/publication ownership, not
animation progress or another clock. `request()` announces pending ownership
before its existing RAF registration. A tick publishes the unchanged frame
inside that scope after optical/work/systems/control writes. The background
then submits the current score once, yielding its independent physical-tail
RAF while ticks remain pending. The final tick, hidden pause, synchronous snap
or motion cleanup releases it. No easing, retarget timestamp, cutoff, reading
geometry, restoration policy or event ordering within a rendered pose changes.
This corrects the intermediate demand-only background's proven one-publication
lag; actual source uniform/order evidence is in `home-residual-cost-r15.md`.
Production phase/cadence and full moving acceptance remain required.

The server section is guarded by `server-only`. Its null gate delegates
mounting and cleanup to `journey-gate.logic.ts`; the controller import is
module-scoped. This baseline geometry/navigation owner also runs in reading
mode, so disabling it through `useDeferredMotion` would break restoration and
the reading cue. Heavy visuals remain in the separate scene gate.
