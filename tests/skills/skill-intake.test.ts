import { seedSkillCandidates } from "../../services/skill-intake/index.js";

describe("skill intake", () => {
  test("seeds the requested high-priority candidates", () => {
    const candidates = seedSkillCandidates();
    expect(candidates.map((candidate) => candidate.slug)).toEqual(
      expect.arrayContaining([
        "find-skills",
        "clawddocs",
        "skill-creator",
        "proactive-agent",
        "self-improving-agent",
      ]),
    );
  });
});
