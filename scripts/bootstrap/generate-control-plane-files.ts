import { loadLocalRuntimeEnv } from "../../services/common/env-loader.js";
import { resolveRepoPath, writeTextFile } from "../../services/common/fs.js";
import { readModelCapabilityProbe } from "../../services/runtime-model/index.js";

interface AgentTemplate {
  id: string;
  purpose: string;
  directives: string[];
  heartbeat: string[];
  memory: string[];
  userContract: string[];
}

const AGENTS: AgentTemplate[] = [
  {
    id: "ceo",
    purpose: "Act as the allocator for attention, budget, and experiment scope across the company.",
    directives: [
      "Prioritize durable treasury growth over vanity metrics.",
      "Approve launches only when budget envelope, kill threshold, and evidence capture are explicit.",
      "Escalate only real-world auth or payment boundaries that cannot be solved locally.",
    ],
    heartbeat: [
      "Review the highest-value ready task, not just the oldest heartbeat note.",
      "Re-rank experiments, budgets, and lanes whenever new evidence arrives.",
      "Keep the company moving even when one lane blocks.",
    ],
    memory: [
      "GPT-5.4 remains the company default. GPT-5.4 Pro is reserved for the deepest available reasoning surfaces and OpenClaw stays on GPT-5.4 instead of downshifting to older families.",
      "The dispatcher should continue work immediately after a completed task when the next-best action is already known.",
      "Do not allow treasury or account blockers to freeze the rest of the company.",
    ],
    userContract: [
      "You are the allocator of capital, attention, and sequencing.",
      "Write short decisions, explicit budgets, and kill or compound calls.",
      "Keep the work queue compact and evidence-backed.",
    ],
  },
  {
    id: "research",
    purpose: "Discover and validate new revenue opportunities, operating changes, and market shifts.",
    directives: [
      "Prefer official, allowed, and repeatable sources.",
      "Turn demand signals into bounded offers, experiments, and account requirements.",
      "Write durable findings to portfolio docs instead of bloating session context.",
    ],
    heartbeat: [
      "Refresh the highest-EV research gap first.",
      "Expand adjacent niches only when the current opportunity already has a credible path to launch.",
      "Feed crisp work packages to builder and growth.",
    ],
    memory: [
      "The company should search continuously across multiple lane families, not lock onto one funnel.",
      "Every new idea needs time-to-revenue, payout readiness, platform risk, and account requirements.",
    ],
    userContract: [
      "Produce evidence-backed opportunity notes with concrete next actions.",
      "Avoid broad summaries that do not change the queue.",
    ],
  },
  {
    id: "builder",
    purpose: "Ship code, assets, automations, and operating surfaces that advance the active portfolio.",
    directives: [
      "Prefer reusable assets and internal tools over one-off hacks.",
      "Attach analytics, logs, and evidence capture to shipped surfaces.",
      "Document follow-on tasks immediately after each milestone.",
    ],
    heartbeat: [
      "Pull the highest-value ready build task from the dispatch queue.",
      "Ship the smallest revenue-bearing increment that preserves quality.",
      "Open a continuation task instead of silently widening scope.",
    ],
    memory: [
      "Asset factory outputs should be reusable across offers, listings, and sites.",
      "Landing pages, docs, onboarding, and analytics hooks are the default launch bundle.",
    ],
    userContract: [
      "Default to executable diffs, scripts, and tested changes.",
      "Favor deterministic tooling and runbooks over prompt-only behavior.",
    ],
  },
  {
    id: "distribution",
    purpose: "Own growth execution: listings, SEO, distribution loops, analytics, and launch operations.",
    directives: [
      "Diversify traffic sources instead of depending on a single platform.",
      "Respect marketplace rules, disclosure rules, and anti-spam constraints.",
      "Use browser routing deliberately across managed, attached, and Steel lanes.",
    ],
    heartbeat: [
      "Remove the current distribution bottleneck for the top active experiment.",
      "Refresh listings, channels, and analytics gaps with evidence capture.",
      "Archive dead channels quickly and write down the reason.",
    ],
    memory: [
      "OpenClaw managed browser is the default lane for typed browser work.",
      "Attached Chrome handles high-trust sessions and Steel handles scalable parallel browsing.",
    ],
    userContract: [
      "Output launch states, URLs, screenshots, and KPI deltas.",
      "Do not create blind or policy-breaking outreach loops.",
    ],
  },
  {
    id: "treasury",
    purpose: "Own cash, ledgering, budget envelopes, reimbursements, and spend attribution.",
    directives: [
      "Treat Wise capability as runtime-discovered, not assumed.",
      "Every outflow must map to an initiative or an operating need.",
      "Freeze suspicious or out-of-envelope actions immediately.",
    ],
    heartbeat: [
      "Refresh balances, receipts, and experiment attribution.",
      "Release or deny budget based on policy and live performance.",
      "Write anomalies with evidence paths, not vague warnings.",
    ],
    memory: [
      "Wise must be treated as a multi-lane system: API where possible, browser lane where necessary, append-only ledger always.",
      "Missing spend rails should cause replanning, not stalling.",
    ],
    userContract: [
      "Output precise capability flags, balances, and budget decisions.",
      "Prefer concrete data over generic treasury claims.",
    ],
  },
  {
    id: "skillsmith",
    purpose: "Manage internal skills, third-party skill intake, prompt evals, and capability upgrades.",
    directives: [
      "Treat third-party skills as supply-chain risk until reviewed and staged.",
      "Convert repeated workflows into lean internal skills.",
      "Never promote without an eval report or explicit rejection note.",
    ],
    heartbeat: [
      "Advance one candidate skill or internal workflow upgrade each run.",
      "Watch for repeated manual work worth internalizing.",
      "Record prompt and skill regressions visibly.",
    ],
    memory: [
      "Seed queue includes find-skills, clawddocs, proactive-agent, and self-improving-agent.",
      "Built-in Codex skills are trusted within this local boundary, but third-party skills are not.",
    ],
    userContract: [
      "Output promotion decisions with overlap, risk, and runtime fit.",
      "Keep skill instructions short and operational.",
    ],
  },
  {
    id: "ops",
    purpose: "Keep the control plane alive through updates, health checks, dispatch recovery, backups, and staged promotion.",
    directives: [
      "Use staged promotion instead of blind in-place mutation.",
      "Heartbeat is strategic review; the dispatcher and short sweeps keep the company moving.",
      "Keep restore artifacts current enough to recover without guesswork.",
    ],
    heartbeat: [
      "Refresh health, drift, dispatch, and backup posture.",
      "Run resilience work whenever revenue tasks are temporarily blocked.",
      "Never let stage and prod drift silently.",
    ],
    memory: [
      "Primary gateway lives on Hetzner with loopback binding and secure remote access.",
      "The Windows node is the attached-browser and local Codex surface, not the durable control plane.",
    ],
    userContract: [
      "Produce short incident notes, promotion decisions, and recovery actions.",
      "Prefer explicit versions, paths, and dates over vague status language.",
    ],
  },
];

