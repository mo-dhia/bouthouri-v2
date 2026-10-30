# 360° Tour adversarial review — 2026-10-30

The user requested independent subagent review and testing of the deployed EN
tour at `https://bouthouri.vercel.app/en/projects/360-tour`. Three independent
reviewers challenged lifecycle correctness, UI/route integration, and live
desktop/touch/mobile behavior. All used the same Codex model/options as the
parent. The parent separately exercised the public page in the connected browser
and reproduced failures with isolated Chromium probes.

## Confirmed baseline findings and repairs

1. **P2: white loading stage.** Holding the player script let the iframe cover the
   poster. The poster now paints above the viewer until first presentation, with
   loading controls above both. The loading frame is inert and excluded from Tab.
2. **P2: native keyboard activation and focus.** Vendor handlers cancel keyup
   defaults and all fullscreen keydown defaults. Capture-phase arbitration now
   preserves hotspot Space/Enter and Tab/Shift+Tab. SVG activation remains explicit.
3. **P2: false success after failed tiles.** The vendor counts failed images as
   complete. Readiness now requires decoded base images; current-room tile errors
   fail immediately. Each room owns its readiness/watchdog and retry path.
4. **P2: rotation during reduced loading.** Startup configuration now disables
   autorotation before loading; the host enables it only after eligible readiness.
5. **P2: gyro movement behind MENU.** Input locks did not cover gyro events. The
   adapter now gates them while parked, retaining selection and recalibrating on
   resume.
6. **P2: parked update/recovery loops.** The player previously emitted about 60
   timer callbacks/second behind MENU. The adapter now drains both owners and
   restarts each only if it drained, including rapid park/resume transitions.
7. **P2: cold mobile timeout.** Same-resolution MozJPEG encoding reduces tiles by
   69.7%, and the initial view stays still while loading instead of requesting
   additional directions during rotation.
8. **P2: keyboard return viewpoints.** The player records arrow codes but does not
   apply them to the camera. Finite arrow steps and native repeats provide the
   missing look-around path in normal and reduced motion.
9. **P3: landscape controls clipped.** The control group is raised only when its
   visible controls would extend beyond a short viewport.
10. **P2, repair review: stale requests block a new room.** The vendor's global
    loading flag included previous rooms. Pending image accounting now belongs to
    the current generation; old requests cannot prevent current readiness.
11. **P2, repair review: parking consumes the watchdog.** Polling and the remaining
    active loading budget now pause while hidden, offscreen or behind MENU. An
    intentional pause cannot cause a false loading timeout.
12. **P2, final race review: outgoing snapshot ownership.** The vendor renders an
    outgoing snapshot after announcing `beforechangenode`. Requests created while
    `K.Uh` marks that snapshot are excluded from destination pending/error
    ownership, even when they finish after the flag resets.

The iframe document also receives EN/AR language metadata. Duplicate mobile CSS
panel declarations were removed while preserving its final layout.

## Evidence after repair

Root-owned probes are retained under ignored `.artifacts/tour-review-r1/root/`.
Independent initial reports are under `.artifacts/tour-review-r1/live/` and
reviewer-owned `/tmp/tour-review-r1-lifecycle/` paths. These ignored artifacts
are local evidence, not deployment requirements.

- Held-script pixel check: the sampled poster pixel remained `[140,113,99]`
  before and during loading; the loading browsing context was inert.
- Real-player keyboard loop: node1 → node2 with Space, → node3 with Enter,
  → node1 with Space; fullscreen Tab/Shift+Tab, keyboard zoom and arrow tap.
- Parked real player: zero timer callbacks over the sample, zero camera change
  and zero orientation-state change after simulated sensor events; gyro selection
  remained enabled and updates resumed afterward. This is an ownership check,
  not a presented-frame FPS certification.
- Blocking initial tiles and blocking node2 tiles both returned to the localized
  retry poster after a bounded batch (six initial, two room requests in the final
  run), with no retained iframe. Unblock/retry
  succeeded in both cases. Previous behavior emitted more than 100 failed requests
  while showing a black viewer as live.
- At 915×412, the iframe height was 193 CSS pixels and the bottom of the visible
  controls was 178.70, fully inside it.
- Cold 412×915/DPR3, cache disabled, 1.6 Mb/s download, 150 ms latency and 4× CPU:
  local production tour readiness with normal motion took 14.046 s EN and
  10.298 s AR; reduced-motion runs took 10.204 s and 9.573 s. The baseline
  public deployment timed out at about 45 seconds in both locales.

Final validation passed 469 tests, lint, type checking, the architecture audit,
the production build and bilingual HTTP SSR/asset audit. Separate repair-review
rounds challenged the actual player adapter, keyboard ownership, loading layers
and responsive controls.

The additional race probes confirmed that node2 became ready while an old node1
request was still held; its later error did not fail node2. Parking a loading
tour behind MENU for 47.158 seconds preserved the iframe and loading state, then
resumed successfully. The final snapshot-specific static review found no
remaining P1/P2 within that scope. Its adapter SHA-256 was
`4eabc25a781ea5123b4146070416805311f0783f1640f26c04992d1827f1d37c`.
The final browser reproduction held an actual outgoing snapshot request: node2
became ready while the vendor's global loading flag remained true, and aborting
that outgoing request left node2 live. The clean-server regression matrix passed.

The independent UI repair review passed loading layers/inertness, keyboard room
navigation, fullscreen focus, Arabic landscape and route cleanup. It identified
a stale local server during rebuilding; the parent therefore reran the final
matrix against a freshly started, unmodified production server on port 3213.

## Limits

Connected-browser testing and isolated headless Chromium are covered. Physical
phone sensors, Safari/iOS behavior, real WebXR hardware and spoken screen-reader
output were not tested. Sensor events in the parking regression were simulated.
Cold browser contexts and numerical throttling do not guarantee a cold CDN or
represent every connection/device.
