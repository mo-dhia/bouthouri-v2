# Bouthouri portfolio

A [Gazzar](https://www.thisisgazzar.com/en) design and motion reimplementation
using Next.js App Router, Storio, and the custom scroll-interaction library.

The approved identity is Med D. Bouthouri / محمد ضياء بوثوري, with BOUTHOURI,
contact@bouthouri.co, the approved portrait and Tunis local time. Gazzar references
document design and motion provenance.

The setup reuses Artifact's motion/scene-loading infrastructure and TFM Site
Entry's server-first section architecture. The English and Arabic home now
include the identity entry, portrait, pinned glasses/sculpture journey, project
drawings, systems narrative, menu, footer and localized audio. Vision, Services
and Contact also have complete English/Arabic server content and deferred
interactions. Projects remains excluded. Follow [HOME review status](docs/home-parity-status.md)
and [editorial verification status](docs/editorial-parity-status.md) for the
tested scope and retained comparison limits.

## Start

```sh
bun install --frozen-lockfile
bun dev
```

Open `http://localhost:3000`; `/` redirects to `/en`. `/ar` is rendered with
Arabic copy and `dir="rtl"` in its initial document. Copy `.env.example` to
`.env.local` and set the final `NEXT_PUBLIC_SITE_URL` before deployment.

For access from another machine, put the server's LAN hostname/IP in the ignored
`.env.development.local` file, then start or restart development:

```dotenv
DEV_ALLOWED_ORIGINS=192.168.1.105
```

Use your own hostname, without a scheme or port. Next's development-only endpoints
reject unlisted origins. See [LAN development](docs/lan-development.md) for the
startup failure this prevents. Contact delivery also requires the mail settings
in `.env.example`; missing credentials produce an honest unavailable response.

## Validate

```sh
bun run check
bun run build
bun run start -- --hostname 0.0.0.0 --port 3100
bun run test:ssr -- http://localhost:3100
```

`check` runs ESLint, generated Next route types, TypeScript, architecture and unit tests.
The HTTP SSR audit checks readable HTML without executing scripts, both
languages, metadata/schema, redirects, 404s, and emitted JS/CSS assets.

## Structure

```text
src/app/[locale]/         Server routes, document, metadata
src/sections/landing/     Ordered server-rendered sections and local motion
src/sections/{vision,services,contact}/ Editorial server content and owned controllers
src/components/          Shared shell, client controls, SEO, image helper
src/i18n/                Server-only EN/AR dictionaries and locale definitions
src/store/               Storio viewport and UI state
src/lib/scrollInteraction/ Custom scroll engine and animation utilities
src/lib/scene/           Deferred scene activation, boot gate, GLTF cache
public/assets/           Fonts, images, models, textures, and sounds
patches/                 Reproducible Storio compatibility patch
tests/                   Store, scroll, shared-clock and navigation regressions
docs/                    Maintained architecture and clone implementation notes
assistant/               Local working guides; intentionally untracked
```

## Loading contract

- Text and semantic structure render on the server, including below the fold.
- Tiny client islands attach interactions after HTML exists.
- `useDeferredMotion` loads section-owned `.animate.ts` modules near the viewport.
- Quiet reading and OS reduced-motion preferences remove pinning and continuous
  scene motion while retaining static visuals and complete server content.
- Native scrolling feeds the custom engine; no wheel smoother or Lenis runtime
  is installed.
- Desktop 1920×1080, tablet 768×1024 and mobile 412×915 compositions scale by
  width, including SVG, Canvas and Three framing. Physical height remains for
  visibility, scroll limits and backing buffers.
- Three.js and GLTF loading stay out of the root layout and initial route imports.
- Server HTML is available independently of heavy asset readiness. Reproduce
  Gazzar's entry/loading visuals as part of its experience; keep that UI separate
  from content delivery. No GSAP dependency.

Read [load priorities](docs/load-architecture.md), [SSR/CSR boundaries](docs/ssr-csr.md),
[file ownership](docs/code-splitter.md), [motion](docs/animations.md),
[Storio](docs/store.md), and [asset rules](docs/assets.md).
