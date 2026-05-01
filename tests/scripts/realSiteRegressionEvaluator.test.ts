import { describe, expect, it } from "vitest";
import { fixtureExpectationForKind } from "../../scripts/real-site-regression-config.mjs";
import { buildStructuredRegressionReport, evaluatePageReport } from "../../scripts/real-site-regression-evaluator.mjs";

const articleSite = {
  name: "Example Article",
  host: "example.com",
  url: "https://example.com/story",
  fixtureKind: "article",
};

function buildBaseReportInput(overrides: Record<string, unknown> = {}) {
  const expectation = fixtureExpectationForKind("article");
  const input = {
    site: articleSite,
    config: {
      provider: "fake",
      dynamicMode: "normal",
    },
    expectation,
    metrics: {
      url: articleSite.url,
      title: "Example Article",
      bodyTextLength: 2400,
      bodyTextPreview: "Readable article body",
      contentReady: true,
      floatingControl: true,
      hasDebugApi: true,
      fixtureKind: "article",
      translatedRoots: 9,
      translatedBlocks: 9,
      translatedCompacts: 0,
      translatedReplacements: 0,
      translatedAttributes: 0,
      translatedTextLength: 900,
      loadingDomCount: 0,
      managedNodeCount: 9,
      orphanLoadingCount: 0,
      duplicateTranslationCount: 0,
      translatedTextSamples: ["[zh-Hans] Example article headline"],
      positiveSamples: {
        checked: 9,
        translated: 9,
        untranslatedSamples: [],
      },
      negativeSamples: {
        checked: 6,
        violations: [],
      },
      ruleVisualizationSelectors: [
        { group: "scan-root", selector: "article p", matchedCount: 8 },
        { group: "content", selector: "article p", label: "content-block", matchedCount: 8 },
      ],
    },
    translateResponse: { ok: true },
    pageStatusResponse: {
      ok: true,
      status: {
        total: 9,
        translated: 9,
        failed: 0,
        skipped: 0,
        phase: "translated",
        observation: "observing",
        pendingRoots: 0,
        observedRoots: 0,
        dynamicRuns: 0,
        diagnostics: {
          scan: {
            text: { seen: 12, accepted: 10, skipped: 2, skippedByReason: { "not-meaningful": 2 } },
            attributes: { seen: 0, accepted: 0, skipped: 0, skippedByReason: {} },
          },
          candidates: {
            evaluated: 3,
            accepted: 1,
            byProfile: { article: 3 },
            acceptedByProfile: { article: 1 },
          },
          units: {
            built: 9,
            dropped: 0,
            droppedByReason: {},
            byCategory: { heading: 1, "content-block": 8 },
            totalTextLength: 1200,
            maxTextLength: 220,
            codeUnits: 0,
            uiUnits: 0,
            duplicateUnits: 0,
          },
          cache: { hits: 0, misses: 9 },
          provider: { requested: 9, failed: 0, skipped: 0 },
          traces: [],
        },
        site: {
          hostname: "example.com",
          siteKey: "example.com",
          ruleId: "example-article",
          ruleSource: "core",
          ruleCapability: "content-ready",
          fallbackProfile: "article",
          mergedRuleIds: ["example-article"],
          dynamicMode: "normal",
          dynamicModeSource: "site-default",
          isHighDynamic: false,
          ruleDiagnostics: {
            scanRootSelectorCount: 1,
            contentSelectorCount: 1,
            excludeSelectorCount: 2,
            buildContainerSelectorCount: 0,
            skipBuildContainerSelectorCount: 0,
            injectedCssRuleCount: 0,
            globalAttributeRuleCount: 0,
            attributeNameCount: 0,
            translationClassCount: 0,
            allowTooltip: false,
            observeUrlChange: false,
            urlChangeDelay: 0,
            maxQueueSize: 80,
            maxRootsPerFlush: 20,
            maxObservedRoots: 80,
            maxMutationNodesPerWindow: 100,
            mutationWindowMs: 1000,
            viewportSupplement: false,
            viewportSupplementMaxRoots: 0,
            visualizationSelectors: [],
          },
        },
      },
    },
    firstProgress: { translatedRoots: 1, translatedBlocks: 1, elapsedMs: 450, timedOut: false },
    hoverResult: undefined,
    restoreResponse: { ok: true },
    restoreMetrics: {
      translatedDomAfter: 0,
      managedDomAfter: 0,
      loadingDomAfter: 0,
      originalTextMarkersAfter: 0,
      unitIdMarkersAfter: 0,
    },
    timings: { pageLoadMs: 400, firstTranslationMs: 450, fullTranslationMs: 900, restoreMs: 50 },
    screenshotPath: "screenshot.png",
    extensionErrors: [],
    siteErrors: [],
    siteErrorCount: 0,
    gateReason: undefined,
  };

  return {
    ...input,
    ...overrides,
  };
}

