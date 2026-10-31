# Case pages

HOME's work chapter Explore links open `/[locale]/projects/<slug>` for Artefact
Studio, Vawzen, Batiprix and The Forecasting Machine. The slugs come from
`WORK_PROJECTS` in `work-paths.js`. The existing project detail route generates
all four statically in both locales, with canonical and alternate metadata and
sitemap entries. The structure follows Gazzar's case page
(`/en/projects/wujhat`): hero, context, opening thought, a three-step
progression with a sticky concept drawing, a closer reading with its own figure,
a reflection and the transition to the next project. The copy, identities and
drawings belong to these projects.

`case.tsx` server-renders every heading, paragraph, label, link and drawing in
its rest pose. With JavaScript disabled, reduced motion enabled or a failed
controller, the page still reads in full. The hero reuses the project's HOME
mark (`project.mark.path`), so the identity matches the work chapter. Context
lists the company, location, period, role and live websites from
`project.context`. External links open a new tab. Each internal return,
`/[locale]?work=<slug>`, lands on that project's moment in the work chapter.
The last case links back to the previous project; the others link forward.

`case.content.ts` holds the English and Arabic stories and interface labels.
Facts come from the projects' own sites and code. The Artefact figure counts the
two copied Pano2VR tours: seven panoramas and eighteen hotspots (6 and 12), as
verified in `pano.xml`. Artefact's closer reading links into the café tour at
`/projects/360-tour`. Do not add phone numbers, old addresses or unverified
metrics.

`case-geometry.ts` is pure and shared by the server and the controller:

- Artefact: a floor plan walked by a ring cursor, plus the tour walk (a ring per
  panorama, a tick per hotspot).
- Vawzen: four sites and a turning route that resolves into the fifth square,
  plus a line that twists once for each site it carried.
- Batiprix: the published price stepping yearly, quarterly, then monthly toward
  the market line, plus the scrape-to-desktop trip.
- The Forecasting Machine: a cone of the unknown that narrows around the present
  as evidence arrives, plus the one-codebase spine.

`case-gate.tsx` renders null and imports `case.animate.ts` after hydration. If
that import fails, the route entry falls back and the server content stands.

`case.animate.ts` owns one demand RAF:

- Hero: the original's staged entry (index, identity, title lines, copy, action)
  through `createMaskedReveal`. The mark completes its last 28% while the tail
  draws as the hero leaves.
- Hero depth: pointer parallax on the mark, smoothed with `1 - exp(-9dt)`.
  Artefact adds a sideways idle drift and The Forecasting Machine a vertical
  breath, both only while the hero is on screen.
- Story: reveals use Gazzar's window (93% of the viewport to just past its
  middle). Statements get depth translation. `[data-story-draw]` paths draw
  inside their `[data-drawing-window]`.
- Progression: progress is anchored to the measured reading steps, driving
  `data-reading-step`, `--reading-progress`, `aria-current` on the index, and
  the concept's route, cursor, finance path and cone. On mobile and short
  viewports the concept is not sticky: it scrolls away before the steps reach
  the reading line, as in the original. There it plays across its own passage
  instead, from the whole drawing entering the viewport to its top meeting the
  navigation clearance (at least 40% of the viewport), so the walk is seen.
- Frames: the loop sleeps when settled, hidden, menu-covered or reduced.
  Scrolling enters through `scrollManager` without its RAF.

Animation progress never enters React state. Cleanup removes listeners, the
scroll instance and masks, restores every inline style, transform and finance
path, and clears the motion dataset.

`case.module.css` began as Gazzar's case stylesheet, converted to fixed
profiles, with this project's identities layered after it. Edit it directly.
Desktop, tablet and mobile follow `docs/viewport-design.md`.
Arabic flips through logical properties, while the English project names and
drawings keep their direction.
