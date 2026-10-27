# HOME native analysis review — R19

2026-10-27. Offline code/method review for application `6f55075` and build
`buyy0OD6hWPIKX2N4wX5-`. **No concrete P1/P2 attribution or phase-alignment
defect was demonstrated in the new cost extractor on the available summaries.**
Two lower-severity summary defects are recorded below. This is not acceptance
of HOME parity or closure of the whole-page stutter finding.

Scope: read `analyze-native-cost.py`, `analyze-profile.py`, the capture manifest,
[capture provenance](home-native-capture-r19.md), driver source, and narrow JSON
summaries under `/tmp/gazzar-native-r19/`. No compressed/raw profile was opened;
no browser/native input, capture, application edit, build, test, server operation,
or utility execution was performed. Only this review document was written.
The analyst retains ownership of extraction and native-cost interpretation.

## Concrete minor defects

1. **P3 — inconsistent percentile ranks can put p95 below the median.**
   `/tmp/gazzar-native-r19/analyze-profile.py:373–378` uses the upper middle
   element for the median, but `floor((n-1)*0.95)` for p95. Minimal fixture:
   sorted values `[3, 30]` produce median `30`, p95 `3`, max `30`. The current
   source optical cost summary exhibits this directly for `ForgetSkippable`:
   count `2`, median `0.182129ms`, p95 `0.111554ms`.
   `analyze-native-cost.py:70–75` reuses this helper, so both tools inherit it.
   Use a consistent quantile convention, such as nearest rank for both
   probabilities, or consistent interpolation. Totals, maxima, and threshold
   counts are unaffected; no local application cause follows from this defect.

2. **P3 — `hidden_receipts` reads the prevented-input flag.**
   `/tmp/gazzar-native-r19/analyze-native-cost.py:192` counts `receipt[4]` as
   hidden, while `driver.function.js:9` writes that column as
   `intent.defaultPrevented`. Minimal fixture: receipt
   `[506, 500, 0, 0, true]` increments `hidden_receipts` even in a visible,
   focused document. Conversely a hidden, unprevented input contributes zero.
   Rename the result to `prevented_receipts`; this driver does not record
   receipt-level focus/visibility. The separate observer-frame check at
   `analyze-native-cost.py:191` reads the correct frame columns and remains
   valid for observed frames. Current zero values do not independently prove
   receipt-level visibility.

## Attribution and alignment assessment

The new extractor pairs marker phases before identity filtering and treats
phase-0 markers as instants (`analyze-native-cost.py:21–55`). Its page assignment
requires mapped inner-window identity and rejects known foreign frames
(`:259–275`); process-native work and shared parent/graphics activity remain
separate. The shared source/function lookup and packed flag handling are present
in `analyze-profile.py:194–212,256–304`. I found no concrete mapping or unit error
in these paths from the permitted evidence; their actual raw-table completeness
was not independently revalidated.

Receipt-backed phase origin is native end minus **actual** driver duration
(`analyze-native-cost.py:146–154`). Source optical uses its retained native
start/end markers and explicitly avoids the obsolete receipt file (`:143–160`).
The available outputs use optical phase `[506,3801]ms` and footer
`[501,18401]ms`, as the current common-window code specifies (`:362–374`).
This does not recover evicted idle lead or unavailable source optical receipts.
Marker stamp extent remains only an extent check, as the result already states;
the old native-detail marker totals are not the new paired/clipped totals.

At review time, `native-cost-compact.jsonl` contained source optical, local
optical, and source footer results. `local-footer-cost.json` was absent; the
available local footer coverage inspection contained only PID `2`, no task
markers, and no local page identities. Do not infer a zero local footer cost or
paired footer excess from these outputs. Target ownership/coverage for that
capture remains for the analyst to resolve without substituting the parent
process or an old document identity.

The documented limits remain in force: statistical sample/CPU association,
overlapping marker wall intervals, shared graphics scope, unmatched optical
receipt availability, profiler overhead, and no presented-FPS or causal parity
claim. No new application-cost attribution is made by this review.

Reviewed utility SHA-256 snapshots (the analyst may subsequently revise them):

- `analyze-native-cost.py`: `1130faa0985b2c83fa4f5e3664e9b10dac9ba0481a00c967a66b0caa3bbfe837`
- `analyze-profile.py`: `8335a72b6ebcef5e1c6b2ad13b90336af9cd228a9cc56d5093be0dc4fba611f5`
