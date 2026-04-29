import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, resolveSiteConfig } from "@/shared/config";
import { normalizeSiteRules, setSiteDynamicModeRule, setSiteRule, normalizeSiteRuleKey } from "@/shared/siteRules";

describe("site rule helpers", () => {
  it("normalizes user-entered hosts and URLs to stable site keys", () => {
    expect(normalizeSiteRuleKey("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
    expect(normalizeSiteRuleKey("https://mobile.twitter.com/home")).toBe("twitter.com");
    expect(normalizeSiteRuleKey("WWW.Example.COM:443/docs")).toBe("example.com");
    expect(normalizeSiteRuleKey("not a host")).toBe("");
  });

  it("adds and removes dynamic mode overrides by normalized site key", () => {
    const added = setSiteDynamicModeRule({}, "https://www.reddit.com/r/typescript", "off");
    expect(added).toEqual({ "reddit.com": "off" });

    const removed = setSiteDynamicModeRule(added, "reddit.com", "auto");
    expect(removed).toEqual({});
  });

  it("normalizes enhanced site rules and drops empty or unsupported fields", () => {
    expect(
      normalizeSiteRules({
        "https://www.youtube.com/watch?v=abc": {
          dynamicMode: "conservative",
          displayMode: "translation-only",
          provider: "gemini",
          fallbackProvider: "microsoft",
          requestProfile: "high-dynamic",
        },
        "bad site": {
          dynamicMode: "off",
          provider: "unknown",
        },
        "example.com": {
          displayMode: "raw",
        },
      }),
    ).toEqual({
      "youtube.com": {
        dynamicMode: "conservative",
        displayMode: "translation-only",
        provider: "gemini",
        fallbackProvider: "microsoft",
        requestProfile: "high-dynamic",
      },
    });
  });

  it("sets enhanced site rules without keeping empty global-only rules", () => {
    const rules = setSiteRule({}, "https://www.youtube.com/watch?v=abc", {
      displayMode: "bilingual",
      provider: "openai-compatible",
    });
    expect(rules).toEqual({
      "youtube.com": {
        displayMode: "bilingual",
        provider: "openai-compatible",
      },
    });

    expect(setSiteRule(rules, "youtube.com", {})).toEqual({});
  });

  it("resolves effective config for a matching site rule", () => {
    const config = normalizeExtensionConfig({
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "microsoft",
      displayMode: "smart",
      dynamicMode: "normal",
      requestProfile: "balanced",
      siteRules: {
        "https://www.youtube.com/watch?v=abc": {
          dynamicMode: "off",
          displayMode: "translation-only",
          provider: "gemini",
          fallbackProvider: "microsoft",
          requestProfile: "high-dynamic",
        },
      },
    });

    expect(resolveSiteConfig(config, "www.youtube.com")).toMatchObject({
      provider: "gemini",
      fallbackProvider: "microsoft",
      displayMode: "translation-only",
      dynamicMode: "off",
      requestProfile: "high-dynamic",
      geminiMaxConcurrentRequests: 2,
      geminiMaxBatchItems: 3,
      geminiMaxBatchChars: 1000,
      siteDynamicModes: { "youtube.com": "off" },
    });
  });
});
