# Home parity review loop

Target: identical Gazzar home, English and Arabic, with our server-first content,
Storio, custom scroll engine, and deferred plain Three. No redesign or substituted
brand/assets/effects. Original application bundles are research material only;
they are not shipped with the clone.

## Acceptance matrix

- Entry: original loader/logo, silent/sound choice, keyboard and repeat entry.
- Hero: portrait silhouette/shader/pointer/click response, signature, copy-line
  reveal, marquee direction/speed/pause, docking navigation, language switch.
- Lens: opening typography, sunglasses geometry/materials/shadow/light, optical
  narrative, lens crossing and veil, intro copy masks and focus.
- Logo: exact independent sculptures, reflection environment, camera/part paths,
  spatial typography, pointer response, and ideas-to-project handoff.
- Work: four original projects, symbols/connectors, drawing head, horizontal
  composition, hover/focus emphasis, metadata, and project destinations.
- Systems: organized paths, multiple perspectives, final space/scale transition.
- Footer: original text/layout/time, links, interactive GAZZAR material and keyboard.
- Shared: background, cursor/material sound, menu behavior/clipboard/focus,
  native/smooth scrolling, reverse scroll, restored scroll, resize, tab visibility.
- Alternatives: mobile/tablet/desktop, EN/AR, quiet/reduced motion, no JS/WebGL.
- Architecture: semantic HTML outside scripts, truthful metadata, local assets,
  deferred heavy imports, cleanup, no hydration errors, production build/audit.

## Review rounds

1. Reference audit: independent adversarial reviewer inventories the live page
   while implementation proceeds. Findings go in `home-parity-review-r1.md`.
2. Integrated implementation review: a fresh child gets the original brief,
   reference map, prior findings, implementation responses, and unresolved gaps.
3. Each following round uses a fresh reviewer task after fixes. Keep findings
   open until the trigger is retested, not merely because a patch was written.

For every comparison record viewport, DPR, locale, scroll/native position, source
story/opening score, interaction state, and cache/entry state. Activate the tab
and allow its score to settle before capture. Compare cold entry, first scene
activation, and warmed traversal separately. Do not present passing type/build
checks or matching content as proof that all animation frames match.

Current implementation: `41da321`, running in production at `http://localhost:3000`.
Full check passes: ESLint, TypeScript, 93 tests / 3,365 assertions. Production
build and the HTTP SSR audit pass for both prerendered locales, metadata,
redirects, 404s and 14 static assets. It includes the R7 demand/capture correction,
reading opening/chrome and scroll-cue fixes, and retained reading renderer with
independent glasses readiness and explicit private-atlas disposal. Round8 gives
those optical/reading changes bounded production acceptance, but requests changes
for reading preference surviving locale navigation and persistent MENU metrics.
The MENU correction is committed in0a98f59 with exact EN-wide/AR-narrow dev
geometry. Navigation41da321 resets the explicit reading preference on a new HOME
and captures source locale anchors independently of ordinary reading checkpoints;
the actual104px opening gap is covered. Source/dev y1009, Back/Forward, retained
work intent and reload controls pass. Fresh production round9 accepts both R8
findings within its measured scope and establishes no new actionable P1/P2 issue.
See `home-parity-review-r9.md` for exact evidence and exclusions. Full/continuous/
hardware parity is not asserted. R8's accumulated Arabic lighting observation
remains untraced; fresh/remount controls pass, and no source invariant or material
correction is inferred from the unlike accumulated pair.

The extra development3000 and review3100 servers were stopped after R9. One
production preview now serves the same built code on3000; the both-locale SSR
audit passes there too. No new browser surfaces were created; the original one
window/four tabs remain, with local EN preview active.

Round6 is not accepted: ordinary reload from a completed journey produces a
broad source reflection while local retains the dark field. Fresh navigation,
same-size and actual2px remeasure controls match. Clean locale→footer→Back also
misses the source's pending generic HOME return: source Wujhat12091/312 versus
local systems16362/489.35; Forward restores footer in both. Prior resize work used Vaelix's
emulation-first `resize_page`, not a verified OS-native window resize. The prior
source history had accumulated extra navigations; its saved-pixel result does
not invalidate the fresh review's different source result.

