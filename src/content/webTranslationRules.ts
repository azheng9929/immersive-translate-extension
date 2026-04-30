import { SAFE_TRANSLATABLE_ATTRIBUTES } from "./domScanner";
import { compileFilterRule, type CompiledFilterRule } from "./compiledFilterRule";
import type { DynamicMode } from "../shared/config";
import { analyzeWebTranslationRuleCapability } from "../shared/webRuleCapability";
import { filterMatchingWebTranslationRules, matchWebTranslationRule } from "../shared/webRuleMatcher";
import type { TranslatableAttributeName } from "../shared/types";
import type {
  RuleArrayValue,
  RuleContentSelector,
  RuleRecordValue,
  WebTranslationBodyRule,
  WebTranslationFallbackProfile,
  WebTranslationGlobalAttributes,
  WebTranslationRule,
  WebTranslationRuleCapability,
  WebTranslationRuleSource,
} from "../shared/webRuleTypes";
import type { DynamicModeSource, SitePolicy } from "./sitePolicy";

export type { RuleArrayValue, RuleContentSelector, WebTranslationRule };
export { matchWebTranslationRule, selectWebTranslationRulesForContent } from "../shared/webRuleMatcher";

type ResolvedWebTranslationRule = Omit<
  WebTranslationRule,
  | "selectors"
  | "additionalSelectors"
  | "excludeSelectors"
  | "additionalExcludeSelectors"
  | "excludeTags"
  | "additionalExcludeTags"
  | "mutationExcludeSelectors"
  | "injectedCss"
  | "additionalInjectedCss"
  | "extraBlockSelectors"
  | "extraInlineSelectors"
  | "atomicBlockSelectors"
  | "inlineTags"
  | "preWhitespaceDetectedTags"
  | "buildContainerSelectors"
  | "skipBuildContainerSelectors"
  | "stayOriginalSelectors"
  | "stayOriginalTags"
  | "globalStyles"
  | "globalAttributes"
  | "translationClasses"
  | "contentSelectors"
  | "attributeNames"
  | "advanceMergeConfig"
> & {
  ruleId: string;
  ruleSource: WebTranslationRuleSource;
  mergedRuleIds: readonly string[];
  selectors: readonly string[];
  excludeSelectors: readonly string[];
  excludeTags: readonly string[];
  mutationExcludeSelectors: readonly string[];
  injectedCss: readonly string[];
  extraBlockSelectors: readonly string[];
  extraInlineSelectors: readonly string[];
  atomicBlockSelectors: readonly string[];
  inlineTags: readonly string[];
  preWhitespaceDetectedTags: readonly string[];
  buildContainerSelectors: readonly string[];
  skipBuildContainerSelectors: readonly string[];
  stayOriginalSelectors: readonly string[];
  stayOriginalTags: readonly string[];
  globalStyles: Readonly<Record<string, string>>;
  globalAttributes: WebTranslationGlobalAttributes;
  translationClasses: readonly string[];
  contentSelectors: readonly RuleContentSelector[];
  attributeNames: readonly TranslatableAttributeName[];
  bodyRule?: WebTranslationBodyRule;
};

export const DEFAULT_EXCLUDED_DYNAMIC_SELECTORS = [
  '[data-imt-managed="true"]',
  '[data-imt-skip="true"]',
  '[data-imt-state="loading"]',
  '[data-imt-state="translated"]',
  '[translate="no"]',
  ".notranslate",
  "script",
  "style",
  "template",
  "noscript",
  "svg",
  "canvas",
  "textarea",
  "input",
  "select",
  "button",
  "nav",
  "menu",
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
] as const;

const TOOLTIP_DYNAMIC_SELECTORS = ['[role="tooltip"]', "[popover]"] as const;

const DEFAULT_SITE_POLICY = {
  hostname: "",
  siteKey: "",
  ruleId: "general",
  ruleSource: "core" as WebTranslationRuleSource,
  ruleCapability: "match-only" as WebTranslationRuleCapability,
  fallbackProfile: "generic" as WebTranslationFallbackProfile,
  mergedRuleIds: ["general"],
  dynamicModeSource: "global" as DynamicModeSource,
  isHighDynamic: false,
  dynamicMode: "normal" as DynamicMode,
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  buildContainerSelectors: [],
  skipBuildContainerSelectors: [],
  preferredScanRootSelectors: [],
  excludeSelectors: [],
  contentSelectors: [],
  allowTooltip: true,
  debounceMs: 1500,
  lazyRootMargin: "200px",
  lazyThreshold: 0.1,
  eagerLazyRootMargin: "900px",
  maxEagerLazyRoots: 120,
  viewportSupplement: false,
  viewportSupplementDebounceMs: 700,
  viewportSupplementRootMargin: "700px",
  viewportSupplementMaxRoots: 20,
  maxQueueSize: 300,
  maxRootsPerFlush: 20,
  maxObservedRoots: 300,
  maxMutationNodesPerWindow: 1000,
  mutationWindowMs: 5000,
  excludedDynamicSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: [],
  globalAttributes: {},
  translationClasses: [],
  filterRule: compileFilterRule({}),
  observeUrlChange: true,
  urlChangeDelay: 250,
} satisfies SitePolicy;

const DYNAMIC_PRESETS = {
  conservative: {
    dynamicMode: "conservative",
    debounceMs: 3000,
    lazyRootMargin: "120px",
    eagerLazyRootMargin: "400px",
    maxEagerLazyRoots: 40,
    maxQueueSize: 80,
    maxRootsPerFlush: 6,
    maxObservedRoots: 80,
    maxMutationNodesPerWindow: 240,
  },
  normal: {
    dynamicMode: "normal",
    debounceMs: DEFAULT_SITE_POLICY.debounceMs,
    lazyRootMargin: DEFAULT_SITE_POLICY.lazyRootMargin,
    maxQueueSize: DEFAULT_SITE_POLICY.maxQueueSize,
    maxRootsPerFlush: DEFAULT_SITE_POLICY.maxRootsPerFlush,
    maxObservedRoots: DEFAULT_SITE_POLICY.maxObservedRoots,
    maxMutationNodesPerWindow: DEFAULT_SITE_POLICY.maxMutationNodesPerWindow,
  },
  "twitter-fast": {
    dynamicMode: "conservative",
    debounceMs: 1200,
    lazyRootMargin: "700px",
    eagerLazyRootMargin: "900px",
    maxEagerLazyRoots: 80,
    viewportSupplement: true,
    viewportSupplementDebounceMs: 700,
    viewportSupplementRootMargin: "900px",
    viewportSupplementMaxRoots: 20,
    maxQueueSize: 120,
    maxRootsPerFlush: 12,
    maxObservedRoots: 160,
    maxMutationNodesPerWindow: 420,
  },
  "metatft-fast": {
    dynamicMode: "normal",
    debounceMs: 500,
    lazyRootMargin: "1400px",
    eagerLazyRootMargin: "1800px",
    maxEagerLazyRoots: 260,
    maxQueueSize: 900,
    maxRootsPerFlush: 90,
    maxObservedRoots: 900,
    maxMutationNodesPerWindow: 2200,
  },
  "tactics-fast": {
    dynamicMode: "normal",
    debounceMs: 120,
    lazyRootMargin: "1200px",
    eagerLazyRootMargin: "1400px",
    maxEagerLazyRoots: 180,
    maxQueueSize: 300,
    maxRootsPerFlush: 32,
    maxObservedRoots: 500,
    maxMutationNodesPerWindow: 1200,
  },
  "chat-stream": {
    dynamicMode: "normal",
    debounceMs: 800,
    lazyRootMargin: "600px",
    eagerLazyRootMargin: "500px",
    maxEagerLazyRoots: 0,
    maxQueueSize: 160,
    maxRootsPerFlush: 12,
    maxObservedRoots: 260,
    maxMutationNodesPerWindow: 500,
  },
} satisfies Record<string, Partial<SitePolicy>>;

