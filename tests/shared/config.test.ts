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
        openaiMaxConcurrentRequests: "4",
        openaiMaxBatchItems: 24.2,
        openaiMaxBatchChars: "12000",
        openaiRequestTimeoutMs: "60000",
        openaiSystemPrompt: " Custom prompt ",
        geminiEndpoint: " https://generativelanguage.googleapis.com/v1beta ",
        geminiApiKey: " gem-test ",
        geminiModel: " gemini-test ",
        geminiMaxConcurrentRequests: "3",
        geminiMaxBatchItems: 18.4,
        geminiMaxBatchChars: "8000",
        geminiRequestTimeoutMs: "65000",
        geminiSystemPrompt: " Gemini prompt ",
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
      openaiMaxConcurrentRequests: 4,
      openaiMaxBatchItems: 24,
      openaiMaxBatchChars: 12000,
      openaiRequestTimeoutMs: 60000,
      openaiSystemPrompt: "Custom prompt",
      geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
      geminiApiKey: "gem-test",
      geminiModel: "gemini-test",
      geminiMaxConcurrentRequests: 3,
      geminiMaxBatchItems: 18,
      geminiMaxBatchChars: 8000,
      geminiRequestTimeoutMs: 65000,
      geminiSystemPrompt: "Gemini prompt",
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

  it("clamps OpenAI request settings to safe bounds", () => {
    expect(
      normalizeExtensionConfig({
        openaiMaxConcurrentRequests: 99,
        openaiMaxBatchItems: 0,
        openaiMaxBatchChars: 100,
        openaiRequestTimeoutMs: 999999,
      }),
    ).toMatchObject({
      openaiMaxConcurrentRequests: 8,
      openaiMaxBatchItems: 1,
      openaiMaxBatchChars: 500,
      openaiRequestTimeoutMs: 180000,
    });
  });

  it("clamps Gemini request settings to safe bounds", () => {
    expect(
      normalizeExtensionConfig({
        geminiMaxConcurrentRequests: 99,
        geminiMaxBatchItems: 0,
        geminiMaxBatchChars: 100,
        geminiRequestTimeoutMs: 999999,
      }),
    ).toMatchObject({
      geminiMaxConcurrentRequests: 8,
      geminiMaxBatchItems: 1,
      geminiMaxBatchChars: 500,
      geminiRequestTimeoutMs: 180000,
    });
  });
});
