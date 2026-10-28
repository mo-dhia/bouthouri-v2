# Persistent background code adversary R13

Reviewed 2026-10-28 against shared checkout HEAD
`e519e657d2c20b2002032a4f8cba07beb5e1bb4f` plus the frozen, uncommitted R12
persistent-background patch and the previously accepted R10 route integration.
The latest HOME mode-ref lint correction is included. The parent's subsequent
`environment.doc.md` edit only records validation; it changes no app behavior.

**Result: no confirmed P1/P2 counterexample in the supported route lifecycle.**
Seven independent supported-lifecycle controls passed. Two direct boundary
challenges failed and remain explicitly open below; neither has a demonstrated
normal Next route/gate event sequence, so they are not graded as app defects.
This is a code/lifecycle review with CPU substitutes for DOM/WebGL. Production
and moving visual acceptance remain parent-owned.

## Scope and provenance

Read `AGENTS.md`, `docs/load-architecture.md`, `docs/code-splitter.md`,
`docs/animations.md`, `docs/viewport-design.md`,
`docs/editorial-pages-architecture.md`, `docs/home-navigation-contract.md`,
`src/components/layout/environment/environment.doc.md`, and the **full** immutable
ignored source contract at
`.artifacts/pages-parity-20261028/background-lifetime/source-contract.md`.

That contract proves source provider 88009/material 20109 spans HOME and
editorials, retaining field, phase and pointer/material histories. Editorial
448/.28/.65 or Contact .9/1 preserves narrative work travel; HOME can reset its
narrative while material previous travel persists. The parent's live context/
uniform evidence motivates this repair; R13 did not recollect or visually grade
it. Source sibling placement and local same-host reparenting are deliberately
different. Projects exclusion is the disclosed local scope policy.

Reviewed the new environment owner/gate/server slot/CSS, locale-layout insertion,
persistent controller/adapters, HOME and editorial lease wiring, pointer and
protection changes, portrait/footer publisher changes, and affected fixtures.
Hero/journey clocks, journey-render-owner protocol, shaders, field math, camera
and object resources remain outside the behavior change.

Primary framework sources read locally:

- Installed Next 16.4.3 layout guide, lines 152–154 and 240–242: shared layouts
  persist; a client leaf reads pathname. The installed template guide explains
  keyed remounting. The patch does not move route copy into that leaf.
- `node_modules/next/dist/client/components/layout-router.js:388,519`: retained
  hidden Activity routes are gated by `__NEXT_CACHE_COMPONENTS`.
  `next.config.ts` does not enable `cacheComponents`. R13 does not use that
  optional path as evidence of normal reachability.
- Installed Next React DOM production runtime
  `node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js:9965,10195,10204,10324`:
  layout effects traverse children; deletion traverses descendant cleanup before
  removing the outer host node, and invokes function-component layout cleanup.
  The independent mounted probe additionally runs the installed `react-dom`
  renderer rather than a hand-written hook sequencer for the route controls.

All reviewed-source and independent-probe SHA-256 values are retained in
[source-sha256.txt](../.artifacts/pages-parity-20261028/background-review-r13/source-sha256.txt).
Key values:

```text
environment.logic.ts          f5914611863b111ca77cdcfc9803ea99ac73d690782fa91fe88c28afa94ad0a8
story-environment.animate.ts  f2666b398d710087997d40004b15f6ab43e516696558405c12a37bf214a0db98
story-scene-gate.logic.ts     1ed98c02c0a38818c115b226e765d9dbee4c3c9d7e530e18ceabfe25b62c7ed8
immutable source-contract    00e3f9e592c63625ccb1a002f388adf84f26716df9fbf8e70d07f7e9150e2eec
independent adversary.ts     422dc3e4fb9da244ceee606604997eca219713d6ca2eabc11d85edd54b11f744
```

## Independent execution

Initial CPU_HOLD was honored: only light reads and probe source authoring preceded
R13's `READY_FOR_TESTS`. After the parent explicitly granted **R13**
`MEASUREMENT_CLEAR`, exactly two bounded processes ran. Both exited before the
immediate `ACKNOCPUJOBS` message to parent thread
`d1cf0ce2-feb3-4291-aad4-6f0b76c69547`. The parent then returned CAPTURE_CLEAR to
visual R2. No more execution was granted or performed; subsequent work was light
source/reachability analysis, source fingerprinting and this report.

