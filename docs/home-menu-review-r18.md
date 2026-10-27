# HOME MENU review — R18

2026-10-27. Independent bounded LIVE review of frozen application **b711a74**,
documentation HEAD **f362dd5**, actually served production build
**18fx0S1mZziyiyCZ4Cao4**, against public Gazzar HOME. EN-wide only.

**The R16-02 open-menu freeze is corrected. A clean bounded MENU acceptance is
NOT granted:** one actual uploaded-clock regression fails the requested monotonic
control. The second local control does not repeat it. This is not evidence of a
visible flash, a new repeatable visual P2, or a demonstrated regression introduced
by b711a74. **R16-01 residual optical/footer cadence remains OPEN.** This review
does not accept whole-page EN/AR visual, moving or interaction parity.

No application edit, test, lint, typegen, build, package, stage, commit, server or
process-management action occurred. Only this report and `/tmp/gazzar-menu-r18/`
were written. The supplied 189 tests/5,419 assertions, engineering checks and
both-locales SSR/14-assets passes were not rerun. No profiler, recording, encoding,
extra URL, delegated agent or additional browser surface was used.

## R18-01 — one uploaded material-clock backstep at menu handoff

In the first current-build local control, actual natural default draws record:

- `defaults[667]`: wall **90941ms**, timeline **90920.92**, uploaded
  `uTime=90.21104431152344`.
- `defaults[668]`: wall **90944ms**, timeline **90938.02**, uploaded
  `uTime=90.21006774902344`.

The later draw is **0.0009765625 seconds lower**. Both draws are focused/visible,
menu-open, native15270, story151.2819, and upload `uStage=0.6718100309371948`.
They are in different timeline bins; this is not a duplicate submission. The
menu attribute was observed at wall90936, preceding both draws. The next draw
advances normally. There is exactly one negative adjacent pair among the first
local probe's1,328 draws, none among the second local probe's611 draws, and none
among the source probe's1,963 draws.

Relevant code is `src/sections/landing/2-story/story-environment.animate.ts:77`:
`dt` has an upper bound but no lower bound. Its standalone RAF path at70 passes
the RAF timestamp; its journey-frame path at164 calls `render(performance.now())`.
Those two timestamp sources can make the next received RAF stamp older than
the previous immediate sample. This is a code-supported explanation, **not a
captured call-stack attribution**. No app clock or uniform was written by the
probe. Native uniform reads can themselves delay a callback, so this result does
not quantify uninstrumented occurrence or visual severity.

Smallest next correction/control to consider: prevent a negative material-time
increment at this ownership transition, retaining the existing field and clock
history and the single final journey submission. Validate with the actual
immediate-to-RAF timestamp ordering; do not reset material time, restore parallel
render paths, or retune assets/eases/quality. No implementation was made here.

Evidence: `local-natural.json`, `analysis.json.regressions` under `local-natural`,
and `menu.function.js`. The raw regression entry also preserves both row indexes.

## Original freeze corrected; quiet tail and idle draws continue

The first assigned-window inventory returned only source37 and local36. A fresh
source snapshot verified the existing complete EN document, motion on, two
Enable sound controls and closed MENU. Actual source focus/visibility were true.
Viewport stayed **2544×1392 CSS/DPR1**, outer2654×1502 at(−47,−5), throughout.
No OS focus/input, resize or emulation was used; no independent XID check is
claimed.

Local initially retained the older document's timeOrigin1793126361054. It was
selected and **force-loaded at `/en`** before any accepted probe. Its new
timeOrigin is1793127842149. The ready, non-disabled, non-inert **QUIET** button
received an actual MCP click. Entry then reached complete, fonts loaded, scene,
environment and story boot ready. The real inline flight payload and final
independent flight extraction both contain **18fx0S1mZziyiyCZ4Cao4**. An initial
`__next_f` global lookup returned no data; it was not used as a build receipt.
The public source retained timeOrigin1793126360410 and reports flight build
UDyhriRH8KNgLRogNiQlA. Document histories and absolute shader phases are unequal.

Each page was positioned at **native15270**, allowed to settle to source151.28 /
local151.2819, then received pointer input at viewport**(1480,550)** and an actual
unintercepted click on the persistent MENU. Native y and story stayed fixed
through the uninterrupted quiet-tail portion. The pointer was not moved again
while observing that portion.

First continuous menu-open foreground observation, before selecting another tab:

- **Source:**819 natural default draws over37,945ms;
  uploaded `uTime`1305.498046875→1343.22705078125, **+37.72900390625s**.
- **Local:**376 natural default draws over15,731ms;
  uploaded `uTime`90.21104431152344→105.88152313232422, **+15.670478820800781s**.

These are within-document advances, not absolute phase matches or presented FPS.
The previous local0-time/0-draw freeze is absent. All observed menu-open field
draws upload **uQuiet=1, uMotion=0, uPress=0**:543 source and542 local field calls
in this initial uninterrupted portion. The field continues through its existing
tail, with last field calls at about**5,995ms source /5,981ms local** after the
first observed menu-open default draw, then the simulation reports rest while
the default material keeps drawing.

Natural draw counts in the first0–1.5s are source89/local91; in1.5–6s,
source91/local90; in6–7.5s,30 each. Initial intervals are mainly16–18ms; both
the later tail and idle intervals are mainly49–51ms in this browser. The cached
source contract and local lines132–134 request a normal tail, then30Hz timer,
then24Hz idle timer. **Those requested timer rates are not claimed as measured
draw or presentation rates.** Field substeps are counted separately.

