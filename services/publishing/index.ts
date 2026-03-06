import path from "node:path";

import { ensureDir, writeTextFile } from "../common/fs.js";
import type { Experiment, Opportunity } from "../common/types.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function renderLandingPage(opportunity: Opportunity, experiment: Experiment): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opportunity.title}</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="kicker">${opportunity.laneFamily}</p>
        <h1>${opportunity.title}</h1>
        <p class="lede">${opportunity.thesis}</p>
        <div class="metrics">
          <span>Expected margin ${opportunity.expectedMarginPct}%</span>
          <span>Launch in ${opportunity.timeToLaunchDays} days</span>
          <span>Revenue target ${opportunity.timeToRevenueDays} days</span>
        </div>
      </section>
      <section class="panel">
        <h2>Why this offer exists</h2>
        <p>${experiment.thesis}</p>
      </section>
      <section class="panel split">
        <div>
          <h2>What is included</h2>
          <ul>
            ${opportunity.requiredAssets.map((asset) => `<li>${asset}</li>`).join("")}
          </ul>
        </div>
        <div>
          <h2>Launch discipline</h2>
          <ul>
            ${experiment.launchChecklist.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function renderLandingPageStyles(): string {
  return `:root {
  color-scheme: light;
  --bg: #f4efe7;
  --ink: #11211d;
  --accent: #d76d1f;
  --muted: #5e6b67;
  --panel: rgba(255, 255, 255, 0.78);
  --line: rgba(17, 33, 29, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Georgia", "Times New Roman", serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(215, 109, 31, 0.14), transparent 34%),
    linear-gradient(180deg, #fbf6ef 0%, var(--bg) 100%);
}

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 48px 20px 72px;
}

.hero {
  border-bottom: 1px solid var(--line);
  padding-bottom: 28px;
}

.kicker {
  margin: 0 0 12px;
  font: 700 12px/1.2 "Segoe UI", sans-serif;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

h1,
h2 {
  margin: 0 0 14px;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 4.8rem);
  line-height: 0.98;
}

.lede,
li {
  font: 500 1.05rem/1.65 "Segoe UI", sans-serif;
}

.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
  font: 600 0.92rem/1.4 "Segoe UI", sans-serif;
  color: var(--muted);
}

.panel {
  margin-top: 22px;
  padding: 24px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  backdrop-filter: blur(12px);
}

.split {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}`;
}

export async function publishLandingPagePackage(opportunity: Opportunity, experiment: Experiment): Promise<string> {
  const folder = path.resolve(process.cwd(), "data", "exports", "assets", slugify(opportunity.id));
  await ensureDir(folder);
  await writeTextFile(path.join(folder, "index.html"), renderLandingPage(opportunity, experiment));
  await writeTextFile(path.join(folder, "styles.css"), renderLandingPageStyles());
  return folder;
}
