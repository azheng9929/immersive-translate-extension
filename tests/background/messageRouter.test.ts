import { describe, expect, it } from "vitest";
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
});
