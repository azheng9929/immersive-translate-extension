import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleAutoTranslate, shouldAutoTranslatePage } from "@/content/autoTranslate";

describe("auto translate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("only starts on web pages when auto translate is enabled", () => {
    expect(shouldAutoTranslatePage({ autoTranslate: true }, { protocol: "https:" })).toBe(true);
    expect(shouldAutoTranslatePage({ autoTranslate: true }, { protocol: "http:" })).toBe(true);
    expect(shouldAutoTranslatePage({ autoTranslate: false }, { protocol: "https:" })).toBe(false);
    expect(shouldAutoTranslatePage({ autoTranslate: true }, { protocol: "file:" })).toBe(false);
    expect(shouldAutoTranslatePage({ autoTranslate: true }, { protocol: "chrome-extension:" })).toBe(false);
  });

  it("schedules one automatic page translation and can cancel it", async () => {
    vi.useFakeTimers();
    const translatePage = vi.fn();

    const cancel = scheduleAutoTranslate(
      { autoTranslate: true },
      translatePage,
      { location: { protocol: "https:" }, delayMs: 50 },
    );

    expect(cancel).toEqual(expect.any(Function));
    expect(translatePage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(translatePage).toHaveBeenCalledTimes(1);

    const canceledTranslatePage = vi.fn();
    const cancelSecond = scheduleAutoTranslate(
      { autoTranslate: true },
      canceledTranslatePage,
      { location: { protocol: "https:" }, delayMs: 50 },
    );
    cancelSecond?.();

    await vi.advanceTimersByTimeAsync(50);

    expect(canceledTranslatePage).not.toHaveBeenCalled();
  });
});
