# Editorial pages

Vision, Services and Contact extend the accepted HOME architecture. All localized page text, headings, links, form controls and the rebranded footer are server content. Their short App Router pages compose `Editorial` and a page-owned server entry; `generateMetadata` supplies each route's canonical and EN/AR alternate URLs. Projects remains outside this implementation.

The shared editorial shell owns fixed page navigation, the existing menu, its sound lifecycle and standard footer. It leases the optional background from the locale layout. Page controllers own their measured timelines, SVG geometry, entry and interactions. Gates render null and import controllers asynchronously. The practice object renderer is a shared deferred leaf owned alongside Vision; Services imports that renderer, without importing HOME's object scene.

The environment reuses the existing deferred pressure-field renderer with an explicit editorial pose (`time=448`, `environment=.28`). Vision/Services select `.65` surface quiet; Contact selects `.9` or `1` while a form field is focused. The locale owner retains the same connected surface, context, material time, pressure field and pointer history across supported HOME/editorial navigation. Each route replaces only its pose and interaction attachment. Editorial entry preserves work travel; HOME supplies its current narrative travel. A connected parking slot bridges route replacement. No Three runtime enters server or initial client content graphs. The [ownership contract](../src/components/layout/environment/environment.doc.md) describes the placement adaptation and disposal boundaries.

The three fixed reference canvases and width-only scaling in [viewport-design.md](viewport-design.md) apply to navigation, page geometry, SVG and Three cameras, text, footer and pointer mapping. Native visibility, scroll limits and pixel buffers remain browser mechanics.

The editorial root inherits source body weight through `var(--weight-400, 400)`:
400 for English and 450 for Arabic with the current local typography variables.
This keeps unweighted hero copy consistent with the source without changing
measured text widths or the accepted HOME stylesheet. Explicit heading, control
and paragraph weights still override that inheritance. The source declaration is
`html[lang=ar] body { font-weight: var(--weight-400,400) }` in the retained common
stylesheet; the scoped editorial root supplies the missing inheritance locally.
R2's 412px Arabic Vision control reproduced the exact source line fragments by
changing only this weight. [R3](pages-new-production-review-r3.md) subsequently
verified the correction in the named Arabic production controls. The current
scope and remaining checks are recorded in [verification status](editorial-parity-status.md).

The shell publishes `--ed-gutter` on its server-rendered main: English uses
5.3vw desktop and 7vw for compact practice pages; Arabic retains 6vw at every
profile through the source locale specificity. Services inherits this contract,
including its hero insets and index padding. A missing custom property invalidates
whole padding/inset declarations, so this is a layout dependency, not a cosmetic
default. Profile fixtures cover the shared cascade.

The common footer retains BOUTHOURI's approved taller/heavier outlines and the scroll-reversal correction. Standard pages use the source's distinct staged invitation/word/metadata reveal, driven by the custom native-scroll manager. HOME retains its existing shared journey ownership. The standard-footer controller independently owns a motion-only native scroll tail that supplies any physical viewport height above the fixed design height, keeping the footer endpoint reachable without recomposing it. Standard footer CSS remains visible and width-fitted before enhancement or when its chunk fails.

Changes to preceding content and the native tail update the standard footer's
cached document position without rebuilding glyph/material geometry. Only a
changed mask or an explicit font measurement invalidates that geometry, retaining
wave and idle history through height-only viewport updates.

## Contact delivery

The local form posts to `/api/send-message`. The server validates its bounded payload and sends plain text to `contact@bouthouri.co`, with the visitor as reply-to. Mail uses the [Resend HTTP API](https://resend.com/docs/api-reference/emails/send-email) only when `RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL` are configured. No original-owner endpoint or mailbox is used. Missing configuration returns an honest unavailable response, never a false success. Tests inject a local delivery adapter and do not send mail.

`NEXT_PUBLIC_CALENDAR_URL` supplies a branded booking destination. Without it, the booking action opens a scheduling email to the new owner rather than the original owner's calendar. These deployment settings are documented in `.env.example`; no credentials are committed.

## Acceptance

Build/SSR and architecture checks verify delivery boundaries, not visual parity. On-screen comparisons must use the three agreed profiles, both languages, matching input/entry histories, complete forward/reverse journeys and each page's interactions. Record exact candidate/build identity and retain failed controls and review findings in `.artifacts/pages-parity-20261028/`.

The current [implementation and verification status](editorial-parity-status.md)
links the completed reviews and validation, deployment configuration and the
native footer-flow check deferred while the user controls the PC. A deferred or
excluded control must not be described as a parity pass.
