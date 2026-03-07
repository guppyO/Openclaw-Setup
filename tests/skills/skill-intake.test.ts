import { seedSkillCandidates } from "../../services/skill-intake/index.js";

describe("skill intake", () => {
  test("seeded third-party candidates do not fake artifact pins", () => {
    const candidates = seedSkillCandidates();
    const thirdParty = candidates.filter((candidate) => candidate.sourceType !== "built-in");

    expect(thirdParty.every((candidate) => candidate.pinKind === "unresolved")).toBe(true);
    expect(thirdParty.every((candidate) => !candidate.versionPin.startsWith("sha256:"))).toBe(true);
  });
});
