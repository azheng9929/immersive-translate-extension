import { afterEach, describe, expect, it, vi } from "vitest";
import { deepseekProvider } from "@/background/providers/deepseekProvider";

describe("deepseekProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a DeepSeek chat request with JSON mode and non-thinking translation defaults", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(chatResponse([{ id: "u-1", text: "hello-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await deepseekProvider.translate({
      provider: "deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      apiKey: "deepseek-secret",
      model: "deepseek-v4-flash",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.deepseek.com/chat/completions");
    expect(requestInit.headers).toMatchObject({ Authorization: "Bearer deepseek-secret" });
    expect(body.model).toBe("deepseek-v4-flash");
    expect(body).not.toHaveProperty("temperature");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(JSON.parse(body.messages[1].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
  });

  it("surfaces DeepSeek API errors with provider-specific wording", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: async () => JSON.stringify({ error: { message: "Invalid API key" } }),
      }),
    );

    await expect(
      deepseekProvider.translate({
        provider: "deepseek",
        endpoint: "https://api.deepseek.com/chat/completions",
        apiKey: "bad",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).resolves.toEqual([
      { id: "u-1", text: "", status: "failed", error: "DeepSeek API failed: 401 Invalid API key" },
    ]);
  });

  it("requires endpoint and api key", async () => {
    await expect(
      deepseekProvider.translate({
        provider: "deepseek",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("DeepSeek API requires endpoint and API key");
  });
});

function chatResponse(items: Array<{ id: string; text: string; status: string }>) {
  return {
    ok: true,
    headers: new Headers(),
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