export const GENERAL_WEB_TRANSLATION_RULE: WebTranslationRule = {
  id: "general",
  ruleSource: "core",
  siteKey: "",
  excludeSelectors: [],
  excludeTags: [],
  mutationExcludeSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  extraBlockSelectors: [],
  extraInlineSelectors: [],
  atomicBlockSelectors: [],
  inlineTags: [],
  preWhitespaceDetectedTags: [],
  buildContainerSelectors: [],
  skipBuildContainerSelectors: [],
  stayOriginalSelectors: [],
  stayOriginalTags: ["CODE", "KBD", "SAMP"],
  globalStyles: {},
  dynamicPreset: "normal",
  allowTooltip: true,
  paragraphMinTextCount: 2,
  paragraphMinWordCount: 1,
  blockMinTextCount: 24,
  blockMinWordCount: 4,
};

export const CORE_WEB_TRANSLATION_RULES: readonly WebTranslationRule[] = [
  {
    id: "x",
    siteKey: "x.com",
    matches: ["*://x.com/*", "*://*.x.com/*"],
    excludeMatches: ["*://x.com/settings/*", "*://x.com/i/chat*", "*://x.com/jobs/*"],
    selectors: [
      'article[data-testid="tweet"] div[data-testid="tweetText"]',
      'div[data-testid="tweetText"]',
      'div[data-testid="UserDescription"]',
      '[data-testid="birdwatch-pivot"]',
      '[data-testid="tweetTextarea_0RichTextInputContainer"]',
      '[data-testid="card.layoutSmall.detail"] > div:nth-child(2)',
      '[data-testid="developerBuiltCardContainer"] > div:nth-child(2)',
      '[data-testid="card.layoutLarge.detail"] > div:nth-child(2)',
      "[data-testid='twitterArticleReadView']",
      "[data-testid='inlinePrompt']",
    ],
    contentSelectors: [
      { selector: 'div[data-testid="tweetText"], [data-testid="tweetText"]', category: "comment" },
      { selector: 'div[data-testid="UserDescription"]', category: "content-block" },
      { selector: '[data-testid="card.layoutSmall.detail"] > div:nth-child(2)', category: "card-text" },
      { selector: '[data-testid="developerBuiltCardContainer"] > div:nth-child(2)', category: "card-text" },
      { selector: '[data-testid="card.layoutLarge.detail"] > div:nth-child(2)', category: "card-text" },
      { selector: "[data-testid='twitterArticleReadView']", category: "content-block" },
      { selector: "[data-testid='inlinePrompt']", category: "card-text" },
      { selector: 'article div[lang]:not([role="button"])', category: "comment" },
    ],
    excludeSelectors: [
      ...TOOLTIP_DYNAMIC_SELECTORS,
      '[data-testid="HoverCard"]',
      '[data-testid="hoverCardParent"]',
      '[data-testid="placementTracking"]',
      '[aria-live="polite"]',
      '[data-testid="sidebarColumn"]',
      '[aria-label="Timeline: Trending now"]',
      '[data-testid="SearchBox_Search_Input"]',
      '[data-testid="User-Name"]',
      '[data-testid="UserName"]',
      '[data-testid="UserCell"]',
      '[data-testid="suggestedUserHover"]',
      '[data-testid="trend"]',
      "[data-testid=tweet-text-show-more-link]",
      "[data-testid=socialContext]",
      "[role='tab']",
      '[data-testid="reply"]',
      '[data-testid="retweet"]',
      '[data-testid="like"]',
      '[data-testid="share"]',
      '[data-testid="bookmark"]',
      '[data-testid="analytics"]',
      '[role="group"][aria-label]',
      'header[role="banner"]',
      "aside",
      "time",
    ],
    mutationExcludeSelectors: [
      ...TOOLTIP_DYNAMIC_SELECTORS,
      '[data-testid="HoverCard"]',
      '[data-testid="hoverCardParent"]',
      '[data-testid="placementTracking"]',
      '[aria-live="polite"]',
      '[data-testid="sidebarColumn"]',
      '[aria-label="Timeline: Trending now"]',
      '[data-testid="SearchBox_Search_Input"]',
      '[data-testid="User-Name"]',
      '[data-testid="UserName"]',
      '[data-testid="UserCell"]',
      '[data-testid="suggestedUserHover"]',
      "[data-testid=tweet-text-show-more-link]",
      "[data-testid=socialContext]",
      "[role='tab']",
      '[data-testid="reply"]',
      '[data-testid="retweet"]',
      '[data-testid="like"]',
      '[data-testid="share"]',
      '[data-testid="bookmark"]',
      '[data-testid="analytics"]',
      '[role="group"][aria-label]',
      'header[role="banner"]',
      "aside",
      "time",
    ],
    injectedCss: [
      `
[data-testid="tweetText"],
[data-testid="tweetText"] *,
[data-testid="UserDescription"],
[data-testid="UserDescription"] *,
[data-testid='twitterArticleReadView'],
[data-testid='inlinePrompt'],
[data-testid="card.layoutSmall.detail"],
[data-testid="card.layoutLarge.detail"] {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    attributeNames: [],
    allowTooltip: false,
    isHighDynamic: true,
    dynamicPreset: "twitter-fast",
  },
  {
    id: "twitter",
    siteKey: "twitter.com",
    matches: ["*://twitter.com/*", "*://*.twitter.com/*"],
    excludeMatches: ["*://twitter.com/settings/*", "*://twitter.com/i/chat*", "*://twitter.com/jobs/*"],
    advanceMergeConfig: [
      {
        condition: "always",
        advanceConfig: {
          siteKey: "twitter.com",
        },
      },
    ],
    selectors: { add: [] },
    dynamicPreset: "twitter-fast",
    isHighDynamic: true,
  },
  {
    id: "threads",
    siteKey: "threads.com",
    matches: [
      "*://threads.com/*",
      "*://*.threads.com/*",
      "*://threads.net/*",
      "*://*.threads.net/*",
    ],
    excludeMatches: [
      "*://threads.com/login*",
      "*://www.threads.com/login*",
      "*://threads.net/login*",
      "*://www.threads.net/login*",
      "*://threads.com/privacy*",
      "*://www.threads.com/privacy*",
      "*://threads.net/privacy*",
      "*://www.threads.net/privacy*",
      "*://threads.com/terms*",
      "*://www.threads.com/terms*",
      "*://threads.net/terms*",
      "*://www.threads.net/terms*",
    ],
    selectors: [
      '[role="article"] div[dir="auto"]',
      'article div[dir="auto"]',
      '[role="article"] span[dir="auto"]',
      'article span[dir="auto"]',
      '[data-pressable-container="true"] div[dir="auto"]',
      '[data-pressable-container="true"] span[dir="auto"]',
      '[aria-label="Thread"] div[dir="auto"]',
      '[role="dialog"] [role="article"] div[dir="auto"]',
      '[role="dialog"] [role="article"] span[dir="auto"]',
    ],
    contentSelectors: [
      { selector: '[role="article"] div[dir="auto"], article div[dir="auto"]', category: "comment" },
      { selector: '[role="article"] span[dir="auto"], article span[dir="auto"]', category: "comment" },
      { selector: '[data-pressable-container="true"] div[dir="auto"]', category: "comment" },
      { selector: '[data-pressable-container="true"] span[dir="auto"]', category: "comment" },
      { selector: '[role="dialog"] [role="article"] div[dir="auto"]', category: "comment" },
      { selector: '[role="dialog"] [role="article"] span[dir="auto"]', category: "comment" },
    ],
    excludeSelectors: [
      ...TOOLTIP_DYNAMIC_SELECTORS,
      "nav",
      "header",
      "footer",
      "aside",
      "menu",
      "time",
      "button",
      '[role="button"]',
      '[role="menu"]',
      '[role="menuitem"]',
      '[role="navigation"]',
      '[aria-live="polite"]',
      '[aria-label="Like"]',
      '[aria-label="Reply"]',
      '[aria-label="Repost"]',
      '[aria-label="Share"]',
      '[aria-label="Send"]',
      '[aria-label="More"]',
      '[aria-label="Follow"]',
      'a[href^="/@"]',
      'a[href*="/@"]',
      ".x1rg5ohu",
      ".xat24cr.xdj266r a",
      ".x6s0dn4.x40hh3e.xrvj5dj.xxfwaov",
      ".x6s0dn4.x78zum5",
      ".xpvyfi4.x1xdureb.x1agbcgv",
      ".xpvyfi4.x1npkx4u.x1ms6mhf",
      "svg",
      "img",
    ],
    mutationExcludeSelectors: [
      ...TOOLTIP_DYNAMIC_SELECTORS,
      "nav",
      "header",
      "footer",
      "aside",
      "menu",
      "time",
      "button",
      '[role="button"]',
      '[role="menu"]',
      '[role="menuitem"]',
      '[role="navigation"]',
      '[aria-live="polite"]',
      '[aria-label="Like"]',
      '[aria-label="Reply"]',
      '[aria-label="Repost"]',
      '[aria-label="Share"]',
      '[aria-label="Send"]',
      '[aria-label="More"]',
      '[aria-label="Follow"]',
      ".x6s0dn4.x40hh3e.xrvj5dj.xxfwaov",
      ".x6s0dn4.x78zum5",
      ".xpvyfi4.x1xdureb.x1agbcgv",
      ".xpvyfi4.x1npkx4u.x1ms6mhf",
    ],
    stayOriginalSelectors: [
      'a[href^="/@"]',
      'a[href*="/@"]',
      ".x1rg5ohu",
      ".xat24cr.xdj266r a",
    ],
    extraBlockSelectors: [
      '[role="article"] div[dir="auto"]',
      '[data-pressable-container="true"] div[dir="auto"]',
      '[role="dialog"] [role="article"] div[dir="auto"]',
    ],
    injectedCss: [
      `
[role="article"] [dir="auto"],
article [dir="auto"],
[data-pressable-container="true"] [dir="auto"],
[role="dialog"] [role="article"] [dir="auto"],
.x569fbc {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
  white-space: normal !important;
}
`,
    ],
    attributeNames: [],
    allowTooltip: false,
    observeUrlChange: true,
    urlChangeDelay: 600,
    detectParagraphLanguage: true,
    paragraphMinTextCount: 1,
    paragraphMinWordCount: 1,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
    dynamicPreset: "twitter-fast",
    isHighDynamic: true,
  },
  {
    id: "youtube",
    siteKey: "youtube.com",
    matches: ["*://youtube.com/*", "*://*.youtube.com/*"],
    selectors: [
      "ytd-watch-metadata h1",
      "yt-formatted-string[slot=content].ytd-comment-renderer",
      "yt-formatted-string.ytd-video-renderer",
      "#video-title",
      "span#video-title",
      "#description-inline-expander",
      "#description",
      "#description-inline-expander > yt-attributed-string > span",
      "yt-attributed-string > span",
      "yt-formatted-string#description-text",
      "yt-formatted-string.metadata-snippet-text",
      "#content-text",
      "ytd-comment-view-model #content-text",
      "ytd-transcript-segment-renderer",
      ".ytwTranscriptSegmentViewModelHost",
      ".yt_to_text_transcript_text",
      "yt-formatted-string.ytd-channel-name",
      ".ytLockupMetadataViewModelTitle",
      ".shortsLockupViewModelHostOutsideMetadataTitle",
      ".yt-core-attributed-string",
    ],
    contentSelectors: [
      { selector: "h1.title, ytd-watch-metadata h1, h1 yt-formatted-string", category: "heading" },
      {
        selector: "yt-formatted-string#content-text, yt-formatted-string[slot=content].ytd-comment-renderer",
        category: "comment",
      },
      {
        selector:
          "#description, #description-inline-expander, ytd-text-inline-expander, #description-inline-expander > yt-attributed-string > span, yt-attributed-string > span",
        category: "content-block",
      },
      {
        selector: "yt-formatted-string#description-text, yt-formatted-string.metadata-snippet-text",
        category: "card-text",
      },
      {
        selector:
          "#video-title, span#video-title, a#video-title, yt-formatted-string.ytd-video-renderer, yt-formatted-string.ytd-compact-video-renderer, yt-formatted-string.ytd-grid-video-renderer, .ytLockupMetadataViewModelTitle, .shortsLockupViewModelHostOutsideMetadataTitle, .yt-core-attributed-string",
        category: "card-text",
      },
      { selector: ".ytwTranscriptSegmentViewModelHost, .yt_to_text_transcript_text", category: "comment" },
      { selector: "span.captions-text", category: "comment" },
    ],
    excludeSelectors: [
      "#masthead-container",
      "#guide-content",
      "ytd-mini-guide-renderer",
      "ytd-guide-entry-renderer",
      "ytd-searchbox",
      "#top-level-buttons-computed",
      "#metadata-line",
      "ytd-thumbnail-overlay-time-status-renderer",
      "ytd-live-chat-frame",
      "ytd-popup-container",
      "tp-yt-iron-dropdown",
      "ytd-menu-renderer",
      "ytd-button-renderer",
      "yt-button-shape",
      "yt-content-metadata-view-model",
      "yt-description-preview-view-model button",
      ".yt-page-header-view-model__page-header-title",
      ".ytp-caption-window-container",
      ".imt-caption-container",
      "yt-icon",
      "button",
      '[role="button"]',
      "#owner",
      "#subscribe-button",
      "ytd-subscribe-button-renderer",
      "ytd-comments-header-renderer",
      "ytd-sort-filter-sub-menu-renderer",
      "ytd-comment-action-buttons-renderer",
      ".ytp-chrome-bottom",
      ".ytp-chrome-top",
      ".ytp-button",
      "#hover-overlays",
      "ytd-thumbnail",
    ],
    mutationExcludeSelectors: [
      "ytd-popup-container",
      "tp-yt-iron-dropdown",
      "ytd-menu-renderer",
      "ytd-button-renderer",
      "yt-icon",
      ".imt-caption-container *",
      ".ytp-chrome-bottom",
      ".ytp-chrome-top",
      ".ytp-button",
      "#hover-overlays",
    ],
    injectedCss: [
      `
#video-title,
#description,
#description-inline-expander,
#description-text,
.metadata-snippet-text,
#content-text,
.ytLockupMetadataViewModelTitle,
.shortsLockupViewModelHostOutsideMetadataTitle,
.yt-lockup-metadata-view-model__title,
.yt-core-attributed-string,
.ytwTranscriptSegmentViewModelHost,
ytd-watch-metadata h1,
ytd-transcript-segment-renderer {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
ytd-expander.ytd-comment-renderer {
  --ytd-expander-max-lines: 1000;
}
`,
    ],
    observeUrlChange: true,
    urlChangeDelay: 800,
    detectParagraphLanguage: true,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
    dynamicPreset: "conservative",
    isHighDynamic: true,
  },
  {
    id: "reddit",
    siteKey: "reddit.com",
    matches: ["*://reddit.com/*", "*://*.reddit.com/*"],
    excludeMatches: [
      "*://old.reddit.com/*",
      "*://old.reddit.com",
      "*://www.reddit.com/.compact",
      "*://www.reddit.com/*/.compact",
      "*://reddit.com/.compact",
      "*://reddit.com/*/.compact",
    ],
    selectors: [
      'shreddit-post [slot="title"]',
      'shreddit-post [slot="text-body"]',
      "shreddit-comment",
      "[data-testid='post-content']",
      "[data-test-id='comment']",
      "#search-results-tab-slot",
      "h1",
      ".PostHeader__post-title-line",
      "[data-click-id=body] h3",
      "[data-click-id=background] h3",
      "[data-testid=comment]",
      "[data-adclicklocation='title'] h3",
      "[data-testid='post-title-text']",
      "[slot=comment]",
      "[slot=text-body]",
      "[slot='title']",
      "faceplate-batch .md",
      "[role=main] .md-container",
      ".RichTextJSON-root",
      ".rendererd-rtjson > p",
      "#subgrid-container h1, #subgrid-container h2",
      ".i18n-subreddit-description",
      "community-recommendation p",
      "#right-sidebar-container .i18n-translatable-text",
      "#right-sidebar-container h2.i18n-translatable-text",
      '#right-sidebar-container [data-testid="community-status-text"] p',
    ],
    contentSelectors: [
      { selector: '[data-testid="post-title"], a[data-testid="post-title"], [slot="title"]', category: "card-text" },
      {
        selector:
          ".PostHeader__post-title-line, [data-click-id=body] h3, [data-click-id=background] h3, [data-adclicklocation='title'] h3, [data-testid='post-title-text'], [slot='title']",
        category: "card-text",
      },
      {
        selector:
          '[data-testid="post-content"] p, [data-test-id="post-content"] p, shreddit-post [slot="text-body"], [slot=text-body], div[data-post-click-location="text-body"] p, faceplate-batch .md, [role=main] .md-container, .RichTextJSON-root, .rendererd-rtjson > p',
        category: "content-block",
      },
      { selector: '[data-testid="comment"] p, [data-testid=comment], shreddit-comment p, [slot=comment]', category: "comment" },
      {
        selector: "#subgrid-container h1, #subgrid-container h2, .i18n-subreddit-description, community-recommendation p",
        category: "card-text",
      },
      { selector: "#right-sidebar-container .i18n-translatable-text", category: "card-text" },
      { selector: "#right-sidebar-container h2.i18n-translatable-text", category: "card-text" },
      { selector: '#right-sidebar-container [data-testid="community-status-text"] p', category: "content-block" },
    ],
    excludeSelectors: [
      "faceplate-timeago",
      "time",
      "faceplate-screen-reader-content",
      "shreddit-post-overflow-menu",
      "shreddit-comment-overflow-menu",
      "shreddit-join-button",
      "faceplate-hovercard",
      "faceplate-tooltip",
      "faceplate-number",
      "shreddit-comment-action-row",
      ".text-neutral-content-weak",
      "shreddit-post-flair",
      "shreddit-distinguished-post-tags",
      '[data-testid="post_author_link"]',
      '[data-testid="comment_author_link"]',
      '[data-testid="comment_author"]',
      "a.author",
      "span.author",
      '[slot="credit-bar"]',
      "#feed-post-credit-bar",
      '[data-click-id="share"]',
      '[data-click-id="upvote"]',
      '[data-click-id="downvote"]',
      '[data-click-id="comments"]',
      '[data-click-id="save"]',
      '[data-click-id="award"]',
      "button",
      '[role="button"]',
      "nav",
      "header",
      "footer",
      "input",
      "textarea",
      "form",
      '[data-promoted="true"]',
    ],
    mutationExcludeSelectors: [
      "faceplate-hovercard",
      "faceplate-tooltip",
      "shreddit-post-overflow-menu",
      "shreddit-comment-overflow-menu",
      "faceplate-tracker",
      "faceplate-number",
    ],
    injectedCss: [
      `
shreddit-post [slot="title"],
shreddit-post [slot="text-body"],
shreddit-comment,
[data-testid="post-content"],
[data-test-id="comment"],
.RichTextJSON-root,
.rendererd-rtjson,
[slot="title"],
[slot="text-body"],
[slot="comment"],
#subgrid-container h1,
#subgrid-container h2,
.i18n-subreddit-description,
#right-sidebar-container .i18n-translatable-text,
#right-sidebar-container [data-testid="community-status-text"] p {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    detectParagraphLanguage: true,
    dynamicPreset: "conservative",
    isHighDynamic: true,
  },
  {
    id: "old-reddit",
    siteKey: "old.reddit.com",
    matches: [
      "*://old.reddit.com/*",
      "*://old.reddit.com",
      "*://www.reddit.com/.compact",
      "*://www.reddit.com/*/.compact",
      "*://reddit.com/.compact",
      "*://reddit.com/*/.compact",
    ],
    excludeMatches: [
      "*://old.reddit.com/r/*/wiki/*",
      "*://old.reddit.com/prefs/*",
      "*://old.reddit.com/message/*",
    ],
    selectors: [
      "p.title > a.title",
      ".thing.link .entry a.title",
      ".linkflairlabel",
      ".selftext .usertext-body .md",
      ".comment .usertext-body .md",
      ".commentarea .comment .usertext-body .md",
      ".expando .usertext .md",
      ".res-expando-box .md",
      ".media-gallery .usertext",
      ".side .md h1",
      ".side .md h2",
      ".side .md h3",
      ".side .md p",
      ".side .md li",
    ],
    contentSelectors: [
      { selector: "p.title > a.title, .thing.link .entry a.title", category: "card-text" },
      { selector: ".linkflairlabel", category: "label" },
      { selector: ".selftext .usertext-body .md, .expando .usertext .md, .res-expando-box .md, .media-gallery .usertext", category: "content-block" },
      { selector: ".comment .usertext-body .md, .commentarea .comment .usertext-body .md", category: "comment" },
      { selector: ".side .md h1, .side .md h2, .side .md h3", category: "heading" },
      { selector: ".side .md p, .side .md li", category: "content-block" },
    ],
    excludeSelectors: [
      "#sr-header-area",
      "#header",
      "#header-bottom-left",
      "#header-bottom-right",
      "#searchexpando",
      "#search",
      ".tabmenu",
      ".pagename",
      ".rank",
      ".score",
      ".midcol",
      ".arrow",
      ".thumbnail",
      ".expando-button",
      ".entry .tagline",
      ".tagline",
      ".flat-list",
      ".buttons",
      ".domain",
      ".redditname",
      ".subscribers",
      ".users-online",
      ".subscribe-button",
      ".fancy-toggle-button",
      ".sidebox",
      ".login-form-side",
      ".morelink",
      ".titlebox .bottom",
      ".titlebox .age",
      ".account-activity-box",
      ".footer-parent",
      ".bottommenu",
      ".nextprev",
      "a.author",
      "span.author",
      ".userattrs",
      ".age",
      "time",
      "button",
      "input",
      "textarea",
      "select",
      "form",
    ],
    mutationExcludeSelectors: [
      "#sr-header-area",
      "#header",
      ".rank",
      ".score",
      ".midcol",
      ".flat-list",
      ".buttons",
      ".tagline",
      ".domain",
      ".thumbnail",
      ".footer-parent",
      ".bottommenu",
    ],
    stayOriginalSelectors: [
      "a.author",
      "span.author",
      ".domain",
      ".redditname",
      ".subscribers",
      ".users-online",
      ".score",
      ".rank",
    ],
    extraBlockSelectors: [
      ".thing.link .entry",
      ".selftext .usertext-body .md",
      ".comment .usertext-body .md",
      ".side .md",
    ],
    injectedCss: [
      `
p.title > a.title,
.thing.link .entry a.title,
.usertext-body .md,
.side .md,
.linkflairlabel {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
  white-space: normal !important;
}
`,
    ],
    attributeNames: [],
    observeUrlChange: false,
    detectParagraphLanguage: true,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
  },
  {
    id: "metatft",
    siteKey: "metatft.com",
    matches: ["*://metatft.com/*", "*://*.metatft.com/*"],
    dynamicPreset: "metatft-fast",
    isHighDynamic: true,
  },
  {
    id: "tactics-tools",
    siteKey: "tactics.tools",
    matches: ["*://tactics.tools/*", "*://*.tactics.tools/*"],
    dynamicPreset: "tactics-fast",
    allowTooltip: true,
    isHighDynamic: true,
  },
  {
    id: "inworld",
    siteKey: "inworld.ai",
    matches: ["*://inworld.ai/*", "*://*.inworld.ai/*"],
    mainFrameSelector: "body > div.min-h-screen, main",
    selectors: [
      "section h1",
      "section h2",
      "section h3",
      "section p",
      "section li",
      "section div.prose",
      "section div.bg-white.rounded-lg.p-6",
    ],
    contentSelectors: [
      { selector: "section h1, section h2, section h3", category: "heading" },
      { selector: "section p, section li", category: "content-block" },
      { selector: "section div.prose", category: "content-block" },
      { selector: "section div.bg-white.rounded-lg.p-6", category: "card-text" },
    ],
    excludeSelectors: [
      "header",
      "nav",
      "footer",
      "menu",
      "button",
      '[role="button"]',
      "input",
      "textarea",
      "select",
      "pre",
      "code",
      "kbd",
      "samp",
      "script",
      "style",
      "svg",
      "canvas",
      '[aria-hidden="true"]',
    ],
    mutationExcludeSelectors: ["header", "nav", "footer", "pre", "code", "script", "style", "svg", "canvas"],
    injectedCss: [
      `
section h1,
section h2,
section h3,
section p,
section div.prose,
section div.bg-white.rounded-lg.p-6 {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
  white-space: normal !important;
}
`,
    ],
    extraBlockSelectors: ["section div.prose", "section div.bg-white.rounded-lg.p-6"],
    bodyRule: { enable: false },
    detectParagraphLanguage: true,
  },
  {
    id: "xvideos",
    siteKey: "xvideos.com",
    matches: ["*://xvideos.com/*", "*://*.xvideos.com/*"],
    selectors: [
      "#content .mozaique .thumb-under p.title",
      "#content .mozaique .thumb-under p.title > a",
      "#content .mozaique .thumb-under .title",
      "h1",
      "h2.page-title",
      ".page-title",
      ".video-title",
    ],
    contentSelectors: [
      { selector: "h1, h2.page-title, .page-title, .video-title", category: "heading" },
      { selector: "#content .mozaique .thumb-under p.title", category: "card-text" },
    ],
    excludeSelectors: [
      "button",
      '[role="button"]',
      "input",
      "textarea",
      "select",
      "nav",
      "header",
      "footer",
      "#content .mozaique .thumb-under p.metadata",
      ".metadata",
      ".duration",
      ".views",
      ".rating",
      ".profile",
    ],
    injectedCss: [
      `
#content .mozaique .thumb-under p.title,
#content .mozaique .thumb-under p.title > a,
.video-title,
.page-title {
  height: unset !important;
  max-height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  overflow: visible !important;
  white-space: normal !important;
}
`,
    ],
    buildContainerSelectors: ["#content .mozaique", "#content"],
    extraBlockSelectors: ["#content .mozaique .thumb-under p.title"],
    detectParagraphLanguage: true,
    paragraphMinTextCount: 1,
    paragraphMinWordCount: 1,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
  },
  {
    id: "pornhub",
    siteKey: "pornhub.com",
    matches: ["*://pornhub.com/*", "*://*.pornhub.com/*"],
    excludeMatches: ["*://pornhub.com/insights/*", "*://*.pornhub.com/insights/*"],
    selectors: [
      "h1.title",
      ".title-container h1",
      "#videoTitle",
      ".video-title",
      ".videoTitle",
      "span.title",
      ".pcVideoListItem span.title",
      ".pcVideoListItem .title a",
      ".entry-title > a",
      ".searchItem .title",
      ".trendingNow .title",
    ],
    contentSelectors: [
      { selector: "h1.title, .title-container h1, #videoTitle", category: "heading" },
      {
        selector:
          ".video-title, .videoTitle, span.title, .pcVideoListItem span.title, .pcVideoListItem .title a, .entry-title > a, .searchItem .title, .trendingNow .title",
        category: "card-text",
      },
    ],
    excludeSelectors: [
      "button",
      '[role="button"]',
      "input",
      "textarea",
      "select",
      "nav",
      "header",
      "footer",
      ".duration",
      ".views",
      ".ratingInfo",
      ".username",
      ".usernameWrap",
      ".userInfo",
    ],
    injectedCss: [
      `
span.title,
.title-container h1,
h1.title,
.detailedInfo,
.pcVideoListItem,
.wrap,
.entry-header,
.entry-title > a {
  height: unset !important;
  max-height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  overflow: visible !important;
}
`,
    ],
    extraBlockSelectors: [".trendingNow", ".searchItem"],
    detectParagraphLanguage: true,
    paragraphMinTextCount: 1,
    paragraphMinWordCount: 1,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
  },
] as const;

export const BUILTIN_WEB_TRANSLATION_RULES = CORE_WEB_TRANSLATION_RULES;

export function resolveWebTranslationRule(
  url: string,
  doc: Document | undefined = globalThis.document,
  rules: readonly WebTranslationRule[] = BUILTIN_WEB_TRANSLATION_RULES,
): ResolvedWebTranslationRule {
  const match = matchWebTranslationRule(url, doc, rules);
  if (!match) return withRuleMetadata(mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, { id: "general" }), {
    ruleId: "general",
    ruleSource: "core",
    mergedRuleIds: ["general"],
  });
  const base = match.id === "twitter"
    ? mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, CORE_WEB_TRANSLATION_RULES[0]!)
    : GENERAL_WEB_TRANSLATION_RULE;
  return withRuleMetadata(mergeWebTranslationRules(base, match), {
    ruleId: match.id,
    ruleSource: match.ruleSource ?? "core",
    mergedRuleIds: match.id === "twitter" ? ["x", "twitter"] : [match.id],
  });
}

