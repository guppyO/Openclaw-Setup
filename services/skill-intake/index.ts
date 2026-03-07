import path from "node:path";

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
  githubQuery?: string;
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
    notes: "Resolve a real ClawHub skill page or GitHub repo before promotion.",
    githubQuery: "find-skills openclaw skill",
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
    githubQuery: "clawddocs openclaw skill",
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
    githubQuery: "proactive-agent openclaw skill",
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
    githubQuery: "self-improving-agent openclaw skill",
  },
];

interface GithubRepository {
  html_url: string;
  full_name: string;
  default_branch: string;
}

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
    rationale: seed.rationale,
    provenance: seed.provenance,
    versionPin: seed.sourceType === "built-in" ? "system-preinstalled" : "pending-source-resolution",
    pinKind: seed.sourceType === "built-in" ? "built-in" : "unresolved",
    maintenanceSignal: seed.maintenanceSignal,
    overlapScore: seed.overlapScore,
    riskScore: seed.riskScore,
    notes: seed.notes,
  };
}

async function resolveGithubRepository(query: string | undefined): Promise<GithubRepository | null> {
  if (!query) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=1`,
      {
        headers: {
          "user-agent": "revenue-os/0.1",
          accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      items?: GithubRepository[];
    };

    return payload.items?.[0] ?? null;
  } catch {
    return null;
  }
}

async function resolveGithubCommit(repository: GithubRepository): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository.full_name}/commits/${encodeURIComponent(repository.default_branch)}`,
      {
        headers: {
          "user-agent": "revenue-os/0.1",
          accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { sha?: string };
    return payload.sha ?? null;
  } catch {
    return null;
  }
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
        sourceUrl: path.relative(resolveRepoPath(), filePath).replace(/\\/g, "/"),
        rationale: "Internal skill already present in the workspace and available for reuse.",
        provenance: "Discovered by scanning skills/internal.",
        versionPin: `workspace:${slug}`,
        pinKind: "workspace" as const,
        artifactUrl: path.relative(resolveRepoPath(), filePath).replace(/\\/g, "/"),
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

    const repository = await resolveGithubRepository(seed.githubQuery);
    if (!repository) {
      discovered.push({
        ...candidate,
        riskScore: scoreRisk(candidate),
      });
      continue;
    }

    const commitSha = await resolveGithubCommit(repository);
    const versionPin = commitSha ? `git:${commitSha.slice(0, 12)}` : "pending-source-resolution";
    const pinKind = commitSha ? "github-commit" : "unresolved";
    const artifactUrl = commitSha ? `${repository.html_url}/tree/${commitSha}` : repository.html_url;

    const resolved: SkillCandidate = {
      ...candidate,
      source: repository.full_name,
      sourceType: "github",
      sourceUrl: repository.html_url,
      discoveryMode: "github",
      stage: commitSha ? "quarantine" : "seeded",
      versionPin,
      pinKind,
      artifactUrl,
      provenance: `${candidate.provenance} Resolved to GitHub repository ${repository.full_name}.`,
      notes: `${candidate.notes} Candidate resolved to ${artifactUrl}.`,
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
    candidate.pinKind,
    candidate.versionPin,
    String(candidate.riskScore),
  ]);

  return `# Skill Intake

## Current queue

${renderTable(["Skill", "Stage", "Discovery", "Pin kind", "Version pin", "Risk"], rows)}

## Promotion policy

- Capture source provenance before promotion.
- Pin a real artifact, commit, release tag, or workspace ref before stage evaluation.
- Treat third-party skills as supply-chain risk until local code review and evals pass.
- Promote only after quarantine -> stage -> prod evidence exists.
`;
}
