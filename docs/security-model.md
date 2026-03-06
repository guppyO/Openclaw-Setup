# Security Model

## Trust boundaries

- The production gateway is a trusted single-operator boundary.
- Third-party skills, plugins, and skill folders are supply-chain risk until reviewed and staged.
- Attached-browser sessions are higher trust than the managed browser and should be used deliberately.

## Operational safeguards

- Keep gateway bind mode on `loopback` by default and expose remotely through SSH or a tailnet.
- Separate `lab`, `stage`, and `prod`.
- Back up configs, docs, memory, and ledgers before every risky promotion.
- Keep treasury automation read-only until capability probes prove the rail is available.
