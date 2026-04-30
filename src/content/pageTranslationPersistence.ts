const PAGE_TRANSLATION_ACTIVE_KEY = "imt.pageTranslation.active";

type MinimalLocation = Pick<Location, "protocol">;

type ResumeOptions = {
  location?: MinimalLocation;
  delayMs?: number;
};

export function markPersistedPageTranslationActive(storage: Storage | undefined = safeSessionStorage()): void {
  try {
    storage?.setItem(PAGE_TRANSLATION_ACTIVE_KEY, "1");
  } catch {
    // Session storage can be unavailable in restricted frames.
  }
}

export function clearPersistedPageTranslation(storage: Storage | undefined = safeSessionStorage()): void {
  try {
    storage?.removeItem(PAGE_TRANSLATION_ACTIVE_KEY);
  } catch {
    // Session storage can be unavailable in restricted frames.
  }
}

export function isPersistedPageTranslationActive(storage: Storage | undefined = safeSessionStorage()): boolean {
  try {
    return storage?.getItem(PAGE_TRANSLATION_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function schedulePersistedPageTranslationResume(
  translatePage: () => void | Promise<unknown>,
  options: ResumeOptions = {},
): (() => void) | undefined {
  const location = options.location ?? globalThis.location;
  if (!isPersistedPageTranslationActive() || !isWebPage(location)) return undefined;

  const timer = window.setTimeout(() => {
    void Promise.resolve(translatePage()).catch((error) => {
      console.warn("[IMT] Persisted page translation resume failed", error);
    });
  }, Math.max(0, options.delayMs ?? 700));

  return () => window.clearTimeout(timer);
}

function isWebPage(location: MinimalLocation): boolean {
  return location.protocol === "http:" || location.protocol === "https:";
}

function safeSessionStorage(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}
