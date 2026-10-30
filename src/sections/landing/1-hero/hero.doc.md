# Identity hero and entry

`Hero` is server-rendered at `#identity`; **`#top` belongs to the journey**. It
accepts the existing `copy` prop and an optional `locale`; the existing EN/AR
copy also identifies the locale. All copy, portrait markup, entry choices and
signature SVG paths arrive in HTML. The entry layer is `hidden` in that HTML.
The null gate imports the controller immediately after hydration when optional
motion is eligible. It deliberately does not wait for hero intersection: a deep
history/locale restore still needs to establish the fixed layer’s exit pose.
Without JS the complete static hero stays visible and the scene is absolute
rather than fixed. With JS, quiet reading, OS reduced motion, scene failure and
a failed optional hero-controller import use the small `hero-reading.ts`
controller. This is directly imported by the gate and starts no RAF, timer or
entry runtime. Its optional portrait graphics are a separate dynamic import;
the server photograph remains useful while that enhancement loads or fails.

## Rebranding portrait (2026-10-28)

The active semantic image is now`/assets/images/hero-portrait-rebrand.webp`,
a lossless WebP derived from the user-supplied
`bouthouri-hero-natural-glasses-refined.png` (1536×1024, with alpha). The SSR
poster and the deferred Three photograph texture share this same image node.
EN/AR alt text describes the new portrait without retaining the original
person's identity. Width-based crops, masks, entry, pointer distortion and
scroll departure are unchanged. Original portrait assets and prior Gazzar
parity captures remain reference evidence; the photograph is now an intentional
user-approved branding difference. See[asset provenance](../../../../docs/reference-assets.md).

Verified the live enhanced hero in EN/AR at1920×1080,768×1024 and412×915/DPR1.
All six screenshots show the replacement and a ready portrait Canvas. Visible
RGB and all alpha samples match the supplied PNG after lossless conversion.
Scoped ESLint, architecture audit, static EN/AR production build and production
SSR/13-asset audit pass. Evidence is under`.artifacts/rebrand-hero-20261028/`.
A full reload was used to replace the previous dev/HMR Canvas texture.

On 2026-10-29 the user reverted the darker treatment. The portrait layer has
no added brightness filter in any design profile, restoring the supplied image’s
original exposure for the photograph, Canvas and reading mode.

## Design profiles (2026-10-28, physical height 2026-10-29)

The current sizing policy uses one composition per width category: desktop
1920×1080 above 1024px, tablet 768×1024 above 600px through 1024px, and mobile
412×915 through 600px. Root owns CSS conversion: original source rules are
evaluated at each reference width, then width lengths scale by actual width /
reference width. The hero fills the physical viewport (`100svh`); its
height-bounded portrait, copy and signature rules follow the window as on
source. The older viewport comparisons below document earlier source
investigations, not acceptance evidence for this policy.

Motion consumes the already-scaled `#identity.offsetHeight`; it does not scale
that DOM measurement again. The reference width selects the source 700px motion
and portrait-detail branches, so 650px still uses the tablet composition. Entry
offsets, mask overhang, copy-line tolerance, marquee inset and 133 reference-pixel
per-second travel scale with the profile. Measured line/mark geometry and world
translations are emitted as `vw`. Cached nav entry offsets also use `vw`, so a
resize removes the current physical offset from the measured logo flight target.
SVG viewBox coordinates, times, eases and the 100ms world clock remain unchanged.

Portrait framebuffer dimensions/DPR remain physical image measurements. Pointer
positions, native scroll coordinates, entry's near-top guard and magnet endpoint
rounding retain their operational units. Image `sizes` describes the evaluated profile
photo widths: desktop100vw, tablet173.3333333333vw, mobile230.9708737864vw.

