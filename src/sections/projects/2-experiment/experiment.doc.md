# Local interaction studies

Nine EN/AR detail routes live at `/[locale]/projects/[slug]`. The original
Carter Ogunsola Lab studies are credited in each page’s server-rendered Notes.
Reference media is retained at the user’s request; it is not represented as
Bouthouri client work. See `public/assets/projects/experiments/README.md` and its
hash manifest for media provenance.

## Boundaries and ownership

`experiment.tsx` owns the heading, instructions, poster, Notes, Tune controls and
previous/grid/next navigation on the server. The route supplies metadata,
canonical and exact translated detail URLs. All eighteen pages prerender.
The null gate waits for viewport/scene-boot eligibility, dynamically imports the
host, and rejects disconnected or canceled imports. Each selected child is a
separate renderer chunk. No renderer, Three module, microphone, speech model,
worker or audio asset belongs to the initial content graph.

The host registers one connected physical route owner. Geometry/entry can be
ready while assets are pending; successful first presentation separately
releases graphics readiness. A missing chunk, failed draw/model or lost context
restores the persistent poster and useful Notes/navigation. Context failures
inside the experiment do not touch the shared background. Root generations
reject late renderer failures as well as late import adoption.

One scene clock owns child ticks, one-shot frames and finite tracks. It pauses
for document visibility, menu and offscreen state. Child renderers retain their
own spring, inertia and shader math. Native finite tracks provide the source’s
specific easing/delays; no GSAP, Flip, CustomEase or Lenis runtime is installed.
Gallery layout inversion flattens the source’s axis-aligned projected rectangles
into a temporary layer, retains its 1.4s ease and distance-based stagger, then
restores real parents/styles. Interruption snapshots precede cancellation.

Each child returns cleanup. The environment additionally releases its frame
queue, finite tracks, resize observers, timers, audio elements, workers and
owned Web Animations. Async image/model/capture completions check current
ownership before publishing; original replaced GLTF materials/textures and late
models are disposed. Shared field resources remain with the locale layout.

## Fixed design cameras

Source viewport geometry was measured at the agreed references:

| Reference | Rounded renderer camera | Stage inset/top |
| --- | --- | --- |
| 1920×1080 | 1858×946 | 30 / 102 |
| 768×1024 | 724×899 | 21.15 / 102 |
| 412×915 | 377×817 | 16.4667 / 80 |

These inner cameras act like SVG viewBoxes. DOM writes use `--experiment-unit`;
canvas/GL geometry stays in reference pixels, with one outer width scale and a
scaled backing density. Pointer coordinates and measured rectangles invert that
scale once. Height changes affect visibility/cropping and scroll reachability,
not the composition or camera. Subpixel CSS borders differ from rounded canvas
client sizes by less than half a reference pixel. No `vh` composition is used.

Source fonts/theme/header/config presentation are adapted to local Questrial,
Cairo, dark field, warm ink, borders and accessible Notes/Tune. The original
code editor links to its source rather than becoming another shipped editor.
Paste Up tabs are centered; mobile Three subject controls sit below Notes/Tune
so all are reachable. Those are deliberate design integrations.

## Intent and capability limits

Vocal Orb requests a microphone only from its explicit button. Permission
results arriving after pause, departure or a superseding request stop all
tracks. Hidden/menu state stops capture; resuming does not silently reacquire.
Speech/voice/mood downloads remain explicit opt-ins and run on-device. Initial
rendering starts no worker or model download. HTTPS and browser support are
required. Real microphone/audio surroundings were not captured during review.

Live Cursors uses an owned BroadcastChannel with actual peer tabs, bounded
messages, direction, source pointer shapes/smoothing and leave/expiry cleanup.
It does not fabricate remote visitors or connect to the reference’s service.
Cross-device presence remains unavailable until an owned realtime endpoint is
configured; the server Notes/hint accurately say another tab.

## Validation

See `docs/projects-experiments-review.md` for the dated production checks,
native control recordings, viewport controls, exclusions and deployment.
Tests cover host cancellation/readiness/generation/failure, scene-clock pause
and ownership, finite source curves, layout inversion interruption, microphone
late completion and the existing grid input/media lifecycle. Browser evidence
is finite; neither encoded frame rate nor a few reference poses certify 60Hz
presentation or every hardware/browser combination.
