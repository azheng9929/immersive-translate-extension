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

  it("splits large requests while reusing one auth token", async () => {
    const translateBatchSizes: number[] = [];
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (String(input) === "https://edge.microsoft.com/translate/auth") {
        return {
          ok: true,
          text: async () => "edge-token",
        };
      }

      const body = JSON.parse(String(init?.body ?? "[]")) as Array<{ Text: string }>;
      translateBatchSizes.push(body.length);
      return {
        ok: true,
        json: async () =>
          body.map((item) => ({
            detectedLanguage: { language: "en" },
            translations: [{ text: `zh:${item.Text}`, to: "zh-Hans" }],
          })),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const items = Array.from({ length: 55 }, (_, index) => ({
      id: `u-${index}`,
      text: `Text ${index}`,
      category: "content-block" as const,
    }));

    const result = await microsoftProvider.translate({
      provider: "microsoft",
      targetLang: "zh-Hans",
      maxConcurrentRequests: 1,
      items,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(translateBatchSizes).toEqual([50, 5]);
    expect(result).toHaveLength(55);
    expect(result[0]).toEqual({ id: "u-0", text: "zh:Text 0", detectedLang: "en", status: "ok" });
    expect(result[54]).toEqual({ id: "u-54", text: "zh:Text 54", detectedLang: "en", status: "ok" });
  });
});
