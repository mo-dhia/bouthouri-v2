# Reading object lifetime

This is the separate retained-environment pass after R7 scene commit2a1f485 and
parent reading-UI commitff4d360. It changes only2-story and focused scene tests.
Parent DOM score/fitting/chrome, navigation, scrub and the R7 demand/camera/veil
rules retain their existing owners. Root owns production build and fresh R8.

## Source proof and owned lifetime

Cached source2gz902oulp4x8.js keeps its Canvas unkeyed across `reduced` changes.
The glasses component persists; `!reduced` removes the sculpture/type children.
Drei's256 Environment effect depends on its children array, so the prop rerender
recaptures its existing raw cube even when bounds are unchanged. The private512
environment uses a separate scene, but the same renderer's native CubeUV cache.

Live source reading→motion40→reading retains the exact same canvas, WebGL context,
renderer, scene, Lens_L material, raw256 texture and derived CubeUV target
identities (probe ids1/2/3/4/5/6/7). Raw256 pmremVersion advances11→14→19; reading
camera is[0,.12,9.8]. The private512 identity changes36→47 on motion return.
Quiet same-size resize leaves raw256 version19 unchanged; actual1912→1910→1912
changes it19→21→23 with all retained identities unchanged. These observations
confirm object lifetime rather than inferring it only from source JSX.

`createStoryScene(stage, options)` returns `setStaticMode(enabled)` and `dispose`.
`mountStoryScene` remains a cleanup-only compatibility adapter. The gate keeps
the controller through mode changes; HOME unmount or latched failure disposes it.
It retains canvas, renderer, camera, glasses clone/materials, raw256 and the
renderer-owned cached256/scratch. No atlas is read back or restored by the app.

Reading entry cancels object RAF, pointer pulls, refresh/idle work and disposes
the motion model, SDF graph, LTC reference and private512 target. **r180's
render-target/version CubeUV branch does not register its texture-dispose
listener.** `story-atlas-ownership.ts` therefore resolves only our private512
materials' native `materialProperties.envMap`, validates its CubeUV mapping and
`Texture.renderTarget` owner/back-reference, and disposes that derived target
once before material disposal. It never disposes256, a shared scratch target or
the renderer. Raw texture disposal alone is insufficient. A finite mode capture uses
the existing256 cube; hidden/offscreen mode changes keep this work pending until
the canvas becomes eligible. Intersection/geometry activity observes the actual
canvas host, because the unpinned reading stage is the entire reading document.
Quiet geometry changes still use the existing50ms full8bounds measure; identical
bounds do not capture. Reading has no settled object animation loop.

A genuine initial static controller requests only glasses, creates only the
six-face256 studio, and does not call logo/font/LTC loaders or create512. Returning
to motion lazily attaches those resources to the retained renderer. Mode and
generation checks reject obsolete async results; motion upgrades are serialized
until stale layouts release their graph. Adoption resizes both sculpture routes
and type to the current aspect/size after font work. Initial stale font errors
cannot latch a later reading mode. Current-generation failures still enter the
shared HOME failure latch. Mode toggles cannot retry a failed HOME.

`story-boot.ts` separates base ownership/readiness from optional motion waits.
Normal cold motion retains assets→base→type→warm ordering. Switching to reading
can mount and warm the glasses base immediately, without waiting for obsolete
logo/LTC/font requests. `story-motion-assets.ts` releases fulfilled resources on
abort and disposes later results on arrival. Font preparation and layout waits
are abortable too; shared byte/font caches continue independently of the cancelled
mount. A new motion mode can start its latest boot while the old waits unwind.

Mode timeline recreation resets the camera/veil history samplers, not the native
scroll position. Synchronous shared CPU sampling, the >=306 direct origin and
the one demand GPU RAF remain. Internal reading time0/opening26/emergence1/idle0
is distinct from the parent's DOM0/0/0; the scene never writes parent attributes.

## Bounded live verification

Actual1912×1009 CSS/DPR1, original source5/local11 only, dev3000 changed code.
At native1009, reading pixels use source/local settled static poses. All metrics
are8-bit RGB MAE/p99; these are sampled controls, not whole-home certification.

| Control | Crop | MAE | p99 |
| --- | --- | ---: | ---: |
| EN foreground40→reading |600,330..1300,680|.066113|1|
| EN foreground40→reading |200,180..1500,800|.057874|1|
| EN hidden-entry sharp40→reading |200,180..1500,800|.155047|1|
| AR foreground40→reading |600,330..1300,680|.160207|1|
| AR foreground40→reading |200,180..1500,800|.168020|1|
| Motion return60 after reading |200,180..1500,800|.060508|1|

Source/local return60 camera Z is2.71067607/2.71065780. The source and local keep
their native object identities on mode return. EN/AR reading document heights
are12446/12866, with parent DOM scores0 and static canvas pose0. Parent independently
rechecked the EN foreground PNG metrics. Both preceding foreground broad and
hidden-entry sharp histories converge to the source's retained static field.

Local offscreen motion40→reading at native5263 records0captures while its canvas
is outside the viewport; native1009 flushes the pending finite work. Quiet
same-size resize records0captures; real2px changes preserve identities and update
raw256. The settled static scene contains glasses plus its two lights, one
object canvas, and0object draw calls during500ms. Seven successive real mode
control clicks preserve the same canvas/context, return to a ready motion scene
and show complete CLARITY174. Forced `WEBGL_lose_context` removes the canvas;
two later mode toggles retain the failed flag and0canvases. A fresh assignment
can boot again. Resource fixtures additionally exercise fresh256-only creation,
independent private512 acquisition/disposal, stable glasses identity and
idempotent disposal.