export function mergeWebTranslationRules(base: WebTranslationRule, delta: WebTranslationRule): ResolvedWebTranslationRule {
  const merged = mergeOneRule(toResolvedRule(base), delta);
  for (const entry of delta.advanceMergeConfig ?? []) {
    if (entry.condition === "always" || entry.condition === "true") {
      Object.assign(merged, mergeOneRule(merged, { id: merged.id, ...entry.advanceConfig }));
    }
  }
  return merged;
}

export function compileRulePolicy(
  rule: ResolvedWebTranslationRule,
  hostname: string,
  preferredDynamicMode: DynamicMode = "normal",
  options: { siteDynamicMode?: DynamicMode } = {},
): SitePolicy {
  const normalizedHostname = normalizeHostname(hostname);
  const preset = DYNAMIC_PRESETS[rule.dynamicPreset ?? "normal"];
  const capability = analyzeWebTranslationRuleCapability(rule);
  const fallbackScanRootSelectors = fallbackScanRootSelectorsForRule(rule, capability);
  const fallbackContentSelectors = fallbackContentSelectorsForRule(rule, capability);
  const base = {
    ...DEFAULT_SITE_POLICY,
    ...preset,
    hostname: normalizedHostname,
    siteKey: rule.siteKey || normalizedHostname,
    ruleId: rule.ruleId,
    ruleSource: rule.ruleSource,
    ruleCapability: capability.capability,
    fallbackProfile: capability.fallbackProfile,
    mergedRuleIds: rule.mergedRuleIds,
    isHighDynamic: Boolean(rule.isHighDynamic),
    attributeNames: rule.attributeNames,
    ...(rule.mainFrameSelector ? { mainFrameSelector: rule.mainFrameSelector } : {}),
    ...(rule.mainFrameMinTextCount !== undefined ? { mainFrameMinTextCount: rule.mainFrameMinTextCount } : {}),
    ...(rule.mainFrameMinWordCount !== undefined ? { mainFrameMinWordCount: rule.mainFrameMinWordCount } : {}),
    ...(rule.bodyRule ? { bodyRule: rule.bodyRule } : {}),
    buildContainerSelectors: rule.buildContainerSelectors,
    skipBuildContainerSelectors: rule.skipBuildContainerSelectors,
    preferredScanRootSelectors: unique([...rule.selectors, ...fallbackScanRootSelectors]),
    excludeSelectors: rule.excludeSelectors,
    contentSelectors: unique([...rule.contentSelectors, ...fallbackContentSelectors], contentSelectorKey),
    allowTooltip: rule.allowTooltip ?? DEFAULT_SITE_POLICY.allowTooltip,
    excludedDynamicSelectors: unique([...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS, ...rule.excludeSelectors, ...rule.mutationExcludeSelectors]),
    injectedCss: unique([...rule.injectedCss, ...globalStylesToCss(rule.globalStyles)]),
    globalAttributes: rule.globalAttributes,
    translationClasses: rule.translationClasses,
    ...(rule.wrapperPrefix !== undefined ? { wrapperPrefix: rule.wrapperPrefix } : {}),
    ...(rule.wrapperSuffix !== undefined ? { wrapperSuffix: rule.wrapperSuffix } : {}),
    filterRule: compileFilterRule(rule),
    observeUrlChange: rule.observeUrlChange ?? DEFAULT_SITE_POLICY.observeUrlChange,
    urlChangeDelay: rule.urlChangeDelay ?? DEFAULT_SITE_POLICY.urlChangeDelay,
    ...(rule.debounceMs !== undefined ? { debounceMs: rule.debounceMs } : {}),
    ...(rule.lazyRootMargin !== undefined ? { lazyRootMargin: rule.lazyRootMargin } : {}),
    ...(rule.lazyThreshold !== undefined ? { lazyThreshold: rule.lazyThreshold } : {}),
    ...(rule.eagerLazyRootMargin !== undefined ? { eagerLazyRootMargin: rule.eagerLazyRootMargin } : {}),
    ...(rule.maxEagerLazyRoots !== undefined ? { maxEagerLazyRoots: rule.maxEagerLazyRoots } : {}),
    ...(rule.viewportSupplement !== undefined ? { viewportSupplement: rule.viewportSupplement } : {}),
    ...(rule.viewportSupplementDebounceMs !== undefined
      ? { viewportSupplementDebounceMs: rule.viewportSupplementDebounceMs }
      : {}),
    ...(rule.viewportSupplementRootMargin !== undefined
      ? { viewportSupplementRootMargin: rule.viewportSupplementRootMargin }
      : {}),
    ...(rule.viewportSupplementMaxRoots !== undefined ? { viewportSupplementMaxRoots: rule.viewportSupplementMaxRoots } : {}),
    ...(rule.maxQueueSize !== undefined ? { maxQueueSize: rule.maxQueueSize } : {}),
    ...(rule.maxRootsPerFlush !== undefined ? { maxRootsPerFlush: rule.maxRootsPerFlush } : {}),
    ...(rule.maxObservedRoots !== undefined ? { maxObservedRoots: rule.maxObservedRoots } : {}),
    ...(rule.maxMutationNodesPerWindow !== undefined ? { maxMutationNodesPerWindow: rule.maxMutationNodesPerWindow } : {}),
    ...(rule.mutationWindowMs !== undefined ? { mutationWindowMs: rule.mutationWindowMs } : {}),
  } satisfies SitePolicy;

  if (options.siteDynamicMode) {
    return {
      ...applyDynamicMode(base, options.siteDynamicMode),
      dynamicModeSource: "site-override",
    };
  }

  if (preferredDynamicMode === "off" || preferredDynamicMode === "conservative") {
    return {
      ...applyDynamicMode(base, preferredDynamicMode),
      dynamicModeSource: "global",
    };
  }

  return {
    ...base,
    dynamicModeSource: base.isHighDynamic ? "site-default" : "global",
  };
}

