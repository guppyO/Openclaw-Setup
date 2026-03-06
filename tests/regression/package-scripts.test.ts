import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

describe("package scripts", () => {
  test("all referenced local script files exist", () => {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    const missing: string[] = [];
    const referencePattern = /(scripts\/[^\s"']+\.(?:ts|sh|ps1))/g;

    for (const command of Object.values(packageJson.scripts)) {
      const matches = command.match(referencePattern) ?? [];
      for (const match of matches) {
        const absolutePath = path.resolve(process.cwd(), match);
        if (!existsSync(absolutePath)) {
          missing.push(match);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
