# Editorial implementation and verification status

Vision, Services and Contact are implemented in English and Arabic with the
approved Bouthouri identity. Projects remains outside this task. Fresh native
plain-footer Contact navigation completes locally in **all six** agreed
locale/screen contexts. The original fails to visibly complete the same arrival
in those controls, so that path has no fresh matched source/local pass.
No new application change is justified by the completed controls.

## Implementation

- Complete page copy, headings, navigation, form controls and metadata are server
  content. Static routes prerender; small null gates defer interactions and graphics.
- Layout, SVG cameras, Canvas typography and Three framing follow the fixed
  1920×1080, 768×1024 and 412×915 reference compositions, scaling uniformly by width.
  Physical viewport mechanics retain the exceptions documented in
  [viewport design](viewport-design.md).
- Native scrolling feeds the custom engine. Animation progress stays outside
  React state; Storio owns UI preferences. No GSAP runtime or wheel smoother was added.
- The locale background retains its canvas, context and material history across
  supported HOME/editorial route attachments. Page resources retain their own cleanup.
- Route entry, connected-owner restoration and explicit readable fallback are
  coordinated separately. Skipping entry animation does not waive a visible
  practice hero's first static presentation.

See [editorial architecture](editorial-pages-architecture.md),
[animation ownership](animations.md) and the colocated section contracts.

## Validation and evidence

The body/motion reviews use code `e84f7c77baeecd54407f79556d06cdc1820d3327`, with review HEAD
`a92c6d553135adc17c606013ce55cfb933c4fe77`, production build
`ETSBMuTNkBFMyZQ0iwhPG` on localhost3100. Its 259 code/config input hashes were
independently checked without differences at those reviews. Their recorded
application inputs and visual scope remain historical evidence.

The subsequent [LAN startup repair](lan-development.md) adds an explicit
development-host allowlist and replaces HTTPS-only navigation ID creation. It
changes no authored geometry, motion clock or rebranding. The current production
build is `kHRxV73n38JEPXijOa628`; the user confirms MENU and scroll animations
work in Arc/macOS at the previously broken LAN URL.
That build also retains the separately committed portrait-brightness restoration
`21d4caf`; the LAN repair does not edit its CSS.

Root validation passed:

- `bun run check`: lint, route types, TypeScript, architecture and **403 tests /
  16,131 assertions** (the preceding LAN validation was
  378 tests / 15,758 assertions).
- `bun run build`: localized static pages and the Contact API.
- `bun run test:ssr -- http://localhost:3100`: HOME and all three pages in both
  locales, RTL/metadata, redirects, 404s and 20 static assets.

The [final architecture/performance review](pages-final-architecture-review-r13.md)
corrects typography profile selection, cancelled model loading, pending boot
waiter cleanup and Vision's numbered server-section ownership. An independent
repair review found no remaining concrete P1/P2 or explicit architecture
violation in that scope. Vision's EN/AR production `<main>` HTML is byte-for-byte
identical after extraction. Fixed-profile, script-blocked fallback and live
resource controls pass within the report's stated scope; no FPS gain is claimed.

[R2](pages-full-production-review-r2.md) and [R3](pages-new-production-review-r3.md)
record the complete 18-context body comparison and explicitly scoped reuse.
[R7](pages-reduced-readiness-review-r7.md) independently verifies the final
readiness correction, all normal handoff setups, compact reduced arrivals,
history/reload, HOME/background continuity and readable graphics fallback.
The prior reduced Vision step is absent in three fresh uninstrumented matched
repeats, with the same approximately 66.7ms recorded contrast crossing on each side.
No new confirmed P1/P2 was established in those controls.

The independent [R9 architecture audit](pages-architecture-background-review-r9.md)
found no new confirmed runtime P1/P2 in the reviewed SSR, deferred-loading,
fixed-profile, ownership and branding boundaries. Its contradictory reduced-mode
readiness sentence was corrected in the route-surface documentation. This was
source review, with no new runtime or visual certification.

These are finite visual and behavior checks. The reports retain source native-pose
exclusions, failed controls, uninspected frames and inherited limits. They do not
certify universal frame equality, hardware touch, native OS reduced preference or FPS.

## Native footer verification

[R8](pages-native-footer-contact-review-r8.md) was interrupted before any Contact
click or recording when the user took PC control. Its six flows remain ungraded;
the invalid preparation is retained. After the user returned control,
[R10](pages-native-footer-contact-review-r10.md) restored 100% zoom and verified
the actual reference viewports and DPR before fresh native controls.

Each of the six local EN/AR desktop/tablet/mobile cases starts at a genuinely
visible Services footer. One trusted native Contact click completes the visible
Contact heading and support copy without further input, with the correct URL,
native y0, fonts ready and no open menu. These are native functional passes,
independent of the earlier MENU-to-Contact controls.

The source commits Contact/y0 and reports ready markup, but its composited body
remains dark or displaced in all six controls. Additional EN desktop repetitions
retain the same failure. The failed tails and the separately observed recovery
after ordinary input are preserved; neither ready markup nor recovery counts as
an unassisted matched arrival. No cause or local regression is inferred. This
source failure limits comparison of that path; it does not justify making the
working local arrival fail similarly.

Both assigned tabs were then freshly restored to EN Contact/y0, 1920×1080/DPR1,
100% zoom, fonts and entry complete, motion on, audio off, menus and RDM closed,
blank forms and native prototypes; the local tab was focused. All owned input,
recording and decoding jobs stopped before explicit release. The application
build and all 259 input hashes remained unchanged. R10's final report retains
the exact footage coverage, source failures and comparison limits.

## Deployment configuration

The Contact form uses the local `/api/send-message` endpoint. Actual delivery needs
`RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL`; without them the endpoint
returns an honest unavailable response. Tests used mocks and sent no mail.
`NEXT_PUBLIC_CALENDAR_URL` optionally supplies a branded HTTPS booking URL; the
default is a scheduling email to contact@bouthouri.co. Set `NEXT_PUBLIC_SITE_URL`
to the public origin before deployment. Public configuration changes require a
new build. See [the environment example](../.env.example).
