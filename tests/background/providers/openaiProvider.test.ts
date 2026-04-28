import { afterEach, describe, expect, it, vi } from "vitest";
import { openaiProvider } from "@/background/providers/openaiProvider";

describe("openaiProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts an OpenAI-compatible chat request and parses JSON items", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [{ id: "u-1", text: "你好", status: "ok" }],
                }),
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await openaiProvider.translate({
      provider: "openai-compatible",
      endpoint: "https://api.example.test/v1/chat/completions",
      apiKey: "secret",
      model: "test-model",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/chat/completions");
    expect(requestInit.headers).toMatchObject({ Authorization: "Bearer secret" });
    expect(body.model).toBe("test-model");
    expect(body.messages[0].content).toContain("Preserve ids, item count, and item boundaries");
    expect(JSON.parse(body.messages[1].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "你好", status: "ok" }]);
  });

  it("parses fenced or prefixed JSON content from OpenAI-compatible responses", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'Here is the JSON:\n```json\n{"items":[{"id":"u-1","text":"你好"}]}\n```',
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        endpoint: "https://api.example.test/v1/chat/completions",
        apiKey: "secret",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).resolves.toEqual([{ id: "u-1", text: "你好", status: "ok" }]);
  });

  it("surfaces OpenAI API error details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: "Incorrect API key" } }),
      }),
    );

    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        endpoint: "https://api.example.test/v1/chat/completions",
        apiKey: "bad",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("OpenAI API failed: 401 Incorrect API key");
  });

  it("requires endpoint and api key", async () => {
    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("OpenAI API requires endpoint and API key");
  });
});
