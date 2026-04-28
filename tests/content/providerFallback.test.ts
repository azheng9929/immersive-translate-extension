import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig, type ExtensionProvider } from "@/shared/config";
import { translateBatchWithProviderFallback } from "@/content/providerFallback";

describe("translateBatchWithProviderFallback", () => {
  it("retries failed primary items with the configured fallback provider", async () => {
    const config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "openai-compatible",
      fallbackProvider: "microsoft",
    };
    const calls: Array<{ provider: ExtensionProvider; ids: string[] }> = [];
    const items = [
      { id: "u-1", text: "Hello", category: "content-block" as const },
      { id: "u-2", text: "World", category: "content-block" as const },
    ];

    const results = await translateBatchWithProviderFallback(config, items, async (provider, batch) => {
      calls.push({ provider, ids: batch.map((item) => item.id) });
      if (provider === "openai-compatible") {
        return [
          { id: "u-1", text: "hello-zh", status: "ok" },
          { id: "u-2", text: "", status: "failed", error: "rate limit" },
        ];
      }
      return [{ id: "u-2", text: "world-zh", status: "ok" }];
    });

    expect(calls).toEqual([
      { provider: "openai-compatible", ids: ["u-1", "u-2"] },
      { provider: "microsoft", ids: ["u-2"] },
    ]);
    expect(results).toEqual([
      { id: "u-1", text: "hello-zh", status: "ok" },
      { id: "u-2", text: "world-zh", status: "ok" },
    ]);
  });

  it("does not retry when fallback is disabled or same as primary", async () => {
    const config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "gemini",
      fallbackProvider: "gemini",
    };
    const calls: ExtensionProvider[] = [];

    const results = await translateBatchWithProviderFallback(
      config,
      [{ id: "u-1", text: "Hello", category: "content-block" }],
      async (provider, batch) => {
        calls.push(provider);
        return batch.map((item) => ({ id: item.id, text: "", status: "failed" as const, error: "failed" }));
      },
    );

    expect(calls).toEqual(["gemini"]);
    expect(results).toEqual([{ id: "u-1", text: "", status: "failed", error: "failed" }]);
  });
});
