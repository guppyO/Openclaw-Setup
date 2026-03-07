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
  - Steel: ready as the routed low-trust parallel browser lane through the loopback-scoped self-hosted Steel API
  - auth-sensitive Steel profiles: still not promoted; root-identity, treasury, and infrastructure stay on attached Chrome unless Steel Cloud is provisioned
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
- Treasury is now in `hybrid-live` mode: the Wise personal token can read the live GBP balance, the browser lane exists for fallback evidence capture, and the current cash balance is visible in runtime exports.

## Still not fully live

- Self-hosted Steel is live only for low-trust public session pooling. If you want auth-ready multi-profile Steel lanes, you still need Steel Cloud or a stronger self-hosted credentials layer than the repo currently treats as supportable.
- Treasury has live balance truth, but the ledger is still incomplete because Wise statement coverage and append-only ledger import are not fully wired yet.
- Production is not promoted yet. Stage is the live environment.
- Revenue generation is not something configuration alone can guarantee; what is live now is the company runtime, not proof of profitable experiments yet.

## Next autonomous steps

- Keep stage running and use it as the real operating surface.
- Use self-hosted Steel for parallel low-trust market research, site sweeps, and public acquisition discovery while attached Chrome handles company-auth, Gmail, Wise, and Hetzner flows.
- Import append-only ledger data or extend the Wise statement path if you want treasury beyond live balance truth.
- Promote to `prod` only after you are satisfied with stage behavior, browser reliability, and treasury truth.
