# HOME adversarial review — round 9

2026-10-27, approximately **11:03–11:23 UTC**. **Accepted within the bounded R9 scope: R8-01 and R8-02 no longer reproduce. No new actionable P1/P2 finding was established.** This is not full HOME, continuous-motion or hardware parity acceptance.

This was a fresh independent review of frozen implementation **41da321**, including header **0a98f59** and scene **f155d0c**, at documentation HEAD **4e37e0d**. The accepted local frames below use production `http://localhost:3100/en` or `/ar`. Parent-reported **93 tests / 3,365 assertions**, ESLint/Next typegen/TypeScript, production build with both HOME routes statically generated, and production SSR audit remain attributed parent evidence. I did not run project checks, tests, builds, typegen or package commands, edit implementation, commit, manage processes/servers, or delegate children.

I read the project/architecture rules and inspected the navigation, journey integration, UI/motion/failure ownership and header changes. The navigation callback runs after outgoing cleanup and synchronous destination-intent selection, before restoration. Its new-owner/canonical-path test preserves first-owner early reading choices and same-owner remounts. The navigation module has no Storio dependency; the journey supplies the reset callback. The added fixtures include the real opening gap, distinct records, Back/Forward, same-owner/early-choice and detached-owner cases. Those are inspected code and parent-run unit evidence, not independently rerun tests.

Only Vaelix source **175555005** and local **175555011**, original window **175554986**, were operated. Initial/final inventory is one window with four original tabs. New Tab **175555200** and Proton onboarding **175555201** were untouched. No new surfaces, browser launches, profiles, proxies, iframe workarounds, Vawzen/Veyra or CUA were used. A navigation-helper history excursion into a pre-review development entry is explicitly excluded below.

## R8-01 — reading preference and locale departure: bounded acceptance

The healthy wide trigger was exercised against the source and frozen production: ordinary foreground EN entry, trusted QUIET choice, completed entry, native **5263 / approximately 40**, actual reading toggle, native **1009**, then the visible Arabic link. After settling, both destinations are healthy Arabic motion HOMEs, rather than retained reading layouts.

| Settled state | Source | Production |
| --- | --- | --- |
| Destination / viewport | `/ar`, 1912×1009 / DPR1 | Same |
| Reading toggle | false | false |
| Document height / native y | 30610 / 1009 | 30610 / 1009 |
| Story / opening | 0 / 0 | 0 / 0 |
| Hero world | .4790 | .4789 |
| Readiness | localeReady true, route idle, appBoot ready, hero complete | navigation ready, scene/boot ready, hero complete |

The observed world rounding difference is the existing helper precision, not the former y915 landing. The reverse **AR reading → visible EN** run also produces motion, document height30610, y1009 and zero story/opening in both. Single native `history.back()` and `history.forward()` traversals after the primary EN→AR run restore EN1009 and AR1009 respectively; production consumes the HOME return on Back.

Production's complete pretransition observation directly records **reading=true**, hero height1009 and opening absolute top1113. Its ordinary history checkpoint remains **hero1009/1113 = .90655885**, while pending locale is **opening0** and generic HOME return is **hero1**. The outgoing reading state is captured before the destination resets it. The source destination's `localeRestored=opening` and its actual Back/Forward behavior agree. Fresh source raw pretransition record objects were not harvested; their representation retains the parent's earlier source capture evidence.

The **392×865 / DPR1** EN→AR variant uses the visible language link inside the actual menu. Both depart reading at y865 and arrive in motion at **y865 / document22637 / story0 / opening0**, source world.5186 versus production.5187. Production separately retains ordinary checkpoint **hero865/981 = .88175331**, locale opening0 and HOME hero1. Thus the narrow 116px opening inset also does not leak into locale capture.

Evidence: `source-reading-locale-destination-ar-healthy`, `local-reading-ar-destination2`, `local-reading-locale-destination-ar` (complete outgoing wide record), `*-real-*1009` / `local-single-*1009-verified`, `*-reading-reverse-en-result`, `*-narrow-reading-ar-result`; primary JPEGs `source-reading-ar.jpg` and `local-reading-ar-shot.jpg`.

## R8-02 — persistent MENU: bounded acceptance

The persistent control now matches the source's chapter-side measurements. Values below agree on both pages; positions are CSS pixels.

