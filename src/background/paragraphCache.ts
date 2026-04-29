import {
  IndexedDbTranslationCache,
  type TranslationCacheLookup,
  type TranslationCacheWrite,
} from "../shared/translationCache";

let cache = new IndexedDbTranslationCache({ dbName: "imt-background-paragraph-cache" });

export async function queryParagraphCache(lookups: TranslationCacheLookup[]): Promise<Map<string, string>> {
  return cache.getMany(lookups);
}

export async function setParagraphCache(entries: TranslationCacheWrite[]): Promise<void> {
  await cache.putMany(entries);
}

export function resetParagraphCacheForTests(): void {
  cache = new IndexedDbTranslationCache({
    dbName: `imt-background-paragraph-cache-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}