const FALLBACK_SCAN_ROOT_SELECTORS: Readonly<Record<WebTranslationFallbackProfile, readonly string[]>> = {
  none: [],
  article: [
    "article h1",
    "article h2",
    "article p",
    "main h1",
    "main h2",
    "main p",
    "[role='article'] h1",
    "[role='article'] p",
    ".article h1",
    ".article p",
    ".post-content p",
  ],
  video: [
    "h1",
    "h2",
    "h3",
    "span.title",
    "a.title",
    ".title-container h1",
    "#videoTitle",
    ".video-title",
    ".videoTitle",
    "[class*='video-title']",
    "[class*='VideoTitle']",
  ],
  social: [
    "[data-testid='tweetText']",
    "[slot='text-body']",
    "[slot='comment']",
    "[slot='title']",
    "[data-ad-preview='message']",
    ".comment",
    ".message",
  ],
  forum: [
    "[slot='comment']",
    "[slot='text-body']",
    ".RichTextJSON-root",
    ".comment",
    ".post",
    ".md",
    ".Post",
  ],
  commerce: [
    "h1",
    "[class*='product-title']",
    "[class*='ProductTitle']",
    "[class*='item-title']",
    "[class*='description']",
    "[itemprop='description']",
  ],
  generic: ["h1", "h2", "h3", "p", "li", "blockquote", "figcaption"],
};

