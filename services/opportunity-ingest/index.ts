import path from "node:path";

import { defaultOpportunities, rankOpportunities } from "../opportunity-engine/index.js";
import { listMarkdownFiles, readJsonFile, readTextFile, resolveRepoPath } from "../common/fs.js";
import type { Opportunity } from "../common/types.js";

interface OpportunityFeedSource {
  id: string;
  label: string;
  url: string;
  laneFamily: Opportunity["laneFamily"];
  monetizationRoute: string;
  requiredAssets: string[];
  requiredAccounts: string[];
  experimentPlan: string;
  liveKpis: string[];
}

interface FeedItem {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
}

const LIVE_FEED_SOURCES: OpportunityFeedSource[] = [
  {
    id: "hn-productized-service",
    label: "HNRSS productized service automation",
    url: "https://hnrss.org/newest?q=productized+service+automation",
    laneFamily: "productized-service",
    monetizationRoute: "Fixed-fee diagnostic plus recurring implementation or optimization work",
    requiredAssets: ["offer-page", "intake-form", "runbook", "case-study"],
    requiredAccounts: ["Company Gmail", "Wise", "OpenClaw Gateway"],
    experimentPlan: "Publish one bounded service offer around the strongest repeated pain signal and validate with an intake-first launch.",
    liveKpis: ["qualified replies", "discovery calls", "close rate", "gross margin"],
  },
  {
    id: "hn-marketplace",
    label: "HNRSS marketplace template demand",
    url: "https://hnrss.org/newest?q=automation+template+marketplace",
    laneFamily: "digital-products",
    monetizationRoute: "Marketplace sales plus bundle or support upsell",
    requiredAssets: ["listing-copy", "screenshots", "support-docs", "product-package"],
    requiredAccounts: ["Marketplace account", "Wise", "Company Gmail"],
    experimentPlan: "Package one reusable automation or template offer and test it on a marketplace plus an owned landing page.",
    liveKpis: ["listing views", "conversion rate", "refund rate", "support load"],
  },
  {
    id: "hn-lead-gen",
    label: "HNRSS lead generation and SEO pain",
    url: "https://hnrss.org/newest?q=lead+generation+seo+automation",
    laneFamily: "owned-media",
    monetizationRoute: "Lead fees, affiliate payouts, and owned service upsell",
    requiredAssets: ["comparison-page", "analytics", "lead-routing", "content-cluster"],
    requiredAccounts: ["Domain registrar", "Hosting", "Analytics"],
    experimentPlan: "Launch a narrow comparison or lead-capture surface around a repeated pain cluster and route the first qualified demand.",
    liveKpis: ["organic visits", "lead conversion", "qualified leads", "revenue per lead"],
  },
  {
    id: "hn-micro-saas",
    label: "HNRSS micro-SaaS automation demand",
    url: "https://hnrss.org/newest?q=micro+saas+automation",
    laneFamily: "software",
    monetizationRoute: "Subscription plus setup or migration assistance",
    requiredAssets: ["landing-page", "docs-site", "beta-onboarding", "usage-tracking"],
    requiredAccounts: ["Hosting", "Wise", "Support inbox"],
    experimentPlan: "Turn one narrow internal automation into a paid beta with manual onboarding and strong instrumentation.",
    liveKpis: ["beta signups", "activation", "MRR", "support burden"],
  },
];

function clampScore(value: number, min = 0, max = 10): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Number(value.toFixed(1))));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string): string {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripHtml(match?.[1] ?? "");
}

function parseRssItems(raw: string): FeedItem[] {
  const items = raw.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => ({
    title: extractTag(item, "title"),
    url: extractTag(item, "link"),
    publishedAt: extractTag(item, "pubDate") || new Date().toISOString(),
    summary: extractTag(item, "description"),
  }));
}

async function fetchFeedItems(source: OpportunityFeedSource): Promise<FeedItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "revenue-os/0.1",
      },
    });

    if (!response.ok) {
      return [];
    }

    const raw = await response.text();
    return parseRssItems(raw).slice(0, 3);
  } catch {
    return [];
  }
}

