# HOME continuous review — R11

2026-10-27. Reviewed the production candidate **d4ea3d1**. **Not accepted:**
two concrete quiet-reading footer differences remain. The ordinary continuous
journey now looks substantially closer: this review did not reproduce the broad
departure/scrolling divergence seen in the R10 before recording. Engineering
checks are context, not the basis for this disposition.

## Findings

### R11-01 [P2] — entering reading mode exposes a stale Cairo clock

Reproduction in the existing EN production page:

1. Complete the entry and visit the footer, then return to work.
2. At native **y24100**, displayed story **345.63**, activate the existing
   `motion-access` reading control.
3. Both pages enter reading mode and clamp to **y14102.5**, document height
   **15495**. The footer is plainly visible.
4. Local keeps the clock from its earlier pinned-footer visit. Source refreshes
   the visible clock to the current Cairo minute.

The repeated observation is independent of recording synchronization:

| Page | Actual UTC observation | Actual Cairo minute | Visible footer |
| --- | --- | --- | --- |
| Local | 2026-10-27T14:21:26.481Z | 17:21 | **17:16**, `datetime=2026-10-27T14:16:20.588Z` |
| Source | 2026-10-27T14:21:32.470Z | 17:21 | **17:21**, `datetime=2026-10-27T14:21:31.841Z` |

Earlier local observation at 14:20:18.423Z already showed 17:16 against actual
Cairo 17:20. A same-size synthetic resize did not refresh it.

Evidence in `/tmp/gazzar-continuous-r11/`:
`local-reading-clock-repeat.json`, `source-reading-clock-repeat.json`,
`local-reading-from-work.png`, `source-reading-from-work.png`, and the
`*-reading-footer-enter.png` captures, which also show the clock.

Candidate owner: `src/components/layout/footer/footer.logic.ts`, especially the
shared `visible` flag in the IntersectionObserver and journey callbacks and the
clock guard. The parent independently confirmed that journey time can set it
false while the intersection remains true across the reading layout change.
Clock visibility and HOME word-interaction eligibility need separate treatment.

### R11-02 [P2] — the HOME reading footer accepts an interaction the source disables

From that same work → reading transition, focus the existing `.footer-word-mask`
with `preventScroll:true` and send Vawzen's **synthetic Enter**:

- **Local:** after three seconds, `data-mode=logo`, `aria-pressed=true`; the
  GAZZAR word has become the three identity parts with PERSPECTIVE/support copy.
- **Source:** after three seconds, `data-mode=word`, `aria-pressed=false`; the
  GAZZAR word remains visible.

This is not inferred from a failed key tool alone. With reading disabled and
both pages at **y40837 / story714**, the **same focus + synthetic Enter** activates
the logo on **both** pages. Escape subsequently returns both to the word.
The reading-mode difference is visible in
`local-reading-footer-enter.png` versus `source-reading-footer-enter.png`;
`*-motion-footer-enter.png` provides the positive control.

Candidate owners: `footer.logic.ts` mode/activity selection and
`footer-material.ts`'s `canInteract()`/key handler. The candidate's interaction
guard checks DOM inert/hidden/menu state but does not require its material to be
enabled. The cached source HOME cleanup sets the shared footer reveal to zero
when it removes pinned motion; its input guard requires a positive reveal.
The parent independently confirmed that HOME reading leaves that reveal zero.
Do not fix R11-01 by simply enabling the HOME reading word interaction.

Both findings were sent to the parent before browser release. The parent's
subsequent working-tree fixes/regressions were **not served or accepted by this
review**. They require implementation validation and a fresh review round.

## Continuous experience observed

I inspected source/local frame sequences across the **entire forward journey and
full reverse to the hero**, including the pauses, for all four locale/viewport
pairs below. Frames were extracted at 4fps; contact sequences generally show
0.5-second spacing, with larger individual frames inspected where useful.
These are sequential observations, not only settled chapter checkpoints.

| Pair | Evidence | Observed result apart from findings above |
| --- | --- | --- |
| EN, 2544×1392 DPR1 | Parent's `/tmp/gazzar-continuous-r10/{source,local}-full-en.mp4` and telemetry; derived `en-*-sequence-*.jpg` here | Portrait departure, opening masks/glasses, lens crossing/veil, BUILT ON LOGIC, sculptures/type, Ideas/connector, all four projects, systems/waves, footer and full reverse follow the same visible sequence. R10-V1's local-only departure patch was not established in this corrected pair. |
| AR, 2544×1392 DPR1 | `{source,local}-ar-wide.mp4`, telemetry, `ar-wide-aligned-sequence-*.jpg` | Arabic shaping/layout, original sculpture sequence, right-to-left work travel and connectors, systems/closing text, Latin GAZZAR footer and complete return track closely. No new repeatable material/lighting defect was established. |
| AR, 538×825 DPR1 | `{source,local}-ar-narrow.mp4`, telemetry, `ar-narrow-portrait-sequence-*.jpg` | Same narrow portrait/copy, multiline opening, lens passage, sculpture/type transitions, RTL project sequence, stacked footer and reverse restoration. The settled narrow Arabic menu also matches in route labels, type sizes and settings/contact placement. |
| EN, 538×825 DPR1 | `{source,local}-en-narrow.mp4`, telemetry, `en-narrow-portrait-sequence-*.jpg` | Quiet entry choice → logo/portrait assembly, mobile opening/text wrapping, optics, concepts, projects/neighbor overlap, screens/waves, “Space for what / comes next.”, footer and complete reverse use the corresponding source composition. No additional repeatable visual defect was established. |

The corrected experience observations above do not erase the two concrete
reading-mode failures. They also do not assert equality of every possible
input/history or every presented frame.

## Input and interaction observations

