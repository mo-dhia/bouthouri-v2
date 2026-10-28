# Services implementation contract

Owned implementation: `src/sections/services/`. Entry: default
`ServicesContent({ locale: 'en' | 'ar' })` from `services.tsx`. It renders the
body only, inside `#services-content[data-services-page]`. No route, metadata,
navigation, footer, HOME, global CSS, store, package, server or source-app edits
were made by this implementation agent.

The R1 repair follow-up additionally authorizes exactly the shared
`src/sections/vision/1-opening/practice-objects.ts` renderer and its focused
tests. Vision's remaining app files stay frozen and unmodified by this agent.

## Shell contract

The parent supplies `<main class="editorial-page practice-page solving-page">`
with the correct `dir`, no content padding, source editorial colors and fonts,
`--ed-gutter` (EN desktop/tablet/mobile 5.3vw/7vw/7vw; AR 6vw in all profiles),
and the shared fixed `.editorial-nav`. Services inherits that variable in all
profiles and never redeclares it on its body wrapper. The parent
owns the common environment pose: source time 448, environment .28,
surfaceQuiet .65. The Services journey supplies its source opaque #080909
surface and gate underlay #050606. Shared shell controls do not need a new
Services-specific API. The final CTA links to `/${locale}/contact` with
prefetch disabled. The hero advance is an SSR anchor to `#services-journey`;
its controller enhances it to the measured source reading start.

The only cross-page dependency is the agreed deferred renderer exported by
Vision at `src/sections/vision/1-opening/practice-objects.ts`:

```ts
createPracticeObjects(canvas, 'services', signal): Promise<PracticeObjects | null>
resize(actualWidth, actualHeight): number
render(heroExit, pointerX, pointerY, reduced, seconds, entry): void
dispose(): void
```

It uses the Services source `Logo_Part_02_Finished`. Services owns its RAF and
does not import the HOME story object graph. The renderer normalizes its camera
internally; Services supplies physical measured canvas dimensions.

## Content and geometry

`content.json` contains all displayed EN/AR copy extracted from the supplied
source HTML: hero, opening, band, gate instructions/help/status/payoff, all
eleven complete service descriptions, and closing CTA. It is imported only
through server-only modules. No identity appears in Services body copy to
replace; shell identity remains parent-owned.

Sections:

1. `1-hero/hero.tsx`: source clarity hero, staggered line entry, native advance.
2. `2-opening/opening.tsx`: source pinned intro, font glyph, band and grab gate.
3. `3-index/service-index.tsx`: source eleven text rows, rules and small hover
   translation. There are no source accordion/card/grid interactions to invent.
4. `4-closing/closing.tsx`: complete source closing and contact link.

The CSS is a focused subset of the public source styles, ported into local
CSS Modules. Raw source class names are retained alongside module names for
the source typography overrides, shell selectors and evidence selectors.
The source cascade was evaluated at 1920×1080, 768×1024 and 412×915 using the
existing fixed-viewport CSS utility; the resulting stylesheet has three
exclusive width profiles, no vh/clamp or height/orientation geometry query.
Each profile preserves its original source breakpoint results. All design
lengths are vw. Hairline outlines/borders and SVG-local stroke numbers retain
their respective paint/camera units.

Root's desktop live source capture reports hero1080, journey4212,
index4452.2666 at5292, closing1080 at9744.2666, native max10695 before the
approved BOUTHOURI footer difference. These are comparison targets, not local
browser validation results. Source index entry transforms and line masks can
affect reported heading rectangles even when their rows are below the fold.

## Source animation semantics

One Services presentation RAF consumes `scrollManager` with `useRAF:false`.
No scroll progress is stored in React or Storio. The null client gate imports
the local controller; the object runtime is an additional deferred import.
One guarded `schedule()` reserves both externally requested and continuing
frames. `wake()` separately marks DOM composition data dirty; ambient
continuation does not. An opening reset/release that wakes synchronously from
measurement therefore shares the already reserved next callback.

The opening scroll range is measured from hero top to journey bottom minus
stage height. Intro starts at journey top minus .18 stage height. The hero
advance targets introStart + .2875 × (end − introStart). The chapter remap
matches the source, including the hero departure endpoint.

Source chapter windows retained:

