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
                  items: [{ id: "u-1", text: "hello-zh", status: "ok" }],
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
    expect(body).not.toHaveProperty("temperature");
    expect(body.messages[0].content).toContain("Preserve ids, item count, and item boundaries");
    expect(JSON.parse(body.messages[1].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
  });

  it("splits OpenAI requests by configured batch limits", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.messages[1].content);
      return openAIResponse(
        userPayload.items.map((item: { id: string }) => ({
          id: item.id,
          text: `translated-${item.id}`,
          status: "ok",
        })),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await openaiProvider.translate({
      provider: "openai-compatible",
      endpoint: "https://api.example.test/v1/chat/completions",
      apiKey: "secret",
      model: "test-model",
      maxConcurrentRequests: 2,
      maxBatchItems: 1,
      maxBatchChars: 100,
      requestTimeoutMs: 5000,
      systemPrompt: "Custom system prompt",
      targetLang: "zh-Hans",
      items: [
        { id: "u-1", text: "Hello", category: "content-block" },
        { id: "u-2", text: "World", category: "content-block" },
        { id: "u-3", text: "Again", category: "content-block" },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const firstBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(firstBody.messages[0].content).toBe("Custom system prompt");
    expect(JSON.parse(firstBody.messages[1].content).items).toHaveLength(1);
    expect(result).toEqual([
      { id: "u-1", text: "translated-u-1", status: "ok" },
      { id: "u-2", text: "translated-u-2", status: "ok" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
    ]);
  });

  it("parses fenced or prefixed JSON content from OpenAI-compatible responses", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'Here is the JSON:\n```json\n{"items":[{"id":"u-1","text":"hello-zh"}]}\n```',
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
    ).resolves.toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
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
    ).resolves.toEqual([
      { id: "u-1", text: "", status: "failed", error: "OpenAI API failed: 401 Incorrect API key" },
    ]);
  });

  it("keeps successful chunks when one OpenAI sub-request fails", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.messages[1].content);
      const id = userPayload.items[0].id;
      if (id === "u-2") {
        return {
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: { message: "Server error" } }),
        };
      }

      return openAIResponse([{ id, text: `translated-${id}`, status: "ok" }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        endpoint: "https://api.example.test/v1/chat/completions",
        apiKey: "secret",
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
      { id: "u-2", text: "", status: "failed", error: "OpenAI API failed: 500 Server error" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
    ]);
  });

  it("degrades failed OpenAI chunks into smaller retries after rate limits", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.messages[1].content);
      if (userPayload.items.length > 1) {
        return {
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ error: { message: "Rate limit exceeded" } }),
        };
      }

      return openAIResponse(
        userPayload.items.map((item: { id: string }) => ({
          id: item.id,
          text: `translated-${item.id}`,
          status: "ok",
        })),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        endpoint: "https://api.example.test/v1/chat/completions",
        apiKey: "secret",
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
      return JSON.parse(body.messages[1].content).items.length;
    });
    expect(requestSizes).toEqual([2, 1, 1, 1]);
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

function openAIResponse(items: Array<{ id: string; text: string; status: string }>) {
  return {
    ok: true,
    text: async () =>
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({ items }),
            },
          },
        ],
      }),
  };
}
