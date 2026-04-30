import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPersistedPageTranslation,
  isPersistedPageTranslationActive,
  markPersistedPageTranslationActive,
  schedulePersistedPageTranslationResume,
} from "@/content/pageTranslationPersistence";

describe("pageTranslationPersistence", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("persists a manual page-translation request for same-tab reload recovery", () => {
    expect(isPersistedPageTranslationActive()).toBe(false);

    markPersistedPageTranslationActive();

    expect(isPersistedPageTranslationActive()).toBe(true);

    clearPersistedPageTranslation();

    expect(isPersistedPageTranslationActive()).toBe(false);
  });

  it("resumes translation on web pages when a previous request survived reload", async () => {
    vi.useFakeTimers();
    const translatePage = vi.fn();

    markPersistedPageTranslationActive();
    const cancel = schedulePersistedPageTranslationResume(translatePage, {
      location: { protocol: "https:" },
      delayMs: 75,
    });

    expect(cancel).toEqual(expect.any(Function));
    expect(translatePage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(75);

    expect(translatePage).toHaveBeenCalledTimes(1);
  });

  it("does not resume on extension pages or after cancellation", async () => {
    vi.useFakeTimers();
    const translatePage = vi.fn();

    markPersistedPageTranslationActive();
    expect(schedulePersistedPageTranslationResume(translatePage, {
      location: { protocol: "chrome-extension:" },
      delayMs: 20,
    })).toBeUndefined();

    const cancel = schedulePersistedPageTranslationResume(translatePage, {
      location: { protocol: "https:" },
      delayMs: 20,
    });
    cancel?.();

    await vi.advanceTimersByTimeAsync(20);

    expect(translatePage).not.toHaveBeenCalled();
  });
});
