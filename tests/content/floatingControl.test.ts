import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingTranslationControl } from "@/content/floatingControl";
import type { PageTranslationStatus } from "@/content/pageTranslationSession";

describe("FloatingTranslationControl", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts as a quiet collapsed control and expands on click", () => {
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 0, translated: 0, failed: 0, skipped: 0 }),
      restorePage: () => undefined,
    });

    control.mount(document.body);

    const root = document.querySelector<HTMLElement>("[data-imt-control='root']");
    const ball = document.querySelector<HTMLButtonElement>("[data-imt-control='ball']");
    expect(root?.dataset.imtSurface).toBe("edge-tray");
    expect(ball).not.toBeNull();
    expect(ball?.querySelector("[data-imt-control='handle-grip']")).not.toBeNull();
    expect(ball?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();

    ball?.click();

    expect(document.querySelector("[data-imt-control='ball']")?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();
    expect(document.querySelector("[data-imt-control='panel-controls']")).not.toBeNull();
    expect(document.querySelector("[data-imt-action='collapse']")).not.toBeNull();
    expect(document.querySelector("[data-imt-action='hide']")).not.toBeNull();
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("就绪");
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

    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();

    document.querySelector<HTMLButtonElement>("[data-imt-action='collapse']")?.click();

    expect(document.querySelector<HTMLElement>("[data-imt-control='root']")?.dataset.collapsed).toBe("true");
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();
    expect(document.querySelector("[data-imt-control='ball']")?.getAttribute("aria-label")).toBe("显示翻译控制台");

    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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

    ball?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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

  it("runs restore and returns to ready state", async () => {
    const restorePage = vi.fn();
    const control = new FloatingTranslationControl({
      translatePage: async () => ({ total: 1, translated: 1, failed: 0, skipped: 0 }),
      restorePage,
    });
    control.mount(document.body);
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();
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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

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
    document.querySelector<HTMLButtonElement>("[data-imt-control='ball']")?.click();

    document.querySelector<HTMLButtonElement>("[data-imt-action='hide']")?.click();

    expect(document.querySelector("[data-imt-control='root']")).toBeNull();
  });
});