The follow-up native GPU check verified private1536×2048 CubeUV target ownership,
then observed exactly one derived-target disposal per activated motion→reading
cycle, three times. Renderer texture counts remain13motion→7reading→13→7→13→7;
canvas/context/glasses256/cache identities remain unchanged. The native regression
executes the installed WebGLCubeUVMaps version branch (only PMREM allocation is
stubbed), demonstrates that raw texture disposal alone emits0derived disposals,
then verifies the owner-aware helper emits1 while preserving256 and scratch.
The post-fix repeated-mode static PNG remains MAE.066141/p99=1 for the lens crop
and.057917/p99=1 for the broader crop against the earlier source static capture;
the different preceding40/174/resize histories are explicitly indexed.

Local-only controlled pending-work tests held actual Cairo scene font/coverage
fetch resolutions on an initial AR mount at typography/loading, then clicked
the real reading control: scene ready within350ms with both responses still held.
A separate initial EN mount held the actual logo GLTF parse completion at
models/loading; the same control reached ready within350ms while it remained held.
Both old waits were released after cancellation, did not re-adopt a stale graph,
and a later motion upgrade reached ready174. Wrappers were restored and removed.
These are explicitly instrumented local cancellation tests, not source or OS
acceptance. `pending-font-quiet.json`, `pending-logo-quiet.json` and
`native-gpu-disposal.json` retain their states. Unit regressions exercise pending
logo/font→reading, late-resource disposal and unchanged normal warm ordering.

Fresh physical OS-reduced startup is **unavailable** through the current Vaelix
API. No matchMedia, storage, clock or OS setting was forged. Source's real control
tests begin from an existing motion Canvas. Fresh-static loader ownership is
covered by the implementation branch and studio resource fixture; it is not
claimed as live source OS/network acceptance. Rapid clicks use warm assets;
separate controlled initial-font/logo holds cover the two formerly blocked
readiness branches. This is not an exhaustive network/worker failure matrix.

## R7 cadence branch retained for independent adjudication

The two exact R7 controls remain separate from reading acceptance. One local
repeat's first256 conversion was69.7124/Z.213339/dark clear alpha0; another was
70.8024/Z3.855773/white alpha.5. The source also naturally skipped early visible
poses: an actual draw trace76.644708(hidden,Z10)→69.118328(visible,Z.566987)
→62.744179 converted256 at69.12 under dark/alpha0. No artificial workload or
forced conversion was introduced. Thus white/broad is not a universal source
result of the exact native-scroll sequence.

The source and local raw environments still use the native renderer cache;
logical history and actual draw cadence are distinct. The app does not force a
field, frame rate, target score or PMREM clear state. Parent480ms scrub and R7
samplers remain unchanged. Full dark-image equality is **not claimed**: settled
camera Y differs(.0750286 source/.0696682 local), with idle/pointer phase also
requiring provenance. Current dark source/local crop600,330..1300,680 has
MAE.7593/p99=8; broader200,180..1500,800 is1.07239/p99=17. Two lens interiors
30,300..160,440 and850,330..1100,570 are.10427/.12529,p99=1, while the far right
interior is.42146/p99=2. These narrow results do not supersede broader errors.

The white-field comparison uses an explicitly historical source white capture
from the earlier R7 pass against the current local white repeat: broadcrop
MAE.80713/p99=9; the three lens interiors are.21678/.43198/.21506,p99=1. This is
attributed historical control evidence, not a new source-white run. R8 must grade
actual branch, pose and capture history; neither a universal-white expectation
nor generic p99=1/full-parity acceptance follows.

After the two lifecycle P2 corrections, a further cold exact-sequence local
control converted256 at69.6696/Z.239491/dark alpha0, retaining the same native
conversion order and dark branch. Its raw states/PNG are preserved separately
as `local-r7-post-p2.json` and `reading-r7-local-post-p2…png`. No universal branch
or identical pose claim is inferred from that additional run.

An earlier source probe installation had a syntax error before it executed. The
native resize/direct174/return sequence nevertheless completed without that
probe before its final read failed. Its unprobed dark screenshot is retained,
but no first-visible/conversion metadata is claimed for it. The subsequent
successful trace above supplies that metadata. All intermediate failures and
white/dark PNGs remain in the index.

## Evidence and handoff

Canonical files under `/tmp/gazzar-reading-scene/`: `identities.json`,
`source-foreground-order.json`, `source-hidden-order.json`,
`local-r7-repeat1.json`, `local-r7-repeat2.json`, `source-r7-repeat2.json`,
`r7-branch-metrics.json`, `evidence.json`, `metrics.json` and copied PNGs.
P2 follow-up files include `native-gpu-disposal.json`, `pending-font-quiet.json`,
`pending-logo-quiet.json` and `p2-pixel-check.json`.
No original bundles, R3F/GSAP dependencies, snapshot textures, universal512 warmup
or parent journey/navigation changes are shipped. Root owns full check/build/SSR
and production/R8 acceptance. Scoped lint, plain TypeScript and focused scene
tests pass (12tests/478assertions), independently without typegen or server
management.

After the P2 fixes and final scoped checks, the original pair is explicitly
RELEASED: EN/y0,1912×1009/DPR1, entry complete, motion enabled, audio off, menus
closed. All fetch/GLTF/renderer/prototype probes were restored and deleted;
fresh local assignment cleared the research module cache. No pending browser
calls or further scene browser use after release. `release.json` records the
state; source's own host width100% is retained and local QA width overrides are
absent. Implementation is frozen for root review/check/build/R8.
