import { afterEach, describe, expect, it } from "vitest";
import { DebugOverlay } from "@/content/debugOverlay";
import type { PageTranslationStatus } from "@/content/pageTranslationSession";

describe("DebugOverlay", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders page rule, queue, cache, provider, and scan diagnostics", () => {
    const listeners = new Set<(status: PageTranslationStatus) => void>();
    const status = createStatus();
    const overlay = new DebugOverlay({
      getStatus: () => status,
      subscribeStatus: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    });

    overlay.mount();

    const root = document.querySelector<HTMLElement>("[data-imt-debug-overlay='true']");
    expect(root).not.toBeNull();
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("x.com");
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("core+imported");
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("content-ready");
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("social");
    expect(rowText(root, "debug-overlay-rule-shape")).toContain("roots 9");
    expect(rowText(root, "debug-overlay-rule-shape")).toContain("content 6");
    expect(rowText(root, "debug-overlay-rule-shape")).toContain("exclude 11");
    expect(rowText(root, "debug-overlay-rule-filters")).toContain("build 2");
    expect(rowText(root, "debug-overlay-rule-filters")).toContain("skip 3");
    expect(rowText(root, "debug-overlay-rule-filters")).toContain("css 4");
    expect(rowText(root, "debug-overlay-rule-filters")).toContain("line 120");
    expect(rowText(root, "debug-overlay-rule-runtime")).toContain("queue 80");
    expect(rowText(root, "debug-overlay-rule-runtime")).toContain("flush 12");
    expect(rowText(root, "debug-overlay-rule-runtime")).toContain("url 350ms");
    expect(root?.querySelector("[data-testid='debug-overlay-segments']")?.textContent).toContain("7");
    expect(root?.querySelector("[data-testid='debug-overlay-queue']")?.textContent).toContain("2");
    expect(root?.querySelector("[data-testid='debug-overlay-cache']")?.textContent).toContain("3 / 4");
    expect(root?.querySelector("[data-testid='debug-overlay-provider']")?.textContent).toContain("5 / 1");
    expect(root?.querySelector("[data-testid='debug-overlay-scan']")?.textContent).toContain("10 / 8 / 2");
    expect(rowText(root, "debug-overlay-scan")).toContain("hidden 2");
    expect(rowText(root, "debug-overlay-units")).toContain("7 / 1");
    expect(rowText(root, "debug-overlay-units")).toContain("target-language 1");

    overlay.unmount();
    expect(document.querySelector("[data-imt-debug-overlay='true']")).toBeNull();
  });

  it("toggles rule visualization for matched page elements", () => {
    document.body.innerHTML = `
      <main>
        <article class="tweet">
          <p class="body-text">Hello world</p>
          <button class="action">Reply</button>
        </article>
        <section class="build-root">
          <p>Secondary content</p>
        </section>
      </main>
    `;
    const status = createStatus();
    const overlay = new DebugOverlay({
      getStatus: () => status,
      subscribeStatus: () => () => undefined,
    });

    overlay.mount();
    document.querySelector<HTMLButtonElement>("[data-testid='debug-overlay-visualize-rules']")?.click();

    expect(document.querySelector("[data-imt-rule-visualizer='true']")).not.toBeNull();
    expect(document.querySelector(".tweet")?.getAttribute("data-imt-rule-visualization")).toContain("scan-root");
    expect(document.querySelector(".body-text")?.getAttribute("data-imt-rule-visualization")).toContain("content");
    expect(document.querySelector(".action")?.getAttribute("data-imt-rule-visualization")).toContain("exclude");
    expect(document.querySelector(".build-root")?.getAttribute("data-imt-rule-visualization")).toContain("build-container");
    expect(document.querySelector("[data-imt-rule-visualizer='true']")?.textContent).toContain("content 1");
    expect(document.querySelector("[data-imt-rule-visualizer='true']")?.textContent).toContain("exclude 1");

    document.querySelector<HTMLButtonElement>("[data-testid='debug-overlay-visualize-rules']")?.click();

    expect(document.querySelector("[data-imt-rule-visualizer='true']")).toBeNull();
    expect(document.querySelector(".body-text")?.hasAttribute("data-imt-rule-visualization")).toBe(false);

    overlay.unmount();
  });

  it("visualizes actual text candidates separately from rule selectors", () => {
    document.body.innerHTML = `
      <main>
        <h2 class="organic-title">Hot Porn Videos in the USA</h2>
      </main>
    `;
    const status = createStatus();
    const overlay = new DebugOverlay({
      getStatus: () => status,
      subscribeStatus: () => () => undefined,
      collectTranslatableRoots: () => [document.querySelector<HTMLElement>(".organic-title")!],
    });

    overlay.mount();
    document.querySelector<HTMLButtonElement>("[data-testid='debug-overlay-visualize-rules']")?.click();

    expect(document.querySelector(".organic-title")?.getAttribute("data-imt-rule-visualization")).toContain(
      "text-candidate",
    );
    expect(document.querySelector("[data-imt-rule-visualizer='true']")?.textContent).toContain("text-candidate 1");

    overlay.unmount();
  });

  it("visualizes rule selectors inside open shadow roots", () => {
    document.body.innerHTML = `<main><article-card></article-card></main>`;
    const host = document.querySelector<HTMLElement>("article-card")!;
    const shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `<article class="tweet"><p class="body-text">Shadow tweet text</p></article>`;
    const status = createStatus();
    const overlay = new DebugOverlay({
      getStatus: () => status,
      subscribeStatus: () => () => undefined,
    });

    overlay.mount();
    document.querySelector<HTMLButtonElement>("[data-testid='debug-overlay-visualize-rules']")?.click();

    expect(shadowRoot.querySelector(".tweet")?.getAttribute("data-imt-rule-visualization")).toContain("scan-root");
    expect(shadowRoot.querySelector(".body-text")?.getAttribute("data-imt-rule-visualization")).toContain("content");
    expect(document.querySelector("[data-imt-rule-visualizer='true']")?.textContent).toContain("content 1");

    overlay.unmount();
  });
});