- Intro label 0–.07, title .025–.15, second line .06–.19, copy .12–.27.
- Glyph leaves DOM at .305; intro withdrawal .305–.385.
- Glyph area consolidation .35–.465, rotation .385–.53, expansion .475–.605.
- Band text entry .605–.665, travel .65–.835, text exit .835–.885.
- Band collapse .84–.89; gate opening layer .89–.965.
- Gate interactive at .965; glyph/intro ownership resets at/before .89.

The gate retains the source 1/240s spring integration, normal/touch arming
thresholds .54/.44, touch hold .17s, vector pull, armed release, cancelled
return, aperture expansion, hand-to-line contour merge and timed payoff.
Touch movement before the hold cancels the pending grab and allows native
scrolling. Enter/Space opens directly; arrow keys pull and Enter/Space releases;
Escape cancels. Scroll-away, lost capture, route start, hidden document and
blur have release/reset paths. The screen-reader live status announces a
resolved opening. Source `services-gate` CustomEvents remain available for
parent-owned intent audio, but no audio resource is created by this page.

Index reveal triggers retain source title/copy/rule windows and per-line
power-four masks. Editorial copy drift remains the source 24/40/10 reference
pixel heading/copy/meta translation, with .45 portrait factor. Authored
composition/index reveal ranges use the fixed design height. Physical
viewport height controls actual visibility only. All DOM design translations
are emitted through `pixelsToVw` after scaling their reference lengths once.

DOM rectangles are physical. Glyph/baseline rectangles and pointer positions
normalize once into the fixed SVG reference camera. The hand hit box returns
to DOM coordinates once; CSS font lengths normalize before SVG viewBox
scaling. The band's imperative `fontSize: <reference>px` is deliberately an
SVG user-space length inside its reference-sized viewBox; it is not a CSS
screen-pixel design dimension. The inherited physical vw font is divided by
the outer scale once, then the viewBox applies that scale to text and path
together. SVG strokes scale through the viewBox rather than non-scaling-stroke.

## Reduced, failure and cleanup

OS reduced motion retains the source 2.9-design-height pinned opening,
readable masks, stationary editorial copy, quiet glyph destination and direct
gate resolution. The no-JS/controller-failure path displays the intro, band,
works/payoff and full index in readable document flow. A renderer failure
hides only the decorative canvas. All copy, headings and the contact link are
in server markup.

Import/create/null adoption, adoption resize, later measurement resize and
draw/context-loss errors use the same Services failure handler. It latches
failure, clears the renderer reference, attempts GPU disposal, hides the canvas
and publishes `data-depth-fallback`. A disposal error cannot escape into the
independent DOM entry/gate transaction. Failed draws do not stop that
transaction or repeatedly call the failed renderer.

The shared object renderer chooses its fixed profile from CSS viewport
`window.innerWidth`, including when a classic scrollbar makes the measured
host narrower across a 600/1024 boundary. It preserves the actual measured host
width for buffer allocation and its single world normalization. Its returned
physical extent is converted to CSS vw with the viewport width, so a measured
host width is never mistakenly used as the CSS vw denominator. Source pose,
camera, lighting and spring constants are unchanged by this repair.

Presentation stops when hidden or MENU is open. Gate ambient hand motion runs
only while its stage is visible. Intro idle time is accounted for on the next
input without rendering invisible hand frames. Teardown aborts async renderer
adoption, removes the manager key, RAF, observers, font/input/store listeners,
line fragments, inline mutations and owned GPU resources. Motion mode changes
remount from the current native scroll position.

## Validation and outstanding acceptance

Scoped validation run by this implementation agent:

- `bunx eslint src/sections/services`: passed.
- `bun test src/sections/services/2-opening/opening.test.ts`: four passed,
  2,224 assertions. Fixtures were generated by independently evaluating only
  focused public-source score/glyph/spring functions. They cover all three
  profiles, EN/AR, armed/cancelled release and finite aperture geometry.
- Parent-coordinated plain tsc found two implementation callback signatures,
  both corrected; its next snapshot found only a test expected-string typing,
  also corrected. That pre-repair parent snapshot was empty. The agent did not
  start a concurrent tsc/build/check process; root owns a new combined pass for
  the R1 repair.

Persistent analysis and fixture-generation scripts are under
`.artifacts/pages-parity-20261028/services/`. Source reference files remain in
the parent-owned reference cache. No compiled source application, React or
GSAP bundle is imported/shipped by this implementation.

