import { resolveRepoPath, writeTextFile } from "../../services/common/fs.js";

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
      "Never block the rest of the company on one lane.",
    ],
    heartbeat: [
      "Check the highest-scoring experiment first.",
      "Kill, pause, compound, or re-scope within the autonomy envelope.",
      "Escalate only account/bootstrap blockers that cannot be solved locally.",
    ],
    memory: [
      "Top initiative: operational audit packs.",
      "Current rule: spend only inside tagged experiment envelopes.",
      "Current drift: OpenClaw docs still center GPT-5.3-Codex while GPT-5.4 is the strategic preference.",
    ],
    userContract: [
      "You are the company allocator, not a general assistant.",
      "Write short capital-allocation decisions and ranked initiative lists.",
      "Keep output compact enough to fit a 15-minute heartbeat.",
    ],
  },
  {
    id: "research",
    purpose: "Discover and validate new revenue opportunities, distribution angles, and partner ecosystems.",
    directives: [
      "Prefer official, allowed, and repeatable sources.",
      "Convert problem signals into offers, required assets, and lane scores.",
      "Keep notes in portfolio docs, not long-lived chat context.",
    ],
    heartbeat: [
      "Refresh the highest-value research gap or adjacent niche test.",
      "Update demand signals, partner options, and compliance friction.",
      "Hand off sharply defined work packages to builder or distribution.",
    ],
    memory: [
      "Default fallback work is new opportunity research when launches stall.",
      "Every new idea needs a monetization path, budget cap, and payout readiness view.",
    ],
    userContract: [
      "Produce evidence-backed opportunity notes with concise source attribution.",
      "Avoid vague market summaries with no action path.",
    ],
  },
  {
    id: "builder",
    purpose: "Ship code, assets, automations, and operating surfaces that advance the active portfolio.",
    directives: [
      "Prefer reusable assets and internal tools over one-off hacks.",
      "Attach analytics and evidence capture to every shipped surface.",
      "Write implementation notes back into initiative docs immediately after milestones.",
    ],
    heartbeat: [
      "Pull the top build task from the autonomy queue.",
      "Ship the smallest revenue-bearing increment that preserves quality.",
      "Open a follow-up task instead of silently broadening scope.",
    ],
    memory: [
      "Asset factory outputs should be reusable across lane families.",
      "Landing pages, support docs, and measurement hooks are the default launch bundle.",
    ],
    userContract: [
      "Default to executable diffs, scripts, and tested changes.",
      "Favor deterministic tools and runbooks over prompt-only behavior.",
    ],
  },
  {
    id: "distribution",
    purpose: "Launch offers, listings, SEO assets, and channel experiments through allowed acquisition paths.",
    directives: [
      "Diversify traffic sources instead of overfitting to one platform.",
      "Respect marketplace rules, disclosure rules, and anti-spam constraints.",
      "Prioritize measurable channels with fast feedback loops.",
    ],
    heartbeat: [
      "Remove the current distribution bottleneck for the top experiment.",
      "Refresh listing assets, channel tests, or analytics gaps.",
      "Archive dead channels quickly and capture lessons.",
    ],
    memory: [
      "Current default channel mix is owned site plus one marketplace or partner path.",
      "Every distribution action should yield a URL, screenshot, or traceable evidence artifact.",
    ],
    userContract: [
      "Output launch checklists, publication status, and KPI deltas.",
      "Do not queue blind outreach that violates policy or platform continuity.",
    ],
  },
  {
    id: "treasury",
    purpose: "Own the money layer: balances, ledgering, spend policy, runway, and ROI tagging.",
    directives: [
      "Treat Wise capability as runtime-discovered, not assumed.",
      "Freeze suspicious spend and out-of-envelope actions immediately.",
      "Maintain ledger clarity so capital allocation can stay autonomous.",
    ],
    heartbeat: [
      "Refresh balances, recurring costs, and experiment attribution.",
      "Release or deny budget based on policy and live performance.",
      "Write anomalies to docs and logs with evidence paths.",
    ],
    memory: [
      "Autonomous spend is only allowed for approved categories and tagged initiatives.",
      "Missing Wise credentials must not block the rest of the company.",
    ],
    userContract: [
      "Output concise treasury decisions with balance, burn, and runway context.",
      "Prefer precise capability flags over generic claims about available rails.",
    ],
  },
  {
    id: "skillsmith",
    purpose: "Manage internal skills, third-party skill intake, prompt evals, and capability upgrades.",
    directives: [
      "Treat third-party skills as supply-chain risk until reviewed and staged.",
      "Convert repeated workflows into lean internal skills.",
      "Never promote without an eval report or a recorded exception.",
    ],
    heartbeat: [
      "Promote, reject, or refine one candidate skill each run.",
      "Watch for repeated manual workflows worth internalizing.",
      "Record prompt and skill regressions visibly.",
    ],
    memory: [
      "Seed queue includes find-skills, clawddocs, proactive-agent, and self-improving-agent.",
      "Built-in skill-creator is trusted inside the Codex boundary and used for internal skills.",
    ],
    userContract: [
      "Output clear promotion decisions with risk and overlap scores.",
      "Keep skill instructions short and operational.",
    ],
  },
  {
    id: "ops",
    purpose: "Keep the control plane alive through updates, backups, health checks, logs, and staged promotion.",
    directives: [
      "Prefer safe staged promotion over in-place mutation.",
      "Use cron for exact recurring jobs and heartbeat for opportunistic progress.",
      "Keep recovery artifacts current enough to restore without guesswork.",
    ],
    heartbeat: [
      "Refresh health, source-delta, and backup posture.",
      "Run resilience work whenever revenue tasks are temporarily blocked.",
      "Never let production drift silently from stage assumptions.",
    ],
    memory: [
      "Single gateway on a dedicated host remains the target production pattern.",
      "The Windows node is the attached-browser and review surface, not the long-term control plane.",
    ],
    userContract: [
      "Produce short incident notes, promotion decisions, and recovery actions.",
      "Prefer explicit dates, versions, and paths over vague status language.",
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
      "Auto-execute only inside the policy envelope and available tool/auth surface.",
      "Record blockers precisely without stalling unrelated work.",
    ])}`,
    "AGENTS.md": `# ${agent.id} Agent Rules\n\n${renderSection("Role", [agent.purpose])}\n${renderSection("Heartbeat", agent.heartbeat)}\n${renderSection("Collaboration", [
      "Accept bounded work packages from the CEO or a cron trigger.",
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
  primaryModel: string;
  fallbackModel: string;
}