function baseOpportunityFromFeed(
  source: OpportunityFeedSource,
  item: FeedItem,
  index: number,
): Opportunity {
  const now = new Date().toISOString();
  const title = item.title || `${source.label} signal ${index + 1}`;
  const emphasis = `${title}. ${item.summary}`.toLowerCase();
  const speedBonus = emphasis.includes("launch") || emphasis.includes("template") ? 1.5 : 0;
  const automationBonus = emphasis.includes("automation") || emphasis.includes("agent") ? 1.2 : 0;
  const payoutBonus = emphasis.includes("subscription") || emphasis.includes("payment") ? 0.7 : 0;

  return {
    id: `discovered-${slugify(source.id)}-${slugify(title)}`,
    title: `${title} opportunity`,
    thesis: `Live discovery signal from ${source.label}: ${title}. ${item.summary || "Investigate whether this demand signal can be converted into a bounded offer."}`,
    laneFamily: source.laneFamily,
    monetizationRoute: source.monetizationRoute,
    demandSignals: [
      {
        source: source.label,
        description: item.summary || title,
        capturedAt: now,
        strength: clampScore(6.8 + automationBonus + payoutBonus - index * 0.3),
        url: item.url,
      },
    ],
    requiredAssets: source.requiredAssets,
    requiredAccounts: source.requiredAccounts,
    timeToLaunchDays: Math.max(4, 11 - index * 2 - speedBonus),
    timeToRevenueDays: Math.max(9, 24 - index * 3 - speedBonus),
    expectedMarginPct: clampScore(73 + automationBonus * 5 - index * 2, 45, 92),
    capitalRequiredUsd: Math.max(90, 240 - index * 30),
    automationFit: clampScore(7.2 + automationBonus),
    defensibility: clampScore(5.8 + (emphasis.includes("niche") ? 1 : 0)),
    distributionFit: clampScore(7.0 + (emphasis.includes("seo") || emphasis.includes("marketplace") ? 0.8 : 0)),
    complianceFriction: clampScore(2.8 + (emphasis.includes("finance") ? 2 : 0)),
    payoutFriction: clampScore(2.0 + (payoutBonus > 0 ? -0.3 : 0)),
    buildComplexity: clampScore(4.8 + (source.laneFamily === "software" ? 2 : 0)),
    maintenanceBurden: clampScore(4.5 + (source.laneFamily === "owned-media" ? 1.2 : 0)),
    platformRisk: clampScore(3.4 + (source.laneFamily === "digital-products" ? 1.4 : 0)),
    compoundingPotential: clampScore(7.8 + (source.laneFamily === "owned-media" ? 1.3 : 0)),
    confidence: clampScore(6.2 + (item.url ? 0.6 : 0) - index * 0.3),
    synergy: clampScore(7.5 + automationBonus),
    payoutReadiness: clampScore(7.3 + payoutBonus),
    currentStatus: "discovered",
    experimentPlan: source.experimentPlan,
    liveKpis: source.liveKpis,
    origin: "discovered",
    sourceEvidence: [
      {
        sourceId: source.id,
        capturedAt: item.publishedAt || now,
        url: item.url,
        note: `Live feed signal from ${source.label}: ${title}`,
        method: "feed",
      },
    ],
  };
}

async function discoverFeedOpportunities(): Promise<Opportunity[]> {
  const discovered: Opportunity[] = [];

  for (const source of LIVE_FEED_SOURCES) {
    const items = await fetchFeedItems(source);
    for (const [index, item] of items.entries()) {
      discovered.push(baseOpportunityFromFeed(source, item, index));
    }
  }

  return discovered;
}

