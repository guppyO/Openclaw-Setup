import type { Opportunity, OpportunityMetrics, ScoreBreakdown } from "../common/types.js";
import { renderTable } from "../common/markdown.js";

export const DEFAULT_OPPORTUNITY_WEIGHTS: Record<keyof OpportunityMetrics, number> = {
  expectedValue: 1.4,
  confidence: 1.2,
  speedToLaunch: 1.0,
  speedToRevenue: 1.2,
  capitalEfficiency: 1.1,
  platformRisk: 1.0,
  distributionEfficiency: 1.0,
  buildComplexity: 0.9,
  maintenanceBurden: 0.8,
  compoundingPotential: 1.3,
  automationSuitability: 1.1,
  synergyWithExistingAssets: 0.9,
  payoutReadiness: 1.0,
  complianceFriction: 1.0,
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(10, Number(value.toFixed(2))));
}

export function deriveOpportunityMetrics(opportunity: Opportunity): OpportunityMetrics {
  return {
    expectedValue: clampScore(
      (opportunity.expectedMarginPct / 10 + opportunity.distributionFit + opportunity.compoundingPotential) / 3,
    ),
    confidence: clampScore(opportunity.confidence),
    speedToLaunch: clampScore(10 - opportunity.timeToLaunchDays / 7),
    speedToRevenue: clampScore(10 - opportunity.timeToRevenueDays / 10),
    capitalEfficiency: clampScore(10 - opportunity.capitalRequiredUsd / 250),
    platformRisk: clampScore(opportunity.platformRisk),
    distributionEfficiency: clampScore(opportunity.distributionFit),
    buildComplexity: clampScore(opportunity.buildComplexity),
    maintenanceBurden: clampScore(opportunity.maintenanceBurden),
    compoundingPotential: clampScore(opportunity.compoundingPotential),
    automationSuitability: clampScore(opportunity.automationFit),
    synergyWithExistingAssets: clampScore(opportunity.synergy),
    payoutReadiness: clampScore((opportunity.payoutReadiness + (10 - opportunity.payoutFriction)) / 2),
    complianceFriction: clampScore(opportunity.complianceFriction),
  };
}

export function scoreOpportunity(
  opportunity: Opportunity,
  weights = DEFAULT_OPPORTUNITY_WEIGHTS,
): ScoreBreakdown {
  const metrics = deriveOpportunityMetrics(opportunity);
  const positiveKeys: Array<keyof OpportunityMetrics> = [
    "expectedValue",
    "confidence",
    "speedToLaunch",
    "speedToRevenue",
    "capitalEfficiency",
    "distributionEfficiency",
    "compoundingPotential",
    "automationSuitability",
    "synergyWithExistingAssets",
    "payoutReadiness",
  ];
  const negativeKeys: Array<keyof OpportunityMetrics> = [
    "platformRisk",
    "buildComplexity",
    "maintenanceBurden",
    "complianceFriction",
  ];

  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of positiveKeys) {
    weightedSum += metrics[key] * weights[key];
    weightTotal += weights[key];
  }

  for (const key of negativeKeys) {
    weightedSum += (10 - metrics[key]) * weights[key];
    weightTotal += weights[key];
  }

  const total = Number((weightedSum / weightTotal).toFixed(2));

  return {
    total,
    rankedScore: Number((total * 10).toFixed(1)),
    weightVersion: "2026-03-06.a",
    dimensionScores: metrics,
  };
}

export function rankOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities]
    .map((opportunity) => ({
      ...opportunity,
      score: scoreOpportunity(opportunity),
    }))
    .sort((left, right) => {
      const leftScore = left.score?.rankedScore ?? 0;
      const rightScore = right.score?.rankedScore ?? 0;
      return rightScore - leftScore;
    });
}

