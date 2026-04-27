import { afterEach, describe, expect, it, vi } from "vitest";
import { microsoftProvider } from "@/background/providers/microsoftProvider";

describe("microsoftProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests an auth token and translates items with stable id mapping", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "edge-token",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { detectedLanguage: { language: "en" }, translations: [{ text: "你好", to: "zh-Hans" }] },
          { detectedLanguage: { language: "en" }, translations: [{ text: "提交", to: "zh-Hans" }] },
        ],
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await microsoftProvider.translate({
      provider: "microsoft",
      sourceLang: "en",
      targetLang: "zh-Hans",
      items: [
        { id: "u-1", text: "Hello", category: "content-block" },
        { id: "u-2", text: "Submit", category: "button" },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://edge.microsoft.com/translate/auth");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("to=zh-Hans");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("from=en");
    expect(JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string)).toEqual([
      { Text: "Hello" },
      { Text: "Submit" },
    ]);
    expect(result).toEqual([
      { id: "u-1", text: "你好", detectedLang: "en", status: "ok" },
      { id: "u-2", text: "提交", detectedLang: "en", status: "ok" },
    ]);
  });

  it("fails fast when the auth endpoint is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "",
      }),
    );

    await expect(
      microsoftProvider.translate({
        provider: "microsoft",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("Microsoft auth failed: 403");
  });
});
