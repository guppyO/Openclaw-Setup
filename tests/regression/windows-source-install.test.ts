import { readFile } from "node:fs/promises";
import path from "node:path";

describe("windows source install", () => {
  test("pins the local source build and exports a Windows wrapper", async () => {
    const scriptPath = path.join(process.cwd(), "scripts", "bootstrap", "install-openclaw-source.ps1");
    const script = await readFile(scriptPath, "utf8");

    expect(script).toContain("84f5d7dc1d1b041382c126384c6eb28cad2f53fa");
    expect(script).toContain('Join-Path $HOME ".revenue-os\\openclaw-source"');
    expect(script).toContain("openclaw-source.cmd");
    expect(script).toContain('.revenue-os-tools');
    expect(script).toContain('corepack pnpm %*');
    expect(script).toContain('Git\\bin\\bash.exe');
    expect(script).toContain('bash.cmd');
    expect(script).toContain('OPENCLAW_SOURCE_DIR" -Value $sourceDir');
    expect(script).toContain('OPENCLAW_INSTALL_CHANNEL" -Value "source-pinned"');
    expect(script).toContain('OPENCLAW_MODEL_PRIMARY" -Value "openai-codex/gpt-5.4"');
    expect(script).toContain('OPENCLAW_MODEL_DEEP" -Value "openai-codex/gpt-5.4"');
  });
});
