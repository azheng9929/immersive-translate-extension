import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig } from "@/shared/config";

describe("normalizeExtensionConfig", () => {
  it("returns the default config for missing input", () => {
    expect(normalizeExtensionConfig(undefined)).toEqual(DEFAULT_EXTENSION_CONFIG);
  });

  it("keeps supported basic settings", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "ja",
        provider: "fake",
        displayMode: "translation-only",
        dynamicMode: "conservative",
        openaiEndpoint: " https://api.example.test/v1/chat/completions ",
        openaiApiKey: " sk-test ",
        openaiModel: " gpt-test ",
        siteDynamicModes: {
          "youtube.com": "normal",
          "x.com": "off",
          "bad.example": "aggressive",
        },
        showFloatingBall: false,
        useCache: false,
      }),
    ).toEqual({
      targetLang: "ja",
      provider: "fake",
      displayMode: "translation-only",
      dynamicMode: "conservative",
      openaiEndpoint: "https://api.example.test/v1/chat/completions",
      openaiApiKey: "sk-test",
      openaiModel: "gpt-test",
      siteDynamicModes: {
        "youtube.com": "normal",
        "x.com": "off",
      },
      showFloatingBall: false,
      useCache: false,
    });
  });

  it("rejects unsupported values back to defaults", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "",
        provider: "unknown",
        displayMode: "raw",
        dynamicMode: "aggressive",
        siteDynamicModes: "youtube.com",
        showFloatingBall: "yes",
        useCache: "no",
      }),
    ).toEqual(DEFAULT_EXTENSION_CONFIG);
  });
});