- Full replays each dispatch **580 untrusted WheelEvents**, apply simulated
  default `scrollBy` only if unblocked, reach the footer and return to
  **y0/story0/opening0/world0**. All recorded events were unprevented. This
  exercises installed wheel listeners and the hero magnet; it is not physical
  hardware wheel/trackpad evidence. Separate Vawzen `scroll_at` actions use
  programmatic scrolling and bypass the wheel path.
- Rapid alternating wheel pulses at 45–160ms intervals were exercised around
  **y20600/story268.59** and at the hero, before the 480ms scrub could settle.
  Both return to their starting native/displayed position without a new jump
  established. See `*-ideas-reversals.json`, `*-hero-reversals.json` and
  `capture-reversals.function.js`. An isolated +120 pulse leaves both at
  **y120/world.0413**, magnet idle after 1.5s.
- Project checks before/after the Wujhat mark gate and after reversing show
  matching current-link focus eligibility and other links inert. At
  **y22400/story308.21**, draw **.8629**, the mark hit path is disabled; at
  **y22670/story314.15**, draw **1**, it accepts stroke hits. Vawzen hover is
  synthetic and leaves CSS `:hover` false; I do not claim physical CSS-hover
  coverage from it.
- Actual menu controls open/close and hold native y while open in both pages.
  Initial separate MCP clicks were too slow to establish interruption. A
  scheduled `.click()` on an existing menu control at **85ms local / 89ms
  source** after a wheel pulse then exercised the real handler during scrub.
  Both settle to **y22910/story319.43**, remain there on close and resume without
  a new discrepancy established. See `*-menu-interruption.json`. This is
  programmatic control activation, not a pointer-hit test.
- Both fixed environment/object **canvas elements retain identity** through
  work → reading → motion and a same-size synthetic resize. This observation
  does not by itself certify internal GPU target identity or field pixels.
  The parent's unserved late-travel/background follow-up is outside this run.
- At the motion footer, synthetic hover at **85,960** makes both glyph hit
  handlers report grabbable, while CSS `:hover` stays false. Untrusted touch
  PointerEvents with a 30px move cancel; a 6px pull and short release activate
  the logo in both. See `*-footer-synthetic-touch.json`. This verifies those
  handler paths, not native touch or a captured desktop mouse pull.
- The existing end cue says BACK TO THE START in both at story714. Activating
  it returns both to the **opening**, approximately y3474/story0/world1, rather
  than the portrait. The clone matches that source behavior.

An absent source MENU label in one reading capture was not reproduced as an
independent matched-state defect and is **not a finding**. A single local
Escape sample still read `to-word` after 2.5s; both subsequently returned to
`word`. No precise reverse-duration defect was established from that sample.
Physical keyboard defaults, native touch and OS reduced-motion are not claimed
from these synthetic controls.

## Recording provenance and exclusions

All browser work used **Vawzen only**, existing source tab **37** and local tab
**36**, existing window **0x5400a09**. No new tabs/windows/iframes/profiles,
implementation edits, builds, servers, package operations, tests or commits
were performed by this reviewer. This report is the sole repository edit.

The source EN wide replay came from the parent. New recordings, derived images,
protocols, telemetry and release audits are in `/tmp/gazzar-continuous-r11/`.
Wide clips are encoded at 1600×876/30fps; narrow clips at 538×826/30fps from an
actual 538×825 CSS viewport. The narrow crop **55,45** was checked against a
Vawzen viewport screenshot before grading. Firefox's normal window minimum
settled at 538px, not the requested 392px; no width style or wrapper was used.

AR wide and EN wide replay lifetime is about **91.12s**. Narrow AR uses the same
schedule with first wheel at 1.8s, lasting **87.42s**; narrow EN starts wheel at
5.5s to include entry assembly. Narrow wheel deltas are scaled by
`innerHeight/1392 * 5.8/6.8`, identically on both pages.

For old recordings, metadata `started - record.started` supplies only an
approximate origin: ffmpeg startup delay was unlogged. Never derive the origin
from video duration minus replay duration, because post-roll differs greatly.
The improved narrow recorder logs ffmpeg's input timestamp as
`firstFrameWallTime`; alignment trims before 4fps extraction. Preliminary
`en-sequence-*` contacts quantized the origin onto a quarter-second grid and
can exaggerate transient phase differences; prefer `en-aligned-sequence-*`.
Brief heading, reverse-footer and optics discrepancies in rough wide pairs
were not promoted into timing bugs through that uncertainty.

`source-full-ar-wide.mp4` is an abandoned route-boot recording; use
**source-ar-wide.mp4** instead. The authoritative source AR-wide recording has
a transient blue browser/sidebar-like strip at its left around replay32–35s
and again on reverse. Those contaminated pixels are not clone findings.
Initial EN extraction overlapped the local AR-wide capture; that run is not
used for isolated cadence/FPS claims. Subsequent narrow recordings ran without
concurrent extraction. New EN narrow clips begin at the ready quiet choice;
fresh-document loading was observed but raw network-loader duration was not
recorded or graded. Entry-choice age and marquee phase are not fully synchronized.

## Explicit browser release

Released to the parent at **2026-10-27T14:26:03Z**. No browser calls followed.
Exact audits: `local-release.json` at **14:26:00.892Z**, `source-release.json` at
**14:26:02.646Z**.

Both original tabs are plain `/en`, x0/y0, entry complete, motion enabled,
menus closed, audio muted/quiet, story/opening/world zero, **2544×1392 CSS DPR1**.
Source tab37 is active. The parent explicitly accepted restored outer dimensions
**2654×1502 at -47,-5**, content offset **55,45**, giving the original actual
screen content origin **8,40**. All recorders are stopped; temporary replay and
canvas-reference globals were deleted; there are no iframes or added document
width styles. Final inventory contains only tabs37 and36.
