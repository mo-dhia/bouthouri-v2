# Shared navigation shell

Header stays outside main and renders both source layouts and the complete menu
on the server. `header-animate-gate` returns null; only `header.logic.ts` loads
after hydration. No `portfolio-environment` wrapper is required for these scoped
styles. Parent supplies the global Questrial/Cairo metrics; shell supplies its
profile-scaled 44-reference-pixel hit-area and physical LTR layout. Arabic labels
keep their own direction.

The 2026-10-28 sizing policy fixes desktop at1920×1080 for widths>1024, tablet
at768×1024 for600<width<=1024, and mobile at412×915 forwidth<=600. Root evaluates
the original CSS cascade at those references and scales design lengths by actual
width/reference width. Height/orientation does not change composition. Historical
source comparisons below predate this policy and are not fresh parity evidence.
Controller navigation travel combines already-scaled measured row geometry with
a scaled12-reference-pixel overhang; fallback row/label lengths also scale once.
Reading frame placement, label reservation, menu rail and measured ink correction
emit `vw`. SVG hover transforms retain their local viewBox coordinates. Native
scroll lock, clocks, menu tracks, audio and animation ownership are unchanged.

The mounted profile regression checks scale-one travel, uniform within-profile
scaling, single conversion of measured DOM lengths and height-only resize
invariance. Scoped hero/header tests pass (68 tests /834 assertions) and ESLint
is clean. The latest plain TypeScript run reports only four TS2532 diagnostics
in concurrent `footer.logic.test.ts:405`, with no owned hero/header diagnostics.
Root owns CSS integration, full checks/build/SSR and reference-sized production visual
review; this non-CSS handoff did not use a browser or change the served candidate.

The hero layout has language/menu left, original inline logo center and
sound/conversation right. Tablet/mobile profiles use logo left / menu right. The
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
containment, Escape handling, native document scroll lock, and scroll-position correction
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
frame. Only final reverse completion closes the modal/releases the native
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
Scoped lint/diff checks pass. R9 independently accepts these metrics in production
and also matches EN narrow/AR wide, utility dock placement and the900/901px
breakpoint. Hero/dialog controls retain their separate metrics; targeted menu
interruption, reading and resize checks pass. See `docs/home-parity-review-r9.md`.

The R11 reading-footer observation led to a live source geometry check. Reading
uses raw native hero progress, without the motion remap, and its peripheral
viewport becomes absolute inside `.glasses-chapter`. The shared shell now follows
that progress and places only the side MENU in a document-positioned reading
viewport aligned with the chapter;
the other persistent utilities keep their source fixed placement. At2544×1392,
source MENU top is75.850006 at native1392, -424.149994 at1892 and -12634.650391
at the reading footer14102.5. Its width/reservation remain101.733337/102 while
it scrolls away. The previous fixed substitute stayed at75.850006 throughout.
An offline adversary caught that translating inside the fixed header would
still prevent native focus scrolling. The reading viewport therefore owns the
actual control outside the fixed utilities, preserves its measured row geometry
and profile design-height clip, and returns it to its original home on motion/cleanup. It stays
focusable offscreen as on source. Source default focus from y1892 moved native
scroll to793.85; R12 independently confirmed the same default-focus behavior
at wide and narrow sizes in both locales.
At native348/696/1044 source raw progress is.25/.5/.75 and the hero utility row
has already exited; the former coarse0/1 fallback incorrectly kept it onscreen.
Mode, resize and OS-preference changes now replay this native pose, and stale
hero cleanup events cannot overwrite it. Motion continues using the published
full-precision hero pose. These additional reading corrections require the fresh
production review alongside the R11 footer fixes. R12 accepted the reading
hero and both footer corrections, but exposed an Arabic placement regression:
moving MENU outside the LTR utilities made its logical end resolve to the left.
The reading frame now explicitly keeps that same LTR placement coordinate
system. The menu button retains its existing Arabic font and ink shaping.
Fresh paired wide/narrow review remains required for this R12 correction.

R13 header hotpath caching follows the cached source's element/height cache and
unchanged-progress guard (`2gz902oulp4x8.js:4557–4563,4627–4649`). Pose application
now reads cached geometry and skips identical full-precision progress. Ordinary
native scroll never replays an older published or rounded dataset pose; motion
events and initial/layout replay prefer the current hero WeakMap publication.
Reading still derives raw native progress from the measured hero document top
and height. A synchronous world event cannot measure geometry during another
owner's mode transition, and stale motion cleanup cannot override reading.

Mount, resize, font readiness, effective reading-mode changes, geometry-ready /
restore events and observed hero/chapter/utility size changes refresh geometry.
Identity and chapter references are refreshed in those transactions; bounded
mutation discovery handles an absent/replaced stage and observes enhancement /
reading ownership attributes and locale changes, without observing animated
styles or progress datasets. Duplicate stage side controls are queried during
measurement and suppressed once per element, with their original style, inert
and ARIA attributes restored on teardown. Observers/listeners are disconnected
and a late font promise does no work after cleanup.

Only measurement positions the absolute reading viewport/frame. It still moves
the actual MENU, retains the LTR frame and existing ink/width calculation, and
leaves persistent utilities fixed. Native document scrolling moves that viewport
without per-scroll bounds reads or offscreen inertness. Returning to motion or
tearing down restores the original MENU location and removes its single wrapper.
Menu, audio, clipboard, focus, curves and the RAF owners are unchanged.

Header-scoped regression coverage exercises the mounted controller's counted DOM
operations, precision/authority, raw reading progress, mode and geometry
invalidations, late stage/font readiness, duplicate restoration and teardown.
It supplies layout values explicitly and does not assert browser CSS parity or
performance duration. Root owns production rebuild, paired EN/AR wide/narrow
reading/focus review and reprofiling. The R13 OS-unfocused synthetic method-repeat
counts are intercepted calls, not exhaustive browser work or causal milliseconds;
this bounded change does not close whole-HOME smoothness acceptance.

Focused verification: `bun test src/components/layout/header/header.logic.test.ts`
passes 3 tests / 63 assertions; scoped ESLint, plain
`tsc --noEmit --incremental false` (without type generation) and the header diff
whitespace check pass. Production/browser validation remains with root.

The null gate view delegates deferred mounting and teardown to
`header-animate-gate.logic.ts`. Shell markup is guarded by `server-only`;
`header.logic.ts` remains dynamically imported because navigation must work
independently of animation preferences and viewport position.


2026-10-28 final reference review found that selecting the first menu row while
the native dialog was closed measured zero offsets. Selection is now retained
without hidden geometry reads; after `showModal()` the rail measures the visible
selected row and emits its center in `vw`. Pointer/focus selection, window and
font-ready layout changes remeasure the same selected row. Reopening an
interrupted close preserves selection. A new open after a complete close resets to VISION, matching the source closed-branch `C(0)`; the row, rail
and description reset together. Native scroll reset and reversible timeline
remain unchanged.
The mounted regression models zero closed offsets across EN/AR at all three
reference widths, selection changes, proportional resize, font completion and
reopen. No new RAF or geometry reads are added to ordinary journey frames.


2026-10-28 identity update: shell owner labels and contact links now derive from
`src/config/brand.ts`. COPY reads the same email as its visible/mailto link.
The inline mark is named`IdentityLogo`; its paths and all menu/header timing
remain unchanged. Shell/foot gates use neutral`data-portfolio-*` mount markers.
English display name is`Med D. Bouthouri`; Arabic is`محمد ضياء بوثوري`.
