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

Current state: HOME implementation is integrated and committed. The scene owner
has corrected R4-01 and the associated camera-refresh history, with source-matched
cold/refreshed atlases and optical image samples. Round5 passed those corrections
and found four P2 flow/timing differences. The fixes are now built in production
at revision `d8509fc`, awaiting fresh independent round6 acceptance.
Full parity is not yet asserted.

Round6 in progress: all four direct R5 triggers pass in production. The reviewer
has separately reproduced a cold reflection mismatch and a pristine history
return mismatch, now under diagnosis. Prior resize work used Vaelix's
emulation-first `resize_page`, not a verified OS-native window resize. The prior
source history had accumulated extra navigations; its saved-pixel result does
not invalidate the fresh review's different source result.

| Round | Result |
| --- | --- |
| 1 | Reference inventory and acceptance checklist; see `home-parity-review-r1.md` |
| 2 | Four integration findings; see `home-parity-review-r2.md`. Short-stage, skip, chapter, return-cue and menu-pause fixes independently rechecked. |
| 3 | All four R2 triggers pass independently. Two P2 findings (quiet paragraph margins and footer selector clearance) are fixed and cold-retested by the parent; fresh visual review remains required. |
| 4 | Stopped after confirmed R4-01 to transfer the sole permitted tab pair. Scene fix now matches cold/remeasured reflection atlases and refreshed optical camera samples; independent retest remains required. |
| 5 | Corrected lens/camera/sculpture/Ideas and sampled reading layouts pass bounded checks. Open P2s: ordinary reload entry, restored-mount layout lifetime, footer keyboard resolve220ms, and source-reversed menu close. |
| 6 | Pending fresh production review of `d8509fc`, including all R5 triggers and the same-document Back/Forward correction. |

R5 implementation responses: ordinary reload now explicitly starts fresh once
per document; locale-restored mounts retain their initial semantic intent across
real geometry/mode changes. The reading adapter selects the nearest authored
project and lands100px above it. Frame/style updates and no-op geometry do not
reapply. Browser history visits use source saved-pixel semantics; a bounded
per-document visited-ID/exact-URL map recognizes Next's same-document history
before route teardown can discard the popstate listener. In the implementer's
clean sequence, EN312 wide→AR312 narrow→ARfooter→Back EN489.35/y16362→Forward
AR714/y21772 now matches source.

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

Latest completed root check: ESLint, TypeScript, 74 tests / 3,068 assertions,
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
build and SSR audit passing; independent round6 is still required.
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
