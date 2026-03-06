import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (["node_modules", "dist", ".git", "data"].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listMarkdownFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(absolutePath);
    }
  }

  return results;
}

describe("markdown portability", () => {
  test("repo markdown avoids local absolute Windows path links", async () => {
    const repoRoot = process.cwd();
    const files = await listMarkdownFiles(repoRoot);
    const offenders: string[] = [];

    for (const filePath of files) {
      const contents = await readFile(filePath, "utf8");
      if (/C:\\Users\\|\/C:\/Users\//.test(contents)) {
        offenders.push(path.relative(repoRoot, filePath).replace(/\\/g, "/"));
      }
    }

    expect(offenders).toEqual([]);
  });
});