function renderSection(title: string, lines: string[]): string {
  return `# ${title}\n\n${lines.map((line) => `- ${line}`).join("\n")}\n`;
}

function renderAgentFiles(agent: AgentTemplate): Record<string, string> {
  return {
    "SOUL.md": `# ${agent.id}\n\n${agent.purpose}\n\n${renderSection("Directives", agent.directives)}\n${renderSection("Operating Constraints", [
      "Keep hot context compact and push durable conclusions to files.",
      "Auto-execute only inside the policy envelope and available tool or auth surface.",
      "Record blockers precisely without stalling unrelated work.",
    ])}`,
    "AGENTS.md": `# ${agent.id} Agent Rules\n\n${renderSection("Role", [agent.purpose])}\n${renderSection("Heartbeat", agent.heartbeat)}\n${renderSection("Collaboration", [
      "Accept bounded work packages from the CEO, dispatcher, or recurring jobs.",
      "Write evidence paths and validations into initiative docs.",
      "Prefer reversible changes and staged promotion paths.",
    ])}`,
    "USER.md": `# ${agent.id} User Contract\n\n${agent.userContract.map((line) => `- ${line}`).join("\n")}\n`,
    "MEMORY.md": `# ${agent.id} Memory\n\n${agent.memory.map((line) => `- ${line}`).join("\n")}\n`,
    "HEARTBEAT.md": `# ${agent.id} Heartbeat\n\n${agent.heartbeat.map((line) => `- ${line}`).join("\n")}\n`,
  };
}