1. `bun .artifacts/pages-parity-20261028/background-review-r13/adversary.ts`
   exited 1 in approximately .55 seconds: **7 PASS, 2 boundary FAIL**.
   The first run and its failures are retained, with no rerun or fixture repair.
   The log also contains `THREE.Material` warnings from the probe supplying empty
   shader dependencies. Those are fixture conditions, not app shader failures.
2. The nine R12 affected files plus `tests/journey-render-owner.test.ts` passed
   **75 tests / 0 failures / 4,453 assertions across 10 files**, in 4.46 seconds.

The scoped command was:

```sh
bun test src/sections/landing/1-hero/hero-reading-portrait.test.ts src/sections/landing/1-hero/hero-portrait-mask.test.ts src/sections/landing/2-story/story-environment.test.ts src/components/layout/environment/environment.logic.test.ts src/components/layout/footer/footer-geometry.test.ts src/components/layout/footer/standard-footer-pose.test.ts src/components/layout/footer/footer-paths.test.ts src/components/layout/footer/standard-footer-extent.test.ts src/components/layout/footer/footer.logic.test.ts tests/journey-render-owner.test.ts
```

Evidence directory:
`.artifacts/pages-parity-20261028/background-review-r13/` contains
`adversary.ts`, `probe-first.log`, `results.json`, `scoped-tests.log`, and
`source-sha256.txt`. The independent fixture imports no existing test harness.
It evaluates the actual gates, coordinator, pointer, collector and material
controller; uses actual installed ReactDOM mounts; supplies a minimal in-memory
DOM and controllable pathname/import/idle/RAF/timer/observer surfaces; and replaces
WebGLRenderer with a CPU renderer while retaining real Three field objects.
It does not run a Next server, router transport, browser, shader compiler or GPU.

## Seven passing controls and verified invariants

The first six use actual ReactDOM mount/update/unmount lifecycle. The seventh
directly exercises actual coordinator cleanup/setup ordering.

1. Initial HOME queues one idle boot. A Services commit cancels idle and starts
   the deferred resource import; a further Contact commit wins before resolution.
   Resolving that import produces one renderer and attaches its host to the
   connected Contact root with stage .28. Mode is changed during this sequence;
   exact latest-mode/rate assertions are supplied by the affected coordinator/
   material tests, not inferred from this probe's stage assertion.
2. Replacing Contact's physical root at the same path disconnects the old root,
   retains the same connected host/renderer, and advances phase. This control's
   label mentions late events, but its independent assertions concern root
   replacement, identity and phase; it does not itself inject a delayed old
   event. Stale event/observer/lease cases are covered by the affected tests.
3. HOME's actual gate receives the shared failure flag; selecting the failed
   optional-child branch does not dispose the background. This simulates the
   failure state through the real store-selection hook, not a real failed GPU
   boot. After failure/quiet are cleared, a current journey-owner transaction
   publishes frame 350.123456789 and work travel 2.4: one material submission uses
   the current score. Pending ownership leaves no independent demand work.
4. Removing route content while keeping the layout owner mounted parks the same
   host/canvas connected in the locale slot. The gap advances material phase,
   retains the field and selects quiet zero. Binding Vision retains that field.
   Desktop width 1920→1600, height-only and DPR-only changes allocate no new field.
5. Projects exclusion disposes the current renderer and forces its context-loss
   cleanup exactly once. Reentry to Services creates one fresh eligible resource.
   Exclusion is intentionally not source whole-portfolio lifetime parity.
6. Context loss suspends draws; rebinding Contact retains the host. Hidden
   restoration submits no material draw. Visible recovery selects Contact's
   current .28 stage. Final React unmount disposes the current renderer once,
   forces context-loss cleanup once, and leaves no controlled idle/RAF/timer job.
7. A register-before-layout setup, cleanup, fresh setup and stale old cleanup
   sequence uses the 32ms no-requestIdleCallback fallback, adopts one latest
   resource and disposes it once. This is a coordinator sequence, **not** an actual
   development React StrictMode replay.

The affected tests independently pass current-owner supersession, stale route
lease/observer/guard cleanup, HOME idle 1200ms, zero-binding import completion,
rejected import latching, excluded/reentered generations, two-locale coordinator
ownership, reduced-mode/input history, MENU tail/drift, hidden/offscreen/context
recovery, fixed-profile field allocation, full-precision displayed hero sampling,
travel/pulse/stroke continuity, and portrait/footer source sequence isolation.
No test count is presented as a full HOME or EN/AR visual acceptance result.

