import { describe, expect, it } from "vitest";
import { indexedDB } from "fake-indexeddb";
import { createTranslationCacheLookup, IndexedDbTranslationCache } from "@/shared/translationCache";

describe("TranslationCache", () => {
  it("stores and reads translations for the same provider and language pair", async () => {
    const cache = new IndexedDbTranslationCache({
      dbName: `imt-cache-${crypto.randomUUID()}`,
      indexedDB: indexedDB as unknown as IDBFactory,
    });
    const lookup = createTranslationCacheLookup({
      provider: "mock",
      sourceLang: "en",
      targetLang: "zh-Hans",
      normalizedText: "hello world",
    });

    await cache.putMany([{ ...lookup, translatedText: "hello-world-zh" }]);

    const hits = await cache.getMany([lookup]);
    expect(hits.get(lookup.key)).toBe("hello-world-zh");
  });

  it("does not reuse entries across providers or target languages", async () => {
    const cache = new IndexedDbTranslationCache({
      dbName: `imt-cache-${crypto.randomUUID()}`,
      indexedDB: indexedDB as unknown as IDBFactory,
    });
    const zhLookup = createTranslationCacheLookup({
      provider: "mock-a",
      sourceLang: "en",
      targetLang: "zh-Hans",
      normalizedText: "hello world",
    });
    const jaLookup = createTranslationCacheLookup({
      provider: "mock-a",
      sourceLang: "en",
      targetLang: "ja",
      normalizedText: "hello world",
    });
    const otherProviderLookup = createTranslationCacheLookup({
      provider: "mock-b",
      sourceLang: "en",
      targetLang: "zh-Hans",
      normalizedText: "hello world",
    });

    await cache.putMany([{ ...zhLookup, translatedText: "hello-world-zh" }]);

    const hits = await cache.getMany([zhLookup, jaLookup, otherProviderLookup]);
    expect(hits.get(zhLookup.key)).toBe("hello-world-zh");
    expect(hits.has(jaLookup.key)).toBe(false);
    expect(hits.has(otherProviderLookup.key)).toBe(false);
  });

  it("drops expired entries", async () => {
    let now = 1_000;
    const cache = new IndexedDbTranslationCache({
      dbName: `imt-cache-${crypto.randomUUID()}`,
      indexedDB: indexedDB as unknown as IDBFactory,
      maxAgeMs: 100,
      now: () => now,
    });
    const lookup = createTranslationCacheLookup({
      provider: "mock",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      normalizedText: "hello world",
    });

    await cache.putMany([{ ...lookup, translatedText: "hello-world-zh" }]);
    now = 1_101;

    const hits = await cache.getMany([lookup]);
    expect(hits.has(lookup.key)).toBe(false);
  });

  it("verifies normalized text before returning a cached hit", async () => {
    const cache = new IndexedDbTranslationCache({
      dbName: `imt-cache-${crypto.randomUUID()}`,
      indexedDB: indexedDB as unknown as IDBFactory,
    });
    const lookup = createTranslationCacheLookup({
      provider: "mock",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      normalizedText: "hello world",
    });

    await cache.putMany([{ ...lookup, translatedText: "hello-world-zh" }]);

    const hits = await cache.getMany([{ ...lookup, normalizedText: "different text" }]);
    expect(hits.has(lookup.key)).toBe(false);
  });
});
