# HOME footer and identity wordmark

Fixed design policy (2026-10-28): desktop1920×1080 (>1024px), tablet768×1024
(600<width<=1024), mobile412×915 (<=600) supersede live700px layout decisions.
`footer-material.ts` normalizes measured DOM glyph boxes, positions and pointer
motion by shared `designScale(innerWidth)`, then applies that scale exactly once
with DPR in the drawing transform. Fonts/caps, labels, morph/bridge offsets,
pulls and refraction waves all run in reference pixels; path/field APIs retain
that coordinate basis. The rebranding section below records the new glyph
topology. `FooterThoughts`' optional final rasterScale
only controls bitmap resolution; it does not resize logical layout. DOM font,
tracking, origin and measured footer variables are emitted in vw, and the glyph
reader uses computed physical left rather than parsing an inline vw value.
Fractional word bounds preserve proportional canvas placement. Footer clearance
uses reference height/padding and accepts `--footer-word-rest` as vw, % or px.

Root CSS owns the DOM mask, word and footer's reference-height composition. The
native footer canvas is a separate body overlay (data-footer-material=native-paths),
not the legacy `.footer-material-layer`; its full physical viewport CSS box and
buffer remain paired so clipped viewport drawing is not stretched. Native scroll,
touch slop, client-coordinate protection/audio and visibility stay physical.
CPU regressions cover factor one at each reference, proportional EN/AR text,
morph/wave geometry and hit mapping, no tablet680/700 switch, actual-height
independence, DPR and cleanup. Scoped tests and lint/plain TypeScript pass.
These do not certify visual parity; root owns serialized build/SSR and live review.

R2 buffer correction: the material's existing window resize listener now handles
physical height/DPR changes through `resizeViewport()`. It updates the viewport
buffer/DPR, invalidates only paint and draws the current pose once without
advancing clocks or resetting paths, idle, waves, morph or thoughts. `draw()` also
checks buffer dimensions before painting. Unchanged notifications do no work;
width changes retain the prior interaction reset policy. No parent listener or
extra RAF is added. A mounted parent/material regression leaves the mask's
ResizeObserver silent while resizing rest, idle, wave, forward, logo and reverse
states, checks DPR-only redraw and comparison with an unresized control, and
verifies listener/API cleanup and the no-context handle. Physical overlay CSS
and buffers stay paired; production review remains root-owned.

`Footer copy={dictionary.footer}` is inserted **once inside `.systems-story`**
by Journey, with an explicit required`locale`. It renders the original
`.home-footer`, `.footer-information`, `.footer-word-mask`, `.footer-word-text`,
`.footer-thought` and `.footer-colophon`, links, Cairo time and EN/AR copy. There
is no second page footer. Parent's scoped source CSS and systems timeline own
its reveal, transform, inertness and positioning. Reduced/no-JS uses the
parent's `.experience.is-reduced` layout and keeps all footer content readable.

`footer.logic.ts` exports `mountFooterInteractions(root)` for source DOM as
well as the supplied null gate. It fits the original GAZZAR ink using Questrial
metrics, tracks nav exclusions and footer information height, and updates Cairo
time at minute boundaries. Clearance measures enclosing data-nav-mask boxes;
the shell side-menu replaces the parent’s hidden duplicate chapter-side control.
Mobile side-menu centers in the source 44px navigation row, giving bottom 60px
plus 20px clearance rather than the former 82px. It listens to parent `journey-frame` for visibility;
material data/controller load near the footer or on focus/pointer intent.

R11 exposed a stale clock after work→reading when the mask stayed intersecting.
Cairo time now follows the source foreground-document minute timer (+20ms),
updates immediately on mount/effective reading changes and document resumption,
and releases its timer/listeners on cleanup. Material reveal has separate
eligibility: HOME reading keeps the source reveal at zero; a standard footer
retains its own reduced reveal. Inactive material rejects keyboard and pointer
activation, resets held/grabbable state, and resumes normal HOME interaction
when motion exposes the footer. Real-controller/event regressions exercise the
previous stale-IO sequence and prevent Enter from reactivating a disabled field.