The mounted motion regression checks scale-one reference poses, uniform scaling
within each profile (including 650px tablet), marquee phase/speed in both directions, entry geometry and entry resize. Mounted
portrait/header regressions cover profile detail selection, physical framebuffer
retention and measured navigation geometry. Scoped hero/header tests pass
(68 tests /834 assertions) and ESLint is clean. The latest plain TypeScript run
reports only four TS2532 diagnostics in the concurrently edited
`footer.logic.test.ts:405`; no owned hero/header diagnostics. Root owns that
integration check, CSS integration, full checks/build/SSR and paired
EN/AR production review at the three references. No browser or production server
was changed by this implementation handoff. These tests do not prove rendered
Gazzar parity or whole-HOME smoothness.

## Reading body and world contract (R11 follow-up)

The recovered source `2gz902oulp4x8.js.pretty:505–509` has separate world and
body lifetimes. Reduced `tq` normalizes native scroll by the hero's own height,
without the enhanced 22-unit input range, remapping or 100ms scrub. Its precise
pose updates navigation/background independently of the body. Source `tm` sets
the same reduced prop for `systemReduced || quietToggle || sceneFailure`.
The live measurement was quiet reading; OS and scene-failure equivalence is
confirmed from those source branches, not a fresh physical OS/browser failure.

Completed reduced `tU` removes itself from the ticker after a sample. Scroll
`tz`, resize/locale measurement, and visibility return wake it again. It does
not continuously animate the body. The lightweight controller samples on those
events, resize/font measurement and local navigation restoration. It publishes
`gazzar:hero-world` and `readHeroWorldPose` at full precision; the four-decimal
`data-hero-world` remains diagnostic. Hidden documents continue world updates
but postpone body writes until visible. Menu-open pauses the pose; closing
refreshes it and only consumes a body wake if one was pending.

The source hidden branch writes scene visibility/opacity/inert and returns
before writing or caching the body. Thus the last visible opacity is retained,
not recomputed from the now-hidden world. At native 2544×1392, the source sequence
348 → 696 → 1044 publishes .25 → .5 → .75. Copy opacity is .784 → .104 → .104,
bottom is .0429688 → 0 → 0, and the scene is hidden with opacity 0 at .75.
Reverse to 348 restores scene opacity 1 and copy .784. A direct deep mount has
no invented earlier visible body pose. Reduced transforms remain cleared; the
pause control stays present and disabled, matching the source.

The temporary read-only source trace was removed and source restored to quiet
1044. Evidence: `/tmp/gazzar-continuous-r10/reading-hero-source-contract.json`;
the original reproduction remains `reading-hero-before.json` alongside it.
`hero-reading.test.ts` runs the real controller/publisher against an event/DOM
surface and tests the gate's reduced/failure/cancellation decisions. These
checks do not validate rendered production frames or full-HOME acceptance.
Root owns the final rebuild, SSR audit and continuous source/local review.
Scoped validation: all 31 hero tests pass; ESLint passes for the gate, reading
controller and its tests; plain `tsc --noEmit --incremental false` passes.

## Reading portrait paint lifecycle (R13)

R12 exposed a real reading resize history: the source's ready portrait becomes
blank, while the former local static photo stayed visible. R13 traced the live
source before choosing a fix. `hero-reading.ts` now defers the existing
`hero-portrait.ts` renderer with `{signal, reading: pendingState}`. It retains
the existing shader verbatim, including its noise/luminance alpha field. Reduced
`exitDetail=0` disables only the source's displacement detail; replacing the
shader with a CSS gradient or a boolean blackout would miss a frozen partial
draw observed after a positive-budget resize. Normal motion's shader and render
branch are unchanged. The extra normal-controller changes only cancel pending
portrait preparation and leave readiness writes to the current graphics owner.

`hero-reading-portrait.ts` owns the small per-mount pending sample and draw gate.
Before readiness, each eligible native wake stores resolve/exit/pointer and the
measured image coordinates, even when the **hero** is hidden. A hidden document
or open menu skips that sample. Geometry measurement updates cached coordinates;
only a real wake publishes them into the pending sample. This preserves the
source's pre-ready `es` cache while its asynchronous controller is unavailable.
The initializer decodes and compiles, reads that sample, renders unconditionally,
and marks `prepared`, without spending the initial **1/60** draw budget or
inventing a wake when the controller promise resolves.

