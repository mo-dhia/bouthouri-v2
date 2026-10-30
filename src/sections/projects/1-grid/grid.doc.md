# Projects grid

The grid-only reference is `https://carterogunsola.com/lab`, inspected 2026-10-29.
The source header, list/wheel mode switcher, light/dark theme and global live
presence are excluded. The existing Bouthouri navigation and retained background
own the shell. The source's nine experiment posters/reels and ordinary external
experiment links are currently retained with visible attribution. They are
reference studies, not presented as Bouthouri-authored client work. Nine
Bouthouri-built websites are interleaved with them; see "Website cards" below.

## Ownership and rendering

`grid.tsx` renders the complete eighteen-card content, local poster images, links,
heading and instructions on the server. `grid-gate.tsx` renders nothing and
imports the controller after mount. Without that optional chunk, the ordinary
responsive card grid remains readable and navigable. The controller clones only
the visual repetitions to make the 6×6 virtual surface. Clones are excluded from
the accessibility tree and tab order; the original eighteen links remain keyboard
targets. No React state, GSAP, Lenis or Three dependency is used by the grid.

`grid-geometry.ts` owns reference layout, wrapping, bowed perspective and
homography; `grid-motion.ts` owns mutable pointer/drag/velocity state. The
`components/grid-preview` child owns video intent, suspension and disposal. The DOM
controller has one demand RAF, separate from the existing background renderer.
The semantic route uses the shared connected-owner entry registry and surface.
Projects is an eligible persistent-background lease, so entering or leaving it
does not restart that material resource.

## Measured contract

The source uses six columns and 36 repeated cards. Gaps are `max(16, .015W)`;
card width is the maximum of the source 200–320px width bound, horizontal
coverage and vertical coverage. Card height is `.75N + 30`. At the agreed
desktop/tablet/mobile references this gives respectively:

| Reference | Card width | Card height |
| --- | --- | --- |
| 1920×1080 | 349.44 | 292.08 |
| 768×1024 | 207.4666667 | 185.6 |
| 412×915 | 200 | 180 |

Rows stagger by one third of a column, repeating every three rows. Pan positions
wrap independently on each axis. The initial target is item eight, Vocal Orb.
The source's computed anchor inset is 30 / 21.15 / 16.4667 reference pixels;
its integer `offsetLeft` subtraction leaves a small CSS-position residue. That
source-backed residue is retained and scales with the selected reference.
The radial bow is `.13`; pointer repulsion uses `.22` strength and a radius of
1.5 columns. The source image parallax and 1.12 scale are preserved. Grid-only
fixtures execute the actual cached source controller with inert shell adapters;
they compare positions, homographies, opacity and parallax at all three canvases
before and after pointer/wheel schedules. The original script fingerprint is
retained with those fixtures. No original runtime is shipped.

All design dimensions derive from `viewportDesign(innerWidth)`. Height and
orientation cannot select another composition. The DOM adapter emits lengths
as vw. The projective matrix's inverse-length coefficients remain numeric
algebra and divide by the physical width scale; its translation is factored out
into vw so the composition scales once. Buffer/pointer/browser coordinates stay
physical at the adapter boundary.

## Interaction and resource lifetime

- Wheel/trackpad pan is consumed only by the enhanced grid surface. Ctrl-wheel
  remains native zoom. This local manipulation is not a document wheel smoother.
- Pointer drag begins beyond six reference pixels; release velocity is capped at
  3500 reference pixels/second, expires after a 90ms stationary hold and decays
  with the source .45-second exponential tail. A catch press stops existing
  motion; a dragged release suppresses only its generated click.
- Touch and pen follow the contact directly on each presentation, with one
  physical pixel of grid travel per physical pixel of input on both axes. They
  retain the existing capped release momentum. This deliberately removes the
  mouse drag's `.078` smoothing during contact: a quick 120px synthetic touch
  drag previously presented only about31px before release in the mobile browser
  control. Mouse and wheel damping are unchanged. Additional contacts cannot
  replace or cancel the active primary drag; reduced motion has no momentum.
  Mounted controller regressions cover375/412/600/768px widths, both axes,
  immediate reversals, hybrid pen/touch, extra-contact cancellation, click
  suppression, reduced motion and eventual RAF sleep. The rebuilt browser
  control at actual484×915 presented119.998–120.003px for120px synthetic touch
  input in English. This verifies input mapping, not physical-device latency or
  presented FPS. Full validation:453 tests /19,230 assertions, build and local
  production SSR audit pass; no CSS or content/loading boundary changed.
- Browsers implicitly capture a touch to the contacted card. Moving capture to
  the root after the drag threshold makes that card's `lostpointercapture`
  bubble to the root, so the root listener accepts only its own loss for the
  active pointer. Treating the bubbled event as cancellation stopped every
  touch drag after its first ~10px until the finger lifted (reported on
  Firefox Android). Synthetic `PointerEvent`s have no implicit capture, which is
  why the earlier control missed it. Real touch input now covers it: Chromium
  CDP `Input.dispatchTouchEvent` and Gecko 158 WebDriver BiDi touch actions
  moved the settled grid 10px for a 200px held drag before and 200px after
  (Gecko EN/AR, Chromium EN), with the drag held until `pointerup`; in Gecko a
  tap still opens its card and a drag does not. The harness models capture
  handoff and bubbling.
