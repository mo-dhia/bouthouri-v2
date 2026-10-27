# HOME continuous review — R10

2026-10-27. **Continuous parity is not accepted.** The user reports a substantial
difference during actual scrolling; R1–R9's settled samples do not resolve that
report. This review examines offline recordings and identifies visible follow-up
targets. Completion of an engineering checklist is not the user's acceptance of
the HOME experience.

## Scope and evidence

I used no browser tools or surfaces, implementation edits, checks, tests, builds,
server/process management, commits or delegated work. The only repository file
written by this review is this report. Implementation continued concurrently;
the before recording does not review the subsequently edited working tree.

Original evidence is under `/tmp/gazzar-continuous-r10/`:

- `source-scroll.mp4`, `local-before-scroll.mp4`;
- `source-telemetry.json`, `local-before-telemetry.json`;
- `source-inputs.json`, `local-before-inputs.json`;
- `aligned-contact.jpg`, `pair-score-*.jpg` and their extraction script.

The recordings cover **EN, 2544×1392 CSS, DPR1**, encoded at **1600×876 / 30fps**
from the existing window. I inspected the supplied contacts/pairs, extracted
4fps sequences across both entire recordings, made position-oriented surveys
for hero/opening/optical/concepts/work/systems/reverse, and inspected additional
hero-departure neighbors and original encoded-size frames. Derived review images
are `review-*.jpg`; extracted survey frames are under `review-frames/` in that
same temporary directory. These are offline derivatives, not new browser
captures or lossless CSS-pixel evidence.

Both input arrays contain 450 entries with identical requested deltas. Their
delivery times differ: the largest local delay relative to recording start is
**7,902ms at input 174**. At source telemetry 60s, source is at y21000/score277.4;
local at its own 60s is y20400/score262.2513. This is not evidence of a seven-second
animation delay. Native position, direction, score and nearby visual sequences
take precedence over matching video timestamps.

The original inputs are Vawzen `scroll_at` calls implemented with
`window.scrollBy`. They bypass the Lenis wheel path. The approximate video
offsets used by `align_pairs.py` are source **.509333s**, local **.572s**, inferred
from duration versus telemetry lifetime. Up to roughly half a second of alignment
uncertainty remains. I do not grade individual pixels, precise clipping phases,
camera velocity or transition duration from those approximate pairs.

**Extraction error:** `pair-score-714.jpg` is not a 714 comparison. The script
restricts telemetry to `ms < 98000`, so it selects source **676.21/y39120** and
local **668.2862/y38760**. Its different headline/footer poses are not an
actionable footer defect. The actual recordings subsequently reach 714 in both;
the later footer and reverse frames were inspected separately.

## Findings and disposition

### R10-V1 — visible local hero-departure patch needs a controlled replay

In `local-before-scroll.mp4`, approximately **video 6.75–9s**, a soft light patch
appears around the departing lower face/neck and remains against the dark field
after the recognizable portrait has faded. The source departure neighborhood
does not show a comparable light patch. This is a multi-frame observation, not
a single unlike checkpoint or an atlas-state hypothesis.

Evidence: `review-hero-neighbors.jpg`, `review-hero.jpg`, the supplied
`pair-score-0.jpg`, and `review-hero-original-{source,local-before}.jpg`. The last
two are original encoded-size extractions at source 8.25s/local 8.5s; neither is
claimed to have identical exact displayed pose. Across the broader neighborhoods
both traversals cover hero world roughly **.35–.70**, story 0 and the beginning
of opening progress. The difference survives looking beyond one uncertain
frame alignment.

**Disposition: recorded visual difference, attribution/reproduction pending.**
The input files omit pointer/click history and material state. A matched neutral
pointer and equal entry/settling history are needed before making this an
independent product finding. The parent is already correcting hero remapping,
scene emergence and background lifetime; this observation may belong to those
known pipeline problems and is not counted as a seventh independent bug.

**Action:** inspect the same departure interval in the fixed-time source/local
replays, including several frames after the portrait is gone. If the patch
persists locally only under matched interaction history, identify its visible
owner first: portrait output versus the fixed background material. Relevant
owners are `1-hero/hero-portrait.ts`, `1-hero/hero.animate.ts` and
`2-story/story-environment.animate.ts`. Do not retune global lighting or opacity
from this uncontrolled before pair.

### No additional structural visual defect established from the before videos

Beyond the supplied pipeline findings and R10-V1, these offline sequences do
not establish a new missing/reordered asset, wrong project order, broken path
motif, missing chapter or permanently absent footer. The observations below
describe what was visible; they do not grant continuous parity acceptance.

| Region inspected | Before-recording observation and unresolved issue |
| --- | --- |
| Hero departure / opening | Same portrait and basic departure-to-three-line opening sequence. Marquee phase differs at the start; completed-entry age is not synchronized, so a different visible substring alone is not a copy defect. Entry loader/choice/logo assembly is not recorded. R10-V1 and the known hero pipeline corrections still need replay. |
| Optical camera / type hand-off | Both traverse the small glasses, blurred opening text, enlarged right lens, dark optical passage and BUILT ON LOGIC introduction. Some intermediate type/camera poses differ in approximate pairs; delivery cadence and frame alignment prevent isolating a further sampler error from them. Compare fresh replay intervals rather than copying a settled score 40 result. |
| Concepts / Ideas | PERSPECTIVE, CLARITY, DIRECTION and Ideas appear with the corresponding original sculptures and text arrangements. Matching settled compositions do not validate the motion between them. The known scrub correction changes that motion and must be reviewed in the new capture. |
| Work | The sequence is Wujhat → Tranche Finance → Remoteplatz → 8returns, with plane, interlocking forms, figures and cube motifs connected by the horizontal line. Both show incoming dim titles and neighboring-card overlap during travel. Differences in how much of a title/mark is drawn are not independently graded through the uncertain alignment. No hover/focus inputs are recorded; hover gates are untested here. |
| Systems / footer | The project exit hands into screen outlines, FLEXIBILITY / WITHIN STRUCTURE waves, Space for what comes next and the GAZZAR footer. Both actually settle at 714. The recorded partial reverse returns through systems and the four-project region. Enter/drag/footer morph interactions are absent. |

