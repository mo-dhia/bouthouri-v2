# Final page architecture and performance review

Completed 2026-10-29 for HOME, Vision, Services and Contact, in English and
Arabic. Projects is excluded. Production build: `kHRxV73n38JEPXijOa628`.
Repairs: `8f92d4f`; server-view extraction: `f90477f`.

The final independent repair review found no remaining concrete P1/P2 or
explicit architecture violation in the reviewed scope. Four confirmed findings
were corrected and validated. This is an architecture, loading and lifecycle
review; the finite visual-review limits below still apply.

## Corrections

| Finding | Final behavior | Verification |
| --- | --- | --- |
| HOME text could select tablet geometry while its camera selected desktop, because a scrollbar narrowed the host. | Both select the profile from the CSS viewport. Measured host width still controls physical text projection and work-origin radius. | Actual EN/AR typography regressions at viewport/host widths 1025/1010 and 601/586, graph retention, category changes and disposal. |
| A disposed Services mount could start model loading after its controller chunk arrived. | The mount checks its lifetime before calling the factory; the shared factory rejects pre-aborted work before requesting the GLTF. Existing shared loads remain usable by live consumers. | Held-import normal/reduced mount tests and real factory pre/post-load cancellation tests. |
| A cancelled HOME boot request could retain the quiet-window sampler while hidden. | Cancellation removes its pending request and releases its own waiter immediately. Empty waiters stop the sampler; independent callers and granted owners retain their existing ordering and cleanup. | Twelve boot-gate tests, including hidden cancellation, same-turn reentry, independent waiters and granted ownership; two additional independent schedules. |
| Vision's entry directly owned its server section markup outside numbered folders. | The entry composes `1-opening`, `2-perspective` and `3-narrative` server views, with shared server-only markup/data helpers. | EN and AR production `<main>` HTML is byte-for-byte identical before and after extraction. CSS, content, controllers and null gate are unchanged. |

The runtime/profile suite retained twelve expected failures before the fixes and
passed 27 tests / 846 assertions afterward. The boot-gate suite retained seven
expected failures before repair and passed twelve tests / 158 assertions afterward.
The independent R15 review passed fifteen bounded preservation/lifecycle checks
and verified the frozen source fingerprints. It found no further justified fix.

## Architecture and rendering

Reviewed against [code splitting](code-splitter.md), [SSR/CSR](ssr-csr.md),
[load architecture](load-architecture.md), [animation ownership](animations.md),
[fixed viewport design](viewport-design.md), the local styling guide and the
installed Next 16.4.3 server/client and lazy-loading documentation.

- Route copy, headings, ordinary navigation, images and metadata remain server
  content. All eight localized pages prerender. The Contact API remains dynamic.
- Client gates render no content. Controllers and Three/text/model runtimes stay
  in deferred graphs; progress remains outside React state. The architecture
  audit passes with 178 modules, 29 client entries and 40 initial-client modules.
- Script-blocked checks covered all eight routes before the final isolated
  repairs: readable content, ordinary links and footer word remain available.
  Contact submission deliberately requires enhancement; direct contact and booking
  links remain available. HOME's hidden duplicate headings have visible reading
  counterparts. This evidence is reused with unchanged CSS/content and the exact
  Vision HTML comparison; it is not a new blocked-chunk test of every failure path.
- Fixed profiles remain 1920×1080, 768×1024 and 412×915. DOM sizing uses the
  width-based composition; SVG user-space metrics and Canvas/Three reference
  coordinates scale once through their renderer. Physical buffers, visibility,
  pointer mapping and scroll extents retain their documented physical units.
- Production CSS samples covered 1920, 1440, 768, 650 and 412px widths. At fixed
  1920px and 650px widths, changing physical height left the sampled design
  geometry and type unchanged. The final fixes change no stylesheet or authored
  motion constants.

## Loading and runtime controls

The emitted initial-script sets contain no detected Three renderer, GLTF loader
or Troika text implementation; source-graph review independently confirms those
deferred boundaries. Framework-inclusive gzip estimates are 194,272 bytes for
HOME, 182,994 for Vision, 183,381 for Services and 183,731 for Contact, with the
same sets in both locales. These are compressed-file estimates, not measured
network transfers, parse costs or a performance score.

Fresh production checks confirmed a single background canvas. Its material clock
remained unchanged throughout an observed 1.25-second hidden interval and resumed
when visible. MENU's authored tail continued. Actual MENU navigation from Contact
to Vision retained the same canvas and host, completed the hero, closed the menu
and kept fonts ready. The temporary identity reference was cleared by a fresh
Contact reload; the local tab was left at y0, 1920×1080/DPR1, with menu closed,
motion enabled and blank form fields. No recording, decoder or diagnostic proxy
remains running. Development port 3000 was retained.

## Integrated validation and limits

- `bun run check`: lint, Next route types, TypeScript, architecture and
  **403 tests / 16,131 assertions**, all passing.
- `bun run build`: all localized static pages and the Contact API pass.
- `bun run test:ssr -- http://localhost:3100`: both locales, RTL, metadata,
  redirects, 404s and twenty static assets pass.
- Production Vision HTML comparison: EN 705 canonical events and AR 676 events;
  both raw `<main>` responses are identical before/after.

Raw reports, red/green logs, source manifests, CSS samples and browser receipts
are retained locally under `.artifacts/pages-parity-20261029/final-review-r13/`,
`final-review-r14/` and `final-review-r15/`. These are review artifacts, not
application dependencies.

No presented-FPS improvement or universal frame equality is claimed. The tested
Firefox does not support long-task performance entries, so no zero-long-task
claim is made. This review preserves the finite body/motion scope and source
native-footer exclusions in [the current status](editorial-parity-status.md),
[R7](pages-reduced-readiness-review-r7.md) and
[native R10](pages-native-footer-contact-review-r10.md). Existing artificial
reachability seams remain ungraded. Bouthouri branding and the separately
committed portrait-brightness restoration are preserved.
