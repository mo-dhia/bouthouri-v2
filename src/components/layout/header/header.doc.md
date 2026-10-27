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

R5-04: `menu-timeline.ts` now owns a single reversible native RAF clock for the
complete source-authored opening. Surface0..360ms uses power3.inOut; content
360..480 uses power2.inOut; line scale360..580 and opacity610..750 remain
separate tracks. Links start400ms with45ms stagger/power3.out; secondary rolls
start540ms with45ms stagger/power3.out; footer650..900 uses power2.out. The
HOME’s four links/five secondary groups finish at1020ms. Close reverses this
same position at1.55x (logical658.0645ms from full open), rather than starting a
new wipe/fade. Reopen during closing changes direction from the last painted
frame. Only final reverse completion closes the modal/releases the native/Lenis
lock and restores the original opener. Content is inert during closing; the
close/toggle stays available. Reduced motion takes the existing immediate path.
`data-phase` exposes closed/opening/open/closing. Teardown cancels the sole RAF,
removes the visibility listener, restores original track styles and releases the
lock. Clock/rail/description micro-animations retain their existing ownership.

Matched active pair1912×1009/DPR1, source175555005 and cold-dev175555011:
full-close source667.6ms; local668.1ms initially and674.0ms after the final
interruption fix (frame-observed modal/lock removal). A600ms open→close for200ms
→reopen preserved the exact surface/content styles across direction changes,
kept the modal/lock, changed primary inertness correctly, completed opening and
closed normally with opener focus restored. Source had the same ordering and
continuity. A native40→174 seek immediately followed by menu open settled
under the locked modal in both (source174.01/local174.0071); close revealed the
settled score. The parent owns that scalar-clock change; no journey/navigation
file was changed here.

Four focused timeline tests (17 assertions) check source offsets/eases, endpoints,
reverse ordering and full duration. An isolated native-clock probe verifies
interrupted direction continuity, completion callbacks, hidden pause and disposal
without RAF/style leaks. Focused shell lint and scoped TypeScript pass. Browser
pair ownership is RELEASED; both tabs remain ordinary EN/y0/entry complete,
menus closed, original1912×1009/DPR1; local is latest dev3000. No tabs/windows
were created and all temporary observers/globals were removed.

R8-02: the replacement persistent side MENU now owns the source chapter-side
typography: type scale1.04/tracking.8, zero letter spacing, 11px Latin /14px
Arabic bases, width `4em +56px` on desktop and auto/min64px below900px. Its label
stays4em wide. These rules apply only to the side control; hero and dialog retain
their own menu styles. Font-ready/resize measurement also sets the source
`--nav-right-label` from the side's rounded offsetWidth and removes it on cleanup,
so the adjacent utility dock follows the actual control instead of fallback116px.

Root active-tab dev comparisons match source: EN1912×1009 at312 has font11.44px,
width101.75px, left1733.78125/top49.625 and label reserve102px; AR392×865 footer714
has font14.56px, width74.234375px, left294.25/top16. Both inherit1.04/.8 and zero
tracking. Hero controls remain9.225px/12.24px respectively. Evidence and excluded
initial hidden/navigation reads: `/tmp/gazzar-r8-menu-root/evidence.json`.
Scoped lint/diff checks pass; fresh production/R9 acceptance remains pending.
