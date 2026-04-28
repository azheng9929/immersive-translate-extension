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
});
