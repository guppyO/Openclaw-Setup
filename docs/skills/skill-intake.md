# Skill Intake

## Current queue

| Skill | Stage | Discovery | Overlap | Risk | Version pin |
| --- | --- | --- | --- | --- | --- |
| find-skills | quarantine | clawhub | 8.7 | 10 | sha256:9fd7a2bd5c53 |
| clawddocs | quarantine | clawhub | 8.3 | 10 | sha256:0569f1b8e346 |
| skill-creator | prod | workspace | 9.2 | 0.2 | system-preinstalled |
| proactive-agent | quarantine | clawhub | 8.8 | 10 | sha256:9048806b74a8 |
| self-improving-agent | quarantine | clawhub | 9.1 | 10 | sha256:4ef3844ee635 |
| browser-login-runbook | prod | workspace | 8.8 | 2.3 | workspace:browser-login-runbook |
| changelog-delta-summarizer | prod | workspace | 8.8 | 2.3 | workspace:changelog-delta-summarizer |
| initiative-bootstrapper | prod | workspace | 8.8 | 2.3 | workspace:initiative-bootstrapper |
| landing-page-launcher | prod | workspace | 8.8 | 2.3 | workspace:landing-page-launcher |
| opportunity-ranker | prod | workspace | 8.8 | 2.3 | workspace:opportunity-ranker |
| revenue-lane-scorer | prod | workspace | 8.8 | 2.3 | workspace:revenue-lane-scorer |
| skill-canary-evaluator | prod | workspace | 8.8 | 2.3 | workspace:skill-canary-evaluator |
| treasury-reconciliation | prod | workspace | 8.8 | 2.3 | workspace:treasury-reconciliation |

## Promotion policy

- Capture source provenance before promotion.
- Pin a version, hash, or workspace ref before stage evaluation.
- Treat third-party skills as supply-chain risk until local code review and evals pass.
- Promote only after quarantine -> stage -> prod evidence exists.
