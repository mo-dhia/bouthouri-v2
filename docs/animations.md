# Custom animation workflow

The only scroll animation engine is `src/lib/scrollInteraction/`. Lenis changes
scroll feel; it does not replace that engine. Storio holds UI preferences.

The hero is a complete small integration: its content is a Server Component,
its gate returns null, and `hero.animate.ts` is imported only near the section.
Its baseline marquee uses a compositor animation; custom scroll progress pauses
it beyond the hero. Exact entry, pointer, and scroll choreography are still
pending. Do not present this baseline as the completed reference animation.

Use one scheduler per path. Prefer the core's default RAF batching. If a
controller must batch a larger scene transaction itself, create its trigger
with `useRAF: false`. Additional render frames needed for 3D easing are
intentional work, not a reason to add another progress-update batch.

Read [the library API](../src/lib/scrollInteraction/README.md) before choosing
start/end tuples. `v` contains the values you configured, not automatically
percentages. Match Gazzar's measured progress, timing, text choreography, pin
geometry, pointer response, and mobile alternatives rather than generic fades.

`createScrollMarquee.ts`, imported from Site Entry, is available for duplicated
typography tracks. It supports velocity coupling, pause/drag/wheel behavior,
viewport/document visibility, and reduced motion. Load it only from a local
controller. Do not use its defaults as a substitute for matching Gazzar.

Geometry reads can still force layout despite RAF batching. Measure on refresh,
separate reads and writes, avoid unchanged inline writes, and profile real
rendering before assuming interpolation math is the bottleneck.

Quiet view and `prefers-reduced-motion` remove optional controllers and restore
their inline styles. Server text stays visible in every mode. Renderers and
audio require their own visibility/user-intent policies as described in the
load architecture. No fixed FPS or percentage improvement is guaranteed.