const FALLBACK_CONTENT_SELECTORS: Readonly<Record<WebTranslationFallbackProfile, readonly RuleContentSelector[]>> = {
  none: [],
  article: [
    { selector: "article h1, main h1, [role='article'] h1, .article h1", category: "heading" },
    { selector: "article p, main p, [role='article'] p, .article p, .post-content p", category: "content-block" },
  ],
  video: [
    { selector: "h1, .title-container h1, #videoTitle", category: "heading" },
    { selector: "span.title, a.title, .video-title, .videoTitle", category: "card-text" },
  ],
  social: [
    { selector: "[data-testid='tweetText'], [slot='text-body'], [data-ad-preview='message']", category: "comment" },
    { selector: "[slot='title']", category: "heading" },
  ],
  forum: [
    { selector: "[slot='comment'], [slot='text-body'], .RichTextJSON-root, .comment, .post, .md", category: "comment" },
  ],
  commerce: [
    { selector: "h1, [class*='product-title'], [class*='ProductTitle'], [class*='item-title']", category: "heading" },
    { selector: "[class*='description'], [itemprop='description']", category: "content-block" },
  ],
  generic: [
    { selector: "h1, h2, h3", category: "heading" },
    { selector: "p, blockquote, figcaption", category: "content-block" },
    { selector: "li", category: "list-item" },
  ],
};

