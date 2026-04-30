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

  function ruleArrayValues(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
    if (typeof value === "string") return [value];
    if (typeof value !== "object") return [];
    const operation = value as { replace?: unknown; add?: unknown };
    return [...ruleArrayValues(operation.replace), ...ruleArrayValues(operation.add)];
  }

  function ruleRecordValues(value: unknown): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== "object") return {};
    const operation = value as { replace?: unknown; add?: unknown } & Record<string, unknown>;
    if ("replace" in operation || "add" in operation) {
      return {
        ...ruleRecordValues(operation.replace),
        ...ruleRecordValues(operation.add),
      };
    }
    return operation;
  }

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

  it("keeps core rule CSS selectors parseable", () => {
    const selectorFields = [
      "selectors",
      "excludeSelectors",
      "mutationExcludeSelectors",
      "extraBlockSelectors",
      "extraInlineSelectors",
      "atomicBlockSelectors",
      "buildContainerSelectors",
      "skipBuildContainerSelectors",
      "stayOriginalSelectors",
    ] as const;
    const invalid: string[] = [];

    for (const rule of BUILTIN_WEB_TRANSLATION_RULES) {
      for (const field of selectorFields) {
        for (const selector of ruleArrayValues(rule[field])) {
          try {
            document.querySelector(selector);
          } catch {
            invalid.push(`${rule.id}.${field}: ${selector}`);
          }
        }
      }
      for (const selector of Object.keys(ruleRecordValues(rule.globalStyles))) {
        try {
          document.querySelector(selector);
        } catch {
          invalid.push(`${rule.id}.globalStyles: ${selector}`);
        }
      }
    }

    expect(invalid).toEqual([]);
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

  it("merges versioned add and remove fields from raw immersive rules", () => {
    const merged = mergeWebTranslationRules(generalRule, {
      id: "versioned",
      "selectors.add_v.1.28.0": [".post-body"],
      "excludeSelectors.remove_v.1.28.0": ["nav"],
      "globalStyles.add_v.1.28.0": {
        ".post-body": "-webkit-line-clamp: unset;",
      },
    } as unknown as WebTranslationRule);

    expect(merged.selectors).toEqual(["main p", "article p", ".post-body"]);
    expect(merged.excludeSelectors).toEqual(["footer"]);
    expect(merged.globalStyles).toEqual({
      ".post-body": "-webkit-line-clamp: unset;",
    });
  });

  it("supports documented flat user-rule deltas and compatibility aliases", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "custom",
        matches: "example.com",
        "selectors.add": ".extra-body",
        "excludeSelectors.remove": "nav",
        additionalSelectors: ".legacy-extra",
        additionalExcludeSelectors: ".legacy-skip",
        additionalInjectedCss: ".legacy-extra { max-height: unset; }",
        "excludeTags.add": ["ASIDE"],
        "inlineTags.add": "MARK",
        translationClasses: "imt-user-style",
        globalAttributes: {
          ".clamped": {
            "data-expanded": "true",
            title: null,
          },
        },
        wrapperPrefix: "「",
        wrapperSuffix: "」",
      } as unknown as WebTranslationRule),
      "example.com",
      "normal",
    );

    expect(policy.preferredScanRootSelectors).toEqual(["main p", "article p", ".extra-body", ".legacy-extra"]);
    expect(policy.excludeSelectors).toEqual(["footer", ".legacy-skip"]);
    expect(policy.injectedCss).toContain(".legacy-extra { max-height: unset; }");
    expect(policy.filterRule.excludeTags).toContain("ASIDE");
    expect(policy.filterRule.inlineTags).toContain("MARK");
    expect(policy.translationClasses).toEqual(["imt-user-style"]);
    expect(policy.globalAttributes).toEqual({
      ".clamped": {
        "data-expanded": "true",
        title: null,
      },
    });
    expect(policy.wrapperPrefix).toBe("「");
    expect(policy.wrapperSuffix).toBe("」");
  });

  it("keeps text-flow tuning fields in compiled site policy", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "flow",
        preWhitespaceDetectedTags: { add: ["SPAN", "DIV"] },
        lineBreakMaxTextCount: 120,
      }),
      "example.com",
      "normal",
    );

    expect(policy.filterRule.preWhitespaceDetectedTags).toEqual(["SPAN", "DIV"]);
    expect(policy.lineBreakMaxTextCount).toBe(120);
  });

  it("keeps body and container rule fields in compiled site policy", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "article",
        bodyRule: {
          enable: false,
          minTextLength: 800,
        },
        mainFrameMinTextCount: 120,
        mainFrameMinWordCount: 20,
        containerMinTextCount: 42,
        buildContainerSelectors: { add: ["main.article", "[data-reader-root]"] },
        skipBuildContainerSelectors: { add: [".sidebar", ".recommendations"] },
      }),
      "example.com",
      "normal",
    );

    expect(policy.bodyRule).toEqual({
      enable: false,
      minTextLength: 800,
    });
    expect(policy.mainFrameMinTextCount).toBe(120);
    expect(policy.mainFrameMinWordCount).toBe(20);
    expect(policy.containerMinTextCount).toBe(42);
    expect(policy.buildContainerSelectors).toEqual(["main.article", "[data-reader-root]"]);
    expect(policy.skipBuildContainerSelectors).toEqual([".sidebar", ".recommendations"]);
  });

  it("compiles merged rules into a site policy for the existing translation pipeline", () => {
    const policy = compileRulePolicy(
      mergeWebTranslationRules(generalRule, {
        id: "youtube",
        siteKey: "youtube.com",
        isHighDynamic: true,
        dynamicPreset: "conservative",
        mainFrameSelector: "main#content",
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
      mainFrameSelector: "main#content",
    });
    expect(policy.preferredScanRootSelectors).toContain("#video-title");
    expect(policy.excludeSelectors).toContain("#masthead-container");
    expect(policy.excludedDynamicSelectors).toContain("ytd-popup-container");
    expect(policy.injectedCss.join("\n")).toContain("-webkit-line-clamp");
  });

  it("enables scroll viewport supplements for X without broad mutation pressure", () => {
    const policy = resolveWebTranslationPolicy("https://x.com/home", "normal");

    expect(policy).toMatchObject({
      siteKey: "x.com",
      isHighDynamic: true,
      dynamicMode: "conservative",
      maxRootsPerFlush: 12,
      viewportSupplement: true,
      viewportSupplementRootMargin: "900px",
      viewportSupplementMaxRoots: 20,
    });
  });

  it("absorbs safe X selectors from Immersive rules without enabling hover cards", () => {
    const policy = resolveWebTranslationPolicy("https://x.com/home", "normal");

    expect(policy.preferredScanRootSelectors).toContain("[data-testid='twitterArticleReadView']");
    expect(policy.preferredScanRootSelectors).toContain("[data-testid='inlinePrompt']");
    expect(policy.excludeSelectors).toContain("[data-testid=tweet-text-show-more-link]");
    expect(policy.excludeSelectors).toContain("[role='tab']");
    expect(policy.preferredScanRootSelectors).not.toContain("[data-testid='HoverCard'] div[dir=auto]");
    expect(policy.preferredScanRootSelectors).not.toContain("[role=dialog]");
  });

  it("uses a dedicated Threads rule for both .com and .net social feeds", () => {
    const threadsCom = resolveWebTranslationPolicy("https://www.threads.com/", "normal");
    const threadsNet = resolveWebTranslationPolicy("https://www.threads.net/@openai", "normal");

    expect(threadsCom).toMatchObject({
      ruleId: "threads",
      siteKey: "threads.com",
      isHighDynamic: true,
      dynamicMode: "conservative",
      allowTooltip: false,
      viewportSupplement: true,
      maxRootsPerFlush: 12,
    });
    expect(threadsCom.preferredScanRootSelectors).toContain('[role="article"] div[dir="auto"]');
    expect(threadsCom.preferredScanRootSelectors).toContain('[data-pressable-container="true"] div[dir="auto"]');
    expect(threadsCom.contentSelectors).toContainEqual({
      selector: '[role="article"] div[dir="auto"], article div[dir="auto"]',
      category: "comment",
    });
    expect(threadsCom.excludeSelectors).toContain('a[href^="/@"]');
    expect(threadsCom.excludeSelectors).toContain('[role="button"]');
    expect(threadsCom.attributeNames).toEqual([]);
    expect(threadsNet.ruleId).toBe("threads");
  });

  it("keeps Google search result span text anchored to rule selectors", () => {
    document.body.innerHTML = `
      <div id="search">
        <div class="g">
          <a href="https://openai.com/">
            <div role="heading" aria-level="3"><span>OpenAI official site</span></div>
          </a>
          <div class="VwiC3b"><span>OpenAI creates AI models and products.</span></div>
        </div>
      </div>
    `;
    const policy = resolveWebTranslationPolicy("https://www.google.com/search?q=openai", "normal", {
      rules: [
        {
          id: "googleSearch",
          siteKey: "www.google.*",
          matches: ["www.google.*/search*"],
          ruleSource: "imported-stable",
          ruleCapability: "modifier-only",
          fallbackProfile: "generic",
          excludeSelectors: ["#searchform", "#result-stats", "[role=navigation]"],
          extraBlockSelectors: ["[role=heading]"],
        },
      ],
    });

    expect(policy).toMatchObject({
      ruleId: "googleSearch",
      siteKey: "www.google.*",
      ruleCapability: "content-ready",
    });
    expect(policy.preferredScanRootSelectors).toContain("#search [role='heading'] span");
    expect(policy.preferredScanRootSelectors).toContain("#search .VwiC3b span");
    expect(policy.contentSelectors).toContainEqual({
      selector: "#search a h3, #search [role='heading']",
      category: "heading",
    });
    expect(policy.contentSelectors).toContainEqual({
      selector: "#search .VwiC3b, #search .IsZvec, #search .aCOpRe",
      category: "card-text",
    });
  });

  it("keeps YouTube search result descriptions and Reddit side rail labels in site selectors", () => {
    const youtube = resolveWebTranslationPolicy("https://www.youtube.com/results?search_query=openai", "normal");
    const reddit = resolveWebTranslationPolicy(
      "https://www.reddit.com/r/XiaomiGlobal/comments/1sxkzhf/xiaomi_mimo_orbit_program/",
      "normal",
    );

    expect(youtube.preferredScanRootSelectors).toContain("yt-formatted-string.metadata-snippet-text");
    expect(youtube.contentSelectors).toContainEqual({
      selector: "yt-formatted-string#description-text, yt-formatted-string.metadata-snippet-text",
      category: "card-text",
    });

    expect(reddit.preferredScanRootSelectors).toContain("#right-sidebar-container .i18n-translatable-text");
    expect(reddit.preferredScanRootSelectors).toContain("#right-sidebar-container h2.i18n-translatable-text");
    expect(reddit.contentSelectors).toContainEqual({
      selector: "#right-sidebar-container .i18n-translatable-text",
      category: "card-text",
    });
    expect(reddit.contentSelectors).toContainEqual({
      selector: "#right-sidebar-container h2.i18n-translatable-text",
      category: "card-text",
    });
    expect(reddit.excludeSelectors).not.toContain("faceplate-tracker");
    expect(reddit.excludedDynamicSelectors).toContain("faceplate-tracker");
  });

  it("uses old Reddit selectors instead of the new Reddit rule on old.reddit.com", () => {
    const policy = resolveWebTranslationPolicy("https://old.reddit.com/r/TrueReddit/", "normal");

    expect(policy).toMatchObject({
      ruleId: "old-reddit",
      siteKey: "old.reddit.com",
      isHighDynamic: false,
    });
    expect(policy.preferredScanRootSelectors).toContain("p.title > a.title");
    expect(policy.preferredScanRootSelectors).toContain(".comment .usertext-body .md");
    expect(policy.preferredScanRootSelectors).toContain(".side .md p");
    expect(policy.contentSelectors).toContainEqual({
      selector: "p.title > a.title, .thing.link .entry a.title",
      category: "card-text",
    });
    expect(policy.excludeSelectors).toContain(".rank");
    expect(policy.excludeSelectors).toContain(".score");
    expect(policy.excludeSelectors).toContain("a.author");
  });

  it("covers newer YouTube lockup, attributed string, comment, and transcript text surfaces", () => {
    const youtube = resolveWebTranslationPolicy("https://www.youtube.com/results?search_query=openai", "normal");

    expect(youtube.preferredScanRootSelectors).toContain("yt-formatted-string[slot=content].ytd-comment-renderer");
    expect(youtube.preferredScanRootSelectors).toContain(".ytLockupMetadataViewModelTitle");
    expect(youtube.preferredScanRootSelectors).toContain(".shortsLockupViewModelHostOutsideMetadataTitle");
    expect(youtube.preferredScanRootSelectors).toContain(".yt-core-attributed-string");
    expect(youtube.preferredScanRootSelectors).toContain(".ytwTranscriptSegmentViewModelHost");
    expect(youtube.excludeSelectors).toContain("yt-content-metadata-view-model");
    expect(youtube.excludeSelectors).toContain("yt-description-preview-view-model button");
    expect(youtube.injectedCss.join("\n")).toContain(".ytLockupMetadataViewModelTitle");
    expect(youtube.urlChangeDelay).toBe(800);
  });

  it("covers newer Reddit rich text, list, and recommendation surfaces", () => {
    const reddit = resolveWebTranslationPolicy(
      "https://www.reddit.com/r/XiaomiGlobal/comments/1sxkzhf/xiaomi_mimo_orbit_program/",
      "normal",
    );

    expect(reddit.preferredScanRootSelectors).toContain("[slot=comment]");
    expect(reddit.preferredScanRootSelectors).toContain("[slot=text-body]");
    expect(reddit.preferredScanRootSelectors).toContain(".RichTextJSON-root");
    expect(reddit.preferredScanRootSelectors).toContain("#subgrid-container h1, #subgrid-container h2");
    expect(reddit.preferredScanRootSelectors).toContain(".i18n-subreddit-description");
    expect(reddit.excludeSelectors).toContain("shreddit-comment-action-row");
    expect(reddit.injectedCss.join("\n")).toContain(".RichTextJSON-root");
  });

  it("uses a dedicated Pornhub rule so short video titles are preferred scan roots", () => {
    const policy = resolveWebTranslationPolicy("https://www.pornhub.com/view_video.php?viewkey=test", "normal");

    expect(policy).toMatchObject({
      siteKey: "pornhub.com",
      ruleId: "pornhub",
    });
    expect(policy.preferredScanRootSelectors).toContain("h1.title");
    expect(policy.preferredScanRootSelectors).toContain(".title-container h1");
    expect(policy.preferredScanRootSelectors).toContain("span.title");
    expect(policy.contentSelectors).toContainEqual({ selector: "h1.title, .title-container h1, #videoTitle", category: "heading" });
    expect(policy.injectedCss.join("\n")).toContain("span.title");
  });

  it("uses a dedicated Xvideos rule so homepage video titles are preferred scan roots", () => {
    const policy = resolveWebTranslationPolicy("https://www.xvideos.com/", "normal");

    expect(policy).toMatchObject({
      siteKey: "xvideos.com",
      ruleId: "xvideos",
      ruleCapability: "content-ready",
      fallbackProfile: "video",
    });
    expect(policy.preferredScanRootSelectors).toContain("#content .mozaique .thumb-under p.title");
    expect(policy.preferredScanRootSelectors).toContain("h2.page-title");
    expect(policy.contentSelectors).toContainEqual({
      selector: "#content .mozaique .thumb-under p.title",
      category: "card-text",
    });
    expect(policy.buildContainerSelectors).toEqual(["#content .mozaique", "#content"]);
    expect(policy.excludeSelectors).toContain("#content .mozaique .thumb-under p.metadata");
    expect(policy.filterRule.extraBlockSelectors).toEqual(["#content .mozaique .thumb-under p.title"]);
    expect(policy.injectedCss.join("\n")).toContain(".thumb-under p.title");
  });

  it("promotes high-value imported review candidates into explicit core webpage rules", () => {
    const cases = [
      {
        url: "https://stackoverflow.com/questions/1/how-to-test",
        ruleId: "stackoverflow",
        selectors: [".js-post-body", "span.comment-copy", ".s-post-summary--content-excerpt"],
        excludes: [".votecell", "#left-sidebar"],
      },
      {
        url: "https://example.substack.com/p/story",
        ruleId: "substack",
        selectors: [".reader2-post-title", ".available-content", ".comment-body"],
        excludes: [".publication-footer", "[data-testid='navbar']"],
      },
      {
        url: "https://github.blog/changelog/example/",
        ruleId: "github-blog",
        selectors: ["article h1", "article p", "article li"],
        excludes: ["header", "footer"],
      },
      {
        url: "https://developers.openai.com/api/docs/guides/text",
        ruleId: "openai-docs",
        selectors: ["main h1", "main p", "main li"],
        excludes: [".pheader", "pre"],
      },
      {
        url: "https://www.nature.com/articles/example",
        ruleId: "nature",
        selectors: [".c-article-title", ".c-article-body p", ".c-article-section__content"],
        excludes: [".c-header", ".c-article-author-list"],
      },
      {
        url: "https://apnews.com/article/example",
        ruleId: "apnews",
        selectors: ["article h1", "article p", "[data-key='article'] p"],
        excludes: ["nav", "footer"],
      },
      {
        url: "https://www.foxnews.com/world/example",
        ruleId: "foxnews",
        selectors: ["article h1", ".article-body p", ".article-content p"],
        excludes: [".site-footer", "nav"],
      },
      {
        url: "https://www.producthunt.com/products/example",
        ruleId: "producthunt",
        selectors: ["h1", "h5 + p", "[data-test='post-name']", "main a[href^='/posts/']"],
        excludes: [".styles_buttons__kKy_S", ".styles_count___6_8F"],
      },
      {
        url: "https://www.amazon.com/dp/example",
        ruleId: "amazon",
        selectors: ["#productTitle", "#feature-bullets li", "#productDescription p"],
        excludes: ["#navFooter", ".a-price"],
      },
      {
        url: "https://www.tiktok.com/@openai/video/123",
        ruleId: "tiktok",
        selectors: ["[data-e2e='browse-video-desc']", "[data-e2e='video-desc']", "[data-e2e='comment-level-1']"],
        excludes: ["[data-e2e*='-count']", "[data-e2e='nav-foryou']"],
      },
    ];

    for (const item of cases) {
      const policy = resolveWebTranslationPolicy(item.url, "normal");
      expect(policy.ruleId).toBe(item.ruleId);
      for (const selector of item.selectors) expect(policy.preferredScanRootSelectors).toContain(selector);
      for (const selector of item.excludes) expect(policy.excludeSelectors).toContain(selector);
    }
  });

  it("uses a landing-page rule for Inworld instead of generic single-root article scoring", () => {
    const policy = resolveWebTranslationPolicy("https://inworld.ai/", "normal");

    expect(policy).toMatchObject({
      siteKey: "inworld.ai",
      ruleId: "inworld",
      mainFrameSelector: "body > div.min-h-screen, main",
    });
    expect(policy.preferredScanRootSelectors).toContain("section h2");
    expect(policy.preferredScanRootSelectors).toContain("section div.bg-white.rounded-lg.p-6");
    expect(policy.excludeSelectors).toContain("header");
    expect(policy.excludeSelectors).toContain("footer");
  });

  it("uses a landing-page rule for PromptOT instead of generic structure-only scanning", () => {
    document.body.innerHTML = `
      <nav>
        <a>The shift</a>
        <button>Start free</button>
      </nav>
      <section>
        <h1>Version, Eval & Deploy Prompts done right.</h1>
        <p>One platform for every production prompt.</p>
        <ul><li>Six typed blocks compile into one deterministic prompt</li></ul>
      </section>
      <section>
        <div class="prompt-card">editor-assistant.prompt</div>
      </section>
    `;
    const policy = resolveWebTranslationPolicy("https://www.promptot.com/", "normal");

    expect(policy).toMatchObject({
      siteKey: "promptot.com",
      ruleId: "promptot",
      ruleCapability: "content-ready",
      fallbackProfile: "generic",
    });
    expect(policy.mainFrameSelector).toBeUndefined();
    expect(policy.preferredScanRootSelectors).toContain("section h1");
    expect(policy.preferredScanRootSelectors).toContain("section p");
    expect(policy.preferredScanRootSelectors).toContain("section li");
    const matchedRoots = policy.preferredScanRootSelectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)),
    );
    expect(matchedRoots.length).toBeGreaterThan(0);
    expect(policy.contentSelectors).toContainEqual({
      selector: "section h1, section h2, section h3",
      category: "heading",
    });
    expect(policy.contentSelectors).toContainEqual({
      selector: "section p, section li",
      category: "content-block",
    });
    expect(policy.excludeSelectors).toContain("pre");
    expect(policy.excludeSelectors).toContain("code");
    expect(policy.bodyRule).toEqual({ enable: false });
  });

  it("treats Product Hunt as a dynamic product feed with card anchors as scan roots", () => {
    document.body.innerHTML = `
      <main>
        <a href="/posts/quarkdown">
          <div>6. Quarkdown</div>
          <div>Markdown with LaTeX in a modern typesetting system</div>
        </a>
        <button>106</button>
      </main>
    `;
    const policy = resolveWebTranslationPolicy("https://www.producthunt.com/", "normal");

    expect(policy).toMatchObject({
      siteKey: "producthunt.com",
      ruleId: "producthunt",
      isHighDynamic: true,
      dynamicMode: "conservative",
      viewportSupplement: true,
    });
    expect(policy.preferredScanRootSelectors).toContain("main a[href^='/posts/']");
    expect(policy.preferredScanRootSelectors).toContain("main a[href^='/products/']");
    expect(policy.contentSelectors).toContainEqual({
      selector: "main a[href^='/posts/'], main a[href^='/products/']",
      category: "card-text",
    });
  });

  it("keeps Xvideos core capability when imported style-only rule is merged", () => {
    const policy = resolveWebTranslationPolicy("https://www.xvideos.com/", "normal", {
      rules: [
        {
          id: "xvideos",
          siteKey: "www.xvideos.com",
          matches: ["https://www.xvideos.com/*"],
          ruleSource: "imported-stable",
          ruleCapability: "modifier-only",
          fallbackProfile: "video",
          excludeSelectors: [".video-hd-mark"],
          globalStyles: {
            ".title": "-webkit-line-clamp:unset;max-height:unset;",
          },
        },
      ],
    });

    expect(policy).toMatchObject({
      ruleId: "xvideos",
      ruleSource: "core+imported",
      ruleCapability: "content-ready",
      fallbackProfile: "video",
    });
    expect(policy.preferredScanRootSelectors).toContain("#content .mozaique .thumb-under p.title");
    expect(policy.excludeSelectors).toContain(".video-hd-mark");
    expect(policy.injectedCss.join("\n")).toContain(".title");
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
    expect(BUILTIN_WEB_TRANSLATION_RULES.length).toBeGreaterThan(20);
    expect(BUILTIN_WEB_TRANSLATION_RULES.length).toBeLessThan(50);

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

  it("merges same-site imported rule deltas into a matching core rule without replacing the core profile", () => {
    const policy = resolveWebTranslationPolicy("https://www.youtube.com/results?search_query=openai", "normal", {
      rules: [
        {
          id: "youtube",
          siteKey: "www.youtube.com",
          matches: ["www.youtube.com"],
          ruleSource: "imported-stable",
          selectors: { add: [".imported-youtube-snippet"] },
          excludeSelectors: { add: [".imported-youtube-ad"] },
          globalStyles: {
            ".imported-youtube-snippet": "-webkit-line-clamp: unset;",
          },
        },
      ],
    });

    expect(policy).toMatchObject({
      ruleId: "youtube",
      ruleSource: "core+imported",
      siteKey: "youtube.com",
      dynamicMode: "conservative",
      isHighDynamic: true,
    });
    expect(policy.mergedRuleIds).toEqual(["youtube", "youtube"]);
    expect(policy.preferredScanRootSelectors).toContain("#video-title");
    expect(policy.preferredScanRootSelectors).toContain(".imported-youtube-snippet");
    expect(policy.excludeSelectors).toContain(".imported-youtube-ad");
    expect(policy.injectedCss.join("\n")).toContain(".imported-youtube-snippet");
  });

  it("uses a page-type fallback extractor for imported modifier-only video rules", () => {
    const policy = resolveWebTranslationPolicy("https://video.example.com/watch/123", "normal", {
      rules: [
        {
          id: "video-example",
          siteKey: "video.example.com",
          matches: ["video.example.com"],
          ruleSource: "imported-stable",
          ruleCapability: "modifier-only",
          fallbackProfile: "video",
          globalStyles: {
            ".title": "-webkit-line-clamp: unset;",
          },
        } as WebTranslationRule,
      ],
    });

    expect(policy).toMatchObject({
      ruleId: "video-example",
      ruleSource: "imported-stable",
      ruleCapability: "modifier-only",
      fallbackProfile: "video",
    });
    expect(policy.preferredScanRootSelectors).toContain("h1");
    expect(policy.preferredScanRootSelectors).toContain("span.title");
    expect(policy.contentSelectors).toContainEqual({
      selector: "h1, .title-container h1, #videoTitle",
      category: "heading",
    });
  });

  it("does not add fallback selectors to content-ready imported rules", () => {
    const policy = resolveWebTranslationPolicy("https://docs.example.com/guide", "normal", {
      rules: [
        {
          id: "docs",
          siteKey: "docs.example.com",
          matches: ["docs.example.com"],
          ruleSource: "imported-stable",
          ruleCapability: "content-ready",
          fallbackProfile: "article",
          selectors: ["article p"],
        } as WebTranslationRule,
      ],
    });

    expect(policy.preferredScanRootSelectors).toEqual(["article p"]);
    expect(policy.fallbackProfile).toBe("article");
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
