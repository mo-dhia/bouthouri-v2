# Editorial architecture background audit R9

**No new confirmed runtime P1/P2.** This independent static review found no
concrete new violation warranting an application correction in Vision, Services,
Contact or their reviewed shared boundaries. One documentation-only P3 is below.
This does not close visual parity or the six ungraded native footer-to-Contact
flows.

Review date: 2026-10-28. Supplied candidate: runtime
`e84f7c77baeecd54407f79556d06cdc1820d3327`, review HEAD `5d7dc7e`
(documentation beyond R7's `a92c6d553135adc17c606013ce55cfb933c4fe77`), production
BUILD `ETSBMuTNkBFMyZQ0iwhPG`. No git or production request was made here.
[Evidence notes and source fingerprints](../.artifacts/pages-parity-20261028/architecture-review-r9/notes.md)
identify the filesystem basis; this is not a new full 259-input/build audit.

## Scope and result

- **Content/loading:** the three App Router pages compose server-only content
  inside `Editorial`; locale layout supplies `lang`/`dir`, static params and
  JSON-LD. Route metadata supplies localized canonical/alternate URLs. Vision's
  narrative, all eleven Services descriptions, Contact's labels and response
  copy, navigation and footer have server markup. Null gates import controllers;
  practice Three and footer Canvas material cross subsequent dynamic boundaries.
  Relevant anchors: `src/app/[locale]/layout.tsx:12–36`, the three page files,
  `editorial.tsx:12–18`, `vision.tsx:51–105`, `services.tsx:11–18`, and
  `contact-form.tsx:9–80`.
- **Ownership/lifecycle:** reviewed page controllers use the custom manager with
  `useRAF:false`, page-owned presentation frames and explicit manager removal.
  Entry registry has no scheduler. Surface animation is its own finite opacity
  path, not a second page-progress clock. Async page/object adoption checks
  disposal/abort; reviewed teardown paths remove their subscriptions, observers,
  timers and owned presentation mutations. The locale field's lease release,
  connected parking and final disposal are intentionally distinct from private
  practice resources (`environment.logic.ts:18–94`;
  `story-environment.animate.ts:223–307`). No new normal-reachability evidence
  reopens R10/R13's artificial seams.
- **Geometry:** traced fixed-profile selection through Vision's DOM/SVG,
  Services' glyph/band/hand, shared practice Three and footer Canvas. Reference
  camera math is normalized once; physical height remains in visibility,
  restoration limits, backing buffers and the documented native footer tail.
  `practice-hero.ts:12–17` tests reference dimensions supplied by its callers,
  not physical browser aspect. Services' SVG `fontSize` at
  `opening.animate.ts:149–156` is reference user space; it is not an unscaled
  DOM pixel finding. Vision's non-scaling strokes have outer `vw` rules.
- **Identity/configuration:** checked Bouthouri configuration, EN/AR content and
  metadata, direct email/booking consumers and local Contact transport. Missing
  mail configuration returns 503 (`api/send-message/route.ts:15–19`); client
  success requires HTTP success and `{ok:true}` (`contact-validation.ts:24–35`),
  while server delivery requires a returned message ID (`send-message.ts:17–19`).
  No active original-owner destination was found in the reviewed consumers.
  Only `.env.example` was read. Configuration presence, live delivery and actual
  booking ownership were not tested.

## P3 — contradictory reduced-readiness documentation

**Location:** `src/components/layout/route-surface/route-surface.doc.md:19–20`
says “Offscreen and reduced arrivals do not wait for that canvas.” That sentence
describes the reduced-only eligibility exception removed by R6, giving
contradictory guidance for maintaining the accepted readiness boundary.
The same document at `102–106` correctly says a visible practice
hero still waits for static presentation or graphics failure when entry skips.

**Primary rule/provenance:** `docs/editorial-route-handoff-source-contract.md:118–123`
separates entry skip from asset readiness. Cached source module61157,
`2gz902oulp4x8.js.pretty:33–40`, has no reduced-only assets bypass. Current
`route-entry.ts:50–52`, `vision.animate.ts:30`, `services.animate.ts:29` and
`route-surface.animate.ts:198–204` implement that separation correctly.

**Smallest correction:** remove “and reduced” from the older sentence, retaining
the existing offscreen policy and bounded asset-failure fallback. Documentation
only; no runtime fix, new regression claim or reopening of R7 is justified.
The contradiction is confirmed from text; no resulting user failure is claimed.

## Limits and handoff

Read the required project/loading/splitting/animation/viewport/route/page and
environment contracts, complete R7 and recovered R5, R10/R13, and relevant
installed Next 16.4.3 guides before judging boundaries. Existing root logs report
376 tests / 15,748 assertions plus lint/types/architecture, static build and SSR
with 20 assets passing. Those are attributed prior results, not R9 executions.

Only light filesystem/source/log reads and this report/evidence writing were
performed. No application, existing test, guide outside this report, package,
server or git change; no tests/lint/transpile/build/probe; no browser/page action,
native/OS input, screenshot, recording, decode or delegation. User PC ownership
was preserved. No live secret, mail, calendar, clipboard or backend call.

R7's finite closures and all inherited exclusions remain scoped. R8 stays
**0/6 ungraded**; source zoom/geometry was not changed. No rendered no-JS,
reduced-motion, real-GPU, streaming/BFCache, performance or full visual acceptance
follows from this source audit. **REPORT COMPLETE / NOCPUJOBS. Root owns decisions.**
