# Load architecture

Adapted from Artifact's SSR/lazy-motion implementation and TFM Site Entry's
`assistant/load-architecture.md`. The target is the complete Gazzar experience;
these rules control when its implementation loads, not how its design is changed.

## P0 — Document and discovery

`src/app/[locale]/layout.tsx` owns language/direction, critical CSS, metadata,
canonical/alternate links, and server-rendered JSON-LD. `robots.ts` and
`sitemap.ts` describe real implemented routes. Fonts must be local or self-hosted
with `font-display: swap`; preload only files needed by the current language.
Keep Three, audio engines, animation controllers, and embeds out of P0.

## P1 — Content HTML

Pages compose server sections from server-only locale dictionaries and prepared
data. Headings, body copy, navigation, links, work cards, image markup, accessible
descriptions, and footer content belong in the first HTML response. Below-fold
placement is not a reason to fetch or render text only on the client.

Static portfolio content is prerendered at build time. Request-time SSR is
reserved for genuinely request-dependent content; forcing it does not add SEO
value to an otherwise static page.

Reproduce Gazzar's visible entry/loading experience when implementing its motion.
That visual sequence does not require moving semantic content into a client-only
route or making its HTML wait for models, sound, and shader compilation. Preserve
an accessible no-JS/reduced-motion path through the entry experience.

## P2 — Small interaction islands

The initializer synchronizes viewport dimensions. Menu, quiet-view, sound, and
similar controls hydrate as small leaves with stable server markup. Read only
the required Storio slice. Do not move a whole section into a client module to
make one button interactive.

Keep scrolling native, matching Gazzar. The pinned journey owns its measured
animation scrub; adding a wheel smoother before that scrub changes input distance,
response, and stopping behavior. Quiet view and OS reduced motion change the
journey layout without replacing the browser's scrolling policy.

## P3 — Section motion

The server section renders its complete contents and a null-rendering client
gate. That gate uses `useDeferredMotion` to observe the actual, unclipped server
section and import its `.animate.ts` controller near the viewport. The controller
receives the element, registers the custom engine, and returns cleanup.

- Keep the import function at module scope so ordinary renders do not reload motion.
- One RAF owner: core batching with synchronous callbacks, or `useRAF: false`
  when a controller deliberately owns its RAF. Avoid nesting default batches.
- Cache geometry when layout changes; keep reads ahead of writes.
- Failure to fetch a controller must leave readable content and navigation.
- Re-enabling motion must reinitialize from the current scroll position.
- Do not initialize SSR text with hidden opacity just to await an animation.

## P4 — Background prewarming

Prewarm nearby assets and optional scenes after visible content and section
chunks have priority. Reuse browser image caching and dedupe model promises.
Abort/retry background fetches when the implementation actually supports it.
There is no CMS in this project; Site Entry's CMS/Edge Config clients and
microfrontend infrastructure are intentionally not dependencies.

`startScenePreboot` is available for a future measured idle warmup. It is not
called by the initial document. Avoid warming every model and texture merely
because the browser became idle once.

## P5 — Heavy runtime and user-intent features

Three.js scenes, video players, interactive models, and audio are owned by the
section that needs them. Use a stable SSR poster or reserved aspect-ratio box
while they load. `useSceneActivation` separates near-viewport mounting from actual
on-screen activity; `useSceneBootSlot` serializes scene startup.

- Render on demand; stop when settled, offscreen, or the tab is hidden.
- Bound pixel ratio and handle WebGL/context failures with the static fallback.
- Clone shared model scenes before mutating; dispose owned GPU resources on teardown.
- Respect quiet/reduced motion. Audio begins only after the reader enables it.
- Root-level dependencies must not import the heavy scene graph transitively.

## Reference-specific caveats

Gazzar's pinned 3D story and typography should retain their measured sequencing.
Do not replace them with Site Entry's generic reveal/stagger defaults. Pinning
and sticky ownership stay in the section; the progress engine does not promise
GSAP's pin/timeline API.

Observe an unclipped anchor. An element inside an initially clipped reveal can
have zero intersection and never load. Reserve image/model geometry to avoid
layout shifts. `content-visibility` requires measured intrinsic sizes and must
not be added around pinned/sticky scenes indiscriminately.

## Verification

1. Audit raw response HTML after excluding scripts and serialized Flight payloads.
2. Test initial content with JS disabled and with animation chunks blocked.
3. Check locale direction before hydration and after navigation.
4. Check native, smooth, quiet, and reduced-motion scrolling.
5. Test cold content availability, first scene activation, and repeat scrolling separately.
6. Compare reference/local at matching viewport, DPR, section progress, and cache state.
7. RAF spacing is not presented-frame FPS or isolated engine cost. Avoid ranking
   libraries from whole-site samples with different assets and load architectures.
8. Run production SSR/asset checks; development mode cannot validate prefetch costs.
