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

    const ball = document.querySelector<HTMLButtonElement>("[data-imt-control='ball']");
    expect(ball).not.toBeNull();
    expect(ball?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[data-imt-control='panel']")).toBeNull();

    ball?.click();

    expect(document.querySelector("[data-imt-control='ball']")?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("[data-imt-control='panel']")).not.toBeNull();
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Ready");
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
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Partial");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("2 / 3 translated");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("1 failed");
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

    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Updating");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("1 / 2 translated");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("1 dynamic update");
  });

  it("shows paused and suspended dynamic status", () => {
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
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Paused");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("dynamic updates paused");

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
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Suspended");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toContain("changing too quickly");
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

    expect(document.querySelector("[data-imt-control='diagnostics']")?.textContent).toContain("Skipped: 3 target language");
    expect(document.querySelector("[data-imt-control='diagnostics']")?.textContent).toContain("2 extension/site UI");
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
    expect(details).toContain("Dynamic observing, 2 pending, 3 lazy");
    expect(details).toContain("Text scan 4 seen, 1 accepted, 3 skipped");
    expect(details).toContain("Units 1 built, 1 dropped");
    expect(details).toContain("Cache 0 hits, 1 miss");
    expect(details).toContain("Provider 1 requested, 0 failed, 0 skipped");
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
    expect(document.querySelector("[data-imt-control='status']")?.textContent).toBe("Ready");
    expect(document.querySelector("[data-imt-control='summary']")?.textContent).toBe("No page translation yet");
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
