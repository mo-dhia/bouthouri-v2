# Editorial route handoff — independent code review R9

Review date: 2026-10-28. Reviewed HEAD is `7d22e96754845c4ce1a3d7658649a3aba93f097e`, plus the frozen uncommitted route integration and R6/R7/R8 repairs. **One additional actionable P2 was reproduced in the actual mounted controller. No P1 was established.** R8's repaired popstate-history paths and the retained original controls pass; that is not blanket approval of route restoration or visual parity.

This reviewer changed only this report and ignored evidence under `.artifacts/pages-parity-20261028/route-review-r9/`. No application or existing test edits, browser/OS operations, lint, broad checks, TypeScript/typegen, build, server/package operations, staging, commits or delegation were performed. The separate Services CSS repair was outside this reviewer's ownership. Projects content remains excluded; its native navigation/supersession behavior remains within the shared route boundary.

## P2 — Unfinished saved direct arrivals overwrite their checkpoint on pagehide and forget it on BFCache resume

**Locations:** `src/components/layout/route-surface/route-surface.animate.ts:61`, `:90`–97, `:164`, `:176`, `:284`–288 and `:323`–325. Initial editorial `reload` and `back_forward` visits correctly select a validated saved target, but create a transaction with `kind: "direct"`. Pending-pixel protection, retained selected pixels and pagehide suspension are restricted to `kind: "history"`.

**Concrete trigger:**

1. Start a managed direct Vision arrival with an exact valid inline entry checkpoint of1700px and navigation type `reload` or `back_forward`. The fixture models the gate's initial entry hold, so the deferred surface genuinely owns this arrival.
2. While its geometry is still short, native pixels and available extent are125px. After40ms, assert that the controller is waiting and has not issued any restore scroll. The saved1700 target is still pending; this is before the160ms direct minimum and before the4500ms bounded fallback.
3. Dispatch pagehide. The current URL, entry ID and connected main/inner all match. Because `historyRestorePending()` excludes this **direct** saved restoration, `capture()` treats125 as live, replacing1700 in the route table and inline history state. Pagehide also excludes this transaction from retained unfinished intent, then resets it.
4. Dispatch persisted pageshow, enlarge the extent to28000px, send the ordinary update and advance600ms. The controller remains idle at125 with no restore scroll. A later pagehide persists125 again.

This reproduces for **both reload/back_forward and available/denied session storage**. The completed-arrival control first provides sufficient geometry, lets the same direct transaction restore1700 and finish, then performs pagehide/pageshow; all four completed controls retain1700. The equivalent **popstate-history** pending restoration survives pagehide,20000ms of hidden wall time and subsequent geometry growth in both storage modes, confirming R8's repaired path is present.

Representative raw records:

```json
{"case":"direct-saved-arrival-suspension","type":"reload","denied":false,"completeBeforeHide":false,"expected":1700,"inlineAtHide":125,"storedAtHide":125,"afterResume":125,"inlineFinal":125,"storedFinal":125,"starts":[],"scrolls":[],"phase":"idle","hard":[],"frames":0,"timers":0}
{"case":"direct-saved-arrival-suspension","type":"reload","denied":false,"completeBeforeHide":true,"expected":1700,"inlineAtHide":1700,"storedAtHide":1700,"afterResume":1700,"inlineFinal":1700,"storedFinal":1700,"starts":[true],"scrolls":["scroll:1700"],"phase":"idle","hard":[],"frames":0,"timers":0}
```

**Minimal repair contract:** Extend protected unfinished **editorial saved restoration** to validated direct reload/back_forward targets as well as popstate-history. Preserve the intended pixels in the retained selection before application, including physical-owner replacement, and reject transient input/boundary samples until the target is applied or the existing bounded fallback settles it. Retain unfinished direct saved intent across pagehide using the same exact URL/entry/optional native-key checks, remaining active deadline and finite reveal progress. Persisted resumption should use the existing bounded restoration/entry-skip policy without replaying initial entry or introducing another clock, timer class or retry. Keep ordinary fresh direct arrivals without a saved target, completed BFCache visits, unknown/hash/query paths and HOME's independent policy unchanged. Add positive mounted unfinished-direct regressions alongside the completed-direct and repaired-history controls.

This is an uncovered original direct/reload handoff path; this review does not establish that R8 introduced it. The125px position/extent and lifecycle events are explicit fixture injections. The reproduction establishes the controller's checkpoint loss and failed resumption, not a new browser observation or the cause/timing of native clamping.

## Independently verified repairs and original scope

The retained scoped suite passes **124 tests /2696 assertions across8 files**. It includes the original body-capture/menu/entry/readiness/HOME boundary cases and all final R6/R7/R8 mounted groups:

- **R6:** Unclaimed Projects/hash supersession, cover/commit/watchdog selection checks, optional native entry-key changes, the legitimate still-at-origin watchdog, exact path/entry/main/inner boundary capture and pagehide protection for a connected outgoing owner.
- **R7/R8 traversal:** First pending-origin Back, a distinct known entry on the same physical owner, repeated Back→Forward→Back before Services DOM exists, available/denied storage, native unknown/query/hash/no-op controls and eventual physical adoption. The second pending Back restores1700 rather than60.
- **R8 suspension/replacement:** Unapplied popstate-history intent survives BFCache and later geometry; completed visits stay idle. Early/late publishers transfer history skip through replacement during reveal, remaining source sine progress resumes without a full-cover restart, and another selected entry/hash/route discards suspended work.
- **Original entry/assets/failure contract:** Once-only held/released/consumed publication, autonomous late-surface adoption, failed/late enhancement readability, managed-direct minimum, geometry readiness versus first successful practice presentation/fallback/offscreen history, Contact finite completion, cancellation and disposal.
- **HOME/menu/native budgets:** The actual HOME navigation suite passes the narrow fresh editorial HOME push and same-locale history adapters alongside accepted locale/semantic work312 precedence, physical-owner/completed-phase guards and native-write budgets. Header tests pass exact-shell covered/abort ownership, lock release before routing, suppressed departure opener focus, ordinary-close focus and cleanup. Native exceptions and bounded prefetch remain covered. The source route-focus marker assertion passes.

