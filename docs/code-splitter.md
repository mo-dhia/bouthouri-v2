# Code splitting and ownership

Adapted from Site Entry's code-splitter/section-creator guides and Artifact's
component-owned `.logic.ts` and `.animate.ts` convention.

## Paths

- `src/app/[locale]`: short route/layout files, metadata, route composition.
- `src/sections/<route>/<order>-<section>`: feature-owned server sections.
- `src/components/layout`: shared header/footer shell.
- `src/components`: other genuinely shared controls, SEO, and image helpers.
- `src/lib`: reused runtime systems; `src/store`: Storio state only.
- `src/i18n`: server dictionaries; `src/config`: site/asset configuration.

New paths use lowercase kebab-case. Existing Artifact library entry points such
as `scrollInteraction/scrollTrigger.ts` retain their API paths for compatibility.
Choose `.logic.ts` consistently, rather than mixing it with `.func.ts`.

## A section's files

```text
1-hero/
  hero.tsx                    server markup and translated content
  hero.module.css             owned styling
  hero-animate-gate.tsx        tiny client leaf; renders null
  hero-animate-gate.logic.ts   viewport/motion eligibility and import boundary
  hero.animate.ts             imperative controller; returns cleanup
  hero.doc.md                 fidelity, ownership, loading and QA notes
```

Do not create empty files solely to satisfy this shape. Static sections need
only their view/style/data. A child with its own state or effects owns its own
logic file inside `components/<child>/`; do not collect all child behavior in
the parent's logic file.

## Import direction

Route → server section → tiny gate → dynamic controller → runtime.

Content and dictionaries must not be imported into the animation module just
to locate a DOM node. Give the section stable IDs/data attributes. Controls get
the minimum labels/serializable data as props. Heavy runtime imports remain
inside a section's deferred graph, never the root layout or initializer.

The persistent shell, hero and pin/navigation gates must also operate in
reading/restored states. Their colocated hooks dynamically import on mount;
`useDeferredMotion` is reserved for optional viewport-owned behavior. Scene
activation/boot slots and nested material imports defer heavy work separately.
See [the current scheduler map](animations.md).

## CSS and content

Use CSS Modules and one-line selector declarations with logical properties for
RTL. Keep static layout out of inline styles; dynamic transforms, measurements,
and CSS variables can remain inline. Match the reference's actual responsive
geometry; do not import TFM's colors, content, breakpoints, or default animation
bands blindly. Content belongs in server dictionaries/data or server JSX.
Gazzar's measured fixed units, clamps and 700px breakpoint take precedence over
blanket vw conversion. Preserve physical coordinates for deliberately LTR
viewport controls in Arabic; use logical properties where they preserve geometry.

`bun run format:css` formats one selector per line and checks the ordered CSS AST
before writing. It preserves units, cascade and embedded URL payloads. URLs
containing quoted XML are kept verbatim instead of changing string escapes.
`bun run check:architecture` enforces this format and the initial import boundary.
PostCSS is a development tool only, not a browser dependency.

## Cleanup and verification

An imperative mount returns cleanup for listeners, observers, timers, scroll
keys, RAF work, inline styles, and owned renderers. Clear per-mount caches.
Call `removeInstance(key)`; the returned scroll instance has no `.remove()` API.
Check HTML and interactive behavior in production, then update the local
`.doc.md`. Run `bun run check`, build, and the HTTP SSR audit before committing.