| Locale / viewport / context | Font | Width × height | Left / top | Utility label reserve |
| --- | ---: | ---: | ---: | ---: |
| EN1912×1009, chapter312 | 11.44px | 101.75 ×44 | 1733.78125 /49.625 | 102px |
| AR1912×1009, reading | 14.56px | 114.234375 ×44 | 1721.296875 /49.625 | 114px |
| EN392×865, chapter312 | 11.44px | 64 ×44 | 304.484375 /16 | 64px |
| AR392×865, footer714 | 14.56px | 74.234375 ×44 | 294.25 /16 | 74px |

Both persistent controls inherit type scale1.04/tracking scale.8, zero CSS letter spacing, and the source line-height16.588px EN /23.296px AR. The EN wide utility dock also agrees at **x1529.53125 / y49.625 / width202 / height44**; AR wide agrees at x1517.53125. At width901 the EN control remains101.75px, left763.21875/top49.625 and reserve102; at width900 it becomes64px, left782/top16 and reserve64, with the utility dock hidden on both pages.

The source's live `.chapter-side` ancestry and CSS establish the variable owner and 11px/14px bases. The local override is scoped to `[data-shell-side-menu]` through its CSS module; font-ready/resize measures its rounded width for the utility reserve and teardown removes that property. Primary Latin and Arabic faces report loaded in their exercised visible contexts. The optional source fallback face error/`localeFontFallback=true` flag is not treated as a missing primary font.

The separate hero/dialog controls retain their source metrics: EN wide hero9.225px/width88, dialog9.225px/width95; AR hero12.24px and narrow dialog12.24px/width75. EN narrow dialog remains8.2px. Both EN wide and AR narrow motion menus were opened, closed for200ms, reopened, allowed to finish, then closed. Both retain the modal during closing, reopen successfully, preserve native y and return focus after final close. Reading-menu behavior and reading typography were also exercised. This checks the changed shell integration; it is not a new all-track timing certification.

Evidence: `*-en312-header`, `*-ar-reading-header-wide`, `*-en312-header-{901,900,392}`, `*-ar714-narrow-header`, `source-header-variable-owner`, `*-en-menu-header`, `*-ar-narrow-menu-open`, `*-motion-menu-reverse`, `*-ar-narrow-menu-reverse`, and `header-summary.json`.

## Targeted regression checks

| Area | Independent R9 result |
| --- | --- |
| Same-HOME reading lifetime | AR wide reading1009 retains reading=true, y1009 and the same object canvas/WebGL2 context through READY and same-size resize. Menu open/close/reopen and actual sound on/off leave reading active and the canvas retained. Audio returns muted. Early reading before deferred navigation and same-root/Strict/hash/query/BFCache preservation retain inspected code and parent unit evidence. |
| Retained locale312 | EN wide312 → visible AR gives AR16362/312; actual resize392×865 gives12091/approximately312. After seeking footer21772/714, same-size resize, READY and an irrelevant attribute transaction stay714 in both. The temporary attribute is removed. |
| Retained reading adapter | That restored AR footer → reading gives **3827**, then motion gives **12091 / approximately312**, retaining the same canvas/context in both. |
| Pristine HOME return | A subsequent seek to ARfooter714, with no intervening Back since the fresh EN312→AR locale navigation, then single Back restores **EN12091/312**. Forward restores **AR21772/714** in both. This is the HOME_RETURN branch; the distinct cleared generic-return489.35 branch retains R8 evidence and was not repeated. |
| Ordinary mode offset / reload | Separate ordinary foreground EN documents:580/native25188 → reading clamps to **11437**, then motion stays11437 in both, with the same canvas/context. Ordinary reload after these toggles stays **ready0/story0/opening0/manual restoration** through the later wait. Actual QUIET entry then completes normally at0. |
| Failure and new HOME | Actual production `WEBGL_lose_context` removes the object canvas and exposes reading. Two actual mode toggles leave failure latched with no object canvas. Visible locale navigation mounts a different healthy canvas/context, clears failure and returns to motion. Source failure behavior retains R8 acceptance; it was not independently repeated here. |
| Representative geometry | EN wide and AR narrow312/580/714 have matching relevant project visibility/inertness and footer geometry. Sampled312 project x differences are about.024px EN / .003px AR at the small score-rounding difference. Fresh locale opening0 and subsequent AR174 show the complete Arabic title/sculpture. EN/AR menu and footer captures are retained. |
| Errors | Returned console buffers contain no new R9 hydration/error exception. Their retained old entries are a favicon404 at10:21:39UTC and development promise exceptions at08:59:57/09:31:26UTC, all before R9. This is the tool's recorded buffer, not a guarantee of exhaustive interception. |

