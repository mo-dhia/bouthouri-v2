# rotating-gallery

Perspective ring and grid. Retains source camera, drift, drag, wheel/key input, index/hover and image easing. gallery-morph.ts implements owned layout inversion for axis-aligned perspective rectangles with the source duration and distance stagger. It snapshots before cancellation and restores real parents/styles. Source math coordinates are reference units.

Source: https://carterogunsola.com/lab/rotating-gallery (public example/runtime inspected 2026-10-29).

The parent experiment contract owns loading, first presentation, profile remounts,
visibility, common resources and failure fallback. Styling stays scoped to the
child reference camera; all DOM lengths scale by the inherited design unit.
Media attribution is retained in `public/assets/projects/experiments/README.md`.
