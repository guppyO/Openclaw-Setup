import { defaultOpportunities, rankOpportunities, scoreOpportunity } from "../../services/opportunity-engine/index.js";

describe("opportunity engine", () => {
  test("scores opportunities on a 0-100 ranked scale", () => {
    const opportunity = defaultOpportunities()[0]!;
    const score = scoreOpportunity(opportunity);
    expect(score.rankedScore).toBeGreaterThan(0);
    expect(score.rankedScore).toBeLessThanOrEqual(100);
  });

  test("returns a descending ranked list", () => {
    const ranked = rankOpportunities(defaultOpportunities());
    expect(ranked[0]!.score!.rankedScore).toBeGreaterThanOrEqual(ranked[1]!.score!.rankedScore);
  });
});
