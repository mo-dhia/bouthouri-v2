# HOME adversarial review — round 7

Date: 2026-10-27, approximately 04:43–05:15 UTC. **Changes requested: one new P2 remains.** The two original R6 findings, the additional late-reload startup race, and the requested complete-CLARITY controls pass in frozen production **9a5dd77**. A separate bounds/direct-sculpture/return history produces a repeatable optical difference. This is bounded production acceptance of the listed triggers, not full HOME parity acceptance.

Reviewed plain `https://www.thisisgazzar.com/en` / `/ar` against `http://localhost:3100/en` / `/ar`. Checkout HEAD at entry was `48a2ed0`, a documentation-only descendant of the frozen implementation. No implementation edits, tests/checks, build/typegen/install, commits, server operations or process management were performed. Only this report and temporary evidence under `/tmp/gazzar-home-review-r7/` were written. The parent's reported lint, Next typegen, TypeScript, 85 tests / 3,228 assertions, production build and SSR audit remain attributed parent evidence.

Only the exclusively loaned Vaelix source **175555005** and local **175555011** in window **175554986** were used. No windows, tabs, iframes or replacement surfaces were created. The two unrelated original tabs were untouched. Vaelix's navigation helper initially only activated the existing development tab; explicit `location.assign('http://localhost:3100/en')` then established production before any acceptance test.

## Confirmed finding

### R7-01 · P2 — A hidden-entry, bounds-change and direct-sculpture history returns to a darker optical field

**Scope/state:** ordinary EN HOME, empty search/hash, motion enabled, menu closed, audio QUIET, actual **1912×1009 CSS px / DPR1**. The object canvas backing and CSS dimensions are 1912×1009 at the comparison frames. This differs from the now-passing R6 foreground completed-40 reload trigger. It also does not assert that every fresh document must use the sharp field.

**Reproduction, repeated in two independent source/local document pairs:**

1. Assign plain `/en` in the existing foreground tab. Wait for the visible ready choices. Select QUIET through trusted Vaelix `chrome_computer` double-click, immediately activate the other existing task tab for four seconds, then reactivate this tab and immediately seek native **y5263 / score40**. Allow entry and the visible scene to finish. Both pages have the sharp reflection field. No cold renderer wrapper or conversion probe is installed.
2. Dispatch a same-size window `resize`, wait at least 650ms, and capture after settling. The field stays sharp in both. This camera-refresh history is intentionally retained on both sides.
3. Set the existing `.canvas-layer` inline width to `calc(100% - 2px)`, dispatch `resize`, and immediately seek native **y11817 / score174**. Wait one second. The measured object canvas is now **1910×1009** while the viewport remains 1912×1009. This exercises active sculpture rendering with a bounds measurement pending.
4. Restore the host's original width declaration, dispatch `resize`, wait one second, then reverse to **y5263 / source40.00 / production40.0008**, opening26. In the controlled repeat, explicitly send the neutral pointer to (0,0) after arrival and allow another1.9s to settle. Both canvases have returned to1912×1009, entry is complete, and no return intent is pending.

**Expected/actual:** source returns to its broad charcoal lens field. Production returns to a substantially darker field with different reflected gradients and rim treatment. The discrepancy survives foreground reactivation and further settled traversal. Original model placement, caption, native position and source score agree; this is not a hidden stale PNG, padding comparison, incomplete entry, old missing-C symptom, or comparison of foreground and hidden entry histories.

The primary optical crop is **(200,180)–(1500,800)**, 8-bit RGB:

| Matched history/frame | MAE | p99 absolute error |
| --- | ---: | ---: |
| First bounds/direct174/reverse40 run | 3.3906 | 15 |
| Independent repeat, explicit neutral pointer, reverse40 | 3.6343 | 22 |
| Continue that repeat to60 / y6635 | 3.4579 | 14 |
| Continue to67 / y7115 | 4.7157 | 7 |
| Continue to71 / y7390 | .1773 | 1 |

The repeat's same-history sharp40 control has MAE.4412/p99=11. The source and local capture order is serialized, with each tab activated and allowed to paint. No screenshots were taken during a duration trace.

