import type { TranslationCache, TranslationCacheLookup, TranslationCacheWrite } from "../shared/translationCache";

export class BackgroundTranslationCache implements TranslationCache {
  async getMany(lookups: TranslationCacheLookup[]): Promise<Map<string, string>> {
    if (lookups.length === 0) return new Map();
    const response = await chrome.runtime.sendMessage({ type: "IMT_QUERY_PARAGRAPH_CACHE", lookups });
    if (!response?.ok || !Array.isArray(response.cacheHits)) return new Map();
    return new Map(response.cacheHits);
  }

  async putMany(entries: TranslationCacheWrite[]): Promise<void> {
    if (entries.length === 0) return;
    await chrome.runtime.sendMessage({ type: "IMT_SET_PARAGRAPH_CACHE", entries });
  }
}
