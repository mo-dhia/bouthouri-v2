# R21 independent HOME restoration owner review

**Result: one additional P2 regression; changes requested.** No additional P1
was found. The outgoing-locale ownership correction addresses the supplied
failure mechanism, but replacement ownership currently restarts the initial
history-pixel phase and can destroy a successfully retained semantic anchor.

Reviewed the uncommitted changes against `0de3432` in
`src/lib/navigation/home-navigation.ts`, `tests/home-navigation.test.ts`, and
`docs/home-navigation-contract.md`. Application code and tests were left intact.

## P2: replacement HOME restarts saved-pixel history after semantic reprojection

**Location:** `src/lib/navigation/home-navigation.ts:201–203`, interacting with
the initial-history decision at lines320–324 and anchor replacement at
lines348–352.

When a connected replacement root differs from `state.appliedOwner`, the new
guard clears both `state.applied` and `state.layoutKey`. For a completed
`history` intent, `layoutKey === null` also means its first saved-pixel
application has not happened. The replacement consequently applies the
original `intent.scrollY` again, even after a completed resize reprojected the
visit's retained semantic position. It then replaces that position with the
different scene reached by those old pixels.

Concrete trigger: restore a history entry at work312 in wide geometry; resize
to narrow geometry and finish its correct semantic restore; replace the
connected HOME root at the same URL/entry and unchanged narrow geometry.
There is no new traversal, pending return, layout clamp or user scroll in the
replacement step.

An in-memory reproduction reused this test file's browser adapter and actual
navigation/clock modules. It compared the committed controller with the
uncommitted controller without writing a test or application file:

| Step | `0de3432` | Uncommitted patch |
| --- | --- | --- |
| Initial history restore, 1912×1009 | y16361.625072 / story312 | y16361.625072 / story312 |
| Resize to 392×865 | y12091.123824 / story312 | y12091.123824 / story312 |
| Replace root, same narrow geometry | y12091.123824 / story312 | **y16361.625072 / story489.333278** |
| Retained position after replacement | work, progress≈0.042254 | **systems, progress≈0.417508** |

This violates the retained-intent contract as well as the new replacement-root
contract. Invalidating physical completion must preserve an already-completed
history visit's semantic phase. Retaining its existing layout key while
clearing application completion, or tracking first history application
separately, would avoid conflating these responsibilities. This does not need
a delayed retry, pixel lock or anchoring change.

The added replacement test at `tests/home-navigation.test.ts:789` uses a
`work-query` intent, which never enters `initialHistory`; it therefore passes
despite this regression. Add the history→resize→replacement case above, require
the new root to apply work312 at its narrow target, and retain the same-root
READY/remount no-op assertions.

## Other reviewed behavior

- Outgoing checkpoint identity is retained across cross-locale departure.
  `resetCycle` publishes destination state but does not adopt its entry/path on
  the outgoing owner. The departed guards block capture, queued capture and
  wake; `isCurrentHome` blocks application and native checkpoint writes. Cleanup
  cannot overwrite the outgoing checkpoint after departure.
- Rapid traversal through multiple destinations keeps the original outgoing
  checkpoint; returning to that still-connected locale clears departure and
  starts a destination cycle there. Same-HOME query/hash paths remain eligible
  for that root, with exact pathname/search used for checkpoint selection.
- The added early-teardown recognition requires a changed selected ID and a
  validated matching checkpoint. It does not infer history merely from an
  unknown ID or an ordinary new push without a matching checkpoint. Initial
  document reload has no previous selection. Invalid path/search, future and
  malformed checkpoint controls are present. The existing visited-ID branch
  is unchanged; arbitrary callers supplying a valid historical checkpoint to
  a new push were not certified.
- The selector's explicit router target, generic HOME, work, locale and pixel
  fallback precedence is unchanged. Destination consumption remains on the
  stable application path. Denied-storage, fresh reload zero/manual policy,
  BFCache, same-root completion and the absence of routine native history
  writes have focused controls. No new runtime, delayed resnap or broad
  anchoring rule appears in this diff.

## Evidence and limits

Read `/tmp/gazzar-native-r20/root-outgoing-owner-failure.json` directly. It
records restoration on connected outgoing AR root1 at52741, EN root4 commit
at52774 with y8637.200195, and eventual y825/story0 without a second restore.
Its prospective350ms fetch wrapper has `network.records=[]`; it delayed no
response. This is identity evidence without geometry reads or native writer
wrappers, and does not identify every later native adjustment's writer.

The new delayed-DOM test at lines630–692 exposes the relevant old failure: it
leaves AR connected through the restore opportunity, checks zero outgoing
restore/write, models EN clamps to8637.2 then825, and installs the identical
825/19940 pin before requiring one EN20765/footer714 restore. Both storage modes
also check AR Forward retention and70 subsequent inputs without native writes.
The earlier-teardown and rapid-return-before-commit tests cover separate races.
These are synthetic lifecycle/geometry controls, not browser acceptance.

Reviewer validation ran only11 selected tests from
`tests/home-navigation.test.ts`: **11 passed, 0 failed, 282 assertions, 47ms**.
The separate in-memory baseline comparison produced the P2 above. The reported
65-test/1105-assertion, lint and TypeScript results in the contract remain
implementer evidence; this review did not rerun those broader checks.

No browser, OS, build, typegen, server, staging, commit or delegation operations
were performed. Only this review document was written; the separate untracked
`docs/home-smoothness-evidence-r21.md` was not edited. Fresh production validation
remains root-owned. The original Back P2 is not closed by this offline review;
whole-page stutter and full EN/AR HOME parity remain open.
