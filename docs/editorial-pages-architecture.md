# Editorial pages

Vision, Services and Contact extend the accepted HOME architecture. All localized page text, headings, links, form controls and the rebranded footer are server content. Their short App Router pages compose `Editorial` and a page-owned server entry; `generateMetadata` supplies each route's canonical and EN/AR alternate URLs. Projects remains outside this implementation.

The shared editorial shell owns fixed page navigation, the existing menu, its sound lifecycle, standard footer and optional background. Page controllers own their measured timelines, SVG geometry, entry and interactions. Gates render null and import controllers asynchronously. The practice object renderer is a shared deferred leaf owned alongside Vision; Services imports that renderer, without importing HOME's object scene.

The environment reuses the existing deferred pressure-field renderer with an explicit editorial pose (`time=448`, `environment=.28`). Vision/Services select `.65` surface quiet; Contact selects `.9` or `1` while a form field is focused. Field simulation/time and input cleanup have one renderer owner. No Three runtime enters server or initial client content graphs.

The three fixed reference canvases and width-only scaling in [viewport-design.md](viewport-design.md) apply to navigation, page geometry, SVG and Three cameras, text, footer and pointer mapping. Native visibility, scroll limits and pixel buffers remain browser mechanics.

The common footer retains BOUTHOURI's approved taller/heavier outlines and the scroll-reversal correction. Standard pages use the source's distinct staged invitation/word/metadata reveal, driven by the custom native-scroll manager. HOME retains its existing shared journey ownership. The standard-footer controller independently owns a motion-only native scroll tail that supplies any physical viewport height above the fixed design height, keeping the footer endpoint reachable without recomposing it. Standard footer CSS remains visible and width-fitted before enhancement or when its chunk fails.

## Contact delivery

The local form posts to `/api/send-message`. The server validates its bounded payload and sends plain text to `contact@bouthouri.co`, with the visitor as reply-to. Mail uses the [Resend HTTP API](https://resend.com/docs/api-reference/emails/send-email) only when `RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL` are configured. No original-owner endpoint or mailbox is used. Missing configuration returns an honest unavailable response, never a false success. Tests inject a local delivery adapter and do not send mail.

`NEXT_PUBLIC_CALENDAR_URL` supplies a branded booking destination. Without it, the booking action opens a scheduling email to the new owner rather than the original owner's calendar. These deployment settings are documented in `.env.example`; no credentials are committed.

## Acceptance

Build/SSR and architecture checks verify delivery boundaries, not visual parity. On-screen comparisons must use the three agreed profiles, both languages, matching input/entry histories, complete forward/reverse journeys and each page's interactions. Record exact candidate/build identity and retain failed controls and review findings in `.artifacts/pages-parity-20261028/`.