function fallbackScanRootSelectorsForRule(
  rule: ResolvedWebTranslationRule,
  capability: { capability: WebTranslationRuleCapability; fallbackProfile: WebTranslationFallbackProfile },
): readonly string[] {
  if (!shouldApplyFallbackExtractor(rule, capability)) return [];
  return FALLBACK_SCAN_ROOT_SELECTORS[capability.fallbackProfile];
}

function fallbackContentSelectorsForRule(
  rule: ResolvedWebTranslationRule,
  capability: { capability: WebTranslationRuleCapability; fallbackProfile: WebTranslationFallbackProfile },
): readonly RuleContentSelector[] {
  if (!shouldApplyFallbackExtractor(rule, capability)) return [];
  return FALLBACK_CONTENT_SELECTORS[capability.fallbackProfile];
}

function shouldApplyFallbackExtractor(
  rule: ResolvedWebTranslationRule,
  capability: { capability: WebTranslationRuleCapability; fallbackProfile: WebTranslationFallbackProfile },
): boolean {
  if (rule.ruleId === "general") return false;
  if (capability.capability === "content-ready" || capability.fallbackProfile === "none") return false;
  if (capability.capability === "match-only" && capability.fallbackProfile === "generic") return false;
  return true;
}

export function resolveWebTranslationPolicy(
  url: string,
  preferredDynamicMode: DynamicMode = "normal",
  options: { siteDynamicMode?: DynamicMode; document?: Document; rules?: readonly WebTranslationRule[] } = {},
): SitePolicy {
  const parsed = parseUrl(url);
  const hostname = parsed?.hostname ?? normalizeHostname(url);
  const effectiveUrl = urlFromHostnameFallback(url, hostname);
  const rule = options.rules?.length
    ? resolveWebTranslationRuleWithImportedDeltas(effectiveUrl, options.document, options.rules, hostname)
    : resolveWebTranslationRule(effectiveUrl, options.document, BUILTIN_WEB_TRANSLATION_RULES);
  return compileRulePolicy(
    rule,
    hostname,
    preferredDynamicMode,
    options,
  );
}

function resolveWebTranslationRuleWithImportedDeltas(
  url: string,
  doc: Document | undefined,
  importedRules: readonly WebTranslationRule[],
  hostname: string,
): ResolvedWebTranslationRule {
  const coreMatch = matchWebTranslationRule(url, doc, CORE_WEB_TRANSLATION_RULES);
  const importedMatches = filterMatchingWebTranslationRules(url, doc, importedRules);

  if (coreMatch) {
    const coreRule = resolveWebTranslationRule(url, doc, CORE_WEB_TRANSLATION_RULES);
    const compatibleImportedRules = importedMatches.filter((rule) =>
      rule.ruleSource !== "imported-experimental" && isSameRuleFamily(coreMatch, rule, hostname)
    );
    if (compatibleImportedRules.length === 0) return coreRule;

    const merged = compatibleImportedRules.reduce<ResolvedWebTranslationRule>(
      (current, importedRule) => mergeWebTranslationRules(current, importedRule),
      coreRule,
    );

    const mergedWithCoreSiteKey = coreRule.siteKey ? { ...merged, siteKey: coreRule.siteKey } : merged;
    return withRuleMetadata(mergedWithCoreSiteKey, {
      ruleId: coreMatch.id,
      ruleSource: "core+imported",
      mergedRuleIds: [coreMatch.id, ...compatibleImportedRules.map((rule) => rule.id)],
    });
  }

  const importedPrimary = matchWebTranslationRule(url, doc, importedRules);
  if (!importedPrimary) return resolveWebTranslationRule(url, doc, BUILTIN_WEB_TRANSLATION_RULES);

  const sameFamilyRules = importedMatches.filter((rule) => isSameRuleFamily(importedPrimary, rule, hostname));
  const merged = sameFamilyRules.reduce<ResolvedWebTranslationRule>(
    (current, importedRule) => mergeWebTranslationRules(current, importedRule),
    mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, { id: "general" }),
  );

  return withRuleMetadata(merged, {
    ruleId: importedPrimary.id,
    ruleSource: importedPrimary.ruleSource ?? "imported-experimental",
    mergedRuleIds: sameFamilyRules.map((rule) => rule.id),
  });
}

