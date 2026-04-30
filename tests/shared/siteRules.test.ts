import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, resolveSiteConfig } from "@/shared/config";
import { normalizeSiteRules, setSiteRule, normalizeSiteRuleKey } from "@/shared/siteRules";

describe("site rule helpers", () => {
  it("normalizes user-entered hosts and URLs to stable site keys", () => {
    expect(normalizeSiteRuleKey("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
    expect(normalizeSiteRuleKey("https://mobile.twitter.com/home")).toBe("twitter.com");
    expect(normalizeSiteRuleKey("WWW.Example.COM:443/docs")).toBe("example.com");
    expect(normalizeSiteRuleKey("not a host")).toBe("");
  });

  it("normalizes site rules and drops empty or unsupported fields", () => {
    expect(
      normalizeSiteRules({
        "https://www.youtube.com/watch?v=abc": {
          autoTranslate: true,
          displayMode: "translation-only",
          provider: "deepseek",
          fallbackProvider: "anthropic",
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
        autoTranslate: true,
        displayMode: "translation-only",
        provider: "deepseek",
        fallbackProvider: "anthropic",
      },
    });
  });

  it("sets enhanced site rules without keeping empty global-only rules", () => {
    const rules = setSiteRule({}, "https://www.youtube.com/watch?v=abc", {
      autoTranslate: false,
      displayMode: "bilingual",
      provider: "openai-compatible",
    });
    expect(rules).toEqual({
      "youtube.com": {
        autoTranslate: false,
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
          autoTranslate: true,
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
      autoTranslate: true,
      fallbackProvider: "microsoft",
      displayMode: "translation-only",
      dynamicMode: "normal",
      requestProfile: "balanced",
      siteDynamicModes: {},
    });
  });
});
