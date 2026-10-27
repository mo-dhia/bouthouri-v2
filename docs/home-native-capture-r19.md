# HOME native capture provenance — R19

2026-10-27. Application `6f55075`, production BUILD
`buyy0OD6hWPIKX2N4wX5-`, remained unchanged throughout capture. The native
profiles investigate the residual cadence finding in
[R16](home-continuous-review-r16.md); they do not accept full HOME parity.

The user authorized autonomous native computer/browser operation while away.
Root used the existing Zen window and Vawzen tabs 37/36. Firefox's temporary
profile viewers were exported locally and closed one at a time. Nothing was
uploaded. No application build, test, server restart, video encoding, frame
extraction, or offline profile analysis ran during an accepted native capture.
The offline researcher paused heavy work before each recording.

## Input and collection

These captures retain the unchanged programmatic R17 input plans. The page
dispatches an untrusted wheel event and calls native `scrollBy` only when that
event was not prevented. They are **not** physical-wheel or native APZ input
measurements. Both pages were focused/visible at 2544 × 1392 CSS pixels, DPR 1, entry
complete, motion enabled and audio muted. Fonts and scene assets were ready;
local optical/footer each received a complete unprofiled warmup first.

The host scheduled native `Ctrl+Shift+2` at the driver's expected end plus 150ms,
in the same orchestration call as starting the driver. Capture therefore did
not wait for a later model turn. Actual driver elapsed time and retained native
end markers must still determine analysis boundaries.

| Segment | Collection | Actual driver receipts | Local artifacts |
| --- | --- | --- | --- |
| Source optical | Graphics-derived named threads, 16 MiB, 1ms | Fast-run receipt export unavailable | `source-optical.json.gz` |
| Local optical | Same 16 MiB/1ms configuration | 70; 3801ms; 181 observed RAF callbacks, all focused/visible | `local-optical.json.gz`, `local-optical-driver.json` |
| Source footer | `pid:2,pid:18913`, 64 MiB, 1ms | 450; 18401ms; 1103 observed callbacks, all focused/visible | `source-footer.json.gz`, `source-footer-driver.json` |
| Local footer | `pid:2,pid:52983`, 64 MiB, 1ms | 450; 18420ms; 1086 observed callbacks, all focused/visible | `local-footer.json.gz`, `local-footer-driver.json` |

Paths in the table are under `/tmp/gazzar-native-r19/`. The capture manifest
records file sizes, SHA-256 hashes and run metadata. Optical uses70 targets over
3.8s; footer450 over 18.4s. Observed RAF callback counts are not presented FPS.
The two footer filters select the parent and respective content process;
PID 2 is the actual Flatpak PID namespace parent, not host OS PID 2. Source footer
contains 127 parent threads and 33 content threads. This collection has overhead.

Native stacks, JavaScript, process CPU and ordinary memory tracking were
enabled. Screenshots, allocation tracing, file I/O and IPC tracing were not.
Every export explicitly included hidden threads, hidden time range and resource
URLs/paths; screenshots and extension information remained excluded. Checkbox
state and the nonempty, completed gzip download were checked before closing
each viewer. Downloads stayed local.

## Retention is distinct from input coverage

The valid short source optical file retains both task markers and surrounding
source samples. Its fast-run driver export was lost; the older
`source-optical-driver.json` belongs to an excluded earlier attempt and **must
not** be substituted as receipt evidence for this file.

Local optical lost its start marker and approximately 298ms of idle lead-in.
Its first actual input arrives at+506ms; retained local samples begin 207.47ms
before that input. Source footer likewise lost its start marker and roughly
440ms of idle lead-in; retained source samples begin 61.38ms before its first
actual receipt at+501ms. Thus these two files can support a separately verified
active-input interval; they cannot establish complete idle-lead coverage.

Alignment for those intervals uses the retained native end marker and the
exported driver's actual elapsed times, not a planned deadline. Allow roughly
millisecond clock quantization. Native marker intervals and the local footer
range require their own coverage check before cost comparison. A missing start
marker is neither permission to invent it nor proof that all subsequent active
input is unusable.

The first 12-second source attempt aged the test out of its 16 MiB buffer. It is
preserved as `source-optical-range-incomplete.json.gz` and excluded from causal
comparison. An earlier shortcut attempt preceded enabling the official profiler
menu feature; its driver-only file is also excluded.

## Additional bounded checks

The `6f55075` menu clock correction was checked separately, with no profiler
recording. A narrowly scoped native WebGL draw wrapper read `uTime` on natural
background default-framebuffer draws. Across 469 draws, including MENU open,
quiet-tail and close, **zero backward values** occurred. Material time advanced
6.867s between the two menu-open marks. All six native descriptors were restored
and the probe removed. This uniform-read diagnostic can stall; it is not a
cadence comparison. Evidence: `local-menu-monotonic.json` and
`clock-probe.function.js` in the same directory.

Root also established a native-input path for subsequent moving review. A
bounded XTest helper emitted 16 wheel notches at 80ms spacing in the assigned
foreground window, stopping if focus changed. Firefox delivered 16 trusted
pixel-mode wheel events of 114px to each page; neither page prevented them, and
both settled at native 1824px from0. Browser `isTrusted` here identifies the
native input route; XTest is not physical hardware. No timing/FPS acceptance is
drawn from this calibration, which ran during offline analysis. The helper,
plans, host receipts and source/local page receipts remain under
`/tmp/gazzar-native-r19/`.

## Remaining work

Offline native-cost analysis must distinguish assigned-page JS stacks from
unknown/native-only process work and shared parent/graphics work. Nested marker
totals overlap; sample-associated CPU is statistical attribution, not an exact
callback duration. Buffer size, overhead and differences in retained intervals
must remain explicit.

The original source37/local36 tabs are retained, reset to EN/y0, entry complete,
menus closed and audio off. All native drivers and WebGL probes are removed;
all temporary viewers are closed. The profiler is stopped. Its temporary
configuration remains 64 MiB/1ms with the last local PID filters pending the end
of this investigation; the original settings were Web Developer/1 GiB/1ms with
the profiler toolbar feature disabled. Whole-page smoothness and full parity
remain open.
