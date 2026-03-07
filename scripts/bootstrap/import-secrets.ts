import { emitLog } from "../../services/common/logger.js";
import { syncBootstrapCredentialRegistry, writeCredentialRegistryDocs } from "../../services/credentials/index.js";
import { importBootstrapSecrets } from "../../services/secrets/index.js";

async function main(): Promise<void> {
  const state = await importBootstrapSecrets();
  await syncBootstrapCredentialRegistry(state);
  await writeCredentialRegistryDocs();

  await emitLog({
    agent: "ops",
    session: "bootstrap-secrets",
    initiative: "secret-hardening",
    actionType: "import-bootstrap-secrets",
    subsystem: "secrets",
    success: true,
    evidencePaths: [
      "docs/secret-inventory.md",
      "docs/credential-registry.md",
      "data/exports/credential-registry.json",
      "data/exports/secret-inventory.json",
      ".secrets/revenue-os.local.env",
    ],
  });

  console.log(
    JSON.stringify(
      {
        importedAt: state.importedAt,
        sourceFile: state.sourceFile,
        providers: state.providers,
        warningCount: state.warnings.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
