# Editorial route handoff — independent code review R8

Review date: 2026-10-28. Reviewed HEAD is `7d22e96754845c4ce1a3d7658649a3aba93f097e`, plus the frozen uncommitted route integration and final R6/R7 repairs described in `implementation-r7-repair.md`. **Three actionable P2 lifecycle defects were reproduced in the actual mounted controller. No P1 was established.** The original R6/R7 regressions pass; the findings below extend their traversal, suspension and physical-owner boundaries.

This reviewer changed only this report and ignored evidence under `.artifacts/pages-parity-20261028/route-review-r8/`. Application code, existing tests, packages and prior review reports were not edited. No delegation, staging or commit occurred. Root owns repair and fresh R9, combined checks/build/SSR and live acceptance. Projects content is excluded; its unclaimed navigation remains part of the shared boundary.

## P2 — A pending history Forward followed by Back still takes the physical same-path shortcut

**Location:** `src/components/layout/route-surface/route-surface.animate.ts:249`–253. The exception to the physical same-path shortcut requires `pending.kind === "push"`. A pending history transaction can have the same selected-destination/retained-origin split.

**Exact mounted reproduction:** `route-adversarial-probes.ts`, group `pending-history-forward-back`.

1. Connect Vision at1700 and activate Services. Finish cover so Services URL/state are selected, but do not install Services DOM. The outgoing Vision checkpoint is1700.
2. Back to Vision and advance40ms. R7 correctly restores1700 on the still-connected Vision owner; this is asserted before proceeding.
3. Forward to the pending Services entry and advance40ms without installing Services. The new history transaction waits while Vision remains the retained physical owner.
4. Inject a60px native clamp and dispatch scroll. Back to the original Vision entry, then advance600ms and dispatch pagehide.

The second Back encounters `selected.owner.path === parsed.path`, but the exception rejects its pending **history** transaction. `identify(owner)` adopts60. Pagehide then overwrites the valid1700 record with60. Available- and denied-storage cases both fail; their unclamped controls retain1700.

```json
{"case":"pending-history-forward-back","denied":false,"clamp":true,"expected":1700,"afterBack":60,"inlineAfterPagehide":60,"storedAfterPagehide":60,"phase":"idle","scrollCalls":["scroll:1700"],"hard":[],"frames":0,"timers":0}
```

**Minimal fix contract:** Classify traversal against the previous logical browser selection independently of the retained physical owner, including an uncommitted history Forward. A real return to a known exact editorial entry must restore that entry's checkpoint even when its DOM never left. Do not merely broaden every same-path traversal: retain unknown-entry, query/hash, unchanged-selection and native controls; do not add a HOME pixel writer, focus, timer or frame owner. Preserve the pending target until application and the R6 supersession/capture checks. Add a positive Back→Forward→Back regression before Services adoption, with storage available/denied and the unclamped control.

## P2 — BFCache before restoration applies forgets the protected target and later corrupts it

**Location:** `route-surface.animate.ts:260` cancels the active transaction after capture; `:270` resumes by discarding `selected` and waking the idle path. That idle path at`:141` identifies the current pixels without recovering the canceled history target.

**Exact mounted reproduction:** `route-adversarial-probes.ts`, group `bfcache-history-before-apply`.

1. Save Vision1700, push Services and leave its owner pending as above.
2. Inject scroll125 and an actual fixture document extent of125. Back to Vision and advance40ms. The controller adopts the history owner but correctly waits because1700 cannot yet fit; no restore scroll occurs.
3. Dispatch pagehide. The protected stored/inline boundary remains1700 at this point. Dispatch `pageshow` with `persisted:true`, advance40ms, enlarge the document to a28000px scroll extent, call the ordinary controller update and advance600ms.
4. Dispatch another pagehide.

Resumption remains idle at125 despite sufficient geometry. It has no pending work capable of applying1700. The second pagehide now considers125 live and replaces1700 in storage and inline state. Denied storage has the same inline corruption. A separate control lets restoration finish before pagehide and correctly retains1700 across BFCache.

```json
{"case":"bfcache-history-before-apply","denied":false,"hideBeforeApply":true,"expected":1700,"afterResume":125,"beforeResume":1700,"inlineAfterPagehide":125,"storedAfterPagehide":125,"phase":"idle","scrollCalls":[],"hard":[],"frames":0,"timers":0}
```