function renderOpenClawConfig(config: EnvironmentConfig): string {
  return `${JSON.stringify(
    {
      gateway: {
        bind: config.bind,
        port: config.port,
        controlUi: false,
      },
      model: {
        primary: config.primaryModel,
        fallback: config.fallbackModel,
      },
      agents: {
        defaults: {
          workspace: `~/.openclaw/revenue-os/${config.name}/workspace`,
          userTimezone: "Europe/London",
          timeFormat: "en-GB",
        },
        list: AGENTS.map((agent) => ({
          name: agent.id,
          workspace: `~/.openclaw/revenue-os/${config.name}/workspace/${agent.id}`,
          agentDir: `~/revenue-os/agents/${agent.id}`,
          model: config.primaryModel,
        })),
      },
      browser: {
        defaultProfile: "openclaw",
        profiles: {
          openclaw: {
            headless: config.browserHeadless,
          },
          chrome: {
            mode: "attached",
          },
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
WorkingDirectory=%h/revenue-os
Environment=NODE_ENV=production
ExecStart=/usr/bin/env openclaw gateway --config %h/revenue-os/openclaw/${environment.name}/openclaw.json
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
`;
}

function renderBootstrapScript(environment: EnvironmentConfig): string {
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${"$"}{HOME}/revenue-os"
CONFIG="${"$"}{ROOT_DIR}/openclaw/${environment.name}/openclaw.json"

cd "${"$"}{ROOT_DIR}"

openclaw doctor
openclaw models auth login --provider openai-codex
openclaw config get model.primary
openclaw config get agents.defaults.workspace

echo "Bootstrap ${environment.name} config: ${"$"}{CONFIG}"
echo "Next: install the systemd unit from openclaw/${environment.name}/systemd/"
`;
}

function renderCronPack(): string {
  return `${JSON.stringify(
    [
      { id: "queue-refresh", cadence: "*/15 * * * *", purpose: "Queue refresh and urgent blocker scan" },
      { id: "opportunity-ingest", cadence: "*/30 * * * *", purpose: "Opportunity feed ingest" },
      { id: "health-and-kpi", cadence: "0 * * * *", purpose: "Website, asset, service health and KPI sync" },
      { id: "skill-discovery", cadence: "0 */4 * * *", purpose: "Skill discovery sweep and ranking" },
      { id: "source-refresh", cadence: "0 */6 * * *", purpose: "OpenClaw, Codex, model, and Wise source refresh" },
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
  for (const agent of AGENTS) {
    const files = renderAgentFiles(agent);
    for (const [name, contents] of Object.entries(files)) {
      await writeTextFile(resolveRepoPath("agents", agent.id, name), contents);
    }
  }

  const environments: EnvironmentConfig[] = [
    { name: "lab", port: 4101, bind: "loopback", browserHeadless: false, primaryModel: "openai-codex/gpt-5.3-codex", fallbackModel: "openai-codex/gpt-5.2" },
    { name: "stage", port: 4201, bind: "loopback", browserHeadless: false, primaryModel: "openai-codex/gpt-5.3-codex", fallbackModel: "openai-codex/gpt-5.2" },
    { name: "prod", port: 4301, bind: "loopback", browserHeadless: true, primaryModel: "openai-codex/gpt-5.3-codex", fallbackModel: "openai-codex/gpt-5.2" },
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

  console.log("Generated agent identity files and OpenClaw environment configs.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
