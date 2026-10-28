# Shared editorial shell and Contact — offline review R3

Fresh independent review of the shared working tree against `ac78d8b7e7aea8efcfe76746baf79145081aab52` on 2026-10-28. **One actionable P2 was established; no P1 was established.** The footer ownership change resolves R2's independently failed editorial-chunk case. The finding below concerns a separate content-resize path.

## P2 — Contact content shrink leaves the footer reveal using its old document position

**Location:** `src/components/layout/footer/footer.logic.ts:141`–142, with the cached geometry assignment at line 61 and its use at line 40. Contact permits the upstream size change through `src/sections/contact/1-conversation/contact.module.css:38` and `contact-form.logic.ts:75`–82.

**Trigger:** On EN or AR Contact with motion enabled, grow the textarea, then change the window width so the footer mask's ResizeObserver measures the expanded document. After layout settles, reduce the textarea height without another width change and scroll to the new document bottom. Native vertical resizing is explicitly enabled. At desktop width 1280, reducing the textarea from 440 to 200 reference pixels is a 160 CSS-pixel document-height reduction; both sizes fall within its 190–440 reference-pixel CSS bounds. Editing a long message down to a short one also reduces the upstream height, with the exact reduction depending on its intrinsic rows/content.

**Cause and impact:** The footer caches `footerTop` only through `measureWord`. Its only ResizeObserver watches the word mask, whose dimensions do not change when the form above it becomes shorter. The native scroll callback, viewport callback and UI-mode callback reuse that cached top. Contact's own observer updates its own timeline, without notifying the footer. The footer therefore moves upward while its reveal still targets the previous position. The new tail correctly compensates for the physical/design viewport difference, but does not compensate for this stale content coordinate. At the new native scroll limit, the word can remain clipped and the colophon remains partially faded, with no remaining scroll available to finish them.

**Executed offline proof:** An in-memory VM fixture executed the actual current `mountFooterInteractions`, `standardFooterPose` and `standardFooterTail`, with mocked DOM/word measurement and a captured actual scroll-manager callback. Fonts were resolved and their measurement microtasks drained before the mutation. Width was 1280, physical height 1024, design height 720, initial footer top 4000, and footer height 633.6 (the CSS minimum supplied to the fixture, not a browser measurement). No editorial controller was mounted.

```text
Initial native maximum:
  actual top=4000, y=3913.6, tail=304px, footer rectangle reads=2
  word translateY=0%, metadata opacity=1, inert=false

After upstream content shrinks 160px; new native maximum:
  actual top=3840, y=3753.6, tail=304px, footer rectangle reads=2
  word translateY=11.749025658%, metadata opacity=0.262099133, inert=false

Control: invoke the existing mask ResizeObserver callback manually:
  footer rectangle reads=3
  word translateY=0%, metadata opacity=1, inert=false
```

This isolates stale measurement: the tail remains correct, and remeasurement alone restores the endpoint. The geometry fixture is synthetic; the browser trigger above is derived from the actual form/CSS and observer ownership, not claimed as a live-browser reproduction. For a physical viewport at least as tall as the design, an upstream shrink of `delta` makes maximum progress `1 - delta / footerHeight` while the old top remains cached.

**Minimal fix:** In the successful standard-footer controller, observe the preceding editorial content/main (or subscribe to its size-change notification) and refresh `footerTop`/`footerHeight` when that content changes. Dispose that observation with the controller. Preserve fixed design sizing and footer-owned tail behavior. Extend the mounted fixture with an upstream height change that leaves mask dimensions unchanged, and assert the full reveal at the new reachable maximum without manually firing the mask observer.

## Resolved findings and verification

- **R2 ownership finding is resolved:** `mountFooterInteractions` itself appends the `aria-hidden` sibling tail before applying its standard reveal. Its own resize and reduced/quiet subscriptions update the extent; teardown removes the tail and listener. `mountEditorial` now owns background/entry only. A failed `editorial.animate` import no longer removes the successful footer controller's required scroll extent. The new standalone mounted test and pure extent fixture pass.
- **R1 fallback correction remains present:** All three standard-footer CSS profiles override the inherited hidden word transform with `transform: none` and supply the fitted brand ink values. A failed footer import leaves that CSS fallback. The retained root production JSON supports the older successful-load tall-footer case; it is not evidence for the content-resize trigger above or the current production build.
- **Executed before the measurement pause:** Explicitly scoped Bun tests for standard-footer extent/pose, footer geometry/controller, all five Contact test files, and contact delivery: **36 passed, 0 failed, 2,802 assertions across 10 files**. This includes Contact's 16 tests. The separate mounted VM reproduction and remeasurement control above also completed before the pause. Existing passing fixtures do not mutate upstream content after caching the footer's top.
- Re-read shared editorial composition/navigation/controllers, header extraction and standard footer changes, Contact SSR content/form/motion/gates/cleanup, local validation/transport/API, brand/calendar configuration and route metadata/sitemap. No additional concrete P1/P2 was established. Unconfigured-mail 503 and the scheduling-email fallback are intentional. Tests use mock delivery adapters; no mail or external request was sent.
- Root separately reports 14 focused tests/1,306 assertions and full check 4 with 291 tests/14,241 assertions passing. Those are root-owned results, not executions by this reviewer. No fresh test run was made after the measurement pause instruction.

## Scope and snapshot

Read `AGENTS.md`, `docs/editorial-pages-architecture.md`, the loading/code-splitting/fixed-viewport guides, R1/R2 and relevant installed Next.js guidance. Vision/Services bodies were not graded; Projects was excluded. No browser/OS calls, full check/build/type generation, server/process management, package, staging, commit or delegation operation was performed. Only this report was written. No app edits were made. Root retains browser ownership and acceptance; this review makes no independent visual/parity/FPS claim.

Reviewed SHA-256 values:

```text
c6cc2acb89c44bdbf9a1cd037c82646987e72d7e631cfa14a3714edfc65c7638  src/components/layout/footer/footer.logic.ts
8a9a49e33268e10a210d8341d6471e025c35a7ff9298d363423b015f3cb7798f  src/components/layout/footer/standard-footer-pose.ts
59ee183ce067fc8f865bfc2d99631f30ed0a102b74e0fd25701ccfbeda5009de  src/components/layout/footer/standard-footer-extent.test.ts
c7c5ce96a73e6bcbe1678e5e9e8fa8ca067724bf2e51aa36e43b4ed3e2ba92f4  src/components/layout/footer/footer.logic.test.ts
20efaf28e4f48d11489b531838b3a3dbf917fd5d5272666f46784a892cb3c343  src/components/layout/editorial/editorial.animate.ts
4ccc6b6f71d5c932117a9d984b7c4f76505f4857fbe7c184d36fe954864a838f  src/components/layout/editorial/editorial.module.css
c03115d7b06b239ee306e8def106b5cf0dd7240900bec310267a4bb9f0518c5c  src/sections/contact/1-conversation/contact-form.logic.ts
e1542fcb5168765e0ff8531b20327c2dfc8975ec207acd94d0f76779a9a93aa4  src/sections/contact/1-conversation/contact.module.css
d8a87581cc3c1b5cd97f197a2f79b1feabeeb5566319c3d89ed17c63a67eb632  src/lib/contact/send-message.ts
```
