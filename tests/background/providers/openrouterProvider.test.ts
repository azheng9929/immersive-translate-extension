import { afterEach, describe, expect, it, vi } from "vitest";
import { openrouterProvider } from "@/background/providers/openrouterProvider";

describe("openrouterProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts an OpenRouter chat completion request and parses JSON items", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(chatResponse([{ id: "u-1", text: "hello-zh", status: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await openrouterProvider.translate({
      provider: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: "openrouter-secret",
      model: "openai/gpt-4o-mini",
      targetLang: "zh-Hans",
      items: [{ id: "u-1", text: "Hello", category: "content-block" }],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(requestInit.headers).toMatchObject({ Authorization: "Bearer openrouter-secret" });
    expect(body.model).toBe("openai/gpt-4o-mini");
    expect(body.response_format?.type).toBe("json_schema");
    expect(JSON.parse(body.messages[1].content).items).toEqual([
      { id: "u-1", category: "content-block", text: "Hello" },
    ]);
    expect(result).toEqual([{ id: "u-1", text: "hello-zh", status: "ok" }]);
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
