import { describe, expect, it } from "vitest";
import {
  allRegressionSites,
  parseCsv,
  resolveRegressionSelection,
} from "../../scripts/real-site-regression-config.mjs";

describe("real-site regression selection", () => {
  it("parses comma separated filters without empty values", () => {
    expect(parseCsv(" x, , MetaTFT ,,reddit ")).toEqual(["x", "MetaTFT", "reddit"]);
  });

  it("uses a fast smoke profile for one conservative high-value page", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=smoke"],
      env: {},
    });

    expect(selection.profile).toBe("smoke");
    expect(selection.dynamicModes).toEqual(["conservative"]);
    expect(selection.selectedSites.map((site) => site.name)).toEqual(["MetaTFT Augments"]);
  });

  it("uses a focused high dynamic profile for volatile sites", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile", "high-dynamic"],
      env: {},
    });

    expect(selection.profile).toBe("high-dynamic");
    expect(selection.dynamicModes).toEqual(["conservative"]);
    expect(selection.selectedSites.map((site) => site.name)).toEqual([
      "X",
      "YouTube",
      "Reddit",
      "MetaTFT",
      "MetaTFT Augments",
      "Tactics Tools Hover",
    ]);
  });

  it("lets explicit env filters override profile site selection", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=all"],
      env: {
        IMT_REGRESSION_SITE_FILTER: "reddit, tactics",
        IMT_REGRESSION_DYNAMIC_MODES: "off,normal",
      },
    });

    expect(selection.profile).toBe("all");
    expect(selection.dynamicModes).toEqual(["off", "normal"]);
    expect(selection.selectedSites.map((site) => site.name)).toEqual(["Reddit", "Tactics Tools Hover"]);
  });

  it("keeps all known sites available for the full profile", () => {
    const selection = resolveRegressionSelection({ argv: [], env: {} });

    expect(selection.profile).toBe("all");
    expect(selection.dynamicModes).toEqual(["conservative", "normal"]);
    expect(selection.selectedSites).toHaveLength(allRegressionSites.length);
  });
});
