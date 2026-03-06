import { renderTable } from "../common/markdown.js";

export interface AccountRegistryEntry {
  id: string;
  owner: string;
  purpose: string;
  authMechanism: string;
  renewalRequirement: string;
  status: "active" | "bootstrap-required" | "pending";
  allowedAutomations: string[];
  linkedInitiatives: string[];
}

export function defaultAccountRegistry(): AccountRegistryEntry[] {
  return [
    {
      id: "account-chatgpt-pro",
      owner: "operator",
      purpose: "Primary reasoning and Codex sign-in identity",
      authMechanism: "ChatGPT Pro / Codex login",
      renewalRequirement: "Keep subscription active and session fresh on supported surfaces",
      status: "active",
      allowedAutomations: ["Codex local runs", "Codex Cloud tasking", "OpenClaw openai-codex OAuth"],
      linkedInitiatives: ["control-plane", "builder", "research"],
    },
    {
      id: "account-openclaw-prod",
      owner: "ops",
      purpose: "Always-on control plane gateway",
      authMechanism: "Pending VPS bootstrap and openai-codex OAuth",
      renewalRequirement: "Refresh deploy secrets on role changes and during quarterly review",
      status: "bootstrap-required",
      allowedAutomations: ["Heartbeat", "cron", "browser automation", "multi-agent routing"],
      linkedInitiatives: ["control-plane"],
    },
    {
      id: "account-wise",
      owner: "treasury",
      purpose: "Treasury source of truth",
      authMechanism: "Wise personal token or OAuth 2.0 app",
      renewalRequirement: "Capability probe after token rotation or account change",
      status: "bootstrap-required",
      allowedAutomations: ["Balance read", "ledger ingest", "budget tagging"],
      linkedInitiatives: ["treasury"],
    },
    {
      id: "account-browser-relay",
      owner: "operator",
      purpose: "Attached Chrome relay for high-trust sites",
      authMechanism: "Chrome extension relay",
      renewalRequirement: "Keep extension updated and paired to the Windows node",
      status: "bootstrap-required",
      allowedAutomations: ["Attached-session browsing", "manual takeover fallback"],
      linkedInitiatives: ["distribution", "ops"],
    },
  ];
}

export function buildAccountRegistryMarkdown(registry: AccountRegistryEntry[]): string {
  return `# Account Registry

${renderTable(
  ["Account", "Purpose", "Auth", "Status"],
  registry.map((entry) => [entry.id, entry.purpose, entry.authMechanism, entry.status]),
)}
`;
}