Read-only uniforms from the existing object contexts distinguish the continuing60/67 difference from the separate camera-history concern. At60, camera Z is **3.8948863 source / 3.8948750 production**; at67 it is **1.6776109 / 1.6775703**. Projection matrices, transmission, roughness, IOR and exposure agree to float/source-score precision. Model/view matrices at60 are likewise nearly identical. The small idle-dependent rotation variation at40 does not explain the continuing near-identical-camera60/67 mismatch. These measurements support material/cache sequencing ownership; they do not establish its exact internal cause.

**Document/entry provenance:**

| Run | Source timeOrigin / entry ID | Production timeOrigin / entry ID |
| --- | --- | --- |
| First | 1793077163621.5 / `025ea5cd-b12b-4139-8e3a-2aae93cda284` | 1793077212581.8 / `642c9d85-6d6f-4995-88a3-11580cf2eda0` |
| Repeat | 1793077526711.5 / `ba411ded-7567-49f0-8f4b-f8d4d1f36e24` | 1793077588990.6 / `b6d49dee-8817-43ab-bdd5-6b4f7a172810` |

**Likely ownership:** `2-story/story-scene.animate.ts`, `story-environment-lifecycle.ts` and `story-assets.ts`, specifically the actual256/512 capture/conversion order during a changed-bounds direct sculpture frame and the later glasses return. The already-active guard does not suppress the observed1910/1912 measurements, but its presence and passing foreground reload crops do not close this additional branch. Do not retune the universal lens constants or replace the separate camera-history adapter on this evidence alone.

The exploratory `guard-final-existing-atlas-read-*` records read the currently bound texture unit through a temporary read framebuffer, without an extra draw or conversion. They differ, but the local bound texture's identity/full dimensions were not established; **they are not presented as a verified local glasses-atlas hash**. Renderer-owned256/512 conversion tracing remains unresolved and belongs to the scene owner. The finding rests on repeated settled images and the matched camera controls.

**Evidence:** `active-studio-*-restored40`, `guard-repeat-*-sharp40`, `guard-repeat-*-noop40`, `guard-repeat-*-width1910-active174`, `guard-repeat-*-broad40`, `guard-final-*-40`, and `guard-cross-*` in the canonical index. Primary pairs: `active-studio-restored40-pair.png`, `guard-repeat-broad-pair.png`, `guard-cross-60-pair.png`; metrics: `checkpoint-metrics.json`, `guard-repeat-metrics.json`, `guard-cross-metrics.json`. Source is above production in those vertical pairs. The parent acknowledged retaining this finding before release; implementation remains frozen throughout this review.

## Requested regression acceptance

### R6-01 foreground reload and the late native-replay race pass

Both pages were exercised through complete QUIET entry, direct174, reading→motion remount, settled174, native40, a650ms wait, and ordinary `location.reload()`. After load and a further2.5s explicit wait, both remain **y0/story0/opening0/world0**, hero `ready`, scene ready, awaiting entry, with `history.scrollRestoration='manual'` and no pending return records. A second completed QUIET→40→reload control also passes. Later real scrolling and ordinary mode toggles work; no repeat reset is observed.

| Reload control | Source origin; sample now / load end, ms | Production origin; sample now / load end, ms |
| --- | --- | --- |
| After174/mode remount/174/40 | 1793076453266.9; 9140.3 /506.1 | 1793076330200.2; 9448.6 /406.6 |
| Second completed40 reload | 1793076475089.3; 7674.7 /407.5 | 1793076358938.5; 6138.8 /399.1 |

Complete the new entry in the foreground, wait four seconds before moving, then traverse40→60→67→71 without a resize. The source and production both select the broad field. Optical crop MAEs are **.5298/.3182/.0439/.0195**, p99 **8/2/1/1**. This independently closes the original R6-01 completed-journey reload mismatch for that lifecycle. The hidden-entry control separately produces sharp reflections in both, including after entry finishes; it is not treated as a contradictory fresh-navigation policy.

The separate same-size40 camera-refresh sequence also agrees at60/67/71, crop MAEs **.00695/.00018/.01610**, p99≤1. Same-size bounds do not force the sharp field broad. Actual bounds/direct-sculpture history remains blocked by R7-01 above.

### R6-02 pristine semantic HOME return and fresh-cleared pixel fallback pass separately

