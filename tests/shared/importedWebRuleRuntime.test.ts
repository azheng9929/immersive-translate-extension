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
          ".remote-bg": "background-image:url(https://example.com/pixel.png)",
          body: "overflow:hidden",
        },
        injectedCss: [
          ".post-title { -webkit-line-clamp: unset !important; }",
          ".immersive-translate-target-wrapper br { display: none; }",
          "[class^='Original_section_title'] { overflow:hidden!important; }",
          "@import url(https://example.com/rules.css);",
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

  it("preserves imported delta operations while sanitizing CSS payloads", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "deltaStyles",
        siteKey: "example.com",
        matches: ["example.com"],
        injectedCss: {
          replace: [".headline { -webkit-line-clamp: unset; }"],
          add: [".summary { max-height: unset; }", "body { display: none; }"],
          remove: [".legacy { overflow: hidden; }"],
        },
        globalStyles: {
          replace: {
            ".headline": "-webkit-line-clamp: unset;",
            body: "overflow:hidden",
          },
          add: {
            ".summary": "max-height: unset;",
          },
          remove: [".old-title"],
        },
      },
    ];

    const prepared = prepareImportedWebTranslationRules(rules);

    expect(prepared[0]?.injectedCss).toEqual({
      replace: [".headline { -webkit-line-clamp: unset; }"],
      add: [".summary { max-height: unset; }"],
      remove: [".legacy { overflow: hidden; }"],
    });
    expect(prepared[0]?.globalStyles).toEqual({
      replace: {
        ".headline": "-webkit-line-clamp: unset;",
      },
      add: {
        ".summary": "max-height: unset;",
      },
      remove: [".old-title"],
    });
  });

  it("preserves safe imported global attribute repairs while dropping behavior-changing attributes", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "site",
        siteKey: "example.com",
        matches: ["example.com"],
        globalAttributes: {
          ".expandable": {
            class: "expanded",
            "data-expanded": "true",
            "aria-expanded": "true",
            title: null,
            onclick: "alert(1)",
            href: "javascript:alert(1)",
            srcdoc: "<script>alert(1)</script>",
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
        "aria-expanded": "true",
        title: null,
      },
    });
  });

  it("turns imported aiRule message wrappers into executable web translation selectors", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "chatOpenai",
        siteKey: "chatgpt.com",
        matches: ["chatgpt.com"],
        excludeSelectors: [
          "nav",
          ".markdown *",
          ".code-block__code",
        ],
        aiRule: {
          streamingSelector: ".result-streaming.markdown",
          messageWrapperSelector: ".markdown",
          streamingChange: true,
          streamingDelayTime: 1000,
        },
      },
      {
        id: "claudeAi",
        siteKey: "claude.ai",
        matches: ["claude.ai"],
        excludeSelectors: [".contents *", ".code-block__code"],
        aiRule: {
          messageWrapperSelector: ".contents",
          messageContainerSelector: ".ReactMarkdown",
          streamingChange: true,
        },
      },
    ];

    const prepared = prepareImportedWebTranslationRules(rules);

    expect(prepared[0]).toMatchObject({
      id: "chatOpenai",
      ruleCapability: "content-ready",
      fallbackProfile: "social",
      dynamicPreset: "chat-stream",
      isHighDynamic: true,
      allowTooltip: false,
      observeUrlChange: true,
    });
    expect(prepared[0]?.selectors).toEqual({
      add: [".markdown", ".result-streaming.markdown"],
    });
    expect(prepared[0]?.contentSelectors).toEqual({
      add: [{ selector: ".markdown", category: "comment" }],
    });
    expect(prepared[0]?.excludeSelectors).toEqual(["nav", ".code-block__code"]);

    expect(prepared[1]?.selectors).toEqual({
      add: [".ReactMarkdown", ".contents"],
    });
    expect(prepared[1]?.contentSelectors).toEqual({
      add: [{ selector: ".ReactMarkdown", category: "comment" }],
    });
    expect(prepared[1]?.excludeSelectors).toEqual([".code-block__code"]);
  });
});
