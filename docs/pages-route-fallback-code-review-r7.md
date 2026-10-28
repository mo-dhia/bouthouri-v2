# Editorial route handoff — independent offline review R7

Review date: 2026-10-28. Reviewed base HEAD is `7d22e96754845c4ce1a3d7658649a3aba93f097e`, plus the frozen uncommitted route handoff, source focus marker and R6 repairs. **One additional actionable P2 was reproduced in the actual mounted route-surface controller. No P1 was established.** R6's prior conclusions were independently inspected rather than accepted as approval.

This review owns only this report and ignored evidence under `.artifacts/pages-parity-20261028/route-review-r7/`. Application and existing test files were not edited. No browser/OS operations, broad checks, lint, TypeScript/typegen, build, server/package operations, staging, commits or delegation were performed. Projects' content remains excluded; supersession by its unclaimed navigation is within the controller boundary.

## P2 — Back to the still-connected origin bypasses restoration after another URL was selected

**Location:** `src/components/layout/route-surface/route-surface.animate.ts:235`–237. The same-path shortcut compares the traversal destination with `selected.owner.path`, although that retained physical owner can still be the origin of an already selected, pending push. Its `identify(owner)` then samples current native pixels without consulting the selected entry's saved checkpoint. The ordinary history restoration path at lines238–245 is skipped.

**Concrete trigger:**

1. Vision is connected at1700px. Activate managed Services navigation. The click boundary correctly saves Vision1700.
2. Complete cover and select the Services URL/state, while its physical owner remains pending and the outgoing Vision root is still connected. Native scroll is shortened/clamped to125px in this interval. The R6 repair correctly rejects that mismatched scroll sample and preserves Vision1700.
3. Traverse Back to the original Vision entry before Services' owner is adopted. `selected.owner.path` is still `/en/vision`, so the same-path shortcut resets the transition and re-identifies that connected Vision owner at125px. It neither reads the valid1700 checkpoint nor performs a history restore.
4. The controller settles idle at125px. A subsequent pagehide now passes the exact URL/entry/owner guards and saves125px over the original entry. Thus a correctly protected R6 checkpoint is lost after this additional traversal.

This is a cross-route history return despite equality with the retained physical owner's path: the browser had already selected Services. The accepted HOME document policy retains manual scroll restoration, so this path cannot depend on a later browser-owned restore to repair its pixels. Ordinary same-path/query/hash navigation still needs its existing native behavior.

**Executed reproduction:** [pending-origin-back-probe.ts](../.artifacts/pages-parity-20261028/route-review-r7/pending-origin-back-probe.ts) reuses only the existing inert DOM/clock adapters, evaluates the actual `mountRouteSurface` and actual route-entry registry, and adds this sequence independently of the existing tests. It explicitly verifies Services URL selection, connected outgoing Vision, waiting phase and the original1700 boundary before Back. Raw output is [pending-origin-back-probe.jsonl](../.artifacts/pages-parity-20261028/route-review-r7/pending-origin-back-probe.jsonl):

```json
{"case":"unclamped-origin-back-control","expected":1700,"afterBack":1700,"savedAfterPagehide":1700,"phase":"idle","scrollCalls":[],"hardAssignments":[],"pendingFrames":0,"pendingTimers":0}
{"case":"back-to-still-connected-origin-after-clamp","expected":1700,"afterBack":125,"savedAfterPagehide":125,"phase":"idle","scrollCalls":[],"hardAssignments":[],"pendingFrames":0,"pendingTimers":0}
```

The script intentionally asserts the observed failure and its control; exit0 establishes reproduction, not repair. The clamp is injected explicitly, and native browser restoration is not simulated. This is controller/lifecycle evidence, not a claim that R7 observed the interval in a live browser or established the cause of a native clamp. It extends the same connected-origin/selected-destination interval used by R6 with a Back before physical adoption.

**Smallest fix:** Distinguish the previously selected browser route/entry from the retained physical owner's route when classifying popstate. If an owned push has already selected another route, Back to its still-connected origin must take the validated history restoration path, using the original checkpoint and skipping entry/focus. Do not immediately overwrite that destination's retained sample with transient pixels. Keep ordinary truly same-path and hash traversals native; do not introduce a blanket restore for every equal pathname, duplicate HOME scroll application, or a new RAF/timer. Add a mounted regression for pending Services→Back to connected Vision after a clamp, including subsequent pagehide and intact unrelated Next fields; retain the unclamped and still-at-origin pending-push controls.

## Independently inspected repairs and integration