The material canvas is separate from content and owns one demand RAF. Original
normalized Questrial and identity contour data are local JSON in this directory;
no original application/React/GSAP bundle is shipped. `FooterPaths` morphs six
letters through the original bridge geometry into the three identity pieces,
including original counters/rotations and reversible paths. The original
height-relative pull threshold (24..64px), threshold indicator, short touch
(<650ms / <=10px), scroll cancellation (>6px), keyboard activation, concept
hover dwell (130ms), and return interactions are implemented. Escape/reset,
blur, resize, visibility, route start and teardown release the interaction.

Timing: forward 2.24s, reverse 2.04s, settle .24s, thought emergence 1.18s,
read 2.55s, retract .68s, handoff .1s; reduced variants use source shorter times.
Thought tiles grow from the selected mark with original localized text and
material impulse. Announcements wait until the thought is substantially visible.
Footer friction is sent to the shared opt-in audio graph. Canvas, bitmap text
rows, RAF, capture/listeners, observers and inline metrics are cleaned up.

Measured active EN desktop at 1240×670 / score714 matches reference exactly:
information `(99.1875,234.5,1041.625,89.84375)`; word
`(14.78125,324.890625,1190.40625,291.515625)`, font323.92px /
line291.528px / tracking-9.71761px / origin-10.0203px; colophon
`(49.59375,618.5625,1140.8125,28)`. A contour sanity check confirmed 2,847
points, finite intermediate geometry and reverse-to-source error below 3e-14px.
Programmatic Enter reaches logo/thought mode in the integrated local stage.

Pass2 closes the source idle and refraction fields. Six seeded idle episodes
alter the G aperture, A counters/crossbar, ZZ parallelograms and R counter. Seed
91731, family exclusion, quiet gaps, rise 1.55s / leave 2.2..3.85s and .2s takeover
cancellation follow the source. A single timer sleeps until the next episode;
idle starts only after the full word is visible. Original idle contours match
34,164 checked points across mobile/desktop exactly; the clock matches 18,000
source frames, including busy/reduced cancellation and resets.

Fine-pointer waves use six packets with .96s lifetime, source contact spacing,
velocity-scaled radius/amplitude, directional travel, cross-glyph attenuation,
logo-part grouping and 13px displacement cap. 18,000 source offset samples agree
within 1.8e-15px. Hover contraction, bounded 32-rate silk pull, .24s idle takeover,
and captured release/return offsets preserve continuity. Live dev observed idle
counter motion and pointer wave energy. Trusted CDP Enter reached logo mode and
announced the original Perspective thought; this proves the custom key handler,
not physical keyboard or coarse-touch hardware behavior.

`gazzar:material-protection` packets use source:'footer', pressureScale:1 and
influence:.75 while hovering/held. The scene owner applies its context cap .535;
footer does not add a second pressure attenuation. Release/reset, blur, hidden,
resize, pointercancel, menu and disposal emit inactive. `homeSceneFailed` joins
reduced reading without changing preferences. Canvas diagnostics on the grab
mask expose data-idle-kind, data-idle-amount and data-wave-energy for review.

Physical touch, mobile clipping in all morph phases and complete frame-by-frame
reference captures remain final integrated QA; the known idle/wave omissions
from pass1 are implemented. Parent owns build/SSR and the global scene.

Latest cold-dev AR 392×865 / reading mode, after the parent’s scoped-selector
fix: document9406; footer top8644.53125; information top8724.53125, relative80,
height195.3125; --footer-nav-top80px. These equal the supplied source readings.
The reduced material canvas mounted on this same latest DOM.

