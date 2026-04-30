import { describe, expect, it } from "vitest";
import * as regressionConfig from "../../scripts/real-site-regression-config.mjs";

const {
  allRegressionSites,
  parseCsv,
  resolveRegressionSelection,
} = regressionConfig;

const { siteAccessGateReason } = regressionConfig as typeof regressionConfig & {
  siteAccessGateReason: (site: { host: string }, metrics: {
    title: string;
    url: string;
    bodyTextLength: number;
    bodyTextPreview?: string;
  }) => string | undefined;
};

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
      "Threads",
      "YouTube",
      "Reddit",
      "MetaTFT",
      "MetaTFT Augments",
      "Tactics Tools Hover",
    ]);
  });

  it("uses a core rules profile for curated imported-rule promotions", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=core-rules"],
      env: {},
    });

    expect(selection.profile).toBe("core-rules");
    expect(selection.dynamicModes).toEqual(["normal"]);
    expect(selection.selectedSites.map((site) => site.name)).toEqual([
      "StackOverflow",
      "GitHub Blog",
      "OpenAI Docs",
      "Nature Article",
      "Product Hunt",
      "Amazon Product",
    ]);
    expect(selection.selectedSites.find((site) => site.name === "OpenAI Docs")).toMatchObject({
      host: "developers.openai.com",
      url: "https://developers.openai.com/api/docs/guides/text",
    });
    expect(selection.selectedSites.find((site) => site.name === "Amazon Product")?.url).toBe(
      "https://www.amazon.com/s?k=kindle",
    );
  });

  it("uses a long-tail rules profile for recently debugged site-specific rules", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=long-tail-rules"],
      env: {},
    });

    expect(selection.profile).toBe("long-tail-rules");
    expect(selection.dynamicModes).toEqual(["normal"]);
    expect(selection.selectedSites.map((site) => site.name)).toEqual([
      "Old Reddit",
      "Inworld",
      "PromptOT",
      "Pornhub",
      "XVideos",
    ]);
  });

  it("treats Amazon robot checks as an access gate", () => {
    expect(
      siteAccessGateReason(
        { host: "amazon.com" },
        {
          title: "Amazon.com",
          url: "https://www.amazon.com/dp/B08N5WRWNW",
          bodyTextLength: 120,
          bodyTextPreview: "Enter the characters you see below Sorry, we just need to make sure you're not a robot.",
        },
      ),
    ).toBe("robot check");
  });

  it("treats unavailable Amazon pages as an external access gate", () => {
    expect(
      siteAccessGateReason(
        { host: "amazon.com" },
        {
          title: "Page Not Found",
          url: "https://www.amazon.com/dp/B08N5WRWNW",
          bodyTextLength: 0,
          bodyTextPreview: "",
        },
      ),
    ).toBe("unavailable page");
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
    expect(selection.selectedSites.map((site) => site.name)).toEqual(["Reddit", "Old Reddit", "Tactics Tools Hover"]);
  });

  it("keeps Inworld available as a focused landing-page regression target", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=all"],
      env: {
        IMT_REGRESSION_SITE_FILTER: "inworld",
      },
    });

    expect(selection.selectedSites.map((site) => site.name)).toEqual(["Inworld"]);
  });

  it("treats old Reddit network security blocks as an access gate", () => {
    expect(
      siteAccessGateReason(
        { host: "old.reddit.com" },
        {
          title: "",
          url: "https://old.reddit.com/r/TrueReddit/",
          bodyTextLength: 143,
          bodyTextPreview: "You've been blocked by network security. If you think you've been blocked by mistake.",
        },
      ),
    ).toBe("network security block");
  });

  it("keeps all known sites available for the full profile", () => {
    const selection = resolveRegressionSelection({ argv: [], env: {} });

    expect(selection.profile).toBe("all");
    expect(selection.dynamicModes).toEqual(["conservative", "normal"]);
    expect(selection.selectedSites).toHaveLength(allRegressionSites.length);
  });
});
