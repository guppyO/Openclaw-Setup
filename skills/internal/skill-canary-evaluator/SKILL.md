---
name: skill-canary-evaluator
description: "Stage and evaluate a candidate skill before promotion. Use when Revenue OS is considering a third-party or internal skill and needs a quarantine, stage, eval, and promotion or rejection decision."
---

# Skill Canary Evaluator

Promote skills only with evidence.

## Workflow

1. Capture source provenance, version pin, and trust boundary.
2. Review code or instructions for obvious exfiltration, mutation, or policy risk.
3. Run the smallest representative eval that proves the skill helps rather than harms.
4. Decide: reject, keep in quarantine, promote to stage, or promote to prod.

## Output

- promotion decision,
- main risk,
- eval result,
- next action if still pending.
