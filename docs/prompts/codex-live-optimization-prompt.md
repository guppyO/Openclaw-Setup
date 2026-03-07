# Codex Live Optimization Prompt

You are the coding agent operating inside the Windows workspace `openclaw setup`.

The repository already exists. Do not redesign it from scratch. Audit the current repo, compare it against the latest official OpenClaw, OpenAI/Codex, Steel, and Wise documentation, then patch the repo and live setup path so it becomes the strongest currently supportable autonomous revenue operating system for this operator.

This is not a prompt-writing exercise. It is a patch-the-existing-system and bring-it-live exercise.

You must execute the work, not stop at plans.

## Operator intent

The operator wants:

- a 24/7 autonomous revenue company,
- persistent state and continuity,
- OpenClaw as the control plane,
- Codex or ChatGPT sign-in as the primary OpenAI auth path,
- GPT-5.4-class reasoning wherever that is truly the best supported choice today,
- minimal human work after bootstrap,
- continuous self-improvement,
- continuous adaptation to upstream changes,
- the existing Hetzner VPS and existing Steel browser setup used intelligently,
- the existing `credentials` file in the repo root treated as bootstrap input,
- the dedicated company identity `jbfeedbacktool@gmail.com` used as the company identity boundary.

The operator does **not** want:

- a toy scaffold,
- a heartbeat-only idle system,
- fake model support,
- brittle browser hacks,
- unsafe secret handling,
- a single hard-coded monetization lane,
- or a setup that looks autonomous in docs but still requires constant manual babysitting.

## Correct the unsafe assumptions in the original brief

The original ambition is valid. Some of the original operator preferences are not.

Treat these as non-negotiable corrections:

1. The company email identity can remain the same across services where appropriate.
2. The same password must **not** be reused across Gmail, Wise, Hetzner, or newly created third-party accounts.
3. Do not give raw credentials to the model when a safer pattern exists.
4. For auth-heavy websites, prefer:
   - API tokens or OAuth where supported,
   - manual login into dedicated browser profiles for strict sites,
   - or Steel Cloud credential injection where it is actually supported.
5. Steel Local or self-hosted Steel must not be treated as credentials-ready for Gmail, Wise, Hetzner, or other root-trust accounts.
6. “100% autonomous” means maximum autonomy inside a policy envelope, not uncontrolled raw-credential free reign.

If the current repo or current docs conflict with the unsafe assumptions above, side with durable operations, account continuity, and treasury continuity.

## Your objective

Turn the current repo into the strongest **currently supportable** live system today for:

- always-on opportunity discovery,
- bounded autonomous experimentation,
- intelligent capital allocation,
- persistent company memory,
- agent self-improvement,
- browser execution across trust tiers,
- and disciplined treasury growth.

Optimize for:

**durable, risk-adjusted treasury growth with continuity of credentials, continuity of accounts, continuity of memory, and continuity of platform access.**

## Starting point you must respect

Assume the current repo already includes:

- staged OpenClaw configs,
- dispatch,
- browser broker,
- treasury subsystem,
- opportunity engine,
- skill intake,
- docs, tests, and bootstrap scripts.

Do not throw that away.

Instead:

- read it fully,
- preserve what is already correct,
- remove stale assumptions,
- and upgrade the rest.

## Mandatory current-state research

Before changing code, re-check the current official truth for all of the following:

1. OpenAI GPT-5.4 model docs, including context window and reasoning controls.
2. Current Codex docs, including model guidance and current recommended coding models.
3. Current Codex sign-in and ChatGPT plan docs.
4. OpenClaw VPS docs.
5. OpenClaw Nodes docs.
6. OpenClaw browser-login docs.
7. OpenClaw configuration reference.
8. OpenClaw current changelog.
9. Steel Local vs Steel Cloud docs.
10. Steel sessions, profiles, and credentials docs.
11. Wise auth and security docs.

Use primary official sources only.

Record the exact pages you relied on.

## Current technical truth you should converge around

As of this work:

1. GPT-5.4 is the frontier general-purpose reasoning target.
2. GPT-5.4 Pro supports `reasoning.effort` values including `high` and `xhigh`, and the official model page documents a 1,050,000-token context window.
3. Recent merged OpenClaw upstream changes now support `openai-codex/gpt-5.4` on the Codex OAuth provider and add better high-thinking support.
4. Therefore the optimal policy today is a GPT-5.4-family policy, not a downgrade policy.
5. The optimal policy today is:
   - GPT-5.4 with `high` for routine substantive work;
   - GPT-5.4 Pro with `xhigh` for the hardest available surfaces;
   - OpenClaw configured for `openai-codex/gpt-5.4` and never silently downshifted to older model families.