R5-02: keyboard activation now enters `resolving` for the source220ms. It takes
over the current drawn contours (or retains an existing transfer), clears idle
and waves, and resolves toward source-word geometry through the existing240ms
transfer. At the resolving→to-logo boundary it captures the actual remaining
geometry delta, clears the transfer/silk, then starts the unchanged2.24s morph.
Pointer/touch pull release explicitly takes the direct to-logo path and retains
the passed capture/release behavior. Resolving keeps aria-pressed false; to-logo
sets it true. The existing single RAF, reverse .88s clearing+2.04s return, thought
layout and teardown remain in place. Mode attributes now also expose clearing
and to-word as the source does.

Active pair1912×1009/DPR1: source resolving6.4ms/to-logo224.8ms/logo2468.9ms;
final cold-dev resolving1.7ms/to-logo222.2ms/logo2474.0ms. Other local runs reached
logo2475.4ms and2519.2ms, so these are observed frame timings, not a continuous
motion certification. Reverse code/durations are unchanged; source recorded
clearing6.6/to-word882.2/word2927.5ms, while local repeated samples reached
to-word873.9..884.3ms and word2958.2..3083.2ms under variable frame load. This
wall-time jitter is reported rather than treating numeric durations as proof of
all-frame equality. The known220ms keyboard omission is closed.

Trusted native drag from painted G stroke(80,700)→(160,760) still captured,
entered to-logo directly on release and cleared held/capture; no resolving phase
was inserted into that path. Root/shared clock and navigation files were not
edited. Parent owns the final production build/review and any further temporal
performance diagnosis. The loaned source/local pair has been explicitly RELEASED.

Residual footer allocation pass (2026-10-27): the inspected public source cache
`/tmp/gazzar-runtime/1lbueqoir1wno.js:628–684,1381–1382,1421–1432` guards surface
updates, Path2D rebuilding and paint separately. It retains Canvas during partial
reveal; see `docs/home-residual-cost-r15.md` for the measured scope and limits.
The local material now retains the exact generated rest-word contours and six
Path2D objects while partial reveal changes placement/clip. Only `word` with no
idle episode, hover strength, waves, transfer or silk displacement can reuse
them. Every other phase/effect retains its existing geometry calculations.
Measure and reset discard both caches, including on teardown. An unchanged
rest-word left/top/shift skips clear/fill; changed geometry repaints the cached
paths with the existing transform and clip. Tick reads mask/word bounds once
before writes; pointer hits independently read current event geometry and use
the same drawn contours/paths. Phase clocks, thresholds, eligibility and audio
updates remain outside the paint guard.

The real-controller regression uses a control with only cache eligibility
disabled, preserving the actual deformation formulas. Recorded path commands
match across EN/AR, reduced motion, partial reveal/reversal, resolving and morph,
thought impulse, clearing/return, idle takeover, hover/waves and pull release.
It also checks Path2D/contour call reuse, stationary paint skipping, one bounds
read per element per tick, fresh pointer coordinates, resize/DPR invalidation,
reset and cleanup. These establish redundant geometry/paint elimination under
the harness, not browser frame-time, presented-FPS or whole-HOME parity results.
Parent owns integrated production validation and live comparison.

The null gate view delegates mounting and teardown to
`footer-animate-gate.logic.ts`. Footer markup is guarded by `server-only`.
The small clock/eligibility controller mounts independently of reading mode;
contour data and the interactive Canvas material remain behind its dynamic import.


## Bouthouri identity — 2026-10-28

The current visible word is`BOUTHOURI`, driven by`src/config/brand.ts`. The
English owner is`Med D. Bouthouri` (uppercase where the original shell was
uppercase); Arabic uses`محمد ضياء بوثوري`. Contact links use the user-supplied
email and LinkedIn URL. Historical source comparisons above describe the
pre-rebranding six-letter word, not the current outline topology.

`scripts/generate-footer-glyphs.mjs` reproducibly generates normalized uppercase
contours from the existing local Questrial WOFF through pinned Troika's Typr
parser. No new runtime font or package is required. The nine displayed letters
share seven distinct glyph outlines; counters stay separate, including B's two
counters. Source contour correspondence survives forward/reverse, pull and
refraction. Seven middle letters form seven adjoining sectors of the original
identity ring; first/last letters reach its half-ring/dash. Assembled sectors
paint together using the existing Path2D, avoiding antialias seams. Hit testing
continues to map the assembled motif to the same three concept parts.

