# Route reveal clock audit — R4

2026-10-28. Independent focused source research for Vision/Services/Contact.
Reviewed frozen candidate `f98957df5e282097dd6435b7595a5cb4fbe2910f`, BUILD
`xqr5J4NXtkoga9N948wij`. This audit establishes a clock-sampling difference;
it supplies no live parity, presented-frame or FPS verdict. Only this document
and [route-clock-r4](../.artifacts/pages-parity-20261028/route-clock-r4/) were
authored. Root owns implementation and mounted-controller verification.

## Conclusion

The installed route starts a finite segment with `performance.now()` but uses
the supplied RAF timestamp for subsequent progress. The actual cached source
GSAP ticker reads `Date.now()` inside its callback and ignores that supplied
timestamp. Local `performance.now()` and native RAF timestamps share a time
origin while sampling different moments. A delayed callback can therefore apply
a different opacity under the local expression. This is an authored sampling-contract difference established
independently of MutationObserver delivery.

The source also anchors a fresh route tween to its current parent `_time`.
Consequently changing the local sample to callback wall time addresses the
sampling difference without reproducing every source parent phase, interposed
task cost, sleeping wake or long-stall behavior. No evidence here establishes
that the difference caused R3's visible observation, or that its correction
will produce more partial reveal frames. Do not stretch130ms to compensate for
missed opportunities.

Root has selected only the narrow callback sampling correction described below.
No application file was changed by this reviewer, and the forthcoming mounted
golden/full validation belongs to root.

## Primary source and exact route path

Read the [original route contract](editorial-route-handoff-source-contract.md),
[R2 production report](pages-full-production-review-r2.md),
[R10 route review](pages-route-fallback-code-review-r10.md),
[R13 background review](pages-persistent-background-code-review-r13.md),
[HOME R14 clock work](home-clock-alignment-r14.md), and their relevant cached
source/fixture files. R6–R9 ownership findings stay closed within R10's stated
scope; unsupported boundary challenges are not reopened.

The primary route source is module61157 in
[2gz902oulp4x8.js.pretty](../.artifacts/viewport-validation-20261028/source-runtime/2gz902oulp4x8.js.pretty).
Its reveal path is the readiness function `D`, including the two-observation
`routeSettled` guard. It removes `D` from the GSAP ticker, restores outgoing
opacity, starts entry, sets `revealing`, creates `{p:0}`, calls `H(0,true)` and
constructs a **fresh** `i.default.to(t,{p:1,...})`. Reduced duration is`.13`,
mobile`.3`, otherwise `ROUTE_TIMING.reveal`; easing is`"sine.inOut"`.
Cover similarly starts `{p:0}`, calls`H(0)`, and uses a fresh tween with
`.12/.25/.30s`. There is no route `quickTo`, `resetTo` or retargeted smoothing
tween. HOME's explicit-FROM/resetTo policy is not the route contract.

`D` is registered after the existing root-update listener and ordinarily starts
reveal in ticker dispatch after the root has advanced. `Y` also calls `D()`
directly, so source code alone does not entitle every reveal invocation to a
perfectly current parent. Cover is constructed in the click handler and can
start between root ticks. Work within a ticker dispatch can also separate
parent update and tween construction.

Module74812 in
[0or6--g23od4n.js.pretty](../.artifacts/viewport-validation-20261028/source-runtime/0or6--g23od4n.js.pretty),
lines193–206, clamps its **already-eased** input and computes cover as`p` or
`1-p`, content as`1-.18*cover`. The installed
[routeFrame/routeDuration](../src/lib/navigation/route-navigation-state.ts)
puts the same sine-in-out equation inside `routeFrame` and retains correct
reduced120/130ms. There is no supported duration/easing defect.