Both R6 corrections now have implementation evidence: bounds/readiness capture
order reproduces foreground broad and hidden-entry sharp fields, and generic
HOME return passes pristine and fresh-navigation fallback history in dev.
The parent applied the active-studio guard in a315984; full check84tests/3172
assertions, production build and SSR audit pass. Fresh production174 shows
complete CLARITY on cold entry and motion remount, with source capture instability
recorded separately. A subsequent production reload from40 exposed a late native
scroll replay: entry ready at y5263/story40 despite no pending return records.
The source-backed fix in9a5dd77 retains manual document restoration and a guarded
one-shot pageshow reset. Full check85tests/3228assertions passes. R7 independently
passed both reload repetitions, complete CLARITY cold/remount, the original R6
foreground/hidden controls and both HOME return histories in production.

One P2 remains after R7: hidden entry→sharp40→same-size resize→2px canvas bounds
change with an immediate jump to174→restore bounds→reverse40 gives darker local
lenses. The reviewer reproduced it twice and measured continuing60/67 differences
with nearly identical cameras. The correction in2a1f485 coalesces RO capture
through the existing50ms bounds measure, retains the source74-tween veil history,
and lets the existing scene demand RAF own GPU draws. Later exact source controls
also naturally produced the dark field when rendering skipped early return poses.
R8 must adjudicate actual conversion/pose histories and both field branches;
a universal-white expectation is not supported. Failed/white/dark controls remain
in `/tmp/gazzar-reading-scene/` and the scene contracts.

An additional owner follow-up found a reading-opening difference: motion40→
reading→native y1009 at1912×1009 shows source PERSPECTIVE00 and fitted headline,
while local keeps LOOK CLOSER09 and loses its headline fitting on controller
cleanup. Source retains a broad lens field in that transition; the newly created
local static renderer uses the sharp field. These are separate reading-mode
integration/history gaps, not claims from the completed R7 adversary. The parent
fixed reading chrome/fitting inff4d360. Live identity/capture proof then confirmed
source retains its renderer/glasses/raw256/cache across mode changes; f155d0c
implements that lifetime with lazy motion attachments. No whole-static-mode
pixel-parity claim follows from the sampled comparisons.

Parent reading UI correction now passes source/dev comparisons: EN opening fit
and every row coordinate/font match exactly; AR narrow does too, with PERSPECTIVE00
(منظور00), zero DOM score/opening/progress and unchanged reading document extents.
AR8541→motion164.58→reading8541 retains the offset in both. The retained scene now
also matches sampled EN foreground/hidden and AR desktop static crops at p99=1,
with zero settled object draws. An offline adversary found two lifecycle P2s:
leaked derived512 atlases and cold reading waiting on obsolete motion work. Both
are fixed and independently re-reviewed without further P1/P2 findings. Live GPU
counts plateau13motion/7reading over three cycles; held logo/font work no longer
prevents reading readiness. Details and limitations are in
`src/sections/landing/2-story/story-reading.doc.md`. Production/R8 acceptance
remains pending.

An independent offline review also found the reading scroll cue had no handler.
It now scrolls to `#beyond` with the source's auto/start behavior and removes
its listener on mode changes and HOME disposal. Scoped lint and the six journey/
reading-navigation tests pass; EN/AR activation still needs the production review.

| Round | Result |
| --- | --- |
| 1 | Reference inventory and acceptance checklist; see `home-parity-review-r1.md` |
| 2 | Four integration findings; see `home-parity-review-r2.md`. Short-stage, skip, chapter, return-cue and menu-pause fixes independently rechecked. |
| 3 | All four R2 triggers pass independently. Two P2 findings (quiet paragraph margins and footer selector clearance) are fixed and cold-retested by the parent; fresh visual review remains required. |
| 4 | Stopped after confirmed R4-01 to transfer the sole permitted tab pair. Scene fix now matches cold/remeasured reflection atlases and refreshed optical camera samples; independent retest remains required. |
| 5 | Corrected lens/camera/sculpture/Ideas and sampled reading layouts pass bounded checks. Open P2s: ordinary reload entry, restored-mount layout lifetime, footer keyboard resolve220ms, and source-reversed menu close. |
| 6 | All four R5 triggers and the sampled integrated matrix pass. Two P2s remain: reload-specific reflection capture history and clean Back's pending generic HOME return. See `home-parity-review-r6.md`. |
| 7 | R6 fixes, late reload race, CLARITY and both HOME return histories pass. One new P2 remains in the bounds/direct-sculpture/reverse optical branch; see `home-parity-review-r7.md`. |
| 8 | R7 optical branches, retained reading scene, cue, disposal and sampled whole-home flows pass bounded production checks. Two P2s: locale should reset the explicit reading preference; persistent MENU needs source chapter-side type/width and measured dock reserve. See `home-parity-review-r8.md`. |
| 9 | Both R8 findings pass wide/narrow locale and shell checks, with targeted retained-mode/history/reload/failure and representative HOME regressions. No new actionable P1/P2 finding established. Accepted only within the measured scope; see `home-parity-review-r9.md`. |

