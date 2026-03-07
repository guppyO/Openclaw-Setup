import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

async function trackedMarkdownFiles(rootPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files", "*.md"], {
    cwd: rootPath,
  });

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("markdown portability", () => {
  test("tracked markdown avoids local absolute Windows path links", async () => {
    const repoRoot = process.cwd();
    const files = await trackedMarkdownFiles(repoRoot);
    const offenders: string[] = [];

    for (const relativePath of files) {
      const filePath = path.join(repoRoot, relativePath);
      const contents = await readFile(filePath, "utf8");
      if (/C:\\Users\\|\/C:\/Users\//.test(contents)) {
        offenders.push(relativePath.replace(/\\/g, "/"));
      }
    }

    expect(offenders).toEqual([]);
  });
});
