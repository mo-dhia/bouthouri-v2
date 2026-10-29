# heart

Canvas point-cloud heart. Retains source implicit shape, layers, projection, pointer rotation and inertia. Native scene clock owns its callback; abort, resize observer and canvas are released by destroy.

Source: https://carterogunsola.com/lab/heart (public example/runtime inspected 2026-10-29).

The parent experiment contract owns loading, first presentation, profile remounts,
visibility, common resources and failure fallback. Styling stays scoped to the
child reference camera; all DOM lengths scale by the inherited design unit.
Media attribution is retained in `public/assets/projects/experiments/README.md`.
