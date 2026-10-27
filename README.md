# Gazzar clone

An ongoing faithful [Gazzar](https://www.thisisgazzar.com/en) clone using
Next.js App Router, Storio, and the custom scroll-interaction library.

The site retains Gazzar's identity: the same text, animations, logos, assets,
layouts, and routes. Bouthouri is only the directory name.

The setup reuses Artifact's motion/scene-loading infrastructure and TFM Site
Entry's server-first section architecture. The English and Arabic home now
include the identity entry, portrait, pinned glasses/sculpture journey, project
drawings, systems narrative, menu, footer and localized audio. The home is still
under visual and interaction review; full parity is not yet asserted. Follow
[the review status](docs/home-parity-status.md) and
[the broader clone checklist](docs/gazzar-clone.md). Additional route pages are
not implemented yet.

## Start

```sh
bun install --frozen-lockfile
bun dev
```

Open `http://localhost:3000`; `/` redirects to `/en`. `/ar` is rendered with
Arabic copy and `dir="rtl"` in its initial document. Copy `.env.example` to
`.env.local` and set the final `NEXT_PUBLIC_SITE_URL` before deployment.

## Validate

```sh
bun run check
bun run build
bun start
bun run test:ssr -- http://localhost:3000
```

`check` runs ESLint, generated Next route types, TypeScript, and unit tests.
The HTTP SSR audit checks readable HTML without executing scripts, both
languages, metadata/schema, redirects, 404s, and emitted JS/CSS assets.

## Structure

```text
src/app/[locale]/         Server routes, document, metadata
src/sections/landing/     Ordered server-rendered sections and local motion
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
- Lenis is imported only when smooth scrolling is allowed; the custom engine
  follows the resulting native scroll position. The maintained `lenis` package
  replaces Artifact's legacy `@studio-freight/lenis` import.
- Three.js and GLTF loading stay out of the root layout and initial route imports.
- Server HTML is available independently of heavy asset readiness. Reproduce
  Gazzar's entry/loading visuals as part of its experience; keep that UI separate
  from content delivery. No GSAP dependency.

Read [load priorities](docs/load-architecture.md), [SSR/CSR boundaries](docs/ssr-csr.md),
[file ownership](docs/code-splitter.md), [motion](docs/animations.md),
[Storio](docs/store.md), and [asset rules](docs/assets.md).
