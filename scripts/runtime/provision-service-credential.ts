import { emitLog } from "../../services/common/logger.js";
import { ensureManagedCredential, writeCredentialRegistryDocs } from "../../services/credentials/index.js";

function argValue(flag: string): string | undefined {
  const index = process.argv.findIndex((argument) => argument === flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const service = argValue("--service");
  const purpose = argValue("--purpose");
  const owner = argValue("--owner") ?? "ops";
  const loginIdentifier = argValue("--login") ?? process.env.COMPANY_GMAIL_EMAIL ?? process.env.GMAIL_EMAIL;
  const initiativeId = argValue("--initiative");
  const browserProfile = argValue("--profile");

  if (!service || !purpose || !loginIdentifier) {
    throw new Error(
      "Usage: npm run runtime:provision-credential -- --service <name> --purpose <text> [--owner <agent>] [--login <identifier>] [--initiative <id>] [--profile <profile>]",
    );
  }

  const entry = await ensureManagedCredential({
    service,
    purpose,
    owner,
    loginIdentifier,
    initiativeId,
    browserProfile,
    notes: [
      "Generated for a future third-party account so the company can avoid password reuse across services.",
    ],
  });
  await writeCredentialRegistryDocs();

  await emitLog({
    agent: "ops",
    session: "credential-provision",
    initiative: initiativeId ?? "account-bootstrap",
    actionType: "provision-managed-service-credential",
    subsystem: "credentials",
    success: true,
    evidencePaths: [
      "docs/credential-registry.md",
      "data/exports/credential-registry.json",
      ".secrets/generated-service-credentials.env",
    ],
  });

  console.log(
    JSON.stringify(
      {
        id: entry.id,
        service: entry.service,
        loginIdentifier: entry.loginIdentifier,
        passwordEnvKey: entry.passwordEnvKey,
        storageRef: entry.storageRef,
        status: entry.status,
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
