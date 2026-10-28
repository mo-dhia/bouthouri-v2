# Shared editorial shell and Contact — offline review R1

Reviewed the working tree against `ac78d8b` on 2026-10-28, including new/untracked shell, Contact, API and metadata files. Re-read the final navigation extraction and server validation update supplied during review. There are **two actionable P2 findings and no P1 finding** in this review.

## P2 — Standard footer cannot finish revealing in a taller physical viewport

**Location:** `src/components/layout/footer/footer.logic.ts:40` and `src/components/layout/footer/standard-footer-pose.ts:4`; the document ends immediately after the footer in `src/components/layout/editorial/editorial.tsx:18`.

**Trigger:** Open an editorial page with motion enabled and physical viewport height greater than `designHeight(innerWidth)`, then scroll to the document bottom. This includes ordinary narrow desktop windows, not only unusually tall screens.

**Evidence:** The controller passes the fixed design height into the source pose. Its progress is `(scrollY - footerTop + designHeight) / footerHeight`, while native maximum scroll remains `footerTop + footerHeight - innerHeight`. Consequently, its maximum progress is `1 - (innerHeight - designHeight) / footerHeight`: less than one whenever the physical viewport is taller. The colophon never completes its reveal; when the excess height is at least 38% of footer height, metadata remains at opacity zero and `inert=true` (`footer.logic.ts:47`). The wordmark can also stay substantially clipped. There is no physical scroll tail after this footer.

A bounded offline call to the actual pure pose function with width 1280, physical height 1024, design height 720 and footer height 633.6 (the CSS `49.5vw` minimum) returned, at native maximum scroll:

```json
{"progress":0.52020202020202,"invitation":1,"wordmark":0.342261988329965,"metadata":0}
```

This is a numerical/controller reproduction; the actual production footer rectangle was not measured by this reviewer. The unreachable endpoint follows for any finite footer height when physical height exceeds design height. Existing pose tests sample arbitrary progress values and do not constrain them by the document's reachable scroll range.

**Smallest fix:** Reserve the missing native scroll extent `max(0, innerHeight - designHeight(innerWidth))` after the measured footer while this motion layout is active, following the existing journey-tail principle. Keep the footer composition and timeline in fixed design coordinates. Update/clean up that physical extent on resize and teardown. Verify the pose at reachable maximum scroll for both taller and shorter viewports, in both locales.

## P2 — Wordmark is permanently clipped when its enhancement chunk is unavailable

**Location:** `src/components/layout/editorial/editorial.module.css:14` (repeated at lines 66 and 122), together with the clipping mask at line 13.

**Trigger:** Load any editorial page with JavaScript disabled, or block/fail the deferred `footer.logic` import, and scroll to the standard footer. The same failure affects reduced-motion readers if that import fails.

**Evidence:** Each of the three base CSS profiles initializes `.footer-word-text` with `transform: translateY(112%)`, inside `.footer-word-mask { overflow: clip }`. A PostCSS scan found that as the sole wordmark transform declaration in every profile: there is no fallback/reduced-motion override in this stylesheet. `useFooterController` silently catches failed imports. The server renders BOUTHOURI, but no controller exists in this path to move it into the mask. This violates the documented readable HTML/failed-enhancement contract and leaves the approved footer identity visually absent. Raw-HTML SSR checks still pass because they test text presence rather than its clipped state.

**Smallest fix:** Make the base standard-footer wordmark visible (`transform: none`) and let the successfully mounted controller apply its initial reveal pose. The current controller already writes the reveal transform and restores the original inline style on teardown; CSS need not hide this SSR text in advance. Apply the correction to all three profiles and verify no-JS plus blocked-controller fallbacks.

## Review limits and resolved concerns

- Read `AGENTS.md`, `docs/load-architecture.md`, `docs/code-splitter.md`, `docs/viewport-design.md` and `docs/animations.md`. Inspected shared editorial navigation/background ownership, header/footer changes, Contact content/form/motion/lifecycle, mail parsing/delivery/route wiring, metadata, sitemap and the SSR audit. Used retained reference HTML/runtime and Contact extraction/verification artifacts for source behavior.
- The initial client/API minimum-length mismatch was fixed during review. Reproduction against the updated parser accepts a one-character name and a two-character note, consistent with client presence validation. It is not an outstanding finding. The HTTPS/no-credentials calendar validation and the navigation extraction removing editorial CSS from Header were re-read. The deliberate unconfigured-mail 503 and scheduling-email fallback are not findings.
- No other actionable P1/P2 was established in Contact or the shared header/API/metadata paths inspected. Vision/Services section implementations were not graded. Projects was excluded. The approved taller/heavier BOUTHOURI outlines were not treated as a defect.
- Executed only bounded offline pure-function/CSS reproductions; no browser/OS calls, external requests/mail, broad checks, build, type generation, server/process management, staging, commits or delegation. Only this report was written. Root owns production and browser acceptance. This report makes no pixel-parity, continuous-motion-parity or FPS claim.

Relevant reviewed file SHA-256 values, to distinguish this shared working snapshot:

```text
32bc85edec7c3afee27c9cbafedd33c81e12b08e5028fa7a7dd238952962194d  src/components/layout/editorial/editorial.module.css
010b6caebf584e5dcf6cb10146d1bc1ee3692759327ed6b458c5d2c3d880d8d2  src/components/layout/footer/footer.logic.ts
f4c539a56758780f2789193019c3162108fae403e09bcfef332d3f8bd8fc5813  src/components/layout/footer/standard-footer-pose.ts
f50f2b2c09194421278328b7c339d223c5e47c5034d6cc32c99b05c548b5c8ff  src/components/layout/editorial/editorial-navigation.tsx
d8a87581cc3c1b5cd97f197a2f79b1feabeeb5566319c3d89ed17c63a67eb632  src/lib/contact/send-message.ts
```