interface EnvironmentConfig {
  name: "lab" | "stage" | "prod";
  port: number;
  bind: "loopback";
  browserHeadless: boolean;
  modelPrimary: string;
  modelDeep: string;
  modelFallback: string;
}

const VPS_ROOT_DIR = "/opt/revenue-os";
const VPS_RUNTIME_USER = "revenueos";
const GATEWAY_TOKEN_PLACEHOLDER = "__OPENCLAW_GATEWAY_TOKEN__";
const HOOK_TOKEN_PLACEHOLDER = "__OPENCLAW_HOOK_TOKEN__";

function heartbeatEvery(agentId: AgentTemplate["id"]): string {
  switch (agentId) {
    case "research":
      return "15m";
    case "distribution":
      return "20m";
    case "treasury":
      return "30m";
    case "skillsmith":
      return "25m";
    default:
      return "12m";
  }
}

function thinkingDefault(agentId: AgentTemplate["id"]): "high" | "xhigh" {
  switch (agentId) {
    case "ceo":
    case "research":
    case "treasury":
    case "ops":
      return "xhigh";
    default:
      return "high";
  }
}

function isDeepAgent(agentId: AgentTemplate["id"]): boolean {
  return thinkingDefault(agentId) === "xhigh";
}

function agentModel(config: EnvironmentConfig, agentId: AgentTemplate["id"]): string {
  return isDeepAgent(agentId) ? config.modelDeep : config.modelPrimary;
}

function renderModelMap(config: EnvironmentConfig): Record<string, unknown> {
  if (config.modelPrimary === config.modelDeep) {
    return {
      [config.modelPrimary]: {
        alias: "frontier",
        params: {
          reasoning: {
            effort: "high",
          },
        },
      },
    };
  }

  return {
    [config.modelPrimary]: {
      alias: "frontier",
      params: {
        reasoning: {
          effort: "high",
        },
      },
    },
    [config.modelDeep]: {
      alias: "frontier-deep",
      params: {
        reasoning: {
          effort: "xhigh",
        },
      },
    },
  };
}

function renderOpenClawConfig(config: EnvironmentConfig): string {
  const hookMappings = AGENTS.map((agent) => ({
    name: `dispatch-immediate-${agent.id}`,
    match: {
      path: `dispatch/${agent.id}`,
    },
    action: "agent",
    agentId: agent.id,
    wakeMode: "now",
    sessionKey: `hook:${config.name}:dispatch:${agent.id}`,
    deliver: false,
    model: agentModel(config, agent.id),
    thinking: thinkingDefault(agent.id),
    messageTemplate:
      "Dispatch continuation requested. Review dispatch-state.json and continue your active assignment(s) immediately. Completed task: {{completedTaskId}}. Primary task: {{targetTaskId}}. Active tasks: {{targetTaskIds}}.",
  }));

  return `${JSON.stringify(
    {
      gateway: {
        mode: "local",
        bind: config.bind,
        port: config.port,
        controlUi: {
          enabled: true,
        },
        auth: {
          mode: "token",
          token: GATEWAY_TOKEN_PLACEHOLDER,
        },
      },
      hooks: {
        enabled: true,
        path: "/hooks",
        token: HOOK_TOKEN_PLACEHOLDER,
        defaultSessionKey: `hook:${config.name}:dispatch`,
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: [`hook:${config.name}:`],
        allowedAgentIds: AGENTS.map((agent) => agent.id),
        mappings: hookMappings,
      },
      agents: {
        defaults: {
          model: {
            primary: config.modelPrimary,
            fallbacks: [],
          },
          models: renderModelMap(config),
          workspace: `${VPS_ROOT_DIR}/runtime/${config.name}/workspace`,
          userTimezone: "Europe/London",
          timeFormat: "24",
          thinkingDefault: "high",
          timeoutSeconds: 1800,
          contextTokens: 900000,
          maxConcurrent: config.name === "prod" ? 5 : 4,
          contextPruning: {
            mode: "cache-ttl",
            ttl: "55m",
          },
          compaction: {
            mode: "safeguard",
            reserveTokensFloor: 32000,
            memoryFlush: {
              enabled: true,
              softThresholdTokens: 8000,
              systemPrompt: "Session nearing compaction. Store durable memories now.",
              prompt: "Write lasting notes to memory and initiative docs. Reply with NO_REPLY if nothing durable changed.",
            },
          },
          memorySearch: {
            enabled: true,
            sources: ["memory"],
            extraPaths: ["initiatives"],
            experimental: {
              sessionMemory: false,
            },
            provider: "local",
            local: {
              modelPath:
                "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
              modelCacheDir: `${VPS_ROOT_DIR}/runtime/models/embeddings`,
            },
            fallback: "none",
            store: {
              path: `${VPS_ROOT_DIR}/runtime/${config.name}/memory/{agentId}.sqlite`,
              vector: {
                enabled: true,
              },
            },
          },
        },
        list: AGENTS.map((agent) => ({
          id: agent.id,
          name: agent.id,
          workspace: `${VPS_ROOT_DIR}/runtime/${config.name}/workspace/${agent.id}`,
          agentDir: `${VPS_ROOT_DIR}/agents/${agent.id}`,
          model: {
            primary: agentModel(config, agent.id),
            fallbacks: [],
          },
          identity: {
            name: agent.id,
          },
          heartbeat: {
            every: heartbeatEvery(agent.id),
            model: agentModel(config, agent.id),
            prompt:
              "Read HEARTBEAT.md and data/exports/dispatch-state.json. Continue only if a ready task exists, a blocker cleared, or the queue needs reprioritization. Keep the acknowledgement terse.",
            session: "main",
            includeReasoning: false,
            directPolicy: "block",
            target: "none",
            ackMaxChars: 180,
            suppressToolErrorWarnings: true,
          },
        })),
      },
      browser: {
        enabled: true,
        defaultProfile: "openclaw",
        color: "#FF4500",
        headless: config.browserHeadless,
        noSandbox: false,
        attachOnly: false,
        snapshotDefaults: {
          mode: "efficient",
        },
      },
      cron: {
        enabled: true,
      },
    },
    null,
    2,
  )}\n`;
}

