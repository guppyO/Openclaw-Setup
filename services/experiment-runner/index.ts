import type { Experiment, Opportunity, QueueItem } from "../common/types.js";

function futureIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function queueItem(
  id: string,
  title: string,
  owner: QueueItem["owner"],
  initiativeId: string,
  reason: QueueItem["reason"],
  priority: number,
  offsetHours: number,
  notes: string,
): QueueItem {
  return {
    id,
    title,
    owner,
    initiativeId,
    reason,
    priority,
    dueAt: new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString(),
    notes,
  };
}

function buildExperimentActions(opportunity: Opportunity, index: number): QueueItem[] {
  return [
    queueItem(
      `${opportunity.id}-offer`,
      `Define the first bounded offer for ${opportunity.title}`,
      "ceo",
      opportunity.id,
      "highest-ev-open-experiment",
      100 - index,
      2,
      "Lock the smallest revenue-bearing offer, budget cap, and kill criteria.",
    ),
    queueItem(
      `${opportunity.id}-asset`,
      `Build launch assets for ${opportunity.title}`,
      "builder",
      opportunity.id,
      "highest-priority-product-backlog",
      92 - index,
      6,
      "Ship a landing page, support docs, and measurement hooks.",
    ),
    queueItem(
      `${opportunity.id}-distribution`,
      `Remove the first distribution bottleneck for ${opportunity.title}`,
      "distribution",
      opportunity.id,
      "distribution-bottleneck",
      88 - index,
      12,
      "Set the initial channel mix and evidence capture for first traffic.",
    ),
  ];
}

export function createExperiments(opportunities: Opportunity[]): Experiment[] {
  const candidates = opportunities.slice(0, 4);

  return candidates.map((opportunity, index) => {
    const budgetCapUsd = Math.max(150, Math.round(opportunity.capitalRequiredUsd * 1.25));
    return {
      id: `exp-${opportunity.id}`,
      opportunityId: opportunity.id,
      title: `Experiment: ${opportunity.title}`,
      thesis: opportunity.experimentPlan,
      status: index === 0 ? "building" : index === 1 ? "approved" : "planned",
      successMetrics: [
        "Positive contribution margin within budget envelope",
        "Evidence of repeatable acquisition channel",
        "Operator-independent runbook drafted",
      ],
      budgetCapUsd,
      launchChecklist: [
        "Define asset package and offer page",
        "Attach analytics and evidence capture",
        "Confirm treasury category and spend tags",
        "Create kill and compound review dates",
      ],
      measurementPlan: [
        "Capture spend, attributable revenue, and response rate daily",
        "Review conversion and payback time every 24 hours during launch week",
        "Update portfolio score after each milestone or anomaly",
      ],
      killThreshold: "Kill if no meaningful traction signal appears before 60% of budget cap is consumed.",
      compoundThreshold: "Compound if initial payback is visible and distribution can be expanded without sharply raising CAC.",
      reviewDate: futureIso(7 + index * 2),
      nextActions: buildExperimentActions(opportunity, index),
    };
  });
}

export function buildAutonomyQueue(opportunities: Opportunity[], experiments: Experiment[]): QueueItem[] {
  const queue: QueueItem[] = [];
  const bestExperiment = experiments[0];
  const bestOpportunity = opportunities[0];

  if (bestExperiment) {
    queue.push(bestExperiment.nextActions[0]!);
    queue.push(bestExperiment.nextActions[2]!);
  }
  if (bestOpportunity) {
    queue.push(
      queueItem(
        `${bestOpportunity.id}-research`,
        `Expand demand proof and adjacent niches for ${bestOpportunity.title}`,
        "research",
        bestOpportunity.id,
        "new-opportunity-research",
        84,
        18,
        "Find adjacent personas, offer variants, and distribution channels without widening scope beyond the current experiment envelope.",
      ),
    );
  }
  queue.push(
    queueItem(
      "skill-gap-reduction",
      "Promote the highest-leverage internal skill candidate",
      "skillsmith",
      "skill-pipeline",
      "skill-gap-reduction",
      74,
      20,
      "Convert a repeated workflow into a tested internal skill or reject the candidate with a reason.",
    ),
  );
  queue.push(
    queueItem(
      "changelog-adaptation",
      "Refresh official-source deltas and compare stage vs prod assumptions",
      "ops",
      "update-steward",
      "changelog-adaptation",
      68,
      24,
      "Generate a new source snapshot and classify any model, auth, or gateway compatibility drift.",
    ),
  );
  queue.push(
    queueItem(
      "memory-cleanup",
      "Compact initiative memory into durable docs",
      "ops",
      "memory-maintenance",
      "documentation-and-memory",
      52,
      30,
      "Summarize live working context into initiative docs so the next run starts from compact files, not bloated sessions.",
    ),
  );
  queue.push(
    queueItem(
      "resilience-check",
      "Run backup and smoke verification",
      "ops",
      "resilience",
      "resilience-work",
      48,
      36,
      "Verify backup rotation and the local dashboard/smoke path before the next promotion window.",
    ),
  );

  return queue;
}

export function buildExperimentMarkdown(experiment: Experiment, opportunity: Opportunity): string {
  return `# ${experiment.title}

## Thesis

${experiment.thesis}

## Opportunity

- Opportunity: ${opportunity.title}
- Lane family: ${opportunity.laneFamily}
- Budget cap: $${experiment.budgetCapUsd}
- Review date: ${experiment.reviewDate.slice(0, 10)}

## Launch checklist

${experiment.launchChecklist.map((item) => `- ${item}`).join("\n")}

## Measurement plan

${experiment.measurementPlan.map((item) => `- ${item}`).join("\n")}

## Thresholds

- Kill: ${experiment.killThreshold}
- Compound: ${experiment.compoundThreshold}
`;
}
