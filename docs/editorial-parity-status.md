# Editorial implementation and verification status

Vision, Services and Contact are implemented in English and Arabic with the
approved Bouthouri identity. Projects remains outside this task. The final native
plain-footer Contact navigation check is **pending PC availability**, not passed.
No new application change is justified by the latest completed controls.

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

The reviewed code is `e84f7c77baeecd54407f79556d06cdc1820d3327`, with review HEAD
`a92c6d553135adc17c606013ce55cfb933c4fe77`, production build
`ETSBMuTNkBFMyZQ0iwhPG` on localhost3100. Its 259 code/config input hashes were
independently checked without differences. Later documentation commits do not
change that build's application inputs.

Root validation passed:

- `bun run check`: lint, route types, TypeScript, architecture and **376 tests /
  15,748 assertions**.
- `bun run build`: localized static pages and the Contact API.
- `bun run test:ssr -- http://localhost:3100`: HOME and all three pages in both
  locales, RTL/metadata, redirects, 404s and 20 static assets.

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

## Remaining native check

[R8](pages-native-footer-contact-review-r8.md) was interrupted before any Contact
click or recording when the user took PC control. **Zero of six** matched native
plain-footer arrivals is graded. Menu-to-Contact checks are not substituted for
that path; earlier source footer-tail pixels remain excluded.

All native input, focus changes, window resizing, zoom resetting and desktop
recording remain stopped until the user hands control back. Background work must
not change the window or tab the user is using. At R8's last saved state, source
zoom had changed its CSS viewport to 2144×1206/DPR .895522; that is not an agreed
reference and was deliberately not reset against user control.

Resume with a fresh browser loan: verify assigned tabs/window, restore actual
reference geometry and 100% source zoom, scroll to a genuinely visible settled
footer, validate the Contact hit target, and record a native click through a
visibly completed arrival. Stop if focus, pointer, modifiers or viewport drift.
Preserve R8's invalid preparation and all existing exclusions.

## Deployment configuration

The Contact form uses the local `/api/send-message` endpoint. Actual delivery needs
`RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL`; without them the endpoint
returns an honest unavailable response. Tests used mocks and sent no mail.
`NEXT_PUBLIC_CALENDAR_URL` optionally supplies a branded HTTPS booking URL; the
default is a scheduling email to contact@bouthouri.co. Set `NEXT_PUBLIC_SITE_URL`
to the public origin before deployment. Public configuration changes require a
new build. See [the environment example](../.env.example).