function renderSystemdUnit(environment: EnvironmentConfig): string {
  return `[Unit]
Description=Revenue OS OpenClaw ${environment.name} gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${VPS_RUNTIME_USER}
Group=${VPS_RUNTIME_USER}
WorkingDirectory=${VPS_ROOT_DIR}
Environment=NODE_ENV=production
Environment=REVENUE_OS_ENVIRONMENT=${environment.name}
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Environment=OPENCLAW_NO_RESPAWN=1
EnvironmentFile=-${VPS_ROOT_DIR}/.secrets/revenue-os.local.env
Environment=OPENCLAW_CONFIG_PATH=${VPS_ROOT_DIR}/data/generated/openclaw/${environment.name}.json
ExecStartPre=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && export OPENCLAW_BIN="${"$"}{OPENCLAW_BIN:-$(${VPS_ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh ${VPS_ROOT_DIR})}" && npm run runtime:probe-models -- --active && npm run bootstrap:control-plane'
ExecStartPre=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && bash scripts/bootstrap/sync-runtime-workspace.sh ${environment.name}'
ExecStartPre=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && export OPENCLAW_BIN="${"$"}{OPENCLAW_BIN:-$(${VPS_ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh ${VPS_ROOT_DIR})}" && npm run runtime:render-openclaw-config -- --environment ${environment.name} --output ${VPS_ROOT_DIR}/data/generated/openclaw/${environment.name}.json'
ExecStartPre=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && export OPENCLAW_BIN="${"$"}{OPENCLAW_BIN:-$(${VPS_ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh ${VPS_ROOT_DIR})}" && npm run verify:openclaw-config -- ${environment.name}'
ExecStartPre=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && export OPENCLAW_BIN="${"$"}{OPENCLAW_BIN:-$(${VPS_ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh ${VPS_ROOT_DIR})}" && OPENCLAW_CONFIG_PATH=${VPS_ROOT_DIR}/data/generated/openclaw/${environment.name}.json "$OPENCLAW_BIN" doctor'
ExecStart=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && export OPENCLAW_BIN="${"$"}{OPENCLAW_BIN:-$(${VPS_ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh ${VPS_ROOT_DIR})}" && OPENCLAW_CONFIG_PATH=${VPS_ROOT_DIR}/data/generated/openclaw/${environment.name}.json "$OPENCLAW_BIN" gateway'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`;
}

