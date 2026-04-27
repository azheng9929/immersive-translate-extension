import { afterEach, describe, expect, it, vi } from "vitest";
import { openaiProvider } from "@/background/providers/openaiProvider";

describe("openaiProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts an OpenAI-compatible chat request and parses JSON items", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
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
    expect(JSON.parse(body.messages[1].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "你好", status: "ok" }]);
  });

  it("requires endpoint and api key", async () => {
    await expect(
      openaiProvider.translate({
        provider: "openai-compatible",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("OpenAI-compatible provider requires endpoint and apiKey");
  });
});