**Pristine branch:** fresh ordinary EN wide, trusted QUIET,312/y16362 → visible persistent `/ar` link → fully settled ARwide312 → Vaelix emulated392×865 → ARnarrow312/y12091 → footer714/y21772 → Back once. Source returns EN **y12091/311.99**, production **y12091/311.9949**, visibly Wujhat. Forward returns AR **y21772/714** in both. The outgoing EN generic HOME record remains in AR and disappears on matching Back. No extra same-URL AR activation/navigation is inserted.

Source's EN/back origins are1793076864437.7/1793076910865.5; production keeps1793076925040.3 through the Next soft traversal, with EN ID`b3b966d7-f24d-4e0b-8460-c6881b73d397`. Source reports `back_forward`; production's Performance type stays `navigate`. That difference is expected for the different routers and does not override the observed restored position.

**Separate cleared branch:** new EN312 wide → visible AR locale → narrow restored mount → ordinary fresh AR reload. Both clear pending HOME/locale records and await entry at0. Explicitly complete QUIET and revisit ARfooter714 before Back, so Forward's checkpoint is unambiguous. Back now selects EN **y16362/source489.35/production489.3488**; Forward returns AR **21772/714**. It does not replace the pristine branch's semantic restoration.

Cleared-branch source EN/reloaded-AR/Back origins are1793076978167.6/1793077012986.4/1793077047641.3. Production EN origin1793077060824.7 becomes1793077098351 on ARreload and stays there on its soft Back. EN entry IDs are source`c4082c87-c7ae-4dca-9bb0-420b8b684241` and production`765dfd23-ad3c-4cc8-8ded-03bae4d89980`.

The fully settled `ar-visual-*` series separately rechecks the restored anchor: wide312/y16362 ↔ narrow312/y12091; laterfooter714 survives same-size resize/ready and irrelevant temporary style/data changes; footer→reading reaches **3827** in document9406; motion returns **12091/312**. Fresh ordinary EN580→reading clamps to **11437** in document12446; motion retains11437/source162.47/production162.4688. Keeping manual document restoration does not reset that later real offset. Actual browser BFCache was not independently induced.

### Complete CLARITY cold/remount controls pass

Direct cold174 and reading→motion remount→174 both show complete **CLARITY** in production, with one object canvas and matching1912×1009/native11817/score174.0071. The matching cold/remount source controls are complete too. `clarity-controls.png` contains source cold, source remount and production remount title crops; the first production cold full PNG is separately indexed.

An initial foreground174 comparison had unlike pointer state. Explicit pointer placement at(0,0) **after the object is visible**, plus2.5s settling, gives `stable174-*` crop MAE **.0993/p99=1** with complete title and support. The reverse128 control gives MAE.0435/p99=1. The earlier larger sculpture crop errors are superseded by these controls, not treated as new geometry findings or broad all-glyph certification.

## Independent bounded acceptance matrix

