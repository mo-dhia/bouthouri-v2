# Identity hero and entry

`Hero` is server-rendered at `#identity`; **`#top` belongs to the journey**. It
accepts the existing `copy` prop and an optional `locale`; the existing EN/AR
copy also identifies the locale. All copy, portrait markup, entry choices and
signature SVG paths arrive in HTML. The entry layer is `hidden` in that HTML.
The null gate imports the controller immediately after hydration when optional
motion is eligible. It deliberately does not wait for hero intersection: a deep
history/locale restore still needs to establish the fixed layer’s exit pose.
Without JS, a failed enhancement, reduced motion, or quiet reading, the complete
static hero stays visible and the scene is absolute rather than fixed.

## Geometry and typography

The original 700px portrait breakpoint, 900px shell breakpoint, 6/5 tablet
aspect rule, short-height rules and original clamps are retained. Desktop photo
width is `max(100vw,150svh)` centered at 50%/50%. Mobile uses
`max(164vw,104svh)`, top 44%, center `50% + 65px`, and the original bottom mask.
Desktop marquee top is 17.5%; mobile 29%; tablet portrait 34%.

Global `html[data-typography=questrial-cairo]` variables are consumed directly;
there is no second scale multiplier. Arabic uses Cairo and inherited 450 body /
500 heading weights. The hero supplies its own layout/font-family/direction
variables, including the original Arabic hero-size clamp.

Measured local/reference parity in active Vaelix tabs, DPR 1:

- EN 1240×670: title bounds `(816.65625,547.546875,396.078125,51.078125)`,
  font 48.6545px and tracking -1.45964px; support bounds
  `(816.65625,601.625,396.078125,36.375)`, font 12.3px. All match.
- AR 392×972: title `(20,722.4375,352,50.71875)`, support
  `(114.96875,776.15625,257.03125,79.21875)`, portrait
  `(-244.4375,90.71875,1010.875,673.90625)`, and header top 16px / height 48px
  match. Entry anchor also matches exactly. Entry button inheritance was
  corrected to the reference's 450 Arabic weight after this comparison.

## Entry clock and assets

A single owned RAF handles the entry, 133 CSS-pixel/second marquee, world
scrub and portrait invalidation. Animation progress never enters React/Storio.
The three inline original logo shapes fill sequentially and assemble into the
original mark; choices appear at ready +1.02..1.26s. QUIET mutes audio only.

On selection, the mark travels to the hero nav logo over 1.1s. Portrait resolve
starts .06s / lasts 1.2s; nav masks start .15s with .06s stagger / .55s duration;
copy starts .28s with .1s line stagger / .6s line duration; cue starts .84s /
.44s duration. Signature begins 1.04s, with the original stroke lengths/paces
and 1.3s total writing time. Scroll unlocks at .48s; sequence ends at 2.5s.
The 8s continue control and Escape provide a loading bypass.

`hero-portrait.ts` is a separate dynamic import and is the only hero Three
import. It uses the original portrait unchanged at rest, a nearest-filtered
34×34 displacement field, deterministic boot offsets, alpha hit testing, face
attenuation, pointer impulses, and the measured departure alpha field. The
source subpixel correction uses exit velocity filtered at rate 35, a .18 velocity
gain, the `pow(4*a*(1-a),3)` boundary response and CSS-pixel offsets; mobile
detail is .35. DPR is
bounded at 1.5 and by original image resolution. The shared RAF calls the
renderer only when dirty; GPU resources/context listeners are owned and disposed.
WebGL failure leaves the server image, with a CSS departure mask.

## Parent / shell integration

`heroWorldEvent` is **`gazzar:hero-world`** on `window`, with
`detail: { progress }` in 0..1. `heroWorldPose(progress)` and
`worldProgressFromScroll(scroll, heroHeight, mobile)` are exported from
`hero-world.ts`. Header and the parent's opening renderer consume that event.
Hero does not animate opening words or the story HUD.

Default world input follows the source's independent hero trigger: desktop unit
`100/6.8`, mobile `100/5.8`; input length 22 with its nonlinear six-unit hold.
The custom scroll engine registers `identity-world` with `useRAF:false`; it only
feeds the hero’s RAF. A native passive scroll listener also reads position so
large immediate Lenis/native seeks cannot miss the trigger’s active interval.
Changed targets use the source 100ms `power2.out` (cubic out) curve, retargeted
from the displayed world value. Refresh and navigation restores snap directly.
Parent may dispatch **`gazzar:hero-world-input`** on `window` with `{ progress }`;
it temporarily labels the input owner `journey`. The next native scroll remains
authoritative and clears that label.
Do not feed display progress `(opening+score)/740` into this world channel.

