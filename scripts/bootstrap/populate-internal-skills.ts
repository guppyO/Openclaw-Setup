import { resolveRepoPath, writeTextFile } from "../../services/common/fs.js";

interface SkillDefinition {
  name: string;
  title: string;
  description: string;
  body: string;
}

const SKILLS: SkillDefinition[] = [
  {
    name: "opportunity-ranker",
    title: "Opportunity Ranker",
    description:
      "Score, compare, and rank revenue opportunities for Revenue OS. Use when new lanes, adjacent niches, or active experiments need a durable risk-adjusted ranking and a concise decision on where to allocate effort next.",
    body: `# Opportunity Ranker

Score every candidate lane on expected value, confidence, speed, capital efficiency, distribution fit, automation suitability, platform risk, compliance friction, and compounding potential.

## Workflow

1. Collect the lane thesis, monetization route, required assets, required accounts, and the first bounded experiment.
2. Record the numeric inputs already used by Revenue OS: expected value, confidence, speed to launch, speed to revenue, capital efficiency, platform risk, distribution efficiency, build complexity, maintenance burden, compounding potential, automation suitability, synergy, payout readiness, and compliance friction.
3. Produce a ranked list with the winning lane first and explain the top two reasons it won plus the main risk that could invalidate the ranking.
4. If two lanes are close, recommend the smaller and faster experiment rather than broadening scope.

## Output

- ranked table or bullet list,
- one recommended lane,
- one bounded next action for research, builder, or distribution,
- one kill condition that would lower the lane's priority.`,
  },
  {
    name: "initiative-bootstrapper",
    title: "Initiative Bootstrapper",
    description:
      "Create the durable file set for a new initiative. Use when Revenue OS starts a new experiment, lane, or internal project and needs Prompt.md, Plan.md, Implement.md, and Documentation.md files with validations and operating notes.",
    body: `# Initiative Bootstrapper

Create durable initiative files so long-horizon work does not live only in chat context.

## Required files

- Prompt.md: target, constraints, done-when.
- Plan.md: milestones, acceptance criteria, validation commands.
- Implement.md: operating runbook and deployment notes.
- Documentation.md: live status, decisions, known issues, next steps.

## Workflow

1. Name the initiative with a short stable slug.
2. Write a narrow first milestone that can be validated without future assumptions.
3. Include exact commands, URLs, or files required to verify the milestone.
4. Record blockers separately from next actions so the rest of the company can keep moving.

## Output

- the four files above,
- a first validation command list,
- the next owner and review date.`,
  },
  {
    name: "landing-page-launcher",
    title: "Landing Page Launcher",
    description:
      "Build and validate a bounded landing-page launch package. Use when Revenue OS needs a revenue experiment page, marketplace support page, offer page, or lead capture surface with analytics hooks and evidence capture.",
    body: `# Landing Page Launcher

Ship a bounded offer page that can collect evidence quickly.

## Checklist

1. Lock the offer, target persona, proof points, and call to action before changing layout.
2. Include analytics, evidence capture, support contact, and disclosure requirements.
3. Generate a lightweight support page or FAQ if the offer creates buyer questions.
4. Keep copy specific to the niche; avoid generic AI claims.

## Validation

- page loads locally,
- core CTA is visible on mobile and desktop,
- analytics hook exists,
- screenshot or HTML artifact is stored for evidence.

## Output

- page files,
- launch checklist status,
- gaps that block publication.`,
  },
  {
    name: "changelog-delta-summarizer",
    title: "Changelog Delta Summarizer",
    description:
      "Summarize official product, API, or changelog deltas into operational impact. Use when OpenAI, OpenClaw, Wise, or adopted skills change and Revenue OS needs a short decision-ready delta with rollout implications.",
    body: `# Changelog Delta Summarizer

Convert noisy release notes into decisions.

## Workflow

1. Compare the latest official source against the prior snapshot.
2. Extract only the changes that affect models, auth, limits, memory, browser, billing, or automation behavior.
3. Classify each change as awareness-only, stage-required, or prod-blocking.
4. Recommend the smallest safe next action: ignore, patch stage, rehearse, promote, or rollback.

## Output

- one-paragraph summary,
- bullet list of impactful deltas,
- operational classification,
- exact follow-up action and owner.`,
  },
  {
    name: "treasury-reconciliation",
    title: "Treasury Reconciliation",
    description:
      "Reconcile balances, ledger entries, and experiment tags for Revenue OS. Use when treasury state must be normalized, unexplained spend appears, or ROI and runway views need to be refreshed from current ledger data.",
    body: `# Treasury Reconciliation

Keep the money layer clean enough for autonomous allocation.

## Workflow

1. Refresh current balances and capability flags.
2. Normalize each ledger entry with merchant, category, initiative tag, and recurring flag.
3. Flag entries that are large, uncategorized, duplicated, or outside the spend envelope.
4. Update recurring burn, runway, and initiative ROI views.

## Output

- updated ledger or reconciliation note,
- suspicious spend list,
- runway statement,
- budget release or freeze recommendation.`,
  },
  {
    name: "browser-login-runbook",
    title: "Browser Login Runbook",
    description:
      "Handle authenticated browser workflows safely. Use when Revenue OS needs to check session health, choose managed vs attached browser mode, record login blockers, or capture evidence from authenticated pages without guessing.",
    body: `# Browser Login Runbook

Choose the safest browser path before touching an authenticated page.

## Decision rules

1. Use managed browser for commodity research and low-trust flows.
2. Use attached Chrome relay for existing sessions, sensitive account pages, or sites that reject headless mode.
3. Record which mode was used, whether the session was fresh, and where evidence was stored.
4. If login fails, write the exact step that failed and continue other work instead of looping blindly.

## Output

- chosen browser mode,
- session-health status,
- captured evidence path,
- remaining blocker if manual action is still required.`,
  },
  {
    name: "revenue-lane-scorer",
    title: "Revenue Lane Scorer",
    description:
      "Evaluate lane families for durable growth. Use when Revenue OS needs to compare lane classes such as software, services, content, marketplaces, data products, or affiliate paths before choosing a portfolio focus.",
    body: `# Revenue Lane Scorer

Score lane families before scoring niche instances inside them.

## Criteria

- expected durability,
- time to cash,
- capital intensity,
- automation fit,
- compliance friction,
- payout readiness,
- platform concentration risk,
- compounding potential.

## Output

- ranked lane families,
- recommended family for the next experiment cycle,
- one adjacent family worth watching but not funding yet.`,
  },
  {
    name: "skill-canary-evaluator",
    title: "Skill Canary Evaluator",
    description:
      "Stage and evaluate a candidate skill before promotion. Use when Revenue OS is considering a third-party or internal skill and needs a quarantine, stage, eval, and promotion or rejection decision.",
    body: `# Skill Canary Evaluator

Promote skills only with evidence.

## Workflow

1. Capture source provenance, version pin, and trust boundary.
2. Review code or instructions for obvious exfiltration, mutation, or policy risk.
3. Run the smallest representative eval that proves the skill helps rather than harms.
4. Decide: reject, keep in quarantine, promote to stage, or promote to prod.

## Output

- promotion decision,
- main risk,
- eval result,
- next action if still pending.`,
  },
];

async function main(): Promise<void> {
  for (const skill of SKILLS) {
    const contents = `---\nname: ${skill.name}\ndescription: "${skill.description}"\n---\n\n${skill.body}\n`;
    await writeTextFile(resolveRepoPath("skills", "internal", skill.name, "SKILL.md"), contents);
  }

  console.log(`Populated ${SKILLS.length} internal skills.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
