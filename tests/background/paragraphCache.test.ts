import { afterEach, describe, expect, it } from "vitest";
import {
  clearParagraphCache,
  getParagraphCacheStats,
  queryParagraphCache,
  resetParagraphCacheForTests,
  setParagraphCache,
} from "@/background/paragraphCache";
import { createTranslationCacheLookup } from "@/shared/translationCache";

describe("paragraphCache", () => {
  afterEach(() => {
    resetParagraphCacheForTests();
  });

  it("stores and returns paragraph translations from the background cache service", async () => {
    const lookup = createTranslationCacheLookup({
      provider: "openai-compatible:gpt-5.4",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      pageTitle: "Example Page",
      normalizedText: "Hello world.",
    });

    await setParagraphCache([{ ...lookup, translatedText: "你好，世界。" }]);
    const hits = await queryParagraphCache([lookup]);

    expect(hits).toEqual(new Map([[lookup.key, "你好，世界。"]]));
  });

  it("reports stats and clears shared cache entries by provider", async () => {
    const openaiLookup = createTranslationCacheLookup({
      provider: "openai-compatible:gpt-5.4",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      pageTitle: "Example Page",
      normalizedText: "Hello world.",
    });
    const geminiLookup = createTranslationCacheLookup({
      provider: "gemini:flash-lite",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      pageTitle: "Example Page",
      normalizedText: "Good morning.",
    });

    await setParagraphCache([
      { ...openaiLookup, translatedText: "hello-world-zh" },
      { ...geminiLookup, translatedText: "good-morning-zh" },
    ]);

    await expect(getParagraphCacheStats()).resolves.toMatchObject({
      entries: 2,
      providers: ["gemini:flash-lite", "openai-compatible:gpt-5.4"],
      targetLangs: ["zh-hans"],
    });

    await clearParagraphCache({ provider: "openai-compatible:gpt-5.4" });

    await expect(getParagraphCacheStats()).resolves.toMatchObject({
      entries: 1,
      providers: ["gemini:flash-lite"],
    });
    await expect(queryParagraphCache([openaiLookup, geminiLookup])).resolves.toEqual(
      new Map([[geminiLookup.key, "good-morning-zh"]]),
    );
  });
});