function createStatus(): PageTranslationStatus {
  return {
    phase: "updating",
    observation: "queued",
    pendingRoots: 2,
    observedRoots: 9,
    dynamicRuns: 1,
    lastError: undefined,
    total: 7,
    translated: 4,
    failed: 1,
    skipped: 0,
    site: {
      hostname: "x.com",
      siteKey: "x.com",
      ruleId: "x",
      ruleSource: "core+imported",
      ruleCapability: "content-ready",
      fallbackProfile: "social",
      mergedRuleIds: ["x", "twitter"],
      dynamicMode: "conservative",
      dynamicModeSource: "site-default",
      isHighDynamic: true,
      ruleDiagnostics: {
        scanRootSelectorCount: 9,
        contentSelectorCount: 6,
        excludeSelectorCount: 11,
        buildContainerSelectorCount: 2,
        skipBuildContainerSelectorCount: 3,
        injectedCssRuleCount: 4,
        globalAttributeRuleCount: 1,
        attributeNameCount: 0,
        translationClassCount: 2,
        lineBreakMaxTextCount: 120,
        allowTooltip: false,
        observeUrlChange: true,
        urlChangeDelay: 350,
        maxQueueSize: 80,
        maxRootsPerFlush: 12,
        maxObservedRoots: 160,
        maxMutationNodesPerWindow: 240,
        mutationWindowMs: 5000,
        viewportSupplement: true,
        viewportSupplementMaxRoots: 20,
        visualizationSelectors: [
          { group: "scan-root", selector: ".tweet" },
          { group: "content", selector: ".body-text", label: "comment" },
          { group: "exclude", selector: ".action" },
          { group: "build-container", selector: ".build-root" },
          { group: "skip-build-container", selector: ".skip-root" },
          { group: "dynamic-exclude", selector: ".dynamic-ignore" },
        ],
      },
    },
    diagnostics: {
      scan: {
        text: {
          seen: 10,
          accepted: 8,
          skipped: 2,
          skippedByReason: { hidden: 2 },
        },
        attributes: {
          seen: 3,
          accepted: 2,
          skipped: 1,
          skippedByReason: { hidden: 1 },
        },
      },
      units: {
        built: 7,
        dropped: 1,
        droppedByReason: { "target-language": 1 },
      },
      cache: {
        hits: 3,
        misses: 4,
      },
      provider: {
        requested: 5,
        failed: 1,
        skipped: 0,
      },
    },
  };
}

function rowText(root: Element | null, testId: string): string {
  const row = root?.querySelector(`[data-testid='${testId}']`);
  expect(row).not.toBeNull();
  return row?.textContent ?? "";
}
