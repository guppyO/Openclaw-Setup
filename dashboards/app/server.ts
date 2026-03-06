import express from "express";
import path from "node:path";

import { getRuntimeEnvironment } from "../../services/common/env.js";
import { buildDashboardState } from "../../services/analytics/index.js";
import { summarizeDashboard } from "../queries/summary.js";

function renderPage() {
  return async (_request: express.Request, response: express.Response) => {
    const state = await buildDashboardState();
    const summary = summarizeDashboard(state);

    response.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Revenue OS Dashboard</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="page">
      <section class="masthead">
        <div>
          <p class="eyebrow">Revenue OS / Live Control Surface</p>
          <h1>Always-on revenue allocation, launch, and adaptation.</h1>
        </div>
        <p class="lede">
          File-backed state for the control plane, portfolio engine, treasury envelope, update steward,
          and skill pipeline. Refresh by rerunning the bootstrap or recurring jobs.
        </p>
      </section>

      <section class="grid cards">
        <article class="panel">
          <div class="metric-value">$${summary.balanceUsdApprox.toFixed(0)}</div>
          <div class="metric-label">Approximate treasury balance in USD</div>
        </article>
        <article class="panel">
          <div class="metric-value">${summary.activeExperimentCount}</div>
          <div class="metric-label">Tracked active experiments</div>
        </article>
        <article class="panel">
          <div class="metric-value">${summary.queueDepth}</div>
          <div class="metric-label">Autonomy queue depth</div>
        </article>
        <article class="panel">
          <div class="metric-value">${summary.readyQueueDepth}</div>
          <div class="metric-label">Ready tasks for immediate dispatch</div>
        </article>
        <article class="panel">
          <div class="metric-value">${summary.blockerCount}</div>
          <div class="metric-label">Real blockers needing operator attention</div>
        </article>
      </section>

      <section class="grid columns">
        <article class="panel">
          <h2>Top opportunities</h2>
          <table>
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Family</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.topOpportunities.map((opportunity) => `
                <tr>
                  <td><strong>${opportunity.title}</strong><br /><span class="mono">${opportunity.id}</span></td>
                  <td>${opportunity.laneFamily}</td>
                  <td>${opportunity.score?.rankedScore ?? 0}</td>
                  <td>${opportunity.currentStatus}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </article>
        <article class="panel">
          <h2>Strategic summary</h2>
          <ul class="tight">
            <li><strong>Top lane:</strong> ${summary.topOpportunityTitle}</li>
            <li><strong>Recurring burn:</strong> $${state.treasury.recurringMonthlyUsd.toFixed(2)} / month</li>
            <li><strong>Runway:</strong> ${state.treasury.runwayMonths ?? "n/a"} months</li>
            <li><strong>Suspicious spend:</strong> ${state.treasury.suspiciousSpendCount}</li>
            <li><strong>Treasury mode:</strong> ${state.treasury.mode}</li>
            <li><strong>Model drift anchors:</strong> ${summary.driftedAnchorCount}</li>
          </ul>
        </article>
      </section>

      <section class="grid columns">
        <article class="panel">
          <h2>Autonomy queue</h2>
          ${state.queue.map((item) => `
            <div class="status-row">
              <div>
                <strong>${item.title}</strong><br />
                <span class="mono">${item.owner} / ${item.reason}</span><br />
                <span>${item.notes}</span>
              </div>
              <div>
                <div class="status-pill">${item.priority}</div>
              </div>
            </div>`).join("")}
        </article>
        <article class="panel">
          <h2>Agent pulse</h2>
          ${state.agents.map((agent) => `
            <div class="status-row">
              <div>
                <strong>${agent.agentId}</strong><br />
                <span class="mono">cadence ${agent.heartbeatCadence}</span>
              </div>
              <div>
                <div>${agent.backlogCount} queued</div>
                <div class="metric-label">${agent.activeInitiative}</div>
              </div>
            </div>`).join("")}
        </article>
      </section>

      <section class="grid columns">
        <article class="panel">
          <h2>Dispatch</h2>
          <ul class="tight">
            <li><strong>Next task:</strong> ${state.dispatch.nextTask?.title ?? "none"}</li>
            <li><strong>Immediate continuation:</strong> ${state.dispatch.cadence.immediateContinuation ? "enabled" : "disabled"}</li>
            <li><strong>Recovery sweep:</strong> every ${state.dispatch.cadence.recoverySweepMinutes} minutes</li>
            <li><strong>Heartbeat:</strong> every ${state.dispatch.cadence.heartbeatMinutes} minutes</li>
          </ul>
          ${state.dispatch.recoveryActions.map((action) => `<div class="status-row"><div>${action}</div></div>`).join("")}
        </article>
        <article class="panel">
          <h2>Browser fabric</h2>
          <ul class="tight">
            <li><strong>Managed browser:</strong> ${state.browser.capabilities.managedBrowser ? "ready" : "missing"}</li>
            <li><strong>Attached Chrome:</strong> ${state.browser.capabilities.attachedChrome ? "paired" : "not paired"}</li>
            <li><strong>Steel:</strong> ${state.browser.capabilities.steel ? "configured" : "not configured"}</li>
            <li><strong>Steel API key:</strong> ${state.browser.capabilities.steelApiConfigured ? "present" : "missing"}</li>
          </ul>
          ${state.browser.sampleRoutes.map((route) => `
            <div class="status-row">
              <div>
                <strong>${route.taskId}</strong><br />
                <span class="mono">${route.lane} / ${route.profileId}</span>
              </div>
              <div class="metric-label">${route.headless ? "headless" : "visible"}</div>
            </div>`).join("")}
        </article>
      </section>

      <section class="grid columns">
        <article class="panel">
          <h2>Skill pipeline</h2>
          ${state.skillCandidates.map((candidate) => `
            <div class="status-row">
              <div>
                <strong>${candidate.slug}</strong><br />
                <span class="mono">${candidate.versionPin}</span>
              </div>
              <div>
                <div>${candidate.stage}</div>
                <div class="metric-label">risk ${candidate.riskScore}</div>
              </div>
            </div>`).join("")}
        </article>
        <article class="panel">
          <h2>Runtime model policy</h2>
          <ul class="tight">
            <li><strong>Strategic target:</strong> ${state.modelPolicy.strategicTarget}</li>
            <li><strong>OpenClaw primary:</strong> ${state.modelPolicy.openClawPrimary}</li>
            <li><strong>OpenClaw fallback:</strong> ${state.modelPolicy.openClawFallback}</li>
            <li><strong>Probe mode:</strong> ${state.modelPolicy.probeMode}</li>
          </ul>
        </article>
      </section>

      <section class="grid columns">
        <article class="panel">
          <h2>Runtime anchors</h2>
          ${state.anchors.map((anchor) => `
            <div class="status-row">
              <div>
                <strong>${anchor.id}</strong><br />
                <span>${anchor.note}</span>
              </div>
              <div>
                <span class="status-pill ${anchor.status}">${anchor.status}</span>
              </div>
          </div>`).join("")}
        </article>
      </section>

      <section class="panel">
        <h2>Blockers</h2>
        <ul class="tight">
          ${state.blockers.map((blocker) => `<li>${blocker}</li>`).join("")}
        </ul>
      </section>

      <section class="panel">
        <h2>Operating notes</h2>
        <ul class="tight">
          ${state.notes.map((note) => `<li>${note}</li>`).join("")}
        </ul>
      </section>

      <p class="footer">Generated ${state.generatedAt}. API endpoints: <a href="/api/state">/api/state</a> and <a href="/health">/health</a>.</p>
    </main>
  </body>
</html>`);
  };
}

async function main(): Promise<void> {
  const app = express();
  const env = getRuntimeEnvironment();
  app.use(express.static(path.resolve(process.cwd(), "dashboards", "app")));
  app.get("/", renderPage());
  app.get("/api/state", async (_request, response) => {
    response.json(await buildDashboardState());
  });
  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "revenue-os-dashboard", at: new Date().toISOString() });
  });
  app.listen(env.port, () => {
    console.log(`Revenue OS dashboard listening on http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
