# R20 — offline adversarial HOME history persistence review

**Finding: no concrete P1/P2 regression found in the frozen four-file diff against
`e13407c`.** No app-code correction is requested by this review. This is a code
review conclusion, not live navigation, performance, or HOME parity acceptance.

## Scope and provenance

Independently reviewed the actual baseline-to-working-tree diff and surrounding
implementation in:

- `src/lib/navigation/home-navigation.ts`
- `src/lib/navigation/home-navigation-state.ts`
- `tests/home-navigation.test.ts`
- The appended persistence contract in `docs/home-navigation-contract.md`

Also read `AGENTS.md`, the load/boundary architecture docs, the hero/journey
integration, the reading/position adapters, the reading test, and the installed
Next native-history guide and relevant `app-router.js` implementation. The Next
guide confirms native history integration; inspection of its implementation
confirms the existing `__NA` state merge takes its internal-write branch. The
patch preserves those fields and does not wrap either history method.

Reviewed file SHA-256 values, in the order above:

```text
c076f5409a6512c565e6cb447bb3d6a927b4753f203bd07174647a26ef225bdc
d2a4f6a6d88dacf8c9208299f4ae16062a2e2d561542944b8408b978ecab5cc4
96219a15fd1e8a7159c0a51a7c176bb2854ef880f961e74c96c922d0751b7e01
19e152bfab137c071ccb735598a0b62cbc653f6a64a57e5c97bd44532993c1ce
```

## Adversarial paths checked

1. **Early identity versus cached intent and quiet reset.**
   `prepareEntry()` runs synchronously before `onHomeChange`, font completion or
   geometry frames (`home-navigation.ts:242–248,450–488`). A successful write
   updates the existing restore state's key at line 239. A callback's subsequent
   `getHomeRestoreIntent()` therefore reuses the selected state instead of
   reclassifying that new ID as an already visited history destination. Intent
   selection still precedes the quiet reset, and outgoing cleanup precedes both.

2. **Destination selection before outgoing cleanup.**
   Cleanup calls `save(true, undefined, true)` while the old root is connected
   (`home-navigation.ts:454–459`). That capture uses the outgoing closure's
   `entryId` and exact `path`; `save()` now writes only document memory and
   session storage. It cannot replace the selected destination's history state.
   The retained and visited maps survive listener removal, allowing the new
   owner's synchronous getter to select a visited destination even if Next
   teardown runs before the outgoing popstate listener. The added early-capture
   fixture explicitly checks available, denied and write-denied storage.

3. **Same-URL, different-ID lifecycle isolation.**
   Native writes share `writeHistory()`'s connected-root, exact pathname/search,
   and selected-ID checks (`home-navigation.ts:217–218,232–240`). A nonmatching
   destination ID blocks hidden/pagehide flushes even while the old root remains
   connected. Cleanup has no native flush. The new same-URL lifecycle fixture
   exercises this distinction rather than relying only on a URL change.

4. **Partial inline identity and competing checkpoints.**
   An identity alone fails full-checkpoint parsing but still selects its external
   record. Every candidate passes the existing checkpoint parser; external
   candidates additionally match the selected ID
   (`home-navigation-state.ts:81–107`). Greater timestamps win; `>=` and iteration order implement memory over
   storage over inline on ties. Wrong-ID/path/search, future or malformed records
   cannot displace a valid inline candidate. Explicit router-target precedence
   and all subsequent intent-precedence branches remain unchanged.

5. **Pixels versus displayed semantics and retained restore anchors.**
   The periodic dedupe now requires unchanged exact pixels as well as a nearly
   unchanged semantic fraction (`home-navigation.ts:254–260`). Captures retain
   both values without assigning `state.intent`. Initial history application
   still uses saved pixels; subsequent layout/mode application retains the
   existing semantic anchor. Query consumption, the reading locale's distinct
   height/gap policy, and fresh reload/manual restoration are not rerouted by
   the persistence change.

6. **Denied storage, document lifetime, pagehide and BFCache.**
   Memory is updated before the guarded storage write. Both document maps are
   independently bounded to 40 entries and owned by `WeakMap<Document, …>`.
   Ordinary new documents cannot inherit them. Pagehide captures and flushes
   before suspension and timer/frame cancellation; persisted pageshow resumes
   the existing history-selection cycle. Boundary inline checkpoints therefore
   remain usable across a new document when storage is denied. Cache eviction
   and abrupt loss before a boundary retain only the explicitly accepted
   inline/native fallback.

7. **Native-write reachability and exceptions.**
   Scroll, scrollend, periodic timers and cleanup reach `save()` without reaching
   `writeHistory()`. Full flush call sites are restore completion, eligible link
   capture, hidden visibility and pagehide; identity preparation is separate.
   The native call remains caught, while document/storage records survive a
   failed flush. No new history interception, animation runtime, content/loading
   boundary or journey/store integration change appears in this diff.

## Evidence and coverage limits

The new tests address repeated 70-input captures, pixel precision inside an
unchanged semantic fraction, real listener-removal semantics in the test event
adapter, early teardown, external-record selection, denied storage, lifecycle
ownership, new-document/BFCache distinctions, pending fonts, remount cleanup and
the 40-entry memory bound. The existing reload, return precedence, quiet capture,
resize/mode anchor and hash tests remain relevant. Their implementations were
read; this review did not execute them.

The implementer reports 59 focused navigation/reading tests /920 assertions,
owned lint and plain TypeScript passing. Those are owner-reported results, not
independently rerun evidence. Root owns full check/build and production SSR
validation, which remain pending in this review's brief. The adapter does not
execute Next/React commits or real browser history/BFCache behavior, and its
native history stub does not inject browser exceptions. This review does not
claim those runtime paths have been live-validated.

No browser, OS interaction, server, build, typegen, package operation, test run,
staging, commit, app edit or delegated agent was used. Only this report was
written. No raw profiles were read. Production remains the brief's `6f55075`,
not this frozen change. Whole-page stutter, causal performance attribution and
identical EN/AR HOME appearance/motion/scrolling remain open; no FPS improvement
or stutter cure follows from this review.
