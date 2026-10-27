# R22 independent HOME restoration owner review

**Result: no new concrete P1/P2 finding.** The R21 replacement-after-resize P2
is corrected in the reviewed code. The original outgoing-owner failure mechanism
also remains blocked algorithmically. This is a bounded code/lifecycle review;
independent production acceptance and full moving EN/AR HOME parity remain open.

This is a fresh review of the navigation changes from `0de3432` through
`b08b761`, including the supplied uncommitted follow-up. During review the root
committed that same follow-up as `6b05b8c`; final inspected HEAD was `02fd78c`.
Read the controller, selector/checkpoint helpers, relevant lifecycle tests,
journey/hero/reading integrations, architecture contracts and R21 finding.
Only this R22 review document was written by the reviewer.

## Owner and history-phase assessment

- **Replacement preserves completed history semantics.** At
  `src/lib/navigation/home-navigation.ts:203`, a different connected physical
  owner invalidates only `state.applied`. Its nonnull `layoutKey` survives, so
  the `initialHistory` decision at line 321 stays false and the new owner
  reprojects the retained semantic position. Per-mount stability tracking still
  starts afresh; retaining this key does not skip the replacement application.
  The regression at `tests/home-navigation.test.ts:813` verifies wide work312
  at y16361.625072, narrow work312 at y12091.123824, and replacement at the same
  narrow position, URL, ID and anchor. Later footer capture plus same-root
  remount/READY does not replay that anchor. A different history ID starts a new
  raw-pixel phase and correctly reaches story489.333278 in narrow geometry.
- **Changed geometry and interrupted application retain the right phase.**
  Additional in-memory probes reused the existing browser adapter and actual
  navigation/position/clock modules without editing tests. Replacement directly
  into changed narrow geometry, and replacement after one RAF of an unfinished
  semantic resize, both finish at y12091.123824/story312. Replacement after two
  RAFs of an uncompleted first history application still starts with a null
  key and applies the saved y16361.625072/story489.333278. Each case passed with
  storage available and denied, kept URL/ID, and did not reapply on subsequent
  READY/layout notifications. A fresh restore cycle allocates its own null key
  at line 124; physical replacement no longer simulates a new history visit.
- **Outgoing locale cannot complete the destination transaction.**
  `resetCycle` at line 374 publishes destination selection synchronously, cancels
  pending RAF/capture work, and marks a cross-locale owner departed without
  adopting the destination ID/path/checkpoint. `isCurrentHome` at line 234
  blocks layout application, manual-restoration claims and native checkpoint
  writes on that owner. Departed guards also block capture, queued capture and
  wake. Cleanup at line 490 cannot overwrite the saved outgoing checkpoint with
  later destination/layout pixels. If Next's earlier capture listener removes
  this controller first, synchronous selection at lines 118–120 recognizes the
  valid historical EN checkpoint even after a fresh AR document reload.
- **Cancellation and remount lifetimes remain coherent.** Rapid traversal back
  to the still-connected original locale clears departure and selects a new
  cycle there; repeated intermediate destinations leave its old checkpoint
  intact. Same-root/Strict Mode remounts retain completion and their later user
  position. Detached stale mounts neither invalidate physical completion nor
  claim restoration. Persisted pageshow starts a genuine history cycle using
  its latest saved pixels, rather than carrying the previous visit's semantic
  phase into BFCache restoration.
- **Selection and write policy remain intact.** Explicit router pixels precede
  generic HOME return, work query/pending work, locale and initial history
  pixels. Hash navigation stays native after stronger returns are considered;
  checkpoint lookup keeps exact pathname/search. Ordinary fresh reload remains
  zero/manual and does not repeat its document reset on route/controller remount.
  The added inferred-history branch requires previous document selection,
  a different selected ID and a validated matching checkpoint; missing,
  wrong-path/search, future and malformed records do not qualify. No application
  caller pushes a new entry with a historical full checkpoint, so no concrete
  new-push false classification was established. Arbitrary external callers
  deliberately supplying such a record remain outside this certification.
  Captures continue to update bounded memory/storage; routine scroll/scrollend
  does not call native history writers. No timer, runtime, SSR content boundary
  or integration API was added by the follow-up.

## Evidence and validation limits

Read `/tmp/gazzar-native-r20/root-outgoing-owner-failure.json` directly. This
positive failing identity trace records a restore on connected outgoing AR
root1 at 52741, EN root4 arriving at 52774 with y8637.200195, and eventual
y825/story0 without another restore. Its prospective 350ms fetch wrapper has
`network.records=[]`: it matched zero requests and introduced no response
latency. Instrumentation recorded identity/attributes without geometry reads
or native-writer wrappers. It establishes the outgoing-owner application,
without identifying every subsequent native adjustment's writer.

The supplied root validation of `b08b761` reports 205 tests/5857 assertions,
build `8IWMqyVNqrFD9xtvSt9UL` and SSR checks; its first unhooked exact production
trigger stayed at EN20765/footer714 and Forward returned AR20765/714. A later
root identity trace reported restores only on the new EN owner. These are
parent-owned results preceding the semantic-phase follow-up, not independent
production acceptance of this reviewed state. The follow-up's reported 66
scoped tests/1157 assertions, lint and plain TypeScript checks are implementer
evidence; this reviewer did not rerun those broader checks.

Reviewer validation: **12 selected lifecycle tests passed, 0 failed,
286 assertions, 69ms**, plus the six in-memory scenarios above. Selected tests
cover delayed DOM commit/clamps, earlier Next teardown, rapid cancel/return,
invalid checkpoint inference, HOME/query/hash precedence, physical replacement,
the new history-phase regression, explicit router override, fresh reset,
same-root cleanup, BFCache and 70 inputs without routine native history writes.
`git diff --check` also passed. The synthetic adapter controls listener ordering
and geometry; it does not reproduce browser layout/commit scheduling or presented
motion.

No browser, desktop/OS interaction, build, typegen, server, staging, commit or
delegation was performed. No prior review, contract or root status document was
edited. Root-owned integration and fresh production validation remain necessary.
The existing whole-page stutter complaint is still open; this review establishes
no new stutter finding, FPS result, universal restoration guarantee or full HOME
parity acceptance.