export function defaultOpportunities(): Opportunity[] {
  const now = new Date().toISOString();

  return [
    {
      id: "ops-audit-packs",
      title: "Operational audit packs for SMB service businesses",
      thesis: "Package agent-assisted audits, fix plans, and tracked automation setup into a repeatable paid offer with strong margin and fast proof-of-value.",
      laneFamily: "productized-service",
      monetizationRoute: "Fixed-fee audit plus recurring optimization retainer",
      demandSignals: [
        { source: "service-business pain", description: "Manual ops and quoting friction remain common in local businesses.", capturedAt: now, strength: 7.8 },
        { source: "AI adoption", description: "Businesses want AI help but need bounded and accountable delivery.", capturedAt: now, strength: 8.2 },
      ],
      requiredAssets: ["landing-page", "audit-template", "intake-form", "case-study"],
      requiredAccounts: ["ChatGPT Pro", "Codex", "OpenClaw Gateway", "Wise"],
      timeToLaunchDays: 6,
      timeToRevenueDays: 14,
      expectedMarginPct: 78,
      capitalRequiredUsd: 200,
      automationFit: 8.5,
      defensibility: 6.4,
      distributionFit: 7.9,
      complianceFriction: 2.7,
      payoutFriction: 1.5,
      buildComplexity: 4.3,
      maintenanceBurden: 4.6,
      platformRisk: 2.9,
      compoundingPotential: 8.1,
      confidence: 7.5,
      synergy: 8.4,
      payoutReadiness: 8.6,
      currentStatus: "researched",
      experimentPlan: "Launch one niche-specific landing page, outbound-compatible intake flow, and paid diagnostic offer capped at low acquisition spend.",
      liveKpis: ["qualified leads", "close rate", "gross margin", "implementation cycle time"],
    },
    {
      id: "marketplace-automation-packs",
      title: "Automation packs sold through compliant marketplaces",
      thesis: "Externalize internal workflow templates and automation bundles into small-ticket digital products that can compound with support upsells.",
      laneFamily: "digital-products",
      monetizationRoute: "Marketplace sales plus support upsell and bundle expansion",
      demandSignals: [
        { source: "creator economy", description: "Templates and automation kits remain attractive for buyers wanting fast implementation.", capturedAt: now, strength: 7.4 },
        { source: "distribution leverage", description: "Marketplace demand can shorten time to first sale if listing quality is high.", capturedAt: now, strength: 7.1 },
      ],
      requiredAssets: ["product-package", "screenshots", "listing-copy", "support-docs"],
      requiredAccounts: ["Marketplace account", "Wise"],
      timeToLaunchDays: 9,
      timeToRevenueDays: 18,
      expectedMarginPct: 86,
      capitalRequiredUsd: 120,
      automationFit: 9.2,
      defensibility: 5.8,
      distributionFit: 7.2,
      complianceFriction: 2.0,
      payoutFriction: 2.5,
      buildComplexity: 4.8,
      maintenanceBurden: 3.8,
      platformRisk: 5.2,
      compoundingPotential: 8.9,
      confidence: 7.0,
      synergy: 9.1,
      payoutReadiness: 7.4,
      currentStatus: "scored",
      experimentPlan: "Package two internal workflow assets into a starter bundle and A/B test listings across one primary marketplace and one owned landing page.",
      liveKpis: ["visitors", "purchase conversion", "refund rate", "upsell attach rate"],
    },
    {
      id: "niche-lead-gen-sites",
      title: "Niche lead-gen sites with qualified buyer routing",
      thesis: "Build a diversified lead-generation portfolio where SEO and utilities capture demand and route qualified buyers to vetted partners or internal service offers.",
      laneFamily: "owned-media",
      monetizationRoute: "Lead fees, affiliate commissions, and in-house service upsell",
      demandSignals: [
        { source: "search intent", description: "High-intent long-tail queries still reward specialized content and useful tools.", capturedAt: now, strength: 8.4 },
        { source: "buyer routing", description: "Local and niche buyers continue to prefer guided comparisons over cold outreach.", capturedAt: now, strength: 7.8 },
      ],
      requiredAssets: ["content-cluster", "comparison-tool", "analytics", "lead-routing"],
      requiredAccounts: ["Domain registrar", "Hosting", "Analytics"],
      timeToLaunchDays: 12,
      timeToRevenueDays: 30,
      expectedMarginPct: 88,
      capitalRequiredUsd: 320,
      automationFit: 8.7,
      defensibility: 7.3,
      distributionFit: 8.5,
      complianceFriction: 3.2,
      payoutFriction: 3.0,
      buildComplexity: 5.6,
      maintenanceBurden: 5.1,
      platformRisk: 3.6,
      compoundingPotential: 9.4,
      confidence: 7.8,
      synergy: 8.0,
      payoutReadiness: 7.0,
      currentStatus: "researched",
      experimentPlan: "Pick one underserved niche, launch a comparison page and lead magnet, then route qualified traffic to a disclosed partner or owned offer.",
      liveKpis: ["organic sessions", "CPL", "lead qualification rate", "revenue per page"],
    },
    {
      id: "micro-saas-connectors",
      title: "Micro-SaaS connectors externalized from internal tooling",
      thesis: "Turn internal automations into narrowly scoped integrations that save teams time and justify recurring subscription revenue.",
      laneFamily: "software",
      monetizationRoute: "Recurring subscription with setup and migration add-ons",
      demandSignals: [
        { source: "workflow fragmentation", description: "Small teams still pay for narrow automation wins if setup is simple.", capturedAt: now, strength: 7.3 },
        { source: "internal leverage", description: "Existing internal tooling shortens build time and raises product authenticity.", capturedAt: now, strength: 8.0 },
      ],
      requiredAssets: ["landing-page", "connector-app", "support-portal", "docs-site"],
      requiredAccounts: ["Hosting", "Payment processor", "Support inbox"],
      timeToLaunchDays: 18,
      timeToRevenueDays: 35,
      expectedMarginPct: 82,
      capitalRequiredUsd: 650,
      automationFit: 8.2,
      defensibility: 7.1,
      distributionFit: 6.8,
      complianceFriction: 4.0,
      payoutFriction: 2.8,
      buildComplexity: 7.2,
      maintenanceBurden: 6.9,
      platformRisk: 4.4,
      compoundingPotential: 9.0,
      confidence: 6.3,
      synergy: 7.6,
      payoutReadiness: 7.8,
      currentStatus: "discovered",
      experimentPlan: "Release a single connector as a paid beta with manual onboarding and tight instrumentation before broadening scope.",
      liveKpis: ["beta signups", "activation", "MRR", "support load"],
    },
    {
      id: "ai-content-repurposer",
      title: "Repurposing engine for expert-led content portfolios",
      thesis: "Offer an autonomous content repurposing and publication system as a managed productized service for experts and small media brands.",
      laneFamily: "service-plus-software",
      monetizationRoute: "Monthly retainer with optional content-ops software tier",
      demandSignals: [
        { source: "content fatigue", description: "Expert creators want output without running full content teams.", capturedAt: now, strength: 7.6 },
        { source: "agent fit", description: "Agentic drafting, clipping, and distribution are highly automatable with review layers.", capturedAt: now, strength: 8.5 },
      ],
      requiredAssets: ["offer-page", "workflow-demo", "content-pipeline", "analytics"],
      requiredAccounts: ["Social tools", "Analytics", "Wise"],
      timeToLaunchDays: 7,
      timeToRevenueDays: 16,
      expectedMarginPct: 74,
      capitalRequiredUsd: 180,
      automationFit: 9.4,
      defensibility: 6.0,
      distributionFit: 7.7,
      complianceFriction: 2.5,
      payoutFriction: 1.6,
      buildComplexity: 4.7,
      maintenanceBurden: 5.4,
      platformRisk: 4.8,
      compoundingPotential: 7.9,
      confidence: 7.1,
      synergy: 8.7,
      payoutReadiness: 8.3,
      currentStatus: "approved",
      experimentPlan: "Target one expert persona, produce a tightly defined monthly repurposing package, and operationalize delivery around deterministic checklists.",
      liveKpis: ["proposal-to-close", "gross margin", "retention", "hours per account"],
    },
    {
      id: "licensed-data-briefs",
      title: "Licensed data briefs for recurring market niches",
      thesis: "Package curated market and operational data into paid briefings and datasets for niche buyers who value speed over building their own intelligence stack.",
      laneFamily: "data-product",
      monetizationRoute: "Subscriptions, one-off briefs, and enterprise licensing",
      demandSignals: [
        { source: "time scarcity", description: "Operators pay for faster access to compiled data in markets they already understand.", capturedAt: now, strength: 6.8 },
        { source: "repeatable research", description: "Automated collection and summarization can lower production cost substantially.", capturedAt: now, strength: 7.5 },
      ],
      requiredAssets: ["data-pipeline", "brief-template", "subscriber-page", "archive"],
      requiredAccounts: ["Data providers", "Hosting", "Wise"],
      timeToLaunchDays: 15,
      timeToRevenueDays: 28,
      expectedMarginPct: 79,
      capitalRequiredUsd: 280,
      automationFit: 8.9,
      defensibility: 7.7,
      distributionFit: 6.4,
      complianceFriction: 4.9,
      payoutFriction: 1.8,
      buildComplexity: 6.1,
      maintenanceBurden: 6.5,
      platformRisk: 2.6,
      compoundingPotential: 8.6,
      confidence: 6.6,
      synergy: 7.2,
      payoutReadiness: 8.4,
      currentStatus: "discovered",
      experimentPlan: "Ship one premium niche brief with a fixed format, limited founding cohort, and clear refresh cadence before broadening coverage.",
      liveKpis: ["subscriber conversion", "renewal rate", "gross margin", "dataset reuse"],
    },
  ];
}

export function buildPortfolioMarkdown(opportunities: Opportunity[]): string {
  const ranked = rankOpportunities(opportunities);
  const rows = ranked.slice(0, 6).map((opportunity) => [
    opportunity.title,
    opportunity.laneFamily,
    String(opportunity.score?.rankedScore ?? 0),
    opportunity.currentStatus,
    `${opportunity.timeToRevenueDays}d`,
    `$${opportunity.capitalRequiredUsd}`,
  ]);

  return `# Opportunity Portfolio

## Objective

Maintain a diversified revenue lane graph, rank opportunities by durable risk-adjusted value, and always leave the company with productive next actions.

## Top lanes

${renderTable(["Opportunity", "Family", "Score", "Status", "Time to revenue", "Capital"], rows)}

## Scoring notes

- Higher scores reflect faster and more durable paths to cash with lower operational drag.
- Platform risk, build complexity, maintenance burden, and compliance friction are treated as penalties.
- The scoring formula is configurable in the service implementation.
`;
}
