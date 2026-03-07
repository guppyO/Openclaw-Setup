# Current State

## Live right now

- The Hetzner VPS at `46.225.227.168` is the active durable control plane.
- The stage gateway is running there under `revenue-os-stage.service` and is loopback-bound on `127.0.0.1:4201`.
- The stage control UI is now enabled and reachable through the Windows SSH tunnel at `http://127.0.0.1:4201/`.
- The live authenticated OpenClaw provider route on the VPS is `openai-codex/gpt-5.4`.
- The live gateway is running from the pinned source-built OpenClaw tree at `/opt/revenue-os/vendor/openclaw-source` because the packaged release lagged GPT-5.4 support.
- The Windows attached-Chrome lane is paired and currently reachable through the OpenClaw Browser Relay on `127.0.0.1:4204`.
- The attached Chrome relay currently has one live registered target: the company Gmail tab.
- A self-hosted Steel container is also running on the VPS and now has loopback-only access enforcement for its local API ports.
- Browser broker truth is now:
  - attached Chrome: ready
  - node host: ready
  - remote gateway: ready through the SSH tunnel
  - Steel: present on the VPS but not yet promoted as the routed browser lane in the local broker snapshot
- Local semantic memory is now configured on the VPS with `memorySearch.provider = "local"` and the default `embeddinggemma` GGUF path. The embedding backend and vector extension are both ready.

## Local vs live

- Windows remains the Codex workstation, review surface, SSH tunnel host, and attached-Chrome node host.
- The Windows repo validates the generated `lab`, `stage`, and `prod` configs locally, but the authoritative live runtime is the Hetzner stage gateway.
- The local runtime-model policy still tracks host-local probe truth for Codex CLI and OpenClaw on Windows.
- The live model truth for the deployed control plane is stronger than the earlier local fallback story: the active remote gateway is now on GPT-5.4, not `gpt-5.3-codex`.
- The repo intentionally keeps `gpt-5.4` as the routine OpenClaw runtime model and uses `xhigh` reasoning for the deeper dispatch paths on the live gateway. `gpt-5.4-pro` remains a strategic target for the deepest available surfaces, but it is not currently exposed on the live authenticated OpenClaw provider route.
- The local runtime-model artifact can now be resynced from the live VPS with `npm run bootstrap:sync-live-provider` before re-running `npm run runtime:probe-models -- --active`.

## What is now operationally correct

- Secrets are imported from the ignored `credentials` bootstrap file into local secret env storage and are not committed.
- Future third-party accounts can now get unique generated passwords through `npm run runtime:provision-credential -- --service <service> --purpose "<purpose>"`.
- The control plane is stage-first by default.
- The gateway, hooks, dispatch wake paths, SSH tunnel, node host, attached Chrome lane, and loopback control UI are all aligned to the VPS-first architecture.
- The dispatcher no longer waits on heartbeat alone; immediate continuation, recovery sweeps, and per-agent hook wake paths are all in place.
- Source refresh and runtime verification are grounded in current official OpenAI, OpenClaw, Wise, and Steel sources.
- The source-built OpenClaw install path is pinned and reproducible, including UI build support and GPT-5.4 provider support.
- The latest local validation pass completed after the live browser fix: build passed, all 51 tests passed, smoke passed, and backup completed.

## Still not fully live

- Self-hosted Steel is now present and loopback-restricted on the VPS, but it is still not promoted as an auth-ready or operator-tunneled browser lane in the repo’s current broker state.
- Treasury is still `browser-only`; Wise API or OAuth is not yet live and the ledger remains incomplete.
- Root-account password rotation still needs to happen externally on Gmail, Wise, and Hetzner using the unique generated replacements in `.secrets/generated-service-credentials.env`.
- Production is not promoted yet. Stage is the live environment.
- Revenue generation is not something configuration alone can guarantee; what is live now is the company runtime, not proof of profitable experiments yet.

## Next autonomous steps

- Keep stage running and use it as the real operating surface.
- If you want the third browser lane promoted beyond its current loopback-restricted VPS state, decide whether to keep it as low-trust self-hosted session infrastructure or move to Steel Cloud for auth-ready profiles.
- Add Wise API or OAuth, or import append-only ledger data, if you want treasury beyond browser reconciliation.
- Promote to `prod` only after you are satisfied with stage behavior, browser reliability, and treasury truth.