R5 implementation responses: ordinary reload now explicitly starts fresh once
per document; locale-restored mounts retain their initial semantic intent across
real geometry/mode changes. The reading adapter selects the nearest authored
project and lands100px above it. Frame/style updates and no-op geometry do not
reapply. Browser history visits use source saved-pixel semantics; a bounded
per-document visited-ID/exact-URL map recognizes Next's same-document history
before route teardown can discard the popstate listener. In the implementer's
clean sequence, EN312 wide→AR312 narrow→ARfooter→Back EN489.35/y16362→Forward
AR714/y21772 matches the accumulated source run. Round6's pristine sequence
exposed the missing generic HOME return that precedes pixel fallback; that
additional branch is being added without changing all history visits to
semantic restoration.

Footer Enter resolves/captures current geometry for220ms before the original
2.24s morph; pointer pull release remains direct. The menu now reverses all
authored tracks from their current pose at1.55x and retains lock/focus until
completion. The shared scalar scrub settles beneath the modal while GPU owners
pause separately. Implementer live timings and interruptions pass focused
checks; footer reverse wall-time jitter remains an observation for production
review, not a new proven source difference.

Parent live comparisons on 2026-10-27 sampled EN at 1400×950/DPR1, scores
87/312/500/580/658, and AR at 392×865/DPR1, scores 308/580. Systems and closing
SVG/text geometry closely matched at the sampled frames. Work geometry matched
apart from the Ideas-origin large-seek defect sent back to the scene owner.
During isolated journey comparisons the known frozen hero was temporarily hidden
in the QA tab; those images are not evidence of whole-page acceptance.

Live locale EN→AR and browser Back restored the sampled closing score≈658.0142
and native y=26134. A script-free server-HTML snapshot exposed the four project
links, prose and systems illustrations, with an absolute static hero and original
glasses poster. These samples do not cover every navigation or no-JS action.

The mode-position fix retained the native clamped y=10265 on EN 1400×850 when
re-enabling from reading mode, yielding score≈185.19 instead of resetting to 0.
Arabic quiet prose now computes to Cairo/450. Round 3 independently rechecked
those triggers, including failure
latching and successful locale remount after failure. Restoring scoped paragraph
margins then closed the reading-extent difference: at EN 1400×850, document
11148px, work top3985.15625, systems top8190.03125 and footer top10400.03125 now
equal the reference. Removing the nonexistent footer ancestor requirement also
matched information clearance at102.34375px relative to the footer.

Latest completed root check: ESLint, TypeScript, 93 tests / 3,365 assertions,
production build with deferred Troika, and production HTTP SSR audit pass.
The production scene boots with local fonts and no cross-origin requests. At
EN 1400×950/DPR1, score312, its incoming connector and project symbol path strings
exactly equal the source after scene readiness. The integrated score128 sculpture
and text were also compared without hiding any hero layers.
Frozen implementation revision for round4: `b279deb` (shell `07e3acc`, scene
`c61bccf`). It includes the deterministic pre-GPU connector origin, source480ms
Expo.out shared scrub, and source five-stop portrait fallback. The subsequent
environment/camera correction is revision `8540377`; production round5 passed
its bounded independent comparisons and confirmed the ordinary reload mismatch.
The subsequent flow/timing fixes are revision `d8509fc`, with a fresh production
build and SSR audit passing; the subsequent round6 findings and responses are
recorded above.
Trusted SOUND entry was
also exercised via Vaelix's CDP double-click path: the recorded click was trusted,
audio entered `playing`, and muting entered `muted`. Trusted COPY activation
returned `COPIED` after the clipboard write resolved. Audible balance, physical
keyboard defaults, real touch, DPR2, dynamic mobile bars and continuous motion
acceptance remain open. Vaelix's simple click is a DOM click; its key events omit
the virtual key code required for some browser default actions, so those alone
cannot establish native Enter/Escape acceptance.

An actual optional-controller import failure was exercised through a temporary
local proxy returning503 for the production scene chunk. The HOME latch exposed
server reading copy and poster, released the entry overlay/scroll lock, and kept
all four project links non-inert. The proxy and its tab were removed afterward.

Browser resource constraint: after the user's memory warning, all five extra
QA windows and nine unused tabs were closed. Further browser work reuses only
the existing main-window reference/local pair; reviewers and implementers must
coordinate ownership and must not create new tabs/windows.
