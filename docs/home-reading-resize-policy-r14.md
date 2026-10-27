# HOME reading resize position

R13-02 reproduced in English and Arabic, including matched fresh reloads:
reading at538×825/native825 →2544×1392 leaves source825 but local1392.
The position change precedes the portrait visibility difference; manually
normalizing825 is not acceptance of that history.

The page-world trace captures source ScrollTrigger's matchMedia refresh writing
825→0→825. Local reaches1392 before its capture-phase resize handler without
an intercepted window/Element scroll write or navigation RESTORE event. A
single reversible local diagnostic disabled native anchoring on HOME main and
retained825 with the same focused control. The exact anchor node was not exposed.

Evidence: `/tmp/gazzar-r13-position-cause/source-baseline.json`,
`local-baseline.json`, `local-anchor-none-diagnostic.json` and both release
records. Main is the proven diagnostic boundary; no narrower boundary has been
claimed. The source focus was BODY while local retained the motion button.

The production correction disables native anchoring only on
`main[data-page='landing']` while it contains `.experience.is-reduced`. This
prevents browser anchoring from replacing the reading pixel offset when viewport
geometry changes. It adds no scroll listener, saved-y lock, timer, or scripted
resize seek. Ordinary native scrolling, document-height clamping, and existing
semantic locale/history/restore transactions retain their owners. Returning to
motion removes the conditional policy.

Prepared after trace release; independent production verification remains
required for fresh EN/AR narrow→wide/native825, reverse resize, height-only/no-op
resize, retained semantic locale intent, Back/Forward, and mode-toggle clamping.
Whole-experience smoothness is a separate open requirement.
