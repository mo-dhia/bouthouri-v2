# HOME footer and its living wordmark

`Footer` is inserted once inside `.systems-story` by Journey (and below
editorial pages as the `standard` variant). It server-renders the information,
links, Tunis clock, colophon and the BOUTHOURI wordmark. No JavaScript, reduced
motion or a failed enhancement chunk all leave the same readable footer.

## The wordmark (2026-10-30)

The word is the brand book's kit lettering, the same paths the nav logo draws
(`identity-mark.ts`: `wordmarkLetters`, `wordmarkSpan`). One inline SVG
(`viewBox` −10 −280 1768 460, wordmark units: x-height −100..100, ascender −200)
holds the eight letters after the b as `[data-footer-letter]` groups, two
ripple rings, the focus underline and the live b as the three kit pieces
(`[data-footer-piece]` h1, h2, bar). The server writes every rest transform, so
the static word is final HTML. The Questrial canvas material, its contour JSON,
the emboldened `Bouthouri Wordmark` WOFF and its generators are retired.

`footer-mark.ts` holds pure poses; `footer.animate.ts` owns time, input and the
DOM. The loop:

1. **Word** holds 2.6 s after the footer first shows, 5.2 s after each loop.
   It only leaves once the word is fully in view and nobody is handling it.
2. **Eat** (2.8 s). The b opens its jaws 40° and walks to the word's middle
   while the word slides into its mouth. Each letter leans and stretches
   toward the lips within 110 units, squeezes through and is drawn in from its
   trailing edge; the jaws snap shut on its tail (a chomp sound per bite) and
   reopen for the next. After the i the b stays shut and gulps.
   A runtime SVG mask hides letters inside the bowl (r = 100) or left of its
   centre, following the b's transform, so nothing pops in view.
3. **Solo**: at the middle the b reads ب → ⴱ → b like the nav, with ripples on
   each held script. During ⴱ→b the b shrinks 7% so the flying halves stay
   inside the clipped box.
4. **Spit** (2 s). The b walks home spitting the word back, last in first out:
   each letter pops from the mouth, arcs over and lands on its place with a
   small squash.

Every seam is continuous (word→eat→solo→spit→word), and every swallowed letter
vanishes behind the lips. `footer-mark.test.ts` checks both, plus 60 fps step
sizes and the spit staying inside the view box.

### Input

The grab survives from the Gazzar footer. Fine pointers lean nearby letters
toward the cursor and hold the loop. A cursor resting 1.6 s no longer holds it,
so a parked mouse cannot freeze the footer. A press grabs the nearest letter
(capture for mouse/pen); it stretches after the pointer (neighbours share 35%
and 12%) while the b's jaw primes open. A release past the old threshold
(quarter glyph, 24–64 px, measured in client pixels so a layout shift under a
still press is no pull), a quick click/tap or Enter/Space feeds the word, and
the eat starts from the primed jaw. Escape, blur, cancel or a short pull spring
back. In the solo, a press, Enter or Space skips the held script. A bare click
(assistive technology) acts like Enter; a pointer's own click is ignored, and
held keys never scroll the page or act twice. The focus underline stays for
every phase. Pull friction
feeds the shared audio graph; `gazzar:material-protection` packets keep
source `footer`, influence .75 while hovering or held.

`data-mode` is `word`, `busy` (eat/spit) or `mark` (solo); `data-grabbable` and
`data-held` drive the grab/grabbing cursors.

### Ownership and cleanup

One RAF owns every write. Holds and locked scripts sleep on a single timer.
A hidden document cancels both and pauses the clock. Reduced motion,
`quietMode`, `homeSceneFailed`, HOME reading, the open menu and an inert footer
keep the controller inactive with the server word. Route start and deactivation
reset to the rest word. The hidden clock is frozen, so activation while hidden
still waits the full first hold once shown. Dispose removes the mask `<defs>`,
listeners and data attributes. `footer.animate.test.ts` drives the real
controller through the loop, hover hold and idle release, grab/Escape/pull,
keys, reduced motion, hidden tab, route reset and dispose.

## Mounting, fit and clock

`footer-animate-gate` lazily mounts `footer.logic.ts`
(`mountFooterInteractions`). It fits the word, runs the Tunis clock at minute
boundaries (+20 ms, paused while hidden) and dynamically imports
`footer.animate.ts` near the footer or on pointer/focus intent. HOME follows
the parent's `journey-frame` time (visible from 630). A standard footer follows
its own scroll reveal (`standard-footer-pose.ts`) and re-measures when
preceding content resizes.

`footer-geometry.ts` sizes the SVG to the mask width, scaling uniformly with
width per `docs/viewport-design.md`. The mask and, on HOME, the stage-sized root
are observed, so a height-only resize refits. On HOME's pinned footer a short stage
shrinks the word so its ink keeps a gap below the information. Only the ink
must fit; the loop's headroom may overlap the gap. The word never goes below 40%,
including when no room is left. Nav controls on the stage reserve clearance
above and below. Lengths are published in vw (`--footer-word-height`,
`--footer-ink-top`, `--footer-nav-top/bottom`, `--footer-information-height`).

## Provenance

The 2026-10-27/28 entries for this footer described Gazzar's Canvas material:
a contour morph of the word into the logo, idle episodes, refraction waves and
thought tiles, plus its parity measurements and cache work. The review notes
under `docs/` still cite `footer-material.ts` line numbers. Those files are
gone; git history before this rewrite keeps them. What carries over: the grab
interaction and its threshold, protection packets, audio friction, clock,
eligibility and the standard footer's reveal.
