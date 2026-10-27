# Home visual layer

The integration, measured clock/camera, startup states, resource ownership,
validation evidence and remaining fidelity gaps are maintained in
[`docs/home-scene-contract.md`](../../../../docs/home-scene-contract.md).

`story-scene-gate.tsx` is a null-content client boundary. The server section
continues to own all text, routes, SVGs and fallback markup. The gate imports
the fixed background during idle time and the object scene near its viewport;
the shared boot slot serializes the object startup. Its per-HOME controller handle
retains renderer/glasses/raw256 across mode changes and releases motion-only
attachments in reading mode. A fresh quiet/reduced mount loads glasses only;
both paths render one initial pose without an object idle loop. Detailed live
identity, resource, pixel and coverage evidence is in [story-reading.doc.md](story-reading.doc.md).
An object failure latches the shared HOME reading fallback until route unmount.

`story-score.ts` and `story-paths.ts` contain the recovered numerical data.
`story-camera-history.ts` adds only the source's future-camera-start initialization
on its 200ms resize refresh and restored first frame; it does not alter the pure
sampler. Shared frames are recorded before models/fonts/GPU boot completes.
`story-optical-history.ts` preserves the separate 74..82 veil tween's initialized
FROM and reverse plateau. Parent clock events sample both histories immediately;
the scene's sole demand RAF owns GPU draws, coalescing scroll/resize/idle/pointer
requests. No alternate-native-frame frequency is promised: callback ordering and
ongoing interaction affect which shared frame a draw consumes. The direct CPU
work-origin handoff after306 and finite warm/static draws remain separate.

`story-hero-handoff.ts` keeps glasses emergence on the **displayed hero-world**
clock. It reads `chapterPresence` from `gazzar:hero-world` and invalidates the
scene's existing demand RAF when that value changes. Journey events still own
story time but cannot replace emergence, even when their openingTime is0 or26.
Cold/late scene mounts read the full-precision current pose from the current hero
element; before a publisher exists they initialize from current native geometry.
The handoff remains live while GPU/font assets load and while retained reading
mode is active. Re-enabling motion refreshes it before history sampling. Every
live object frame supplies an explicit numeric emergence, including0; the
standalone authored sampler's opening-time fallback cannot re-enter that path.
Reading renders internal time0, openingTime26, emergence1 and idle0 explicitly.
Cleanup removes the hero event listener with the scene's existing ownership.
No capture, optical history, asset generation or renderer lifetime is changed.

R10 source fixtures cover .81 emergence entry/exit, nonlinear opening holds,
different EN/AR trigger extents, delayed journey frames and late subscriptions.
They verify the clock contract; full continuous visual parity remains the
parent's integrated video review rather than an inference from numerical scores.
`story-glasses.ts`, `story-shadow.ts`, `story-logo.ts` and `story-type.ts` own
their specific visual responsibilities. `story-assets.ts` caches network bytes
only, parses a fresh model graph per mount and clones materials before mutation.
Geometry, materials, embedded image bitmaps, environment render targets,
silhouette targets, LTC data textures, per-mount SDF geometry/materials, renderers,
pointer capture, listeners, observers and scheduled work are released by cleanup.
Troika owns its shared font/atlas/worker cache; scene mounts do not mutate it.

`story-text.ts` uses the approved focused `troika-three-text` 0.52.4 renderer for
source-equivalent shaping and glyph-bound fits. Original WOFF files and coverage
tables are local; all scene characters are checked before optional worker layout.
Blocked text boot falls back to server copy. `story-origin.ts` is a separate
numeric-only API so the parent can start its work path before any GPU/font boot.
`story-origin.generate.mjs` regenerates its four metric rows offline, and the
focused tests compare six EN/AR desktop/mobile/short-stage source fixtures.

`story-environment-shaders.ts` contains the pressure-field and neutral studio
surface shaders ported from the public reference; the field and native input
controllers are separate from the story object's render loop. The background
continues through all 714 story units without taking over native systems paths
or the shell-owned footer material. Visible ambient drift continues at its
intentional source cadence; hidden/offscreen/menu states stop all scheduled work.
The retained background controller, source allocation keys and focused offline
history checks are documented in [story-background.doc.md](story-background.doc.md).
`story-material-protection.ts` combines independent portrait/footer protection
publishers using the explicit window event documented in the scene contract.

The reflection studios retain raw 256px/512px cubes on the renderer's native
shared r180 CubeUV cache. `story-environment-lifecycle.ts` compares all eight
canvas DOMRect coordinates, including position-only pin changes. Identical
bounds do not recapture. The 512px cache activates after entry readiness, processing
an earlier pending measure first. Thus a hidden entry tail can retain sharp
reflections while a foreground fresh assignment or reload becomes broad; no
navigation-type condition is used. The 50ms scroll measure and idle activation
are owned/cancelled separately from the 200ms camera-history refresh.
The softbox `DataTexture` must stay explicitly **sRGB**, matching source
R3F's automatic material-map conversion. Linear decoding and independent PMREM
generators were the two causes of R4-01. Lens constants remain unchanged.
The scene contract records exact sampled GPU fields and optical crops, R6/R7
event-order traces, preserved failed attempts and remaining validation boundaries.
Focused checks pass12 tests/478 assertions. R7 independently passes the R6 reload
and complete-CLARITY cold/remount controls. The new R7 capture/veil/demand correction
has two measured dev repeats; root owns production build and fresh R8 acceptance.
Parent ff4d360 fixes the reading opening/chrome. The retained-environment change
now has EN/AR p99=1 reading captures in dev. Fresh OS reading remains unavailable
to this browser API; static resource fixtures and retained-mode controls are
distinguished. Root owns production build and independent acceptance.

Original assets are local at `/assets/models/` and `/assets/textures/`:

- `glasses-folded.glb`: 431,196 bytes.
- `logo-finished-components.glb`: 573,944 bytes, embedded microroughness PNG.
- `logo-lighting-r180.bin`: 196,608 bytes, four r180 area-light lookup tables.
- `questrial-studio.woff`: 52,240 bytes.
- `cairo-studio.woff`: 42,688 bytes.

Source rendering references:

- [Glasses and camera renderer](https://www.thisisgazzar.com/_next/static/immutable/chunks/2kidhwora8ehx.js).
- [Sculpture paths, lights and foreground type](https://www.thisisgazzar.com/_next/static/immutable/chunks/369vzr25ag57n.js).
- [Visible global pressure-field material](https://www.thisisgazzar.com/_next/static/immutable/chunks/1nvdbh89vm0tk.js).
- [Opening/input clock and story data](https://www.thisisgazzar.com/_next/static/immutable/chunks/0or6--g23od4n.js).
- [Story light/meaning score extension](https://www.thisisgazzar.com/_next/static/immutable/chunks/11dg_viff64mz.js).

No GSAP, R3F, Drei or original application bundle is shipped. The optional graph
uses plain Three r180, its native GLTF loader and focused Troika SDF text only.
