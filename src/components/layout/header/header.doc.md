# Shared navigation shell

Header stays outside main and renders both source layouts and the complete menu
on the server. `header-animate-gate` returns null; only `header.logic.ts` loads
after hydration. No `portfolio-environment` wrapper is required for these scoped
styles. Parent supplies the global Questrial/Cairo metrics; shell supplies its
44px hit-area and physical LTR layout. Arabic labels keep their own direction.

The hero layout has language/menu left, original inline logo center and
sound/conversation right. At <=900px it becomes logo left / menu right. The
persistent layout exposes logo/discipline left and utilities/conversation/menu
right. `gazzar:hero-world { progress }` drives the exact source world masks,
nav travel/opacity, persistent roll bands .83..99, and side-menu band .89..97.
The source `.masthead .chapter-side` retained by the parent is suppressed as a
duplicate; Header renders the styled side-menu control in the same position.
Native/reduced reading docks directly after the static hero. On mount the shell
replays #identity’s current data-hero-world, covering a hero/restore event that
arrives before the lazy header chunk. Storio changes also refresh that pose, so
restored persistent controls have the correct inertness. Control selectors should
use data-nav-layer: the utilities ancestor’s data-nav-context is its current pose
and can also equal persistent.

The original three SVG paths assemble on logo hover/focus (480ms +35ms/piece),
reverse from their current transforms, and reset on Escape/blur/leave. Nav labels
have an inline baseline marker and the source's measured ink-centering correction.
Conversation links retain the rollover; background marquee cue is editorial.

Menu is a server-rendered modal dialog with source labels/routes/descriptors,
language, synchronized sound button, email/COPY feedback, LinkedIn, Cairo clock,
role and year. Surface opens 0..360ms; content unclips 360..480; links start
400ms with 45ms stagger; secondary content starts 540ms with 45ms stagger;
footer begins 650ms. Closing restores the invoking control. Native dialog focus
containment, Escape handling, document/Lenis lock, and scroll-position correction
keep the background still, including programmatic scrolling. Internal menu scroll
is native. All menu content is in initial HTML; no-JS navigation is provided.
Cairo time updates on minute boundaries and changing menu digits roll over 360ms.
Clipboard success/error feedback is implemented; the parent observed trusted
COPY reach COPIED after its write promise resolved. A synthetic native cancel
event closes the dialog and releases the lock. The Vaelix key path omits the
virtual key code required for native dialog cancellation; its Escape event alone
is not evidence of a physical keyboard failure.

`src/lib/audio/material-audio.ts` owns explicit opt-in media, synthesized UI /
portrait sound, footer friction, gain ramps, saved preference, autoplay retry,
visibility behavior and cleanup. `section-whispers.ts` consumes the parent's
`#top` `journey-frame` event; it never derives another story clock. Ambient and
14 localized stems live under `public/assets/sounds/`. See audio.doc.md.

Shell/menu/entry/footer labels are verbatim local data in `shell-copy.ts`.
Dictionary migration can move that object unchanged into server dictionaries;
no dictionary edit is required for current integration. All route links are
original localized destinations. Semantic locale/history restoration and route
covers are owned by the separate parent integration, not this shell controller.

Observed EN menu at 1240×670 matches reference link font 83.7835px, all four
word rectangles, 82px top bar and information-column rectangle exactly. Mobile
Arabic menu open and correct labels/layout were observed at 392×972. Focus,
physical keyboard and short/coarse-touch gestures remain hardware QA. Trusted
clipboard and audio control states were verified by the parent. The persistent
discipline sweep is implemented in CSS. Source scroll-magnet intent/snapping is
owned by hero-scroll-magnet.ts and driven by the hero RAF; see hero.doc.md.
`homeSceneFailed` participates in effective reduced behavior without changing the
user’s quiet/audio preferences.
