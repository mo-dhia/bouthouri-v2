# Gazzar clone project rules

- Foundation: the accepted Gazzar HOME clone, including Arabic, uses Storio and the custom scroll engine. The user began rebranding on 2026-10-28: use Med D. Bouthouri / محمد ضياء بوثوري, BOUTHOURI, contact@bouthouri.co and the approved portrait. Keep the established visual style, layout, spacing and animation behavior while applying explicitly requested identity changes. Historical Gazzar references document provenance. Do not introduce GSAP or generic replacement effects.
- This is a Next.js App Router project. Keep route content, headings, navigation, images, and structured data server-rendered. Prefer static prerendering for static content.
- Read `docs/load-architecture.md` and `docs/code-splitter.md` before changing boundaries or loading. They adapt the useful patterns from Artifact and TFM Site Entry to this project.
- Keep sections under `src/sections/<route>/<order>-<name>/`; shared shell and controls belong under `src/components/`.
- Colocate `.tsx`, `.logic.ts`, `.animate.ts`, `.module.css`, and `.doc.md` files when they have real responsibilities. Animation gates return no visible content.
- Lazy-load controllers and heavy runtimes, not the copy. Preserve useful HTML with JavaScript disabled, reduced motion enabled, or a failed enhancement chunk.
- Keep animation progress outside React state. Choose one RAF owner per update path. Clean up registrations, observers, timers, renderers, and inline styles.
- Use the patched Storio package in `patches/`; keep that patch reproducible through `bun install`.
- Match Gazzar's measured design and motion rather than applying generic reveal animations from the reference projects.
- Follow `assistant/styling.md` for the CSS formatting convention; prefer logical properties for Arabic. Inspect reference breakpoints before converting its measurements.
- Design sizing follows `docs/viewport-design.md`: desktop1920×1080 (>1024px), tablet768×1024 (>600px through1024px), mobile412×915 (through600px). Match Gazzar at those references, then scale each composition uniformly by width, including SVG/Canvas/Three text and framing. Width alone selects the profile and scale. Stages always fill the physical viewport height, like Gazzar; height enters only as proportions (live `svh`/`dvh`, aspect-ratio queries, `referenceStage`), never as a fixed design height. This supersedes the former fluid-breakpoint styling exception.
- Never stage or commit `assistant/`. Retain those local guides on disk; maintained, portable architecture docs live under `docs/`.
- Make small, coherent commits after validation. Use `component(type): description`, as explained in `assistant/commiter.md`.
- If adding `console.log`, stringify the logged value first.
- Validate with `bun run check`, `bun run build`, and `bun run test:ssr -- <running-production-url>` for loading/boundary changes.

## Browser MCP routing

- Honor the browser MCP the user names. Vaelix (`mcp__vaelix__*`) controls existing Ungoogled Chromium/Chrome; Vawzen and Veyra control Firefox/Zen.
- Do not substitute Firefox for an explicitly requested Vaelix session. If Vaelix tools are absent, a new Codex session is needed to load the configured server.
- Vaelix's stdio entry is `/home/jarvis/Documents/dev/assistant/mcp/chrome/vaelix/app/native-server/dist/mcp/mcp-server-stdio.js`; its extension reconnects through `vaelix-native-bridge.service` at `http://127.0.0.1:12308/mcp`. If the browser is closed, open Ungoogled Chromium and let the extension reconnect.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
