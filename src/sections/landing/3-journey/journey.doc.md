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
Menu/visibility pauses preserve elapsed scrub time, while restored positions snap
both the target and displayed score.

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
The settling controller also pauses while the menu is open.

Mode changes preserve the native offset, clamped to the newly measured document,
then snap target/displayed score through the shared render path. This mirrors
the source's native-position behavior rather than seeking the previous semantic
chapter when toggling reading. A simulated scene/context failure latches the
separate `homeSceneFailed` state, removes the pin, exposes the server reading
layout/poster and suppresses optional motion/Lenis without changing user audio
or the explicit quiet preference. The scene gate clears that latch on HOME
unmount, allowing a new route mount to retry.

This implementation is being compared in review rounds; matching the scroll
extent alone does not establish full visual/interaction parity. Reference tabs
must be active before capturing a settled frame: their ticker pauses while
hidden, even if the native scroll position has changed.