Representative images are **downsized, lossy Vaelix computer JPEGs**, wide1338×706 and narrow274×606, approximately.7× the CSS viewport. The narrow originals already contain the narrow viewport without physical-window padding. They support bounded visual inspection alongside full CSS measurements; no new pixel MAE/p99 acceptance is claimed. The AR174 pair is a smoke comparison without new native camera/cache tracing. R8's accumulated narrow lighting history remains unresolved; this round does not close it or impose white-only optical behavior.

R8's accepted dark/dark and white/white optical branches, retained-reading resource/cue checks and other already accepted matrix areas remain bounded prior acceptance. No material/parent timing changes, extra renderer draws/conversions, cached atlas restoration, source storage/clock/media manipulation, GPU wrappers or module injection were used. Private512 disposal, held font/logo cancellation, fresh physical OS-reduced startup, no-JS/failed-chunk behavior and exhaustive resource permutations were not rerun in R9. SSR and current build/check guarantees retain the parent's evidence.

## Evidence integrity and exclusions

Canonical evidence: **`/tmp/gazzar-home-review-r9/`**. `evidence.jsonl` contains **210 uniquely labeled retained tool records**, with complete critical responses saved before excerpts; later records also include tool arguments/scripts. `evidence-index.json` decodes them. `header-summary.json`, `screenshot-manifest.json` (**19 original images**), `exclusions.json`, `provenance.json` and `release.json` provide compact indexes. Derived pairs put source left. No copied-array logger was used. Some early exploratory reads are only in the tool transcript; no missing record is represented as complete. Sanitized private Next history internals are not used as semantic evidence.

Explicit exclusions are retained:

- Initial source assignments/reloads while it was not the foreground tab reached fallback/covering with localeReady=false. A foreground plain load recovered. These are not healthy comparison frames, and their cause is not adjudicated as a candidate defect.
- The Vaelix special `back` navigation helper jumped to a **pre-review localhost:3000 entry**; the following special Forward frame is excluded too. The existing tab was immediately assigned plain production3100/en. Subsequent independent single `history.back()`/`history.forward()` production checks pass. No development frame contributes to acceptance.
- A selector click rejected the 1px motion control as invisible, leaving motion active. That attempted reading setup is excluded; a fresh accessibility-ref click from score40 was verified reading=true before the confirmed locale run.
- A narrow source automation menu click changed native865 to471. That setup was closed, restored865, and reopened via the actual menu handler without scrolling. The retained before/after record confirms865 before the visible locale link.
- An initial offline crop wrongly assumed padding in the narrow computer JPEG. Incorrect derived crops remain marked excluded; original images are intact and corrected pairs use the complete originals. One source recovery screenshot initially saved through Vaelix to Downloads was immediately moved into the temporary evidence directory.

Physical touch/coarse-pointer hardware, other DPRs/GPUs/browsers, dynamic mobile bars, short landscape, every breakpoint, audible balance/autoplay denial, physical keyboard defaults, actual BFCache/denied-storage/expiry and continuous frame-for-frame motion remain unavailable coverage. Resize testing used Vaelix's **emulation-first** `resize_page`, not proven OS-native resizing or physical-mobile hardware. HOME destination-page content remains outside scope.

## Explicit release

**EXPLICIT RELEASE at 11:23:18 UTC**, with no pending browser calls and no browser use afterward. Source and production remain plain **EN / y0 / 1912×1009 CSS / DPR1**, actual hero **complete**, story/opening0, motion enabled, actual sound controls **Enable sound / false / muted / quiet**, menus closed, manual restoration and iframe0. There is no active hold: source footer reports `data-held=false`; production's inactive initial footer has no held attribute. Final audits show no R9 globals/temporary attributes and empty root/body inline styles. Fresh ordinary reloads removed document-local diagnostic references/listeners. No canvas-width overrides were introduced. Restoring original metrics is not claimed to clear CDP emulation.

Final inventory remains the original one window/four tabs, production3100 active. Only this report remains changed in the checkout, with final evidence confined to the temporary directory; implementation remains frozen. The parent owns any further implementation, validation, commits and browser work. **R8-01/R8-02 are accepted for the measured triggers above; universal parity is not asserted.**