`getHomeRestoreIntent()` is read synchronously at controller entry, before any
entry mode/lock is initialized. Any `skipEntry` intent finishes immediately,
including a restore to hero fraction zero. The journey retains intent consumption
and measured scrolling. `home-navigation-restore` also finishes pending entry and
applies native world progress synchronously so shell/portrait do not scrub from
a stale frame. `uiStore.entryPhase` is idle/loading/ready/assembling/complete;
setting complete before mount is an additional supported skip. A nonzero native
scroll or hash also skips fresh entry. The completion event
is `identity-entry-complete`; `html[data-hero-boot]` mirrors phase. Menu uses
`html[data-menu-open]` and the shared Storio flag. Quiet reading remains the
parent’s `quietMode`; it is separate from entry audio and marquee pause. The
effective reading state also includes `homeSceneFailed`, without changing either
preference. At world>=.73 the entire inner scene uses `display:none` and is inert;
entry descendants have explicit visibility and cannot override this containment.
Reverse scrolling restores the scene; outer #identity still reserves 100svh.

Cleanup removes custom registration, observers, listeners, pointer state,
RAF, text-line clones, inline styles and renderer resources, and releases any
entry scroll/inert lock. Re-enabled motion initializes at current scroll.

## Source scroll magnet and shared material pressure

`hero-scroll-magnet.ts` collects wheel, pointer and keyboard intent without a
second RAF. It waits 120ms after input/motion, honors held pointers/keys, tracks
signed distance and velocity, and cancels on new input, external displacement,
menu, visibility, blur, resize or teardown. Source world targets are forward
.995..<.997 with distance>.012, and reverse .025..<.075 with distance<-.012.
The snap takes `.24+min(.18,.7*distance)` seconds with cubic in/out and exact
floor/ceil endpoints. Its state is `main[data-world-magnet]`.

Window `gazzar:material-protection` is input to the scene owner. Portrait emits
`{source:'portrait',active,pressureScale,influence:0,clientX,clientY}`. Pressure
is `1-.88*exitVisibility*pointerStrength` only on the original alpha-hit region;
entry/pointer gain uses source smoothstep. It updates during departure even for
a stationary pointer. Inactive packets restore scale 1 on blur, hidden, resize,
pointercancel, menu/reset and disposal. The scene owns composition and its RAF.

## Validation and remaining comparison work

Focused ESLint and an in-memory TypeScript program over owned files passed.
Numerical comparison to the recovered source `te` matches all 12,342 exit-field
samples exactly. The scrub contract samples 25/50/75/100ms as
.578125/.875/.984375/1 and finishes exactly rather than asymptotically.

Cold/current dev, EN 1400×950 DPR 1: QUIET then scrollY 8000 yields source score
87.1336, heroWorld 1, scene display none and no portrait boxes. ScrollY 9699 is also
contained; reverse to 0 restores the scene. EN 658 → AR 658 → history.back EN 658 was
observed with enhanced/complete, hidden scene, no loader and no scroll lock.
The source magnet reached ceil endpoint 2372px after forward wheel intent and
0 after reverse keyboard intent. Browser dispatch was used for these intents;
physical wheel/touch comparisons remain part of the parent’s final review.

Resting EN 1240×670 and AR 392×972 geometry comparisons above are from pass1.
Parent owns integrated build/SSR and full visual review; no full parity claim is
made from numerical geometry or trusted-control state alone.

Pass3 closes the portrait-only WebGL fallback difference. The pure
`hero-portrait-mask.ts` generates the original five alpha stops
1/.844/.5/.156/0 at boundary offsets -.36/-.18/0/.18/.36, including the
.92..1 global tail fade and source decimal rounding. It inverts the current
translation and scale about the portrait’s 55% height origin before placing
the gradient stops. Actual controller transforms and hero height supply the
inputs, so the same physical top-to-bottom field covers EN/AR, mobile, portrait
and landscape without a locale-dependent mask. Existing child-image mobile
masking remains composed beneath the container mask.

The existing hero RAF synchronizes fallback availability before its world-pose
cache check. Cold renderer failure or later context loss enables the CSS mask;
WebGL readiness/recovery removes it even at an unchanged scroll position.
Context loss wakes that same RAF. Reverse at exit0 uses none; normal hero
cleanup restores the original inline style. No extra RAF, client content or
loading boundary was added.

Validation: all 9,696 generated comparisons match the recovered public source
function exactly. Eight fixed source fixtures in hero-portrait-mask.test.ts cover
desktop/mobile, EN/AR, portrait/landscape, tail fade, full fade and rest/reverse.
Focused ESLint and scoped hero TypeScript checks pass. One own Vaelix sequence
uses WEBGL_lose_context on only the portrait canvas: the static image stays
visible with the source-identical five-stop mask at world .4285, the enhanced
journey stays active, scrollY 8000 hides the scene while retaining 950px height,
and reversing to 850 restores the same mask. Context recovery removes the mask at unchanged world .4285; switching to
reading mode clears the inline mask and returns the scene to absolute positioning. This closes the last concrete pass2
fallback defect; the parent owns final build and reviewer r4’s broad QA.
