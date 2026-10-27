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