The actual GSAP3.15.0 core is module32919 in
[244pluf-w83n0.js](../.artifacts/viewport-validation-20261028/source-runtime/244pluf-w83n0.js).
The fixture asserts SHA-256
`e1899cd720c6c19111d45a94334434ebb3fd826e1cdb191dda8b312e17b0fef8`.
`/tmp/gazzar-runtime` was absent; the retained primary cache was used directly.
Searchable exact symbols in this one-line cached core establish:

- `eD=(f=Date.now,c=500,p=33,...)`: internal callback `y=function t(e)` reads
  `f()-d`; its RAF argument is forwarded to listeners as metadata, not used as
  progress time. Callback intervals above500ms or below0 adjust the ticker
  epoch to consume33ms by default.
- `updateRoot` calls `tS(w,tH(t,w))` with ticker time. `tS` performs lazy-queue
  flushes around render; an ordinary lazy property initialization need not add
  a separate RAF. Source callback computation can precede its actual DOM write.
- `i.to=function(t,e){return new i(t,e,arguments[2])}` constructs the fresh
  tween. Constructor `tJ(k,e(_),n)` inserts it; `tJ` chooses `t._time` when
  attaching to the root with no explicit position. Tween render applies
  `this._ease(i/p)` before its `onUpdate`.
- Base animation construction wakes a sleeping ticker before insertion. That
  wake can synchronously update the parent using the real500/33ms smoothing.

## Controlled actual-core result

The [final fixture](../.artifacts/pages-parity-20261028/route-clock-r4/route-clock-source-r3.mjs)
runs only this cached core in a VM, with controlled `Date.now`, one fake RAF
queue and explicit task costs. It invokes the **real internal ticker RAF
callback**, forwarding adversarial supplied timestamps; it does not use
`ticker.tick()` or manually assign parent time. Timers would throw. Plain
object targets require no DOM/CSS plugin. The source uses its actual default
500/33ms lag smoothing. An inert listener prevents automatic sleep in the
awake schedules; explicit sleeping-wake coverage is separate.

The two local columns evaluate the installed time expression and its proposed
callback-wall substitution directly. They are not a mounted controller.
Source property writes round to six decimal places; mathematical comparisons
allow half a last-place unit. All seven finite schedules passed, each source
tween completed once, and each controlled RAF queue was empty after cleanup.
See [raw results](../.artifacts/pages-parity-20261028/route-clock-r4/route-clock-source-results-r3.json)
and [successful log](../.artifacts/pages-parity-20261028/route-clock-r4/fixture-r3.log).

1. **Reveal created within ticker:** start parent/wall32ms. Callback wall50,
   RAF48: source cover`.953437`; coherent wall`.953437180`; current supplied
   stamp`.963087324`. With the other listed modest delays, coherent wall matches
   actual source within source rounding. At wall162/RAF160 source and wall are
   complete; the supplied-stamp curve has`.000583887`cover remaining.
2. **Between-tick cover:** previous parent32, creation wall37; callback
   wall64/RAF48. Source cover`.165435`, coherent wall`.119797017`, current
   stamp`.020590133`. Removing stale sample lag does not remove the separate
   five-millisecond source parent-start phase.
3. **R3-shaped hypothetical delay:** normalize inferred local start9997 to32.
   First callback wall112/RAF65.58 yields source cover`.322698`, coherent
   wall`.322697556`, current stamp`.844206503`. Next wall128/RAF114.92 yields
   `.159492/.159492071/.290176464`. Remaining supplied-stamp partial values
   reproduce approximately`.125584419/.024025678`. Both modeled paths finish
   at wall166 under this schedule. The first callback still arrives80ms after
   start; callback-wall sampling advances its pose and does not create missed
   opportunities. These wall inputs deliberately use R3's **observer delivery**
   sequence as a hypothetical dispatch schedule; they do not recover the actual
   browser writer or source parent start.
4. **Stamp precedes fresh start:** creation wall49 after parent32; callback
   wall62/RAF48. Current stamp remains full cover1; coherent wall has cover
   `.975528258`; source, with the earlier parent anchor, has`.874255`.