**Minimal fix contract:** Preserve a suspended, unapplied editorial history intent across pagehide, scoped to its exact selected URL/entry and physical-owner policy. On persisted pageshow, reconcile that intent with the currently selected owner and usable geometry before adopting transient pixels. Cancel it if another selection supersedes it. Resume through the existing bounded restoration mechanism, without replaying initial entry or focusing history. Preserve ordinary BFCache visits that already completed and native/unknown/hash paths. Add positive tests for suspension before application, geometry becoming sufficient after resume, subsequent pagehide persistence and denied storage.

## P2 — Physical replacement during reveal bypasses owner reconciliation and loses the restored checkpoint

**Location:** `route-surface.animate.ts:143` returns whenever phase is not `waiting`, so the physical-owner replacement handling at`:154`–159 cannot run during reveal. `finish()` at`:127`–136 still holds the removed owner; subsequent idle identification adopts the replacement's transient pixels. The registry's new physical publisher also has not inherited this history arrival's claim.

**Exact mounted reproduction:** `route-adversarial-probes.ts`, group `history-physical-owner-replacement`.

1. Save Vision1700, complete Services arrival and sample Services940.
2. Back to Vision using its saved state. Install a new Vision physical owner, allow the controller to adopt it, then publish ready. Assert1700 was applied and phase is `revealing`.
3. Before the380ms reveal completes, install a second Vision main/inner owner at the same URL/entry and inject125px. Allow its ordinary update before publishing ready; then advance600ms and dispatch pagehide.

The replacement is never restored. Final and persisted pixels are125. Its registry starter receives `false`, whereas the equivalent replacement **while still waiting** receives history skip `true` and restores1700. This is a registry argument observation; the fixture does not claim that a real page visibly replays entry at125, where its own deep-entry threshold can also skip.

```json
{"case":"history-physical-owner-replacement","replacementDuringReveal":true,"expected":1700,"afterReplacement":125,"starts":[false],"storedAfterPagehide":125,"phase":"idle","scrollCalls":["scroll:0","scroll:1700"],"hard":[],"frames":0,"timers":0}
```

**Minimal fix contract:** Reconcile physical-owner replacement before restricting updates to the waiting phase. Transfer the existing arrival/history-skip decision to the current inner owner, invalidate the old owner's restore completion and apply the retained target to the new ready owner. Ensure an early replacement publisher cannot autonomously consume the managed arrival before that transfer. Final completion/focus must validate the current main and inner owner. Use existing finite work and deadlines; do not replay the history entry, add history focus or change HOME's completed semantic phase. Add positive replacement-during-reveal coverage alongside the passing replacement-before-reveal control.

## Root-requested async-selection seam — reproduced injection, ungraded reachability

`route-adversarial-probes.ts`, group `async-selection-before-observation`, uses `deferPushSelection:true`. The push returns at Vision; after cover, the fixture selects Services URL/state **without any DOM mutation or surface update**, then immediately traverses Back. `pending.destination` remains null, so the unchanged-selection early return compares Back against `pending.origin`. Eight seconds later, the stale request hard-assigns Services. The observation control calls `controller.update()` after Services selection and restores1700 with no hard assignment.

```json
{"case":"async-selection-before-observation","observeSelection":false,"afterBack":125,"phase":"idle","hard":["/en/services"],"frames":0,"timers":0}
{"case":"async-selection-before-observation","observeSelection":true,"afterBack":1700,"phase":"idle","hard":[],"frames":0,"timers":0}
```

This proves the controller's behavior under the injected ordering, **not that an ordinary Next Vision→Services commit exposes that ordering**. Installed `app-router.js` writes history in HistoryUpdater's insertion effect (`:74`–114), renders it alongside route content (`:433` onward), and registers popstate without capture (`:315`). A synchronous commit that mutates body DOM delivers its MutationObserver microtask before a later native Back task; that can close the no-observation gap. No browser/runtime experiment here establishes a cross-route URL-only commit with no wake. This seam is therefore not a fourth graded P2. A fix must retain the valid still-at-origin pending-push/no-op control and its one-shot8000ms watchdog.

## Independently verified repairs and scope

The scoped suite passed **141 tests, 0 failed,3832 assertions across10 files**. This includes the final R6/R7 mounted groups: unclaimed Projects/hash supersession, origin/destination ID and optional native-entry-key changes, cover/commit/watchdog rechecks, exact path/entry/main/inner capture guards, clamped first pending-origin Back, known different same-owner entries, unknown/query/hash/no-op controls, ordinary rapid traversal with eventual owner adoption, storage denial and completed BFCache restoration. The new adversarial probe separately confirms a valid request that remains selected at origin still hard-falls back once at its deadline. The three findings concern intervals the retained positive groups do not cover.

