# dynamic-scrollbar

Virtual nested document, scroll thumb/clock/note/player morph. Source dimensions/phase/timings, hover/touch/drag input, clock and wave tracks remain child-owned. Music is locally served; media/interval/tween cleanup is also bounded by the environment.

Source: https://carterogunsola.com/lab/dynamic-scrollbar (public example/runtime inspected 2026-10-29).

The parent experiment contract owns loading, first presentation, profile remounts,
visibility, common resources and failure fallback. Styling stays scoped to the
child reference camera; all DOM lengths scale by the inherited design unit.
Media attribution is retained in `public/assets/projects/experiments/README.md`.
