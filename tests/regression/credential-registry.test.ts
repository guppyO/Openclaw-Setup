import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ensureManagedCredential, readCredentialRegistry, syncBootstrapCredentialRegistry } from "../../services/credentials/index.js";
import { importBootstrapSecretsFromText } from "../../services/secrets/index.js";

describe("managed credential registry", () => {
  test("generates unique managed passwords without leaking them into exported metadata", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "revenue-os-managed-creds-"));
    const secretState = await importBootstrapSecretsFromText(
      `Wise
Email - "wise@example.com"
Password - "shared-secret"

Gmail
Email - "gmail@example.com"
Password - "shared-secret"

Hetzner
Email - "infra@example.com"
Password - "shared-secret"
`,
      "credentials",
      rootDir,
    );

    await syncBootstrapCredentialRegistry(secretState, rootDir);
    await ensureManagedCredential(
      {
        service: "marketplace etsy",
        purpose: "Unique password for a new marketplace account.",
        owner: "distribution",
        loginIdentifier: "jbfeedbacktool@gmail.com",
        initiativeId: "marketplace-pack",
        browserProfile: "marketplace_generic",
        rootDir,
      },
    );

    const registry = await readCredentialRegistry(rootDir);
    const exportedJson = await readFile(path.join(rootDir, "data", "exports", "credential-registry.json"), "utf8");
    const secretEnv = await readFile(path.join(rootDir, ".secrets", "generated-service-credentials.env"), "utf8");

    expect(registry.entries.some((entry) => entry.rotationPending)).toBe(true);
    expect(registry.entries.some((entry) => entry.slug === "marketplace-etsy")).toBe(true);
    expect(exportedJson).not.toContain("shared-secret");
    expect(secretEnv).toContain("REVENUE_OS_CREDENTIAL_MARKETPLACE_ETSY_PASSWORD=");
  });
});
