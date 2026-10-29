# LAN development repair — independent source review R12

Reviewed 2026-10-29. **No confirmed P1/P2 findings. No app changes made or
requested by this review.** Scope is the startup-capability and development
allowlist repair for `http://192.168.1.105:3000/en`; Projects is excluded.

- [`navigation-id.ts`](../src/lib/navigation/navigation-id.ts), lines 2–7,
  calls `getRandomValues` on its supplied Crypto receiver with a 16-byte
  `Uint8Array`. The version/variant masks produce the same lowercase UUIDv4
  string shape as before. These IDs correlate history entries. The helper has
  no import-time browser access, side effects, dependency or clock.
- All three production creation sites are replaced: HOME initial mount and
  new traversal (`home-navigation.ts:227,434`), and editorial identification
  (`route-surface.animate.ts:82`). Existing valid IDs retain their short-circuit
  reuse. Editorial pushes retain fresh-ID creation at verified owner commit;
  HOME identity ownership stays separate. History keys, state merging, saved
  checkpoints, retained restoration phase, selection/owner guards and native
  write boundaries are unchanged. Localhost/HTTPS retain the existing identity
  shape and restoration contract; insecure HTTP no longer needs `randomUUID`.
- [`next.config.ts`](../next.config.ts), line 5, parses explicit comma-separated
  hostnames, trims whitespace and removes empty entries; unset/empty values
  add no origins. No wildcard is introduced. Installed Next **16.4.3**
  `allowedDevOrigins` documentation and `block-cross-site-dev.js` confirm
  hostname-only matching and retained localhost/start-host allowances.
  `router-server.js:741` applies this guard to development WebSocket upgrades.
  This addresses dev authorization separately from history-ID startup.
- The installed environment-variable guide and `server/config.js:1263`
  confirm env loading before config evaluation. `.env.development.local` is
  development-specific, with existing `process.env` taking precedence;
  `.env.example:2–4` correctly documents hostnames without scheme/port. The
  config is evaluated when Next starts, so changed settings require restart.
  `.gitignore` excludes local env files. Their values were not read; the
  parent's supplied single-host configuration is attributed to the parent.
- The mounted regressions remove `randomUUID` while retaining `getRandomValues`:
  HOME covers initial identity, a newly unidentified traversal and retained
  Next state; editorial covers direct arrival and a fresh soft-navigation ID.
  The editorial fixture simulates the missing API on its existing HTTPS test
  origin; it is a capability regression, not an HTTP browser/network test.

Read `AGENTS.md`, loading/splitting/viewport guides, HOME navigation and editorial
handoff contracts, and the current RouteSurface contract. Reviewed input hashes
are retained in
[`reviewed-inputs.sha256`](../.artifacts/pages-parity-20261029/lan-runtime-review-r12/reviewed-inputs.sha256).

The parent's retained before-fix log shows both mounted tests failing with the
actual `randomUUID` TypeError; its after-fix log reports **100 pass, 0 fail,
1,893 assertions**. Those logs were read, not rerun. The parent independently
reports the exact LAN URL in Firefox, WebSocket status 101 after configuration,
enhanced hero/journey readiness and an open menu dialog at opacity 1 while
`isSecureContext` remains false and `randomUUID` absent. Those are parent-owned
functional probes. The user's Arc/macOS machine was not remotely controlled.

This pass used source/log reads only and wrote this note plus its ignored hash
manifest. No browser, server, tests, lint, types, build, package or git mutation
was performed. Full check/build/SSR/browser validation and general documentation
updates remain parent-owned. This review does not certify full visual parity or
reopen prior clock/reachability findings.
