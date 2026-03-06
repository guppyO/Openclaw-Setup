import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export function resolveRepoPath(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(filePath: string, fallback = ""): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return fallback;
  }
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, contents, "utf8");
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(rootPath, { withFileTypes: true });

  for (const entry of entries) {
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
