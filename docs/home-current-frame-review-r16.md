# R16 independent code review: current-frame background ownership

Reviewed application commit `1ebf932` with documentation HEAD `149cd32` on
2026-10-27. The review began while the same application changes were uncommitted;
the frozen commit contains the reviewed implementation.

## Result

**No concrete P1/P2 finding identified within this read-only code review.**
There is no code-review blocker to report for this ownership handoff. This is
not production phase/count acceptance, presented-FPS evidence, or full HOME
EN/AR appearance, motion, interaction, or smoothness acceptance.

## Integration examined

- `src/sections/landing/3-journey/journey.animate.ts:148–179`: the actual parent
  tick scopes sampling and publication as authoritative; stage presentation,
  optical presentation, work, systems and controls precede `journey-frame`.
  The first request announces ownership before registering its RAF. Subsequent
  unfinished ticks retain ownership rather than briefly waking a competing
  background callback between frames.
- `src/sections/landing/2-story/story-environment.animate.ts:64–78,130–134,156–167`:
  ownership acquisition parks both the independent RAF and timer, preserving
  the previous draw timestamp and field history. Independent wakeups yield
  while the parent is pending. The authoritative frame event consumes its
  precise score and updated work travel synchronously; that draw does not
  schedule an independent tail while owned. Settled release wakes the existing
  scheduler for the next frame.
- `src/sections/landing/3-journey/journey.animate.ts:163–242,279–310`: final
  settlement, hidden pause, snap/measurement/restore, mode teardown and disposal
  release ownership. Synchronous snaps publish through the existing coalesced
  demand path. I traced the real restore caller in
  `src/lib/navigation/home-navigation.ts:271–329` and the two-pass mode-position
  adjustment, rather than assuming all publications originate in the tick.
- `src/sections/landing/3-journey/journey-render-owner.ts:5–41`: ownership is
  per-stage and current-mount guarded. An obsolete handle cannot clear or render
  through a replacement. The rendering flag unwinds in `finally`; the helper
  has no scheduling, clock, DOM-attribute, or React-state ownership.
- `src/sections/landing/2-story/story-environment.animate.ts:173–216` and
  `story-scene-gate.tsx:37–88`: hidden/menu/offscreen/context-loss gates still
  prevent draws; resumption either waits for the pending parent or wakes the
  independent scheduler. A background arriving after ownership acquisition
  checks the shared owner before its initial wake. The gate retains latest-mode
  and cancellation checks across idle startup and imports.
- Background time integration, travel deltas, pulse/stroke histories, field
  allocation/clear rules, reduced-mode score selection and pointer advancement
  were inspected for handoff interactions. Parking does not invoke the
  timestamp-resetting cancellation path or replace the field. No concrete
  ownership-triggered history reset or additional scheduler was found.

## Evidence and limits

Read the implementation, changed tests, adjacent lifecycle/caller code, project
loading/ownership guidance, and R15's recorded actual-uniform phase evidence.
The recurring-tick harness covers queued-tail preemption, repeated changing
forward/reverse scores, one background draw/field advance per synthetic parent
tick, retained material-time increments, hidden gating and release. Separate
helper tests cover replacement and rendering-scope unwinding. These assertions
were read, not executed; they do not substitute for actual journey/browser
integration or prove production callback timing.

No application edits, tests, lint, type generation, checks, build, packages,
commits, browser/app operations, probes or server/process actions were performed.
The only review write is this file. Root-reported validation and the separate
R16 LIVE review remain independently owned evidence.
