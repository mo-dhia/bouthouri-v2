# User smoothness review — R13 follow-up

Reported by the user on 2026-10-27 while the reading portrait lifecycle work
was in progress. This is a required experience defect to address, independent
of the earlier moving-video comparisons.

## Reproduction and symptom

The user explicitly clarified: **the hero is only an example**. The defect's
scope is smoothness across the entire experience, not an isolated navigation
animation. The hero departure is one useful reproduction point, not the limit
of the investigation or acceptance criteria.

On the ordinary motion HOME hero, begin scrolling away from the landing
section. The top language/menu navigation row moves upward and becomes hidden.
The user experiences this departure as laggy, nearly flickering, and less smooth
than the original. They also report a broader feeling of animation/scroll
stutter; they have not asserted a measured FPS or identified its cause.

Reported element:

```text
div.AKSpna_navLayer > div.AKSpna_navWindow.AKSpna_languageWindow
  > div > div.AKSpna_navControl > div.AKSpna_menuAndLanguage
```

Stable selectors: `[data-nav-layer='hero']`, `[data-hero-nav-window]`, and
`[data-nav-control='language']`.

## Required follow-up

Continue the current portrait implementation without interrupting its ownership.
After its code freeze, profile the complete forward and reverse HOME journey
against the original using the existing Vawzen pair, including sustained input,
stops, immediate reversals, and chapter transitions. Use the navigation exit as
one focused reproduction within that whole-experience assessment.
Measure actual update and presentation cadence,
long tasks/style/layout cost, event/RAF ordering, and repeated writes or competing
owners. Test continuous small input, stopping, and immediate reversal through
the exit. Determine whether the defect is scheduling, main-thread work,
compositing, input handling, or another measured cause before changing easing
or adding smoothing.

Prior 30fps recordings and 4fps review sequences do not rule out this report.
RAF spacing alone does not prove presented-frame FPS. Keep source/local input,
viewport, refresh rate, load state, foreground state and capture overhead explicit.
Do not add a second animation clock, wheel smoother, browser window, or profiler
workload during another agent's live capture.

Status: **open; user-observed smoothness blocker**. No diagnosis or fix is
claimed by this record. It remains part of full-parity acceptance even if the
reading portrait and prior visual findings pass.

## Foreground baseline and first correction candidate

The user focused the existing browser for root's two86.1-second runs on the
unchanged31f4beb production build. Both completed all2,040 inputs; every
captured frame remained visible and focused, and corresponding native y values
matched exactly. Entry was complete and all recorded readiness markers remained
stable. No new resource entries appeared. Sessions were preserved/warm, not a
controlled cold pair. Input remained synthetic wheel intent plus default
`scrollBy`, with no physical wheel/APZ or presented-FPS claim.

The hero pose held9/360 moving frames on source versus243/303 locally
(2.5% versus80.2%). Common-native-y pre270 callback gap p95 was17.18ms versus
33.26ms. Footer had3 versus26 gaps over25ms. Work and systems had similar
approximately17.16ms p95 callback spacing. These are application/callback
measurements, not displayed-frame counts.

Raw source/local captures, unchanged input plan, analysis and summary are in
`/tmp/gazzar-r14-focused-baseline/`; the input protocol is retained under
`/tmp/gazzar-r13-prep/`. All probes were disposed after capture and both pages
returned to y0.

Candidate5b921d7 integrates source-parent-clock alignment(edba0b1), header
geometry/unchanged-pose caching(3c8015f), and the independent reading fixes.
It passes176 tests/4,460 assertions, lint, TypeScript, production build and SSR.
Fresh R14 must repeat whole-route measurements and moving review before any
smoothness acceptance. Numeric fixtures or a better hero alone do not close
the broader early-story/footer or physical-use concerns.

## R14 outcome and R15 submission correction

Fresh foreground R14 on5b921d7 confirms the hero stall correction: local holds
1/357 moving hero poses versus source9/360. Both R13 reading findings pass
EN/AR wide/narrow controls. Full parity remains unaccepted: pre270 had39 local
versus21 source callback gaps over25ms, and footer12 versus1. These are callback
measurements, not presented FPS. The new paired full EN-wide video is
`/tmp/gazzar-continuous-r14/comparison-en-wide.mp4`.

R15 then traced actual native WebGL submissions in matched optical/footer spans.
Local issued two background default-framebuffer draws in444 document-timeline
bins; source had none. The earlier local draw used the prior pose, followed by
a synchronous journey-event draw at the same native position. Field-target
passes were counted separately. This proves redundant background submissions;
it does not assign GPU or layout milliseconds to the residual cadence tail.
Source also uses Canvas for the partial footer; local's fewer moving paints
do not justify replacing that material with DOM ink. See
`home-residual-cost-r15.md` and `/tmp/gazzar-residual-r15/`.

The new candidate keeps the latest precise journey score/travel and invalidates
the background's existing demand RAF, coalescing its two update paths. Journey
DOM caching and exact undeformed-footer contour reuse remove redundant work
without changing animation curves or quality. These changes still require
integrated checks and a fresh production moving review. Whole-page smoothness
and full EN/AR appearance, interactions and animation parity remain open.

The intermediate demand-only candidate removed all duplicate bins but failed
the source phase contract. R15's actual uniform trace matched final same-bin
story on source90/90 forward and90/90 reverse, versus local0/89 and0/90. This
confirms that merely reducing draw count is insufficient. The follow-up adds
a per-stage render-ownership handoff: background yields its idle/settling RAF
before the journey requests a tick, draws the current published pose once
inside that tick, and resumes its standalone scheduler on release. Pending
ownership, not a second animation clock, prevents competing submissions. The
intermediate result remains explicitly rejected; new native phase/count and
whole-route cadence/appearance checks are pending for the follow-up build.