| Area | R7 result | Evidence and boundary |
| --- | --- | --- |
| Ordinary entry/reload/manual policy | **Pass at both exact reload triggers** | Values, document changes and post-load waits above. No query/hash or pending return in these documents. |
| Foreground/hidden optical lifecycle | **Original R6 trigger passes; R7-01 blocks additional bounds history** | Matched broad foreground and sharp hidden controls. Actual same-size and2px controls kept distinct. No universal field policy or atlas equality claim. |
| CLARITY174 / sculpture128 | **Pass at controlled settled samples** | Cold/remount title complete; pointer-matched174 and reverse128 close. No clone-specific reproducible missing-C defect found. |
| EN integrated journey | **Pass at sampled checkpoints outside R7-01** | Hero→40/60/67/71→128/174→Ideas265/280→work308/312/349/385/417→systems580→footer714, then reverse work/280/174/128/40/0. Native score/opening and rendered stages agree at recorded checkpoints. |
| Ideas / four projects / systems | **Pass at sampled compositions** | Integrated265/280/349/385/417/580/714 crops have MAE.20/.089/.080/.077/.093/.106/.093; p99≤2. The312 source frame had emphasis engaged and is not a neutral-pixel oracle. Original HOME destinations retained; destination-page parity is later scope. |
| Work draw/focus/hover gates | **Pass at actual-handler checks** | Nominal308 draw.8502 rejects emphasis. Completed312/349/385/417 draw1 accepts hover/focus; only the corresponding section is non-inert/tab0. Others inert/tab−1. Handlers were dispatched; this does not certify physical hover travel on every stroke. |
| Pristine HOME Back / cleared fallback / Forward | **Pass as distinct histories** |312 versus489.35 Back branches independently observed; both Forward714. URL, record and document evidence above. |
| Restored resize/mode/no-op lifetime | **Pass in the confirmed AR series** | Full wide↔narrow reverse geometry, laterfooter no-op hold,3827 reading→12091/312 motion. |
| Fresh ordinary clamped mode | **Pass** | EN580→reading11437→motion11437/162.47 in both, manual policy retained. |
| Menu closing | **Pass at full-open actual Close** | Source668.2ms /production668.8ms modal/lock removal, closing phase retained until completion, invoking focus restored, native offset unchanged29601. R6 interruption/reopen and under-modal scalar settling evidence retained, not newly recertified. |
| Footer keyboard/thought/reverse | **Resolve and settled state pass; timing variance retained** | Trusted Enter reaches resolving→to-logo→logo and original Perspective thought; trusted Escape returns word. EN/AR thought content agrees. See timing qualification below; R6 drag/counter clipping baseline is attributed and retained. |
| AR392×865 visual smoke | **Pass at sampled CSS area** | Hero,128/y7660,280/11321,312/12091,580/18545,footer21772 and localized thought captured.128/280/312/580 crop p99=1; thought p99=0. Hero marquee/portrait phase and the live Cairo minute differ naturally. |
| Reading geometry / Arabic typography | **Pass at sampled geometry** | AR document9406; principles2681.5/h726.296875, outlook3407.796875/h354.671875, work3866.265625/h2529.265625, footer8644.53125, information8724.53125/h195.3125, relative80. Cairo450 and paragraph margins16.32px match. EN reading extent12446 independently repeated; detailed EN section-top baseline remains R6 evidence. |
| SSR/no-JS/failure/audio/COPY | **Attributed prior/root evidence** | No new network failure, no-JS surface, audio enable or clipboard test. Parent's current production audit/checks and R1–R6/root failure, sound and COPY evidence remain attributed. Audio remainsOFF throughout this review. |

**Footer timing qualification:** the source distinct trusted Enter sample resolves at8.1ms, starts to-logo224.7ms and reaches logo2470.7ms; production preserves the resolve but reaches logo2637.6ms in that run. Production handler repeats reach2511.2ms and2728.8ms. A clean document control gives source2471.5ms /production2514.8ms; source reverse2925.2ms /production3038.4ms. A lightweight temporary RAF observer records no source gaps above50ms, while the production run has99.9/58.2/174.7ms gaps. Inspection of the previously captured public `FooterLogoMode.advance` establishes that **source also clamps dt to50ms**, like production. Consequently this is retained runtime/frame-load variance, not a new authored-duration or missing-resolve finding. It prevents an exact all-run wall-time certification. RAF spacing is not proof of presented FPS, GPU cost, or the cause of those stalls. The probe was cancelled and removed.

## Evidence index and exclusions

Canonical raw tool/state index: **`/tmp/gazzar-home-review-r7/evidence.json`**,295 labeled records. `acceptance-index.json` decodes the nested Vaelix results.94 original PNGs are copied under `screenshots/`; original downloads remain in Downloads. Images/crops and JSON are temporary evidence, not application assets.

| Evidence group | Files / labels |
| --- | --- |
| New P2 | `guard-repeat-broad-pair.png`, `guard-cross-60-pair.png`, `guard-repeat-metrics.json`, `guard-cross-metrics.json`; `active-studio-*`, `guard-repeat-*`, `guard-final-*`, `guard-cross-*` |
| Reload fix / foreground optical | `race-remount-*`, `second-completed40-*`, `foreground-reload-*`, `foreground-reload-40-pair.png`, `foreground-metrics.json` |
| Sharp/no-op / separate camera history | `hidden-tail-*`, `no-op-*`, `checkpoint-metrics.json` |
| Title / sculpture | `cold-production-174-image`, `cold-source-174*`, `*-motion-remount-174*`, `remount-production-174-image`, `clarity-controls.png`, `stable174-*`, `stable174-pair.png`, `reverse-*-128*` |
| Return branches | `pristine-*`, `fallback-*`; Back PNGs show Wujhat versus the intentionally different cleared-fallback systems state |
| EN integration / gates | `integrated-*`, `gate-*`, `reverse-*`, `checkpoint-metrics.json` |
| AR / reading / restored lifetime | `ar-visual-*`, `ar-thought-*`, `ar-restored-*-confirmed`, `ar-reading-*-geometry`, `restored-reverse-resize-*`, `ordinary-*`; `ar-css-*-pair.png`, `ar-css-metrics.json` |
| Menu/footer temporal controls | `menu-close-*`, `footer-distinct-*`, `footer-production-handler-repeat-controls`, `footer-clean-*-fps` |
| Final handoff | `release.json`, `release-*`, `release-inventory-final-browser-call` |

