export type TranslationCacheLookup = {
  key: string;
  provider: string;
  sourceLang: string;
  targetLang: string;
  pageTitle: string;
  normalizedText: string;
};

export type TranslationCacheWrite = TranslationCacheLookup & {
  translatedText: string;
};

export type TranslationCacheClearOptions = {
  provider?: string;
  sourceLang?: string;
  targetLang?: string;
  pageTitle?: string;
};

export type TranslationCacheStats = {
  entries: number;
  estimatedBytes: number;
  providers: string[];
  targetLangs: string[];
};

export type TranslationCache = {
  getMany(lookups: TranslationCacheLookup[]): Promise<Map<string, string>>;
  putMany(entries: TranslationCacheWrite[]): Promise<void>;
};

type StoredTranslation = TranslationCacheWrite & {
  createdAt: number;
  lastUsedAt: number;
};

type CacheOptions = {
  dbName?: string;
  storeName?: string;
  indexedDB?: IDBFactory;
  maxAgeMs?: number;
  now?: () => number;
};

type LookupInput = {
  provider: string;
  sourceLang?: string;
  targetLang: string;
  pageTitle?: string | undefined;
  normalizedText: string;
};

const DEFAULT_DB_NAME = "imt-translation-cache";
const DEFAULT_STORE_NAME = "translations";
const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const KEY_SEPARATOR = "\u001f";

export function createTranslationCacheLookup(input: LookupInput): TranslationCacheLookup {
  const provider = normalizeCachePart(input.provider || "default");
  const sourceLang = normalizeCachePart(input.sourceLang || "auto");
  const targetLang = normalizeCachePart(input.targetLang);
  const pageTitle = normalizeContext(input.pageTitle);
  const normalizedText = input.normalizedText;

  return {
    key: ["imt-v2", provider, sourceLang, targetLang, hashText(pageTitle), hashText(normalizedText)].join(KEY_SEPARATOR),
    provider,
    sourceLang,
    targetLang,
    pageTitle,
    normalizedText,
  };
}

export class IndexedDbTranslationCache implements TranslationCache {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly indexedDB?: IDBFactory;
  private readonly maxAgeMs: number;
  private readonly now: () => number;
  private dbPromise?: Promise<IDBDatabase>;

  constructor(options: CacheOptions = {}) {
    this.dbName = options.dbName ?? DEFAULT_DB_NAME;
    this.storeName = options.storeName ?? DEFAULT_STORE_NAME;
    this.indexedDB = options.indexedDB ?? globalThis.indexedDB;
    this.maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    this.now = options.now ?? (() => Date.now());
  }

  async getMany(lookups: TranslationCacheLookup[]): Promise<Map<string, string>> {
    if (lookups.length === 0) return new Map();

    const db = await this.getDb();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const reads = lookups.map((lookup) => requestToPromise<StoredTranslation | undefined>(store.get(lookup.key)));
    const storedEntries = await Promise.all(reads);
    await transactionDone(transaction);

    const hits = new Map<string, string>();
    const now = this.now();

    for (const [index, lookup] of lookups.entries()) {
      const stored = storedEntries[index];
      if (!stored) continue;
      if (stored.normalizedText !== lookup.normalizedText) continue;
      if (
        stored.provider !== lookup.provider ||
        stored.sourceLang !== lookup.sourceLang ||
        stored.targetLang !== lookup.targetLang ||
        stored.pageTitle !== lookup.pageTitle
      ) continue;
      if (now - stored.createdAt > this.maxAgeMs) continue;
      hits.set(lookup.key, stored.translatedText);
    }

    return hits;
  }

  async putMany(entries: TranslationCacheWrite[]): Promise<void> {
    const cacheable = entries.filter((entry) => entry.translatedText.length > 0);
    if (cacheable.length === 0) return;

    const db = await this.getDb();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    const now = this.now();

    for (const entry of cacheable) {
      store.put({
        ...entry,
        createdAt: now,
        lastUsedAt: now,
      } satisfies StoredTranslation);
    }

    await transactionDone(transaction);
  }

  async getStats(): Promise<TranslationCacheStats> {
    const entries = await this.getAllEntries();
    const providers = uniqueSorted(entries.map((entry) => entry.provider));
    const targetLangs = uniqueSorted(entries.map((entry) => entry.targetLang));
    const estimatedBytes = entries.reduce((total, entry) => total + estimateStoredEntryBytes(entry), 0);

    return {
      entries: entries.length,
      estimatedBytes,
      providers,
      targetLangs,
    };
  }

  async clear(options: TranslationCacheClearOptions = {}): Promise<void> {
    const db = await this.getDb();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);

    if (!hasClearFilter(options)) {
      store.clear();
      await transactionDone(transaction);
      return;
    }

    const entries = await requestToPromise<StoredTranslation[]>(store.getAll());
    for (const entry of entries) {
      if (matchesClearOptions(entry, options)) {
        store.delete(entry.key);
      }
    }

    await transactionDone(transaction);
  }

  private getDb(): Promise<IDBDatabase> {
    if (!this.indexedDB) {
      return Promise.reject(new Error("IndexedDB is not available"));
    }

    this.dbPromise ??= openDatabase(this.indexedDB, this.dbName, this.storeName);
    return this.dbPromise;
  }

  private async getAllEntries(): Promise<StoredTranslation[]> {
    const db = await this.getDb();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const entries = await requestToPromise<StoredTranslation[]>(store.getAll());
    await transactionDone(transaction);
    return entries;
  }
}

function openDatabase(indexedDB: IDBFactory, dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open translation cache"));
    request.onblocked = () => reject(new Error("Translation cache open request was blocked"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function normalizeCachePart(value: string): string {
  return value.trim().toLowerCase() || "auto";
}

function normalizeContext(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim().slice(0, 200) ?? "";
}

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${hash.toString(36)}-${value.length}`;
}

function hasClearFilter(options: TranslationCacheClearOptions): boolean {
  return Boolean(options.provider || options.sourceLang || options.targetLang || options.pageTitle);
}

function matchesClearOptions(entry: StoredTranslation, options: TranslationCacheClearOptions): boolean {
  if (options.provider && entry.provider !== normalizeCachePart(options.provider)) return false;
  if (options.sourceLang && entry.sourceLang !== normalizeCachePart(options.sourceLang)) return false;
  if (options.targetLang && entry.targetLang !== normalizeCachePart(options.targetLang)) return false;
  if (options.pageTitle && entry.pageTitle !== normalizeContext(options.pageTitle)) return false;
  return true;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function estimateStoredEntryBytes(entry: StoredTranslation): number {
  return (
    entry.key.length +
    entry.provider.length +
    entry.sourceLang.length +
    entry.targetLang.length +
    entry.pageTitle.length +
    entry.normalizedText.length +
    entry.translatedText.length
  ) * 2;
}
