import { describe, expect, it } from "vitest";
import { prepareImportedWebTranslationRules } from "@/shared/importedWebRuleRuntime";
import type { WebTranslationRule } from "@/shared/webRuleTypes";

describe("importedWebRuleRuntime", () => {
  it("filters non-webpage surfaces without dropping normal domains that contain similar words", () => {
    const rules: WebTranslationRule[] = [
      { id: "pdf", matches: ["https://example.com/pdf/*"] },
      { id: "isEbook", selectorMatches: ["meta[name='immersive-translate-ebook-viewer']"] },
      { id: "facebook", matches: ["*.facebook.com"], selectors: ["[data-ad-preview]"] },
      { id: "githubNotebook", matches: ["notebooks.githubusercontent.com"], selectors: [".jp-Notebook"] },
    ];

    expect(prepareImportedWebTranslationRules(rules).map((rule) => rule.id)).toEqual(["facebook", "githubNotebook"]);
  });

  it("annotates imported rules with runtime capability and fallback profile", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "pornhub",
        siteKey: "pornhub.com",
        matches: ["pornhub.com"],
        globalStyles: {
          ".title": "-webkit-line-clamp: unset;",
        },
      },
      {
        id: "docs",
        siteKey: "docs.example.com",
        matches: ["docs.example.com"],
        selectors: ["article p"],
      },
      {
        id: "marker-only",
        siteKey: "marker.example.com",
        matches: ["marker.example.com"],
      },
    ];

    const prepared = prepareImportedWebTranslationRules(rules);

    expect(prepared.map((rule) => ({
      id: rule.id,
      capability: (rule as unknown as { ruleCapability?: string }).ruleCapability,
      fallback: (rule as unknown as { fallbackProfile?: string }).fallbackProfile,
    }))).toEqual([
      { id: "pornhub", capability: "modifier-only", fallback: "video" },
      { id: "docs", capability: "content-ready", fallback: "article" },
      { id: "marker-only", capability: "match-only", fallback: "generic" },
    ]);
  });
});