function withRuleMetadata(
  rule: ResolvedWebTranslationRule,
  metadata: Pick<ResolvedWebTranslationRule, "ruleId" | "ruleSource" | "mergedRuleIds">,
): ResolvedWebTranslationRule {
  return {
    ...rule,
    ...metadata,
  };
}

function isSameRuleFamily(base: WebTranslationRule, candidate: WebTranslationRule, hostname: string): boolean {
  if (base.id === candidate.id) return true;
  const baseSite = normalizedRuleSiteKey(base, hostname);
  const candidateSite = normalizedRuleSiteKey(candidate, hostname);
  return Boolean(baseSite && candidateSite && baseSite === candidateSite);
}

function normalizedRuleSiteKey(rule: WebTranslationRule, hostname: string): string | undefined {
  const raw = rule.siteKey ?? listValue(rule.matches)[0];
  if (!raw && rule === GENERAL_WEB_TRANSLATION_RULE) return normalizeHostname(hostname);
  const host = parseRuleHost(raw);
  return host?.replace(/^www\./, "").replace(/^\*\./, "").toLowerCase();
}

function parseRuleHost(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const firstPattern = value.split(",")[0]?.trim();
  if (!firstPattern) return undefined;
  try {
    return new URL(firstPattern.includes("://") ? firstPattern : `https://${firstPattern}`).hostname;
  } catch {
    return firstPattern.split("/")[0];
  }
}

function mergeOneRule(base: ResolvedWebTranslationRule, delta: WebTranslationRule): ResolvedWebTranslationRule {
  delta = normalizeVersionedRuleDeltas(delta);
  const siteKey = delta.siteKey ?? base.siteKey;
  const bodyRule = delta.bodyRule ? { ...(base.bodyRule ?? {}), ...delta.bodyRule } : base.bodyRule;
  return {
    ...base,
    ...delta,
    id: delta.id,
    ...(siteKey ? { siteKey } : {}),
    ...(bodyRule ? { bodyRule } : {}),
    selectors: mergeArray(mergeArray(base.selectors, delta.selectors), addOnly(delta.additionalSelectors)),
    excludeSelectors: mergeArray(mergeArray(base.excludeSelectors, delta.excludeSelectors), addOnly(delta.additionalExcludeSelectors)),
    excludeTags: mergeArray(mergeArray(base.excludeTags, delta.excludeTags), addOnly(delta.additionalExcludeTags), upperKey)
      .map((tag) => tag.toUpperCase()),
    mutationExcludeSelectors: mergeArray(base.mutationExcludeSelectors, delta.mutationExcludeSelectors),
    injectedCss: mergeArray(mergeArray(base.injectedCss, delta.injectedCss), addOnly(delta.additionalInjectedCss)),
    extraBlockSelectors: mergeArray(base.extraBlockSelectors, delta.extraBlockSelectors),
    extraInlineSelectors: mergeArray(base.extraInlineSelectors, delta.extraInlineSelectors),
    atomicBlockSelectors: mergeArray(base.atomicBlockSelectors, delta.atomicBlockSelectors),
    inlineTags: mergeArray(base.inlineTags, delta.inlineTags, upperKey).map((tag) => tag.toUpperCase()),
    preWhitespaceDetectedTags: mergeArray(base.preWhitespaceDetectedTags, delta.preWhitespaceDetectedTags, upperKey)
      .map((tag) => tag.toUpperCase()),
    buildContainerSelectors: mergeArray(base.buildContainerSelectors, delta.buildContainerSelectors),
    skipBuildContainerSelectors: mergeArray(base.skipBuildContainerSelectors, delta.skipBuildContainerSelectors),
    stayOriginalSelectors: mergeArray(base.stayOriginalSelectors, delta.stayOriginalSelectors),
    stayOriginalTags: mergeArray(base.stayOriginalTags, delta.stayOriginalTags, upperKey)
      .map((tag) => tag.toUpperCase()),
    globalStyles: mergeRecord(base.globalStyles, delta.globalStyles),
    globalAttributes: mergeRecord(base.globalAttributes, delta.globalAttributes),
    translationClasses: mergeArray(base.translationClasses, delta.translationClasses),
    contentSelectors: mergeArray(base.contentSelectors, delta.contentSelectors, contentSelectorKey),
    attributeNames: mergeArray(base.attributeNames, delta.attributeNames),
  };
}

function toResolvedRule(rule: WebTranslationRule): ResolvedWebTranslationRule {
  return {
    ...rule,
    ruleId: rule.id,
    ruleSource: rule.ruleSource ?? "core",
    mergedRuleIds: [rule.id],
    selectors: mergeArray(arrayValue(rule.selectors), addOnly(rule.additionalSelectors)),
    excludeSelectors: mergeArray(arrayValue(rule.excludeSelectors), addOnly(rule.additionalExcludeSelectors)),
    excludeTags: mergeArray(arrayValue(rule.excludeTags), addOnly(rule.additionalExcludeTags), upperKey)
      .map((tag) => tag.toUpperCase()),
    mutationExcludeSelectors: arrayValue(rule.mutationExcludeSelectors),
    injectedCss: mergeArray(arrayValue(rule.injectedCss), addOnly(rule.additionalInjectedCss)),
    extraBlockSelectors: arrayValue(rule.extraBlockSelectors),
    extraInlineSelectors: arrayValue(rule.extraInlineSelectors),
    atomicBlockSelectors: arrayValue(rule.atomicBlockSelectors),
    inlineTags: arrayValue(rule.inlineTags).map((tag) => tag.toUpperCase()),
    preWhitespaceDetectedTags: arrayValue(rule.preWhitespaceDetectedTags).map((tag) => tag.toUpperCase()),
    buildContainerSelectors: arrayValue(rule.buildContainerSelectors),
    skipBuildContainerSelectors: arrayValue(rule.skipBuildContainerSelectors),
    stayOriginalSelectors: arrayValue(rule.stayOriginalSelectors),
    stayOriginalTags: arrayValue(rule.stayOriginalTags).map((tag) => tag.toUpperCase()),
    globalStyles: recordValue(rule.globalStyles),
    globalAttributes: recordValue(rule.globalAttributes),
    translationClasses: arrayValue(rule.translationClasses),
    contentSelectors: arrayValue(rule.contentSelectors),
    attributeNames: arrayValue(rule.attributeNames),
  };
}

function normalizeVersionedRuleDeltas(rule: WebTranslationRule): WebTranslationRule {
  const raw = rule as WebTranslationRule & Record<string, unknown>;
  return {
    ...rule,
    ...optionalRuleValue("selectors", withVersionedArrayDeltas(raw, "selectors")),
    ...optionalRuleValue("additionalSelectors", withVersionedArrayDeltas(raw, "additionalSelectors")),
    ...optionalRuleValue("excludeSelectors", withVersionedArrayDeltas(raw, "excludeSelectors")),
    ...optionalRuleValue("additionalExcludeSelectors", withVersionedArrayDeltas(raw, "additionalExcludeSelectors")),
    ...optionalRuleValue("excludeTags", withVersionedArrayDeltas(raw, "excludeTags")),
    ...optionalRuleValue("additionalExcludeTags", withVersionedArrayDeltas(raw, "additionalExcludeTags")),
    ...optionalRuleValue("mutationExcludeSelectors", withVersionedArrayDeltas(raw, "mutationExcludeSelectors")),
    ...optionalRuleValue("injectedCss", withVersionedArrayDeltas(raw, "injectedCss")),
    ...optionalRuleValue("additionalInjectedCss", withVersionedArrayDeltas(raw, "additionalInjectedCss")),
    ...optionalRuleValue("extraBlockSelectors", withVersionedArrayDeltas(raw, "extraBlockSelectors")),
    ...optionalRuleValue("extraInlineSelectors", withVersionedArrayDeltas(raw, "extraInlineSelectors")),
    ...optionalRuleValue("atomicBlockSelectors", withVersionedArrayDeltas(raw, "atomicBlockSelectors")),
    ...optionalRuleValue("inlineTags", withVersionedArrayDeltas(raw, "inlineTags")),
    ...optionalRuleValue("preWhitespaceDetectedTags", withVersionedArrayDeltas(raw, "preWhitespaceDetectedTags")),
    ...optionalRuleValue("buildContainerSelectors", withVersionedArrayDeltas(raw, "buildContainerSelectors")),
    ...optionalRuleValue("skipBuildContainerSelectors", withVersionedArrayDeltas(raw, "skipBuildContainerSelectors")),
    ...optionalRuleValue("stayOriginalSelectors", withVersionedArrayDeltas(raw, "stayOriginalSelectors")),
    ...optionalRuleValue("stayOriginalTags", withVersionedArrayDeltas(raw, "stayOriginalTags")),
    ...optionalRuleValue("globalStyles", withVersionedRecordDeltas(raw, "globalStyles")),
    ...optionalRuleValue("globalAttributes", withVersionedRecordDeltas(raw, "globalAttributes")),
    ...optionalRuleValue("translationClasses", withVersionedArrayDeltas(raw, "translationClasses")),
  };
}