No browser, OS/native input, new tab/window, server/process, package action,
build, full check, stage or commit was run by this implementation agent.
Parent owns integration validation and actual acceptance. Still required:
matched local/source EN/AR at all three reference sizes, continuous glyph/band
and drag-release video comparison, touch hold/native scrolling, keyboard,
restored scroll, MENU pause, resized-width normalization, reduced/no-JS,
blocked-controller/renderer failure, and the approved heavier/taller footer.
Offline fixture tests do not establish visual acceptance.

## Independent source review R1 repair

[`pages-vision-services-source-review-r1.md`](pages-vision-services-source-review-r1.md)
reported three P2 findings: duplicated Services RAF chains following a
synchronous measurement wake, an uncaught post-startup graphics error, and
shared-renderer host/viewport profile disagreement. All three were accepted
and patched in the authorized files. The original review and failure evidence
remain unchanged.

Focused regressions are authored in `services.animate.test.ts` and
`vision/1-opening/practice-objects.test.ts`. They evaluate the actual controller
and renderer modules through an isolated test loader, without process-global
module mocks. The Services fixture runs the real opening measurement, score,
spring, surface and hand code; DOM, line-mask and graphics adapters are inert.
Coverage includes repeated resize/font measurement wakes, one outstanding RAF,
ambient frames without redundant index dirtying, cleanup/MENU pause, startup
import/create/null/resize failure, post-startup draw/resize failure, independent
text completion and keyboard gate resolution. Shared-renderer fixtures cover
1025/1010 and 601/586 viewport/host widths, both variants and locales, repeated
normalization, subsequent viewport changes and the context-loss error latch.

Root explicitly released the measurement window with `MEASUREMENT_CLEAR`.
The repair was then validated with:

```text
bun test src/sections/services/services.animate.test.ts src/sections/services/2-opening/opening.test.ts src/sections/vision/1-opening/practice-objects.test.ts
11 passed, 0 failed, 2,467 assertions

bunx eslint src/sections/services src/sections/vision/1-opening/practice-objects.ts src/sections/vision/1-opening/practice-objects.test.ts
passed, no output
```

The first test run caught a fixture-only floating-point comparison
914.9999999999999 versus915. It was corrected by rounding the reconstructed
reference extent after the existing integer-closeness assertion. The first
lint run caught a test helper variable named `module`; it was renamed
`evaluatedModule`. These first-run logs are retained beside the final logs in
`.artifacts/pages-parity-20261028/services/r1-fixes-*`. The final test/lint run
passed after both corrections. No further runtime app change was needed.

The patched runtime, tests and contract are now frozen. Root's combined
TypeScript/production checks and fresh independent review R2 are still
required. The earlier passing build applies to the pre-repair candidate.
Inert fixtures do not prove browser/GPU behavior, presented FPS, or
visual/moving parity. No browser/native input, server, build, type generation,
package management, staging, commit or delegation action was performed for
this repair.

## Frozen integration candidate

Services app/CSS changes are frozen for the parent production build. The
parent's settled EN tablet comparison reports matching hero/journey heights,
complete heading/foot after entry settles, and source/local index heights
3504.3501/3503.75 (a remaining .60px comparison difference). No offline pixel
retune was attempted. The first local capture occurred during initial
compilation/entry and is not an acceptance frame. AR, mobile, moving gate and
continuous transition comparisons remain part of parent acceptance above.

## Source gutter inheritance repair

The root's live diagnosis on build `8HHoGLRzQ2ZvMlcWuzlyf` at `770aa24`
identified an absent shared-main `--ed-gutter` on desktop: the header padding
and index padding became invalid, and the auto-width hero text wrapped into
four lines. Root's temporary main-only `--ed-gutter:5.3vw` plus the existing
resize path restored the EN hero width to1716.5px, header padding to
194.4px/101.75px/75.6px and index height to4452.25px versus source4452.2666px.
This diagnostic is retained at
`.artifacts/pages-parity-20261028/root/services-desktop-missing-gutter.json`.
It is root's evidence, not a browser comparison performed by this agent.