Subsequent native wakes call `render(0,1,exit,pointer,!hidden)` before the body
controller's hidden/cached-pose early return. The source gate is retained:
`(!dirty && lastResolve===resolve) || (lastResolve>=0 && budget<1/60-.0005)`
skips drawing. Budget accumulates only the supplied delta, capped at 1/30; an
actual gated draw spends 1/60. Completed reading supplies zero delta, so wall
time, reverse scroll, visibility return and dirty state cannot refill it. A
hidden hero does not spend it. Context availability restores the existing
budget/cache instead of resetting them; a new mode mount creates fresh state.

Reading measurement uses the actual image `getBoundingClientRect()` dimensions
and `min(DPR,1.5,naturalWidth/imageWidth)`. It calls renderer size methods only
when those values change. Even a CSS change that rounds to the same raster size
can clear the buffer, matching the source's dimension comparison. A height-only
viewport change that leaves the image dimensions/DPR equal does not clear it.
Shader view coordinates use image top relative to the hero and image height
divided by hero height. They therefore retain the source's reading image-relative
field after native scroll, rather than the normal path's viewport-relative field.
No pointer hit map, input/protection listeners, material-audio updates or owned
frame loop run in the reading variant. Three may poll while compiling its program;
the hero does not add an animation scheduler.

Both motion and reading create an AbortController before starting the deferred
import. A per-canvas owner cancels an older preparation. Abort during decode
prevents renderer allocation; abort during compilation immediately revokes draw
and DOM ownership. GPU disposal waits for Three's existing compilation poll to
finish so it cannot inspect already-disposed programs. A stale completion checks
ownership before measurement/render/readiness writes, releases only its own
resources, and cannot clear a newer surface. Cleanup never forces context loss
on the shared canvas. Graphics import/decode/compile failure leaves the SSR photo
and native body/world controller intact.

### Live source evidence and controls

`/tmp/gazzar-reading-resize-r13/native-trace-final.json` contains 1,383 timestamped
events plus the final state; `probe.js` records the exact probe. It wrapped
`Math.min`, native canvas width/height setters and native WebGL draw methods with
identical delegation, filtered to this portrait/source bundle, and recorded DOM
attributes/events. It requested no draw, canvas conversion, private-state change,
source clock override or source asset mutation. The restore closure reinstated
every native method and removed observers/listeners/global before browser release.

The inherited initial history was source AR reading, chapter y825 at 538×825,
entry complete, already activated before the parent's wide→narrow resize. Source
was hidden; its exact earlier budget was deliberately not assumed. On the traced
wide activation at t346118ms, `tn` cleared through `setPixelRatio/setSize`, `tU`
received delta0, and the portrait's budget expression read **1/60**. A native
draw followed at t346119ms, writing exit .7805. This is a preserved counterexample
to unconditional resize hiding.

Controlled fresh wide y0 motion→reading remount produced pre-ready zero-delta
wakes at t383035–383071ms, an unconditional initialization draw at t383101ms,
and `portraitReady=true`/`surface=prepared`. Native y0→1 at t407723ms read budget
1/60 and drew once. Wide→narrow at t413071ms then cleared actual dimensions;
both zero-delta wakes read budget0 and no native draw followed. Narrow→wide
repeated that spent-budget behavior. A fresh remount restored the portrait.

A second controlled remount followed by actual 2544×1392→2544×1292 kept the
image2544×1696/canvas1536×1024 and made no size writes; that wake spent the
initial budget at t452775ms. The next image-size change cleared without drawing.
At narrow hidden-hero y825, another fresh remount initialized but did not spend
budget. Its wide resize made the hero visible at the same native position and
legitimately drew exit .7805 using 1/60 at t472164ms. Returning to native0 left
that partial alpha frozen with budget0. PNG controls include
`/tmp/gazzar-reading-resize-r13-{remount-ready,drained-narrow,positive-return-top}.png`.