function renderAuxService(environment: EnvironmentConfig, id: "scheduler" | "source-refresh" | "backup"): string {
  const commandMap = {
    scheduler: "npm run runtime:scheduler",
    "source-refresh": "npm run refresh:updates",
    backup: "npm run backup",
  } as const;

  return `[Unit]
Description=Revenue OS ${id} ${environment.name}
After=network-online.target

[Service]
Type=oneshot
User=${VPS_RUNTIME_USER}
Group=${VPS_RUNTIME_USER}
WorkingDirectory=${VPS_ROOT_DIR}
Environment=NODE_ENV=production
Environment=REVENUE_OS_ENVIRONMENT=${environment.name}
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Environment=OPENCLAW_NO_RESPAWN=1
EnvironmentFile=-${VPS_ROOT_DIR}/.secrets/revenue-os.local.env
ExecStart=/usr/bin/env bash -lc 'cd ${VPS_ROOT_DIR} && ${commandMap[id]}'
`;
}

function renderAuxTimer(environment: EnvironmentConfig, id: "scheduler" | "source-refresh" | "backup"): string {
  const scheduleMap = {
    scheduler: { boot: "2min", active: "3min" },
    "source-refresh": { boot: "10min", active: "6h" },
    backup: { boot: "20min", active: "12h" },
  } as const;
  const schedule = scheduleMap[id];

  return `[Unit]
Description=Revenue OS ${id} timer ${environment.name}

[Timer]
OnBootSec=${schedule.boot}
OnUnitActiveSec=${schedule.active}
Unit=revenue-os-${environment.name}-${id}.service
Persistent=true

[Install]
WantedBy=timers.target
`;
}

