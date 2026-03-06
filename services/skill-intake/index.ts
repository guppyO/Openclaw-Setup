import { createHash } from "node:crypto";

import { renderTable } from "../common/markdown.js";
import { listMarkdownFiles, resolveRepoPath } from "../common/fs.js";
import type { SkillCandidate } from "../common/types.js";

interface SeedDescriptor {
  id: string;
  slug: string;
  sourceType: SkillCandidate["sourceType"];
  rationale: string;
  provenance: string;
  maintenanceSignal: number;
  overlapScore: number;
  riskScore: number;
  notes: string;
  preferredUrls?: string[];
}

const SEED_DESCRIPTORS: SeedDescriptor[] = [
  {
    id: "skill-find-skills",
    slug: "find-skills",
    sourceType: "clawhub",
    rationale: "Explicit operator request and likely leverage for discovery loops.",
    provenance: "Seeded from the operator brief.",
    maintenanceSignal: 6.5,
    overlapScore: 8.7,
    riskScore: 5.2,
    notes: "Resolve the live ClawHub or GitHub source before promotion.",
    preferredUrls: [
      "https://clawhub.ai/search?q=find-skills",
      "https://github.com/search?q=find-skills+openclaw+skill&type=repositories",
    ],
  },
  {
    id: "skill-clawddocs",
    slug: "clawddocs",
    sourceType: "clawhub",
    rationale: "Could improve documentation retrieval and OpenClaw adaptation speed.",
    provenance: "Seeded from the operator brief.",
    maintenanceSignal: 6.2,
    overlapScore: 8.3,
    riskScore: 5.6,
    notes: "Verify source availability and compatibility with current OpenClaw releases before promotion.",
    preferredUrls: [
      "https://clawhub.ai/search?q=clawddocs",
      "https://github.com/search?q=clawddocs+openclaw+skill&type=repositories",
    ],
  },
  {
    id: "skill-skill-creator",
    slug: "skill-creator",
    sourceType: "built-in",
    rationale: "Required for internal skill creation workflow.",
    provenance: "Local Codex system skill present in this session.",
    maintenanceSignal: 9.0,
    overlapScore: 9.2,
    riskScore: 1.2,
    notes: "Built-in system skill; trusted inside the local Codex boundary.",
  },
  {
    id: "skill-proactive-agent",
    slug: "proactive-agent",
    sourceType: "clawhub",
    rationale: "Maps directly to always-on autonomy patterns but must be supply-chain vetted.",
    provenance: "Seeded from the operator brief.",
    maintenanceSignal: 5.5,
    overlapScore: 8.8,
    riskScore: 6.0,
    notes: "Potentially high leverage; require provenance, pinning, and evals before stage.",
    preferredUrls: [
      "https://clawhub.ai/search?q=proactive-agent",
      "https://github.com/search?q=proactive-agent+openclaw+skill&type=repositories",
    ],
  },
  {
    id: "skill-self-improving-agent",
    slug: "self-improving-agent",
    sourceType: "clawhub",
    rationale: "Maps directly to the self-improvement objective.",
    provenance: "Seeded from the operator brief.",
    maintenanceSignal: 5.8,
    overlapScore: 9.1,
    riskScore: 6.3,
    notes: "Do not promote without deterministic evals and mutation boundaries.",
    preferredUrls: [
      "https://clawhub.ai/search?q=self-improving-agent",
      "https://github.com/search?q=self-improving-agent+openclaw+skill&type=repositories",
    ],
  },
];

function scoreRisk(candidate: SkillCandidate): number {
  const sourcePenalty =
    candidate.sourceType === "built-in"
      ? 1
      : candidate.sourceType === "workspace"
        ? 2
        : candidate.sourceType === "github"
          ? 5
          : 6;

  const stageBonus =
    candidate.stage === "prod"
      ? -2
      : candidate.stage === "stage"
        ? -1
        : candidate.stage === "quarantine"
          ? 1
          : 2;

  return Math.max(0, Math.min(10, Number((candidate.riskScore + sourcePenalty + stageBonus).toFixed(1))));
}

function baseCandidate(seed: SeedDescriptor): SkillCandidate {
  return {
    id: seed.id,
    slug: seed.slug,
    source: seed.sourceType === "built-in" ? "Local Codex system skill" : "Discovery pending",
    sourceType: seed.sourceType,
    stage: seed.sourceType === "built-in" ? "prod" : "seeded",
    discoveredAt: new Date().toISOString(),
    discoveryMode: seed.sourceType === "built-in" ? "workspace" : "seeded",
    sourceUrl: seed.preferredUrls?.[0],
    rationale: seed.rationale,
    provenance: seed.provenance,
    versionPin: seed.sourceType === "built-in" ? "system-preinstalled" : "pending-source-resolution",
    maintenanceSignal: seed.maintenanceSignal,
    overlapScore: seed.overlapScore,
    riskScore: seed.riskScore,
    notes: seed.notes,
  };
}

