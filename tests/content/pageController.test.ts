import { describe, expect, it } from "vitest";
import { PageController } from "@/content/pageController";
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
    expect(document.querySelector("p")?.textContent).toBe("Hello world.");
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
