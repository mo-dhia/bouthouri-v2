# Gazzar clone implementation contract

Target: https://www.thisisgazzar.com/en and its Arabic experience.
The objective is an identical clone, as Artifact reproduced AM-ARC: the same
text, animations, logos, assets, layouts, routes, and responsive/Arabic behavior,
implemented with our own technology. Bouthouri is only the directory name; this
is not a rebrand or a design inspired by Gazzar. This foundation is not the
completed clone; replace temporary structure as each reference section is built.

## Fixed decisions

- Next.js App Router with server-rendered/prerendered content.
- Storio and the custom scroll engine; no GSAP.
- English/Arabic document routing and direction from the server.
- Local, deferred motion and Three.js rendering.
- Reproduce the entry/loading experience while delivering content HTML
  independently of heavy asset readiness.

## Reference facts observed in the browser

The reference uses Next App Router, React, GSAP/ScrollTrigger, Three r180, and
React Three Fiber. Its local fonts are Questrial and Cairo. Our implementation
must reproduce the experience with the chosen custom engine; its library API
does not need to match GSAP.

Observed assets include the hero portrait, `glasses-folded.glb`,
`logo-finished-components.glb`, `logo-lighting-r180.bin`, and an ambient audio
loop. Verify their exact roles, variants, and acquisition before wiring them.
The navigation exposes home, vision, projects, services, and contact under the
locale prefix, plus project details such as `projects/wujhat` and
`projects/tranche-finance`. Home and English vision were inspected live. Complete
the route-by-route interaction and locale inventory before claiming full coverage.

## Completion checklist

- [ ] Inventory every route, navigation item, footer action, and locale pair.
- [ ] Match self-hosted fonts, portrait, project imagery, 3D models/materials, textures, and sound.
- [ ] Reproduce the identity hero, moving background typography, and entry sequence.
- [ ] Reproduce the pinned lens/sculpture story and exact scene/camera transitions.
- [ ] Reproduce below-fold content, project interactions, and all additional routes.
- [ ] Reproduce menu, cursor/pointer effects, quiet view, audio control, and route transitions.
- [ ] Match desktop, tablet, mobile, and Arabic RTL geometry and motion alternatives.
- [ ] Preserve content and basic navigation without optional JavaScript or WebGL.
- [ ] Check cold content availability, first scene activation, and warmed repeat scrolling independently.
- [ ] Compare screenshots and motion against the live reference at matching viewport/DPR/progress.
- [ ] Audit raw HTML, metadata, schema, links, sitemap, broken assets, hydration, and cleanup.

The current setup completes the architecture, engine integration, locale shell,
developer commands, and regression checks. It does not mark the reference
visuals or full route inventory as completed.