Root owns the shared CSS correction. Services separately removed its two
compact `.page { --ed-gutter:7vw }` declarations and the matching generator
fragment. A declaration on a child bypasses a parent's Arabic specificity;
inheriting in every profile now preserves the source's EN5.3vw/7vw/7vw and
AR6vw/6vw/6vw. Root also measured AR tablet source header/index gutter at
46.0667px (6vw before layout quantization), versus the old local53.75px (7vw).
No controller, entry, renderer, shared CSS, HOME or route file was changed for
this follow-up.

`services-css-profile.test.ts` retains the exact four source declarations:
base editorial5.3vw, Arabic editorial6vw, through700px editorial6vw, and the
source compact width/aspect practice7vw. It evaluates their specificity at
the agreed reference canvases and reads the actual parent CSS API at
`src/components/layout/editorial/editorial.module.css`. The regression checks
the six locale/profile values, absence of any owned gutter shadow, all four
body compositions consuming the inherited variable, and an explicit failure
when the actual parent gutter declarations are removed. It supplies no copy
of root-owned CSS or production fallback value.

After root's `MEASUREMENT_CLEAR`, the actual commands/results were:

```text
bun .artifacts/pages-parity-20261028/services/prepare-css.ts
exit0; generated CSS diff is exactly the two compact gutter deletions

bun test src/sections/services/services-css-profile.test.ts
4 passed, 0 failed, 27 assertions

bunx eslint src/sections/services/services-css-profile.test.ts
exit0, no output
```

The first test run found that PostCSS retains trailing whitespace on the
parent's last custom-property value (`5.3vw `). The test resolver now trims
the value before comparison. That first-run log and the final passing logs
are retained under `.artifacts/pages-parity-20261028/services/gutter-profile-*`.
No additional app correction resulted from that fixture-only mismatch.

The stylesheet, generator, focused profile test and this contract are frozen.
The root's earlier build does not validate the unserved CSS correction;
root owns combined TypeScript, rebuild and renewed geometry acceptance.
Static CSS cascade checks do not establish full pixel or moving parity.

## Arabic masked-line source cascade repair

Fresh root visual R2 evidence at
`.artifacts/pages-parity-20261028/full-review-r2/ar-services-tablet-row-lead.json`
and `ar-services-tablet-row-computed.json` showed identical copy, rendered
three-line fragments, 6vw gutters, 48px/54px row padding and26px copy margin,
but source/local row heights297.133/299.933px and index heights
3785.933/3816.717px. Root traced the accumulated31px closing drift to mask
ink padding: source±.14em (2.71367px at the captured copy font) versus
local±.19em (3.67967px). These are root-owned browser measurements, not an
acceptance comparison performed by this agent.

The source's later `36vl4h0t25ivv.css` declares
`html[lang=ar] .masked-text .masked-text-line` with margin-block−.14em and
padding-block.14em. Its specificity equals the earlier0ht typography rule
`html[data-typography=questrial-cairo][lang=ar] :is(.masked-text-line,.editorial-line)`;
later source order therefore wins for masked lines. Plain Arabic editorial
lines retain .19em. The Services generator now preserves that distinction for
both server-rendered local mask classes and raw runtime rendered-line masks,
and all three generated profiles changed only their two AR mask selectors.
EN masks remain .09em. No controller, reveal stagger, row dimension, copy,
gutter, SVG user-space boundary or shared CSS was changed.

The portable fixtures in `services-css-profile.test.ts` retain the relevant
0ht and36 margin/padding declarations in original order. Tests resolve the
actual global stylesheet plus Services CSS Module cascade, distinguishing
local server classes from raw runtime classes, for EN/AR × three profiles.
They also verify the equal-specificity source-order override and the plain
editorial-line exception. Existing parent-gutter regressions still pass.

Actual commands/results in the clear measurement window:

```text
bun .artifacts/pages-parity-20261028/services/prepare-css.ts
exit0; generated CSS diff contains exactly six AR mask-rule corrections

bun test src/sections/services/services-css-profile.test.ts
6 passed, 0 failed, 67 assertions

bunx eslint src/sections/services/services-css-profile.test.ts
exit0, no output
```

Logs and frozen hashes are retained under
`.artifacts/pages-parity-20261028/services/ar-mask-profile-*`. No CPU job
remains active. The stylesheet, generator, profile tests and contract are
frozen for root's combined checks/rebuild and fresh visual recheck. The
served `yWFD32LNWavnwkZN_JMni` build predates this correction. Cascade fixture
success does not establish full pixel or continuous-motion parity.