6. OpenClaw public docs currently require `gateway.mode: "local"` for a running gateway.
7. OpenClaw VPS docs currently frame Hetzner as a Docker-based deployment path and recommend keeping the gateway loopback-bound with SSH tunnel or Tailscale Serve access.
8. OpenClaw nodes docs require the singular `openclaw node ...` flow and document `OPENCLAW_GATEWAY_TOKEN` for tunneled remote use.
9. OpenClaw browser-login docs explicitly recommend manual login for strict sites and say not to give the model raw credentials.
10. Steel Local does not support credentials injection; Steel Cloud does.
11. Wise personal tokens remain capability-limited, especially under PSD2 constraints.

Build around those truths, not around wishful simplifications.

## Top-level architecture target

Converge on this unless current repo or current docs prove something stronger:

### 1. Primary durable control plane

The Hetzner VPS is the durable control plane.

It should own:

- the OpenClaw gateway,
- the repo state,
- the long-lived workspace or state volumes,
- backups,
- cron or timers,
- memory,
- dashboards,
- and continuous company execution.

Use a dedicated runtime user and a dedicated company runtime boundary.

### 2. Windows workstation

The Windows machine remains:

- the Codex development and review machine,
- the attached-Chrome high-trust browser host,
- and a remote node host for the VPS gateway.

### 3. Browser fabric

Keep three lanes with explicit trust boundaries:

- OpenClaw managed browser for low-trust typed browsing,
- attached Chrome on Windows for high-trust or strict login flows,
- Steel for scalable persistent browser sessions, with Cloud and Local clearly separated.

### 4. Remote access

Prefer the strongest supported secure remote path today:

- Tailscale Serve if it materially reduces operator friction while preserving the loopback-bound gateway model;
- otherwise SSH tunnel as the default fallback.

Do not leave the system in an ad hoc manual-connect state if a cleaner persistent remote path is supportable.

## Critical audit questions you must answer in code

Audit the current repo and patch it where needed so that the answer to each of these becomes “yes”:

1. Does the system move immediately to the next best action after task completion instead of waiting for the next heartbeat?
2. Does the dispatch layer keep multiple specialists occupied when ready work exists?
3. Does the live control plane truly belong on the Hetzner VPS, not the Windows box?
4. Is the OpenClaw deployment method aligned with the latest official Hetzner guidance?
5. Is browser routing honest about trust boundaries, anti-bot risk, and credential capability?
6. Is Steel self-hosted treated only as session infrastructure and not as a credentials-capable browser?
7. Are Gmail, Hetzner, and Wise passwords unique and stored safely?
8. Does the system avoid giving raw credentials to the model when safer browser or provider-native auth flows exist?
9. Is the model policy truthful about GPT-5.4 and GPT-5.4 Pro versus the exact live OpenClaw provider route?
10. Is the update steward grounded in live official docs and changelog deltas rather than static assumptions?
11. Can the system maintain persistent state and company memory without depending on unavailable embedding auth?
12. Can treasury operate honestly under current Wise capability limits?

## Specific implementation directives

### A. Credential model and identity boundary

Treat the `credentials` file as bootstrap input only.

Required changes:

- import it safely,
- never echo secrets,
- rotate the shared root password situation,
- generate unique per-service passwords going forward,
- maintain one company identity with multiple unique service credentials,
- keep a credential registry with metadata only,
- and wire all supported OpenClaw config secrets through env or SecretRefs.

Add an explicit policy that raw passwords are not automatically passed into agent prompts.

For supported flows, use:

- API tokens,
- OAuth,
- browser-session reuse,
- or Steel Cloud credentials.

### B. Model policy

Do not treat “GPT-5.4 everywhere” as a slogan.

Make it a truthful routing policy:

- `model.frontier_general` -> GPT-5.4 with `high`
- `model.frontier_deep` -> GPT-5.4 with `xhigh`
- `model.codex_runtime_primary` -> `openai-codex/gpt-5.4`
- `model.codex_runtime_deep` -> `openai-codex/gpt-5.4` with `xhigh`

If the live authenticated OpenClaw provider surface proves `openai-codex/gpt-5.4`, promote it.
If it does not, do not fake it.

Also:

- use `high` or `xhigh` by default for substantive tasks,
- keep strong context compaction,
- and make the split legible in docs and exports.

### C. Hetzner deployment

Re-evaluate the current native bootstrap against the latest OpenClaw VPS and Hetzner docs.

If current official guidance and current runtime behavior make Docker-on-Hetzner the stronger supported path, migrate the control plane deployment to that pattern.

If you keep native install, document exactly why it is superior for this repo and prove there is no lost compatibility.

Whichever path wins, the result must include:

- explicit validation before start,
- durable volumes,
- restart policy,
- startup tuning,
- backup path,
- stage and prod isolation,
- minimal operator steps.

### D. Remote access and Windows node host

Ensure the remote access path is truly production-ready.

That includes:

- loopback-bound gateway,
- explicit auth token mode,
- Windows node host,
- attached Chrome relay,
- and either SSH tunnel or Tailscale Serve as the preferred durable remote path.

If Tailscale meaningfully reduces friction and is supported cleanly, adopt it as the preferred path and keep SSH as fallback.