Entry/publisher, Vision/Services, Contact and Header fixtures pass held/released/consumed entry, late/failure readability, direct minimum, geometry versus first-presentation readiness, history skip, cancellation/disposal, finite Contact completion, covered-menu shell ownership and lock/focus ordering. The source sine/profile clock, native modifier/download/external/target exceptions, bounded prefetch and lack of routine editorial history writes remain covered. Header and shared body interception were also inspected against installed Next's `defaultPrevented` Link handling and the accepted HOME document-capture order.

The HOME pure selector remains unchanged. Its actual navigation suite passes the narrow fresh editorial HOME push/history adapters together with accepted semantic locale precedence, physical-owner guards, completed restoration phase and native-write-budget controls. No new HOME restore writer or Storio/frame policy was introduced by this review.

The committed `8666e55` Footer failure/lifetime repair and `7d22e96` gutter repair remain present. The actual Footer lifecycle/failure tests and the four actual-parent Services CSS/source-gutter tests pass in this run. The retained failed-context latch restores readable DOM and prevents later reactivation; shared server CSS supplies EN5.3/7/7vw and AR6/6/6vw. These are regression checks, not fresh rendered EN/AR visual acceptance. The source `data-route-focus` marker and narrow global focus rule remain present and the destination marker assertion passes.

Read `AGENTS.md`, loading, code-splitting, animations, viewport design, editorial architecture, route source contract, HOME navigation contract, the full R6/R7 reports, implementation handoff and both repair notes. Inspected installed Next16.4.3 guides/runtime and cached source module61157 before routing assumptions. Content remains in server compositions; the route surface is transparent/noninteractive before enhancement, controllers remain deferred, and the registry owns no RAF. The fixed1920×1080/768×1024/412×915 width-only policy, Bouthouri identity, custom scroll/Storio architecture and Projects exclusion were preserved.

## Execution, evidence and limits

No test, transpilation, fixture execution, decoder, build, server or browser work occurred during the initial CPU hold. Probe source was authored using light file operations only. After root's explicit `MEASUREMENT_CLEAR R8 NOW`, executed exactly:

```sh
bun .artifacts/pages-parity-20261028/route-review-r8/route-adversarial-probes.ts

bun test tests/route-handoff.test.ts tests/route-surface.test.ts tests/home-navigation.test.ts src/sections/contact/1-conversation/contact.animate.test.ts src/sections/services/services.animate.test.ts src/sections/vision/vision.test.ts src/components/layout/header/header.logic.test.ts src/components/layout/header/menu-timeline.test.ts src/components/layout/footer/footer.logic.test.ts src/sections/services/services-css-profile.test.ts
```

The13 probe cases completed in about0.63s; the scoped suite reported5.73s. Raw artifacts:

- [Exact probe source](../.artifacts/pages-parity-20261028/route-review-r8/route-adversarial-probes.ts)
- [All13 raw JSON records](../.artifacts/pages-parity-20261028/route-review-r8/route-adversarial-probes.jsonl)
- [Probe stderr](../.artifacts/pages-parity-20261028/route-review-r8/route-adversarial-probes.stderr) (empty)
- [Scoped suite log](../.artifacts/pages-parity-20261028/route-review-r8/scoped-tests.log)

The adversarial script intentionally asserts the observed failure outputs and their controls; its exit0 establishes reproduction, **not repair**. It reuses only inert DOM/clock adapters from the existing test prefix, evaluating the actual `mountRouteSurface` and actual registry. Clamps, shortened extents, owner replacements and lifecycle events are explicitly injected. These are mounted-controller counterexamples to the required lifecycle contracts, not browser measurements or attribution of native clamp causes.

Both processes exited before `ACK NOCPUJOBS`; all probe cases explicitly report zero remaining frames/timers. After that acknowledgement, only this report was edited. No broad check, lint, TypeScript/typegen, build, package operation, browser/OS call or server management was performed. Root reports its own R7-snapshot plain TypeScript/whitespace checks passing; that is root evidence. The running `yWFD32LNWavnwkZN_JMni` production predates R7 and supplies no acceptance for this snapshot. Browser-native history ordering, complete EN/AR screens/moving comparisons, source asset presentation, live SSR/degraded-mode behavior and fresh build acceptance remain root/visual-reviewer owned. No FPS, performance improvement or full parity claim is made.
