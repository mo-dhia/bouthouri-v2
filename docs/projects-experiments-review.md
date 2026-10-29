# Projects detail integration review

Current cursor policy: the user requested a local simulation and explicitly rejected cursor sharing or a backend. Earlier two-tab controls below are historical; that transport has been removed.

This change extends the accepted Projects grid into all nine local reference
studies: Cursor Study, Dial, Polka Dots, Heart, ThreeJs Scene, Dynamic Scrollbar,
Rotating Gallery, Paste Up and Vocal Orb. Both EN and AR routes retain Bouthouri’s
shell and persistent background. Original study attribution remains visible.

The user’s two issue attachments were unavailable in the conversation. Grid
labels were independently inspected: perspective had warped the caption with
its card. Captions now stay level/readable below the projected media, with
measured width/opacity and their original semantic link ownership. Their
cleanup restores the server structure. Embedded gray poster/video backgrounds
are mapped toward black with a code-native brightness/contrast filter; the
already-dark Orb is excluded. No preview bitmap or reel was destructively edited.

## Verification and findings

- Source HTML, public example code, runtime/config and media references were
  inspected for every study. Kernels are adapted imperative ports with no
  reference framework, header, theme/presence UI or prohibited animation runtime.
- Desktop source camera measurements are 1858×946 at 1920×1080. Source/mobile
  and source/tablet controls were freshly checked at 412×915 and 768×1024/DPR1.
  All nine local EN mobile and AR tablet routes were inspected. Renderer cameras
  stay width-scaled; camera-vs-CSS client rounding is explicitly documented.
- Eight paired desktop native interaction protocols were recorded at 1920×1080:
  Heart drag, dot hover/click, Dial wheel, scrollbar scroll/hover, gallery mode
  switch/wheel, three print layouts, Three subjects/render modes, Orb pointer.
  Sixteen canonical clips were decoded at a finite 3fps. Eight whole-control
  eight-pair overviews plus compact/reference sheets were visually inspected.
  These are bounded controls with independent ambient phases and input timings,
  not claims of every-frame pose equality or presented FPS.
- Review caught an unconverted gallery plugin call. It was replaced with owned
  native rectangle inversion retaining the source ease/delay/distance stagger.
  The original failing recording remains retained. Fresh corrected controls and
  production checks are recorded separately. Mobile Three controls were moved
  beneath the own Notes/Tune row after an overlap was observed.
- A first local Orb capture was invalidated by focus loss during recorder
  teardown. It is excluded; the complete 41-event replacement is retained.
  Its event/encoding wall times differ from source; it supports pointer response
  review, not a cadence/FPS conclusion.
- One real same-origin peer is observed between two local tabs. Initial use of
  the old source tab did not receive a peer; that sequence is retained rather
  than treated as a successful control. No cross-device service is configured.
- Focused lifecycle tests exercise actual mounted host cancellation, first-frame
  eligibility, current failure and stale failure after profile replacement.
  Native finite math and microphone late-permission tests run without real
  audio capture. Gallery tests exercise physical-to-reference bounds, source
  timing, parent/style restoration and interrupted completion rejection.

## Release checks

Full check, production build, production/public SSR and final browser results
are appended once the exact release snapshot is frozen. No universal parity or
performance certification is inferred from this finite review. On-device ML
model accuracy, real microphone/speaker quality, hardware touch and Arc/macOS
GPU behavior are not independently certified in this round.

Evidence is retained locally in `.artifacts/projects-details-20261029/`, including
source/cache manifests, initial failures and fixes, native input receipts,
original MP4s, decoded overviews and final route/build/SSR receipts. Ignored
artifacts are not shipped; portable ownership/provenance records are committed.

## Validated release snapshot

`bun run check` passes lint, installed Next type generation/TypeScript,
architecture audit and **442 tests / 19,131 assertions**. `bun run build`
prerenders all eighteen experiment routes. Production `test:ssr` passes HOME,
four editorial routes and nine studies in both locales: **28 localized pages**,
canonical/locale links, useful server content, expected 404s and 24 static assets.

The built page loads Orb graphics with no worker, model or speech-SDK request
before intent. A controlled portrait-only WebGL loss restores its visible poster
and leaves Notes/navigation readable. Actual HOME Reduce Motion → MENU Projects
→ Heart, then browser Back/Forward, completes on the built runtime. Corrected
production gallery interruption controls restore ten real cards to the expected
parents. Its new native carousel/grid/carousel recording completes all eight
inputs and a 4fps, sixteen-frame whole-control overview was inspected.

The JavaScript-kernel lint override now rejects unbound globals explicitly,
preventing the original gallery plugin omission from silently passing lint.
No source styles/clock/assets or forced source renderer draws were used.


A final cached-runtime math comparison corrected center-grid intro staggering:
the source normalizes each distance to the full largest-grid-side span rather
than using distance directly. Regression fixtures also cover a peer/tween waking
a fully idle scene without its clock jumping behind the scheduled start. Peer
join replies retain a last known cursor even when the replying tab is hidden;
regular hidden-tab broadcasts remain paused. These refinements do not change
renderer geometry, timings/constants or the documented transport limitation.


## Local-only cursor correction

The user rejected realtime cursor presence, including same-browser sharing.
The Cursor Study now contains only three clearly labeled simulated pointers,
with authored pauses/travel and local pointer/touch response. All transport,
heartbeat and visitor-identity code has been removed. No backend is required
or planned for this study. Reduced motion is static; the child never creates
a global cursor layer. Server copy in both locales identifies the simulation.
The old slug and original preview artwork remain compatible.

Mounted tests forbid cursor network/channel/timer access, exercise local input,
reduced motion, Arabic labeling and cleanup. Pure checks cover bounded paths,
continuity, holds and the return from local guidance. The original release’s
cross-tab behavior and its earlier evidence are not current product behavior.


Local-simulation validation: `bun run check` passes **448 tests / 19,188
assertions**, lint/types and the architecture audit. Production build and the
28-page production SSR audit pass, including the explicit EN/AR simulation
copy and absence of the old sharing instructions. Browser controls show three
labeled demos, local movement, Arabic copy, and zero cursor layers after Next
to Dial; Back restores one layer with three demos. Mobile-width inspection
was at actual 484×915 (browser minimum width), not an asserted 412px reference.
No backend, channel or visitor presence is exercised by those controls.
