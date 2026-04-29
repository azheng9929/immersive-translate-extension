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
    expect(body.response_format).toMatchObject({
      type: "json_schema",
      json_schema: {
        name: "translation_batch",
        strict: true,
      },
    });
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(body.response_format.json_schema.schema.properties.items.items.required).toEqual([
      "id",
      "text",
      "status",
      "detectedLang",
      "error",
    ]);
    expect(body.messages[0].content).toContain("professional zh-Hans native translator");
    expect(body.messages[0].content).toContain("Preserve the exact item count, item ids, and item order");
    expect(body.messages[0].content).not.toContain("{{to}}");
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
    expect(firstBody.response_format?.type).toBe("json_schema");
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

  it("falls back to plain JSON prompts when structured outputs are unsupported", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: "Unsupported parameter: response_format" } }),
      })
      .mockResolvedValueOnce(openAIResponse([{ id: "u-1", text: "hello-zh", status: "ok" }]));
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

    const firstBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    const secondBody = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(firstBody.response_format?.type).toBe("json_schema");
    expect(secondBody).not.toHaveProperty("response_format");
  });

  it("shrinks later OpenAI batches when rate limit headers show low token headroom", async () => {
    let callIndex = 0;
    const requestSizes: number[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const userPayload = JSON.parse(body.messages[1].content);
      requestSizes.push(userPayload.items.length);
      callIndex += 1;

      return openAIResponse(
        userPayload.items.map((item: { id: string }) => ({
          id: item.id,
          text: `translated-${item.id}`,
          status: "ok",
        })),
        callIndex === 1
          ? {
            headers: new Headers({
              "x-ratelimit-limit-tokens": "100000",
              "x-ratelimit-remaining-tokens": "5000",
            }),
          }
          : undefined,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const items = Array.from({ length: 9 }, (_, index) => ({
      id: `u-${index + 1}`,
      text: `Text ${index + 1}`,
      category: "content-block" as const,
    }));

    await openaiProvider.translate({
      provider: "openai-compatible",
      endpoint: "https://api.example.test/v1/chat/completions",
      apiKey: "secret",
      maxConcurrentRequests: 1,
      maxBatchItems: 4,
      maxBatchChars: 1000,
      targetLang: "zh-Hans",
      items,
    });

    expect(requestSizes.slice(0, 3)).toEqual([4, 2, 2]);
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

  it("renders Immersive-style prompt placeholders before sending the request", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(openAIResponse([{ id: "u-1", text: "你好", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.translate({
      provider: "openai-compatible",
      endpoint: "https://api.example.test/v1/chat/completions",
      apiKey: "secret",
      systemPrompt: "Translate from {{from}} to {{to}}.{{title_prompt}}{{summary_prompt}}{{terms_prompt}}{{imt_style_guide}}",
      sourceLang: "en",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.messages[0].content).toBe("Translate from en to zh-Hans.");
  });
  it("injects page title context into Immersive-style title prompts", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(openAIResponse([{ id: "u-1", text: "best-comps-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.translate({
      provider: "openai-compatible",
      endpoint: "https://api.example.test/v1/chat/completions",
      apiKey: "secret",
      systemPrompt: "Rules.{{title_prompt}}\nRaw title: {{imt_title}}",
      sourceLang: "en",
      targetLang: "zh-Hans",
      pageTitle: "MetaTFT - Best TFT Comps",
      items: [{ id: "u-1", text: "Best comps", category: "heading" }],
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.messages[0].content).toContain("Title: 《MetaTFT - Best TFT Comps》");
    expect(body.messages[0].content).toContain("Raw title: MetaTFT - Best TFT Comps");
    expect(body.messages[0].content).not.toContain("{{title_prompt}}");
    expect(body.messages[0].content).not.toContain("{{imt_title}}");
  });
});

function openAIResponse(
  items: Array<{ id: string; text: string; status: string }>,
  options?: { headers?: Headers },
) {
  return {
    ok: true,
    headers: options?.headers ?? new Headers(),
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
