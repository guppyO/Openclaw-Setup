import { renderTable } from "../common/markdown.js";
import type { SecretBootstrapState } from "../common/types.js";

export interface AccountRegistryEntry {
  id: string;
  owner: string;
  purpose: string;
  authMechanism: string;
  renewalRequirement: string;
  status: "active" | "bootstrap-required" | "pending";
  allowedAutomations: string[];
  linkedInitiatives: string[];
  credentialRef?: string;
  browserProfile?: string;
  rotationNeeded?: boolean;
}

function secretEntry(
  secretState: SecretBootstrapState | null,
  provider: string,
): SecretBootstrapState["inventory"][number] | undefined {
  return secretState?.inventory.find((entry) => entry.provider === provider);
}

export function defaultAccountRegistry(secretState: SecretBootstrapState | null = null): AccountRegistryEntry[] {
  const gmail = secretEntry(secretState, "gmail");
  const wise = secretEntry(secretState, "wise");
  const hetzner = secretEntry(secretState, "hetzner");

  return [
    {
      id: "account-company-gmail",
      owner: "ops",
      purpose: "Primary company mailbox and signup identity",
      authMechanism: "Email/password with passkey or browser login confirmation",
      renewalRequirement: "Rotate reused bootstrap passwords and keep recovery options current",
      status: gmail ? "active" : "bootstrap-required",
      allowedAutomations: ["Verification inbox monitoring", "Signup confirmations", "Receipt ingest"],
      linkedInitiatives: ["identity", "growth", "treasury"],
      credentialRef: gmail?.storageRef,
      browserProfile: "gmail_primary",
      rotationNeeded: gmail?.rotationNeeded,
    },
    {
      id: "account-chatgpt-pro",
      owner: "operator",
      purpose: "Primary reasoning and Codex sign-in identity",
      authMechanism: "ChatGPT Pro / Codex login",
      renewalRequirement: "Keep subscription active and session fresh on supported surfaces",
      status: "active",
      allowedAutomations: ["Codex local runs", "Codex Cloud tasking", "OpenClaw openai-codex OAuth"],
      linkedInitiatives: ["control-plane", "builder", "research"],
      browserProfile: "chrome_company",
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
      authMechanism: "Wise personal token, partner OAuth, or browser lane fallback",
      renewalRequirement: "Capability probe after token rotation or account change",
      status: wise ? "active" : "bootstrap-required",
      allowedAutomations: ["Balance read", "ledger ingest", "budget tagging", "Browser fallback reconciliation"],
      linkedInitiatives: ["treasury"],
      credentialRef: wise?.storageRef,
      browserProfile: "wise_primary",
      rotationNeeded: wise?.rotationNeeded,
    },
    {
      id: "account-hetzner",
      owner: "ops",
      purpose: "Primary production VPS and infrastructure account",
      authMechanism: "Hetzner account login plus VPS SSH or console access",
      renewalRequirement: "Use unique host-level credentials and keep SSH access distinct from the account password",
      status: hetzner ? "active" : "bootstrap-required",
      allowedAutomations: ["VPS bootstrap", "Systemd deploys", "Backups", "Scale recommendations"],
      linkedInitiatives: ["control-plane", "ops"],
      credentialRef: hetzner?.storageRef,
      browserProfile: "hetzner_primary",
      rotationNeeded: hetzner?.rotationNeeded,
    },
    {
      id: "account-generated-service-credentials",
      owner: "ops",
      purpose: "Generated unique passwords for future third-party service accounts",
      authMechanism: "Locally stored managed credentials under ignored secret env files",
      renewalRequirement: "Use generated passwords for new services and mark root rotations complete after external password changes land",
      status: "active",
      allowedAutomations: ["Future signup password generation", "Credential reuse prevention", "Rotation planning"],
      linkedInitiatives: ["identity", "ops", "growth"],
      credentialRef: ".secrets/generated-service-credentials.env",
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
      browserProfile: "chrome_company",
    },
    {
      id: "account-steel",
      owner: "ops",
      purpose: "Scalable browser session pool for parallel web work",
      authMechanism: "Steel API key with namespace-isolated session routing",
      renewalRequirement: "Refresh API key and self-hosted health probes during quarterly review",
      status: "bootstrap-required",
      allowedAutomations: ["Parallel research", "Company signups", "Marketplace runs", "Browser fallback"],
      linkedInitiatives: ["distribution", "ops", "research"],
    },
  ];
}

export function buildAccountRegistryMarkdown(registry: AccountRegistryEntry[]): string {
  return `# Account Registry

${renderTable(
  ["Account", "Purpose", "Auth", "Status", "Browser profile", "Rotation"],
  registry.map((entry) => [
    entry.id,
    entry.purpose,
    entry.authMechanism,
    entry.status,
    entry.browserProfile ?? "n/a",
    entry.rotationNeeded ? "required" : "no",
  ]),
)}
`;
}