Logo diameter, bottom anchor and intermediate bridge use the measured original
reference geometry, independent of the new fitted word's size. At1920×1080 the
source mask is1843.2px, line451.4px, first ink y43.2/height339; the logo center
stays734.56px when the new fitted line is310px tall. Width scaling preserves
that relationship. Mobile retains its original above-word positioning.

Font family, relative tracking, mask margins, ink fitting, easing, resolving
phase, reveal and return durations remain owned by their existing controllers.
Six idle episodes now target the new B/O counters, U/T and O/U pairs, R counter
and H crossbar. Field histories, wave packet count and RAF ownership are
unchanged. CSS fallback font sizes are measured to fit the nine-letter word
without requiring JavaScript. Private legacy event/history keys and historical
reference documentation retain their compatibility/provenance roles.


Rebranding validation: full`bun run check` passes256 tests/9,781 assertions,
including nine-letter morph endpoints, counter topology, seven-sector coverage,
last-letter interaction, identity-anchor and cache/scale/cleanup regressions.
Static EN/AR build and the SSR audit pass new identity/contact assertions and
13 assets. Glyph regeneration is byte-reproducible. Browser checks at the three
agreed profiles retain readable hero/menu/footer identity and zero horizontal
page overflow. Native-window capture preserves the clean assembled ring; some
MCP screenshot controls reset the material and are excluded from logo proof.
Evidence:`.artifacts/rebrand-identity-20261028/validation.json`.


## Resting footer scroll reversal correction (2026-10-28)

Repeated scroll after a full-word pause exposed a scheduling bug: `setActive(true)`
returned without waking the canvas whenever the idle-episode timeout existed.
The parent still moved/clipped the DOM word, but its hidden typography and visible
canvas diverged until pointer input or the timeout woke painting. This predates
the branding change; BOUTHOURI geometry merely made the stale placement visible.

Every eligible publication now requests the existing coalesced demand frame.
The idle timer continues to schedule deformation, not placement. Rest geometry
and paint caches still avoid rebuilding paths or painting an unchanged pose.
There is no additional RAF owner, input smoother, clock, or branding change.
The mounted regression starts a real material through its parent, parks at full
reveal with an idle timer, then alternates partial/full reveal without pointer
input. It verifies current transforms/clipping, coalesced callbacks, path reuse,
unchanged-pose paint suppression and hiding/cleanup in EN and AR. It fails before
the wake correction.

Live baseline: at1920×1080, native31684→31310 changes story714→703.3905 and the
BOUTHOURI DOM word top683.60→827.17px. Before correction no canvas paint followed
within350ms; the original Gazzar repainted its equivalent reveal. After the fix,
twelve alternating seeks repaint at the current DOM position, including returns
to full reveal. Screenshots and bounded actual-call traces are in the ignored
`.artifacts/footer-scroll-fix/` directory. Native-wheel and production validation
are recorded there separately; these seek controls make no FPS claim.

Final validation for this correction: `bun run check` passes257 tests/9,855
assertions; static EN/AR production build`uLs1I2ral6LnMMx-6Jr6K` and the SSR
audit (both locales, RTL, metadata and13 assets) pass. In production at1920×1080,
EN and AR each received88 trusted XTest wheel inputs through repeated upward/
downward reversals. Every observed actual Canvas translation matched the current
DOM word top (maximum error0px); this is placement evidence, not an FPS claim.
Native Enter followed by scrolling away during morph reset the material to word,
hid the overlay, and returned cleanly at714 with BOUTHOURI/contact@bouthouri.co
intact. The existing dev server was retained; the separate validation server is
shut down after returning the browser to localhost3000. All diagnostic wrappers
and event collectors are removed.
