# SSR and CSR boundaries

Next Server Components are the default. Static `/en` and `/ar` pages are
prerendered HTML; this retains the server-first content advantage without
requiring a server computation on every visit.

## Keep on the server

- Routes, section composition, headings, paragraphs, labels, project descriptions.
- Header/footer structure and ordinary navigation.
- Initial image markup, explicit dimensions/aspect ratio, alt text and links.
- Translation dictionaries, prepared section data, canonical links, JSON-LD.

`src/i18n/dictionaries.ts` is guarded by `server-only`. Client controls receive
only the translated labels they render, not the whole dictionary or route data.

## Put on the client

- Event handlers, viewport/motion subscriptions, Storio hooks, and pointer input.
- A menu's open state, sound preference, quiet view, and form interaction.
- DOM animation controllers and canvas/WebGL renderers.

Add `use client` at the smallest useful boundary. A client module's static
imports join its client graph. Keeping the parent server-rendered does not make
a heavy static import in its client child cheap.

## Use an enhancement gate

The working example is `src/sections/landing/1-hero/`:

```tsx
// Server section: content never depends on the gate.
<section id="identity">
  <HeroAnimateGate />
  <h1 data-hero-title>Server-rendered title</h1>
</section>
```

The small gate returns `null`. Its logic calls `useDeferredMotion("#identity", load)`.
`load` imports only the controller. The controller accepts the server-owned
element and returns a function that reverses every mutation it made.
Persistent fixed layers also need restoration-aware activation: a Back/Forward
or locale handoff can begin below their ordinary viewport observation range.
Their inactive server appearance must remain within their own section.

Passing server-rendered children into a client wrapper can also preserve SSR,
but a null gate avoids hydrating an unnecessary wrapper around static content.
Do not pass callback functions from Server Components to Client Components.

`dynamic(..., { ssr: false })` belongs inside a client scene loader and is reserved
for an actual browser-only renderer. It must not surround the only heading,
project descriptions, or a whole content route. A `Suspense`/viewport fallback
may replace optional behavior; it must not replace already available copy.

## Hydration and state

Viewport state starts at `0` on both server and initial hydration, then the
initializer measures the browser. Render ordinary responsive layout in CSS so
that this initial unknown width never hides content or chooses different text.
The local Storio patch provides a stable initial server snapshot.

Keep current scroll position, mesh transforms, and animation velocity in refs
or imperative controllers. Storio is for UI state rather than per-frame values.
Do not make the document read client state to decide its initial language.
