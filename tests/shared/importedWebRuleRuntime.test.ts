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

  it("drops broad page-level imported styles while preserving site-specific layout repairs", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "reddit",
        siteKey: "reddit.com",
        matches: ["reddit.com"],
        globalStyles: {
          ".post-title": "-webkit-line-clamp: unset; max-height: unset; overflow: visible;",
          ".mobile-promo": "display:none",
          body: "overflow:hidden",
        },
        injectedCss: [
          ".post-title { -webkit-line-clamp: unset !important; }",
          ".immersive-translate-target-wrapper br { display: none; }",
          "[class^='Original_section_title'] { overflow:hidden!important; }",
          "body { display: none; }",
        ],
      },
    ];

    const prepared = prepareImportedWebTranslationRules(rules);

    expect(prepared[0]?.globalStyles).toEqual({
      ".post-title": "-webkit-line-clamp: unset; max-height: unset; overflow: visible;",
      ".mobile-promo": "display:none",
    });
    expect(prepared[0]?.injectedCss).toEqual([
      ".post-title { -webkit-line-clamp: unset !important; }",
      ".immersive-translate-target-wrapper br { display: none; }",
      "[class^='Original_section_title'] { overflow:hidden!important; }",
    ]);
  });

  it("preserves imported global attribute repairs while dropping event handlers", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "site",
        siteKey: "example.com",
        matches: ["example.com"],
        globalAttributes: {
          ".expandable": {
            class: "expanded",
            "data-expanded": "true",
            title: null,
            onclick: "alert(1)",
            style: "height:unset",
          },
        },
      },
    ];

    const prepared = prepareImportedWebTranslationRules(rules);

    expect(prepared[0]?.globalAttributes).toEqual({
      ".expandable": {
        class: "expanded",
        "data-expanded": "true",
        style: "height:unset",
        title: null,
      },
    });
  });
});