5. **Cost between parent and creation:** a preceding ticker listener consumes
   46ms after parent32; creation is wall78. Next wall96/RAF80 gives source
   cover`.512082`, coherent wall`.953437180`, stamp`.999416113`. Even coherent
   segment wall time cannot reproduce this earlier source parent anchor.
6. **Sleeping wake:** sleep after parent32, construct cover at wall2000.
   Actual source wake/START becomes65ms. Callback wall2016/RAF2000 gives
   source cover`.043227`, coherent wall`.043227271`, stamp0. Relative elapsed
   agrees without sharing an absolute GSAP epoch.
7. **Awake stall above500ms:** parent/start32, next callback wall800/RAF784.
   Actual source parent becomes65 and reveal cover is`.849256`; both uncapped
   local formulas complete. This is a proven boundary of the proposed narrow
   correction. Adding global lag smoothing was not selected or authorized.

## Minimal correction contract

In the inspected
[animate function](../src/components/layout/route-surface/route-surface.animate.ts),
start is one `win.performance.now()` sample and initial `tick(start)` applies
the exact starting pose synchronously. Retain that. Only the subsequent
callback should invoke `tick(win.performance.now())`, ignoring the supplied RAF
stamp. A stable callback wrapper is sufficient; no additional scheduler or RAF
owner is needed.

Retain `from + elapsed/duration`, the existing clamp,120/130ms reduced and
ordinary profile timings, and the single sine evaluation. In particular:

- Preserve stored **linear reveal phase**, presentation generation, selection
  guards, settlement/cancellation, owner replacement, restoration and suspension
  semantics. Do not restart a resumed reveal from opacity1 or re-ease from its
  displayed opacity. The fixture's separate arithmetic check from phase`.4`
  gives cover`.654508497`at resume,`.206107374`39ms later,0 at78ms; it is not a
  mounted R10 revalidation or source retarget claim.
- Keep the initial segment anchor. Rebasing at first delayed callback would
  grant a new duration after task cost and is not this source-supported change.
  Sample callback wall time once at callback entry; do not add catch-up writes,
  synthetic frames, a shared ticker or a second loop.
- Preserve custom engine/Storio, SSR copy, fixed-vw composition, finite ownership
  and cleanup. Do not add GSAP to the application or tune constants from the
  finite R3 sample counts.

Root separately reports an actual mounted delayed-callback golden whose
before-fix failure retained`.8442065`cover versus the source-supported`.322698`.
After the selected correction, root reports106focused tests/1,930assertions
and full364tests/15,615assertions plus lint/types/architecture passing. Build was
ongoing at this handoff. These are **root-reported post-release implementation
results**, not execution or results of this independent seven-schedule fixture.
The changed candidate was unserved within R3's frozen review scope and receives
no retroactive visual acceptance from those checks.

## R3 observation remains open

[R3 fits](../.artifacts/pages-parity-20261028/full-review-r3/reduced-attribution-fits.json)
retain source seven interior observations: wall fit130.856ms/RMS`.276`,
last-observed-stamp fit132.289ms/RMS`.937`. Local four: supplied-stamp
fit129.999884ms/RMS`.000033`, observer-wall fit65.2785ms/RMS3.758.
[Source raw trace](../.artifacts/pages-parity-20261028/full-review-r3/source-reduced-raf-mo-en-desktop.json)
and [local raw trace](../.artifacts/pages-parity-20261028/full-review-r3/local-reduced-raf-mo-en-desktop.json)
retain original forwarded callbacks/stamps and observer oldValues. Local
last-stamp-to-delivery gaps vary approximately46→13→13→5ms. Last observed RAF
is not automatically the writer; observer delivery is not automatically actual
write or paint. These facts do not entitle dismissing the observation as an
observer artifact.

