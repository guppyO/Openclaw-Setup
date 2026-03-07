import { buildDashboardState } from "../../services/analytics/index.js";

describe("system smoke", () => {
  test("dashboard state resolves from generated exports", async () => {
    const state = await buildDashboardState();
    expect(state.topOpportunities.length).toBeGreaterThan(0);
    expect(state.queue.length).toBeGreaterThan(0);
    expect(state.dispatch.nextTask).not.toBeNull();
    expect(state.dispatch.activeAssignments.length).toBeGreaterThan(0);
    expect(state.browser.sampleRoutes.length).toBeGreaterThan(0);
    expect(state.notes.length).toBeGreaterThan(0);
  });
});