**R6 supersession:** The frozen controller retains origin/destination URL, route-entry identity and optional native Navigation API entry key. Finite animation callbacks, ordinary updates, cover commit and the watchdog recheck selection. An owned request can remain selected at its origin while pending. An ordinary unclaimed same-window internal activation resets active work without claiming the event; modifier, download, external and new-window activations remain outside that cancellation branch. Existing R6 tests cover those variants. R7 did not rerun that suite, and found no additional reproduced watchdog reassignment defect.

**R6 capture:** Live boundary capture now requires exact pathname/search, selected entry identity and both physical DOM owners. A mismatched owner/selection retains the saved sample; the passive scroll sampler applies matching guards. The R7 probe confirms the original Vision1700 boundary exists and the Services-selected interval does not directly adopt the125 scroll event. The new finding is the later same-path popstate shortcut, after the selected URL returns to the origin. The R6 pagehide repair itself is not being reported as absent.

**Entry/assets:** Read the actual registry and Vision/Services/Contact publishers and gates. The registry retains held/released/skipped decisions and uses callbacks rather than a readiness RAF. Vision/Services publish measured/font readiness separately from first successful canvas presentation or readable failure/offscreen/reduced paths. Their existing page presentation owner advances entry. Contact supplies its existing finite completion, and cancellation/disposal settles it. Deferred import failures publish readable fallback; the surface bounds stalled readiness and the gate bounds a never-settling initial surface import. Source review found no further sufficiently reproduced P1/P2 to grade here. Live presentation/decode timing and all possible owner replacements are not proven by this inspection.

**HOME/menu/focus:** The HOME pure selector is unchanged. The new adapters narrowly distinguish a same-locale editorial HOME top push from a selected same-locale editorial→HOME history override. Existing retained semantic-phase, physical-owner and native-write-budget tests remain in the reviewed tree. Header's covered/abort handler checks the exact outgoing shell, closes without opener focus and releases its existing lock before navigation/scroll; ordinary close retains focus behavior. Managed completion preserves root's `target.dataset.routeFocus = 'true'` marker and the narrow `[data-route-focus]:focus { outline: none }` rule. These were inspected, not independently browser-tested by R7.

**Footer/gutter:** The `8666e55`/`7d22e96` repairs remain present: failed material stops owned work and exposes the DOM word, and editorial main publishes inherited EN/AR gutter values at the exclusive fixed-width profiles. This review did not alter those files or repeat R6's fault-injection/CSS suites. Their R6 tests and root's combined result are supporting prior/root-owned evidence, not new R7 execution or visual acceptance.

## Verification, identity and limits

Read `AGENTS.md`, `docs/load-architecture.md`, `docs/code-splitter.md`, `docs/animations.md`, `docs/viewport-design.md`, `docs/editorial-route-handoff-source-contract.md`, `docs/editorial-pages-architecture.md`, `docs/home-navigation-contract.md`, R6's report, and both implementation handoff/repair documents. Inspected installed Next16.4.3 documentation and runtime before relying on routing assumptions. Its Link handler checks `defaultPrevented`; HistoryUpdater selects history in an insertion effect; its window popstate listener is not capture. Native history methods preserve the installed Next integration. The runtime's Activity cache branch is conditional on Cache Components, which this project's config does not enable; no hidden-route-cache defect is inferred from its existence.

Root allowed one review-freeze exception: the fixture-only excess-property TypeScript correction at `tests/route-surface.test.ts:257`, using `Object.assign` with the same runtime value. That correction is included in the harness read by the R7 probe.

Executed only:

```sh
bun .artifacts/pages-parity-20261028/route-review-r7/pending-origin-back-probe.ts
```

Both bounded cases completed in about0.4s, during root's explicit R7 measurement-clear window. No independent baseline/scoped suite was run. Root separately reports combined **335 tests /14,823 assertions**, check, build and SSR passing, with production BUILD `yWFD32LNWavnwkZN_JMni`. Root's manifest is `.artifacts/pages-parity-20261028/root/route-r7-build-source-hashes.json`; it records controller SHA256 `3abb2e706d9beddd2e55555e509214a39e054fd0cde867dde4ea5494aff728bf`, registry `3df4a83b72da87198a0d7ca7e8b1370a04a32f0e747acc152addbf59fe999696`, and route fixture `abff7a3d7c166523f301440a024b558213478e736f05bd05246fce920cd7332b`. These are attributed manifest values, not a new R7 hash audit or served-build operation. The earlier `Fi1s0bPb` production was not operated.

R7 makes no browser/FPS, full EN/AR screen or moving-parity acceptance claim. Browser-native traversal ordering, source motion comparison and production visuals remain with root and the exclusive visual reviewer. Root requested an immutable R7 handoff for scoped repair and fresh independent R8. **Report and probe evidence are frozen; no CPU job remains, and no further tests/probes will run during the recording hold.**
