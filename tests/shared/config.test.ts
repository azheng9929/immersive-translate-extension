import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, requestProfilePatch } from "@/shared/config";

describe("normalizeExtensionConfig", () => {
  it("returns the default config for missing input", () => {
    expect(normalizeExtensionConfig(undefined)).toEqual(DEFAULT_EXTENSION_CONFIG);
  });

  it("keeps supported basic settings", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "ja",
        autoTranslate: true,
        provider: "fake",
        displayMode: "translation-only",
        dynamicMode: "conservative",
        requestProfile: "fast",
        fallbackProvider: "gemini",
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
        deepseekEndpoint: " https://api.deepseek.com/chat/completions ",
        deepseekApiKey: " ds-test ",
        deepseekModel: " deepseek-v4-pro ",
        deepseekMaxConcurrentRequests: "5",
        deepseekMaxBatchItems: 16.2,
        deepseekMaxBatchChars: "7000",
        deepseekRequestTimeoutMs: "55000",
        deepseekSystemPrompt: " DeepSeek prompt ",
        anthropicEndpoint: " https://api.anthropic.com/v1/messages ",
        anthropicApiKey: " claude-test ",
        anthropicModel: " claude-sonnet-4-5 ",
        anthropicMaxConcurrentRequests: "2",
        anthropicMaxBatchItems: 8.8,
        anthropicMaxBatchChars: "6000",
        anthropicRequestTimeoutMs: "70000",
        anthropicMaxOutputTokens: "3000",
        anthropicSystemPrompt: " Claude prompt ",
        openrouterEndpoint: " https://openrouter.ai/api/v1/chat/completions ",
        openrouterApiKey: " or-test ",
        openrouterModel: " anthropic/claude-sonnet-4-5 ",
        openrouterMaxConcurrentRequests: "6",
        openrouterMaxBatchItems: 10.1,
        openrouterMaxBatchChars: "9000",
        openrouterRequestTimeoutMs: "50000",
        openrouterSystemPrompt: " OpenRouter prompt ",
        glossary: [
          { source: " OpenAI ", target: "OpenAI" },
          { source: " prompt ", target: "提示词", note: " LLM term " },
        ],
        siteRules: {
          "https://www.youtube.com/watch?v=abc": {
            autoTranslate: true,
            dynamicMode: "off",
            displayMode: "bilingual",
            provider: "gemini",
            requestProfile: "stable",
          },
        },
        siteDynamicModes: {
          "youtube.com": "normal",
          "x.com": "off",
          "bad.example": "aggressive",
        },
        showFloatingBall: false,
        showDebugOverlay: true,
        showInputTranslator: true,
        useCache: false,
      }),
    ).toEqual({
      targetLang: "ja",
      autoTranslate: true,
      provider: "fake",
      displayMode: "translation-only",
      dynamicMode: "conservative",
      requestProfile: "fast",
      fallbackProvider: "gemini",
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
      deepseekEndpoint: "https://api.deepseek.com/chat/completions",
      deepseekApiKey: "ds-test",
      deepseekModel: "deepseek-v4-pro",
      deepseekMaxConcurrentRequests: 5,
      deepseekMaxBatchItems: 16,
      deepseekMaxBatchChars: 7000,
      deepseekRequestTimeoutMs: 55000,
      deepseekSystemPrompt: "DeepSeek prompt",
      anthropicEndpoint: "https://api.anthropic.com/v1/messages",
      anthropicApiKey: "claude-test",
      anthropicModel: "claude-sonnet-4-5",
      anthropicMaxConcurrentRequests: 2,
      anthropicMaxBatchItems: 9,
      anthropicMaxBatchChars: 6000,
      anthropicRequestTimeoutMs: 70000,
      anthropicMaxOutputTokens: 3000,
      anthropicSystemPrompt: "Claude prompt",
      openrouterEndpoint: "https://openrouter.ai/api/v1/chat/completions",
      openrouterApiKey: "or-test",
      openrouterModel: "anthropic/claude-sonnet-4-5",
      openrouterMaxConcurrentRequests: 6,
      openrouterMaxBatchItems: 10,
      openrouterMaxBatchChars: 9000,
      openrouterRequestTimeoutMs: 50000,
      openrouterSystemPrompt: "OpenRouter prompt",
      glossary: [
        { source: "OpenAI", target: "OpenAI" },
        { source: "prompt", target: "提示词", note: "LLM term" },
      ],
      siteRules: {
        "youtube.com": {
          autoTranslate: true,
          displayMode: "bilingual",
          provider: "gemini",
        },
      },
      siteDynamicModes: {
        "youtube.com": "normal",
        "x.com": "off",
      },
      showFloatingBall: false,
      showDebugOverlay: true,
      showInputTranslator: true,
      useCache: false,
    });
  });

  it("rejects unsupported values back to defaults", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "",
        autoTranslate: "yes",
        provider: "unknown",
        displayMode: "raw",
        dynamicMode: "aggressive",
        requestProfile: "turbo",
        fallbackProvider: "unknown",
        siteRules: {
          "bad site": { dynamicMode: "off" },
        },
        siteDynamicModes: "youtube.com",
        showFloatingBall: "yes",
        showDebugOverlay: "yes",
        showInputTranslator: "yes",
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

  it("clamps additional AI provider request settings to safe bounds", () => {
    expect(
      normalizeExtensionConfig({
        deepseekMaxConcurrentRequests: 99,
        deepseekMaxBatchItems: 0,
        deepseekMaxBatchChars: 100,
        deepseekRequestTimeoutMs: 999999,
        anthropicMaxConcurrentRequests: 99,
        anthropicMaxBatchItems: 0,
        anthropicMaxBatchChars: 100,
        anthropicRequestTimeoutMs: 999999,
        anthropicMaxOutputTokens: 999999,
        openrouterMaxConcurrentRequests: 99,
        openrouterMaxBatchItems: 0,
        openrouterMaxBatchChars: 100,
        openrouterRequestTimeoutMs: 999999,
      }),
    ).toMatchObject({
      deepseekMaxConcurrentRequests: 8,
      deepseekMaxBatchItems: 1,
      deepseekMaxBatchChars: 500,
      deepseekRequestTimeoutMs: 180000,
      anthropicMaxConcurrentRequests: 8,
      anthropicMaxBatchItems: 1,
      anthropicMaxBatchChars: 500,
      anthropicRequestTimeoutMs: 180000,
      anthropicMaxOutputTokens: 16000,
      openrouterMaxConcurrentRequests: 8,
      openrouterMaxBatchItems: 1,
      openrouterMaxBatchChars: 500,
      openrouterRequestTimeoutMs: 180000,
    });
  });

  it("builds request profile patches for both AI providers", () => {
    expect(requestProfilePatch("high-dynamic")).toMatchObject({
      requestProfile: "high-dynamic",
      dynamicMode: "conservative",
      openaiMaxConcurrentRequests: 2,
      openaiMaxBatchItems: 3,
      openaiMaxBatchChars: 1000,
      geminiMaxConcurrentRequests: 2,
      geminiMaxBatchItems: 3,
      geminiMaxBatchChars: 1000,
      deepseekMaxConcurrentRequests: 2,
      anthropicMaxConcurrentRequests: 2,
      openrouterMaxConcurrentRequests: 2,
    });
    expect(requestProfilePatch("fast")).toMatchObject({
      requestProfile: "fast",
      dynamicMode: "normal",
      openaiMaxConcurrentRequests: 6,
      openaiMaxBatchItems: 4,
      openaiMaxBatchChars: 1200,
      geminiMaxConcurrentRequests: 6,
      geminiMaxBatchItems: 4,
      geminiMaxBatchChars: 1200,
      deepseekMaxConcurrentRequests: 6,
      anthropicMaxConcurrentRequests: 4,
      openrouterMaxConcurrentRequests: 6,
    });
  });
});
