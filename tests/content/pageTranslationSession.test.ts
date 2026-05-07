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
    setVisibilityState("visible");
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
        ruleId: "youtube",
        ruleSource: "core",
        ruleCapability: "content-ready",
        fallbackProfile: "video",
        mergedRuleIds: ["youtube"],
        dynamicMode: "conservative",
        dynamicModeSource: "site-default",
        isHighDynamic: true,
      },
    });

    expect(session.getStatus().site).toEqual({
      hostname: "www.youtube.com",
      siteKey: "youtube.com",
      ruleId: "youtube",
      ruleSource: "core",
      ruleCapability: "content-ready",
      fallbackProfile: "video",
      mergedRuleIds: ["youtube"],
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

  it("retranslates existing translated roots when their text node changes", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p id="live">Initial article text.</p></main>`;
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
    const originalTextNode = document.querySelector("#live")!.firstChild as Text;
    originalTextNode.textContent = "Updated article text.";
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Initial article text.", "Updated article text."]);
    expect(Array.from(document.querySelectorAll("#live .imt-translation-block")).map((node) => node.textContent)).toEqual([
      "[zh-Hans] Updated article text.",
    ]);
  });

  it("does not dynamically translate buttons or extension UI", async () => {
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
    expect(button.textContent).toBe("New button");
    expect(extensionUi.textContent).toBe("Plugin panel");
    expect(session.getStatus()).toMatchObject({ dynamicRuns: 1, observation: "observing" });
  });

  it("translates newly added dynamic content inside an already translated host", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><section id="host"><p>Hello world.</p></section></main>`;
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
    await waitFor(() => session!.getStatus().observation === "observing");
    document.querySelector("#host")?.setAttribute("data-imt-state", "translated");
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content under translated host.";
    document.querySelector("#host")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content under translated host."]);
    expect(lateParagraph.querySelector(".imt-translation-block")?.textContent).toBe(
      "[zh-Hans] Late content under translated host.",
    );
  });

  it("dynamically translates tooltip content when the site policy allows it", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      allowTooltip: true,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      debounceMs: 1500,
      tooltipDebounceMs: 20,
    });

    await session.translatePage();
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.innerHTML = `
      <h2>Void Staff</h2>
      <p>Damage from attacks and Abilities shreds the target.</p>
    `;
    document.body.append(tooltip);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual([
      "Hello world.",
      "Void Staff",
      "Damage from attacks and Abilities shreds the target.",
    ]);
    expect(
      Array.from(tooltip.querySelectorAll(".imt-translation-block, .imt-translation-compact")).map((node) => node.textContent),
    ).toEqual([
      "[zh-Hans] Void Staff",
      "[zh-Hans] Damage from attacks and Abilities shreds the target.",
    ]);
  });

  it("keeps tooltip translation disabled when a site policy excludes hover overlays", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      allowTooltip: false,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      debounceMs: 20,
      excludedDynamicSelectors: ['[role="tooltip"]'],
    });

    await session.translatePage();
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "218 likes. Like";
    document.body.append(tooltip);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world."]);
    expect(tooltip.querySelector(".imt-translation-block")).toBeNull();
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

  it("supplements high-dynamic visible tweet text on scroll without translating hover cards", async () => {
    vi.useFakeTimers();
    setVisibilityState("hidden");
    document.body.innerHTML = `
      <main>
        <article>
          <div data-testid="tweetText" id="first">First visible English tweet.</div>
        </article>
      </main>
    `;
    setElementRect(document.querySelector("#first")!, { top: 20, bottom: 80, left: 0, right: 300 });
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      preferredScanRootSelectors: ['[data-testid="tweetText"]'],
      excludeSelectors: ['[data-testid="HoverCard"]'],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      dynamicMode: "conservative",
      viewportSupplement: true,
      viewportSupplementDebounceMs: 20,
      viewportSupplementRootMargin: "120px",
      viewportSupplementMaxRoots: 4,
      excludedDynamicSelectors: ['[data-testid="HoverCard"]', '[data-imt-state="translated"]'],
    });

    await session.translatePage();
    expect(session.getStatus().observation).toBe("paused");

    const secondTweet = document.createElement("article");
    secondTweet.innerHTML = `<div data-testid="tweetText" id="second">Second visible English tweet.</div>`;
    document.querySelector("main")?.append(secondTweet);
    const hoverCard = document.createElement("div");
    hoverCard.setAttribute("data-testid", "HoverCard");
    hoverCard.innerHTML = `<div data-testid="tweetText" id="hover">Hover card English text.</div>`;
    document.body.append(hoverCard);
    setElementRect(document.querySelector("#second")!, { top: 100, bottom: 160, left: 0, right: 300 });
    setElementRect(document.querySelector("#hover")!, { top: 120, bottom: 180, left: 0, right: 300 });

    window.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(20);
    await waitFor(() => requestedTexts.includes("Second visible English tweet."));

    expect(requestedTexts).toEqual(["First visible English tweet.", "Second visible English tweet."]);
    expect(document.body.textContent).toContain("[zh-Hans] Second visible English tweet.");
    expect(document.querySelector("#hover .imt-translation-block")).toBeNull();
    expect(session.getStatus()).toMatchObject({ phase: "translated", dynamicRuns: 1 });
  });

  it("retranslates the page after SPA pushState route changes", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Initial article text.</p></main>`;
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
      observeUrlChange: true,
      urlChangeDelay: 20,
    });

    await session.translatePage();
    history.pushState({}, "", "/next-page");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Initial article text.", "Initial article text."]);
    expect(session.getStatus()).toMatchObject({ phase: "translated", observation: "observing" });
  });

  it("lets a SPA URL change handler replace policy before the fallback rescan", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Initial article text.</p></main>`;
    const requestedTexts: string[] = [];
    const handledChanges: Array<{ previousUrl: string; currentUrl: string }> = [];
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
      observeUrlChange: true,
      urlChangeDelay: 20,
      onUrlChange: async (change) => {
        handledChanges.push(change);
        return true;
      },
    });

    await session.translatePage();
    const previousUrl = window.location.href;
    history.pushState({}, "", "/policy-next-page");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    await Promise.resolve();

    expect(handledChanges).toEqual([{ previousUrl, currentUrl: window.location.href }]);
    expect(requestedTexts).toEqual(["Initial article text."]);
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

  it("ignores textless dynamic DOM noise without suspending updates", async () => {
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
    const noise = document.createDocumentFragment();
    for (let index = 0; index < 6; index += 1) {
      const div = document.createElement("div");
      div.dataset.noise = String(index);
      noise.append(div);
    }
    document.querySelector("main")?.append(noise);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(session.getStatus()).toMatchObject({ observation: "observing", dynamicRuns: 1 });
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

  it("batches multiple visible lazy roots into one supplemental request", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="first">First lazy paragraph.</p>
        <p id="second">Second lazy paragraph.</p>
      </main>
    `;
    const requestedTexts: string[] = [];
    const batchSizes: number[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        batchSizes.push(items.length);
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
    });

    await session.translatePage();
    FakeIntersectionObserver.instances[0]?.triggerMany([
      document.querySelector("#first")!,
      document.querySelector("#second")!,
    ]);
    await waitFor(() => session!.getStatus().translated === 2);

    expect(batchSizes).toEqual([2]);
    expect(requestedTexts).toEqual(["First lazy paragraph.", "Second lazy paragraph."]);
    expect(session.getStatus()).toMatchObject({ phase: "translated", total: 2, translated: 2 });
  });

  it("updates lazy translation status while progressive chunks are still running", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="first">First lazy paragraph.</p>
        <p id="second">Second lazy paragraph.</p>
      </main>
    `;
    let resolveSecondBatch: (() => void) | undefined;
    const controller = new PageController({
      targetLang: "zh-Hans",
      progressiveBatchItems: 1,
      progressiveConcurrentBatches: 2,
      translateBatch: async (items) => {
        if (items.some((item) => item.text === "Second lazy paragraph.")) {
          return new Promise((resolve) => {
            resolveSecondBatch = () => {
              resolve(items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })));
            };
          });
        }
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
    });

    await session.translatePage();
    FakeIntersectionObserver.instances[0]?.triggerMany([
      document.querySelector("#first")!,
      document.querySelector("#second")!,
    ]);
    await waitFor(() => session!.getStatus().translated === 1);

    expect(session.getStatus()).toMatchObject({
      phase: "updating",
      total: 2,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(document.querySelector("#first .imt-translation-block")?.textContent).toBe("[zh-Hans] First lazy paragraph.");
    expect(document.querySelector("#second .imt-translation-block")).toBeNull();

    resolveSecondBatch?.();
    await waitFor(() => session!.getStatus().translated === 2);

    expect(session.getStatus()).toMatchObject({ phase: "translated", total: 2, translated: 2 });
  });

  it("eagerly translates near-viewport lazy roots before intersection callbacks", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible lazy paragraph.</p>
        <p id="later">Far lazy paragraph.</p>
      </main>
    `;
    setElementRect(document.querySelector("#visible")!, { top: 20, bottom: 60, left: 0, right: 200 });
    setElementRect(document.querySelector("#later")!, { top: 2000, bottom: 2040, left: 0, right: 200 });

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
      eagerLazy: true,
      eagerLazyRootMargin: "100px",
      maxEagerLazyRoots: 10,
    });

    await session.translatePage();
    await waitFor(() => session!.getStatus().translated === 1);

    expect(requestedTexts).toEqual(["Visible lazy paragraph."]);
    expect(document.querySelector("#visible .imt-translation-block")?.textContent).toBe("[zh-Hans] Visible lazy paragraph.");
    expect(FakeIntersectionObserver.instances[0]?.observed.has(document.querySelector("#visible")!)).toBe(false);
    expect(FakeIntersectionObserver.instances[0]?.observed.has(document.querySelector("#later")!)).toBe(true);

    FakeIntersectionObserver.instances[0]?.trigger(document.querySelector("#later")!);
    await waitFor(() => session!.getStatus().translated === 2);
    expect(requestedTexts).toEqual(["Visible lazy paragraph.", "Far lazy paragraph."]);
  });

  it("eagerly translates near-viewport dynamic lazy roots without waiting for intersection callbacks", async () => {
    vi.useFakeTimers();
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `<main><p id="initial">Initial visible paragraph.</p></main>`;
    setElementRect(document.querySelector("#initial")!, { top: 20, bottom: 60, left: 0, right: 200 });

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
      eagerLazy: true,
      eagerLazyRootMargin: "100px",
      debounceMs: 20,
    });

    await session.translatePage();
    await waitFor(() => requestedTexts.includes("Initial visible paragraph."));
    await waitFor(() => session!.getStatus().observation === "observing");

    const dynamicCard = document.createElement("section");
    dynamicCard.id = "dynamic-card";
    dynamicCard.innerHTML = `<p>Dynamic visible card copy.</p>`;
    setElementRect(dynamicCard, { top: 80, bottom: 160, left: 0, right: 240 });
    document.querySelector("main")?.append(dynamicCard);
    await Promise.resolve();
    await waitForWithTimers(() => requestedTexts.includes("Dynamic visible card copy."));

    expect(requestedTexts).toEqual(["Initial visible paragraph.", "Dynamic visible card copy."]);
    expect(document.querySelector("#dynamic-card .imt-translation-block")?.textContent).toBe("[zh-Hans] Dynamic visible card copy.");
  });

  it("eagerly translates dynamic tooltip lazy roots because hover overlays are short lived", async () => {
    vi.useFakeTimers();
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `<main><p id="initial">Initial visible paragraph.</p></main>`;
    setElementRect(document.querySelector("#initial")!, { top: 20, bottom: 60, left: 0, right: 200 });

    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      allowTooltip: true,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
      eagerLazy: true,
      debounceMs: 1500,
      tooltipDebounceMs: 20,
    });

    await session.translatePage();
    await waitFor(() => requestedTexts.includes("Initial visible paragraph."));
    await waitFor(() => session!.getStatus().observation === "observing");

    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.className = "tooltip";
    tooltip.textContent = "Dynamic tooltip description.";
    document.body.append(tooltip);
    await Promise.resolve();
    await waitForWithTimers(() => requestedTexts.includes("Dynamic tooltip description."));

    expect(requestedTexts).toEqual(["Initial visible paragraph.", "Dynamic tooltip description."]);
    expect(tooltip.textContent).toContain("[zh-Hans] Dynamic tooltip description.");
  });

  it("starts viewport-first lazy translation before full lazy root discovery", async () => {
    vi.useFakeTimers();
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible first wave.</p>
        <p id="later">Deferred second wave.</p>
      </main>
    `;
    setElementRect(document.querySelector("#visible")!, { top: 20, bottom: 60, left: 0, right: 200 });
    setElementRect(document.querySelector("#later")!, { top: 2000, bottom: 2040, left: 0, right: 200 });

    const requestedTexts: string[] = [];
    let fullDiscoveryCount = 0;
    class TrackingController extends PageController {
      collectTranslatableRoots(root?: ParentNode): HTMLElement[] {
        fullDiscoveryCount += 1;
        return super.collectTranslatableRoots(root);
      }
    }
    const controller = new TrackingController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
      eagerLazy: true,
      viewportFirst: true,
      eagerLazyRootMargin: "100px",
      lazyDiscoveryDelayMs: 100,
      maxEagerLazyRoots: 10,
    });

    await session.translatePage();
    await waitForWithTimers(() => session!.getStatus().translated === 1, 0);

    expect(fullDiscoveryCount).toBe(0);
    expect(requestedTexts).toEqual(["Visible first wave."]);
    expect(document.querySelector("#visible .imt-translation-block")?.textContent).toBe("[zh-Hans] Visible first wave.");

    await vi.advanceTimersByTimeAsync(100);
    expect(fullDiscoveryCount).toBe(1);
    const laterRoot = document.querySelector("#later")!;
    const lazyObserverEntry = FakeIntersectionObserver.instances
      .map((instance) => ({
        instance,
        target: Array.from(instance.observed).find((observed) =>
          observed === laterRoot || observed.contains(laterRoot) || laterRoot.contains(observed)
        ),
      }))
      .find((entry): entry is { instance: InstanceType<typeof FakeIntersectionObserver>; target: Element } =>
        entry.target instanceof Element
      );
    const fallbackObserver = FakeIntersectionObserver.instances.at(-1);
    if (lazyObserverEntry) {
      lazyObserverEntry.instance.trigger(lazyObserverEntry.target);
      await vi.advanceTimersByTimeAsync(0);
      await waitFor(() => session!.getStatus().translated === 2);
      expect(requestedTexts).toEqual(["Visible first wave.", "Deferred second wave."]);
    } else if (fallbackObserver) {
      fallbackObserver.trigger(laterRoot);
      await vi.advanceTimersByTimeAsync(0);
      await waitFor(() => session!.getStatus().translated === 2);
      expect(requestedTexts).toEqual(["Visible first wave.", "Deferred second wave."]);
    } else {
      expect(requestedTexts).toEqual(["Visible first wave."]);
    }
  });

  it("translates remaining initial lazy roots in the background when eager rest is enabled", async () => {
    vi.useFakeTimers();
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible first wave.</p>
        <p id="later-one">Background second wave.</p>
        <p id="later-two">Background third wave.</p>
      </main>
    `;
    setElementRect(document.querySelector("#visible")!, { top: 20, bottom: 60, left: 0, right: 200 });
    setElementRect(document.querySelector("#later-one")!, { top: 2400, bottom: 2440, left: 0, right: 200 });
    setElementRect(document.querySelector("#later-two")!, { top: 2800, bottom: 2840, left: 0, right: 200 });
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
      eagerLazy: true,
      viewportFirst: true,
      eagerLazyRootMargin: "100px",
      lazyDiscoveryDelayMs: 0,
      firstWaveMaxRoots: 1,
      eagerTranslateRest: true,
      backgroundEagerMaxRoots: 10,
    });

    await session.translatePage();
    await waitFor(() => session!.getStatus().translated === 1);
    expect(requestedTexts).toEqual(["Visible first wave."]);

    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => session!.getStatus().translated === 3);

    expect(requestedTexts).toEqual([
      "Visible first wave.",
      "Background second wave.",
      "Background third wave.",
    ]);
    expect(FakeIntersectionObserver.instances.flatMap((instance) => Array.from(instance.observed))).not.toContain(
      document.querySelector("#later-one"),
    );
  });

  it("falls back to eager lazy roots when viewport-first discovery finds no first wave", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `
      <main>
        <p id="first">Fallback first paragraph.</p>
        <p id="second">Fallback second paragraph.</p>
      </main>
    `;
    const requestedTexts: string[] = [];
    class ViewportMissController extends PageController {
      collectViewportTranslatableRoots(): HTMLElement[] {
        return [];
      }
    }
    const controller = new ViewportMissController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
      eagerLazy: true,
      viewportFirst: true,
      maxEagerLazyRoots: 1,
    });

    await session.translatePage();
    await waitFor(() => session!.getStatus().translated === 1);

    expect(requestedTexts).toEqual(["Fallback first paragraph."]);
    expect(document.querySelector("#first .imt-translation-block")?.textContent).toBe("[zh-Hans] Fallback first paragraph.");
    expect(FakeIntersectionObserver.instances[0]?.observed.has(document.querySelector("#second")!)).toBe(true);
  });

  it("tries the observed root when viewport-first and eager root discovery both miss", async () => {
    const FakeIntersectionObserver = createFakeIntersectionObserver();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    document.body.innerHTML = `<main><p id="article">Recovered article paragraph.</p></main>`;
    const requestedTexts: string[] = [];
    class RootDiscoveryMissController extends PageController {
      collectViewportTranslatableRoots(): HTMLElement[] {
        return [];
      }

      collectTranslatableRoots(): HTMLElement[] {
        return [];
      }
    }
    const controller = new RootDiscoveryMissController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, {
      observeRoot: document.body,
      lazy: true,
      eagerLazy: true,
      viewportFirst: true,
    });

    await session.translatePage();
    await waitFor(() => session!.getStatus().translated === 1);

    expect(requestedTexts).toEqual(["Recovered article paragraph."]);
    expect(document.querySelector("#article .imt-translation-block")?.textContent).toBe("[zh-Hans] Recovered article paragraph.");
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
      this.triggerMany([target], isIntersecting);
    }

    triggerMany(targets: Element[], isIntersecting = true): void {
      this.callback(
        targets.map((target) =>
          ({
            isIntersecting,
            target,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          }) as IntersectionObserverEntry,
        ),
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

function setElementRect(element: Element, rect: Pick<DOMRect, "top" | "bottom" | "left" | "right">): void {
  element.getBoundingClientRect = () =>
    ({
      ...rect,
      width: Math.max(0, rect.right - rect.left),
      height: Math.max(0, rect.bottom - rect.top),
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 50; index += 1) {
    if (predicate()) return;
    await flushMicrotasks();
  }
  expect(predicate()).toBe(true);
}

async function waitForWithTimers(predicate: () => boolean, stepMs = 20): Promise<void> {
  for (let index = 0; index < 50; index += 1) {
    if (predicate()) return;
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(stepMs);
    await flushMicrotasks();
  }
  expect(predicate()).toBe(true);
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
