import { describe, expect, it } from "vitest";
import {
  compileRulePolicy,
  matchWebTranslationRule,
  mergeWebTranslationRules,
  selectWebTranslationRulesForContent,
  type WebTranslationRule,
} from "@/content/webTranslationRules";

describe("webTranslationRules", () => {
  const generalRule: WebTranslationRule = {
    id: "general",
    selectors: ["main p", "article p"],
    excludeSelectors: ["nav", "footer"],
    mutationExcludeSelectors: ["[data-no-dynamic]"],
    injectedCss: ["body { overflow-wrap: anywhere; }"],
    paragraphMinTextCount: 2,
    blockMinTextCount: 24,
  };

  it("matches URL rules with exclude URL protection", () => {
    const rules: WebTranslationRule[] = [
      {
        id: "x",
        siteKey: "x.com",
        matches: ["*://*.x.com/*", "*://x.com/*"],
        excludeMatches: ["*://x.com/settings/*"],
        selectors: ['[data-testid="tweetText"]'],
      },
    ];

    expect(matchWebTranslationRule("https://mobile.x.com/home", undefined, rules)?.id).toBe("x");
    expect(matchWebTranslationRule("https://x.com/settings/profile", undefined, rules)).toBeUndefined();
  });

  it("uses selectorMatches and excludeSelectorMatches to detect page shape", () => {
    document.body.innerHTML = `<main data-reader><p>Article body.</p></main>`;
    const rules: WebTranslationRule[] = [
      {
        id: "article-shape",
        matches: ["*://example.com/*"],
        selectorMatches: ["main[data-reader]"],
        excludeSelectorMatches: [".paywall"],
      },
    ];

    expect(matchWebTranslationRule("https://example.com/story", document, rules)?.id).toBe("article-shape");

    document.body.innerHTML = `<main data-reader><div class="paywall">Subscribe</div></main>`;
    expect(matchWebTranslationRule("https://example.com/story", document, rules)).toBeUndefined();
  });

  it("merges general rules with site deltas using add and remove operations", () => {
    const merged = mergeWebTranslationRules(generalRule, {
      id: "site",
      selectors: { add: [".post-title"], remove: ["main p"] },
      excludeSelectors: { add: [".toolbar"] },
      injectedCss: { add: [".post-title { -webkit-line-clamp: unset; }"] },
    });

    expect(merged.selectors).toEqual(["article p", ".post-title"]);
    expect(merged.excludeSelectors).toEqual(["nav", "footer", ".toolbar"]);
    expect(merged.injectedCss).toEqual([
      "body { overflow-wrap: anywhere; }",
      ".post-title { -webkit-line-clamp: unset; }",
    ]);
  });

  it("applies conditional advanceMergeConfig patches", () => {
    const merged = mergeWebTranslationRules(generalRule, {
      id: "chat",
      advanceMergeConfig: [
        {
          condition: "always",
          advanceConfig: {
            maxEagerLazyRoots: 0,
            selectors: { add: [".message"] },
          },
        },
      ],
    });

    expect(merged.maxEagerLazyRoots).toBe(0);
    expect(merged.selectors).toContain(".message");
  });

  it("compiles merged rules into a site policy for the existing translation pipeline", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "youtube",
        siteKey: "youtube.com",
        isHighDynamic: true,
        dynamicPreset: "conservative",
        selectors: { add: ["#video-title"] },
        excludeSelectors: { add: ["#masthead-container"] },
        mutationExcludeSelectors: { add: ["ytd-popup-container"] },
        injectedCss: { add: ["#video-title { -webkit-line-clamp: unset !important; }"] },
      }),
      "www.youtube.com",
      "normal",
    );

    expect(policy).toMatchObject({
      hostname: "www.youtube.com",
      siteKey: "youtube.com",
      dynamicMode: "conservative",
      dynamicModeSource: "site-default",
      isHighDynamic: true,
    });
    expect(policy.preferredScanRootSelectors).toContain("#video-title");
    expect(policy.excludeSelectors).toContain("#masthead-container");
    expect(policy.excludedDynamicSelectors).toContain("ytd-popup-container");
    expect(policy.injectedCss.join("\n")).toContain("-webkit-line-clamp");
  });

  it("selects only DOM-detection rules plus the current URL rule for content-side matching", () => {
    const rules: WebTranslationRule[] = [
      { id: "news", matches: ["news.example.com"], selectors: ["article p"] },
      { id: "reader-shape", selectorMatches: ["main[data-reader]"], selectors: ["main p"] },
      { id: "shop", matches: ["shop.example.com"], selectors: [".product-title"] },
      { id: "paywall-shape", selectorMatches: [".paywall"], excludeSelectorMatches: [".logged-in"] },
    ];

    expect(selectWebTranslationRulesForContent("https://news.example.com/story", rules).map((rule) => rule.id)).toEqual([
      "reader-shape",
      "paywall-shape",
      "news",
    ]);
  });
});
