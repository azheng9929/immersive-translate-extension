import { describe, expect, it, vi } from "vitest";
import { handleBackgroundMessage } from "@/background/messageRouter";

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
