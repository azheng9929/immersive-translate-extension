import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingTranslationControl } from "@/content/floatingControl";
import type { PageTranslationStatus } from "@/content/pageTranslationSession";

describe("FloatingTranslationControl", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function openPanel(): void {
    const settingsDot = document.querySelector<HTMLButtonElement>("[data-imt-control='settings-dot']");
    expect(settingsDot).not.toBeNull();
    settingsDot?.click();
  }

  it("keeps the settings panel hidden behind a small dot", () => {
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 0, translated: 0, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
    });

    control.mount(document.body);

    const root = document.querySelector<HTMLElement>("[data-imt-control='root']");
    const ball = document.querySelector<HTMLButtonElement>("[data-imt-control='ball']");
    const settingsDot = document.querySelector<HTMLButtonElement>("[data-imt-control='settings-dot']");
    expect(root?.dataset.imtSurface).toBe("edge-tray");
    expect(ball).not.toBeNull();
    expect(settingsDot).not.toBeNull();
    expect(ball?.querySelector("[data-imt-control='handle-grip']")).not.toBeNull();
    expect(settingsDot?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();

    settingsDot?.click();

    expect(document.querySelector("[data-imt-control='settings-dot']")?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();
    expect(document.querySelector("[data-imt-control='panel-controls']")).not.toBeNull();
    expect(document.querySelector("[data-imt-action='collapse']")).not.toBeNull();
    expect(document.querySelector("[data-imt-action='hide']")).not.toBeNull();
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("就绪");
  });

  it("uses the primary dot to translate and then restore without opening settings", async () => {
    const translatePage = vi.fn().mockResolvedValue({ total: 1, translated: 1, failed: 0, skipped: 0 });
    const restorePage = vi.fn();
    const control = new FloatingTranslationControl({
      translatePage,
      restorePage,
    });

    control.mount(document.body);

    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(translatePage).toHaveBeenCalledTimes(1);
    expect(restorePage).not.toHaveBeenCalled();
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();

    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

    expect(restorePage).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();
  });

  it("ignores a pending primary translation after the primary dot cancels it", async () => {
    let finishTranslation: ((summary: { total: number; translated: number; failed: number; skipped: number }) => void) | undefined;
    const translatePage = vi.fn(
      () =>
        new Promise<{ total: number; translated: number; failed: number; skipped: number }>((resolve) => {
          finishTranslation = resolve;
        }),
    );
    const restorePage = vi.fn();
    const control = new FloatingTranslationControl({
      translatePage,
      restorePage,
    });

    control.mount(document.body);

    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();
    finishTranslation?.({ total: 1, translated: 1, failed: 0, skipped: 0 });
    await Promise.resolve();
    await Promise.resolve();

    expect(translatePage).toHaveBeenCalledTimes(1);
    expect(restorePage).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-imt-control='ball']")?.getAttribute("aria-label")).toBe("翻译当前页面");

    openPanel();

    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("就绪");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toBe("暂无整页翻译");
  });

  it("docks at the right center and can collapse into an edge handle", () => {
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 0, translated: 0, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
    });

    control.mount(document.body);

    const root = document.querySelector<HTMLElement>("[data-imt-control='root']");
    expect(root?.dataset.imtDock).toBe("right-center");
    expect(root?.dataset.collapsed).toBe("false");
    expect(root?.querySelector("style")?.textContent).toContain("top: 50%");
    expect(root?.querySelector("style")?.textContent).toContain("right: 0");

    openPanel();
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();

    document.querySelector<HTMLButtonElement>("[data-imt-action='collapse']")?.click();

    expect(document.querySelector<HTMLElement>("[data-imt-control='root']")?.dataset.collapsed).toBe("true");
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();
    expect(document.querySelector("[data-imt-control='settings-dot']")?.getAttribute("aria-label")).toBe("显示翻译控制台");

    openPanel();

    expect(document.querySelector<HTMLElement>("[data-imt-control='root']")?.dataset.collapsed).toBe("false");
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();
  });

  it("renders a polished handle with status metrics instead of a raw text glyph", () => {
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 0, translated: 0, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      getStatus: () => ({
        phase: "updating",
        observation: "observing",
        pendingRoots: 2,
        observedRoots: 6,
        total: 8,
        translated: 5,
        failed: 1,
        skipped: 0,
        dynamicRuns: 3,
        lastError: undefined,
      }),
    });

    control.mount(document.body);

    const ball = document.querySelector<HTMLButtonElement>("[data-imt-control='ball']");
    expect(ball?.querySelector("[data-imt-control='logo']")).not.toBeNull();
    expect(ball?.textContent?.trim()).toBe("");

    openPanel();

    expect(document.querySelector("[data-imt-control='panel-title']")?.textContent).toBe("整页翻译");
    expect(document.querySelector("[data-imt-control='progress']")?.getAttribute("aria-valuenow")).toBe("63");
    expect(document.querySelector("[data-imt-control='metric-translated']")?.textContent).toContain("5 已翻译");
    expect(document.querySelector("[data-imt-control='metric-failed']")?.textContent).toContain("1 失败");
    expect(document.querySelector("[data-imt-control='metric-pending']")?.textContent).toContain("2 待处理");
  });

  it("runs page translation and shows the translated summary", async () => {
    const translatePage = vi.fn().mockResolvedValue({ total: 3, translated: 2, failed: 1, skipped: 0 });
    const control = new FloatingTranslationControl({
      translatePage,
      restorePage: () => undefined,
    });
    control.mount(document.body);
    openPanel();

    document.querySelector<HTMLButtonElement>("[data-imt-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(translatePage).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("部分完成");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("已翻译 2 / 3");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("失败 1");
  });

  it("reflects page session status updates", () => {
    let listener: ((status: PageTranslationStatus) => void) | undefined;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      subscribeStatus: (next) => {
        listener = next;
        return () => undefined;
      },
    });
    control.mount(document.body);
    openPanel();

    listener?.({
      phase: "updating",
      observation: "observing",
      pendingRoots: 0,
      observedRoots: 0,
      total: 2,
      translated: 1,
      failed: 0,
      skipped: 0,
      dynamicRuns: 1,
      lastError: undefined,
    });

    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("更新中");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("已翻译 1 / 2");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("新内容更新 1 次");
  });

  it("shows paused and suspended new content status", () => {
    let listener: ((status: PageTranslationStatus) => void) | undefined;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      subscribeStatus: (next) => {
        listener = next;
        return () => undefined;
      },
    });
    control.mount(document.body);
    openPanel();

    listener?.({
      phase: "translated",
      observation: "paused",
      pendingRoots: 0,
      observedRoots: 0,
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
      dynamicRuns: 0,
      lastError: undefined,
    });
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("已暂停");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("新内容已暂停");

    listener?.({
      phase: "translated",
      observation: "suspended",
      pendingRoots: 0,
      observedRoots: 0,
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
      dynamicRuns: 0,
      lastError: "Dynamic translation paused because this page is changing too quickly.",
    });
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("已暂停");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("页面变化过快");
  });

  it("shows compact diagnostics for skipped content", () => {
    let listener: ((status: PageTranslationStatus) => void) | undefined;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      subscribeStatus: (next) => {
        listener = next;
        return () => undefined;
      },
    });
    control.mount(document.body);
    openPanel();

    listener?.({
      phase: "translated",
      observation: "observing",
      pendingRoots: 0,
      observedRoots: 0,
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
      dynamicRuns: 0,
      lastError: undefined,
      diagnostics: {
        scan: {
          text: {
            seen: 4,
            accepted: 1,
            skipped: 3,
            skippedByReason: {
              "target-language": 1,
              "global-selector": 2,
            },
          },
          attributes: {
            seen: 1,
            accepted: 0,
            skipped: 1,
            skippedByReason: {
              "target-language": 1,
            },
          },
        },
        units: {
          built: 1,
          dropped: 1,
          droppedByReason: {
            "target-language": 1,
          },
        },
        cache: {
          hits: 0,
          misses: 1,
        },
        provider: {
          requested: 1,
          failed: 0,
          skipped: 0,
        },
        candidates: {
          evaluated: 0,
          accepted: 0,
          byProfile: {},
          acceptedByProfile: {},
        },
      },
    });

    expect(document.querySelector("[data-imt-control='diagnostics']")?.textContent).toContain("跳过：3 目标语言");
    expect(document.querySelector("[data-imt-control='diagnostics']")?.textContent).toContain("2 插件或站点界面");
  });

  it("expands detailed diagnostics from the floating panel", () => {
    let listener: ((status: PageTranslationStatus) => void) | undefined;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      subscribeStatus: (next) => {
        listener = next;
        return () => undefined;
      },
    });
    control.mount(document.body);
    openPanel();

    listener?.({
      phase: "translated",
      observation: "observing",
      pendingRoots: 2,
      observedRoots: 3,
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
      dynamicRuns: 2,
      lastError: undefined,
      diagnostics: {
        scan: {
          text: {
            seen: 4,
            accepted: 1,
            skipped: 3,
            skippedByReason: {
              "target-language": 1,
              "global-selector": 2,
            },
          },
          attributes: {
            seen: 1,
            accepted: 0,
            skipped: 1,
            skippedByReason: {
              "target-language": 1,
            },
          },
        },
        units: {
          built: 1,
          dropped: 1,
          droppedByReason: {
            "target-language": 1,
          },
        },
        cache: {
          hits: 0,
          misses: 1,
        },
        provider: {
          requested: 1,
          failed: 0,
          skipped: 0,
        },
        candidates: {
          evaluated: 0,
          accepted: 0,
          byProfile: {},
          acceptedByProfile: {},
        },
      },
    });

    expect(document.querySelector("[data-imt-control='diagnostics-details']")).toBeNull();

    document.querySelector<HTMLButtonElement>("[data-imt-action='toggle-debug-details']")?.click();

    const details = document.querySelector("[data-imt-control='diagnostics-details']")?.textContent;
    expect(details).toContain("新内容观察中，2 个待处理，3 个懒加载");
    expect(details).toContain("文本扫描 4，接受 1，跳过 3");
    expect(details).toContain("翻译单元 1，丢弃 1");
    expect(details).toContain("缓存 0 命中，1 未命中");
    expect(details).toContain("服务请求 1，失败 0，跳过 0");
  });

  it("opens a page issue locator from the floating panel and explains clicked elements", () => {
    document.body.innerHTML = `
      <main>
        <p class="missed-title">This text was not matched by the active selectors.</p>
      </main>
    `;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      getStatus: () => createRuleStatus(),
    });
    control.mount(document.body);
    openPanel();

    const locatorButton = document.querySelector<HTMLButtonElement>("[data-imt-action='toggle-rule-locator']");
    expect(locatorButton).not.toBeNull();
    expect(locatorButton?.textContent).toBe("定位问题");

    locatorButton?.click();
    expect(document.querySelector("[data-imt-control='root']")?.getAttribute("data-inspecting-rules")).toBe("true");

    document.querySelector<HTMLElement>(".missed-title")?.click();

    const inspectorText = document.querySelector("[data-imt-rule-target-inspector='true']")?.textContent ?? "";
    expect(inspectorText).toContain("未命中规则 selector");
    expect(inspectorText).toContain("p.missed-title");
    expect(inspectorText).toContain("文本: This text was not matched");

    locatorButton?.click();
    expect(document.querySelector("[data-imt-rule-target-inspector='true']")).toBeNull();
  });

  it("explains translated roots from the floating panel issue locator", () => {
    document.body.innerHTML = `
      <main>
        <p class="body-text" data-imt-state="translated">
          Hello world
          <span class="imt-translation-block">你好，世界</span>
        </p>
      </main>
    `;
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
      getStatus: () => createRuleStatus(),
    });
    control.mount(document.body);
    openPanel();

    document.querySelector<HTMLButtonElement>("[data-imt-action='toggle-rule-locator']")?.click();
    document.querySelector<HTMLElement>(".imt-translation-block")?.click();

    const inspectorText = document.querySelector("[data-imt-rule-target-inspector='true']")?.textContent ?? "";
    expect(inspectorText).toContain("已翻译");
    expect(inspectorText).toContain("content:comment");
    expect(inspectorText).toContain("p.body-text");

    control.hide();
    expect(document.querySelector("[data-imt-rule-target-inspector='true']")).toBeNull();
  });

  it("runs restore and returns to ready state", async () => {
    const restorePage = vi.fn();
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage,
    });
    control.mount(document.body);
    openPanel();
    document.querySelector<HTMLButtonElement>("[data-imt-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    document.querySelector<HTMLButtonElement>("[data-imt-action='restore']")?.click();

    expect(restorePage).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("就绪");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toBe("暂无整页翻译");
  });

  it("switches page render state from the floating panel without restoring translations", () => {
    const setRenderState = vi.fn();
    const restorePage = vi.fn();
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage,
      setRenderState,
      getStatus: () => ({
        phase: "translated",
        observation: "observing",
        pendingRoots: 0,
        observedRoots: 0,
        total: 1,
        translated: 1,
        failed: 0,
        skipped: 0,
        dynamicRuns: 0,
        lastError: undefined,
        renderState: "bilingual",
      }),
    });
    control.mount(document.body);
    openPanel();

    document.querySelector<HTMLButtonElement>("[data-imt-action='render-original']")?.click();

    expect(setRenderState).toHaveBeenCalledWith("original");
    expect(restorePage).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLButtonElement>("[data-imt-action='render-original']")?.dataset.active).toBe("true");
  });

  it("hides the floating control for the current page session", () => {
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 0, translated: 0, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
    });
    control.mount(document.body);
    openPanel();

    document.querySelector<HTMLButtonElement>("[data-imt-action='hide']")?.click();

    expect(document.querySelector("[data-imt-control='root']")).toBeNull();
  });
});

function createRuleStatus(): PageTranslationStatus {
  return {
    phase: "translated",
    observation: "observing",
    pendingRoots: 0,
    observedRoots: 0,
    total: 1,
    translated: 1,
    failed: 0,
    skipped: 0,
    dynamicRuns: 0,
    lastError: undefined,
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
        scanRootSelectorCount: 1,
        contentSelectorCount: 1,
        excludeSelectorCount: 1,
        buildContainerSelectorCount: 0,
        skipBuildContainerSelectorCount: 0,
        injectedCssRuleCount: 0,
        globalAttributeRuleCount: 0,
        attributeNameCount: 0,
        translationClassCount: 0,
        allowTooltip: true,
        observeUrlChange: true,
        urlChangeDelay: 250,
        maxQueueSize: 300,
        maxRootsPerFlush: 20,
        maxObservedRoots: 300,
        maxMutationNodesPerWindow: 1000,
        mutationWindowMs: 5000,
        viewportSupplement: false,
        viewportSupplementMaxRoots: 20,
        visualizationSelectors: [
          { group: "content", selector: ".body-text", label: "comment" },
          { group: "exclude", selector: ".action" },
        ],
      },
    },
  };
}
