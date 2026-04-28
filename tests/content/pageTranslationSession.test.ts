import { afterEach, describe, expect, it, vi } from "vitest";
import { PageController } from "@/content/pageController";
import { PageTranslationSession } from "@/content/pageTranslationSession";

describe("PageTranslationSession", () => {
  let session: PageTranslationSession | undefined;

  afterEach(() => {
    session?.dispose();
    session = undefined;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("tracks page translation status transitions", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body });
    const phases: string[] = [];
    session.subscribe((status) => phases.push(status.phase));

    const status = await session.translatePage();

    expect(status).toMatchObject({
      phase: "translated",
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(phases).toEqual(["translating", "translated"]);

    session.restorePage();
    expect(session.getStatus()).toMatchObject({ phase: "idle", total: 0, translated: 0, failed: 0, skipped: 0 });
  });

  it("translates newly added content after page translation", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body, debounceMs: 20 });

    await session.translatePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(session.getStatus()).toMatchObject({
      phase: "translated",
      total: 2,
      translated: 2,
      failed: 0,
      skipped: 0,
      dynamicRuns: 1,
    });
    expect(Array.from(document.querySelectorAll(".imt-translation-block")).map((node) => node.textContent)).toEqual([
      "[zh-Hans] Hello world.",
      "[zh-Hans] Late content.",
    ]);
  });

  it("stops dynamic translation after restore", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body, debounceMs: 20 });
    await session.translatePage();

    session.restorePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world."]);
    expect(session.getStatus().phase).toBe("idle");
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });

  it("lazily translates page roots when they enter the viewport", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible paragraph.</p>
        <p id="later">Later paragraph.</p>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
      lazyRootMargin: "50px",
      lazyThreshold: 0.1,
    });

    await session.translatePage();
    expect(requestedTexts).toEqual([]);
    expect(document.querySelector(".imt-translation-block")).toBeNull();
    expect(FakeIntersectionObserver.instances[0]?.options).toEqual({ root: null, rootMargin: "50px", threshold: 0.1 });

    FakeIntersectionObserver.instances[0]?.trigger(document.querySelector("#visible")!);
    await waitFor(() => session!.getStatus().translated === 1);

    expect(requestedTexts).toEqual(["Visible paragraph."]);
    expect(document.querySelector("#visible .imt-translation-block")?.textContent).toBe("[zh-Hans] Visible paragraph.");
    expect(document.querySelector("#later .imt-translation-block")).toBeNull();

    FakeIntersectionObserver.instances[0]?.trigger(document.querySelector("#later")!);
    await waitFor(() => session!.getStatus().translated === 2);

    expect(requestedTexts).toEqual(["Visible paragraph.", "Later paragraph."]);
    expect(session.getStatus()).toMatchObject({
      phase: "translated",
      total: 2,
      translated: 2,
      failed: 0,
      skipped: 0,
    });
  });
});

function createFakeIntersectionObserver() {
  class FakeIntersectionObserver {
    static instances: FakeIntersectionObserver[] = [];

    readonly observed = new Set<Element>();

    constructor(
      private readonly callback: IntersectionObserverCallback,
      readonly options?: IntersectionObserverInit,
    ) {
      FakeIntersectionObserver.instances.push(this);
    }

    observe(element: Element): void {
      this.observed.add(element);
    }

    unobserve(element: Element): void {
      this.observed.delete(element);
    }

    disconnect(): void {
      this.observed.clear();
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    trigger(target: Element, isIntersecting = true): void {
      this.callback(
        [
          {
            target,
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    }
  }

  return FakeIntersectionObserver;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  expect(predicate()).toBe(true);
}
