# Shared editorial route handoff: source contract and integration proposal

Research date: 2026-10-28. Scope: HOME plus Vision, Services and Contact in EN/AR; Projects is excluded. This is offline source/integration research, not an implementation or a live parity result. No browser, test, build, type generation, server, staging, commit or delegation was used. Workspace observations are a read-time snapshot; Services and Contact have separate active owners.

## Decision

Add one small persistent navigation/surface owner and an owner-scoped entry publisher. Intercept eligible plain anchors and Next Links at **body capture**, after the accepted HOME document-capture observer and before Next's Link bubble handler. Keep semantic content, navigation and the surface's inert markup server-rendered. Load the controller separately from page copy and heavy graphics.

Do not port source HOME boot/reset internals into that controller. Distinguish an intentional fresh HOME push, a router-owned history return and an accepted HOME locale transition. Readiness belongs to the **connected inner page owner**, not to a copied source predicate on `main`.

## Evidence and terminology

“Source fact” below means a statement established by these local cached files. “Proposal” means a deliberate local integration rule, not something proved about the live source.

- [Source RouteSurface module61157](../.artifacts/viewport-validation-20261028/source-runtime/2gz902oulp4x8.js.pretty), lines4–132: transition, readiness, history, links, entry and teardown. Function names in this formatted capture: `P` entry identity, `C` boundary capture, `B` reset/dispose, `W` readiness, `D` waiting tick, `Y` commit, `F` HOME preparation, `G` transaction start, `z` click and `K` popstate.
- [Source pure module74812](../.artifacts/viewport-validation-20261028/source-runtime/modules.json), indexed by `74812`; also [formatted source](../.artifacts/viewport-validation-20261028/source-runtime/0or6--g23od4n.js.pretty), lines193–210: `routeIntent`, `routeFrame`, `ROUTE_TIMING`, handoff parsing.
- [Source page cache](../.artifacts/pages-parity-20261028/reference/): `en-contact.html` head scripts; `runtime/0ht1z612ephb8.css` surface CSS; `runtime/15ud0rwi-a_3n.js` menu module2023; `runtime/077ip09mx02jh.js` and `1fxjprk_uhktp.js` practice entry; `runtime/1ihboesdbyeuh.js` Contact readiness; `runtime/2mzrkx5gfk3t8.js` practice readiness.
- [Accepted HOME contract](home-navigation-contract.md), [HOME runtime](../src/lib/navigation/home-navigation.ts) and [pure selection](../src/lib/navigation/home-navigation-state.ts). These remain authoritative for local HOME semantics, including later history/physical-owner corrections.
- Installed Next is **16.4.3**. Inspected local documentation: `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` and `01-app/03-api-reference/02-components/link.md`. Runtime evidence: `dist/client/app-dir/link.js`, `dist/client/app-index.js`, `dist/client/components/app-router.js`, `dist/client/components/layout-router.js` and `dist/compiled/react-dom/cjs/react-dom-client.production.js`.
- Read `AGENTS.md`, [loading](load-architecture.md), [splitting](code-splitter.md), [viewport design](viewport-design.md), [animations](animations.md), [editorial architecture](editorial-pages-architecture.md) and [root's prior research](../.artifacts/pages-parity-20261028/root/route-handoff-research.md).

## Exact source surface and timing

Source facts:

- `routeFrame(p, revealing)` clamps `p`; cover is `revealing ? 1-p : p`, content is `1-.18*cover`.
- Cover is `.30s`, reveal `.38s`; the actual controller uses `.25/.30s` at physical `innerWidth <= 700`, and OS reduced motion uses `.12/.13s`. Both opacity tracks use `sine.inOut`. Generic entry line duration is `.40s`, stagger `.06s`.
- `directMinimum=160ms`, `assetTimeout=4500ms`, `navigationTimeout=8000ms`. Waiting deadlines measure from transaction `G.started`, including cover time, not from destination commit. The direct minimum starts when that direct transaction starts, not at navigation timing origin.
- Source dims outgoing content to `.82` during cover, except when a menu dialog is open or reduced motion applies. It restores the original inline opacity at full cover, before changing route. Reveal only fades the dark field; it does not run a second destination-content fade.
- The surface is a manual popover, promoted with `showPopover()` for top-layer coverage. Its absolute field is `#050505`. Surface and backdrop have `pointer-events:none`. A normal high z-index alone does not place an element above a modal dialog.
- Source CSS uses fixed `inset:0`, `100vw`, `100dvh`. Initial surface phase has a12s CSS fail-open; the head also bounds enhancement at12s, and noscript hides the surface. Source HTML initially declares `data-route-cover=true` on editorial routes.

Local proposal:

- Use fixed `inset:0`, **auto height**, no design-height or viewport-height unit for this physical cover. All page compositions retain width-only design sizing. At the agreed references, desktop and tablet take `.30/.38s`, mobile `.25/.30s`; select via `viewportDesign(...).key`, not a new700px composition breakpoint. Reduced timing takes precedence. Time is not scaled by width.
- Default server markup/CSS is transparent, hidden and noninteractive. Do not ship source's initial opaque HTML cover or wait12s to expose SSR copy. A failed gate/import must leave the page readable immediately.
- Preserve source easing mathematically; do not silently substitute a generic CSS ease. The publisher owns no RAF. Surface opacity needs only a finite animation path; it must not add a second page presentation RAF or a permanent readiness ticker. A native opacity implementation must state any sampled-ease approximation during later review.

## Link interception and installed Next timing

Source facts:

- `z` is document capture. It rejects already-prevented, nonleft and modifier clicks. Pure `routeIntent` rejects downloads, nonempty targets other than `_self`, cross-origin/non-HTTP(S) destinations, paths without EN/AR locale and any destination with the same pathname. Search/hash differences alone do not qualify. Different-path hashes are accepted by the source helper.
- The separate source same-HOME logo branch runs before pure `routeIntent`; it scrolls top, dispatches `portfolio-home-top` and focuses the hero name. Do not mistake this branch for general route classification.
- After classification, source stops propagation, captures history/HOME returns, plays the material click, starts cover, then pushes with `{scroll:false}` at full cover. Cross-locale paths use `location.assign`; if the destination has no search it appends current search. It stores a destination-path handoff younger than30s.

Installed local runtime facts:

1. HOME registers `document.addEventListener('click', onClick, true)` at `home-navigation.ts:468`. Its observer never prevents default. It captures/checkpoints and records HOME/locale intent while outgoing geometry and quiet state still exist.
2. Next `app-index.js` hydrates `document`. React installs capture and bubble event listeners on that root. Next Link's `onClick` calls its user handler, then returns if `e.defaultPrevented`; otherwise `linkClicked` prevents default and calls the navigator (`app-dir/link.js:291–310`, `45–85`). React's synthetic event reads native `defaultPrevented`.
3. Therefore document capture → **body capture** → target/bubble → document React Link handling is the relevant order. This conclusion does not depend on registration order between HOME and the new body listener. Existing React capture handlers would already have run; no applicable navigation blocker was found in the inspected shell.
4. Header's current menu/sound handler is **document bubble** (`header.logic.ts:383–427`). Stopping propagation at body suppresses it. Merely preventing default lets Link skip routing, but Header still closes a menu immediately.

Proposed interception contract:

- Intercept only an ordinary, unmodified left activation of an eligible `a[href]`, including keyboard-produced clicks. Reject downloads, effective targets other than `_self` (including inherited `base[target]`), inert ancestors, other protocols/origins and previously prevented events. Normalize `_self` as the accepted HOME classifier does.
- Whitelist only implemented `/en`, `/ar` and their `/vision`, `/services`, `/contact` routes. Leave Projects and unsupported paths to existing browser/Next behavior.
- Preserve same-path query/hash and same-HOME logo behavior. For the smallest safe integration, also leave **all hash-bearing destinations** to their current browser/Next path; this is a documented narrowing of source interception. Intercepting a cross-route hash with `scroll:false` without a dedicated anchor transaction would lose its scroll behavior.
- After HOME's capture, take only the new controller's outgoing boundary snapshot, prevent default and stop propagation for the claimed route activation. Do not synthesize another click or call HOME capture twice. The surface then owns the one material click and an explicit covered-menu signal.
- Use the same controller for plain footer anchors and Next Links. Otherwise footer navigation continues to replace the entire document, which is a real behavioral difference beyond the missing opacity overlay.
- First eligible click claims the transition. Further ordinary route activations while it is active are consumed without replacing its intent; modifier/new-tab/download/external activations remain unclaimed. If initialization failed and no owner exists, no listener claims the click.

## Navigation kinds and HOME precedence

The local selector's exact precedence (`home-navigation-state.ts:130–159`) is:

1. Explicit, finite, nonnegative **router history target**.
2. Valid generic HOME return.
3. New valid work query (once per selected entry).
4. Pending work return.
5. Locale return.
6. Hash/native ownership.
7. Back/Forward checkpoint, consumed-query reload checkpoint, then native fallback.

Do not reorder this selector, rename its keys, clear its stores globally, or infer an explicit router target from every checkpoint. Source `F` is not an interchangeable replacement for that accepted module.

Use these distinct boundary actions:

- **Normal same-locale PUSH to plain HOME**, such as editorial Header logo: this is an intentional top arrival. At the claimed, fully covered navigation boundary, clear pending generic HOME return and, with no `work` query, pending work return, matching source `F`'s push distinction. Preserve unrelated history state. Establish top before the incoming HOME hero selects native/restore intent; resetting only after a delayed destination effect is too late. Release the old menu lock first. Do not delete the outgoing HOME checkpoint. Do not turn this into a document-wide “all HOME visits start zero” rule.
- Source enters soft-pushed HOME in its restore boot mode; top arrival does **not** prove that the first-document loader/sound-choice should replay. Preserve accepted hero `entryPhase`, `prepareHomeFreshEntry()` and `getHomeRestoreIntent()` sequencing. A narrow route adapter must identify the plain push explicitly if a current-document native offset could otherwise be misclassified.
- **Back/Forward into HOME from a same-locale editorial route**: root may provide the source-style router target through the already-supported `mountHomeNavigation({historyTarget})` integration, but only from this actual history transaction's validated saved native pixels. This explicit input intentionally outranks a generic return. Missing snapshot is not permission to supply zero. Do not apply the pixels in the surface as well.
- **HOME EN↔AR through accepted soft Next navigation**, including its history/owner lifecycle: preserve generic HOME return/work/locale precedence and the accepted semantic work312 case. Let HOME's document capture write its return/handoff records before cover or mode reset. Do not force source's hard document navigation here, inject a generic route pixel target, clear HOME returns, or reset quiet mode in the outgoing owner.
- **Editorial language change**: source uses hard locale navigation. Retaining that route-specific policy is the conservative source proposal; write only a surface handoff for the exact destination and use `location.assign` after cover. Do not create HOME semantic locale records from editorial geometry. A future editorial soft-locale choice needs its own adjudication; it must not change the accepted HOME exception.
- **Initial HOME/reload/BFCache**: retain existing HOME document policy. Source does not start a general direct surface for initial HOME without a locale handoff. The new surface must not compete with HOME's authored loader, fresh head reset, semantic restore or reading geometry.

Root should implement the plain-HOME-push and explicit-history adapters together, as narrow integration inputs. A blanket `scrollTo(0)` on every commit or `historyTarget = savedY ?? 0` is unsafe.

## History ownership and native write budget

Source facts: `P` merges `portfolioEntry` into state using `replaceState`; `C` saves current native pixels to a session map bounded to40 entries. It runs at route click, popstate, pagehide and completed handoff, not every scroll input. `K` treats same-path traversals as no surface transition; other history traversals immediately show full cover and select a saved target, defaulting source-missing data to zero.

Local proposal:

- HOME keeps `gazzarHomeNavigation`, its bounded document/session checkpoints, exact path/search validation, semantic retention and boundary flushes. **No new native writes on scroll, scrollend, resize, readiness, entry frames or routine controller cleanup.**
- Editorial history gets one separate versioned entry identity, created once on verified new entry/commit and merged with existing Next/custom fields. Fresh pushes get fresh IDs even if a router preserves old custom fields. A route table may reference an existing HOME ID read-only; do not install a competing HOME identity.
- Capture native editorial pixels at departure/pagehide/history boundaries only. Persist a bounded40-entry map and validate ID, exact path/search, finite nonnegative pixels and timestamps. Keep an owned inline boundary fallback if denied storage must survive a hard document visit. No stored value may replace Next's state object wholesale.
- Retain `{entryId, path/search, root}` for the **outgoing** owner independently of current `history.state`. On popstate, URL/state already describe the destination. Capture the old owner under its previous identity before adopting the selected entry. Never flush old pixels into that destination's state, even for equal URLs with different IDs.
- For editorial restoration, wait for the correct destination owner and usable geometry/fonts; restore once without smooth scrolling, refresh its existing scroll owner, then reveal. Do not clamp a deep saved position into a short transient document and call it complete. If final content really is shorter, bounded final clamping is a fallback, not silent successful restoration.
- Next registers its `popstate` handler at window bubble (`app-router.js:315`); capture can record the outgoing boundary and publish the transaction before normal Next handling. Do not stop propagation or replace router internals. The accepted HOME guard also handles earlier-capture teardown cases; do not remove it based on this installed Next version.
- `HistoryUpdater` writes in an insertion effect; `usePathname`/URL change alone does not prove that the destination page owner is installed. Native `pushState`/`replaceState` are also patched by Next. Preserve `__NA`, `__PRIVATE_NEXTJS_INTERNALS_TREE` and all unrelated fields; never bypass/monkey-patch them.
- Back/Forward uses `focus:false` in the local contract. Source's final route focus actually runs for every successful kind; suppressing it for local history is an intentional focus-preservation adaptation. Current Next's `InnerScrollHandler` explicitly leaves focus untouched.

## Destination readiness: map to current inner owners

Source `W(main)` expects `.experience[data-app-boot=ready]`, `.practice-page[data-practice-ready=true]` or `.contact-page[data-editorial-ready=true]`. It additionally waits for locale/font readiness, hero image decode, and appropriate visible practice-object presentation. The latter accepts depth fallback, no canvas, a rendered hero, or an offscreen sufficiently ready canvas. It checks readiness on another ticker visit using `data-route-settled` before revealing.

Current local identities differ:

- Vision: main contains **`[data-vision-root]`**. It publishes `data-motion`; that attribute is written at mount and is not by itself evidence that fonts/measurement finished. There is no source-compatible `main.dataset.practiceReady` publisher.
- Services: main contains **`#services-content[data-locale]`**. `data-practice-ready=true` is on that inner element after its controller's measurement/font path. Its `data-depth-fallback` is also inner-owned. Services changes remain its current owner's responsibility.
- Contact: main contains **`[data-contact-content][data-locale]`**. `data-contact-motion-ready` and `data-contact-entered` are inner-owned. Motion is optional through `useDeferredMotion`, so reduced/quiet/disabled enhancement must be an explicit readable fallback, not an endless readiness wait.
- Editorial main currently supplies class, `data-page` and direction; it cannot satisfy source `W` unchanged. HOME uses its existing physical journey owner and navigation readiness, without fabricating `appBoot` state.

Add a server identity (`data-route-path` or equivalent exact locale/page identity) to the route owner. Hold both shell/main and inner-root object references. A commit is adoptable only when they are connected, nested correctly, match the intended destination, and belong to the selected transaction/entry. Checking `isConnected` alone is insufficient: an outgoing AR owner can remain connected after URL becomes EN. A global first `querySelector('main')` is not a destination identity test.

Use event/callback readiness and a bounded timeout, not a new polling RAF. Source's extra settled visit is evidence of sequencing, not permission to bypass HOME's own multi-frame stable-geometry transaction.

Entry skip and asset readiness remain separate decisions. Reduced/history or
already-started entry does not waive a visible practice hero's first static draw.
An explicit readable enhancement fallback may waive it. The local registry stores
that fallback independently, resets it when a new handler registers, and retains
the once-only entry decision. Both practice controllers use the same readiness
predicate in motion and reduced mode, with failure and offscreen alternatives.

## Once-only entry publisher

Proposal: one very small `route-entry` registry, scoped by Document, **physical inner owner**, arrival generation and selected entry. It imports no renderer, store, React or animation runtime and runs no RAF. Events may wake it; retained state prevents missed-event races.

Required protocol, independent of exact API spelling:

1. The surface claims a managed arrival before destination enhancement can start, and exposes that claim synchronously. A page registers its own readiness, readable-fallback state and entry starter for that owner. Registration immediately reconciles a previously published decision; listener timing cannot lose it.
2. Page entry progresses through pending → held/eligible → started or skipped → consumed. Only the current publisher can release a held managed entry. Start is idempotent for that physical arrival, including font callbacks, duplicate events, Strict Mode and reduced/motion remounts.
3. On reveal start, invoke the existing page starter once, alongside surface fade. Vision/Services consume `practice-hero-enter` semantics on their **existing page RAF**. Their source entry dispatch completes immediately for route-surface purposes; do not keep the cover busy for their full roughly2s hero sequence.
4. Contact already owns the source generic line/support entry: line112% at50ms, `.4s/.06s`, quartic out; support offset10 reference pixels/opacity at170ms, `.3s/.045s`, cubic out. Keep it inside Contact's finite RAF. If preserving source's completion/focus ordering, resolve its entry completion from that existing owner; never create a second generic entry timeline in the surface. Cancellation/fallback must settle that completion too.
5. A history/deep arrival, hash-owned path, reduced first arrival or already-consumed owner explicitly skips entry and leaves text visible. Source uses physical `scrollY > 80` for its entry skip; current Contact uses width-scaled `designPixels(80)`. Keep that difference explicit for root adjudication; a global gate must not silently use a different threshold from the page. History can explicitly skip regardless of threshold.
6. Remove `editorial.animate.ts`'s unconditional next-RAF `practice-hero-enter`. Vision currently waits on global `routeBusy` or an event; Services currently starts after fonts without a hold; Contact autostarts after readiness and also accepts an event. These paths need to adopt the same retained decision, not add another publisher.
7. No surface claim means page-owned autonomous entry remains available. If a direct page has already begun autonomously before the deferred surface runtime arrives, that late runtime must adopt the consumed/started state and **must not re-cover or restart** the visible page. Do not rely on parent/child effect order to prevent this race.
8. If a held publisher fails or times out, release the cover and mark that arrival consumed/skipped. A late page chunk can install scroll/interactions, but must render its entry-complete pose immediately. It must not hide/reveal an already readable heading. Detaching an owner, pagehide or a newer traversal invalidates all its pending callbacks and releases its hold.

The entry latch must survive a same-owner controller remount but must not leak to a different DOM owner or a genuinely new arrival. Contact's existing `data-contact-entered` already handles one-owner remounts; it is not a universal destination transaction ID.

## Initial entry, assets, failures and focus

Source facts:

- Non-HOME direct entry starts fully covered, waits at least160ms plus readiness, and may restore saved native pixels for reload/back_forward. A plain direct editorial visit has no source history restore target. The source head's fresh-zero reset applies to HOME, not all editorial reloads.
- At4500ms, a committed connected root can reveal via asset fallback even without normal readiness. A disconnected committed root instead resets the surface after that deadline. At8000ms without commit, source resets then hard-assigns the target.
- Hero images decode with errors caught; font/locale readiness is a promise chain. Successful reveal concurrently runs page entry, field fade and optional project shared mark. Final source focus is `h1` below physical80px, main otherwise, with `preventScroll:true`.
- Reset kills animation, disposes entry/shared mark, restores outgoing inline opacity, removes its waiting ticker and clears `routeBusy/routeCover`; completion callbacks check transaction ID before finalizing.

Local policy proposal:

- Keep the160ms minimum **only for an actually managed direct editorial enhancement**, measured from its own start. SSR never waits for it. If autonomous entry already started, skip the late direct cover. This cannot promise source-identical pre-hydration darkness; that tradeoff follows the requested transparent SSR fail-open policy.
- Ready SSR text and stable posters are the readable failure path. A managed visible practice hero waits for actual first presentation (`heroRendered`) or its depth-fallback publication; geometry-ready alone is insufficient. Do not make the4500ms source ceiling a compulsory delay, preload Three/audio, or warm unrelated practice models. Offscreen assets do not block, and font rejection/failure and graphics failure settle explicitly. Normal ready arrivals release immediately.
- Keep a bounded navigation watchdog;8000ms is the source value. Before an uncommitted hard fallback, invalidate the generation, restore all styles, close/unlock the outgoing menu and remove the cover. Prevent retry loops with a one-shot fallback. Do not hard-assign after the user has already traversed elsewhere.
- A committed readable destination with missing enhancement fails open; do not navigate it again merely because a model/font promise did not finish. Late promises cannot steal focus, move scroll, claim a new owner or restart entry. Pagehide cancels active transition work; persisted pageshow resumes by current ownership/history policy, without replaying an initial cover.
- Push completion may focus the correct connected destination heading/main with `preventScroll:true`. History completion uses `focus:false`; respect an intervening deliberate user focus, especially a Contact field. Cleanup restores only styles/attributes owned by that transaction, not a whole stale style snapshot over a new owner.

## Old menu and scroll locks

Source menu module2023 listens for `portfolio-route-covered` and calls its immediate close with **focus restoration disabled** (`K(false)`). Its ordinary close restores opener focus. Its lock release is owned by that menu lifecycle.

Local Header `finishClose` restores overflow/gutter, clears DOM/store menu state and focuses the connected opener; cleanup calls it if the dialog remains open. `keepMenuPosition` can write the old locked scroll offset while the dialog is open (`header.logic.ts:428–436`). Thus:

- Keep the old menu visible during cover, then send an explicit covered signal to its own controller to close/unlock without opener focus. Parameterize the existing owner closure narrowly; do not call a private closure from the surface or mutate dialog/store/overflow independently.
- Release that lock **before** any destination/top/history scroll. Waiting only for asynchronous Header unmount can allow old `keepMenuPosition` to overwrite destination restoration.
- Old Header cleanup is an idempotent backstop and must not restore focus or stale overflow after a new owner has acquired a lock. A canceled precommit transition must also release its claimed lock and return usable navigation.
- Surface promotion above the modal and pointer-event policy are separate: showing a noninteractive manual popover must not accidentally dismiss the modal before the covered signal. Ordinary Escape/manual menu close retains its accepted behavior.

## Minimal implementation ownership and order

Root-owned files proposed, with no page redesign:

1. New `src/components/layout/route-surface/route-surface.tsx`, `route-surface.module.css`, `route-surface-gate.tsx`, `route-surface.animate.ts`: server surface, tiny mount/import/router bridge and single persistent controller. Add a separate gate `.logic.ts` only if its hook responsibilities justify it.
2. New `src/lib/navigation/route-navigation-state.ts`: pure eligible-route classification, timing/frame helpers, transaction kinds and validated editorial history records. New `src/lib/navigation/route-entry.ts`: tiny retained owner/entry publisher, no clock or heavy imports.
3. `src/app/[locale]/layout.tsx`: mount the shared server surface/gate outside route replacement. Do not make the locale layout/client content graph own page controllers.
4. `src/components/layout/editorial/editorial.tsx` and `src/sections/landing/landing.tsx`: exact server route/locale identity only. `src/components/layout/editorial/editorial.animate.ts`: remove its unconditional entry dispatch; keep its separate field lifecycle.
5. `src/components/layout/header/header.logic.ts`: owned covered/abort close signals, focus-suppression and lock-order adapter, with cleanup. No broad menu animation rewrite.
6. `src/sections/landing/3-journey/journey.animate.ts`: only if needed, thread a genuine same-locale router history target into the existing navigation mount. `src/lib/navigation/home-navigation.ts`: only a narrowly scoped plain-HOME-push preparation adapter if required to establish intent before hero selection. Keep its storage keys, selector precedence, native-write guards, physical-owner/locale guards and retained restoration phase intact. Do not edit the pure HOME selector as a shortcut.

Page-owner integration seams, to coordinate after their current work lands:

- `src/sections/vision/vision.animate.ts` and `vision-gate.logic.ts`: inner-owner readiness after real measurement, held/once-only starter and failed-import fallback publication.
- `src/sections/services/services.animate.ts` and `services-gate.logic.ts`: equivalent handshake around its existing finite entry/ready path. Services' ongoing fonts, profile, renderer failure and one-RAF fixes remain with that owner.
- `src/sections/contact/1-conversation/contact.animate.ts` and `contact-gate.logic.ts`: adopt managed hold/consumption, expose readable disabled/failure readiness, settle finite entry completion. Do not add another Contact entry implementation.

Implementation sequence: define pure classification and publisher → add identity and page handshakes → remove shell's eager dispatch → install surface/menu integration → connect explicit HOME push/history adapters. Do not enable global interception while one page still has an unconditional autonomous managed entry.

## Bounded root decisions and later acceptance

No additional source browsing is needed to begin implementation. Root needs to settle these explicit local choices while integrating:

- How the plain HOME push establishes zero/restore intent before incoming hero selection, and how a genuine same-locale history target reaches the existing mount. Keep accepted cross-locale work312 evidence as the control.
- The local readiness grace/ceiling for fonts and optional graphics;4500ms is evidence, not a prescribed added delay.
- The page/global deep-entry threshold mismatch and finite surface animation mechanism. Both require a declared policy, not an implicit second clock or new breakpoint.

After root's measurement clearance, integration validation should cover footer anchor vs Next Link, menu-under-cover with lock/focus cleanup, fresh HOME logo push, same-locale Back/Forward, accepted EN↔AR HOME semantics, delayed destination DOM with old owner connected, denied storage, failed/late controller imports, direct SSR/no-JS, reduced motion, deep restoration and browser history focus. Those checks were **not run** here. No FPS, cadence, complete moving-parity or acceptance claim follows from this contract.
