# HOME adversarial parity review — round 1

Date: 2026-10-27. Scope: HOME, desktop/mobile English and Arabic, against [thisisgazzar.com](https://www.thisisgazzar.com/en). Status: **reference inventory ready; integrated implementation not reviewed or accepted**. Implementation teams were editing concurrently. This review does not assign permanent failures to unfinished files.

The concrete stage/asset/interaction inventory is in [home-reference-map.md](home-reference-map.md). Raw public HTML/CSS/runtime, extracted original SVG/data, models and 53 screenshot artifacts are under `/tmp/gazzar-home-audit-r1/`. Screenshots need the provenance caveats in the map; captures with stale rendering or failed quiet-mode activation are excluded as oracles.

## Prioritized implementation blockers

### P0 — One measured story must coordinate all owners

Hero/shell, objects, native server copy, project SVG and systems/footer cannot each own an unrelated viewport-progress interpretation. The reference is a single 714-unit story after a 26-unit opening; its input density changes after score 100, and its displayed progress differs from physical pin progress. The desktop 1400×850 document measured 25,786px. The parent's 1912×1036 extent of 31,429px agrees with the recovered formula. The mobile 392×932 extent is 24,390px, with `svh/dvh` compensation. A correct total height alone cannot establish that the sections align.

Require a single agreed score/opening/world contract with reversible updates, plus explicit ownership for pin geometry, render invalidation and cleanup. Hand off glasses → philosophy → piece presentations → Ideas → project origin → systems line → closing/footer without visible discontinuities. Use `.experience` score evidence. Test reverse scroll and large seeks as well as forward motion; stale layers in a hidden source tab are a measurement trap.

### P0 — “Original assets loaded” is insufficient for 3D/background parity

Both GLBs contain **no authored animation clips**. Camera, lighting, materials, scene fonts, pose paths, shadows, foreground typography and interactions are runtime behavior. Original lenses are overridden to transmission .13/roughness .16, not left at their embedded highly transmissive material. The logo retains embedded microroughness but uses runtime graphite material/light changes. The LTC `.bin` is a lighting table. Separate studio WOFF fonts are used in the scene.

The scene includes a global pressure-field background, portrait distortion, demand-rendered object scene, and interactive footer material/path layer. A static black fill, default GLB viewer, generic ambient lighting, flat logo placeholder or generic pointer glow cannot satisfy the stated requirement. Port observed behavior into the project-owned engine/Three code; do not introduce GSAP to copy implementation APIs. Full original pose/light/shader sources and hashes are identified in the map.

### P0 — Missing behavior must be assigned, especially footer identity

The large footer GAZZAR is an interactive Canvas2D/path identity transformation with drag threshold, short-touch activation, Enter/Space activation, concept selection, thought cycling, reverse transition, Escape/reset and cleanup. Live Enter produced the logo/CLARITY state. This interaction could easily fall between the parent systems story and the Three/shell assignments. Give it an explicit owner; it is not merely footer typography or part of the GLB.

Likewise, server content must cover every optical caption, principle/meaning, four project identities/descriptors/actions, systems statements, closing and complete footer in both locales. Preserve real routes and the original SVG paths; HOME project visuals are line drawings, not raster project cards. Extracted mark paths/project dictionaries are ready in the temp folder.

### P1 — Project focus, drawing and hover have separate gates

At Wujhat's nominal center `t=308`, the mark was only .8497 drawn, so emphasis was absent. At `t≈312.07`, after drawing completed, pointer-enter set both work-hover and symbol emphasis. Source also gates by focused project, fine pointer and desktop width. The symbol line-light runs in 1.9s; inactive links are inert/unfocusable. A hover on every panel or a clickable full-screen horizontal track diverges from the reference. Connector/mark arc lengths determine the handoff timing and vary with viewport; four generic stroke-dash reveals do not preserve the continuing pen.

### P1 — Restore semantic position across locale and history

AR→EN at Wujhat preserved score 308/y13672 and entered restore mode. Clicking Wujhat then browser Back returned there. Source stores work/locale/history positions and supports return/query intents; it avoids replaying the loader on those returns. Implement the useful behavior without coupling server rendering to browser storage. Preserve native modified-click/new-tab behavior, direct project URLs, and same-locale links. Locale switches at a different viewport should restore semantic stage progress, not blindly reuse a pixel number.

### P1 — Three different quiet/pause controls; full sound design

QUIET in the loader mutes sound but preserves the pinned animation. Marquee pause freezes only background typography. Reduced-motion/quiet reading removes pinning and presents all content vertically. Do not map all three to one Boolean user-facing behavior merely because Storio has a quiet flag.

Sound includes ambient, generated UI/portrait impulses, footer friction and seven localized section-whisper stems, with gain differences and autoplay/error/awaiting-gesture handling. This round could establish state labels and source intent, **not audible success**: tab-scoped automation produced awaiting-user-gesture and no trusted user activation. Clipboard and complete keyboard behavior also remain open. Do not treat those automation limitations as implementation defects, or mark them passed.

### P1 — Responsive/Arabic geometry must be independently built

Header simplification is at 900px; story layout is at 700px; additional 400/360px, short-height and aspect-ratio rules exist. On narrow screens direct shell language/sound/talk disappear into the menu, project symbols move beneath titles, footer links wrap, and the closing headline changes line breaks. Mobile is not merely a small desktop.

Arabic keeps shell controls in their physical arrangement, changes typography/prose/masks, reverses work travel and connector traversal, preserves Latin project names except Wujhat, and has different systems positioning. Footer wordmark remains Latin GAZZAR while footer information reverses. Direct SSR Arabic must have correct lang/dir before hydration. Automatic translation or global visual mirroring fails this target.

### P2 — Menu, logo, clocks and route transitions require finishing tests

Menu has a staged wipe/rule/link/secondary sequence, hover/focus descriptor changes, scroll lock, internal short-screen scroll, copy feedback, locale/sound state and Cairo minute-aligned rolling clock. Header logo assembles on hover/focus and resets. Route cover/reveal and history restoration are observable parts of HOME entry/exit. This initial inventory is sufficient to implement the known states; it is not a keyboard/clipboard/autoplay accessibility certification.

At approximately 23:46 UTC the reviewer's local tab returned a Next development error resolving `./header.logic` from `header-animate-gate.tsx`. This was during active shell file creation. It prevented local visual comparison of that snapshot and is **not** a claim the integrated implementation remains broken. No build/check was run, per the read-only audit brief.

## Strict acceptance checklist for the fresh review

Do not close a checkbox from source inspection alone where a live result is required. Save evidence of failures and fixes at matching viewport/DPR/stage, including one frame before and after each handoff.

- [ ] Production `/en` and `/ar` respond successfully with complete headings, original copy, projects, links, portrait and footer in raw HTML after excluding script/Flight payloads; lang/dir, canonical/alternates and structured data are correct.
- [ ] JS-disabled, blocked-controller, delayed-model and WebGL-failure cases retain readable content and usable navigation. Loader cannot permanently trap them.
- [ ] Required project validation passes: `bun run check`, `bun run build`, `bun run test:ssr -- <running-production-url>`. Reviewer does not substitute dev screenshots for production loading checks.
- [ ] No GSAP; Storio patch remains reproducible; root content remains server-rendered; gates return no visible copy; heavy runtime/controller boundaries match load/code-split docs.
- [ ] At matched desktop and mobile viewports, extent, opening/score mapping, displayed counter, chapter labels, progress line and pin end match the map. Test minimum stage heights and viewport resize.
- [ ] Entry loading, ready choice, quiet/sound selection, logo assembly, portrait reveal/distortion, signature, marquee, pause/resume and shell mask handoff match after cold and warm entry. Restore navigation skips fresh-entry replay correctly.
- [ ] Lens emergence, hover/grab window, four blur/focus caption bands, camera approach, shadow, dark lens crossing and philosophy reveal match representative frames and reverse scroll.
- [ ] Three named components, textured graphite materials, pose/light/reflection transitions, foreground principle typography and respective grab windows match at scores about 130/175/220; no wrong-camera or default-material flash.
- [ ] Ideas typography resolves into the actual pen origin; all four original SVG project symbols/connectors draw continuously and travel at reference moments. Correct copy/line breaks and explore destinations in each locale.
- [ ] Hover/focus emphasis starts only after the active symbol completes; mobile excludes fine-pointer line-light behavior; inactive panels do not intercept pointer or keyboard focus.
- [ ] 8returns→systems path is continuous; all three systems curves, moving tips, organization/coordination stages, masks, captions and closing/footer takeover match around scores 413/480/580/650/700/714.
- [ ] Footer invitation/navigation/Cairo clock/wordmark/colophon match final geometry, original destinations and labels. At 714 the full word is visible without unintended clipping or collision.
- [ ] Footer word→identity and reverse interactions pass mouse pull below/above threshold, short touch, cancelled scroll/drag, Enter/Space/Escape, concept hover/cycling, idle and reduced-motion variants. Visible and announced thought agree.
- [ ] Menu opens/closes from hero, middle story and footer without jumping scroll; pointer/keyboard focus remains in dialog; Escape restores invoking control; descriptor hover/focus and mobile short-screen scroll work.
- [ ] COPY writes the exact email with success/error feedback under real user activation; mailto and LinkedIn destinations work; modified-click browser semantics remain intact.
- [ ] Audio is silent until opted in, synchronized across all controls, actually audible after trusted activation, muted cleanly, recoverable after autoplay denial/error, paused/attenuated when hidden, and localized whispers match stage/direction intent without repeating uncontrollably on tiny scroll changes.
- [ ] QUIET audio, marquee pause and reduced/unpinned reading are independently correct. OS reduced motion is respected before and after hydration; re-enable at current position does not conceal content or leak old controllers.
- [ ] Locale switch and browser Back/Forward restore hero, lens, each principle, each project, systems and footer semantically; test viewport change, reload and direct `?work=` return. No English flash or fresh loader on restored Arabic stage.
- [ ] Cleanup passes repeated navigation/mode changes: no duplicate RAFs/listeners/observers/renderers, stale pin spacers, persistent pointer capture, locked scroll, disposed shared textures or growing owned GPU resources. Hidden/offscreen demand rendering settles.

## Test matrix and evidence gaps

| Case | Initial reference evidence | Fresh integrated review requirement |
| --- | --- | --- |
| EN desktop 1400×850 DPR1 | Full stage samples, menu, footer identity, pause, project hover gate, history return | Match pixels/motion with activated source and local tabs |
| AR desktop 1400×850 DPR1 | Hero, lens, first principle, Wujhat, systems, footer; locale switch | All stages plus Arabic menu, focus and every project |
| EN/AR narrow browser 392×932 DPR1 | Hero, first principle, Wujhat, systems, final footer; EN menu; reduced layout | Real coarse pointer/touch and all four work panels |
| Desktop 1912×1036 | Parent reports extent 31,429; formula agrees | Independent full screenshots/DPR record |
| 900/901, 700/701, 400/401, 360px | CSS breakpoints recovered | Live boundary checks, English and Arabic |
| Tablet portrait / landscape / short height | CSS aspect/height alternatives recovered | Live at representative sizes and browser-bar resize |
| DPR2/retina | Runtime DPR caps recovered | Independent object/shader/text sharpness and performance |
| OS reduced, no JS, chunk/model failure | Source/fallback HTML; programmatic reduced mode live | Real preference/disabled JS/failure injections in own tabs |
| Sound / clipboard / keyboard | Source intent and some state changes; trusted-input gap | Physical trusted activation; do not accept synthetic success |
| Cold/warm/reverse/fast seek | Some jumps and restoration measured; stale-source caveat | Film forward/reverse scrub and fast input, verify settled paint |

A fresh adversarial round should start after integration and validation, using a new observation pass. Round 1 is not the review of the eventual integrated diff, and these unchecked criteria must not be silently treated as satisfied.
