import { afterEach, describe, expect, it } from "vitest";
import {
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
});
