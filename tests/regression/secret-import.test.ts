import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildSecretInventoryMarkdown,
  importBootstrapSecretsFromText,
  parseCredentialFile,
} from "../../services/secrets/index.js";

describe("secret bootstrap", () => {
  test("parses provider sections and writes redacted metadata idempotently", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "revenue-os-secrets-"));
    const raw = `WISE BANK INFO
EMAIL - "wise@example.com"
Password - "secret-one"

Steel
API KEY - "steel-secret"

Gmail
EMAIL - "gmail@example.com"
Password - "secret-two"
`;

    const first = await importBootstrapSecretsFromText(raw, "Credentials.txt", rootDir);
    const second = await importBootstrapSecretsFromText(raw, "Credentials.txt", rootDir);
    const markdown = buildSecretInventoryMarkdown(second);
    const json = await readFile(path.join(rootDir, "data", "exports", "secret-inventory.json"), "utf8");

    expect(first.providers).toEqual(["wise", "steel", "gmail"]);
    expect(second.importedAt).toBe(first.importedAt);
    expect(markdown).not.toContain("secret-one");
    expect(markdown).not.toContain("steel-secret");
    expect(json).not.toContain("secret-two");
  });

  test("handles malformed input by ignoring non-section noise", () => {
    const sections = parseCredentialFile(`hello world

Wise
Email - "x@example.com"
`);

    expect(sections).toHaveLength(1);
    expect(sections[0]!.provider).toBe("wise");
  });
});