The original source maximum native position is 40837.0352, local 40837; both
documents report 42229px height. Both finish the partial reverse at native
approximately 22837/score317.83. Equal extents and a similar endpoint are useful
alignment facts, not evidence of equal scrolling feel.

## Known corrections are context, not new review findings

The parent reports an architecture audit with six concrete pipeline differences.
`aa5b460` removes Lenis bootstrap; `8537b36` advances scrub at event time and snaps
refreshed geometry against recovered source goldens. Separate implementation work
addresses hero raw-progress smoothing before its piecewise map, scene emergence
from hero chapter presence, and background mode/no-op field lifetime. These are
implementation/audit reports, not independently accepted runtime results here.

The parent's earlier native-input diagnostic records local wheel cancellation
and a Lenis tail versus uncancelled source input without Lenis. The before
`scrollBy` videos cannot accept or refute that diagnostic or the wheel fix.
The reviewer did not rerun it. Passing checks or matching source numerical
goldens do not establish that the integrated animation now feels identical.

## Required continuous comparisons

The new `capture-replay.function.js` uses a page-owned clock, the same 450-event
schedule, untrusted `WheelEvent`s and `scrollBy` only when the event is not
prevented. It exercises the actual wheel listeners/magnet and removes per-input
MCP latency. It is expressly **synthetic wheel plus simulated default scrolling,
not physical wheel/trackpad input**. It samples handler state after dispatch,
while visual rendering follows on subsequent frames. Cancellation, nativeY,
hero world, opening/story scores and painted frames must remain distinct.

The completed `source-wheel-telemetry.json` was subsequently read: 450 events,
all `trusted:false`, all `prevented:false`, ending at y22837.0332/score317.83.
Its contact sequence was inspected. The integrated local-after recording was
not yet available at this point, so the new source run grants no candidate
acceptance.

**Do not reuse the old alignment formula for the new replay.** Source-wheel
video duration is **77.266667s**, replay telemetry lifetime **70.732s**. Recorder
metadata stops approximately **6.337s after** replay telemetry stops. Thus
`videoDuration - telemetryLifetime` would misidentify several seconds of
post-roll as pre-roll. The recorder start precedes telemetry start by about
.181s, but that timestamp was taken before launching ffmpeg and is not an exact
first-frame synchronization marker. Validate alignment against a painted/input
marker before grading precise new replay phases.

Review the integrated replay as a continuous sequence with pauses and resumes;
do not reduce it to another list of matching settled screenshots. In particular:

1. **Hero → optical → concepts while input continues.** Follow portrait fade,
   persistent-shell arrival, every opening line mask, glasses emergence, lens
   camera movement, optical veil, introduction and all three sculpture/type
   transitions. Check the intervals before and after each pause, including
   R10-V1. Preserve the source's intentional display scrub independently of
   native input; removing Lenis does not authorize removing that scrub.
2. **Ideas → connector → all four projects → systems → footer.** Watch the
   connector leave the moving 3D origin, each mark being drawn, title/meta travel,
   neighboring-card overlap, the final connector handing into the screens,
   screens becoming waves, and closing text/footer entering. A settled 312,
   580 or 714 alone cannot establish any of these hand-offs.
3. **Full reverse, with reversals before settling.** The supplied before run and
   current replay schedule reverse only to approximately 318; they never cross
   the critical 270 seam backwards, restore the lenses or return to the hero.
   Continue footer → work → Ideas → concepts → optical → hero, with short
   stop/reverse/resume inputs around 270 and the opening/pin boundary. Look for
   latent scrub, jumps, one-frame stale layers and wrong reveal order.
4. **Actual input feel.** Compare a small discrete wheel pulse, closely spaced
   pulses, a long burst, an abrupt release and an immediate direction change
   against the source in the same browser/device. Compare nativeY over time and
   displayed motion separately. Any extra local easing tail or cancellation
   must be explained by source behavior. The synthetic fallback is useful
   diagnostic evidence but cannot substitute for this comparison or the user's
   judgment of scrolling feel.
5. **Interactions during traversal.** Test project hit/focus behavior before,
   during and after mark completion and after reversing; only the appropriate
   visible project should activate. Open/close the menu during motion, then
   resume scrolling; exercise the hero magnet and back-to-start cue after the
   Lenis removal. At the footer, compare Enter and pointer pull/release while
   the last scroll motion settles. Prior R9 control checks do not exercise
   these changed integrated input paths.
6. **EN and AR, wide and narrow.** The supplied recordings certify no Arabic
   continuous behavior. Repeat the movement and interaction sequences with
   Arabic shaping, RTL work travel and the source's narrow composition. Include
   cold entry and warmed traversal, plus a complete entry-choice/portrait/logo
   sequence. R8's accumulated AR lighting observation remains unresolved; this
   review adds no speculative atlas/material diagnosis.

For the next comparison preserve the exact candidate revision, entry/motion/audio
state, pointer history, viewport/DPR, intended versus actual input times, nativeY
and displayed scores. Use a reliable recording/telemetry synchronization marker
before judging frame timing. A 30fps downscaled capture may expose a visible
discontinuity but cannot certify physical-device smoothness or every rendered
frame. The user must see and accept the resulting continuous experience; this
report supplies evidence and concrete unresolved cases, not a replacement for
that acceptance.