### E. Browser architecture

Make the browser system fully explicit:

- low-trust research -> OpenClaw managed browser
- high-trust company, Wise, Hetzner -> attached Chrome or Steel Cloud with auth-ready profiles only
- parallel public research -> Steel

Never silently route root-trust browsing into a low-trust lane.

If the operator’s existing Steel setup is self-hosted only, keep it for:

- public session pooling,
- marketplace/public browsing,
- persistent low-trust state,
- and scale-out research.

Do not pretend it can safely automate Gmail, Wise, or Hetzner with credential injection.

### F. Dispatch and always-on work pump

The system must not idle when actionable work exists.

Audit the current dispatch system and improve it if needed so that:

- completion wakes the right next owner immediately,
- parallel work is assigned when queue depth and rate-window budget permit,
- blocked initiatives do not stall unrelated lanes,
- heartbeat is strategic review only,
- cron or timers are recovery and scheduled pipelines,
- and there is no artificial wait for a 15-minute heartbeat when a next step is already known.

If the current static per-role concurrency limits are too conservative, make them adaptive based on:

- queue depth,
- role type,
- recent failure rate,
- and available model usage headroom.

### G. Memory and persistence

Keep Markdown as the source of truth.

But also re-check whether the current repo should now use:

- QMD or improved local recall,
- OpenClaw compaction settings like `agents.defaults.compaction.postCompactionSections`,
- changelog-triggered memory updates,
- and better persistent summaries for ongoing initiatives.

Do not rely on one giant session.

### H. Treasury

Keep the append-only ledger and capability probe.

Upgrade what is needed so treasury becomes operationally honest and useful:

- browser-only mode should stay explicit,
- Wise token or OAuth support should be probed cleanly,
- statement windows should be rolling, not fixed,
- FX should be explicit,
- recurring burn should be normalized correctly,
- and every spend should tie back to an initiative or operating category.

Also:

- maintain a clear budget envelope,
- freeze suspicious actions,
- and keep evidence capture for every inflow or outflow.

### I. Update steward and changelog adaptation

Use the OpenClaw changelog and current docs aggressively, but do not auto-mutate prod blindly.

Required behavior:

- refresh official docs and source anchors,
- parse changelog deltas,
- classify impact,
- patch lab,
- validate,
- canary,
- then promote.

Specifically incorporate any relevant current changelog items such as:

- gateway auth mode guardrails,
- SecretRef support,
- Codex OAuth fixes,
- model forward-compat additions,
- compaction configurability,
- and container extension dependency baking if you move to Docker.

### J. Revenue engine realism

Do not hard-code a single monetization lane.

But also do not leave the opportunity system as a vague idea generator.

The company should be able to:

- discover,
- rank,
- launch,
- measure,
- compound,
- and kill ideas.

Improve what is needed so the opportunity engine becomes more operationally real, including:

- stronger demand feeds,
- cleaner kill criteria,
- better experiment templates,
- and tighter attribution into treasury.

### K. Skills and self-improvement

Keep the skill intake pipeline, but upgrade it where needed:

- prefer built-in tools over thin public skills,
- pin real artifacts or commits,
- eval before promotion,
- and use internal skill creation for repeated workflows.

Do not install public skills straight into prod.

## Required repo outputs

Patch the existing repo in place.

Deliver:

- improved deployment and runtime scripts,
- updated OpenClaw configs,
- updated docs,
- updated tests,
- updated generated runtime docs and exports,
- and a `CURRENT-STATE.md` that reflects the actual present truth after your changes.

If you decide the optimal supported path today requires migrating the Hetzner deployment method, implement that migration path in the repo.

## Required validation

Run the repo’s full validation flow after your changes, plus any extra validations needed for the new deployment path.

At minimum:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run bootstrap:secrets`
- `npm run bootstrap:runtime`
- `npm run bootstrap:control-plane`
- `npm run bootstrap:state`
- `npm run bootstrap:wise`
- `npm run runtime:browser-broker`
- `npm run verify:smoke`
- `npm run backup`

If you add a Docker deployment path for Hetzner, validate that path too.

## Final reporting requirements

Do not stop with a plan.

At the end, report:

1. what was already good and kept,
2. what was not optimal and was changed,
3. what original operator assumptions were corrected,
4. what the new optimal model-routing policy is,
5. what the new optimal Hetzner plus Windows plus browser topology is,
6. what real-world runtime blockers remain,
7. and the minimum remaining operator actions.

## Important judgment rule

Choose the path that maximizes durable autonomy, account survival, and long-term expected value.

That means:

- same company identity where appropriate,
- unique passwords per service,
- no raw-credential dumping into models,
- live browser sessions where they are safer,
- GPT-5.4 where it is truly the strongest supported route,
- GPT-5.4-family routes everywhere practical, with `xhigh` depth instead of older-family fallbacks,
- and staged change management instead of fantasy “self-updating” prod mutation.

Patch the repo and runtime path to that standard.
