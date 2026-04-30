import { describe, expect, it, vi } from "vitest";
import { handleBackgroundMessage, sendToActiveTab, toggleActiveTabTranslation } from "@/background/messageRouter";
import { resetParagraphCacheForTests, setParagraphCache } from "@/background/paragraphCache";
import { createTranslationCacheLookup } from "@/shared/translationCache";
import { stubImportedRulesResource } from "../helpers/importedRulesResource";

describe("handleBackgroundMessage", () => {
  it("runs translation batch messages through the selected provider", async () => {
    const response = await handleBackgroundMessage({
      type: "IMT_TRANSLATE_BATCH",
      request: {
        provider: "fake",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      },
    });

    expect(response).toEqual({
      ok: true,
      items: [{ id: "u-1", text: "[zh-Hans] Hello", status: "ok" }],
    });
  });

  it("returns a safe error response for unsupported providers", async () => {
    const response = await handleBackgroundMessage({
      type: "IMT_TRANSLATE_BATCH",
      request: {
        provider: "missing" as never,
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      },
    });

    expect(response).toEqual({ ok: false, error: "Unsupported translation provider: missing" });
  });

  it("returns and updates extension config", async () => {
    const tabsQuery = vi.fn().mockResolvedValue([{ id: 12 }]);
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", {
      tabs: {
        query: tabsQuery,
        sendMessage,
      },
      storage: {
        local: new MemoryStorageArea(),
      },
    });

    const getBefore = await handleBackgroundMessage({ type: "IMT_GET_CONFIG" });
    const update = await handleBackgroundMessage({
      type: "IMT_UPDATE_CONFIG",
      patch: { targetLang: "ja", showFloatingBall: false },
    });
    const getAfter = await handleBackgroundMessage({ type: "IMT_GET_CONFIG" });

    expect(getBefore).toMatchObject({ ok: true, config: { targetLang: "zh-Hans" } });
    expect(update).toMatchObject({ ok: true, config: { targetLang: "ja", showFloatingBall: false } });
    expect(getAfter).toMatchObject({ ok: true, config: { targetLang: "ja", showFloatingBall: false } });
    expect(sendMessage).toHaveBeenCalledWith(12, {
      type: "IMT_CONFIG_UPDATED",
      config: expect.objectContaining({ targetLang: "ja", showFloatingBall: false }),
    });

    vi.unstubAllGlobals();
  });

  it("returns only URL-relevant web translation rules for the current page", async () => {
    stubImportedRulesResource();

    const response = await handleBackgroundMessage({
      type: "IMT_GET_WEB_RULES",
      url: "https://medium.com/@writer/story",
    });

    expect(response).toMatchObject({ ok: true });
    if (!response.ok || !("webRules" in response)) throw new Error("Expected webRules response");

    expect(response.webRules.length).toBeGreaterThan(1);
    expect(response.webRules.length).toBeLessThan(80);
    expect(response.webRules.some((rule) => rule.id === "medium")).toBe(true);
    expect(response.webRules.some((rule) => rule.id === "github")).toBe(false);
    expect(response.webRules.some((rule) => rule.selectorMatches?.length)).toBe(true);

    vi.unstubAllGlobals();
  });

  it("exposes paragraph cache stats and clear operations through background messages", async () => {
    resetParagraphCacheForTests();
    const lookup = createTranslationCacheLookup({
      provider: "openai-compatible:gpt-5.4",
      sourceLang: "auto",
      targetLang: "zh-Hans",
      pageTitle: "Example Page",
      normalizedText: "Hello world.",
    });
    await setParagraphCache([{ ...lookup, translatedText: "hello-world-zh" }]);

    await expect(handleBackgroundMessage({ type: "IMT_GET_PARAGRAPH_CACHE_STATS" })).resolves.toMatchObject({
      ok: true,
      cacheStats: {
        entries: 1,
        providers: ["openai-compatible:gpt-5.4"],
        targetLangs: ["zh-hans"],
      },
    });

    await expect(
      handleBackgroundMessage({
        type: "IMT_CLEAR_PARAGRAPH_CACHE",
        options: { provider: "openai-compatible:gpt-5.4" },
      }),
    ).resolves.toEqual({ ok: true });
    await expect(handleBackgroundMessage({ type: "IMT_GET_PARAGRAPH_CACHE_STATS" })).resolves.toMatchObject({
      ok: true,
      cacheStats: { entries: 0 },
    });

    resetParagraphCacheForTests();
  });

  it("forwards active tab page status requests from popup", async () => {
    const tabsQuery = vi.fn().mockResolvedValue([{ id: 12 }]);
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      status: {
        phase: "translated",
        observation: "observing",
        pendingRoots: 0,
        observedRoots: 0,
        total: 1,
        translated: 1,
        failed: 0,
        skipped: 0,
        dynamicRuns: 0,
        lastError: undefined,
      },
    });
    vi.stubGlobal("chrome", {
      tabs: {
        query: tabsQuery,
        sendMessage,
      },
    });

    const response = await handleBackgroundMessage({ type: "IMT_POPUP_GET_ACTIVE_TAB_STATUS" });

    expect(response).toMatchObject({ ok: true, status: { phase: "translated" } });
    expect(sendMessage).toHaveBeenCalledWith(12, { type: "IMT_GET_PAGE_STATUS" });
    vi.unstubAllGlobals();
  });

  it("retries active tab messages while the content script is still loading", async () => {
    vi.useFakeTimers();
    const tabsQuery = vi.fn().mockResolvedValue([{ id: 12 }]);
    const sendMessage = vi.fn()
      .mockRejectedValueOnce(new Error("Could not establish connection. Receiving end does not exist."))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("chrome", {
      tabs: {
        query: tabsQuery,
        sendMessage,
      },
    });

    const responsePromise = sendToActiveTab({ type: "IMT_TRANSLATE_PAGE" });
    await vi.advanceTimersByTimeAsync(250);

    await expect(responsePromise).resolves.toEqual({ ok: true });
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(1, 12, { type: "IMT_TRANSLATE_PAGE" });
    expect(sendMessage).toHaveBeenNthCalledWith(2, 12, { type: "IMT_TRANSLATE_PAGE" });

    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("forwards active tab render-state requests from popup", async () => {
    const tabsQuery = vi.fn().mockResolvedValue([{ id: 12 }]);
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", {
      tabs: {
        query: tabsQuery,
        sendMessage,
      },
    });

    const response = await handleBackgroundMessage({
      type: "IMT_POPUP_SET_ACTIVE_TAB_RENDER_STATE",
      renderState: "original",
    });

    expect(response).toEqual({ ok: true });
    expect(sendMessage).toHaveBeenCalledWith(12, {
      type: "IMT_SET_PAGE_RENDER_STATE",
      renderState: "original",
    });
    vi.unstubAllGlobals();
  });

  it("toggles the active tab between translation and restore for keyboard shortcuts", async () => {
    const tabsQuery = vi.fn().mockResolvedValue([{ id: 12 }]);
    const sendMessage = vi.fn(async (_tabId, message) => {
      if (message.type === "IMT_GET_PAGE_STATUS") {
        return {
          ok: true,
          status: {
            phase: "translated",
            observation: "observing",
            pendingRoots: 0,
            observedRoots: 0,
            total: 1,
            translated: 1,
            failed: 0,
            skipped: 0,
            dynamicRuns: 0,
            lastError: undefined,
          },
        };
      }
      return { ok: true };
    });
    vi.stubGlobal("chrome", {
      tabs: {
        query: tabsQuery,
        sendMessage,
      },
    });

    await expect(toggleActiveTabTranslation()).resolves.toEqual({ ok: true });

    expect(sendMessage).toHaveBeenCalledWith(12, { type: "IMT_GET_PAGE_STATUS" });
    expect(sendMessage).toHaveBeenCalledWith(12, { type: "IMT_RESTORE_PAGE" });
    vi.unstubAllGlobals();
  });
});

class MemoryStorageArea {
  private values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(values: Record<string, unknown>): Promise<void> {
    this.values = { ...this.values, ...values };
  }
}
