import { describe, expect, it } from "vitest";
import * as regressionConfig from "../../scripts/real-site-regression-config.mjs";

const {
  allRegressionSites,
  fixtureExpectationForKind,
  realSiteFixtureGroups,
  realSiteFixtureExpectations,
  parseCsv,
  resolveRegressionSelection,
} = regressionConfig;

const {
  createRegressionProviderConfig,
  publicRegressionConfig,
  validateRegressionProviderConfig,
} = regressionConfig as typeof regressionConfig & {
  createRegressionProviderConfig: (options: { provider: string; env: Record<string, string> }) => Record<string, unknown>;
  publicRegressionConfig: (config: Record<string, unknown>) => Record<string, unknown>;
  validateRegressionProviderConfig: (
    config: Record<string, unknown>,
    selection: { dynamicModes: string[]; selectedSites: unknown[]; siteFilter: string[] },
  ) => void;
};

const { siteAccessGateReason } = regressionConfig as typeof regressionConfig & {
  siteAccessGateReason: (site: { host: string }, metrics: {
    title: string;
    url: string;
    bodyTextLength: number;
    bodyTextPreview?: string;
  }) => string | undefined;
};

describe("real-site regression selection", () => {
  it("builds and validates native DeepSeek regression provider config", () => {
    const config = createRegressionProviderConfig({
      provider: "deepseek",
      env: {
        IMT_REGRESSION_DEEPSEEK_API_KEY: "deepseek-secret",
        IMT_REGRESSION_SITE_DYNAMIC_MODES: "www.youtube.com=normal, metatft.com=conservative, bad=fast",
      },
    });

    expect(config).toMatchObject({
      provider: "deepseek",
      deepseekEndpoint: "https://api.deepseek.com/chat/completions",
      deepseekApiKey: "deepseek-secret",
      deepseekModel: "deepseek-v4-flash",
      deepseekMaxConcurrentRequests: 4,
      deepseekMaxBatchItems: 6,
      deepseekMaxBatchChars: 2400,
      deepseekRequestTimeoutMs: 45000,
      siteDynamicModes: {
        "www.youtube.com": "normal",
        "metatft.com": "conservative",
      },
    });
    expect(publicRegressionConfig(config).deepseekApiKey).toBe("[set]");
    expect(() =>
      validateRegressionProviderConfig(config, {
        dynamicModes: ["normal"],
        selectedSites: [{ name: "OpenAI Docs" }],
        siteFilter: ["openai docs"],
      }),
    ).not.toThrow();
    expect(() =>
      validateRegressionProviderConfig({ ...config, deepseekApiKey: "" }, {
        dynamicModes: ["normal"],
        selectedSites: [{ name: "OpenAI Docs" }],
        siteFilter: ["openai docs"],
      }),
    ).toThrow("IMT_REGRESSION_DEEPSEEK_API_KEY is required");
  });

  it("parses comma separated filters without empty values", () => {
    expect(parseCsv(" x, , MetaTFT ,,reddit ")).toEqual(["x", "MetaTFT", "reddit"]);
  });

  it("uses a fast smoke profile for one high-value page with site default dynamics", () => {
    const selection = resolveRegressionSelection({
      argv: ["--profile=smoke"],
      env: {},
    });

    expect(selection.profile).toBe("smoke");
    expect(selection.dynamicModes).toEqual(["normal"]);
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

  it("treats localized Cloudflare challenge pages as an access gate", () => {
    expect(
      siteAccessGateReason(
        { host: "producthunt.com" },
        {
          title: "www.producthunt.com",
          url: "https://www.producthunt.com/",
          bodyTextLength: 121,
          bodyTextPreview: "www.producthunt.com 正在进行安全验证 本网站使用安全服务防护恶意自动程序。由 Cloudflare 提供的性能和安全服务",
        },
      ),
    ).toBe("cloudflare challenge");
  });

  it("keeps all known sites available for the full profile", () => {
    const selection = resolveRegressionSelection({ argv: [], env: {} });

    expect(selection.profile).toBe("all");
    expect(selection.dynamicModes).toEqual(["conservative", "normal"]);
    expect(selection.selectedSites).toHaveLength(allRegressionSites.length);
  });

  it("keeps two or three representative sites for every fixture kind", () => {
    expect(Object.keys(realSiteFixtureGroups).sort()).toEqual([
      "adult-video-list",
      "ai-chat",
      "article",
      "card-list",
      "commerce",
      "data-dashboard",
      "docs-code",
      "forum",
      "github",
      "hover-tooltip",
      "landing",
      "search-results",
      "social-feed",
      "video-list",
    ]);

    for (const [kind, sites] of Object.entries(realSiteFixtureGroups)) {
      expect(sites.length, kind).toBeGreaterThanOrEqual(2);
      expect(sites.length, kind).toBeLessThanOrEqual(3);
      expect(sites.every((site) => site.fixtureKind === kind), kind).toBe(true);
    }
  });

  it("defines positive and negative expectations for every fixture kind", () => {
    expect(Object.keys(realSiteFixtureExpectations).sort()).toEqual(Object.keys(realSiteFixtureGroups).sort());

    for (const kind of Object.keys(realSiteFixtureGroups)) {
      const expectation = fixtureExpectationForKind(kind);
      expect(expectation.positiveSelectors.length, kind).toBeGreaterThan(0);
      expect(expectation.negativeSelectors.length, kind).toBeGreaterThan(0);
      expect(expectation.minPositiveTranslated, kind).toBeGreaterThan(0);
      expect(expectation.minUnits, kind).toBeGreaterThan(0);
      expect(expectation.requiredCategories.length, kind).toBeGreaterThan(0);
    }
  });

  it("recognizes current Product Hunt product links as card-list positives", () => {
    const expectation = fixtureExpectationForKind("card-list");

    expect(expectation.positiveSelectors).toContain("main a[href^='/products/']");
    expect(expectation.positiveSelectors).toContain("main a[href^='/posts/']");
  });

  it("caps hover tooltip regressions so they sample representative targets only", () => {
    const hoverSites = realSiteFixtureGroups["hover-tooltip"] ?? [];

    expect(hoverSites.map((site) => site.name)).toEqual([
      "Tactics Tools Hover",
      "U.GG Champions",
      "OP.GG Champions",
    ]);
    expect(hoverSites.filter((site) => !site.hoverTooltipOptional).map((site) => site.name)).toEqual([
      "Tactics Tools Hover",
    ]);
    expect(hoverSites.filter((site) => site.hoverTooltipOptional).map((site) => site.name)).toEqual([
      "U.GG Champions",
      "OP.GG Champions",
    ]);
    for (const site of hoverSites) {
      expect(site.hoverTooltip).toBe(true);
      expect(site.hoverMaxAttempts, site.name).toBeLessThanOrEqual(8);
      expect(site.hoverAttemptTimeoutMs, site.name).toBeLessThanOrEqual(2500);
    }
  });

  it("keeps the fixture matrix deduplicated and selectable", () => {
    const fixtureUrls = Object.values(realSiteFixtureGroups)
      .flat()
      .map((site) => site.url);
    expect(new Set(fixtureUrls).size).toBe(fixtureUrls.length);
    expect(
      allRegressionSites
        .filter((site) => site.fixtureKind)
        .every((site) => fixtureUrls.includes(site.url)),
    ).toBe(true);

    const selection = resolveRegressionSelection({
      argv: ["--profile=fixture-matrix"],
      env: {},
    });

    expect(selection.dynamicModes).toEqual(["normal"]);
    expect(selection.selectedSites.map((site) => site.url).sort()).toEqual([...fixtureUrls].sort());
  });

  it("selects fixture sites by kind from cli or environment", () => {
    const cliSelection = resolveRegressionSelection({
      argv: ["--profile=fixture-matrix", "--fixture-kind=article,docs-code"],
      env: {},
    });
    expect(cliSelection.fixtureKinds).toEqual(["article", "docs-code"]);
    expect(cliSelection.selectedSites.map((site) => site.name)).toEqual([
      "Wikipedia Article",
      "Nature Article",
      "GitHub Blog",
      "OpenAI Docs",
      "MDN JavaScript Guide",
      "React Reference",
    ]);

    const envSelection = resolveRegressionSelection({
      argv: ["--profile=fixture-matrix"],
      env: {
        IMT_REGRESSION_FIXTURE_KIND: "video-list",
      },
    });
    expect(envSelection.fixtureKinds).toEqual(["video-list"]);
    expect(envSelection.selectedSites.map((site) => site.name)).toEqual(["YouTube", "Vimeo Watch", "Dailymotion"]);
  });
});