Static review also confirms the layout adds only decorative parking and a null
gate; heavy runtime edges are dynamic/type-only. HOME's lease is outside the
optional failed object child. Route detach removes only its stage subscriptions,
observer, guards/grab/readiness and protection projections; final layout/exclusion
teardown owns global disposal. Binding/mode/resize use the existing scheduler;
the accepted journey transaction remains the synchronous material submission
path. The fixed, top-anchored host styling and three profile dimensions remain.
Actual browser rectangle/stacking and GPU context identity are not established
by these CPU checks.

## Boundary FAIL A: release before a publisher's first event

**Observed, ungraded boundary limitation.** In the direct probe a connected
page contains a connected footer whose publisher is allocated but has never
emitted. Calling collector `release(page)` and then emitting that publisher's
first active footer event restores influence **.8**, rather than expected zero.

Exact source: `story-material-protection.ts:25–30` tombstones only publisher
records already in its map. `material-protection.ts:20–24` allocates a sequence at
mount but does not register it with the collector; it rejects active events only
after the owner is disconnected. Therefore an unknown, still-connected publisher
can enter the map after release.

**Normal reachability remains unproven.** The direct challenge retains the old
owner connected and manually invokes its returned emitter after release. The
ordinary React route deletion runs the HOME/editorial layout release before host
removal within that deletion commit; it supplies no event-loop opportunity for a
later pointer/RAF callback between those synchronous operations. After removal,
the actual emitter rejects the active event. Actual portrait disposal emits an
inactive release; footer disposal/reset emits inactive protection. No ordinary
source event sequence was found that makes a never-published old owner emit its
first active event while still connected after its route release. A split
pathname/DOM or suspension trace would need to establish such a sequence; R13
did not collect one. This result must not be promoted to a P1/P2 from the helper
challenge alone.

If the owner API is intentionally required to guarantee this stronger condition,
a minimal hardening is owner/lease revocation that is checked independently of
whether any event has already populated the collector. Preserve per-source
sequence ordering and other live publishers; do not clear global pointer/field
history. No fix was made or requested as a blocking app correction here.

## Boundary FAIL B: disconnected registration without lease release

**Observed, ungraded boundary limitation.** The direct probe mounts a coordinator,
registers an editorial binding, removes that route DOM manually **without calling
the returned lease's release**, and resolves the pending resource import. It
allocates **one** resource, rather than expected zero.

Exact source: `environment.logic.ts:23–27,35–38` checks current registration,
pathname, owner generation and parking presence, but does not check
`binding.stage/page/owner.isConnected` before allocating or binding.

**Normal reachability remains unproven.** The actual HOME layout cleanup releases
its lease (`story-scene-gate.logic.ts:73–80`); editorial layout cleanup marks the
import disposed and releases a mounted lease
(`editorial-animate-gate.tsx:5–9`). Editorial import completion additionally checks
connected root and current path. Normal mounted route/root replacement controls
passed. No reviewed controller removes its route root without React cleanup.
The direct manual removal deliberately bypasses these adapters. Consequently
this does not demonstrate a production orphan resource.

If stricter coordinator-level rejection is desired, validate connected parking
and binding nodes immediately before create/adopt, treating an ineligible binding
as a parked/no-binding state. Keep supported gaps resource-preserving and do not
turn this into per-route retry or disposal. No app change was made.

## Limits and handoff

Only this report and R13's ignored artifact directory were authored. No app,
existing test, package or other maintained document was edited; nothing was
staged or committed and no child work was delegated. No broad check, lint,
TypeScript/typegen, build, server, SSR audit, browser, recorder, decoder, native
input or OS measurement was run by R13. There are no CPU jobs left running.

The independent mounted route controls are English; Arabic owner/generation
coverage comes from the affected suite, not a new mounted Arabic/browser pass.
The independent fixture does not mount HOME's actual object renderer, run page
graphics, decode blocked native chunks, or assert CSS stacking/real rectangles.
The scoped suite provides VM failure/chunk/mode/field regressions within those
same CPU limitations. React production remounts do not establish development
StrictMode effect replay, hydration behavior or actual Next streaming ordering.

The served 3100 build `yWFD32LNWavnwkZN_JMni` predates the patch and was not used
as approval. Root still owns integrated check/build/production SSR/lazy-boundary
verification and matched new-build continuous visual closure across the three
reference profiles and EN/AR. No FPS, real GPU persistence, unmatched initial
pattern/color, or full visual parity claim follows from R13.