async function fetchFirstReachable(urls: string[] | undefined): Promise<{
  url: string;
  title: string;
  sourceType: SkillCandidate["sourceType"];
  versionPin: string;
} | null> {
  if (!urls || urls.length === 0) {
    return null;
  }

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "revenue-os/0.1",
        },
      });

      if (!response.ok) {
        continue;
      }

      const raw = await response.text();
      const titleMatch = raw.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim() ?? url;
      return {
        url,
        title,
        sourceType: url.includes("github.com") ? "github" : "clawhub",
        versionPin: `sha256:${createHash("sha256").update(raw).digest("hex").slice(0, 12)}`,
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function discoverWorkspaceSkills(): Promise<SkillCandidate[]> {
  let files: string[] = [];
  try {
    files = await listMarkdownFiles(resolveRepoPath("skills", "internal"));
  } catch {
    files = [];
  }
  const candidates = files
    .filter((filePath) => filePath.endsWith("SKILL.md"))
    .map((filePath) => {
      const slug = filePath.split(/[\\/]/).slice(-2, -1)[0] ?? "internal-skill";
      return {
        id: `workspace-${slug}`,
        slug,
        source: "Workspace internal skill",
        sourceType: "workspace" as const,
        stage: "prod" as const,
        discoveredAt: new Date().toISOString(),
        discoveryMode: "workspace" as const,
        sourceUrl: filePath,
        rationale: "Internal skill already present in the workspace and available for reuse.",
        provenance: "Discovered by scanning skills/internal.",
        versionPin: `workspace:${slug}`,
        maintenanceSignal: 8.2,
        overlapScore: 8.8,
        riskScore: 2.3,
        notes: "Internal workspace skill available for packaging or reuse.",
      };
    });

  return candidates.map((candidate) => ({
    ...candidate,
    riskScore: scoreRisk(candidate),
  }));
}

export function seedSkillCandidates(): SkillCandidate[] {
  return SEED_DESCRIPTORS.map((seed) => {
    const candidate = baseCandidate(seed);
    return {
      ...candidate,
      riskScore: scoreRisk(candidate),
    };
  });
}

export async function discoverSkillCandidates(): Promise<SkillCandidate[]> {
  const discovered: SkillCandidate[] = [];

  for (const seed of SEED_DESCRIPTORS) {
    const candidate = baseCandidate(seed);
    if (candidate.sourceType === "built-in") {
      discovered.push({
        ...candidate,
        riskScore: scoreRisk(candidate),
      });
      continue;
    }

    const remote = await fetchFirstReachable(seed.preferredUrls);
    if (!remote) {
      discovered.push({
        ...candidate,
        riskScore: scoreRisk(candidate),
      });
      continue;
    }

    const resolved: SkillCandidate = {
      ...candidate,
      source: remote.title,
      sourceType: remote.sourceType,
      sourceUrl: remote.url,
      discoveryMode: remote.sourceType === "clawhub" ? "clawhub" : "github",
      stage: "quarantine",
      versionPin: remote.versionPin,
      provenance: `${candidate.provenance} Resolved to a live ${remote.sourceType} page during discovery.`,
      notes: `${candidate.notes} Candidate resolved to ${remote.url}.`,
    };

    discovered.push({
      ...resolved,
      riskScore: scoreRisk(resolved),
    });
  }

  const workspace = await discoverWorkspaceSkills();
  return [...discovered, ...workspace];
}

export function buildSkillIntakeMarkdown(candidates: SkillCandidate[]): string {
  const rows = candidates.map((candidate) => [
    candidate.slug,
    candidate.stage,
    candidate.discoveryMode ?? "seeded",
    String(candidate.overlapScore),
    String(candidate.riskScore),
    candidate.versionPin,
  ]);

  return `# Skill Intake

## Current queue

${renderTable(["Skill", "Stage", "Discovery", "Overlap", "Risk", "Version pin"], rows)}

## Promotion policy

- Capture source provenance before promotion.
- Pin a version, hash, or workspace ref before stage evaluation.
- Treat third-party skills as supply-chain risk until local code review and evals pass.
- Promote only after quarantine -> stage -> prod evidence exists.
`;
}
