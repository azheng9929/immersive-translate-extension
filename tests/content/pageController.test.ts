import { describe, expect, it } from "vitest";
import { PageController } from "@/content/pageController";
import { resolveWebTranslationPolicy } from "@/content/webTranslationRules";
import type { TranslationCache, TranslationCacheLookup, TranslationCacheWrite } from "@/shared/translationCache";

class MemoryTranslationCache implements TranslationCache {
  private readonly values = new Map<string, string>();

  async getMany(lookups: TranslationCacheLookup[]): Promise<Map<string, string>> {
    return new Map(
      lookups.flatMap((lookup) => {
        const value = this.values.get(lookup.key);
        return value ? [[lookup.key, value] as const] : [];
      }),
    );
  }

  async putMany(entries: TranslationCacheWrite[]): Promise<void> {
    for (const entry of entries) {
      this.values.set(entry.key, entry.translatedText);
    }
  }
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  expect(predicate()).toBe(true);
}

function setElementRect(element: Element, rect: Partial<DOMRect>): void {
  element.getBoundingClientRect = () =>
    ({
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      width: (rect.right ?? 0) - (rect.left ?? 0),
      height: (rect.bottom ?? 0) - (rect.top ?? 0),
      top: rect.top ?? 0,
      bottom: rect.bottom ?? 0,
      left: rect.left ?? 0,
      right: rect.right ?? 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("PageController", () => {
  it("translates and restores a mixed page using fake translation", async () => {
    document.body.innerHTML = `
      <main>
        <p>Hello world.</p>
        <button>Submit</button>
        <input placeholder="Search docs" />
      </main>
    `;

    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    await controller.translatePage();

    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
    expect(document.querySelector("button")?.textContent).toBe("[zh-Hans] Submit");
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("[zh-Hans] Search docs");

    controller.restorePage();
    expect(document.querySelector(".imt-translation-block")).toBeNull();
    expect(document.querySelector("button")?.textContent).toBe("Submit");
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("Search docs");
  });

  it("translates and restores readable text inside open shadow roots", async () => {
    document.body.innerHTML = `<main><article-card></article-card></main>`;
    const host = document.querySelector<HTMLElement>("article-card")!;
    const shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `<article><p>Shadow article text.</p></article>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    await controller.translatePage();

    expect(shadowRoot.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Shadow article text.");

    controller.restorePage();
    expect(shadowRoot.querySelector(".imt-translation-block")).toBeNull();
    expect(shadowRoot.querySelector("p")?.textContent).toBe("Shadow article text.");
  });

  it("does not write stale translation results after restore", async () => {
    document.body.innerHTML = `<p>Hello world.</p>`;
    let resolveBatch: ((value: Array<{ id: string; text: string; status: "ok" }>) => void) | undefined;
    let capturedItems: Array<{ id: string; text: string }> = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        capturedItems = items;
        return new Promise((resolve) => {
          resolveBatch = resolve;
        });
      },
    });

    const translatePromise = controller.translatePage();
    await Promise.resolve();
    controller.restorePage();
    resolveBatch?.(capturedItems.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" })));
    await translatePromise;

    expect(document.querySelector(".imt-translation-block")).toBeNull();
    expect(document.querySelector(".imt-translation-loading")).toBeNull();
    expect(document.querySelector("p")?.textContent).toBe("Hello world.");
  });

  it("shows a loading dot while a text unit is translating and removes it after rendering", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    let resolveBatch: (() => void) | undefined;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        new Promise((resolve) => {
          resolveBatch = () => {
            resolve(items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })));
          };
        }),
    });

    const translatePromise = controller.translatePage();
    await waitFor(() => document.querySelector(".imt-translation-loading") !== null);

    const loading = document.querySelector<HTMLElement>(".imt-translation-loading");
    expect(loading?.getAttribute("data-imt-managed")).toBe("true");
    expect(loading?.getAttribute("aria-label")).toBe("Translating");
    expect(document.querySelector("p")?.getAttribute("data-imt-state")).toBe("loading");

    resolveBatch?.();
    await translatePromise;

    expect(document.querySelector(".imt-translation-loading")).toBeNull();
    expect(document.querySelector("p")?.getAttribute("data-imt-state")).toBe("translated");
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
  });

  it("removes loading dots when translation fails", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: "", status: "failed" as const, error: "provider failed" })),
    });

    await controller.translatePage();

    expect(document.querySelector(".imt-translation-loading")).toBeNull();
    expect(document.querySelector("p")?.getAttribute("data-imt-state")).toBeNull();
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });

  it("renders progressive provider chunks as soon as each chunk returns", async () => {
    document.body.innerHTML = `<main><p id="first">First paragraph.</p><p id="second">Second paragraph.</p></main>`;
    let resolveSecondBatch: (() => void) | undefined;
    const batchTexts: string[][] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      progressiveBatchItems: 1,
      progressiveConcurrentBatches: 2,
      translateBatch: async (items) => {
        batchTexts.push(items.map((item) => item.text));
        if (items.some((item) => item.text === "Second paragraph.")) {
          return new Promise((resolve) => {
            resolveSecondBatch = () => {
              resolve(items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })));
            };
          });
        }
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const translatePromise = controller.translatePage();
    await waitFor(() => document.querySelector("#first .imt-translation-block")?.textContent === "[zh-Hans] First paragraph.");

    expect(batchTexts).toEqual([["First paragraph."], ["Second paragraph."]]);
    expect(document.querySelector("#second .imt-translation-block")).toBeNull();

    resolveSecondBatch?.();
    await translatePromise;

    expect(document.querySelector("#second .imt-translation-block")?.textContent).toBe("[zh-Hans] Second paragraph.");
  });

  it("collects only near-viewport roots for the first translation wave", () => {
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible paragraph.</p>
        <p id="far">Far paragraph.</p>
        <p id="visible-later">Another visible paragraph.</p>
      </main>
    `;
    setElementRect(document.querySelector("#visible")!, { top: 20, bottom: 60, left: 0, right: 200 });
    setElementRect(document.querySelector("#far")!, { top: 2200, bottom: 2240, left: 0, right: 200 });
    setElementRect(document.querySelector("#visible-later")!, { top: 120, bottom: 160, left: 0, right: 200 });

    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    const roots = controller.collectViewportTranslatableRoots(document.body, {
      rootMargin: "100px",
      maxRoots: 1,
    });

    expect(roots).toEqual([document.querySelector("#visible")]);
  });

  it("skips rule-excluded roots during the first translation wave", () => {
    document.body.innerHTML = `
      <main>
        <p id="visible">Visible paragraph.</p>
        <aside class="recommendations"><p id="sidebar">Recommended stories and sidebar links.</p></aside>
      </main>
    `;
    setElementRect(document.querySelector("#visible")!, { top: 20, bottom: 60, left: 0, right: 200 });
    setElementRect(document.querySelector("#sidebar")!, { top: 80, bottom: 120, left: 0, right: 200 });

    const controller = new PageController({
      targetLang: "zh-Hans",
      excludeSelectors: [".recommendations"],
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    const roots = controller.collectViewportTranslatableRoots(document.body, {
      rootMargin: "100px",
      maxRoots: 10,
    });

    expect(roots).toEqual([document.querySelector("#visible")]);
  });

  it("uses cached translations instead of requesting the same text twice", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p><button>Submit</button></main>`;
    const cache = new MemoryTranslationCache();
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      providerId: "mock",
      cache,
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();
    await controller.translatePage();

    expect(batchCalls).toBe(1);
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
    expect(document.querySelector("button")?.textContent).toBe("[zh-Hans] Submit");
  });

  it("requests duplicate cache-key text only once and renders every matching unit", async () => {
    document.body.innerHTML = `
      <main>
        <p id="first">Repeated sentence.</p>
        <p id="second">Repeated sentence.</p>
        <button id="action">Repeated sentence.</button>
      </main>
    `;
    const requestedTextsByCall: string[][] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      providerId: "mock",
      translateBatch: async (items) => {
        requestedTextsByCall.push(items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const result = await controller.translatePage();

    expect(requestedTextsByCall).toEqual([["Repeated sentence."]]);
    expect(result).toEqual({
      total: 3,
      translated: 3,
      failed: 0,
      skipped: 0,
    });
    expect(document.querySelector("#first .imt-translation-block")?.textContent).toBe("[zh-Hans] Repeated sentence.");
    expect(document.querySelector("#second .imt-translation-block")?.textContent).toBe("[zh-Hans] Repeated sentence.");
    expect(document.querySelector("#action")?.textContent).toBe("[zh-Hans] Repeated sentence.");
  });

  it("translates Threads feed text without translating authors, actions, or metrics", async () => {
    document.body.innerHTML = `
      <main>
        <nav><span>For You</span></nav>
        <div role="article">
          <a href="/@alice"><span dir="auto">alice</span></a>
          <time>2h</time>
          <div class="thread-body"><div dir="auto">Only regret is not trying this sooner.</div></div>
          <div role="button" aria-label="Reply"><span>Reply</span></div>
          <div role="button" aria-label="Like"><span>1.2K</span></div>
        </div>
        <div role="dialog">
          <div role="article">
            <div class="thread-body"><div dir="auto">A dialog thread reply should translate too.</div></div>
          </div>
        </div>
      </main>
    `;
    const policy = resolveWebTranslationPolicy("https://www.threads.com/", "normal");
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: policy.hostname,
      preferredScanRootSelectors: policy.preferredScanRootSelectors,
      excludeSelectors: policy.excludeSelectors,
      contentSelectors: policy.contentSelectors,
      filterRule: policy.filterRule,
      attributeNames: policy.attributeNames,
      allowTooltip: policy.allowTooltip,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual([
      "Only regret is not trying this sooner.",
      "A dialog thread reply should translate too.",
    ]);
    expect(document.querySelector(".thread-body .imt-translation-block")?.textContent).toBe(
      "[zh-Hans] Only regret is not trying this sooner.",
    );
    expect(document.body.textContent).toContain("alice");
    expect(document.body.textContent).toContain("Reply");
    expect(document.body.textContent).toContain("1.2K");
    expect(document.body.textContent).not.toContain("[zh-Hans] alice");
    expect(document.body.textContent).not.toContain("[zh-Hans] Reply");
    expect(document.body.textContent).not.toContain("[zh-Hans] 1.2K");
  });

  it("translates old Reddit content without translating chrome, authors, or scores", async () => {
    document.body.innerHTML = `
      <div id="header"><span>my subreddits</span></div>
      <div class="content">
        <div class="thing link">
          <span class="rank">1</span>
          <div class="midcol"><div class="score">487</div></div>
          <div class="entry">
            <p class="title">
              <span class="linkflairlabel">Politics</span>
              <a class="title">A long article title worth translating on old Reddit</a>
              <span class="domain">(example.com)</span>
            </p>
            <p class="tagline">submitted 6 hours ago by <a class="author">alice</a></p>
            <ul class="flat-list buttons">
              <li><a class="comments">23 comments</a></li>
              <li><a>share</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="side">
        <div class="md">
          <h1>Rule 1: Be Polite</h1>
          <p>Have great discussions, but follow reddiquette.</p>
        </div>
      </div>
      <div class="comment">
        <div class="usertext-body"><div class="md"><p>This comment adds useful context for old Reddit.</p></div></div>
      </div>
    `;
    const policy = resolveWebTranslationPolicy("https://old.reddit.com/r/TrueReddit/", "normal");
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: policy.hostname,
      preferredScanRootSelectors: policy.preferredScanRootSelectors,
      excludeSelectors: policy.excludeSelectors,
      contentSelectors: policy.contentSelectors,
      filterRule: policy.filterRule,
      attributeNames: policy.attributeNames,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual([
      "Politics",
      "A long article title worth translating on old Reddit",
      "Rule 1: Be Polite",
      "Have great discussions, but follow reddiquette.",
      "This comment adds useful context for old Reddit.",
    ]);
    expect(document.body.textContent).toContain("[zh-Hans] A long article title worth translating on old Reddit");
    expect(document.body.textContent).toContain("[zh-Hans] Have great discussions, but follow reddiquette.");
    expect(document.body.textContent).not.toContain("[zh-Hans] alice");
    expect(document.body.textContent).not.toContain("[zh-Hans] 487");
    expect(document.body.textContent).not.toContain("[zh-Hans] 23 comments");
    expect(document.body.textContent).not.toContain("[zh-Hans] share");
    expect(document.body.textContent).not.toContain("[zh-Hans] my subreddits");
  });

  it("keys cached translations by page title context", async () => {
    document.body.innerHTML = `<main><p>Comps</p></main>`;
    const cache = new MemoryTranslationCache();
    let pageTitle = "MetaTFT - Best TFT Comps";
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      providerId: "mock",
      cache,
      getPageTitle: () => pageTitle,
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) => ({ id: item.id, text: `[${pageTitle}] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();
    pageTitle = "GitHub Pull Requests";
    await controller.translatePage();

    expect(batchCalls).toBe(2);
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[GitHub Pull Requests] Comps");
  });

  it("does not cache failed translation results", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const cache = new MemoryTranslationCache();
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      providerId: "mock",
      cache,
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) => ({ id: item.id, text: "", status: "failed" as const }));
      },
    });

    await controller.translatePage();
    await controller.translatePage();

    expect(batchCalls).toBe(2);
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });

  it("returns a page translation summary for the control UI", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p><button>Submit</button></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) =>
          item.text === "Submit"
            ? { id: item.id, text: "", status: "failed" as const, error: "provider failed" }
            : { id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const },
        ),
    });

    const result = await controller.translatePage();

    expect(result).toEqual({
      total: 2,
      translated: 1,
      failed: 1,
      skipped: 0,
    });
  });

  it("keeps explainable diagnostics for skipped text, cache, and provider work", async () => {
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

    await controller.translatePage();

    expect(controller.getDiagnostics()).toMatchObject({
      units: {
        built: 1,
        dropped: 1,
        droppedByReason: {
          "target-language": 1,
        },
      },
      provider: {
        requested: 1,
        failed: 0,
        skipped: 0,
      },
      cache: {
        hits: 0,
        misses: 1,
      },
    });
  });

  it("uses translation-only display mode to replace readable page text", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      displayMode: "translation-only",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    await controller.translatePage();

    expect(document.querySelector("p")?.textContent).toBe("[zh-Hans] Hello world.");
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });

  it("switches translated content between bilingual, translation-only, and original without another provider request", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      displayMode: "bilingual",
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(batchCalls).toBe(1);
    expect(document.querySelector("p")?.textContent).toContain("Hello world.");
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");

    controller.setRenderState("translation");
    expect(batchCalls).toBe(1);
    expect(document.querySelector("p")?.textContent).toBe("[zh-Hans] Hello world.");
    expect(document.querySelector(".imt-translation-block")).toBeNull();

    controller.setRenderState("bilingual");
    expect(batchCalls).toBe(1);
    expect(document.querySelector("p")?.textContent).toContain("Hello world.");
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");

    controller.setRenderState("original");
    expect(batchCalls).toBe(1);
    expect(document.querySelector("p")?.textContent).toBe("Hello world.");
    expect(document.querySelector(".imt-translation-block")).toBeNull();

    controller.setRenderState("bilingual");
    expect(batchCalls).toBe(1);
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
  });

  it("keeps fragile UI as replacement in bilingual display mode", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p><button>Submit</button></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      displayMode: "bilingual",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });

    await controller.translatePage();

    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
    expect(document.querySelector("button")?.textContent).toBe("[zh-Hans] Submit");
  });

  it("translates newly added content without re-translating existing translated units", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);

    const result = await controller.translateNewContent(lateParagraph);

    expect(result).toEqual({
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(Array.from(document.querySelectorAll(".imt-translation-block")).map((node) => node.textContent)).toEqual([
      "[zh-Hans] Hello world.",
      "[zh-Hans] Late content.",
    ]);

    controller.restorePage();
    expect(document.body.textContent?.replace(/\s+/g, " ").trim()).toBe("Hello world.Late content.");
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });

  it("translates multiple supplemental roots in one provider batch", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
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

    await controller.translatePage();
    const firstLateParagraph = document.createElement("p");
    firstLateParagraph.textContent = "First late content.";
    const secondLateParagraph = document.createElement("p");
    secondLateParagraph.textContent = "Second late content.";
    document.querySelector("main")?.append(firstLateParagraph, secondLateParagraph);

    const result = await controller.translateNewContents([firstLateParagraph, secondLateParagraph]);

    expect(result).toEqual({
      total: 2,
      translated: 2,
      failed: 0,
      skipped: 0,
    });
    expect(batchSizes).toEqual([1, 2]);
    expect(requestedTexts).toEqual(["Hello world.", "First late content.", "Second late content."]);
  });

  it("skips already translated areas during supplemental scans", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();
    const result = await controller.translateNewContent(document.body);

    expect(result).toEqual({
      total: 0,
      translated: 0,
      failed: 0,
      skipped: 0,
    });
    expect(batchCalls).toBe(1);
    expect(document.querySelectorAll(".imt-translation-block")).toHaveLength(1);
  });

  it("retries failed translation units before marking them failed", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    let batchCalls = 0;
    const controller = new PageController({
      targetLang: "zh-Hans",
      retry: { maxAttempts: 2, delayMs: 0 },
      translateBatch: async (items) => {
        batchCalls += 1;
        return items.map((item) =>
          batchCalls === 1
            ? { id: item.id, text: "", status: "failed" as const, error: "temporary failure" }
            : { id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const },
        );
      },
    });

    const result = await controller.translatePage();

    expect(batchCalls).toBe(2);
    expect(result).toEqual({
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("[zh-Hans] Hello world.");
  });

  it("only retries the units that failed in a mixed batch", async () => {
    document.body.innerHTML = `<main><p>First paragraph.</p><p>Second paragraph.</p></main>`;
    const requestedTextsByCall: string[][] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      retry: { maxAttempts: 2, delayMs: 0 },
      translateBatch: async (items) => {
        requestedTextsByCall.push(items.map((item) => item.text));
        return items.map((item) =>
          item.text === "Second paragraph." && requestedTextsByCall.length === 1
            ? { id: item.id, text: "", status: "failed" as const, error: "temporary failure" }
            : { id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const },
        );
      },
    });

    const result = await controller.translatePage();

    expect(requestedTextsByCall).toEqual([["First paragraph.", "Second paragraph."], ["Second paragraph."]]);
    expect(result).toEqual({
      total: 2,
      translated: 2,
      failed: 0,
      skipped: 0,
    });
  });

  it("uses safe attribute translation by default", async () => {
    document.body.innerHTML = `
      <main>
        <input placeholder="Search docs" title="Tooltip label" aria-label="Search input" />
        <img alt="Diagram description" title="Image hover text" />
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

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Search docs", "Diagram description"]);
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("[zh-Hans] Search docs");
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("[zh-Hans] Diagram description");
    expect(document.querySelector("input")?.getAttribute("title")).toBe("Tooltip label");
    expect(document.querySelector("input")?.getAttribute("aria-label")).toBe("Search input");
    expect(document.querySelector("img")?.getAttribute("title")).toBe("Image hover text");
  });

  it("can translate title and aria-label attributes when explicitly enabled", async () => {
    document.body.innerHTML = `<main><input title="Tooltip label" aria-label="Search input" /></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      attributeNames: ["title", "aria-label"],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Tooltip label", "Search input"]);
    expect(document.querySelector("input")?.getAttribute("title")).toBe("[zh-Hans] Tooltip label");
    expect(document.querySelector("input")?.getAttribute("aria-label")).toBe("[zh-Hans] Search input");
  });

  it("passes only semantic site content to the translator on high-dynamic pages", async () => {
    document.body.innerHTML = `
      <main>
        <div id="masthead-container">Search</div>
        <h1 class="title">How large language models actually work</h1>
        <div id="metadata-line">1.2M views</div>
        <div id="top-level-buttons-computed"><button>Share</button></div>
        <yt-formatted-string id="content-text">This explanation finally made the idea click for me.</yt-formatted-string>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: "www.youtube.com",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual([
      "How large language models actually work",
      "This explanation finally made the idea click for me.",
    ]);
    expect(document.body.textContent).toContain("Search");
    expect(document.body.textContent).toContain("1.2M views");
    expect(document.body.textContent).toContain("Share");
    expect(document.querySelector("h1")?.textContent).toContain("[zh-Hans] How large language models actually work");
  });

  it("uses mainFrameSelector to keep page scans inside the configured content frame", async () => {
    document.body.innerHTML = `
      <aside><p>Navigation teaser outside the article frame.</p></aside>
      <main class="reader"><p>Readable article paragraph.</p></main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      mainFrameSelector: "main.reader",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Readable article paragraph."]);
    expect(document.querySelector("aside .imt-translation-block")).toBeNull();
    expect(document.querySelector("main .imt-translation-block")?.textContent).toBe("[zh-Hans] Readable article paragraph.");
  });

  it("uses build and skip container selectors to choose scan roots", async () => {
    document.body.innerHTML = `
      <main class="reader"><p>Readable article paragraph.</p></main>
      <aside class="recommendations"><p>Recommended teaser outside the article.</p></aside>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      buildContainerSelectors: ["main.reader", "aside.recommendations"],
      skipBuildContainerSelectors: ["aside.recommendations"],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Readable article paragraph."]);
    expect(document.querySelector("aside .imt-translation-block")).toBeNull();
  });

  it("translates Inworld-style multi-section landing pages without nav or code blocks", async () => {
    document.body.innerHTML = `
      <div class="min-h-screen">
        <header><a href="/products">Products</a><button>Log In</button></header>
        <section>
          <h1>The most natural voice AI</h1>
          <p>Production-grade APIs built for developers.</p>
        </section>
        <section>
          <h2>Reason in realtime</h2>
          <p>Route to the best model and tools for every user and context.</p>
          <code>curl https://api.inworld.ai/v1/chat/completions</code>
        </section>
        <section>
          <div class="bg-white rounded-lg p-6">
            <span>Provider agnostic</span>
            <div>Route to the model that fits your latency, cost, or quality requirements.</div>
          </div>
        </section>
        <footer><a href="/privacy">Privacy</a></footer>
      </div>
    `;
    const requestedTexts: string[] = [];
    const policy = resolveWebTranslationPolicy("https://inworld.ai/", "normal");
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: "inworld.ai",
      ...(policy.mainFrameSelector ? { mainFrameSelector: policy.mainFrameSelector } : {}),
      buildContainerSelectors: policy.buildContainerSelectors,
      skipBuildContainerSelectors: policy.skipBuildContainerSelectors,
      preferredScanRootSelectors: policy.preferredScanRootSelectors,
      excludeSelectors: policy.excludeSelectors,
      contentSelectors: policy.contentSelectors,
      filterRule: policy.filterRule,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toContain("The most natural voice AI");
    expect(requestedTexts).toContain("Production-grade APIs built for developers.");
    expect(requestedTexts).toContain("Reason in realtime");
    expect(requestedTexts).toContain("Route to the best model and tools for every user and context.");
    expect(requestedTexts).toContain("Provider agnostic Route to the model that fits your latency, cost, or quality requirements.");
    expect(requestedTexts).not.toContain("Products");
    expect(requestedTexts).not.toContain("Log In");
    expect(requestedTexts.join("\n")).not.toContain("curl https://api.inworld.ai");
  });

  it("can disable generic body fallback when a rule opts out", async () => {
    document.body.innerHTML = `<main><p>Generic fallback paragraph should stay original.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      bodyRule: { enable: false },
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const result = await controller.translatePage();

    expect(result.total).toBe(0);
    expect(requestedTexts).toEqual([]);
  });

  it("skips generic document scans below the configured main frame text threshold", async () => {
    document.body.innerHTML = `<main><p>Short text.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      mainFrameMinTextCount: 80,
      mainFrameMinWordCount: 10,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const result = await controller.translatePage();

    expect(result.total).toBe(0);
    expect(requestedTexts).toEqual([]);
  });

  it("uses preferred scan roots to avoid translating Twitter chrome", async () => {
    document.body.innerHTML = `
      <main>
        <aside data-testid="sidebarColumn">Trending now</aside>
        <article data-testid="tweet">
          <div data-testid="User-Name"><span>OpenAI</span><span>@openai</span></div>
          <time>2h</time>
          <div data-testid="tweetText" lang="en">
            Shipping readable translation without moving the page layout.
          </div>
          <div role="button">Reply</div>
          <div data-testid="like">218</div>
        </article>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: "x.com",
      preferredScanRootSelectors: [
        'article[data-testid="tweet"] div[data-testid="tweetText"]',
        'div[data-testid="tweetText"]',
      ],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Shipping readable translation without moving the page layout."]);
    expect(document.body.textContent).toContain("Trending now");
    expect(document.body.textContent).toContain("@openai");
    expect(document.body.textContent).toContain("Reply");
    expect(document.querySelector('[data-testid="tweetText"]')?.textContent).toContain(
      "[zh-Hans] Shipping readable translation without moving the page layout.",
    );
  });

  it("does not fall back to generic scanning when preferred roots are configured", async () => {
    document.body.innerHTML = `
      <main>
        <section data-testid="unknownPanel">Trending stories and suggested accounts</section>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: "x.com",
      preferredScanRootSelectors: ['div[data-testid="tweetText"]'],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const result = await controller.translatePage();

    expect(result).toEqual({
      total: 0,
      translated: 0,
      failed: 0,
      skipped: 0,
    });
    expect(requestedTexts).toEqual([]);
  });

  it("honors rule-driven exclude selectors during page scans", async () => {
    document.body.innerHTML = `
      <main>
        <p>Readable article paragraph.</p>
        <aside class="recommendations">Recommended stories and sidebar links.</aside>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      excludeSelectors: [".recommendations"],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Readable article paragraph."]);
    expect(document.querySelector(".recommendations")?.textContent).toBe("Recommended stories and sidebar links.");
  });

  it("prefers a high-confidence article root over generic navigation on unknown sites", async () => {
    document.body.innerHTML = `
      <header>
        <a href="/home">Home</a>
        <a href="/pricing">Pricing</a>
        <button>Sign in</button>
      </header>
      <main>
        <article>
          <h1>Translation quality on complex websites</h1>
          <p>
            This article explains why a translator should identify the primary reading area before
            sending text to a provider. It has enough body copy to be treated as the page root.
          </p>
        </article>
      </main>
      <aside><p>Related stories and sidebar links.</p></aside>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual([
      "Translation quality on complex websites",
      "This article explains why a translator should identify the primary reading area before sending text to a provider. It has enough body copy to be treated as the page root.",
    ]);
    expect(document.querySelector("header .imt-translation-block")).toBeNull();
    expect(document.querySelector("aside .imt-translation-block")).toBeNull();
  });

  it("lets rule-driven exclude selectors win over content selectors", async () => {
    document.body.innerHTML = `
      <main>
        <article class="story">
          <p>Readable article paragraph.</p>
          <aside class="recommendations">
            <p>Recommended story teaser.</p>
          </aside>
        </article>
      </main>
    `;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      excludeSelectors: [".recommendations"],
      contentSelectors: [{ selector: ".story", category: "content-block" }],
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    await controller.translatePage();

    expect(requestedTexts).toEqual(["Readable article paragraph."]);
    expect(document.querySelector(".recommendations")?.textContent?.trim()).toBe("Recommended story teaser.");
  });

  it("keeps Xvideos homepage title units separate from localized metadata", async () => {
    document.body.innerHTML = `
      <div id="content">
        <div class="mozaique">
          <div class="thumb-block">
            <div class="thumb-under">
              <p class="title"><a>English video title that needs translation <span class="duration">10分钟</span></a></p>
              <p class="metadata">11分钟 Channel - 63.7k 观看次数 -</p>
            </div>
          </div>
        </div>
      </div>
    `;
    const policy = resolveWebTranslationPolicy("https://www.xvideos.com/", "normal");
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      hostname: policy.hostname,
      preferredScanRootSelectors: policy.preferredScanRootSelectors,
      excludeSelectors: policy.excludeSelectors,
      contentSelectors: policy.contentSelectors,
      filterRule: policy.filterRule,
      buildContainerSelectors: policy.buildContainerSelectors,
      skipBuildContainerSelectors: policy.skipBuildContainerSelectors,
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });

    const titleRoot = document.querySelector<HTMLElement>("#content .mozaique .thumb-under p.title")!;
    const result = await controller.translateNewContent(titleRoot);

    expect(requestedTexts).toEqual(["English video title that needs translation"]);
    expect(result).toEqual({
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(document.querySelector("#content .mozaique .thumb-under p.title .imt-translation-compact")?.textContent).toBe(
      "[zh-Hans] English video title that needs translation",
    );
    expect(
      document.querySelector("#content .mozaique .thumb-under > .imt-translation-block, #content .mozaique .thumb-under > .imt-translation-compact"),
    ).toBeNull();
  });

  it("does not send Chinese text with English terminology to the translator when target is Chinese", async () => {
    document.body.innerHTML = `
      <main>
        <p>这篇文章介绍 <strong>React Server Components</strong> 的 <span>streaming</span> 策略。</p>
        <p>React Server Components stream UI from the server.</p>
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

    await controller.translatePage();

    expect(requestedTexts).toEqual(["React Server Components stream UI from the server."]);
    expect(document.body.textContent).toContain("这篇文章介绍 React Server Components 的 streaming 策略。");
  });
});
