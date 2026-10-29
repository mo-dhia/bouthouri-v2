# threejs-test

Deferred Three/OrbitControls/GLTF experiment with Lantern and four superformula subjects, shaded/wire/points and material finishes. Source camera/math/mode transitions are retained. Measured host buffers and viewport-selected reference geometry stay separate. Replaced original materials/textures and late models are disposed; context loss falls back without touching the shared field.

Source: https://carterogunsola.com/lab/threejs-test (public example/runtime inspected 2026-10-29).

The parent experiment contract owns loading, first presentation, profile remounts,
visibility, common resources and failure fallback. Styling stays scoped to the
child reference camera; all DOM lengths scale by the inherited design unit.
Media attribution is retained in `public/assets/projects/experiments/README.md`.