- Three adjacent contact losses were found in adversarial review. Gecko's APZ
  turns a long press on a card link into `contextmenu` and then `pointercancel`,
  so the viewport prevents only the held touch/pen contact's own menu; mouse
  menus, including a hybrid device's mouse during a held touch, are untouched.
  The route surface claims link clicks in the body's capture phase, before the
  root, so a catching tap on a gliding grid navigated. Suppression now runs in
  the window's capture phase and stops the click there. It applies only to
  pointer clicks: a touch drag ends without a click, and its leftover flag must
  not swallow a later keyboard Enter. Keyboard clicks have an empty
  `pointerType`; Gecko still reports `detail` 1 for them, so the click count is
  only the fallback for MouseEvent-only engines. A breakpoint change during a
  held drag re-anchors the contact at its current point under the new layout
  instead of dropping it while capture and `data-grid-dragging` remain. Other
  remeasures (height-only, same-profile scale) re-anchor without discarding the
  drag's release velocity. A trusted Gecko async-APZ control (1.2s hold, then
  120px) moved the grid 0px before and 120px after; a catching tap during a
  glide navigated before and does not after; settled taps still navigate.
- Fine pointers get the source damped repulsion. Focus brings the selected
  original card into the nearest wrapped position; Enter follows its real link.
- A 220ms hover intention starts a muted inline reel. Coarse pointers choose the
  nearest settled card after the source idle delay. One video element is reused;
  no reel source is requested before intent. Reduced motion and Save-Data retain
  posters. Menu, hidden-document and reduced transitions pause media immediately.
- Reduced motion retains direct manipulation with immediate positioning and no
  inertial release, entry sweep, pointer field or image parallax. The static
  bowed geometry remains, matching the source's reduced grid.
- Resize preserves relative pan when the selected profile changes. A physical
  height-only change updates hit-test bounds without resetting the grid history.
- The enhanced shell is a fixed physical crop around the width-scaled design
  canvas. Native focus cannot scroll the document out from under grid hit tests;
  the controller brings focused cards into view. The credit remains at the
  physical viewport edge. No remembered-pixel scroll lock or viewport-height
  design sizing is introduced. The ordinary no-JS document remains scrollable.
- Cleanup aborts listeners, cancels the one RAF and owned timers, removes clones
  and video, releases pointer capture, disposes the entry registration and restores
  original styles. Late font readiness cannot publish after disposal.

The grid uses the existing warm ink, local Questrial/Cairo fonts and material
background. These are intentional design-system adaptations; reference font,
texture, theme switcher and global notification pixels are not copied.

## Verification

The [implementation review](../../../../docs/projects-grid-review.md) records
the frozen build, six reference-screen checks, native comparison, SSR/failure
controls and limits. `bun run check` passes 424 tests / 17,624 assertions;
production build and ten-route SSR checks pass. Nineteen project tests cover
actual-source geometry, drag/cancel/reduced physics, the mounted controller and
the media child's intent/visibility/disposal lifecycle. The complete final
native pair was inspected at 4fps (53 paired samples); this is finite behavior
evidence, not presented FPS or universal frame equality. Individual experiment
detail pages remain external destinations outside this grid-only port.

Raw source, initial failures, source-execution fixtures, browser receipts,
screenshots, videos and hashes are retained locally under
`.artifacts/projects-grid-20261029/`. No original shell or animation runtime is
shipped. The retained nine media pairs have portable provenance and checksums
in `public/assets/projects/lab/`.

## Local detail integration (2026-10-29)

All nine study links now remain within `/[locale]/projects/[slug]`. Captions
are flattened beneath projected media rather than inheriting the homography;
their nodes and original styles/parents are restored on cleanup. Embedded gray
poster/reel pixels use a non-destructive tonal filter, excluding Vocal Orb.
See the sibling `2-experiment/experiment.doc.md` for renderer ownership.

## Website cards (2026-10-29)

The user asked for the seven websites from the previous portfolio
(`/Users/ghost/Documents/dev/Finished/bouthouri`, live at bouthouri.co) to join
this grid. `content.json` marks every item `kind: "study"` or `"website"`.
Websites alternate with studies so the opening view mixes both; Vocal Orb stays
at index eight, the source's initial target. With eighteen originals in 36
slots, each row of six repeats every three rows.

Website cards link to the live site with `target="_blank"` and
`rel="external noopener"`. The route surface ignores external links, so they
open natively. Their accessible names say they open a new tab. The previous
portfolio's saturated device mockups were not reused. Each card is a live
capture composed onto this grid's ground instead: the domain above a rounded
hairline frame, the site kind and an index below it, and a dashed scroll track
whose thumb follows the recorded scroll. The tonal filter used by the gray lab
media is skipped, because the website ground is already inked. Capture and
encoding provenance is in `public/assets/projects/work/README.md`.

The previous portfolio itself joined on 2026-10-30 as the eighth website, right
after Vocal Orb, which keeps the alternation. The user plans to serve this site
at bouthouri.co and move the previous one to old.bouthouri.co, so the card
links there. Its media was recorded from www.bouthouri.co in the dark scheme,
where the previous portfolio still lives.

Artefact Studio (artefactstudio.org) joined on 2026-10-30 as the ninth website,
appended after Paste-Up. That makes eighteen originals, three full rows of six,
so every row alternates website and study, including across its horizontal wrap.
It is flagged New: the live deployment was about two weeks old. The site draws
its scrollbar as a DOM overlay; it was hidden during capture, like native
scrollbars on the other sites, because the dashed track already shows the scroll.
