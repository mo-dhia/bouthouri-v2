# Development over the local network

Set explicit development hostnames in the ignored `.env.development.local`:

```dotenv
DEV_ALLOWED_ORIGINS=192.168.1.105
```

Replace that example with the machine's actual hostname/IP. Multiple entries are
comma-separated hostnames, without scheme, port or path. Restart `bun dev` after
changing them. `next.config.ts` passes the trimmed list to Next's
`allowedDevOrigins`; an empty setting adds no hosts or wildcard. This setting
affects development endpoints, not production route authorization.

Next 16.4.3 allows localhost and its configured start hostname automatically.
Listening on `0.0.0.0` does not authorize every hostname clients use. In the
reported LAN failure, normal page/script requests returned 200, but the dev
WebSocket upgrade returned `Unauthorized`. Localhost returned 101. The resulting
LAN document stayed at static server content: MENU did not open and HOME did
not attach its animation controllers. The explicit hostname setting restores
the LAN WebSocket upgrade to 101.

## Plain HTTP and navigation identity

Browsers treat HTTP localhost as a secure context, but ordinary HTTP LAN origins
are insecure contexts. `crypto.randomUUID()` is absent there. HOME and editorial
navigation previously called it without a capability check, providing another
startup/navigation failure once controllers executed.

`createNavigationId(crypto)` now uses `getRandomValues`, which is available in
that environment, to generate the same UUIDv4 string format. These IDs correlate
history entries; they are not credentials. Existing IDs, checkpoint storage,
ownership, restoration, clocks and visual geometry are unchanged. No global
polyfill or HTTPS-only dependency was added.

The existing portrait-brightness restoration in commit `21d4caf` is retained.
It is separate from this repair; no CSS or authored animation was changed here.

## Verification of the repair

The two mounted-controller regressions failed with the actual missing-method
TypeError before the repair. Afterward, the full HOME/route-surface suites passed
100 tests / 1,893 assertions, including fresh identities and soft navigation
without `randomUUID`. The complete check passed 378 tests / 15,758 assertions,
lint, route types, TypeScript and architecture; production build and SSR/20-asset
audit also passed.

The exact LAN URL was exercised in the assigned Firefox/Zen browser with
`isSecureContext=false` and `randomUUID` absent. MENU opens/closes; native wheels
advance and reverse the portrait/glasses journey; MENU navigation reaches Vision
with a valid new history identity and a rendered hero. This verifies the LAN
conditions locally. The user subsequently confirmed that both MENU and scroll
animations work after reloading the same LAN URL in Arc/macOS. That machine was
not remotely controlled.
The [independent source review](lan-development-review-r12.md) found no further
confirmed P1/P2. Evidence and original failure logs are retained under
`.artifacts/pages-parity-20261029/lan-runtime-r11/`.

The separate production preview on this workstation runs on port 3100 under the
transient user service `bouthouri-preview.service`, so ending a review shell does
not remove its deferred chunks. Inspect it with `systemctl --user status
bouthouri-preview.service` and `journalctl --user -u bouthouri-preview.service`.
The development server remains on port 3000. Neither is a public deployment.
