import { readdir } from "node:fs/promises";
import path from "node:path";

describe("authoritative root docs", () => {
  test("keeps only operator entrypoints at the repo root", async () => {
    const root = process.cwd();
    const entries = await readdir(root, { withFileTypes: true });
    const markdownFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();

    expect(markdownFiles).toEqual([
      "BRINGUP.md",
      "CURRENT-STATE.md",
      "README.md",
      "START-HERE.md",
      "VALIDATION-REPORT.md",
    ]);
  });

  test("archives the old root planning and audit material under docs/archive", async () => {
    const archiveDir = path.join(process.cwd(), "docs", "archive");
    const entries = await readdir(archiveDir, { withFileTypes: true });
    const archived = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();

    expect(archived).toEqual([
      "AUDIT-FIXES.md",
      "Documentation.md",
      "FOURTH-AUDIT-FIXES.md",
      "Implement.md",
      "Plan.md",
      "Prompt.md",
      "README.md",
      "SECOND-AUDIT-FIXES.md",
    ]);
  });
});
