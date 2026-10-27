# HOME clock alignment — R14

Implementation candidate, 2026-10-27. The whole-experience smoothness defect in
[the user review](home-smoothness-user-review-r13.md) remains **open**. This change
addresses the clock contract established by [R13](home-smoothness-audit-r13.md).
Passing offline goldens cannot establish presented FPS, physical input latency,
or a cure for early-story/footer callback gaps. Root owns production rebuild,
full validation and source/local reprofiling after this implementation freezes.

## Source contract

The source hero calls `w(e.progress, l.progress)` with `.1s / power2.out`
(`2gz902oulp4x8.js:4787–4828`, pretty lines 504–505). Its explicit FROM is the
displayed **raw trigger input**. `resetTo` aligns START with its smooth parent's
last tick. While awake, an input receipt does not advance that parent.

The source ticker reads `Date.now()` inside its callback; it ignores the RAF
timestamp. Local hero previously started at input `performance.now()` and
sampled the RAF timestamp. Inputs arriving after that stamp could repeatedly
produce zero advancement. R13 recorded this applied-pose stall under controlled
synthetic input; the private live source parent/resetTo timestamps were not
available. The cached-core experiment independently establishes the contract.

ScrollTrigger module 43340 (`2mptg809nyngd.js`) pre-renders its scrub tween at
`j._dp._time - j._start` before `resetTo`, whose explicit FROM follows that
pre-render. Local journey previously pre-rendered at input wall time. The R10
goldens manually advanced the parent on input, obscuring both START differences.

With target 1 at 0, tick 10, target .6 at wall 25, tick 40:

| Raw input | Cached source | Previous local |
| --- | ---: | ---: |
| Hero FROM at 25 | .271000 | .271000 |
| Hero START at 25 (ms) | 10 | 25 |
| Hero sample at 40 | .487153 | .397953 |
| Journey sample at 40 | .297035 | .359473 |

## Owner and clock responsibilities

Each helper now retains a parent timestamp separately from the monotonic wall
time ledger. The existing owner calls `sample(callbackWallTime)` to advance the
parent. Retargets while awake retain the last parent timestamp, even with
multiple inputs, reversal or delayed callbacks between ticks. Hero retains its
explicit displayed FROM; journey pre-renders at parent time. Raw hero smoothing
still precedes the nonlinear EN/AR world mapping.

`wake(now)` rebases an idle owner's epoch once; `sleep()` reports that the owner
has stopped. Retargeting also wakes an idle helper, so the first new target
cannot inherit an ancient START. The next input while awake retains that wake
anchor. These methods schedule nothing. Hero reports idle when its existing
owner stops; journey reports idle on settlement and after a refresh/restore
snap. Hero samples `performance.now()` at its existing world-update call site;
its other entry/marquee/magnet timing remains under the existing owner.
The hero sampler returns its exact target at 100ms, avoiding a floating-point
remainder that could keep the owner's equality-based settling check awake.

The sleeping source case was investigated separately using the actual core
with **default** 500ms/33ms lag smoothing. `resetTo` first wakes the ticker; wake
can advance the root synchronously. The explicit FROM argument was evaluated
before that wake. After a completed .3 tween at parent 480ms, sleep and target
.1 at wall 2000, source parent/START are 513ms, not 480 or 2000. Another target
.2 at wall 2007 retains START 513; callback wall 2016 samples 16ms after START.
Local uses a monotonic 2000ms wake epoch and the same 16ms elapsed interval. It
does not reproduce the source's absolute ticker epoch or create a shared global
ticker. Idle wake and short awake callback delays have separate goldens; awake
stalls above the source's 500ms lag threshold are outside this comparison.
Liveness describes each existing local owner, rather than reproducing GSAP's
global auto-sleep policy or its other listeners. If the source global ticker
remains awake while a local owner is idle, its first returning target can have
a different anchor phase. Root's focused repeat should check reverse re-entry
as well as sustained input; these goldens cannot settle that live distinction.

Refresh/restore still replace the displayed value immediately with no tail.
Hero's menu resume retains its displayed FROM and starts a fresh 100ms segment;
visibility resume now uses that same path to avoid consuming a hidden interval.
Journey retains its visibility pause's elapsed phase. Its source 480ms Expo.out
curve, target-story-time >=270 immediate completion and reverse return to scrub
remain intact. No content, layout or loading boundaries change.

## Reproducible fixtures and validation

`tests/fixtures/home-clock-source-r14.mjs` evaluates only the actual cached
GSAP 3.15.0 core with fake `Date.now`, inert timers and explicit actions. It
imports no project implementation. It asserts the audited SHA-256
`e1899cd720c6c19111d45a94334434ebb3fd826e1cdb191dda8b312e17b0fef8`
and writes `home-clock-source-r14.json` beside itself. Regenerate with:

```sh
node tests/fixtures/home-clock-source-r14.mjs /tmp/gazzar-runtime/244pluf-w83n0.js
```

The checked-in outputs cover between-tick input, repeated before-RAF receipts,
multiple events per tick, reversal, callback delay, pre270 continuous input,
settled and unfinished idle wake, and awake/idle refresh. A journey-specific
fixture executes the source's `.progress(1)` completion across the 270 cutoff
and reversal. Both project helpers are compared against these independent
outputs. Source property writes round to six decimals; the helpers retain full
precision and the comparisons allow accumulated rounding below two raw-input
quanta. Existing exact curve/map, restore and pause tests remain applicable.

After root released the unchanged-production foreground baseline:

- Fixture generation passed: 21 cached-core schedules, audited SHA verified.
- `bun test src/sections/landing/1-hero/hero-world.test.ts tests/journey.test.ts`:
  41 passed, 0 failed, 2596 assertions.
- Scoped ESLint on the two helpers, their tests, both controller integration
  files and the fixture generator passed. Scoped `git diff --check` passed.
- Plain `bunx tsc --noEmit --incremental false` reported one out-of-scope error:
  `src/components/layout/header/header.logic.ts:604`, TS18047, `chapter` possibly
  null. No clock-file errors were reported. The header owner/root must resolve
  this before full validation.

Implementation and scoped checks are frozen. No install, Next typegen, full
check, build, server/process operation, browser call or commit was performed.
Production validation and whole-experience acceptance remain with root.

Root's subsequent combined freeze passed ESLint, Next type generation,
TypeScript and176 tests/4,460 assertions. The reported transient header
nullability error is absent from that final snapshot. Production rebuild,
matched reprofiling and fresh visual acceptance remain required.
