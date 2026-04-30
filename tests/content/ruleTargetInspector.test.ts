import { describe, expect, it } from "vitest";
import { buildRuleTargetExplanation } from "@/content/ruleTargetInspector";
import type {
  PageTranslationRuleVisualizationSelector,
  PageTranslationStatus,
} from "@/content/pageTranslationSession";
import { mountFixture } from "@/test/domFixtures";

describe("buildRuleTargetExplanation", () => {
  it("explains when an element is excluded by rule selectors", () => {
    mountFixture(`
      <main>
        <button class="action">Reply</button>
      </main>
    `);

    const explanation = buildRuleTargetExplanation(document.querySelector(".action")!, {
      status: createStatus({
        visualizationSelectors: [{ group: "exclude", selector: ".action" }],
      }),
    });

    expect(explanation).toContain("原因: 命中排除规则");
    expect(explanation).toContain("规则: exclude");
  });

  it("explains tooltip skips with a user-facing reason", () => {
    mountFixture(`
      <div role="tooltip">
        <p class="tooltip-text">More details</p>
      </div>
    `);

    const explanation = buildRuleTargetExplanation(document.querySelector(".tooltip-text")!, {
      status: createStatus({
        allowTooltip: false,
      }),
    });

    expect(explanation).toContain("原因: 当前元素位于 tooltip/popover");
  });

  it("explains not-meaningful text with a user-facing reason", () => {
    mountFixture(`
      <main>
        <p class="tiny-text">42</p>
      </main>
    `);

    const explanation = buildRuleTargetExplanation(document.querySelector(".tiny-text")!, {
      status: createStatus(),
    });

    expect(explanation).toContain("原因: 文本更像短文本、编号、链接或标识符");
    expect(explanation).toContain("规则: 未命中规则 selector");
  });
});

function createStatus(
  overrides: {
    allowTooltip?: boolean;
    visualizationSelectors?: readonly PageTranslationRuleVisualizationSelector[];
  } = {},
): PageTranslationStatus {
  return {
    phase: "translated",
    observation: "observing",
    pendingRoots: 0,
    observedRoots: 0,
    dynamicRuns: 0,
    lastError: undefined,
    total: 0,
    translated: 0,
    failed: 0,
    skipped: 0,
    site: {
      hostname: "example.com",
      siteKey: "example.com",
      ruleId: "example",
      ruleSource: "core",
      ruleCapability: "content-ready",
      fallbackProfile: "generic",
      mergedRuleIds: ["example"],
      dynamicMode: "normal",
      dynamicModeSource: "global",
      isHighDynamic: false,
      ruleDiagnostics: {
        scanRootSelectorCount: 0,
        contentSelectorCount: 0,
        excludeSelectorCount: 0,
        buildContainerSelectorCount: 0,
        skipBuildContainerSelectorCount: 0,
        injectedCssRuleCount: 0,
        globalAttributeRuleCount: 0,
        attributeNameCount: 0,
        translationClassCount: 0,
        allowTooltip: overrides.allowTooltip ?? true,
        observeUrlChange: false,
        urlChangeDelay: 0,
        maxQueueSize: 0,
        maxRootsPerFlush: 0,
        maxObservedRoots: 0,
        maxMutationNodesPerWindow: 0,
        mutationWindowMs: 0,
        viewportSupplement: false,
        viewportSupplementMaxRoots: 0,
        visualizationSelectors: overrides.visualizationSelectors ?? [],
      },
    },
  };
}