The complete final [R3 report](pages-new-production-review-r3.md) and
[final manifest](../.artifacts/pages-parity-20261028/full-review-r3/final-review-manifest.json)
were read after the earlier forwarded disposition. The manifest records
finalization2026-10-28T19:57:23.248999Z and report SHA-256
`3f8379c2fa5e3ffda9d381bf81470b50d7c879f7d4fb0c0a2dfc23fd7cfc0dec`;
that hash is attributed manifest metadata, not a new hash job by this reviewer.
The paired6s clips and dense
original-PTS30fps42-frame windows show source partial→full over two encoded
33.3ms intervals and local over one. There is only one dense paired visible
control, no direct opacity-write timestamp and33.3ms quantization. Native
OS/CSS preference remained false; the reduced branch used a JavaScript
MediaQueryList getter simulation only. The failed CSSStyleDeclaration
opacity-descriptor probe is excluded and was reloaded; it supplies no evidence.

The categories therefore remain distinct: **(a)** source/fixture prove an
authored sample-clock difference; **(b)** MO delivery can affect wall fitting
but is not established as the cause; **(c)** startup/interposed task cost can
reduce available samples with an otherwise correct curve; **(d)** CPU models
cannot establish presented frames or whether the selected correction resolves
R3's visible observation. A source-supported code correction and an unresolved
same-experience limit can both be true.

Final R3 closes the old F1/F2/F3 triggers only for its named controls: Arabic
Services masks/all11rows at three profiles; inherited450weight/fragments and
the old Vision mobile wrap; actual AR history and EN HOME canvas/context/clock
retention. It established no new ordinary-body P1/P2. Its13fresh ordinary
contexts, six hash-supported old EN compact body contexts and named targeted
controls do not certify all fresh cold entries, field-content identity, every
history sequence or whole same-experience parity. The report explicitly keeps
reduced reveal unresolved and excludes root's post-release sampling correction.
Nothing in this audit broadens those closures or overrides that disposition.

## Execution and failure provenance

CPU HOLD was respected during source reads and fixture authoring. Root granted
each of the following commands individually after R3's explicit release.
Every process exited before a direct parent `ACK NOCPUJOBS`; no job remains.

```sh
node .artifacts/pages-parity-20261028/route-clock-r4/route-clock-source.mjs > .artifacts/pages-parity-20261028/route-clock-r4/fixture.log 2>&1
node .artifacts/pages-parity-20261028/route-clock-r4/route-clock-source-r2.mjs > .artifacts/pages-parity-20261028/route-clock-r4/fixture-r2.log 2>&1
node .artifacts/pages-parity-20261028/route-clock-r4/route-clock-source-r3.mjs > .artifacts/pages-parity-20261028/route-clock-r4/fixture-r3.log 2>&1
```

The [first script](../.artifacts/pages-parity-20261028/route-clock-r4/route-clock-source.mjs)
and [first failure log](../.artifacts/pages-parity-20261028/route-clock-r4/fixture.log)
remain unchanged. Exit1 at line130: a supplied-stamp endpoint assertion was
false. The stamp-precedes-start schedule ended at RAF176 after wall start49,
only127/130ms. No results JSON was written. Root was informed before correction.

The [second script](../.artifacts/pages-parity-20261028/route-clock-r4/route-clock-source-r2.mjs)
and [second failure log](../.artifacts/pages-parity-20261028/route-clock-r4/fixture-r2.log)
also remain unchanged. It added only the approved endpoint sample, diagnostic
labels and unique output filename. Exit1 named the cost schedule's supplied
stamp endpoint: RAF192−start78=114/130ms. A light review also found the later
sleeping-wake schedule ended at112/120ms. Root was informed before correction.

The final script added only the two approved endpoint samples and unique result
filename. Exit0; seven cases passed, audited core hash matched, pending fake
RAFs0. The two earlier failures are fixture schedule omissions, not application
or cached-core failures. They are retained rather than silently repaired.

No application/existing-test edits, browser/OS operations, packages, lint,
transpilation, other tests, broad checks, build, server or git mutation were
performed. Subsequent work was only light reading, reporting and direct parent
communication. No delegation occurred.