The initial source locale call raced navigation, and one early fallback `ar312-wide` snapshot had no hydrated root. It is **not accepted as a settled wide312 capture**. The pristine sequence and later `ar-visual-source-wide312` record independently verify fully ready/route-idle wide312 before resizing. The cleared fallback result itself was measured after the new ready0 AR document, fresh QUIET, footer and Back/Forward.

`restored-production-no-op-footer` is a failed diagnostic attempt: a temporary script redeclared `r`, so no part of that call executed. It is excluded. The later `ar-restored-production-no-op-footer-confirmed` and matching source test successfully repeat footer hold, irrelevant style/data changes, reading and motion from the correct laterfooter position.

The first footer observer recorded repeated same-value `data-mode` writes and was sanitized/truncated. `footer-enter-source` / `footer-reverse-source` are not duration oracles. The subsequent distinct-mode traces and clean RAF controls supersede them. No screenshot call occurs inside their exact phase measurement interval.

A stable phase/data snapshot alone does not prove every glyph was painted. Previously observed source partial glyph/compositor damage is not intended design. R7's explicit complete-title controls pass; occasional partial shell/body pixels and unlike pointer captures are excluded from typography-defect claims. The source312 emphasis frame is not compared as an unhovered local pixel match. Clock/minute, marquee, portrait and accumulated pressure-field phases are not synchronized pixel targets.

Responsive captures use the actual measured **emulated desktop narrow**392×865/DPR1 viewport. Vaelix `resize_page` attempts CDP device metrics before native-window fallback; no physical-phone or OS-native resize path was established. Narrow metrics and pairs explicitly crop **(0,0)–(392,865)**, excluding larger physical screenshot padding. No clear-emulation API is exposed; final metrics are restored to the original1912×1009, not claimed to have cleared device emulation.

No renderer method wrappers, public runtime-module injection, extra GL draws or PMREM conversions were installed to manufacture cache evidence. Read-only uniforms and the exploratory already-bound texture read occurred after the visible failure, with framebuffer/active-texture state restored and temporary objects/buffers released. They do not replace the missing exact conversion-order trace.

## Practical limits and unresolved objections

One concrete P2 remains: R7-01. Its exact256/512 cache conversion order is unresolved. Owner investigation and a fresh independent production review must preserve the passing foreground/hidden entry controls, ordinary/no-op camera histories and HOME-return branches while closing this additional sequence.

Physical touch/coarse-pointer hardware, DPR2, mobile browser bars/safe areas, other GPUs/browsers, every breakpoint, audible balance, physical/native key defaults, actual GPU loss, denied storage, actual BFCache, exhaustive resource accounting and continuous frame-for-frame motion were not independently certified. Record expiry/future/mismatch handling retains unit/prior evidence, not forged browser time/storage testing. HOME only is reviewed; case/vision/services/contact destination pages remain later scope. Numeric/build/SSR successes do not establish universal or continuous pixel identity.

## Handoff

**Browser ownership explicitly RELEASED at approximately05:14:55UTC, with no pending calls and no further R7 browser calls.** Source175555005 remains `https://www.thisisgazzar.com/en`; local175555011 remains `http://localhost:3100/en`, active, both in original window175554986. Final measurements:1912×1009 CSS px/DPR1, nativey0/story0/opening0/world0, entrycomplete, motionenabled, menusclosed, heldfalse, audio preference`quiet` and Enable sound controlsfalse. Temporary observers/listeners/RAF probes/globals, irrelevant attributes/styles and canvas width overrides are removed; both audit-global inventories are empty and iframe counts0. Final inventory remains one window/four original tabs. The parent received explicit release and owns subsequent browser work, implementation, validation, commits and servers.
