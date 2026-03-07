# Credential Registry

Generated metadata for passwords that are stored locally under ignored secret files.

## Summary

- Generated at: 2026-03-07T21:20:14.595Z
- Storage ref: .secrets/generated-service-credentials.env
- Warnings: One or more root accounts still need their externally configured password rotated to a unique value.

## Managed credentials

| Id | Login identifier | Owner | Status | Secret ref | Root account |
| --- | --- | --- | --- | --- | --- |
| credential-root-gmail-root-rotation | jbfeedbacktool@gmail.com | ops | pending-rotation | .secrets/generated-service-credentials.env :: REVENUE_OS_CREDENTIAL_GMAIL_ROOT_ROTATION_PASSWORD | yes |
| credential-root-hetzner-root-rotation | jbfeedbacktool@gmail.com | ops | pending-rotation | .secrets/generated-service-credentials.env :: REVENUE_OS_CREDENTIAL_HETZNER_ROOT_ROTATION_PASSWORD | yes |
| credential-root-wise-root-rotation | jbfeedbacktool@gmail.com | treasury | pending-rotation | .secrets/generated-service-credentials.env :: REVENUE_OS_CREDENTIAL_WISE_ROOT_ROTATION_PASSWORD | yes |

## Rules

- Password values are intentionally excluded from the repo and from exported markdown.
- New third-party service accounts should receive a generated unique password from this registry instead of reusing a root-account password.
- Root-account rotation entries remain pending until the external service password is actually updated and the bootstrap credentials file is refreshed.
