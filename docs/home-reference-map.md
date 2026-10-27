# HOME reference map — initial audit, 2026-10-27

Scope: public [English HOME](https://www.thisisgazzar.com/en) and [Arabic HOME](https://www.thisisgazzar.com/ar). This is an implementation reference, not a parity pass. Read with [home-parity-review-r1.md](home-parity-review-r1.md). No source implementation edits, commits, or builds were performed by this reviewer.

## Evidence and reproducibility

Live inspection used reviewer-owned Vaelix tabs `175555013` (EN desktop), `175555019` (EN then AR mobile), `175555021` (AR desktop, locale switch and Wujhat round trip), and `175555023` (local). Parent tabs `175555005` and `175555011` are reserved. Initial navigation without a unique query unexpectedly reused the existing source tab; subsequent navigation used unique `?audit=home-r1-*` queries to create separate windows. Vaelix computer actions proved unsafe for explicit tab targeting and were abandoned. Several coordinate calls landed on a pre-existing local identity background; no navigation or submitted action was observed, but transient pointer effects were not established. Use tab-scoped JavaScript, screenshots, and click-element calls. Reviewer-owned tabs were closed after publishing the inventory to avoid competing for rendering resources.

**Activate the exact source tab before waiting for animation or taking comparison captures.** Background/hidden source animation can stop with `.experience` score attributes updated but rendered layers stale. One opening capture showed the previous philosophy text at story score zero; it was superseded by the `foreground-verified` capture. The authoritative attributes are on `.experience`, not `#top`. For every comparison record viewport, DPR, `scrollY`, `data-story-time`, `data-opening-time`, `data-progress`, locale, entry/cache state, and rendered-layer readiness. The audit's waits were sampling delays, not animation-duration measurements.

Reference retrieval/inspection was approximately 2026-10-26 23:42–23:52 UTC (2026-10-27 in Tunis). Raw HTML, public bundles, extracted data, models, measurements, and PNGs are in `/tmp/gazzar-home-audit-r1/`. These temporary files are available for immediate implementation but are not repository assets. `measurements.json` records samples; `screenshot-files.json` lists copied PNGs under `screenshots/`. Do not use filenames containing `quiet-top`, `quiet-active`, the first `en-mobile-menu`, or the unqualified `opening-y1500` as settled-state evidence: some were taken before a transition, after a failed action, or with stale rendering. Prefer `menu-settled`, `reduced-programmatic-confirmed`, and `foreground-verified` captures.

Evidence labels below: **Live** = inspected DOM/geometry or rendered capture; **Source** = recovered from public shipped code/CSS; **Open** = requires a further live test. Static code describes the intended behavior and is not proof every branch worked in this browser.

## Scroll dimensions and clocks

**Live:** desktop EN and AR at **1400 × 850 CSS px, DPR 1** had document height **25,786 px**, maximum scroll **24,936 px**, identity hero **850 px**, lens-story start **y=850**, and pin distance **24,086 px**. All story sections share the pinned stage; their absolute DOM tops are not consecutive content starts.

**Live:** resized-browser mobile EN and AR at **392 × 932 CSS px, DPR 1** had document height **24,390 px**, max scroll **23,458 px**, hero **932 px**, lens-story start **932 px**, and pin distance **22,526 px**. This is narrow-desktop responsive testing, not touch/DPR/device emulation.

**Source:** total input is `416.72`, consisting of opening input `22` plus journey input `394.72`. Opening duration is `26`; journey score ends at `714`. Desktop chapter CSS is `2833.696vh`; mobile is `2416.976svh`. Desktop pin distance is `round(6.8 * innerHeight * 416.72 / 100)`. Mobile uses the actual chapter min-height minus stage height and bottom compensation; it must account for `svh/dvh`, stage minimum `560px`, and viewport changes. Desktop stage minimum is `600px`. At 1912 × 1036 the desktop formula predicts document height approximately **31,429 px**, consistent with the parent's reported measurement; this reviewer did not independently measure that viewport.

For story score `t` in `0..714`:

```text
storyInput(t) = t                         when t <= 100
              100 + (t - 100) * 0.48     otherwise
pinProgress(t) = (22 + storyInput(t)) / 416.72
scrollY(t) = pinStart + pinDistance * pinProgress(t)
displayProgress(t) = (26 + t) / 740
```

The scene's displayed progress is **not** pin progress. At Wujhat (`t=308`), display progress is about `45/100`, while pin progress is about `.5324`. Do not divide the whole journey into equal viewport stages.

Opening input `q=pinProgress*416.72`, before `q=22`, is also nonlinear. With `a=16`, `extra=6`, `v=100/6.8` desktop or `100/5.8` mobile, and `s=(v+a)*.745-v`, map `q` to opening coordinate `d`: `d=q` for `q<=s`, `d=q-6` for `q>=22`, otherwise `d=s+(q-s)*(16-s)/(22-s)`. Opening time is `26*d/16`. The separate hero-world trigger runs from identity top through `heroHeight + heroHeight/v*22`; it overlaps the pinned opening. At desktop y=1500, observed opening time was `16.11`, story time `0`, world progress `.8016`; at y=2122 opening was complete and story time approximately zero.

## Stage inventory and sampled positions

| Stage | Journey score / source semantics | EN desktop sample y | EN mobile sample y |
| --- | --- | ---: | ---: |
| Identity | Before pin; portrait, background marquee, signature, entry, two shell arrangements | 0 | 0 |
| Opening | Opening time `0..26`; typography and scene handoff overlap identity departure | 1500 (opening 16.11) | not separately sampled |
| Editorial / glasses emerge | `t=0..28`; initial glasses distance to 9.4 over `0..22` | 2700 (`t≈10`) | — |
| Optical captions / lens approach | Captions below; focus to distance 3.2 over `23..48` | 4434 (`t≈40`) | 4283 |
| Lens crossing | distance `.035` over `48..70`, darkening `60..69`, optical veil `66..71`, distance `-.24` over `70..75` | — | — |
| Beyond / philosophy | Concept line reveal `76..84`, extension `93..101`; clear through `122..124` | 7323 (`t≈90`) | — |
| Perspective sculpture | first part; meaning enters `122..130`, clears `141..155`; chapter `124..168` | 8734 (`t≈130`) | 8305 |
| Clarity sculpture | second part; enters `166..174`, clears `185..199`; chapter `168..211` | 9982 (`t≈175`) | — |
| Direction sculpture | third part; enters `210..218`, clears `232..246`; chapter `211..241` | 11231 (`t≈220`) | — |
| Ideas / line origin | ideas foreground `241..306`; horizontal work entry `270..284`; introduction `281..289` clearing `299..307` | 12340 (`t≈260`) | — |
| Wujhat | project moment `308`, travel anchor `0` | 13672 | 12924 |
| Tranche Finance | project moment `345`, anchor `1.22` | 14699 | — |
| Remoteplatz | project moment `381`, anchor `2.72` | 15697 | — |
| 8returns | project moment `413`, anchor `3.88` | 16585 | — |
| Work → systems | work clear `430..451`, opacity clear `451..469`; handoff `436..442`; takeover depends on measured final symbol path | — | — |
| Clarity by design | title enters `425..451` / `439..466`, clears `511..533` / `521..543`; caption `472..489`, out `501..518` | 18444 (`t≈480`) | 17386 |
| Flexibility / structure | title enters `514..538` / `529..554`, clears `594..623` / `610..639`; caption `558..573`, out `592..612` | 21218 (`t≈580`) | 19981 |
| Closing | first line `604..629`, second `627..655`; scale/translation transition `663..714` | 23160 (`t≈650`) | — |
| Footer | invitation `680..699`, wordmark `690..714`, colophon `710..714` | 24548 (`t≈700`), 24936 (`714`) | 23458 (`714`) |

**Source optical-caption bands:** each tuple is enter / sharp / leave / clear, in story units. `01`: `14/19/25/30`; `02`: `26/30/36/41`; `03`: `37/41/47/52`; `04`: `48/52/57/62`. These use smoothstep opacity, blur from 12px on entry and 10px on exit, vertical movement from +16px to -8px, and changing tracking. A generic reveal misses this lens/focus relationship.

The chapter/whisper classification differs from the visual overlap ranges: editorial-perspective `<28`, look-closer `<73`, beyond `<124`, logo-perspective `<168`, logo-clarity `<211`, logo-direction `<241`, put-to-work `<282`, projects `<445`, editorial-clarity `<541`, structure `<639`, space `<663`, footer thereafter. Locale-restoration bands are another mapping: opening `-26..0`, perspective `0..70`, philosophy `70..112`, curve `112..156`, circle `156..201`, dash `201..241`, ideas `241..306`, work `306..448`, systems `448..547`, people `547..627`, closing `627..663`, footer `663..714`. Keep those meanings distinct.

## Projects: actual HOME media and behavior

**Live + Source:** HOME uses **continuous SVG marks and connectors**, not photographic/video project cards. No project raster/video URL was present in raw HOME HTML. The four fetched case-page HTML documents also contained no `img`, `video`, or `source` markup; that does not prove their entire deferred runtime is media-free. Do not invent thumbnail URLs from the project domains.

| Number / slug | EN identity and descriptor | Arabic identity/category | HOME destination |
| --- | --- | --- | --- |
| 01 / `wujhat` | Wujhat. / Travel technology / From possibility to place. | وجهات / تقنيات السفر | `/{locale}/projects/wujhat` |
| 02 / `tranche-finance` | Tranche / Finance. / DEFI / BLOCKCHAIN / A different financial structure. | Latin title retained; التمويل اللامركزي / البلوك تشين | `/{locale}/projects/tranche-finance` |
| 03 / `remoteplatz` | Remoteplatz. / Remote hiring / Good people. Beyond proximity. | Latin title retained; التوظيف عن بُعد | `/{locale}/projects/remoteplatz` |
| 04 / `8returns` | 8 / returns. / Ecommerce / returns / The journey after the purchase. | one-line `8returns.`; إدارة مرتجعات التجارة الإلكترونية | `/{locale}/projects/8returns` |

Exact original mark paths, all locale project records, and their context/domain fields were extracted into `/tmp/gazzar-home-audit-r1/data-48699.json` (`WORK_MARKS`) and `data-67241.json` (`WORK_PROJECTS`). The symbol meanings are flight, linked financial layers, people connected beyond proximity, and offset parcels. They are connected by ten measured drawing segments, not four independent decorative icons. Public source: [work data and mapping bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/0or6--g23od4n.js).

Geometry source: track width `5.6 * viewportWidth`; composition width `112vw`; desktop title top `28%`, x `5vw`, metadata top `76%`, x `6vw`, index top about `21%`. Mobile title top `29%`, x `6vw`, metadata top `77%`, x `7vw`. Symbol size before growth is `min(.5115*w,.66*h)` desktop or `min(.966*w,.476*h)` mobile; growth factors `[1.11,1.13,1.12,1.12]`; symbol center x is `.72*w` desktop / `.5*w` mobile, y around `.6*h` / `.58*h`. Odd project symbols receive `.028*h` vertical offset. Stroke is `1.25px`, brighter tip `1.35px` at `.45` opacity.

At 1400×850 the recovered pen drawing windows were approximately `294.166..310.441`, `331.685..347.350`, `371.098..382.747`, `392.302..416.653`. They depend on measured path lengths and viewport. Do not hardcode them universally. At `t≈308` Wujhat was centered but its symbol was only `.8497` drawn; hover emphasis was correctly absent. At `t≈312.07`, synthetic pointer-enter produced `data-work-hover=true`, symbol `data-emphasis=true`, draw `1.0000`. Fine-pointer desktop hover then runs a `1.9s` line-light traversal and lightens the title; mobile suppresses that effect. Source conditions require focused project, completed symbol drawing, and desktop/fine pointer. Explore link focus has equivalent emphasis. Active compositions become inert/unfocusable outside the focus window; avoid invisible links across all four track panels.

**Live:** Wujhat click navigated to `/en/projects/wujhat`. Browser Back restored HOME to `t=308`, y=13672. AR→EN language change at the same project preserved y and work semantic position, with `data-locale-restored=work`; it did not replay the entry. Source supports `?work={slug}` and a pending work-return record with a 30-minute lifetime. Case-page “Back to projects” points to `/en/projects?project=wujhat`, which is a separate route from the browser-Back behavior.

## Assets, typography, rendering

All paths in this table are relative to `https://www.thisisgazzar.com`. Downloads below are in the audit temp directory only.

| Public path | Observed role / details |
| --- | --- |
| `/images/hero-portrait.webp` | Identity portrait, 1536×1024; static semantic image plus enhanced portrait canvas |
| `/models/glasses-folded.glb` | 431,196 bytes; 31 meshes, no textures or authored animation clips; named Lens_L/R, Rim_L/R and hinge/temple parts |
| `/models/logo-finished-components.glb` | 573,944 bytes; `Logo_Part_01_Finished`, `02`, `03`; one embedded `Titanium_Microroughness` PNG; no authored animation clips |
| `/models/logo-lighting-r180.bin` | 196,608 bytes; four 64×64 RGBA LTC tables (two float, two half-float), not a scene/model |
| `/images/glasses-fallback.png` | 351,017 bytes; WebGL fallback poster |
| `/_next/static/immutable/media/Questrial_Regular-s.p.3x3y0nhc6wbcr.woff2` | DOM English font; regular 400 |
| `/_next/static/immutable/media/Cairo_Variable-s.p.2nkn5kw540dey.woff2` | DOM Arabic font, source face declared 400–500 |
| `/fonts/Questrial-studio.woff` | 52,240 bytes; separate scene text font |
| `/fonts/Cairo-studio.woff` | 42,688 bytes; separate Arabic scene text font |
| `/sounds/ambient-loop.mp3` | 3,193,627 bytes; audio layer, not the entire sound experience |
| `/sounds/sections/{name}-{en\|ar}.mp3` | Section whispers; names listed below |

SHA-256 model fingerprints: glasses `5fa88e4b22c53d30f63eceedfb9b74c37594aca1ecec1efb113cea966b8038ef`; logo `abe849797e26f239c778e73314f346f7f122230786028bd82978fd7e1b49e852`; lighting `a567636b67bdbc78c0e8f371ecd1d85f26b54288caf0ef135ddacfd99397a4f1`. Full glTF metadata/materials are in `model-inventory.json`.

**Source + Live:** base background `#090909`, paper `#e4e1d9`, muted `#8d8c85`, rule `#2c2c29`. There is also a global interactive material canvas, a portrait canvas, an object canvas, and a footer/environment layer. A flat CSS fill matches only the resting color, not pointer/scroll/click response. The background uses a pressure-field simulation with half-float ping-pong targets, height 128 desktop / 96 mobile, max width 288, simulation step `1/120`, restoring 10, damping 7.2, wave speed .3, viscosity .0018, and six-second activity/sleep window. Pointer stroke, held pressure, click pulse, scrolling and object guards contribute; it is not a generic radial glow. The final grayscale shader clamps linear output approximately `.0008..022`. Background Canvas uses demand rendering, DPR `[1,1.5]`, no antialiasing and low-power preference. [Background public bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/1nvdbh89vm0tk.js).

Object Canvas source uses fov `34`, near `.005`, far `60`, ACES Filmic tone mapping, exposure `1.1`, transmission-resolution scale `.5`, antialiasing, and demand rendering. Object DPR is bounded to 1.5 at widths <701 and 2 otherwise. The glasses scene is scaled 30 and centered using the actual lens centers/front plane; camera focus is derived from those centers. It has a custom softened silhouette shadow and generated lightformers. Importing the GLB with its default materials will be visibly wrong: runtime frames use linear RGB `.064`, metalness 1, roughness .24; lenses `.028`, metalness 0, transmission .13, roughness .16, IOR 1.52, thickness .00126, attenuation `#181818` at .008 distance. Lens darkness/transmission and light intensity change through the lens crossing. [Object renderer public bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/2kidhwora8ehx.js).

Logo runtime renames finished nodes to `Logo_Part_01..03`, retains the embedded texture, and sets graphite material to linear RGB `.043`, metalness 1, roughness 1.1 before animated environment/light treatment. The actual HOME component routes are individual piece presentations around `128`, `174`, `218`, followed by third-part departure through `278`; visible logo group spans approximately `98..306`. Do not infer the choreography from an exported generic `TIMING` constant alone. Scene text is foreground geometry with clip reveals and independent locale layout. Full pose keys and light rig are recoverable in [logo public bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/369vzr25ag57n.js).

**Source:** glasses can be grabbed only after emergence and before story time 7; sculpture grab windows are `[128,141]`, `[174,185]`, `[218,232]`. There are hover/inertial spring offsets and cursor grab/grabbing states. Desktop hover is fine-pointer gated. Pointercancel, blur, scroll movement, reduced motion and route changes must release interaction. Actual drag physics and touch behavior remain **Open** in this round.

Typography source: Questrial scene scale `1.075`, scene tracking `-.039`; Cairo scene scale `1.02`, tracking zero; Arabic body 450, headings 500. The DOM's synthetic weight token names do not mean a real Questrial variable font exists. Both actual DOM faces reported loaded. The page also reported `localeFontFallback=true`, while an optional local Arial fallback face errored; do not interpret that flag alone as proof the main font failed.

## Shell, links, menu and sound

**Live + Source:** home logo `/{locale}`; language `/{otherLocale}`; hero cue `#top`; skip link `#beyond`; conversation CTA `/{locale}/contact`. Menu and footer routes are `vision`, `projects`, `services`, `contact` under the current locale. Email is `mailto:hello@thisisgazzar.com`. LinkedIn is `https://www.linkedin.com/in/mohamed-elgazzar-550a98101`, new tab with `noopener noreferrer`. No additional social link was observed. The contact/vision/services/project listing contents are outside this HOME audit.

Hero shell starts with language/menu left, logo centered, sound/talk right. The persistent shell has logo/discipline left and language/sound/talk/menu right. Source nav normalized range is `.25..63` with `.18s` scrub; world-transition logic coordinates its masks. Logo hover/focus assembles its three SVG components; leave/blur reverses; Escape resets the focus effect. Hero marquee moves at 133px/s, loops through two cycles, reverses direction for Arabic, and has a separate pause/resume button. **Live:** pause changed its accessible label and held the transform unchanged across a 250ms sample; resume worked. Pause typography is not quiet audio and is not reduced motion.

Menu: full-viewport dialog, opaque surface plus global material, four numbered large links, active rail, descriptor preview, language, sound, email and COPY, LinkedIn, Egypt/Cairo clock, role and year. **Live:** open/close controls worked; source dialog phase became open/closed. Open menu prevented a programmatic 600px scroll, keeping y=2700. Hovering Projects changed descriptor from vision to project description. Clipboard and physical focus-trap/Escape behavior are **Open** because targeted automation did not provide reliable trusted events.

**Source menu timeline:** surface wipe `.00..36s`, content unclip `.36..48`, opening rule `.36..58` then fades through `.75`, link rise at `.4` for `.36` with `.045` stagger, secondary rise `.54` for `.3` with `.045` stagger, footer `.65..9`. Reduced motion skips the full sequence. Menu clock uses `Africa/Cairo`, English 24-hour digits, minute-aligned updates, and digit roll `.36s`. COPY has copied/error feedback; do not claim success from the unchanged COPY label observed under automation. [Shell/menu public bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/15ud0rwi-a_3n.js).

**Audio:** entry QUIET chooses muted audio and still enters the full pinned motion experience. SOUND requests audio; it is not the motion toggle. Preference key is `portfolio-audio-preference-v2` (`quiet`/`sound`); audio restored to saved quiet at the end of this inspection. Source has `uninitialized`, `starting`, `playing`, `muted`, `awaiting-user-gesture`, and error states. Both shell buttons and menu state synchronize; waveform amplitude/speed changes. Ambient playback, synthesized hover/click/portrait impulses, footer friction sound, and localized section whispers are separate layers. Hidden document and lifecycle handling attenuate/pause/clean up. Do not equate one looping MP3 with parity.

Whisper stems: `perspective`, `look-closer`, `beyond`, `put-to-work`, `clarity`, `set-free`, `space-for-what-comes-next`. Per-stem EN/AR gains are in the HOME bundle around source `A={perspective:...}` and the temp `.lines.txt`; audio synthesis/state is in [audio/identity public bundle](https://www.thisisgazzar.com/_next/static/immutable/chunks/45adsxrqjjj5i.js). **Live limitation:** attempted enable produced `awaiting-user-gesture`, and `navigator.userActivation.hasBeenActive=false`; audible playback, autoplay recovery, mute ramps and whisper timing were not established.

## Systems and footer interaction

The line leaving 8returns becomes a three-path systems drawing. It organizes into clarity, then three separate voices cross within the flexibility/structure composition, then open into the closing/footer divider. These paths are sampled with measured arc lengths; their tips continue smoothly through the handoff. Parent root story work should preserve that continuity and timing, rather than restarting a new line reveal for each statement.

Footer final desktop layout has closing heading top-left, full-width divider, contact column left, continuation nav center, Cairo time right, large edge-to-edge GAZZAR word, LinkedIn and copyright at the bottom. At `t=700`, wordmark/colophon are still entering; `t=714` is the final screenshot checkpoint. Clock is live Cairo time, not browser-local time or hardcoded text. Arabic keeps **GAZZAR in Latin** and reverses the information/social/copyright reading layout.

**Live:** Enter on the footer word control changed `data-mode=logo`; the captured result showed the three flat identity marks, CLARITY, and supporting thought. It is a real interactive state, not a static giant text footer. **Source:** the six letter paths morph into three identity parts, using Canvas2D glyph/path rendering and material refraction. Desktop grab must pass a height-relative threshold `clamp(.24*glyphHeight,24,64)` px and release to commit. Touch short tap (<650ms, movement <=10px) activates; movement >10px or scroll >6px cancels. Enter/Space also activate. Click/tap on the revealed logo or Escape returns. Partial pulls relax. Pointer capture is released on blur/resize/visibility/route changes.

Source footer mode timing (seconds): forward `2.24`, reverse `2.04`, settle `.24`, thought emerge `1.18`, read `2.55`, retract `.68`, handoff `.1`. Reduced timings are shorter. Three concept thoughts cycle; hovering a logo part for `.13s` selects/holds a thought; after Direction it returns to the word. The screenshot happened to show CLARITY because the sequence had advanced; this is not a fixed initial choice. The source also contains idle material motion/waves. Full pointer/idle/touch parity is **Open**. Source is in `45adsxrqjjj5i.js`, `1lbueqoir1wno.js`, and the footer block of `2gz902oulp4x8.js`.

## Mobile, Arabic and quiet-reading differences

**Live + Source:** at `<=900px`, visible shell simplifies to logo left and menu right; direct header language/sound/talk and persistent role are hidden, and these actions remain in the menu. This breakpoint differs from the `700px` story breakpoint. At `<=700px`, hero portrait width is `max(164vw,104svh)`, top `44%`, center shifted right `65px`, with bottom gradient masking. Hero support/name sit above the bottom cue; desktop portrait uses `max(100vw,150svh)`. Tablet portrait has a separate `max-aspect-ratio:6/5` rule. Do not merely scale the desktop composition.

Mobile menu uses vertically stacked large routes, then a two-column settings/contact/social/time layout; the desktop descriptor preview is absent from the observed mobile screenshot. It can scroll on short screens; nested-menu scrolling must not leak to the pinned page. Closing English text rebreaks to “Space for what” / “comes next.” Mobile footer continuation links wrap, clock occupies another column, and wordmark is about viewport width rather than desktop line-height geometry. Sub-400px and sub-360px shell rules, `max-height:600px` rules, and aspect-ratio scene rules exist. Real touch, small landscape, safe areas and dynamic browser bars are **Open**.

Arabic is not a blanket `scaleX(-1)` or flex reversal. Raw HTML is `lang=ar dir=rtl`; shell controls retain LTR positioning. Hero uses original Arabic prose, Cairo, wider/longer support, zero tracking, right alignment and different signature placement. Principles are منظور / وضوح / اتجاه with distinct Arabic support. Projects reverse travel and connector path traversal; Latin project identities stay Latin, while Wujhat becomes وجهات. The airplane shape itself remains recognizable rather than naively mirroring every SVG. Systems positions/caption collision fitting differ. Exact Arabic dictionary and footer/menu data are recoverable in `en.html`/`ar.html`, `0or6--g23od4n.js`, and `data-37832.json`, `data-66903.json` in the temp folder.

**Live via programmatic activation of the existing hidden motion-access control:** at 392×932 the reduced experience changed from 24,390px to **9,788px**, removed the pin spacer, enabled all four project links, stacked philosophy/work/systems content vertically and showed static line illustrations. Control label became Enable motion. This verified layout mode, not physical keyboard reachability. The control is normally a 1px clipped element and expands on `:focus-visible`. OS reduced-motion itself was not toggled in this audit. QUIET entry audio choice leaves the pin intact. These are three separate controls: quiet audio, marquee pause, and reduced/unpinned reading.

## SSR and reference files

Both raw locale HTML responses include identity, headings, all four projects, systems/footer copy, real links, semantic portrait and metadata before optional runtime. The root reference starts with `data-enhancement=fallback`, an initialization fallback/nav, and noscript support. The local contract additionally requires static prerendering/server content with Storio and the custom scroll engine, no GSAP. Match the reference's observable result without importing its runtime libraries or moving copy into a client-only scene. Semantic HTML and visible WebGL typography must stay synchronized without exposing duplicate echo strings to assistive technology.

Useful public HOME sources: [main HOME runtime](https://www.thisisgazzar.com/_next/static/immutable/chunks/2gz902oulp4x8.js), [timeline/type renderers](https://www.thisisgazzar.com/_next/static/immutable/chunks/11dg_viff64mz.js), [base CSS](https://www.thisisgazzar.com/_next/static/immutable/chunks/0ht1z612ephb8.css), [identity CSS](https://www.thisisgazzar.com/_next/static/immutable/chunks/28gn-kou--5st.css). Bundle hashes describe this capture, not permanent API names.
