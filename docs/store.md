# Storio

Storio 1.0.6 remains the shared state library. React is already provided by the
application. Use `dimensionsStore` for viewport measurements and `uiStore` for
menu, quiet-view, sound, entry phase and the shared HOME failure signal. Subscribe to primitive or stable reference
slices. A selector returning a fresh object on every call is not a cached
`useSyncExternalStore` snapshot.

## Local compatibility patch

`patches/storio@1.0.6.patch` is registered in `package.json` and `bun.lock`.
Always install with Bun so clean checkouts apply it. It corrects:

- Functional partial updates now merge, preserving actions and other fields.
- The hook reuses a stable subscription rather than rebinding per render.
- Server snapshots retain the initial state for consistent hydration.
- Equality compares actual object keys as well as values.
- Types accept both object and functional partial updates.

This is a project-local patch; no upstream package was published or changed.

## Usage

```ts
const quiet = useUIStore((state) => state.quietMode);
uiStore.getState().setQuietMode(true);
const isDesktop = useDimensionsStore((state) => state.vw > 1024);
```

Use breakpoint selectors when the component only needs a breakpoint. Pixel
geometry consumers may subscribe to width/height and refresh appropriately.
The generic helpers are non-overlapping: mobile ≤600, tablet >600 and ≤1024,
desktop >1024. They do not replace reference-specific CSS/controller thresholds
such as the measured 700px hero/journey switch.

Call the `useUIStore` / `useDimensionsStore` aliases when subscribing in a React
component or hook. React Compiler identifies hooks by the `use` prefix; calling
the same hook as `uiStore(...)` can make the compiler cache a hook call and break
the hook order on updates. Use `uiStore.getState()` / `.subscribe()` for imperative
controllers. The compiler stays enabled.

Do not put per-frame scroll progress, velocity, or mesh rotation in a React
subscription. Keep those in controllers/refs and update React only on meaningful
UI transitions. Stores here are client UI state; do not put request-specific
server data in these module singletons. SSR dictionaries are separate.

HOME entry/failure flags are shared UI transitions used by the shell and scene
owners. Their resets belong to those owners, not to the store module. Semantic
route checkpoints stay in `src/lib/navigation`; frame values and retained scene
resources stay in imperative controllers. Stores contain no route mapping or
animation clock. The architecture audit rejects React calls through the
non-hook `uiStore(...)`/`dimensionsStore(...)` names.