describe("real-site regression evaluator", () => {
  it("classifies a healthy structured report as PASS", () => {
    const report = buildStructuredRegressionReport(buildBaseReportInput());

    expect(report.verdict).toBe("PASS");
    expect(report.ruleResolution.hitLevel).toBe("content-ready");
    expect(report.contentDiscovery.status).toBe("ok");
    expect(report.unitBuild.unitsByCategory).toMatchObject({ heading: 1, "content-block": 8 });
    expect(report.restore.status).toBe("ok");
  });

  it("keeps access-gated pages out of translation quality failures", () => {
    const report = buildStructuredRegressionReport(buildBaseReportInput({
      gateReason: "requires login",
      metrics: {
        url: "https://example.com/login",
        title: "Login",
        bodyTextLength: 40,
        bodyTextPreview: "Please log in",
        contentReady: false,
        floatingControl: false,
        hasDebugApi: false,
        fixtureKind: "article",
        translatedRoots: 0,
        translatedBlocks: 0,
        negativeSamples: { checked: 0, violations: [] },
        ruleVisualizationSelectors: [],
      },
      pageStatusResponse: { ok: false, error: "receiving end does not exist" },
    }));

    expect(report.verdict).toBe("GATED");
    expect(report.ok).toBe(true);
  });

  it("fails reports with critical negative sample violations", () => {
    const report = buildStructuredRegressionReport(buildBaseReportInput({
      metrics: {
        ...buildBaseReportInput().metrics,
        negativeSamples: {
          checked: 2,
          violations: [
            {
              kind: "code",
              selector: "pre code",
              textPreview: "const value = 1;",
              translatedTextPreview: "[zh-Hans] const value = 1;",
            },
          ],
        },
      },
    }));

    expect(evaluatePageReport(report)).toBe("FAIL");
    expect(report.negativeSamples.status).toBe("failed");
  });

  it("treats deterministic dynamic probe translation as a successful dynamic check", () => {
    const expectation = fixtureExpectationForKind("video-list");
    const videoSite = {
      name: "Example Video",
      host: "video.example",
      url: "https://video.example/results",
      fixtureKind: "video-list",
    };
    const report = buildStructuredRegressionReport(buildBaseReportInput({
      site: videoSite,
      expectation,
      metrics: {
        ...buildBaseReportInput().metrics,
        fixtureKind: "video-list",
        translatedRoots: 8,
        translatedBlocks: 8,
        positiveSamples: {
          checked: 8,
          translated: 8,
          untranslatedSamples: [],
        },
      },
      pageStatusResponse: {
        ok: true,
        status: {
          ...buildBaseReportInput().pageStatusResponse.status,
          total: 8,
          translated: 8,
          dynamicRuns: 0,
          pendingRoots: 0,
          observedRoots: 1,
          diagnostics: {
            ...buildBaseReportInput().pageStatusResponse.status.diagnostics,
            units: {
              ...buildBaseReportInput().pageStatusResponse.status.diagnostics.units,
              built: 8,
              byCategory: { "card-text": 8 },
            },
          },
        },
      },
      dynamicActionResult: {
        attempted: true,
        ok: true,
        probeId: "probe-1",
        translatedText: "动态视频标题",
      },
    }));

    expect(report.dynamic.status).toBe("ok");
    expect(report.verdict).toBe("PASS");
  });
});
