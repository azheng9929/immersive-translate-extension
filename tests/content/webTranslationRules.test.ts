import { describe, expect, it } from "vitest";
import {
  BUILTIN_WEB_TRANSLATION_RULES,
  compileRulePolicy,
  matchWebTranslationRule,
  mergeWebTranslationRules,
  resolveWebTranslationPolicy,
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

  it("matches imported host wildcard and host path patterns", () => {
    const rules: WebTranslationRule[] = [
      { id: "wikipedia", matches: ["*.wikipedia.org"] },
      { id: "telegram", matches: ["web.telegram.org/z/*"] },
    ];

    expect(matchWebTranslationRule("https://en.wikipedia.org/wiki/Translation", undefined, rules)?.id).toBe(
      "wikipedia",
    );
    expect(matchWebTranslationRule("https://web.telegram.org/z/#-123", undefined, rules)?.id).toBe("telegram");
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

  it("prefers matching DOM-shape rules over broader URL rules", () => {
    document.body.innerHTML = `<main data-reader><p>Article body.</p></main>`;
    const rules: WebTranslationRule[] = [
      { id: "generic-news", matches: ["example.com"], selectors: ["body"] },
      { id: "reader-shape", matches: ["example.com"], selectorMatches: ["main[data-reader]"], selectors: ["main"] },
    ];

    expect(matchWebTranslationRule("https://example.com/story", document, rules)?.id).toBe("reader-shape");
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

  it("preserves immersive rule fields used by the DOM filter compiler", () => {
    const merged = mergeWebTranslationRules(generalRule, {
      id: "github",
      extraInlineSelectors: { add: ["g-emoji", "a.anchor"] },
      atomicBlockSelectors: { add: ["[itemprop=description]"] },
      stayOriginalTags: { add: ["CODE", "TT", "G-EMOJI"] },
      stayOriginalSelectors: { add: [".math", "[role=math]"] },
      globalStyles: {
        ".TimelineItem-body .Link--primary": "-webkit-line-clamp: unset;",
      },
      mainFrameSelector: "main",
      observeUrlChange: true,
      urlChangeDelay: 120,
      detectParagraphLanguage: true,
    });

    expect(merged.extraInlineSelectors).toEqual(["g-emoji", "a.anchor"]);
    expect(merged.atomicBlockSelectors).toEqual(["[itemprop=description]"]);
    expect(merged.stayOriginalTags).toEqual(["CODE", "TT", "G-EMOJI"]);
    expect(merged.stayOriginalSelectors).toEqual([".math", "[role=math]"]);
    expect(merged.globalStyles).toEqual({
      ".TimelineItem-body .Link--primary": "-webkit-line-clamp: unset;",
    });
    expect(merged).toMatchObject({
      mainFrameSelector: "main",
      observeUrlChange: true,
      urlChangeDelay: 120,
      detectParagraphLanguage: true,
    });
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

  it("turns globalStyles into injected CSS and exposes compiled filter metadata", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "github",
        selectors: { add: [".markdown-body"] },
        extraInlineSelectors: { add: ["g-emoji"] },
        atomicBlockSelectors: { add: ["[itemprop=description]"] },
        stayOriginalTags: { add: ["CODE"] },
        globalStyles: {
          ".TimelineItem-body .Link--primary": "-webkit-line-clamp: unset;",
        },
        observeUrlChange: true,
        urlChangeDelay: 100,
      }),
      "github.com",
      "normal",
    );

    expect(policy.injectedCss.join("\n")).toContain(".TimelineItem-body .Link--primary");
    expect(policy.filterRule.extraInlineSelectors).toContain("g-emoji");
    expect(policy.filterRule.atomicBlockSelectors).toContain("[itemprop=description]");
    expect(policy.filterRule.stayOriginalTags).toContain("CODE");
    expect(policy.observeUrlChange).toBe(true);
    expect(policy.urlChangeDelay).toBe(100);
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

  it("keeps imported rules out of content defaults but accepts page candidate rules", () => {
    expect(BUILTIN_WEB_TRANSLATION_RULES.length).toBeLessThan(20);

    const mediumRule: WebTranslationRule = {
      id: "medium",
      siteKey: "medium.com",
      matches: ["medium.com", "*.medium.com"],
      selectorMatches: ["meta[property='al:ios:url'][content^='medium://']"],
      selectors: ["article p"],
      contentSelectors: [{ selector: "article p", category: "content-block" }],
      isHighDynamic: true,
    };

    document.head.innerHTML = "";
    document.body.innerHTML = `<article><p>Looks like an article, but not Medium.</p></article>`;
    expect(
      resolveWebTranslationPolicy("https://medium.com/@writer/story", "normal", {
        document,
        rules: [mediumRule],
      }),
    ).toMatchObject({
      isHighDynamic: false,
      preferredScanRootSelectors: [],
    });

    document.head.innerHTML = `<meta property="al:ios:url" content="medium://p/example">`;
    expect(
      resolveWebTranslationPolicy("https://medium.com/@writer/story", "normal", {
        document,
        rules: [mediumRule],
      }),
    ).toMatchObject({
      siteKey: "medium.com",
      isHighDynamic: true,
    });
  });

  it("maps imported always-on advanceMergeConfig rules to chat-style scheduling", () => {
    const chatRules: WebTranslationRule[] = [
      {
        id: "discord",
        siteKey: "discord.com",
        matches: ["https://discord.com/channels/*"],
        advanceMergeConfig: [{ condition: "true", advanceConfig: { dynamicPreset: "chat-stream", isHighDynamic: true } }],
      },
      {
        id: "telegram",
        siteKey: "web.telegram.org",
        matches: ["web.telegram.org/z/*"],
        advanceMergeConfig: [{ condition: "true", advanceConfig: { dynamicPreset: "chat-stream", isHighDynamic: true } }],
      },
    ];
    const discordPolicy = resolveWebTranslationPolicy("https://discord.com/channels/1/2", "normal", {
      rules: chatRules,
    });
    const telegramPolicy = resolveWebTranslationPolicy("https://web.telegram.org/z/#-123", "normal", {
      rules: chatRules,
    });

    expect(discordPolicy).toMatchObject({
      siteKey: "discord.com",
      isHighDynamic: true,
      maxEagerLazyRoots: 0,
    });
    expect(telegramPolicy).toMatchObject({
      siteKey: "web.telegram.org",
      isHighDynamic: true,
      maxEagerLazyRoots: 0,
    });
  });
});
