import { readFile } from "node:fs/promises";
import path from "node:path";

describe("bootstrap safety", () => {
  test("defaults Hetzner bootstrap to stage and documents the stage finalize step explicitly", async () => {
    const bootstrapScript = await readFile(
      path.join(process.cwd(), "scripts", "bootstrap", "bootstrap-hetzner-live.sh"),
      "utf8",
    );
    const bootstrapOpenClaw = await readFile(
      path.join(process.cwd(), "scripts", "bootstrap", "bootstrap-openclaw.sh"),
      "utf8",
    );
    const finalizeScript = await readFile(
      path.join(process.cwd(), "scripts", "bootstrap", "finalize-openclaw-auth.sh"),
      "utf8",
    );
    const startHere = await readFile(path.join(process.cwd(), "START-HERE.md"), "utf8");

    expect(bootstrapScript).toContain('BOOTSTRAP_ENVIRONMENT="${BOOTSTRAP_ENVIRONMENT:-stage}"');
    expect(bootstrapOpenClaw).toContain('ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"');
    expect(finalizeScript).toContain('ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"');
    expect(startHere).toContain("bash scripts/bootstrap/finalize-openclaw-auth.sh stage");
  });

  test("enforces config validation before service lifecycle wiring", async () => {
    const bootstrapOpenClaw = await readFile(
      path.join(process.cwd(), "scripts", "bootstrap", "bootstrap-openclaw.sh"),
      "utf8",
    );
    const stageUnit = await readFile(
      path.join(process.cwd(), "openclaw", "stage", "systemd", "revenue-os-stage.service"),
      "utf8",
    );

    expect(bootstrapOpenClaw).toContain("npm run verify:openclaw-config -- '$ENVIRONMENT'");
    expect(stageUnit).toContain("npm run verify:openclaw-config -- stage");
  });
});