The independent19-case probe adds exact-entry **and native-key** supersession before application, partial reveal→physical-owner gap→pagehide→long hidden time with early/late replacement publication, remaining active4500ms fallback budget, held publisher cancellation/disposal/remount, same-main **inner-only** replacement and the still-selected-origin no-op with exactly one8000ms hard fallback. These controls pass with no stale assignment or remaining frame/timer. Together with the four completed-direct controls,15 records are passing controls; four records reproduce the new direct-arrival P2. The script intentionally asserts those observed failure outputs, so exit0 means successful reproduction, not repair.

Source inspection also covered the original integration rather than only R8's new assertions: transparent/noninteractive server surface and deferred controller, server-rendered route content and exact locale/page identities, body capture after HOME's document capture and before Next Link bubbling, source sine/profile timings, physical main/inner ownership, menu-owned unlock/focus suppression, separate page readiness/asset publication, boundary-only editorial persistence, native Projects/hash/modifier/download/external/target exceptions, bounded intent prefetch, finite scheduling and cleanup. The registry owns no RAF; page entry remains on existing page owners. The fixed1920×1080/768×1024/412×915 policy, Bouthouri identity and Storio/custom scroll architecture were not changed. No new Footer/CSS fault-injection suite or rendered parity check was run by R9.

Read `AGENTS.md`, loading, code-splitting, animations, viewport design, editorial architecture, route source contract, HOME navigation contract, full R6/R7/R8 reports, implementation handoff and all three repair notes. Inspected actual route controller/registry/gate, pure classification/state, HOME adapters, Header owner closure and Vision/Services/Contact publishers/gates, plus cached source module61157 and installed Next linking documentation/runtime. Next Link checks native `defaultPrevented`; HistoryUpdater writes in an insertion effect; its window popstate listener is not capture.

## Ungraded Next ordering seam

R8's asynchronous URL selection **without any DOM mutation or surface update** remains ungraded. Its injection can produce a stale hard assignment, but an ordinary Next cross-route synchronous commit and MutationObserver microtask may close that no-observation interval before a native Back task. R9 established no real runtime/browser reachability and does not report it as a second P2. The valid still-at-origin request/no-op control retains its one-shot8000ms watchdog. No speculative blanket cancellation or history policy change is proposed for this seam.

## Exact execution, identity and limits

During the initial CPU hold, only light reads, notes and probe source authoring occurred. After root's explicit **MEASUREMENT_CLEAR R9 NOW**, ran exactly:

```sh
bun .artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.ts > .artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.jsonl 2> .artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.stderr

bun test tests/route-handoff.test.ts tests/route-surface.test.ts tests/home-navigation.test.ts src/sections/contact/1-conversation/contact.animate.test.ts src/sections/services/services.animate.test.ts src/sections/vision/vision.test.ts src/components/layout/header/header.logic.test.ts src/components/layout/header/menu-timeline.test.ts > .artifacts/pages-parity-20261028/route-review-r9/scoped-tests.log 2>&1
```

Both processes exited0. The probe emitted19 raw JSON records and empty stderr; the suite reported **124 passed,0 failed,2696 assertions,3.64s**. Both exited before the explicit **ACK NOCPUJOBS**. Root then resumed visual recording/extraction ownership and prohibited further execution; only light source-line/hash reads and report writing followed. No reviewer CPU job remains.

Evidence: [probe source](../.artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.ts), [raw records](../.artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.jsonl), [stderr](../.artifacts/pages-parity-20261028/route-review-r9/route-adversarial-probes.stderr), [scoped log](../.artifacts/pages-parity-20261028/route-review-r9/scoped-tests.log), [reviewed source hashes](../.artifacts/pages-parity-20261028/route-review-r9/source-sha256-before.txt). The script reuses only the existing inert DOM/clock fixture prefix and evaluates the actual mounted surface and actual registry; it does not substitute a mirror implementation. No existing test was edited.

Controller SHA256 remained `56d85bf788f59f3126b9425c2b0fa0cc6fee39d6e63cdcb398aac28826c6e034`; registry `5f137c976e91e3b08ce10fb7d25dbfb20bc6e4559a6d8b698ee78af9e88b9fe3`; mounted fixture `46be7cb119fcd0646ab983f3dc2cebbb5ccb54092186345a7838be4c7006d701`.

Root separately reports combined check **345 tests /15095 assertions** passing on this frozen route R8 plus Services CSS snapshot. That is root-owned evidence. Production3100 /BUILD `yWFD32LNWavnwkZN_JMni` predates R7/R8 and provides no closure for this snapshot; R9 did not operate it. Root owns the direct-arrival repair, fresh independent R10, combined build/SSR and live acceptance. No new EN/AR visual/moving parity, presented FPS, performance gain or source-wide recovery claim is made. **Report and probe evidence are frozen for handoff; no further execution is authorized.**
