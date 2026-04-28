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

  it("exposes translation diagnostics in page status", async () => {
    document.body.innerHTML = `
      <main>
        <p>${"\u8fd9\u7bc7\u6587\u7ae0\u4ecb\u7ecd"} <strong>React Server Components</strong> ${"\u7684"} <span>streaming</span> ${"\u7b56\u7565\u3002"}</p>
        <p>React Server Components stream UI from the server.</p>
      </main>
    `;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body });

    const status = await session.translatePage();

    expect(status.diagnostics).toMatchObject({
      units: {
        built: 1,
        dropped: 1,
        droppedByReason: {
          "target-language": 1,
        },
      },
    });
  });

  it("exposes site dynamic mode metadata in page status", () => {
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      dynamicMode: "conservative",
      site: {
        hostname: "www.youtube.com",
        siteKey: "youtube.com",
        dynamicMode: "conservative",
        dynamicModeSource: "site-default",
        isHighDynamic: true,
      },
    });

    expect(session.getStatus().site).toEqual({
      hostname: "www.youtube.com",
      siteKey: "youtube.com",
      dynamicMode: "conservative",
      dynamicModeSource: "site-default",
      isHighDynamic: true,
    });
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

  it("does not dynamically translate tooltips, buttons, or extension UI", async () => {
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
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "218 likes. Like";
    document.body.append(tooltip);
    const button = document.createElement("button");
    button.textContent = "New button";
    document.body.append(button);
    const extensionUi = document.createElement("div");
    extensionUi.dataset.imtManaged = "true";
    extensionUi.textContent = "Plugin panel";
    document.body.append(extensionUi);
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(tooltip.querySelector(".imt-translation-block")).toBeNull();
    expect(button.textContent).toBe("New button");
    expect(extensionUi.textContent).toBe("Plugin panel");
    expect(session.getStatus()).toMatchObject({ dynamicRuns: 1, observation: "observing" });
  });

  it("keeps dynamic translation off when the site policy disables it", async () => {
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
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      debounceMs: 20,
      dynamicMode: "off",
    });

    await session.translatePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world."]);
    expect(session.getStatus()).toMatchObject({ phase: "translated", observation: "inactive" });
  });

  it("pauses dynamic translation while the page is hidden and catches up when visible again", async () => {
    vi.useFakeTimers();
    setVisibilityState("hidden");
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
    expect(session.getStatus().observation).toBe("paused");
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    expect(requestedTexts).toEqual(["Hello world."]);

    setVisibilityState("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(session.getStatus()).toMatchObject({ phase: "translated", observation: "observing", dynamicRuns: 1 });
  });

  it("suspends dynamic translation after a burst of page changes", async () => {
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
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      debounceMs: 20,
      maxMutationNodesPerWindow: 2,
      mutationWindowMs: 1000,
    });

    await session.translatePage();
    const fragment = document.createDocumentFragment();
    for (const text of ["One new paragraph.", "Two new paragraph.", "Three new paragraph."]) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      fragment.append(paragraph);
    }
    document.querySelector("main")?.append(fragment);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world."]);
    expect(session.getStatus()).toMatchObject({
      phase: "translated",
      observation: "suspended",
      lastError: "Dynamic translation paused because this page is changing too quickly.",
    });
  });

  it("queues content added while a dynamic update is already translating", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    let resolveFirstDynamicBatch: (() => void) | undefined;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        if (items.some((item) => item.text === "Late content.")) {
          return new Promise((resolve) => {
            resolveFirstDynamicBatch = () => {
              resolve(items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })));
            };
          });
        }
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body, debounceMs: 20 });

    await session.translatePage();
    const firstLateParagraph = document.createElement("p");
    firstLateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(firstLateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    await Promise.resolve();
    expect(session.getStatus().phase).toBe("updating");

    const secondLateParagraph = document.createElement("p");
    secondLateParagraph.textContent = "Second late content.";
    document.querySelector("main")?.append(secondLateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    resolveFirstDynamicBatch?.();
    await vi.advanceTimersByTimeAsync(20);
    await waitFor(() => requestedTexts.includes("Second late content."));

    expect(requestedTexts).toEqual(["Hello world.", "Late content.", "Second late content."]);
    expect(session.getStatus()).toMatchObject({ phase: "translated", dynamicRuns: 2 });
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

function setVisibilityState(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  expect(predicate()).toBe(true);
}
