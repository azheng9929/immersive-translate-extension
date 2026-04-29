import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiProvider } from "@/background/providers/geminiProvider";

describe("geminiProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a Gemini generateContent request and parses JSON items", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(geminiResponse([{ id: "u-1", text: "hello-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await geminiProvider.translate({
      provider: "gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "gemini-secret",
      model: "gemini-3.1-flash-lite-preview",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent",
    );
    expect(requestInit.headers).toMatchObject({ "x-goog-api-key": "gemini-secret" });
    expect(body).not.toHaveProperty("temperature");
    expect(body.system_instruction.parts[0].text).toContain("professional zh-Hans native translator");
    expect(body.system_instruction.parts[0].text).toContain("Preserve the exact item count, item ids, and item order");
    expect(body.system_instruction.parts[0].text).not.toContain("{{to}}");
    expect(JSON.parse(body.contents[0].parts[0].text).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema.required).toEqual(["items"]);
    expect(result).toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
  });

  it("splits Gemini requests by configured batch limits and preserves order", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.contents[0].parts[0].text);
      return geminiResponse(
        userPayload.items.map((item: { id: string }) => ({
          id: item.id,
          text: `translated-${item.id}`,
          status: "ok",
        })),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geminiProvider.translate({
      provider: "gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "gemini-secret",
      model: "gemini-test",
      maxConcurrentRequests: 2,
      maxBatchItems: 1,
      maxBatchChars: 100,
      requestTimeoutMs: 5000,
      systemPrompt: "Custom Gemini system prompt",
      targetLang: "zh-Hans",
      items: [
        { id: "u-1", text: "Hello", category: "content-block" },
        { id: "u-2", text: "World", category: "content-block" },
        { id: "u-3", text: "Again", category: "content-block" },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const firstBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(firstBody.system_instruction.parts[0].text).toBe("Custom Gemini system prompt");
    expect(JSON.parse(firstBody.contents[0].parts[0].text).items).toHaveLength(1);
    expect(result).toEqual([
      { id: "u-1", text: "translated-u-1", status: "ok" },
      { id: "u-2", text: "translated-u-2", status: "ok" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
    ]);
  });

  it("keeps successful chunks when one Gemini sub-request fails", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.contents[0].parts[0].text);
      const id = userPayload.items[0].id;
      if (id === "u-2") {
        return {
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ error: { message: "Quota exceeded" } }),
        };
      }

      return geminiResponse([{ id, text: `translated-${id}`, status: "ok" }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geminiProvider.translate({
        provider: "gemini",
        endpoint: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: "gemini-secret",
        maxBatchItems: 1,
        maxConcurrentRequests: 2,
        targetLang: "zh-Hans",
        items: [
          { id: "u-1", text: "Hello", category: "content-block" },
          { id: "u-2", text: "World", category: "content-block" },
          { id: "u-3", text: "Again", category: "content-block" },
        ],
      }),
    ).resolves.toEqual([
      { id: "u-1", text: "translated-u-1", status: "ok" },
      { id: "u-2", text: "", status: "failed", error: "Gemini API failed: 429 Quota exceeded" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
    ]);
  });

  it("degrades failed Gemini chunks into smaller retries after rate limits", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.contents[0].parts[0].text);
      if (userPayload.items.length > 1) {
        return {
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ error: { message: "Quota exceeded" } }),
        };
      }

      return geminiResponse(
        userPayload.items.map((item: { id: string }) => ({
          id: item.id,
          text: `translated-${item.id}`,
          status: "ok",
        })),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geminiProvider.translate({
        provider: "gemini",
        endpoint: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: "gemini-secret",
        maxBatchItems: 2,
        maxBatchChars: 100,
        maxConcurrentRequests: 2,
        targetLang: "zh-Hans",
        items: [
          { id: "u-1", text: "Hello", category: "content-block" },
          { id: "u-2", text: "World", category: "content-block" },
          { id: "u-3", text: "Again", category: "content-block" },
        ],
      }),
    ).resolves.toEqual([
      { id: "u-1", text: "translated-u-1", status: "ok" },
      { id: "u-2", text: "translated-u-2", status: "ok" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const requestSizes = fetchMock.mock.calls.map((call) => {
      const body = JSON.parse((call[1] as RequestInit).body as string);
      return JSON.parse(body.contents[0].parts[0].text).items.length;
    });
    expect(requestSizes).toEqual([2, 1, 1, 1]);
  });

  it("requires endpoint and api key", async () => {
    await expect(
      geminiProvider.translate({
        provider: "gemini",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("Gemini API requires endpoint and API key");
  });

  it("renders prompt placeholders before sending the request", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(geminiResponse([{ id: "u-1", text: "你好", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    await geminiProvider.translate({
      provider: "gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "gemini-secret",
      systemPrompt: "Translate from {{from}} to {{to}}.{{title_prompt}}{{summary_prompt}}{{terms_prompt}}{{imt_style_guide}}",
      sourceLang: "en",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.system_instruction.parts[0].text).toBe("Translate from en to zh-Hans.");
  });
  it("injects page title context into Immersive-style title prompts", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(geminiResponse([{ id: "u-1", text: "best-comps-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    await geminiProvider.translate({
      provider: "gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "gemini-secret",
      systemPrompt: "Rules.{{title_prompt}}\nRaw title: {{imt_title}}",
      sourceLang: "en",
      targetLang: "zh-Hans",
      pageTitle: "MetaTFT - Best TFT Comps",
      items: [{ id: "u-1", text: "Best comps", category: "heading" }],
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.system_instruction.parts[0].text).toContain("Title: 《MetaTFT - Best TFT Comps》");
    expect(body.system_instruction.parts[0].text).toContain("Raw title: MetaTFT - Best TFT Comps");
    expect(body.system_instruction.parts[0].text).not.toContain("{{title_prompt}}");
    expect(body.system_instruction.parts[0].text).not.toContain("{{imt_title}}");
  });
});

function geminiResponse(items: Array<{ id: string; text: string; status: string }>) {
  return {
    ok: true,
    text: async () =>
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({ items }),
                },
              ],
            },
          },
        ],
      }),
  };
}
