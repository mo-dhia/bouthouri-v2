# Shared editorial shell and Contact — offline review R2

Reviewed the shared working tree against `ac78d8b7e7aea8efcfe76746baf79145081aab52` on 2026-10-28, including untracked editorial shell, Contact, API and metadata files. **One actionable P2 remains; no P1 was established.** The R1 successful-load scroll-range defect and default-CSS wordmark defect are corrected, but the scroll-range correction still depends on an independently failing enhancement chunk.

## P2 — Failed editorial shell chunk still leaves the independently enhanced footer unreachable

**Location:** `src/components/layout/editorial/editorial-animate-gate.tsx:6`, `src/components/layout/editorial/editorial.animate.ts:12`, and `src/components/layout/footer/footer.logic.ts:40`–47.

**Trigger:** On an EN or AR editorial page, use motion with `innerHeight > designHeight(innerWidth)`, fail/block the `editorial.animate` import, and allow the independent `footer.logic` import to succeed. Scroll to the native document bottom. A cold/retried load with one missing enhancement chunk is sufficient; no form interaction is required.

**Evidence:** The only editorial scroll tail is created inside `mountEditorial`. Its gate silently catches a failed import. `FooterAnimateGate` independently mounts `mountFooterInteractions`, which unconditionally applies the fixed-design reveal pose and hides/inerts the colophon. It does not require shell readiness or provide the missing extent itself. With no shell controller, document maximum scroll is again `footerTop + footerHeight - innerHeight`, so maximum reveal progress is `1 - (innerHeight - designHeight) / footerHeight`.

