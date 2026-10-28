# Contact implementation contract

## Composition and integration

`src/sections/contact/contact.tsx` exports the server-only default
`ContactContent({ locale })`. The component renders only the source body:
the opening header, `#conversation` form section and alternative booking
section. The root owns the `main.editorial-page.contact-page`, fixed navigation,
backdrop, skip link and the approved heavier/taller standard footer. The content
wrapper is neutral; it supplies scoped source typography/colors and no inset.

All EN/AR headings, body copy, field labels/placeholders, validation messages,
busy labels, error response, success copy and reset copy are server-rendered.
The null gate imports the interaction controller independently of optional
motion. Server form controls start disabled, matching the source; direct email
and booking links remain usable without enhancement. No text is supplied by an
animation chunk. Email and booking targets come from `brand`, with LTR email
isolation preserved in Arabic. No Contact clipboard control exists in source.

The shared `KineticLink`/`KineticButton` own CSS rollover/boundary interactions.
No shared component, app route, shell, store, global CSS or package file is
owned or modified by this implementation.

## Source evidence

Reference HTML: `.artifacts/pages-parity-20261028/reference/{en,ar}-contact.html`.
Source Contact behavior/copy: `reference/runtime/1ihboesdbyeuh.js`; source CSS:
`reference/runtime/0ht1z612ephb8.css`; generic route entry:
`reference/runtime/2gz902oulp4x8.js`, with timing constants in
`reference/runtime/0or6--g23od4n.js`. These are inspection artifacts only; no
compiled application, React or GSAP bundle is imported/shipped.

The focused extraction and fixed-profile conversion are reproducible by
`bun .artifacts/pages-parity-20261028/contact/extract-styles.ts`. This uses the
existing fixed-viewport CSS converter, resolving source clamps and geometry
media queries at each reference before writing all three exclusive profiles.
`source-contact.css`, formatted EN/AR source main markup, and the generic entry
excerpt are retained in that same Contact artifact directory.

Root-owned live evidence currently confirms these source heights (CSS pixels):

| Profile / locale | Opening | Conversation | Alternative |
| --- | ---: | ---: | ---: |
| 1920×1080 EN | 1080 | 1129.9333 | 719.9833 |
| 1920×1080 AR | 1080 | 1137.75 | 855.35 |
| 412×915 EN | 841.8 | 977.8833 | 580.2 |
| 412×915 AR | 841.8 | 989.85 | 683.6333 |

At EN desktop the form input is x884.8 / width862.4, name field y292.1667
relative to the conversation / height77.6667 / font30.75; textarea height232.9333;
submit x172.8 / y900.4333 / height54. These are reference targets, not a claim of
local browser acceptance. Root also captured the AR tablet opening screenshot.

## Motion and ownership

One Contact RAF presents generic entry, opening scrub and alternative reveal.
Native scroll input comes through the existing `scrollManager` with
`useRAF: false`; there is no additional native scroll listener or second frame
scheduler. Geometry reads are cached on mount, resize, fonts and content resize.

- Opening: top/top through bottom/25% of the fixed design stage; 300ms numeric
  Expo.out scrub. The last heading **outer** line shifts +4% EN / −4% AR, while
  the axis grows from scaleX .18 to 1. Inner heading spans remain available for
  the independent entry transform.
- Alternative: section top at90% through42% of the design stage. Each inner
  line travels y112% to0 with source power2.out (cubic), .5s piece duration,
  .055s stagger and the same300ms scrub.
- Generic Contact entry: after fonts, line delay .05s, duration .4s, stagger
  .06s, power3.out (quartic); support delay .17s, duration .3s, stagger .045s,
  power2.out, y10→0 and opacity0→1. The retained route-entry registry releases
  the current physical page owner after fonts/measurement and shared cover
  readiness. Contact keeps the finite entry on its existing RAF and publishes
  its completion. A failed or late controller adopts the readable completed
  pose. Arrival is one-shot for the route element, skipped for history/reduced
  arrivals or restored positions beyond reference80px, and never replayed by
  quiet/reduced toggles. See the shared route-surface contract.
- Quiet, reduced or failed optional enhancement retains readable static HTML.
  Controllers restore owned transforms, listeners, observers and engine keys;
  pending font resolution cannot initialize a disposed controller. Hidden
  documents cancel the presentation frame and restore current geometry on
  visibility. Stationary endpoints have no Contact RAF.

Source scroll percentages use the width-scaled design height, so changing only
physical browser height does not change composition or its timeline geometry.
DOM rectangles are already actual pixels. Textarea/success measurements cross
once into `vw`; design160/440 textarea bounds use the shared viewport helper.

## Form and transport

Source form POST is real application code targeting `/api/send-message` with
JSON `{ name, email, message }`; success requires HTTP success and JSON
`{ ok: true }`. No request to the original source endpoint was made. The local
controller uses the root-owned API with that exact contract, and accepts a mock
adapter for tests. An unconfigured local transport must return an honest error.
No status is fabricated, no note is cleared on failure, and no third-party
delivery/clipboard operation is performed by QA.

Source validation checks required trimmed presence, raw name length≤100,
raw email length≤254 plus source email syntax, and raw message length≤5000.
HTML input caps500 and textarea cap10000 preserve source validation reachability.
Blur validates one field; editing clears that field's error. Invalid submit
focuses the first bad field. Name entry replaces the intro with a greeting and
60-character trimmed name. Active labels track focus; focus anywhere inside
the form sets `data-contact-focused="true"` on `root.closest('main')`, and blur
outside sets false. Root maps this to background surfaceQuiet1/.9 and owns the
base448/.28/.9 pose and teardown.

Pending validation/delivery disables fields, repeated submits do not duplicate
delivery, and unmount aborts the request. Confirmed success reserves the measured
form height, clears values, focuses/scrolls to the success panel and supports
the source “write another” action. Error preserves all values and displays
`contact@bouthouri.co`. The begin cue and success scroll respect OS reduced motion.

The success reservation samples the painted form before synchronous status and
error-row changes. Source React batches those changes, so retrying a rejected
delivery retains its error-expanded height. The mounted regression checks this
ordering at all three reference widths; browser acceptance remains separate.

## Verification and remaining acceptance

The scoped suite currently passes16 tests across5 files. Scoped ESLint passes.
Tests exercise source validation boundaries, mocked transport confirmation,
mounted form focus/error/success/abort behavior, one-time measurement scaling,
source easing/timing, single RAF ownership, AR mirroring, restoration, visibility,
font cancellation, cleanup, fixed-profile source geometry and CSS formatting.
All transports in tests are mocks. Root owns coordinated typechecking, full checks,
production build, SSR audit and actual browser/video/adversarial acceptance.

No browser, OS/native input, clipboard mutation, message send, server/process,
package install, stage or commit operation was performed by this Contact task.
Offline/source tests alone do not establish visual or continuous-motion parity.
