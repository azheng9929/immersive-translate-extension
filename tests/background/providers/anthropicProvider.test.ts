import { afterEach, describe, expect, it, vi } from "vitest";
import { anthropicProvider } from "@/background/providers/anthropicProvider";

describe("anthropicProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a Claude Messages request and parses JSON text content", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(anthropicResponse([{ id: "u-1", text: "hello-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await anthropicProvider.translate({
      provider: "anthropic",
      endpoint: "https://api.anthropic.com/v1/messages",
      apiKey: "anthropic-secret",
      model: "claude-sonnet-4-5",
      maxOutputTokens: 2048,
      targetLang: "zh-Hans",
      pageTitle: "Example Page",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.anthropic.com/v1/messages");
    expect(requestInit.headers).toMatchObject({
      "x-api-key": "anthropic-secret",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    });
    expect(body.model).toBe("claude-sonnet-4-5");
    expect(body.max_tokens).toBe(2048);
    expect(body.system).toContain("professional zh-Hans native translator");
    expect(body.system).toContain("Example Page");
    expect(JSON.parse(body.messages[0].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
  });

  it("surfaces Anthropic API errors with provider-specific wording", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "2" }),
        text: async () => JSON.stringify({ error: { message: "rate limit exceeded" } }),
      }),
    );

    await expect(
      anthropicProvider.translate({
        provider: "anthropic",
        endpoint: "https://api.anthropic.com/v1/messages",
        apiKey: "anthropic-secret",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).resolves.toEqual([
      { id: "u-1", text: "", status: "failed", error: "Anthropic API failed: 429 rate limit exceeded" },
    ]);
  });

  it("requires endpoint and api key", async () => {
    await expect(
      anthropicProvider.translate({
        provider: "anthropic",
        targetLang: "zh-Hans",
        items: [{ id: "u-1", text: "Hello", category: "content-block" }],
      }),
    ).rejects.toThrow("Anthropic API requires endpoint and API key");
  });
});

function anthropicResponse(items: Array<{ id: string; text: string; status: string }>) {
  return {
    ok: true,
    headers: new Headers(),
    text: async () =>
      JSON.stringify({
        content: [
          {
            type: "text",
            text: JSON.stringify({ items }),
          },
        ],
      }),
  };
}