The second local menu/close control retains the same canvas/context and the
same two field framebuffer objects and attachment textures throughout before,
open and subsequent moving/stop draws. Source retains its corresponding pair.
Only those two field targets and their two sampled state textures occur in each
probe. No field contents were read back, so this is allocation/history-lifetime
evidence, not a pixel identity certificate. Local menu-open object/portrait
native draw count is0 in both controls: the background change does not wake
those canvases. Source also submits some object draws with unchanged visualTime
151.282 while its menu is open; universal source object-loop suspension is not
asserted.

Local code now retains menu eligibility at64 and wakes at185–190, while97/105/111
continue suppressing press/excitation and setting quiet. No renderer call,
invalidation, shader/uniform write or forced draw was made by this review.
An opaque MENU and scalar uniforms do not prove absence or presence of a flash.

## Hidden-document control uses the two original tabs

Selecting source37 while local's menu remained open produced actual local
blur/visibilitychange, then selecting local36 produced actual visibility/focus
return. Local was hidden for**49,811ms**. It has **zero default draws while
hidden**; its last-before/first-after uploaded times are
106.16388702392578→106.18054962158203, **+0.01666259765625s**, not49.8s.
Quiet menu draws then continue with the same canvas/context. Focus changes and
visibility events are retained separately; the short unfocused-but-visible
transition is not reported as continuously focused.

The corresponding actual source tab selection hid source for19,894ms. One
already-idle default draw appears while hidden with **unchanged uTime**
1343.509033203125; first return uploads1343.5589599609375. Thus source does not
add the hidden interval either, but it is not claimed to have zero hidden native
submissions. Neither page loses its background context or loads a resource in
these probes. Visibility was never forged or overridden.

## Current phase and zero-duplicate controls pass their narrower contract

The first local probe's90-second safety timeout restored its hooks at wall169804,
during the beginning of its close/reverse driver. Its driver continued to its
bounded end; later marks are present after the metadata stop. **That entire first
driver is excluded from phase acceptance**, including the short captured prefix.
Its prior uninterrupted menu and hidden intervals remain valid.

One separate local probe, in the same current document, completes the short
close/reverse control. The corresponding source probe completes it once. The
shared **6.5-second/135-target** plan uses unchanged R15 native environment
positions: a425ms quick reverse after the actual close click, a stop,1.5s forward,
a950ms stop,1.5s reverse, then a1.05s stop. All**135 corresponding immediate
post-input native positions match exactly**. No score, pose, progress, aspect,
stop, ease or app timeline was overwritten.

Actual background `uStage` is checked against the final published story in the
same `document.timeline.currentTime` bin, including a later same-bin publication:
`(1-cos(PI*clamp((story-84)/110)))/2`. Source tolerance is0.000075, local0.000001.
The1.5s forward window passes **source90/90, local90/90**; the1.5s reverse passes
**90/90 on both**. Forward-stop57/57 and final-stop63/63 pass on both. Maximum
local moving residual is below0.0000007. **Zero duplicate default-draw bins**
occur across all source1,963 draws, first-local1,328 draws and second-local611
draws, including menu/close, independent tail and journey ownership transitions.

The early closing interval is not an identical-pose certificate: both pages
restore native15270 between the synthetic scroll inputs, while source's
published story responds transiently (down to125.43) and local remains151.2819.
The shared later forward/reverse windows provide the changing-stage controls.
Every sampled shader still matches its own document's current final score;
this does not accept cross-document close-animation or scrub-phase parity.
Uniform reads may stall and these counts are not a new cadence benchmark.

Evidence: `source-natural.json`, `source-phase-driver.json`, `local-phase.json`,
`local-phase-driver-accepted.json`, `phase-plan.json`, `driver.function.js` and
`analysis.json`. `local-phase-driver.json` is the excluded first local driver.

## Small controls, cleanup and explicit release

Ordinary footer Enter was checked while actually focused/visible at native40569.
Source and local both pass word→resolving→to-logo→logo. Source's next Enter
passes clearing→to-word→word; local's next Enter returns to word. A preliminary
local resolving-only attempt was interrupted by tab selection and is excluded
from completion acceptance. No timing benchmark is claimed.

Both documents actually enter HOME reading mode and clamp to14102.5. Enter
does not activate the footer in reading: local stays word; source retains its
pre-existing to-word phase from that run's preceding logo history. These are
unequal starting states, not a word-to-word source/local certificate. Reading
MENU opens and closes through actual unintercepted visible hero/menu controls
at native0 on both pages. The small motion accessibility button is1px; strict
pointer attempts were intercepted, and synthetic Enter did not activate its
default click. The existing button was then activated through MCP's synthetic
click, which warned of interception; actual reading class/pressed state was
verified. Physical pointer access to that button is not certified. No AR or
reduced-material-clock probe was added. `controls.json` preserves the histories.

Each of the three probes delegates eight native WebGL2 methods with original
arguments, receiver, result and exceptions. Background default draws and field
targets are separate; the other existing contexts are only observed when they
naturally draw. Eight full descriptors restore **by identity** after every
probe, including its automatic timeout. All own RAFs, timers, lifecycle listeners,
MutationObservers and globals are stopped/disposed. Native RAF/cancel functions
are never wrapped. Final methods are native and no review global remains.

**EXPLICIT VAWZEN RELEASE: 2026-10-27T19:12:47.252Z.** The final inventory contains
only original tabs37/36; active tab37 is source, focused and visible. Local36 is
hidden/unfocused. Both are plain EN/native0/world0/story0, entry complete, fonts
loaded, motion on, reading off, audio Enable sound/pressed=false, menus closed,
wide2544×1392/DPR1 with the original outer geometry. Local scene/environment/boot
are ready and its flight build still matches the frozen candidate. Neither
document was reloaded for release. `release.json` preserves both final receipts.
No browser call follows release; all subsequent work is offline. The later
machine/profiler authorization was acknowledged without expanding this loan.