Labels containing `document-hidden-resize` in the trace are **excluded** as proof
of hidden-document resize ordering: the resize tool briefly activated a tab or
the delayed event ran while visible. The trace retains the actual visibility
events. Hidden-hero controls above are valid; document/menu guard behavior also
comes directly from source tU. The attempted outer2654×1512 size was constrained
by the screen and made no actual viewport change, so it is only a no-op control.
MCP mode clicks warned about interception; each actual resulting mode was
verified. These are synthetic handler activations, not physical hit tests.

All browser calls finished before explicit release: both original /ar tabs,
2544×1392/DPR1, native0, reading, entry complete, menus closed, sound quiet;
source37 active, `portraitReady=true`, surface rest, and no probe global. Outer
2654×1502 at -47,-5. No later browser calls were made by this implementer.

Focused validation covers 43 hero tests, including the real controller with a
non-GPU renderer double: positive and spent budgets, frozen partial draw inputs,
fractional size/effective-DPR invalidation, hidden-hero/visibility/context restore,
decode/compile cancellation, stale ownership and failure resource disposal.
These tests do not establish rendered source/local parity. Root owns the full
check/build/SSR audit and new served R13 pixel/continuous review. Early entry
cadence and true hidden-document resize ordering were not newly measured live.
The separately reported ordinary navigation flicker/scroll stutter remains open.

## Geometry and typography

R13-01 response (prepared after reviewer release; not yet served): reading
native samples now synchronize the source five-stop fallback mask on the
portrait entrance before the body hidden/cached-pose return. Reading uses zero
translation/unit scale. Context loss or readiness alone does not fabricate a
body wake; the next native sample applies or removes the mask, including at an
unchanged world pose. The entrance's prior inline styles are restored on cleanup.
The regression retains the live source697px stops6.491/24.491/42.491/60.491/78.491%.
Validation and fresh production comparison remain pending while the separate
whole-experience smoothness baseline keeps the served31f4beb candidate frozen.

Earlier responsive baseline: the original 700px portrait breakpoint, 900px shell
breakpoint, 6/5 tablet aspect rule, short-height rules and clamps were retained. Desktop photo
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

A single owned RAF handles the entry, profile-scaled 133 reference-pixel/second marquee, world
scrub and portrait invalidation. Animation progress never enters React/Storio.
The loader is Gazzar's, drawn with the brand book's kit
(`brand-book/bouthouri-mark.html`): the logo is the loading sequence. The
stem and the two half rings stand in a row (`loaderRow`, "|∩∪", one module
apart) as latent ghosts at .055 opacity. Each fills from its foot over its
third of the load (stem, top half, bottom half), drifting and squashed while
latent, exactly as Gazzar's pieces; the turned half fills from its own top.
At ready the row slides together into b (.1→.82s) by translation only and the
QUIET/SOUND choices rise at 1.02→1.26s. Hovering SOUND tilts the pieces
(target 1, QUIET −.35). The stage keeps Gazzar's ink height: its 640 × 320
row puts the 200-unit stem where Gazzar's 84-unit pieces were. QUIET mutes
audio only.

On selection, the b flies to the nav wordmark's b over 1.1s, fading bone to
the nav grey, and lands 50 units higher, where the wordmark's b sits. A
bypassed row finishes its fill (.4s) and assembly (.6s) on the way. Landing
hides the stage, plays the b's tock (D4, sound on only) and hands over to the
header's live loop (`identity-mark-landed`), which pauses on b and then reads
ب → ⴱ → b. Portrait resolve
starts .06s / lasts 1.2s; nav masks start .15s with .06s stagger / .55s duration;
copy starts .28s with .1s line stagger / .6s line duration; cue starts .84s /
.44s duration. Signature begins 1.04s, with the original stroke lengths/paces
and 1.3s total writing time. Scroll unlocks at .48s; the sequence ends at 2.5s,
well after the 1.1s landing. The 8s continue control and Escape provide a loading bypass.

