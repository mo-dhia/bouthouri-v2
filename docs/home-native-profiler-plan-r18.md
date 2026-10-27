# HOME native Firefox profiler feasibility — R18

2026-10-27. Research only, following R17 and application `1ebf932`. No browser
tool was called. Original assigned source tab 37 and local tab 36 were not read,
selected, navigated, instrumented, or otherwise changed. No application,
extension, preferences, package, build, check, test, server, or process-lifecycle
action occurred. Writes are limited to this report and source-research notes in
`/tmp/gazzar-profiler-r18/`. Root's separate MENU validation is not evaluated.

## Decision

**The proposed public-WebChannel capture route is unsupported.** Temporarily
putting `https://profiler.firefox.com` in one existing assigned tab does not
provide start/stop/capture control over the other tab. Current official frontend
types and Firefox's handler contain neither `START_PROFILER` nor
`GET_PROFILE_AND_STOP_PROFILER`. The public `GET_PROFILE` operation retrieves a
previous capture associated with its requesting viewer tab; it does not create
one. See the [frontend contract](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/src/app-logic/web-channel.ts#L20)
and [Firefox request handler](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/client/performance-new/shared/background.sys.mjs#L382).

**There is no demonstrated way to obtain the required native profile with the
provided Vawzen tools while keeping all current scope and surface restrictions.**
Do not navigate either retained measurement document merely to test invented
commands. Restoring its URL would not establish restoration of its current
document, warm resources, animation history, or time origin.

R17 still leaves the shorter optical/footer callback-gap owner unresolved.
Its measured callbacks of at most 7ms and geometry calls of at most 1ms do not
justify another easing, quality, cadence, or geometry change. The 217–223ms timer
receipt delay has intervening 16–18ms RAFs and is not a continuous block. Native
profiling remains the appropriate next evidence, not an available capability
claimed by this research.

## Exact public channel and requests

These are offline protocol examples, **not commands executed in the browser**.
The page sends a `CustomEvent` named `WebChannelMessageToChrome`; its `detail`
is the JSON **string** encoding an envelope such as:

```json
{
  "id": "profiler.firefox.com",
  "message": { "type": "STATUS_QUERY", "requestId": 18001 }
}
```

Other relevant message objects are exactly:

```json
{ "type": "ENABLE_MENU_BUTTON", "requestId": 18002 }
{ "type": "GET_PROFILE", "requestId": 18003 }
```

There is no `GETSTATUS` or `GET_STATUS` request. `STATUS_QUERY` reports the
  menu's enabled state and channel version, **not whether recording is active**.
Current upstream reports version7. The frontend's version history documents
these control/retrieval messages from earlier Firefox versions; it does not
list a start/capture extension. Replies arrive through
`WebChannelMessageToContent`, with an object-valued `detail` containing the
channel ID and either `SUCCESS_RESPONSE` with `requestId`/`response`, or
`ERROR_RESPONSE` with `requestId`/`error`.
[Transport, reply types, and version history](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/src/app-logic/web-channel.ts#L75).

`ENABLE_MENU_BUTTON` enables the toolbar feature, changes the recording preset
to `firefox-platform`, adds the widget, and opens its popup. It is a persistent
UI/settings mutation, not a harmless permission/status handshake. `GET_PROFILE`
has no target-tab or recording-options fields. Capture registration is stored
in Firefox against a specific browser element. Manually loading `/from-browser`
does not register a capture. Unsupported command types take the handler's error
path. [Handler and capture registration](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/client/performance-new/shared/background.sys.mjs#L393).

Origin trust is real: Firefox registers the channel for its configured profiler
UI origin, normally `https://profiler.firefox.com`, and checks the sending
document's principal. A channel ID supplied from localhost or Gazzar cannot
impersonate that origin.
[Registration](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/startup/DevToolsStartup.sys.mjs#L875),
[origin check](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/toolkit/modules/WebChannel.sys.mjs#L112).

Synthetic page events are intentional here: the actor explicitly accepts
untrusted DOM events. The inspected supported-message path has no native user
activation or per-request permission-dialog requirement. That makes dispatch
possible in principle on the trusted origin; it does **not** add missing
operations. Vawzen host permission and page CSP remain separate potential
constraints. No permission prompt or live compatibility test was attempted.
[Actor event registration](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/toolkit/modules/ActorManagerParent.sys.mjs#L851),
[document-principal forwarding](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/toolkit/actors/WebChannelParent.sys.mjs#L14).

## Native scope controls: what they mean

The privileged native service has this start signature; it is **not a web-page
API or a WebChannel request**:

```text
StartProfiler(entries, interval, features, filters?, activeTabID?, duration?)
```

It also has asynchronous profile retrieval and disk-dump methods. Native
availability does not grant content JavaScript access to `Services.profiler`.
[Native IDL](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/tools/profiler/gecko/nsIProfiler.idl#L41).

- **Threads:** filter strings match thread names by case-insensitive substring.
  They are alternatives, not an AND expression. A normal `GeckoMain` filter
  matches that thread name in multiple processes.
  [Native filter contract](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/tools/profiler/public/ProfilerControl.h#L64).
- **Processes:** `pid:<decimal-process-id>` selects all threads of that process.
  A list containing **only** PID filters can prevent nonmatching child
  processes from starting their profilers. Adding `GeckoMain` or another
  non-PID filter removes this PID-only exclusion. This is neither a tab/window
  ACL nor a guarantee that shared-process work and metadata concern only the
  assigned pages.
  [PID-only rule](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/mozglue/baseprofiler/public/BaseAndGeckoProfilerDetail.h#L49),
  [child-process selection](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/tools/profiler/gecko/ProfilerParent.cpp#L939).
- **Active tab:** the toolbar obtains `browsingContext.browserId` from the
  selected browser. This is not Vawzen's WebExtension tab ID36/37 and not
  necessarily `browsingContext.id`. It is an association/view aid, not an
  exclusive collection boundary.
  [Browser-ID lookup](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/shared/performance-new/recording-utils.sys.mjs#L16).
  Mozilla explicitly documents that even its native BiDi `activeContext`
  argument does not restrict profiling to that tab.
  [Official profiler module documentation](https://firefox-source-docs.mozilla.org/remote/webdriver-bidi/Extensions.html#moz-profiler-start).
- **Browsing contexts:** no browsing-context allowlist or process/thread fields
  exist on public WebChannel start requests, because there are no such start
  requests. Selecting an active-tab view, hiding tracks, or sanitizing an
  exported file cannot retroactively make collection tab-exclusive.

The native profiler is part of the running Firefox instance and its child
process family, not a default system-wide sampler of other applications.
However, the same Firefox/Zen profile can contain personal windows and shared
browser/compositor processes. Vawzen's assigned-window boundary does not
propagate into this service. No broad profile is authorized by this report.
[Profiler lifecycle and multiprocess design](https://firefox-source-docs.mozilla.org/tools/profiler/code-overview.html#multi-process-profiling).

For the causal question, JS plus native stacks and layout, paint, graphics, and
GC markers are useful. The upstream graphics preset includes `js`/`stackwalk` and threads such
as `GeckoMain`, `Compositor`, `Renderer`, `RenderBackend`, `SceneBuilder`, and
`WrWorker`; Firefox Platform also enables native stacks. Web Developer omits
`stackwalk`. Feature support must be checked for the actual build. These are
candidate settings for a later authorized capture, not PID-scoped defaults.
Native graphics stacks/markers can reveal waits; they do not promise hardware
GPU execution timing or presented FPS.
[Preset definitions](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/shared/performance-new/prefs-presets.sys.mjs#L47),
[sampling and markers](https://firefox-source-docs.mozilla.org/tools/profiler/code-overview.html#profiler-lifecycle).

## Local export and surface behavior

Loading the official profiler website **does not automatically upload a
profile**. Mozilla documents that captured data remains local until the user
chooses upload. The website itself must be downloaded, so local profile handling
does not mean zero network traffic.
[Official capture/save guide](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/docs-user/guide-getting-started.md#capture-a-profile).

The viewer has a local **Save / Save Performance Profile** path. Current source
uses a Blob download with a `.gz` suffix, separate from the Share/Upload action.
Its encoded file is JSON compressed with gzip; it can be decompressed locally
without publishing. Download sanitization choices affect the saved artifact.
Keep the capture settings and sanitization choices with any evidence.
[Local download implementation](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/src/components/app/MenuButtons/Publish.tsx#L461),
[JSON encoding and separate upload action](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/src/actions/publish.ts#L283).

Current native capture transport produces a gzipped `ArrayBuffer`, whereas
older frontend contracts also permit a profile object. A Vawzen JSON result
round-trip does not preserve raw `ArrayBuffer` bytes. Thus returning a profile
buffer directly from `evaluate_script` is not a proven file-extraction route.
This transport limitation is secondary to the missing capture operation.
[Native capture serialization](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/shared/performance-new/recording-utils.sys.mjs#L49).

The ordinary native Capture operation opens a **new viewer tab**; it does not
reuse an existing manually loaded viewer. The implementation selects the most
recent browser window and requests a non-private tab; an all-private session
can even cause a non-private window to open. Consequently the standard capture
flow fails the current no-new-surfaces restriction even if a user starts it.
[Viewer-opening implementation](https://github.com/mozilla-firefox/firefox/blob/309a5a01511293cd91f86d82c9c2f7130dd38ebc/devtools/client/performance-new/shared/browser.js#L45).

Local saving also does not establish that all analysis is network-free:
symbol/source lookup is a separate concern. Raw local export can precede any
later decision about symbolication. Do not select Share/Upload or send the
profile to a service. This research fetched only public documentation/source.

## Why the provided bridge cannot perform the fallback

The supplied `/assistant/mcp/firefox/` directory does not exist. Bounded local
discovery located the Firefox implementation under
`/home/jarvis/Documents/dev/assistant/mcp/zen-mcp/`:

- `README.md:63–79` describes a shared profile with window-scoped automation and
  disabled native OS input.
- `firefox-extension/manifest.json` has no native-profiler permission or API.
- `firefox-extension/message-handler.ts:1330–1445` implements page/main or
  isolated-world evaluation; Firefox rejects its Chrome-only CDP engine.
  Main-world injection is subject to CSP and returns JSON through a DOM
  attribute. It does not run browser-chrome code.
- `firefox-extension/injected/page-world.ts:1–20,91–155` documents that JSON
  return mechanism.
- `mcp-server/url-policy.ts` accepts HTTPS and loopback HTTP navigation, not
  `about:profiling`. Using a page-evaluation navigation trick to evade that
  policy is not a supported fallback.

The available Vawzen catalog has no native profiler/trace tool. Page-dispatched
keyboard events cannot invoke browser-chrome profiler shortcuts. Native HTTP
fetch is not an authenticated Firefox DevTools/Remote Agent session. Mozilla's
separate native BiDi profiler module can save to a local path, but no such
connection is supplied or established here; it still documents global sampling.
It is not a hidden capability of `browser_fetch`.
[Official native BiDi stop behavior](https://firefox-source-docs.mozilla.org/remote/webdriver-bidi/Extensions.html#moz-profiler-stop).

No plugin patch, new extension, debugger setup, browser restart, preference edit,
OS input, endpoint discovery, or privileged-console workaround was attempted.

## Minimum next step for root

With the present restrictions unchanged: **stop at this capability boundary**.
An already available locally saved native profile would be sufficient input
for offline analysis, but no such file is claimed to exist.

If the user permits a manual native capture, the minimum practical sequence
when native stacks and the agreed scope are already configured is:

1. The user focuses the assigned source or localhost target and starts recording
   with native `Ctrl+Shift+1` (or the toolbar's Start Recording control).
2. Reproduce only the agreed optical/footer span, then use native
   `Ctrl+Shift+2` to capture. This opens the native viewer tab. Using
   `Ctrl+Shift+1` a second time instead discards the recording.
3. In that viewer choose local Save/Save Performance Profile, then Save; keep
   the downloaded file locally. Do not choose Share/Upload. Repeat separately
   for the other target if authorized.

These shortcuts and the save workflow are documented in the
[official getting-started guide](https://github.com/firefox-devtools/profiler/blob/de9b76abb5570010e6c9aa801f0a2ae020cd8d6f/docs-user/guide-getting-started.md#using-keyboard-shortcuts).
If not already configured, enabling the profiler toolbar and choosing recording
settings are additional user UI actions; neither was done here.

**Before that sequence, root needs a decision permitting the native-created
viewer tab and the actual capture scope.** A normal preset may collect activity
from other windows in this Firefox profile. Merely foregrounding the assigned
target or selecting active-tab view is insufficient consent for that broader
collection. If strict assigned-page-only collection remains mandatory, the
manual sequence is also blocked: a verified scoped native capability or a
different explicit scope agreement is needed. PID-only filtering can reduce
scope, but shared graphics/browser processes prevent a blanket promise of
tab-exclusive data. Do not default to a browser-wide profile.

## Source and verification limits

Official upstream source was pinned to Firefox
`309a5a01511293cd91f86d82c9c2f7130dd38ebc` (2026-10-27) and Profiler
`de9b76abb5570010e6c9aa801f0a2ae020cd8d6f` (2026-10-22). Downloaded source,
revision metadata, and URL manifest are in `/tmp/gazzar-profiler-r18/`.
The running Zen/Firefox version, patches, profiler state, toolbar availability,
permissions, and actual native export behavior were deliberately not queried.
This is source-backed feasibility research, not a live capture or parity result.
