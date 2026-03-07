# Skill Intake

## Current queue

| Skill | Stage | Discovery | Pin kind | Version pin | Risk |
| --- | --- | --- | --- | --- | --- |
| find-skills | quarantine | github | github-commit | git:17824198e58d | 10 |
| clawddocs | quarantine | github | github-commit | git:a2c05bc08608 | 10 |
| skill-creator | prod | workspace | built-in | system-preinstalled | 0.2 |
| proactive-agent | quarantine | github | github-commit | git:71d9b7062220 | 10 |
| self-improving-agent | quarantine | github | github-commit | git:5af957709186 | 10 |
| browser-login-runbook | prod | workspace | workspace | workspace:browser-login-runbook | 2.3 |
| changelog-delta-summarizer | prod | workspace | workspace | workspace:changelog-delta-summarizer | 2.3 |
| initiative-bootstrapper | prod | workspace | workspace | workspace:initiative-bootstrapper | 2.3 |
| landing-page-launcher | prod | workspace | workspace | workspace:landing-page-launcher | 2.3 |
| opportunity-ranker | prod | workspace | workspace | workspace:opportunity-ranker | 2.3 |
| revenue-lane-scorer | prod | workspace | workspace | workspace:revenue-lane-scorer | 2.3 |
| skill-canary-evaluator | prod | workspace | workspace | workspace:skill-canary-evaluator | 2.3 |
| treasury-reconciliation | prod | workspace | workspace | workspace:treasury-reconciliation | 2.3 |

## Promotion policy

- Capture source provenance before promotion.
- Pin a real artifact, commit, release tag, or workspace ref before stage evaluation.
- Treat third-party skills as supply-chain risk until local code review and evals pass.
- Promote only after quarantine -> stage -> prod evidence exists.