function renderBootstrapScript(environment: EnvironmentConfig): string {
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${"$"}{REVENUE_OS_ROOT_DIR:-${VPS_ROOT_DIR}}"
CONFIG="${"$"}{ROOT_DIR}/openclaw/${environment.name}/openclaw.json"

cd "${"$"}{ROOT_DIR}"

if [ -f "${"$"}{ROOT_DIR}/.secrets/revenue-os.local.env" ]; then
  set -a
  source "${"$"}{ROOT_DIR}/.secrets/revenue-os.local.env"
  set +a
fi

if [[ "${"$"}{OPENCLAW_INSTALL_CHANNEL:-source-pinned}" != "release" ]]; then
  OPENCLAW_SOURCE_REF="${"$"}{OPENCLAW_SOURCE_REF:-84f5d7dc1d1b041382c126384c6eb28cad2f53fa}" REVENUE_OS_ROOT_DIR="${"$"}{ROOT_DIR}" bash scripts/bootstrap/install-openclaw-source.sh
fi

OPENCLAW_BIN="$("${"$"}{ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh" "${"$"}{ROOT_DIR}")"
export OPENCLAW_BIN

npm ci
npm run runtime:probe-models
npm run bootstrap:control-plane
npm run runtime:render-openclaw-config -- --environment ${environment.name} --output "${"$"}{ROOT_DIR}/data/generated/openclaw/${environment.name}.json"
npm run verify:openclaw-config -- ${environment.name}
OPENCLAW_CONFIG_PATH="${"$"}{ROOT_DIR}/data/generated/openclaw/${environment.name}.json" "${"$"}{OPENCLAW_BIN}" doctor
"${"$"}{OPENCLAW_BIN}" onboard --auth-choice openai-codex
bash scripts/bootstrap/finalize-openclaw-auth.sh ${environment.name}

echo "Prepared ${environment.name} gateway config at ${"$"}{ROOT_DIR}/data/generated/openclaw/${environment.name}.json"
echo "Next: install systemd units from openclaw/${environment.name}/systemd into /etc/systemd/system and start revenue-os-${environment.name}.service"
`;
}

function renderCronPack(): string {
  return `${JSON.stringify(
    [
      { id: "dispatch-recovery", cadence: "*/3 * * * *", purpose: "Recover stuck work and refill the ready queue" },
      { id: "queue-refresh", cadence: "*/15 * * * *", purpose: "Strategic queue refresh and urgent blocker scan" },
      { id: "opportunity-ingest", cadence: "*/30 * * * *", purpose: "Opportunity feed ingest" },
      { id: "health-and-kpi", cadence: "0 * * * *", purpose: "Website, asset, service health and KPI sync" },
      { id: "skill-discovery", cadence: "0 */4 * * *", purpose: "Skill discovery sweep and ranking" },
      { id: "source-refresh", cadence: "0 */6 * * *", purpose: "OpenClaw, Codex, model, Wise, and Steel source refresh" },
      { id: "portfolio-review", cadence: "0 7 * * *", purpose: "Daily portfolio review" },
      { id: "budget-reconcile", cadence: "30 7 * * *", purpose: "Daily budget reconciliation" },
      { id: "memory-compaction", cadence: "0 8 * * *", purpose: "Daily memory compaction and initiative cleanup" },
      { id: "canary-rehearsal", cadence: "0 9 * * 1", purpose: "Weekly canary update rehearsal" },
      { id: "lane-recalibration", cadence: "0 10 * * 1", purpose: "Weekly lane score recalibration" },
      { id: "kill-or-compound", cadence: "0 11 * * 1", purpose: "Weekly kill-or-compound review" },
    ],
    null,
    2,
  )}\n`;
}

async function main(): Promise<void> {
  await loadLocalRuntimeEnv();
  const modelProbe = await readModelCapabilityProbe();

  for (const agent of AGENTS) {
    const files = renderAgentFiles(agent);
    for (const [name, contents] of Object.entries(files)) {
      await writeTextFile(resolveRepoPath("agents", agent.id, name), contents);
    }
  }

  const environments: EnvironmentConfig[] = [
    {
      name: "lab",
      port: 4101,
      bind: "loopback",
      browserHeadless: false,
      modelPrimary: modelProbe.openClawPrimary,
      modelDeep: modelProbe.openClawDeep ?? modelProbe.openClawPrimary ?? process.env.OPENCLAW_MODEL_DEEP ?? "openai-codex/gpt-5.4",
      modelFallback: modelProbe.openClawFallback,
    },
    {
      name: "stage",
      port: 4201,
      bind: "loopback",
      browserHeadless: false,
      modelPrimary: modelProbe.openClawPrimary,
      modelDeep: modelProbe.openClawDeep ?? modelProbe.openClawPrimary ?? process.env.OPENCLAW_MODEL_DEEP ?? "openai-codex/gpt-5.4",
      modelFallback: modelProbe.openClawFallback,
    },
    {
      name: "prod",
      port: 4301,
      bind: "loopback",
      browserHeadless: true,
      modelPrimary: modelProbe.openClawPrimary,
      modelDeep: modelProbe.openClawDeep ?? modelProbe.openClawPrimary ?? process.env.OPENCLAW_MODEL_DEEP ?? "openai-codex/gpt-5.4",
      modelFallback: modelProbe.openClawFallback,
    },
  ];

  for (const environment of environments) {
    await writeTextFile(
      resolveRepoPath("openclaw", environment.name, "openclaw.json"),
      renderOpenClawConfig(environment),
    );
    if (environment.name !== "lab") {
      await writeTextFile(
        resolveRepoPath("openclaw", environment.name, "systemd", `revenue-os-${environment.name}.service`),
        renderSystemdUnit(environment),
      );
      for (const id of ["scheduler", "source-refresh", "backup"] as const) {
        await writeTextFile(
          resolveRepoPath("openclaw", environment.name, "systemd", `revenue-os-${environment.name}-${id}.service`),
          renderAuxService(environment, id),
        );
        await writeTextFile(
          resolveRepoPath("openclaw", environment.name, "systemd", `revenue-os-${environment.name}-${id}.timer`),
          renderAuxTimer(environment, id),
        );
      }
    }
    await writeTextFile(
      resolveRepoPath("openclaw", environment.name, "scripts", `bootstrap-${environment.name}.sh`),
      renderBootstrapScript(environment),
    );
    await writeTextFile(
      resolveRepoPath("openclaw", environment.name, "scripts", "cron-pack.json"),
      renderCronPack(),
    );
  }

  console.log(
    `Generated agent identity files and OpenClaw configs using ${modelProbe.openClawPrimary} as the verified gateway primary.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