A bounded offline VM harness executed the actual current `mountFooterInteractions` with the actual `standardFooterPose`, mocked DOM/geometry, width 1280, physical height 1024, design height 720, footer top 4000 and footer height 633.6 (the stylesheet's `49.5vw` minimum, supplied to the harness rather than measured in a browser). At native maximum scroll:

```text
shell/tail absent: tail=0,   y=3609.6, word translateY=73.666657%, metadata opacity=0, inert=true
shell/tail ready:  tail=304, y=3913.6, word translateY=0%,         metadata opacity=1, inert=false
```

The missing endpoint follows for any finite footer height when physical height exceeds design height. The base CSS fix cannot recover this partial-failure path because the successfully mounted footer controller supplies hidden inline styles. This is a residual failed-enhancement case of R1's scroll-range finding, not a contradiction of the root's successful-load production proof.

**Minimal fix:** Give the standard footer's successful controller ownership of the scroll extent required by its own reveal, including resize/mode updates and cleanup, instead of depending on another optional import. Alternatively, leave its visible CSS fallback in effect until that extent is guaranteed, and retain that fallback if the shell never becomes ready. Add a scoped integration/fault-injection case where the shell import fails but the footer import succeeds; assert reachable metadata and wordmark at native maximum scroll, then verify teardown. Preserve the fixed design geometry.

## R1 fixes and scoped verification

- **Successful-load tail:** `editorialScrollTail` computes only `max(0, physicalHeight - designHeight(width))`, or zero in reduced mode. The shell appends an owned `aria-hidden` tail after the footer, converts measured pixels once to `vw`, updates on resize/reduced/quiet changes, and removes it on teardown. An in-memory mounted-shell harness returned `23.75vw` at 1280×1024, zero at 1280×600, zero in reduced/quiet mode, and `23.75vw` again after resuming motion. Teardown removed the tail, subscription, observer, pending entry frame and mocked material. The pure reachable-maximum fixture passes across its reference/width/short/tall cases. It assumes the tail-producing controller exists and therefore does not cover the finding above.
- **Default-CSS wordmark:** All three profiles now override the inherited hidden word transform with `.standard-footer .footer-word-text { transform: none }`, supply fitted numeric type/ink values, and retain the approved taller/heavier wordmark treatment. Footer cleanup restores the pre-mount styles. A write-intercepted, in-memory execution of `.artifacts/pages-parity-20261028/root/generate-shell-css.ts` reproduced the current `editorial.module.css` byte-for-byte; no generated file was written. The additional language-glyph sizing stays scoped to the editorial controls and uses the fixed profile conversion.
- **Root browser evidence, separately attributed:** Root reports production build `pSjbVfpdEO3zIbv5HqFVq`. Read `.artifacts/pages-parity-20261028/root/tall-footer-production.json`: 1280×1024, scrollY 1867.2333, tail 304, invitation/word identity transforms, colophon opacity 0.999992 and `inert=false`. Root also reports a script-blocked production-HTML CSP-proxy test with zero canvases/Contact enhancement attributes and a fully visible BOUTHOURI wordmark, retained at `root/no-script-en-desktop-footer.png`; that proxy was stopped. These support successful-load and no-JS behavior. They do not test an independently failed shell chunk with a successful footer chunk. Root reports the newest scoped navigation glyph sizing is not in that production build yet and will rebuild before acceptance.
- **Executed scoped tests:** `bun test` with explicit targets for editorial geometry, standard-footer pose, footer geometry/controller, header controller, Contact, contact delivery and the fixed-viewport CSS media normalization fixture: **43 passed, 0 failed, 3020 assertions across 12 files**. Contact's frozen 16 tests remain passing. Transport tests use local mock adapters; no external request or mail was sent.
- **Other reviewed paths:** Re-read the Contact server composition/copy, form validation and states, motion/gates/cleanup, branded delivery/parser/API, calendar validation, metadata/sitemap, standard footer and header extraction, deferred environment adaptation, SSR audit additions and fixed-viewport media normalization. No additional concrete P1/P2 was established. HOME's Header does not import the editorial stylesheet; the editorial server composition supplies its navigation as a React node. Honest unconfigured-mail failure and the scheduling-email fallback are intentional behavior.

## Limits and snapshot

Read `AGENTS.md`, the editorial architecture brief, loading/code-splitting/fixed-viewport docs, relevant installed Next.js guidance, R1, retained source HTML/runtime, and Contact extraction/verification artifacts. Vision/Services section implementations were not graded; Projects was excluded. This review used offline source inspection, retained evidence and small scoped tests/VM/CSS fixtures. It made no browser/OS calls, full check/build/type generation, server/process management, package, staging, commit or delegation operation. Only this report was written. Patched production checks and browser acceptance remain root-owned. No independent pixel-parity, continuous-motion-parity or FPS claim is made; the synthetic geometry harness is not a browser layout measurement.

Relevant SHA-256 values for this shared snapshot:

```text
5cfe29ed503684f94307419b9c770a04f3e9c374d9c0ab0a3aed4724bf8046e0  src/components/layout/editorial/editorial.animate.ts
9e4168164406a4203bc38c5792b48c96aee8229dfc714e35b6feb625b82440ac  src/components/layout/editorial/editorial-animate-gate.tsx
7ff982e27884833dbf060072b236ba85ce33af0a117ec2401776cd72e6f23f51  src/components/layout/editorial/editorial-geometry.ts
a45af3bba1b007bf15c23e07cd75a13db3e168f4d928ade96fbacd0ddf9d82bd  src/components/layout/editorial/editorial-geometry.test.ts
4ccc6b6f71d5c932117a9d984b7c4f76505f4857fbe7c184d36fe954864a838f  src/components/layout/editorial/editorial.module.css
010b6caebf584e5dcf6cb10146d1bc1ee3692759327ed6b458c5d2c3d880d8d2  src/components/layout/footer/footer.logic.ts
f4c539a56758780f2789193019c3162108fae403e09bcfef332d3f8bd8fc5813  src/components/layout/footer/standard-footer-pose.ts
5294981daa7db62bdd07172edea4e6eba900578834d5f85ad0d2cb2c675294b7  .artifacts/pages-parity-20261028/root/generate-shell-css.ts
d8a87581cc3c1b5cd97f197a2f79b1feabeeb5566319c3d89ed17c63a67eb632  src/lib/contact/send-message.ts
c03115d7b06b239ee306e8def106b5cf0dd7240900bec310267a4bb9f0518c5c  src/sections/contact/1-conversation/contact-form.logic.ts
```