`hero-portrait.ts` is a separate dynamic import and is the only hero Three
import. It uses the active semantic portrait unchanged at rest, a nearest-filtered
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
`detail` is the full displayed `HeroWorldPose`: `progress` remains in 0..1 and
`chapterPresence` is the source smoothstep over world .81..1. `heroWorldPose(progress)` and
`worldProgressFromScroll(scroll, heroHeight, mobile)` are exported from
`hero-world.ts`. Header, the parent's opening renderer and object-scene emergence
consume that same event. `readHeroWorldPose(heroElement)` reads its full-precision
current pose for late subscribers; the publisher cache is scoped to the mounted
hero element and removed on teardown.
Hero does not animate opening words or the story HUD.

Default world input follows the source's independent hero trigger: desktop unit
`100/6.8`, mobile `100/5.8`; input length 22 with its nonlinear six-unit hold.
The custom scroll engine registers `identity-world` with `useRAF:false`; it only
feeds the hero’s RAF. A native passive scroll listener also reads position so
large immediate native seeks cannot miss the controller's active interval.
`heroInputProgressFromScroll` normalizes the native trigger's whole hero+22-unit
span. `createHeroWorldClock` retains/smooths that **raw input**, then applies
`worldProgressFromInput` and computes the displayed pose. Changed targets use the
source 100ms `power2.out` (cubic out) curve. Smoothing the already mapped world
value changes the trajectory across the opening hold and clamps. Refresh and
navigation restores snap directly. A monotonic timestamp guard rejects stale
RAF timestamps after input/refresh; no second RAF is introduced.
The cached hero calls `w(e.progress, l.progress)`. Cached GSAP3.15.0 forwards
that second argument as `resetTo`'s explicit start, so a between-frame retarget
starts at the last displayed raw input. Calling quickTo without that argument
advances its previous tween at the parent timestamp and produces a different
trajectory; both VM-generated goldens are retained in the source fixture.
Parent may dispatch **`gazzar:hero-world-input`** on `window` with `{ progress }`;
this legacy channel remains mapped-world progress and is inverted to raw input
before retargeting. It temporarily labels the input owner `journey`. The next native scroll remains
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
Reverse scrolling restores the scene; outer #identity reserves the physical
stage height.

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

R10 clock fixtures in `hero-world-source.json` evaluate the cached public
`worldProgressFromInput`, `eg` pose and `openingOpacity` functions, with file hashes
and source line provenance. They cover EN/AR trigger extents, forward/reverse
entry, the opening seam, retargeting, immediate restore and scene late subscription.
At desktop raw0→1 /40ms the source world is .8538134490238611,
chapterPresence .13500105574394697 and opening opacity .9343924263786882.
The existing hero RAF publishes that pose; scene demand invalidation does not use
the independent 480ms journey opening clock. These temporal fixtures establish
regression coverage; the parent owns full continuous forward/reverse video review
and all appearance/experience/animation acceptance.

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

## Scroll ownership

Raw native scroll input now uses `scrollManager.createInstance('identity-world',
updateScroll, { useRAF: false })`. The hero already owns measurement, nonlinear
remapping and its presentation RAF; it needs no interpolated range values.
This replaces the redundant range callback plus separate native listener.
It still samples large/restored seeks outside the visible hero, and cleanup
removes only its own key. Source clock/easing, shared pose and magnet are unchanged.


2026-10-28 identity copy: hero titles, metadata, copyright and chapter identity
use`Med D. Bouthouri` /`محمد ضياء بوثوري`. Locale is now an explicit required
server prop rather than being inferred from the former person's name. This
retains the Cairo/Questrial profiles, alignment, masks, tracking and motion
while allowing personal copy to change independently of locale selection.


The English identity column reserves its original measured width so changing
the name does not rewrap the supporting copy or move the block vertically:
613.18335px at1920,322.60001px at768 and240.48334px at412, emitted as vw
minimums. Questrial size/tracking and the existing aligned column remain intact.
Arabic retains its existing fixed column and Cairo metrics; the approved longer
name fits all three profiles.
