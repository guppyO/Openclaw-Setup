import type { SkillCandidate } from "../common/types.js";
import { renderTable } from "../common/markdown.js";

function scoreRisk(candidate: SkillCandidate): number {
  const sourcePenalty =
    candidate.sourceType === "built-in" ? 1 :
    candidate.sourceType === "workspace" ? 2 :
    candidate.sourceType === "github" ? 5 :
    6;

  const stageBonus =
    candidate.stage === "prod" ? -2 :
    candidate.stage === "stage" ? -1 :
    candidate.stage === "quarantine" ? 1 :
    2;

  return Math.max(0, Math.min(10, Number((candidate.riskScore + sourcePenalty + stageBonus).toFixed(1))));
}

export function seedSkillCandidates(): SkillCandidate[] {
  const seeds: SkillCandidate[] = [
    {
      id: "skill-find-skills",
      slug: "find-skills",
      source: "ClawHub candidate search required",
      sourceType: "clawhub",
      stage: "seeded",
      rationale: "Explicit operator request and likely leverage for discovery loops.",
      provenance: "Seeded from build prompt.",
      versionPin: "pending-source-resolution",
      maintenanceSignal: 6.5,
      overlapScore: 8.7,
      riskScore: 5.2,
      notes: "Locate canonical source before any promotion.",
    },
    {
      id: "skill-clawddocs",
      slug: "clawddocs",
      source: "ClawHub candidate search required",
      sourceType: "clawhub",
      stage: "seeded",
      rationale: "Could improve documentation retrieval and OpenClaw adaptation speed.",
      provenance: "Seeded from build prompt.",
      versionPin: "pending-source-resolution",
      maintenanceSignal: 6.2,
      overlapScore: 8.3,
      riskScore: 5.6,
      notes: "Verify source availability and compatibility with current OpenClaw release.",
    },
    {
      id: "skill-skill-creator",
      slug: "skill-creator",
      source: "Preinstalled Codex system skill",
      sourceType: "built-in",
      stage: "prod",
      rationale: "Required for internal skill creation workflow.",
      provenance: "Local Codex system skill present in this session.",
      versionPin: "system-preinstalled",
      maintenanceSignal: 9.0,
      overlapScore: 9.2,
      riskScore: 1.2,
      notes: "Use for internal skills; treat as trusted within the Codex boundary.",
    },
    {
      id: "skill-proactive-agent",
      slug: "proactive-agent",
      source: "ClawHub or GitHub lookup required",
      sourceType: "clawhub",
      stage: "seeded",
      rationale: "Maps directly to always-on autonomy patterns but must be supply-chain vetted.",
      provenance: "Seeded from build prompt.",
      versionPin: "pending-source-resolution",
      maintenanceSignal: 5.5,
      overlapScore: 8.8,
      riskScore: 6.0,
      notes: "Potentially high leverage; high trust review required.",
    },
    {
      id: "skill-self-improving-agent",
      slug: "self-improving-agent",
      source: "ClawHub or GitHub lookup required",
      sourceType: "clawhub",
      stage: "seeded",
      rationale: "Maps directly to continuous self-improvement objective.",
      provenance: "Seeded from build prompt.",
      versionPin: "pending-source-resolution",
      maintenanceSignal: 5.8,
      overlapScore: 9.1,
      riskScore: 6.3,
      notes: "Do not promote without deterministic evals and mutation boundaries.",
    },
  ];

  return seeds.map((candidate) => ({
    ...candidate,
    riskScore: scoreRisk(candidate),
  }));
}

export function buildSkillIntakeMarkdown(candidates: SkillCandidate[]): string {
  const rows = candidates.map((candidate) => [
    candidate.slug,
    candidate.stage,
    String(candidate.overlapScore),
    String(candidate.riskScore),
    candidate.versionPin,
  ]);

  return `# Skill Intake

## Current queue

${renderTable(["Skill", "Stage", "Overlap", "Risk", "Version pin"], rows)}

## Promotion policy

- Capture source provenance before promotion.
- Pin a version or commit before stage evaluation.
- Treat third-party skills as supply-chain risk until local code review and evals pass.
- Promote only after quarantine -> stage -> prod evidence exists.
`;
}
