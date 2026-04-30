import { afterEach, describe, expect, it } from "vitest";
import {
  resetInflightTranslationDedupeForTests,
  runProviderRequestWithInflightDedupe,
} from "@/background/inflightTranslationDedupe";
import type { ProviderRequest, ProviderResponseItem } from "@/background/providers/providerTypes";

describe("inflightTranslationDedupe", () => {
  afterEach(() => {
    resetInflightTranslationDedupeForTests();
  });

  it("shares one provider call across concurrent requests with the same cache key", async () => {
    const providerCalls: string[][] = [];
    let resolveProvider: ((items: ProviderResponseItem[]) => void) | undefined;
    const baseRequest = createRequest();

    const first = runProviderRequestWithInflightDedupe(
      {
        ...baseRequest,
        items: [{ id: "first", text: "Repeated sentence.", category: "content-block", cacheKey: "cache-key-1" }],
      },
      async (request) => {
        providerCalls.push(request.items.map((item) => item.id));
        return new Promise((resolve) => {
          resolveProvider = resolve;
        });
      },
    );

    await Promise.resolve();

    const second = runProviderRequestWithInflightDedupe(
      {
        ...baseRequest,
        items: [{ id: "second", text: "Repeated sentence.", category: "content-block", cacheKey: "cache-key-1" }],
      },
      async (request) => {
        providerCalls.push(request.items.map((item) => item.id));
        return request.items.map((item) => ({ id: item.id, text: `[zh] ${item.text}`, status: "ok" as const }));
      },
    );

    await Promise.resolve();
    expect(providerCalls).toEqual([["first"]]);

    resolveProvider?.([{ id: "first", text: "[zh] Repeated sentence.", status: "ok" }]);

    await expect(first).resolves.toEqual([{ id: "first", text: "[zh] Repeated sentence.", status: "ok" }]);
    await expect(second).resolves.toEqual([{ id: "second", text: "[zh] Repeated sentence.", status: "ok" }]);
  });

  it("dedupes duplicate cache keys inside a single background request", async () => {
    const providerCalls: string[][] = [];

    const response = await runProviderRequestWithInflightDedupe(
      {
        ...createRequest(),
        items: [
          { id: "first", text: "Repeated sentence.", category: "content-block", cacheKey: "cache-key-1" },
          { id: "second", text: "Repeated sentence.", category: "content-block", cacheKey: "cache-key-1" },
          { id: "third", text: "Different sentence.", category: "content-block", cacheKey: "cache-key-2" },
        ],
      },
      async (request) => {
        providerCalls.push(request.items.map((item) => item.id));
        return request.items.map((item) => ({ id: item.id, text: `[zh] ${item.text}`, status: "ok" as const }));
      },
    );

    expect(providerCalls).toEqual([["first", "third"]]);
    expect(response).toEqual([
      { id: "first", text: "[zh] Repeated sentence.", status: "ok" },
      { id: "second", text: "[zh] Repeated sentence.", status: "ok" },
      { id: "third", text: "[zh] Different sentence.", status: "ok" },
    ]);
  });
});

function createRequest(): ProviderRequest {
  return {
    provider: "openai-compatible",
    endpoint: "https://api.example.test/v1/chat/completions",
    model: "gpt-test",
    systemPrompt: "Translate",
    sourceLang: "auto",
    targetLang: "zh-Hans",
    pageTitle: "Example",
    items: [],
  };
}
