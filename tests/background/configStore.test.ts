import { describe, expect, it } from "vitest";
import { createConfigStore } from "@/background/configStore";

describe("createConfigStore", () => {
  it("loads defaults when storage is empty", async () => {
    const store = createConfigStore(new MemoryStorageArea());

    await expect(store.load()).resolves.toMatchObject({
      targetLang: "zh-Hans",
      provider: "microsoft",
      displayMode: "smart",
      dynamicMode: "normal",
      openaiEndpoint: "https://api.openai.com/v1/chat/completions",
      openaiApiKey: "",
      openaiModel: "gpt-4o-mini",
      siteDynamicModes: {},
      showFloatingBall: true,
      useCache: true,
    });
  });

  it("merges updates with the current config and persists them", async () => {
    const area = new MemoryStorageArea();
    const store = createConfigStore(area);

    const updated = await store.update({
      targetLang: "ja",
      dynamicMode: "off",
      openaiEndpoint: "https://api.example.test/v1/chat/completions",
      openaiApiKey: "sk-test",
      openaiModel: "gpt-test",
      siteDynamicModes: { "youtube.com": "normal" },
      showFloatingBall: false,
    });
    const stored = await store.load();

    expect(updated).toMatchObject({
      targetLang: "ja",
      dynamicMode: "off",
      openaiEndpoint: "https://api.example.test/v1/chat/completions",
      openaiApiKey: "sk-test",
      openaiModel: "gpt-test",
      siteDynamicModes: { "youtube.com": "normal" },
      showFloatingBall: false,
    });
    expect(stored).toEqual(updated);
  });
});

class MemoryStorageArea {
  private values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(values: Record<string, unknown>): Promise<void> {
    this.values = { ...this.values, ...values };
  }
}