async function discoverInternalAssetReuseOpportunities(): Promise<Opportunity[]> {
  let internalSkillFiles: string[] = [];
  try {
    internalSkillFiles = await listMarkdownFiles(resolveRepoPath("skills", "internal"));
  } catch {
    internalSkillFiles = [];
  }
  const internalSkills = internalSkillFiles.filter((filePath) => path.basename(filePath) === "SKILL.md");
  const now = new Date().toISOString();
  if (internalSkills.length === 0) {
    return [];
  }

  const skillNames = internalSkills
    .slice(0, 4)
    .map((filePath) => path.basename(path.dirname(filePath)));

  return [
    {
      id: "discovered-internal-skill-packs",
      title: "Externalize internal workflow assets as paid automation packs",
      thesis: `The repo already contains reusable internal skills (${skillNames.join(", ")}). Package the most repeatable workflow into a sellable automation pack or implementation offer.`,
      laneFamily: "digital-products",
      monetizationRoute: "Paid workflow packs plus setup assistance",
      demandSignals: [
        {
          source: "internal-asset-reuse",
          description: `Detected ${internalSkills.length} internal skill assets suitable for external packaging.`,
          capturedAt: now,
          strength: clampScore(6.5 + Math.min(2, internalSkills.length / 4)),
        },
      ],
      requiredAssets: ["product-package", "screenshots", "offer-page", "support-docs"],
      requiredAccounts: ["Wise", "Company Gmail", "Marketplace account"],
      timeToLaunchDays: 5,
      timeToRevenueDays: 12,
      expectedMarginPct: 84,
      capitalRequiredUsd: 110,
      automationFit: 9.1,
      defensibility: 6.7,
      distributionFit: 7.4,
      complianceFriction: 2.1,
      payoutFriction: 1.8,
      buildComplexity: 4.3,
      maintenanceBurden: 3.9,
      platformRisk: 4.6,
      compoundingPotential: 8.6,
      confidence: 7.4,
      synergy: 9.0,
      payoutReadiness: 8.1,
      currentStatus: "discovered",
      experimentPlan: "Convert the highest-reuse internal skill into a documented, supportable automation pack and validate it on one marketplace plus one owned landing page.",
      liveKpis: ["views", "sales", "refunds", "support time"],
      origin: "discovered",
      sourceEvidence: internalSkills.slice(0, 4).map((filePath) => ({
        sourceId: "internal-skill-reuse",
        capturedAt: now,
        url: path.relative(resolveRepoPath(), filePath).replace(/\\/g, "/"),
        note: `Internal skill detected at ${path.basename(path.dirname(filePath))}.`,
        method: "internal",
      })),
    },
  ];
}

async function loadPinnedOpportunities(): Promise<Opportunity[]> {
  const pinned = await readJsonFile<Opportunity[]>(
    resolveRepoPath("data", "imports", "pinned-opportunities.json"),
    [],
  );
  const now = new Date().toISOString();
  return pinned.map((opportunity) => ({
    ...opportunity,
    origin: "pinned",
    sourceEvidence:
      opportunity.sourceEvidence && opportunity.sourceEvidence.length > 0
        ? opportunity.sourceEvidence
        : [
            {
              sourceId: "operator-pinned",
              capturedAt: now,
              note: "Opportunity was pinned by the operator import file.",
              method: "operator",
            },
          ],
  }));
}

function dedupeOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const seen = new Map<string, Opportunity>();
  for (const opportunity of opportunities) {
    const key = opportunity.id || slugify(opportunity.title);
    if (!seen.has(key)) {
      seen.set(key, opportunity);
    }
  }

  return Array.from(seen.values());
}

export async function discoverOpportunities(): Promise<Opportunity[]> {
  const [feed, internal, pinned] = await Promise.all([
    discoverFeedOpportunities(),
    discoverInternalAssetReuseOpportunities(),
    loadPinnedOpportunities(),
  ]);

  return rankOpportunities(dedupeOpportunities([...pinned, ...feed, ...internal, ...defaultOpportunities()]));
}

export async function buildOpportunityIngestReport(opportunities?: Opportunity[]): Promise<string> {
  const catalog = opportunities ?? (await discoverOpportunities());
  const discovered = catalog.filter((opportunity) => opportunity.origin === "discovered");
  const pinned = catalog.filter((opportunity) => opportunity.origin === "pinned");
  const seeded = catalog.filter((opportunity) => opportunity.origin === "seeded");

  return `# Opportunity Ingest

## Summary

- Total opportunities: ${catalog.length}
- Discovered live: ${discovered.length}
- Operator pinned: ${pinned.length}
- Seeded fallback: ${seeded.length}

## Top discovered opportunities

${discovered.slice(0, 5).map((opportunity) => `- ${opportunity.title} (${opportunity.laneFamily})`).join("\n") || "- None yet."}

## Notes

- Feed-based discovery uses live RSS signals where available.
- Internal asset discovery derives opportunities from the current repo's reusable skills and assets.
- Seeded lanes remain only as a fallback safety net when live discovery is sparse or temporarily unavailable.
`;
}

export async function discoverOpportunityFeedEvidence(): Promise<Record<string, string>> {
  const notes = await readTextFile(resolveRepoPath("docs", "portfolio", "opportunity-ingest.md"), "");
  return {
    noteLength: String(notes.length),
  };
}