function optionalRuleValue<Key extends keyof WebTranslationRule>(
  key: Key,
  value: WebTranslationRule[Key] | undefined,
): Partial<WebTranslationRule> {
  return value === undefined ? {} : { [key]: value };
}

function mergeArray<T>(
  base: readonly T[],
  value: RuleArrayValue<T> | undefined,
  keyOf: (item: T) => string = (item) => String(item),
): readonly T[] {
  if (!value) return base;
  if (!isRuleArrayOperation(value)) return unique(listValue(value), keyOf);

  let next = value.replace !== undefined ? [...listValue(value.replace)] : [...base];
  const removeKeys = new Set(listValue(value.remove).map(keyOf));
  next = next.filter((item) => !removeKeys.has(keyOf(item)));
  next.push(...listValue(value.add));
  return unique(next, keyOf);
}

function arrayValue<T>(value: RuleArrayValue<T> | undefined): readonly T[] {
  if (!value) return [];
  if (!isRuleArrayOperation(value)) return unique(listValue(value));
  return unique(value.replace !== undefined ? listValue(value.replace) : listValue(value.add));
}

function addOnly<T>(value: RuleArrayValue<T> | undefined): RuleArrayValue<T> | undefined {
  if (!value) return undefined;
  if (!isRuleArrayOperation(value)) return { add: listValue(value) };
  return {
    ...(value.replace !== undefined ? { replace: listValue(value.replace) } : {}),
    ...(value.add !== undefined ? { add: listValue(value.add) } : {}),
    ...(value.remove !== undefined ? { remove: listValue(value.remove) } : {}),
  };
}

function listValue<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value as readonly T[] : [value as T];
}

function withVersionedArrayDeltas<T extends string | RuleContentSelector | TranslatableAttributeName>(
  rule: WebTranslationRule & Record<string, unknown>,
  field: keyof WebTranslationRule,
): RuleArrayValue<T> | undefined {
  const direct = rule[field] as RuleArrayValue<T> | undefined;
  let replace: T[] | undefined;
  const add: T[] = [];
  const remove: T[] = [];

  for (const [key, value] of Object.entries(rule)) {
    if (key === `${String(field)}.replace`) replace = arrayLikeValue<T>(value);
    if (key === `${String(field)}.add`) add.push(...arrayLikeValue<T>(value));
    if (key === `${String(field)}.remove`) remove.push(...arrayLikeValue<T>(value));
    if (key.startsWith(`${String(field)}.add_v.`)) add.push(...arrayLikeValue<T>(value));
    if (key.startsWith(`${String(field)}.remove_v.`)) remove.push(...arrayLikeValue<T>(value));
  }

  if (replace === undefined && add.length === 0 && remove.length === 0) return direct;
  if (!direct) return { ...(replace !== undefined ? { replace } : {}), add, remove };
  if (!isRuleArrayOperation(direct)) {
    return { replace: replace ?? listValue(direct), add, remove };
  }
  return {
    ...(replace !== undefined
      ? { replace }
      : direct.replace !== undefined
        ? { replace: listValue(direct.replace) }
        : {}),
    add: [...listValue(direct.add), ...add],
    remove: [...listValue(direct.remove), ...remove],
  };
}

function mergeRecord<T>(
  base: Readonly<Record<string, T>>,
  value: RuleRecordValue<T> | undefined,
): Readonly<Record<string, T>> {
  if (!value) return base;
  if (isRuleRecord(value)) return { ...value };

  const next = value.replace ? { ...value.replace } : { ...base };
  for (const key of value.remove ?? []) delete next[key];
  return { ...next, ...(value.add ?? {}) };
}

function recordValue<T>(value: RuleRecordValue<T> | undefined): Readonly<Record<string, T>> {
  if (!value) return {};
  if (isRuleRecord(value)) return { ...value };
  return { ...(value.replace ?? value.add ?? {}) };
}

function withVersionedRecordDeltas<T>(
  rule: WebTranslationRule & Record<string, unknown>,
  field: keyof WebTranslationRule,
): RuleRecordValue<T> | undefined {
  const direct = rule[field] as RuleRecordValue<T> | undefined;
  let replace: Record<string, T> | undefined;
  const add: Record<string, T> = {};
  const remove: string[] = [];

  for (const [key, value] of Object.entries(rule)) {
    if (key === `${String(field)}.replace`) replace = recordLikeValue<T>(value);
    if (key === `${String(field)}.add`) Object.assign(add, recordLikeValue<T>(value));
    if (key === `${String(field)}.remove`) remove.push(...arrayLikeValue<string>(value));
    if (key.startsWith(`${String(field)}.add_v.`)) Object.assign(add, recordLikeValue<T>(value));
    if (key.startsWith(`${String(field)}.remove_v.`)) remove.push(...arrayLikeValue<string>(value));
  }

  if (replace === undefined && Object.keys(add).length === 0 && remove.length === 0) return direct;
  if (!direct) return { ...(replace !== undefined ? { replace } : {}), add, remove };
  if (isRuleRecord(direct)) return { replace: replace ?? direct, add, remove };
  return {
    ...(replace !== undefined ? { replace } : direct.replace ? { replace: direct.replace } : {}),
    add: { ...(direct.add ?? {}), ...add },
    remove: [...(direct.remove ?? []), ...remove],
  };
}

function isRuleArray<T>(value: RuleArrayValue<T>): value is readonly T[] {
  return Array.isArray(value);
}

function isRuleArrayOperation<T>(
  value: RuleArrayValue<T> | undefined,
): value is { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] } {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("replace" in value || "add" in value || "remove" in value),
  );
}

function isRuleRecord<T>(value: RuleRecordValue<T>): value is Readonly<Record<string, T>> {
  return !("replace" in value || "add" in value || "remove" in value);
}

function arrayLikeValue<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return value === undefined ? [] : [value as T];
}

function recordLikeValue<T>(value: unknown): Record<string, T> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Record<string, T>;
}

function unique<T>(items: readonly T[], keyOf: (item: T) => string = (item) => String(item)): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function contentSelectorKey(item: RuleContentSelector): string {
  return `${item.selector}:${item.category}`;
}

function upperKey(item: string): string {
  return item.toUpperCase();
}

function globalStylesToCss(globalStyles: Readonly<Record<string, string>>): string[] {
  return Object.entries(globalStyles).map(([selector, style]) => `${selector} { ${style} }`);
}

function applyDynamicMode(policy: SitePolicy, dynamicMode: DynamicMode): SitePolicy {
  if (dynamicMode === "off") return { ...policy, dynamicMode: "off" };
  if (dynamicMode === "conservative") return { ...policy, ...DYNAMIC_PRESETS.conservative };
  return { ...policy, ...DYNAMIC_PRESETS.normal };
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return undefined;
  }
}

function urlFromHostnameFallback(value: string, hostname: string): string {
  return value.includes("://") ? value : `https://${hostname}/`;
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}
