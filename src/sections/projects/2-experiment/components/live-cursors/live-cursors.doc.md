# live-cursors

Typed peer presentation using original cursor shapes, color/hash, smoothing and direction, with an owned same-origin BroadcastChannel. Only actual peer messages create pointers; no simulated visitors. Host/peer leave, bounded message validation, heartbeat expiry and channel/timer/frame cleanup are explicit. Cross-device transport is not configured.

Source: https://carterogunsola.com/lab/live-cursors (public example/runtime inspected 2026-10-29).

The parent experiment contract owns loading, first presentation, profile remounts,
visibility, common resources and failure fallback. Styling stays scoped to the
child reference camera; all DOM lengths scale by the inherited design unit.
Media attribution is retained in `public/assets/projects/experiments/README.md`.
