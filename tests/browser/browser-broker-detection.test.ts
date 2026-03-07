import { probeAttachedChromeRelay } from "../../services/browser-broker/index.js";

describe("browser broker relay detection", () => {
  test("treats attached Chrome tabs as a paired relay", async () => {
    const result = await probeAttachedChromeRelay(async () => ({
      stdout: JSON.stringify({
        tabs: [
          {
            targetId: "tab-1",
            title: "Inbox",
          },
        ],
      }),
      stderr: "",
    }));

    expect(result.paired).toBe(true);
    expect(result.tabCount).toBe(1);
  });

  test("returns unpaired when the Chrome relay probe fails", async () => {
    const result = await probeAttachedChromeRelay(async () => {
      throw new Error("pairing required");
    });

    expect(result.paired).toBe(false);
    expect(result.tabCount).toBe(0);
  });
});
