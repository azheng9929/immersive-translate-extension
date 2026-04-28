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
