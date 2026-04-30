import { SAFE_TRANSLATABLE_ATTRIBUTES } from "./domScanner";
import { compileFilterRule, type CompiledFilterRule } from "./compiledFilterRule";
import type { DynamicMode } from "../shared/config";
import { analyzeWebTranslationRuleCapability } from "../shared/webRuleCapability";
import {
  filterMatchingWebTranslationRules,
  matchWebTranslationRule,
  matchWebTranslationRulesRanked,
  type WebTranslationRuleMatch,
} from "../shared/webRuleMatcher";
import type { TranslatableAttributeName } from "../shared/types";
import type {
  RuleArrayValue,
  RuleContentSelector,
  RuleRecordValue,
  SelectorFallbackPolicy,
  WebTranslationBodyRule,
  WebTranslationFallbackProfile,
  WebTranslationGlobalAttributes,
  WebTranslationRule,
  WebTranslationRuleCapability,
  WebTranslationRuleSource,
} from "../shared/webRuleTypes";
import type { DynamicModeSource, SitePolicy, SitePolicyRuleResolution } from "./sitePolicy";

export type { RuleArrayValue, RuleContentSelector, WebTranslationRule };
export {
  matchWebTranslationRule,
  matchWebTranslationRulesRanked,
  selectWebTranslationRulesForContent,
} from "../shared/webRuleMatcher";

export type ResolvedWebTranslationRule = Omit<
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
  ruleResolution?: SitePolicyRuleResolution;
};

export type RuleResolutionResult = {
  url: string;
  matchedRules: readonly WebTranslationRule[];
  primaryContentRule?: WebTranslationRule;
  primaryScopeRule?: WebTranslationRule;
  modifierRules: readonly WebTranslationRule[];
  structureRules: readonly WebTranslationRule[];
  dynamicRules: readonly WebTranslationRule[];
  matchOnlyRules: readonly WebTranslationRule[];
  unsafeRules: readonly WebTranslationRule[];
  finalRule: ResolvedWebTranslationRule;
  confidence: number;
  reasons: readonly string[];
};

export type StyleRuleIntent = {
  styleFixes: readonly string[];
  weakCandidateSelectors: readonly string[];
  excludeHints: readonly string[];
  layoutHints: readonly string[];
};

type WebTranslationAdvanceMergeEntry = NonNullable<WebTranslationRule["advanceMergeConfig"]>[number];

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
  ruleResolution: {
    matchedRuleIds: ["general"],
    modifierRuleIds: [],
    structureRuleIds: [],
    dynamicRuleIds: [],
    matchOnlyRuleIds: ["general"],
    unsafeRuleIds: [],
    confidence: 0,
    reasons: ["default general rule"],
  },
  dynamicModeSource: "global" as DynamicModeSource,
  isHighDynamic: false,
  dynamicMode: "normal" as DynamicMode,
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  buildContainerSelectors: [],
  skipBuildContainerSelectors: [],
  preferredScanRootSelectors: [],
  weakCandidateSelectors: [],
  excludeSelectors: [],
  contentSelectors: [],
  selectorFallbackPolicy: "generic" as SelectorFallbackPolicy,
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
    id: "googleSearch",
    siteKey: "www.google.*",
    matches: ["www.google.*/search*"],
    selectors: [
      "#search a h3",
      "#search [role='heading']",
      "#search [role='heading'] span",
      "#search .VwiC3b",
      "#search .VwiC3b span",
      "#search .IsZvec",
      "#search .IsZvec span",
      "#search .aCOpRe",
      "#search .aCOpRe span",
    ],
    contentSelectors: [
      { selector: "#search a h3, #search [role='heading']", category: "heading" },
      { selector: "#search .VwiC3b, #search .IsZvec, #search .aCOpRe", category: "card-text" },
    ],
    excludeSelectors: [
      "#searchform",
      "#result-stats",
      "#sfooter",
      "[role='navigation']",
      "g-menu",
      ".commercial-unit-desktop-top",
      ".commercial-unit-desktop-rhs",
    ],
    mutationExcludeSelectors: [
      "#searchform",
      "[role='navigation']",
      "g-menu",
    ],
    extraBlockSelectors: [
      "#search [role='heading']",
      "#search .VwiC3b",
      "#search .IsZvec",
      "#search .aCOpRe",
    ],
    injectedCss: [
      `
#search [role='heading'],
#search .VwiC3b,
#search .IsZvec,
#search .aCOpRe {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    attributeNames: [],
    observeUrlChange: true,
    urlChangeDelay: 500,
    detectParagraphLanguage: true,
  },
  {
    id: "googleNews",
    siteKey: "news.google.com",
    matches: ["*://news.google.com/*"],
    selectors: [
      "article h3",
      "article h4",
      "article a[href*='/articles/']",
      ".gPFEn",
      ".JtKRv",
      ".IBr9hb",
      ".ipQwMb",
      ".xrnccd",
    ],
    contentSelectors: [
      { selector: "article h3, article h4, .gPFEn, .JtKRv, .ipQwMb", category: "heading" },
      { selector: "article a[href*='/articles/'], .IBr9hb, .xrnccd", category: "card-text" },
    ],
    excludeSelectors: [
      ".EyERq",
      ".AOl7G.eejsDc",
      "[aria-label='Home']",
      "[aria-label='For you']",
      "[aria-label='Following']",
      "[aria-label='World']",
      "[aria-label='Local']",
      ".gb_Fc",
      ".wBQf7b",
      ".yPI8Rb",
      ".jKHa4e",
      ".u43Gd",
      ".Zgjpyb",
      "[role='button']",
      "[jsname='rymPhb']",
      ".cbz1ld",
      ".VfPpkd-P5QLlc",
      ".XvhY1d",
      "time",
      "button",
      "nav",
      "header",
      "footer",
    ],
    mutationExcludeSelectors: ["[role='button']", "time", "nav", "header"],
    injectedCss: [
      `
.oovtQ,
.MCAGUe,
.To2ZZb.DbQnIe,
h4,
.IBr9hb,
.gPFEn,
.JtKRv,
.ipQwMb {
  height: unset !important;
  max-height: none !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  overflow: visible !important;
}
`,
    ],
    detectParagraphLanguage: true,
    dynamicPreset: "conservative",
    isHighDynamic: true,
  },
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
    id: "stackoverflow",
    siteKey: "stackoverflow.com",
    matches: [
      "*://stackoverflow.com/*",
      "*://*.stackexchange.com/*",
      "*://superuser.com/*",
      "*://askubuntu.com/*",
      "*://serverfault.com/*",
    ],
    selectors: [
      "#question-header h1",
      ".question-hyperlink",
      ".js-post-body",
      ".s-prose.js-post-body",
      ".answercell .s-prose",
      "span.comment-copy",
      ".s-post-summary--content-title",
      ".s-post-summary--content-excerpt",
      ".excerpt",
    ],
    contentSelectors: [
      { selector: "#question-header h1, .question-hyperlink", category: "heading" },
      { selector: ".js-post-body, .s-prose.js-post-body, .answercell .s-prose", category: "content-block" },
      { selector: "span.comment-copy", category: "comment" },
      { selector: ".s-post-summary--content-title, .s-post-summary--content-excerpt, .excerpt", category: "card-text" },
    ],
    excludeSelectors: [
      ".votecell",
      ".js-voting-container",
      ".js-vote-count",
      "header",
      "#footer",
      "#left-sidebar",
      "#question-header + div",
      "#answers-header",
      "div.postcell div.mb0",
      "div[id^=comments-link-]",
      ".new-post-login",
      ".form-submit",
      "a[href='/questions/ask']",
      "a.comment-user",
      "span.comment-date",
      "div.s-prose.js-post-body + div",
      ".bottom-notice",
      "div[data-campaign-name=stk]",
      ".s-post-summary--stats",
      ".s-post-summary--meta",
      "pre",
      "code",
    ],
    mutationExcludeSelectors: ["header", "#left-sidebar", "#footer", ".js-voting-container", ".s-post-summary--stats"],
    extraBlockSelectors: ["span.comment-copy"],
    injectedCss: [
      `
.s-post-summary--content-excerpt,
.question-hyperlink,
.js-post-body,
span.comment-copy {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    detectParagraphLanguage: true,
  },
  {
    id: "substack",
    siteKey: "substack.com",
    matches: ["*://substack.com/*", "*://*.substack.com/*", "*://newsletter.rootsofprogress.org/*"],
    selectors: [
      ".reader2-post-title",
      ".post-title",
      "article h1",
      "article h2",
      "article p",
      "article li",
      ".available-content",
      ".body",
      ".post-content",
      ".comment-body",
      ".caption",
    ],
    contentSelectors: [
      { selector: ".reader2-post-title, .post-title, article h1, article h2", category: "heading" },
      { selector: "article p, article li, .available-content, .body, .post-content", category: "content-block" },
      { selector: ".comment-body", category: "comment" },
      { selector: ".caption", category: "card-text" },
    ],
    excludeSelectors: [
      ".publication-footer",
      ".subscribe-footer",
      ".main-menu",
      ".navbar-title-link",
      "[data-testid='navbar']",
      ".navbar-title",
      ".captioned-button-wrap",
      ".subscription-widget-wrap",
      ".tweet-header",
      ".tweet-link-bottom",
      ".expanded-link",
      ".meta-subheader",
      ".comment-meta",
      ".comment-actions",
      "button",
      "input",
      "textarea",
      "pre",
      "code",
    ],
    extraBlockSelectors: [".reader2-post-title", ".tweet-link-top", ".expanded-link"],
    injectedCss: [
      `
.reader2-clamp-lines,
[class*='clamp-'],
.blurb-text,
.comment-body {
  max-height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  overflow: visible !important;
}
`,
    ],
    detectParagraphLanguage: true,
  },
  {
    id: "github",
    siteKey: "github.com",
    matches: ["*://github.com/*"],
    excludeMatches: [
      "*://github.com/*/*/settings*",
      "*://github.com/settings/*",
      "*://github.com/sponsors/*",
      "*://github.com/readme/*",
      "*://github.com/features/*",
      "*://github.com/codespaces",
      "*://github.com/customer-stories/*",
      "*://github.com/signup",
      "*://github.com/login",
      "*://github.com/marketplace",
      "*://github.com/github-copilot*",
      "*://github.com/collections*",
      "*://github.com/resources/events*",
      "*://github.com/pricing*",
    ],
    selectors: [
      "h1",
      ".markdown-body",
      ".markdown-title",
      "[itemprop=description]",
      "div.repo-description p",
      "li.repo-list-item p",
      ".pinned-item-desc",
      ".search-title",
      ".search-match",
      "[data-testid='issue-pr-title-link']",
      "[data-listview-item-title-container='true'] [data-testid='issue-pr-title-link']",
      "[data-testid='listitem-title-link']",
      ".discussion-title",
      "#repo-content-turbo-frame .markdown-title",
      "#repo-content-turbo-frame p",
      "#repo-content-turbo-frame h4",
      ".heading-element",
      ".Layout-sidebar p",
      "article p",
    ],
    contentSelectors: [
      { selector: "h1, .markdown-title, .heading-element", category: "heading" },
      {
        selector:
          "[data-testid='issue-pr-title-link'], [data-listview-item-title-container='true'] [data-testid='issue-pr-title-link']",
        category: "card-text",
      },
      { selector: "[data-testid='listitem-title-link'], .discussion-title", category: "card-text" },
      { selector: ".markdown-body, #repo-content-turbo-frame p, #repo-content-turbo-frame h4", category: "content-block" },
      { selector: "[itemprop=description], div.repo-description p, li.repo-list-item p, .pinned-item-desc", category: "content-block" },
      { selector: ".search-title, .search-match", category: "card-text" },
      { selector: ".Layout-sidebar p, article p", category: "content-block" },
    ],
    excludeSelectors: [
      "header",
      "nav",
      "footer",
      "button",
      "input",
      "textarea",
      "select",
      "form",
      "a.anchor",
      "[data-testid^='breadcrumbs']",
      "[data-ga-click*=Star]",
      ".author,.assignee",
      ".timeline-comment-header",
      ".review-thread-reply",
      ".blob-code",
      ".js-suggested-changes-blob.diff-view",
      "time",
    ],
    mutationExcludeSelectors: [".react-blob-sticky-header *", ".blob-code", "time"],
    extraInlineSelectors: ["g-emoji", "a.anchor"],
    atomicBlockSelectors: ["[itemprop=description]"],
    stayOriginalSelectors: [".issue-link"],
    stayOriginalTags: ["CODE", "TT", "G-EMOJI", "IMG", "SUP", "SUB"],
    globalStyles: {
      ".TimelineItem-body .Link--primary": "-webkit-line-clamp: unset;",
      "[data-testid='issue-pr-title-link']": "-webkit-line-clamp: unset; max-height: unset; overflow: visible;",
      "[data-listview-item-title-container='true'] [data-testid='issue-pr-title-link']":
        "-webkit-line-clamp: unset; max-height: unset; overflow: visible;",
    },
    observeUrlChange: true,
    urlChangeDelay: 600,
    detectParagraphLanguage: true,
  },
  {
    id: "github-blog",
    siteKey: "github.blog",
    matches: ["*://github.blog/*"],
    selectors: ["article h1", "article h2", "article h3", "article p", "article li", "article blockquote", ".post__content p"],
    contentSelectors: [
      { selector: "article h1, article h2, article h3", category: "heading" },
      { selector: "article p, article li, article blockquote, .post__content p", category: "content-block" },
    ],
    excludeSelectors: ["header", "footer", "nav", "button", "pre", "code", ".site-header", ".site-footer"],
    injectedCss: ["article .imt-translation-block { word-break: normal !important; }"],
    detectParagraphLanguage: true,
  },
  {
    id: "openai-docs",
    siteKey: "openai.com",
    matches: [
      "*://platform.openai.com/docs*",
      "*://platform.openai.com/docs/*",
      "*://developers.openai.com/api/docs*",
      "*://developers.openai.com/api/docs/*",
      "*://developers.openai.com/docs*",
      "*://developers.openai.com/docs/*",
    ],
    selectors: [
      "main h1",
      "main h2",
      "main h3",
      "main p",
      "main li",
      "article h1",
      "article h2",
      "article p",
      "article li",
      "[data-docs-content] p",
      "[data-docs-content] li",
    ],
    contentSelectors: [
      { selector: "main h1, main h2, main h3, article h1, article h2", category: "heading" },
      { selector: "main p, main li, article p, article li, [data-docs-content] p, [data-docs-content] li", category: "content-block" },
    ],
    excludeSelectors: [".pheader", "header", "nav", "aside", "footer", "button", "pre", "code", "[role='tab']"],
    mutationExcludeSelectors: ["header", "nav", "aside", "pre", "code"],
    detectParagraphLanguage: true,
  },
  {
    id: "nature",
    siteKey: "nature.com",
    matches: ["*://www.nature.com/articles/*"],
    selectors: [
      ".c-article-title",
      ".c-article-section__content",
      ".c-article-body p",
      ".c-article-body li",
      ".c-article-body h2",
      ".c-article-body h3",
      ".c-article-teaser-text",
      "figcaption",
    ],
    contentSelectors: [
      { selector: ".c-article-title, .c-article-body h2, .c-article-body h3", category: "heading" },
      { selector: ".c-article-section__content, .c-article-body p, .c-article-body li", category: "content-block" },
      { selector: ".c-article-teaser-text, figcaption", category: "card-text" },
    ],
    excludeSelectors: [
      ".c-header",
      ".c-recommendations-header",
      ".c-recommendations-list-container",
      ".c-article-references__links",
      ".c-article-identifiers",
      ".c-article-author-list",
      ".c-article-metrics-bar__wrapper",
      ".c-article__pill-button",
      "#author-information-content",
      "#article-info-section",
      ".pdf-content",
      "pre",
      "code",
    ],
    injectedCss: [".c-article-body .imt-translation-block { content-visibility: auto; }"],
    detectParagraphLanguage: true,
  },
  {
    id: "apnews",
    siteKey: "apnews.com",
    matches: ["*://apnews.com/*", "*://*.apnews.com/*"],
    selectors: ["article h1", "article h2", "article p", "article li", "[data-key='article'] p", "[data-key='article'] li"],
    contentSelectors: [
      { selector: "article h1, article h2", category: "heading" },
      { selector: "article p, article li, [data-key='article'] p, [data-key='article'] li", category: "content-block" },
    ],
    excludeSelectors: ["nav", "header", "footer", "aside", "button", "form", "input", "textarea", "pre", "code"],
    detectParagraphLanguage: true,
  },
  {
    id: "foxnews",
    siteKey: "foxnews.com",
    matches: ["*://www.foxnews.com/*", "*://foxnews.com/*"],
    selectors: ["article h1", "article h2", ".article-body p", ".article-content p", ".article-body li", ".article-content li"],
    contentSelectors: [
      { selector: "article h1, article h2", category: "heading" },
      { selector: ".article-body p, .article-content p, .article-body li, .article-content li", category: "content-block" },
    ],
    excludeSelectors: [
      ".site-footer",
      "nav",
      "header",
      "footer",
      "aside",
      ".components-MessageDetails-index__message-details-wrapper",
      "div[class^=SlideDown__container]",
      ".components-MessageActions-index__messageActionsWrapper",
      "span[data-openweb-allow-amp]",
      "div.spcv_typing-users",
      "button",
      "pre",
      "code",
    ],
    detectParagraphLanguage: true,
  },
  {
    id: "producthunt",
    siteKey: "producthunt.com",
    matches: ["*://www.producthunt.com/*", "*://producthunt.com/*"],
    selectors: [
      "h1",
      "h2",
      "h5 + p",
      "[data-test='post-name']",
      "[data-test='post-tagline']",
      "[class*='styles_tagline__']",
      "[class*='styles_description__']",
      "main a[href^='/posts/']",
      "main a[href^='/products/']",
    ],
    contentSelectors: [
      { selector: "h1, h2, [data-test='post-name']", category: "heading" },
      { selector: "h5 + p, [data-test='post-tagline'], [class*='styles_tagline__'], [class*='styles_description__']", category: "card-text" },
      { selector: "main a[href^='/posts/'], main a[href^='/products/']", category: "card-text" },
    ],
    excludeSelectors: [
      ".styles_extraInfo__Xs_5Y",
      "[data-test=\"show-more-shoutouts-button\"]",
      ".styles_buttons__kKy_S",
      ".styles_count___6_8F",
      "nav",
      "header",
      "footer",
      "button",
      "input",
      "textarea",
    ],
    injectedCss: [
      `
h5 + p,
.noOfLines-1,
.noOfLines-2,
.noOfLines-3,
[data-test='post-name'] {
  height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
}
`,
    ],
    detectParagraphLanguage: true,
    dynamicPreset: "twitter-fast",
    isHighDynamic: true,
  },
  {
    id: "amazon",
    siteKey: "amazon.com",
    matches: ["*://www.amazon.*/*", "*://amazon.*/*"],
    selectors: [
      "#productTitle",
      "#feature-bullets li",
      "#productDescription p",
      "#bookDescription_feature_div",
      "[data-hook='review-title']",
      "[data-hook='review-body']",
      ".a-size-base-plus.a-color-base.a-text-normal",
      "h2.a-size-mini",
    ],
    contentSelectors: [
      { selector: "#productTitle, h2.a-size-mini", category: "heading" },
      { selector: "#feature-bullets li, #productDescription p, #bookDescription_feature_div", category: "content-block" },
      { selector: "[data-hook='review-title'], [data-hook='review-body'], .a-size-base-plus.a-color-base.a-text-normal", category: "card-text" },
    ],
    excludeSelectors: [
      "#navFooter",
      ".s-price-instructions-style",
      "[class*='-star ']",
      "[data-hook='acr-average-stars-rating-text']",
      ".a-color-price",
      ".a-price",
      "[data-testid='price-section']",
      "[data-component='dui-badge']",
      "#glow-ingress-block",
      "#nav-link-accountList",
      "#nav-orders",
      "#nav-cart",
      "button",
      "input",
      "textarea",
      "select",
    ],
    injectedCss: [
      `
[class*='clamp'],
[data-rows],
[data-a-expander-name='review_text_read_more'],
.compact.primaryText.primaryTextOnly,
.format,
.dcl-truncate,
span[data-a-max-rows] {
  max-height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
}
`,
    ],
    extraBlockSelectors: [".a-size-small.a-link-normal.page-banner-link.a-nowrap"],
    bodyRule: { enable: false },
    detectParagraphLanguage: true,
  },
  {
    id: "shopee",
    siteKey: "shopee.*",
    matches: ["*://shopee.*/*", "*://*.shopee.*/*"],
    selectors: [
      "h1",
      "[data-sqe='name']",
      ".WBVL_7",
      ".ellipsis-content",
      "[class*='product-title']",
      "[class*='item-card'] [class*='name']",
      "[class*='ProductName']",
    ],
    contentSelectors: [
      { selector: "h1, [class*='product-title'], [class*='ProductName']", category: "heading" },
      { selector: "[data-sqe='name'], .WBVL_7, .ellipsis-content, [class*='item-card'] [class*='name']", category: "card-text" },
    ],
    excludeSelectors: [
      "button",
      "[role='button']",
      "input",
      "textarea",
      "select",
      "nav",
      "header",
      "footer",
      ".shopee-rating-stars",
      "[class*='price']",
      "[class*='Price']",
      "[class*='rating']",
      "[class*='sold']",
    ],
    injectedCss: [
      `
.WBVL_7,
.ellipsis-content,
[class*='product-title'],
[class*='ProductName'] {
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
    id: "aliexpress",
    siteKey: "aliexpress.*",
    matches: ["*://aliexpress.*/*", "*://*.aliexpress.*/*"],
    selectors: [
      "h1",
      ".product-title-text",
      "[class*='product-title']",
      "[class*='ProductTitle']",
      "[class*='titleText']",
      "[class*='TitleText']",
      "[class*='multi--titleText']",
      "[class*='manhattan--titleText']",
    ],
    contentSelectors: [
      { selector: "h1, .product-title-text, [class*='product-title'], [class*='ProductTitle']", category: "heading" },
      {
        selector:
          "[class*='titleText'], [class*='TitleText'], [class*='multi--titleText'], [class*='manhattan--titleText']",
        category: "card-text",
      },
    ],
    excludeSelectors: [
      "button",
      "[role='button']",
      "input",
      "textarea",
      "select",
      "nav",
      "header",
      "footer",
      ".product-price",
      "[class*='price']",
      "[class*='Price']",
      "[class*='rating']",
      "[class*='sold']",
      "[class*='shipping']",
    ],
    injectedCss: [
      `
.product-title-text,
[class*='product-title'],
[class*='ProductTitle'],
[class*='titleText'],
[class*='TitleText'] {
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
    id: "tiktok",
    siteKey: "tiktok.com",
    matches: ["*://www.tiktok.com/*/video/*", "*://www.tiktok.com/*", "*://tiktok.com/*/video/*", "*://tiktok.com/*"],
    selectors: [
      "[data-e2e='browse-video-desc']",
      "[data-e2e='video-desc']",
      "[data-e2e='search-card-video-caption']",
      "[data-e2e='comment-level-1']",
      "[data-e2e='comment-level-2']",
      "[class*='DivVideoInfoContainer'] [class*='SpanText']",
    ],
    contentSelectors: [
      { selector: "[data-e2e='browse-video-desc'], [data-e2e='video-desc'], [data-e2e='search-card-video-caption']", category: "card-text" },
      { selector: "[data-e2e='comment-level-1'], [data-e2e='comment-level-2']", category: "comment" },
    ],
    excludeSelectors: [
      "[class*='DivInfoPosition']",
      "[data-e2e*='-count']",
      "[data-e2e='nav-foryou']",
      "[data-e2e*='view-more']",
      "[data-e2e*='comment-reply']",
      "[data-e2e*='comment-username']",
      "[class*='DivCommentSubContentSplitWrapper']",
      "[class*='DivViewRepliesContainer']",
      "button",
      '[role="button"]',
      "nav",
      "header",
      "footer",
    ],
    mutationExcludeSelectors: ["[class*='DivInfoPosition'] *", "[data-e2e*='-count']", "button", "nav"],
    dynamicPreset: "twitter-fast",
    isHighDynamic: true,
    allowTooltip: false,
    detectParagraphLanguage: true,
  },
  {
    id: "promptot",
    siteKey: "promptot.com",
    matches: ["*://promptot.com/*", "*://*.promptot.com/*"],
    selectors: [
      "section h1",
      "section h2",
      "section h3",
      "section p",
      "section li",
      "section blockquote",
      "section figcaption",
      "section [class*='card']",
      "section [class*='feature']",
      "section [class*='pricing']",
    ],
    contentSelectors: [
      { selector: "section h1, section h2, section h3", category: "heading" },
      { selector: "section p, section li", category: "content-block" },
      { selector: "section blockquote, section figcaption", category: "content-block" },
      { selector: "section [class*='card'], section [class*='feature']", category: "card-text" },
      { selector: "section [class*='pricing']", category: "card-text" },
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
section li,
section [class*='card'],
section [class*='feature'],
section [class*='pricing'] {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
  white-space: normal !important;
}
`,
    ],
    extraBlockSelectors: [
      "section [class*='card']",
      "section [class*='feature']",
      "section [class*='pricing']",
    ],
    bodyRule: { enable: false },
    detectParagraphLanguage: true,
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
    id: "yourporn",
    siteKey: "youporn.com",
    matches: ["*://youporn.com/*", "*://*.youporn.com/*"],
    selectors: [
      "h1",
      ".video-title",
      ".videoTitle",
      ".title",
      ".video-box-title",
      ".video-box-title a",
      ".thumbTitle",
      ".thumbTitle a",
      ".videoListItem .title",
    ],
    contentSelectors: [
      { selector: "h1, .video-title, .videoTitle", category: "heading" },
      {
        selector: ".title, .video-box-title, .video-box-title a, .thumbTitle, .thumbTitle a, .videoListItem .title",
        category: "card-text",
      },
    ],
    excludeSelectors: [
      "button",
      "[role='button']",
      "input",
      "textarea",
      "select",
      "nav",
      "header",
      "footer",
      ".duration",
      ".views",
      ".rating",
      ".username",
    ],
    injectedCss: [
      `
.video-title,
.videoTitle,
.title,
.video-box-title,
.thumbTitle {
  height: unset !important;
  max-height: unset !important;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  overflow: visible !important;
}
`,
    ],
    extraBlockSelectors: [".video-box-title", ".thumbTitle"],
    detectParagraphLanguage: true,
    paragraphMinTextCount: 1,
    paragraphMinWordCount: 1,
    blockMinTextCount: 0,
    blockMinWordCount: 0,
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
  return resolveWebTranslationRuleResolution(url, doc, rules).finalRule;
}

export function resolveWebTranslationRuleResolution(
  url: string,
  doc: Document | undefined = globalThis.document,
  rules: readonly WebTranslationRule[] = BUILTIN_WEB_TRANSLATION_RULES,
): RuleResolutionResult {
  const rankedMatches = matchWebTranslationRulesRanked(url, doc, rules);
  const primary = primaryRuleFromMatches(rankedMatches);
  if (!primary) {
    const finalRule = withRuleMetadata(mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, { id: "general" }), {
      ruleId: "general",
      ruleSource: "core",
      mergedRuleIds: ["general"],
    });
    return createRuleResolutionResult(url, [], finalRule, ["no matching site rule"]);
  }

  const compatibleRules = compatibleRulesForPrimary(primary.rule, rankedMatches, normalizeHostnameFromUrl(url));
  const mergeableRules = orderRuleStack(compatibleRules).filter((match) =>
    analyzeWebTranslationRuleCapability(match.rule).capability !== "unsafe"
  );
  const base = primary.rule.id === "twitter"
    ? mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, coreWebTranslationRule("x"))
    : GENERAL_WEB_TRANSLATION_RULE;
  const merged = mergeRuleStack(mergeWebTranslationRules(base, { id: "general" }), mergeableRules);
  const finalRule = withRuleMetadata(merged, {
    ruleId: primary.rule.id,
    ruleSource: primary.rule.ruleSource ?? "core",
    mergedRuleIds: primary.rule.id === "twitter"
      ? ["x", "twitter", ...mergeableRules.filter((match) => match.rule.id !== "twitter").map((match) => match.rule.id)]
      : mergeableRules.map((match) => match.rule.id),
  });

  return createRuleResolutionResult(
    url,
    compatibleRules,
    finalRule,
    [
      `primary:${primary.rule.id}`,
      mergeableRules.length > 1 ? `stack:${mergeableRules.map((match) => match.rule.id).join(",")}` : "single-rule",
    ],
  );
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
  const effectiveCapability = {
    ...capability,
    capability: capabilityFromRuleResolution(rule.ruleResolution) ?? capability.capability,
  };
  const styleIntent = inferStyleRuleIntent(rule);
  const excludeSelectors = unique([...rule.excludeSelectors, ...styleIntent.excludeHints]);
  const fallbackScanRootSelectors = fallbackScanRootSelectorsForRule(rule, effectiveCapability);
  const fallbackContentSelectors = fallbackContentSelectorsForRule(rule, effectiveCapability);
  const base = {
    ...DEFAULT_SITE_POLICY,
    ...preset,
    hostname: normalizedHostname,
    siteKey: rule.siteKey || normalizedHostname,
    ruleId: rule.ruleId,
    ruleSource: rule.ruleSource,
    ruleCapability: effectiveCapability.capability,
    fallbackProfile: effectiveCapability.fallbackProfile,
    mergedRuleIds: rule.mergedRuleIds,
    ruleResolution: rule.ruleResolution ?? defaultRuleResolutionForRule(rule, effectiveCapability),
    isHighDynamic: Boolean(rule.isHighDynamic),
    attributeNames: rule.attributeNames,
    ...(rule.mainFrameSelector ? { mainFrameSelector: rule.mainFrameSelector } : {}),
    ...(rule.mainFrameMinTextCount !== undefined ? { mainFrameMinTextCount: rule.mainFrameMinTextCount } : {}),
    ...(rule.mainFrameMinWordCount !== undefined ? { mainFrameMinWordCount: rule.mainFrameMinWordCount } : {}),
    ...(rule.containerMinTextCount !== undefined ? { containerMinTextCount: rule.containerMinTextCount } : {}),
    ...(rule.bodyRule ? { bodyRule: rule.bodyRule } : {}),
    buildContainerSelectors: rule.buildContainerSelectors,
    skipBuildContainerSelectors: rule.skipBuildContainerSelectors,
    preferredScanRootSelectors: unique([...rule.selectors, ...fallbackScanRootSelectors]),
    weakCandidateSelectors: styleIntent.weakCandidateSelectors,
    excludeSelectors,
    contentSelectors: unique([...rule.contentSelectors, ...fallbackContentSelectors], contentSelectorKey),
    selectorFallbackPolicy: rule.selectorFallbackPolicy ?? defaultSelectorFallbackPolicy(effectiveCapability),
    allowTooltip: rule.allowTooltip ?? DEFAULT_SITE_POLICY.allowTooltip,
    excludedDynamicSelectors: unique([...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS, ...excludeSelectors, ...rule.mutationExcludeSelectors]),
    injectedCss: unique([...rule.injectedCss, ...globalStylesToCss(rule.globalStyles)]),
    globalAttributes: rule.globalAttributes,
    translationClasses: rule.translationClasses,
    ...(rule.wrapperPrefix !== undefined ? { wrapperPrefix: rule.wrapperPrefix } : {}),
    ...(rule.wrapperSuffix !== undefined ? { wrapperSuffix: rule.wrapperSuffix } : {}),
    ...(rule.lineBreakMaxTextCount !== undefined ? { lineBreakMaxTextCount: rule.lineBreakMaxTextCount } : {}),
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
  if (capability.fallbackProfile === "generic") return [];
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

function defaultSelectorFallbackPolicy(
  capability: { capability: WebTranslationRuleCapability; fallbackProfile: WebTranslationFallbackProfile },
): SelectorFallbackPolicy {
  if (capability.capability === "content-ready") return "conservative";
  if (capability.capability === "scope-ready") return "generic";
  if (
    capability.capability === "modifier-only" ||
    capability.capability === "structure-only" ||
    capability.capability === "dynamic-only"
  ) return "generic";
  return capability.fallbackProfile === "generic" ? "generic" : "conservative";
}

export function resolveWebTranslationPolicy(
  url: string,
  preferredDynamicMode: DynamicMode = "normal",
  options: { siteDynamicMode?: DynamicMode; document?: Document; rules?: readonly WebTranslationRule[] } = {},
): SitePolicy {
  const parsed = parseUrl(url);
  const hostname = parsed?.hostname ?? normalizeHostname(url);
  const effectiveUrl = urlFromHostnameFallback(url, hostname);
  const resolution = options.rules?.length
    ? resolveWebTranslationRuleResolutionWithImportedDeltas(effectiveUrl, options.document, options.rules, hostname)
    : resolveWebTranslationRuleResolution(effectiveUrl, options.document, BUILTIN_WEB_TRANSLATION_RULES);
  return compileRulePolicy(
    resolution.finalRule,
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
  return resolveWebTranslationRuleResolutionWithImportedDeltas(url, doc, importedRules, hostname).finalRule;
}

function resolveWebTranslationRuleResolutionWithImportedDeltas(
  url: string,
  doc: Document | undefined,
  importedRules: readonly WebTranslationRule[],
  hostname: string,
): RuleResolutionResult {
  const coreMatch = matchWebTranslationRule(url, doc, CORE_WEB_TRANSLATION_RULES);
  const importedMatches = filterMatchingWebTranslationRules(url, doc, importedRules);

  if (coreMatch) {
    const coreRule = resolveWebTranslationRule(url, doc, CORE_WEB_TRANSLATION_RULES);
    const compatibleImportedRules = importedMatches.filter((rule) =>
      rule.ruleSource !== "imported-experimental" && isSameRuleFamily(coreMatch, rule, hostname)
    );
    const mergeableImportedMatches = orderRuleStack(compatibleImportedRules.map((rule) => ({
      rule,
      score: 0,
      reasons: ["imported-compatible"],
    }))).filter((match) => analyzeWebTranslationRuleCapability(match.rule).capability !== "unsafe");
    const mergeableImportedRules = mergeableImportedMatches.map((match) => match.rule);
    if (compatibleImportedRules.length === 0) {
      return resolveWebTranslationRuleResolution(url, doc, CORE_WEB_TRANSLATION_RULES);
    }

    const merged = mergeRuleStack(coreRule, mergeableImportedMatches);

    const mergedWithCoreSiteKey = coreRule.siteKey ? { ...merged, siteKey: coreRule.siteKey } : merged;
    const finalRule = withRuleMetadata(mergedWithCoreSiteKey, {
      ruleId: coreMatch.id,
      ruleSource: "core+imported",
      mergedRuleIds: [coreMatch.id, ...mergeableImportedRules.map((rule) => rule.id)],
    });
    return createRuleResolutionResult(
      url,
      [{ rule: coreMatch, score: 0, reasons: ["core"] }, ...compatibleImportedRules.map((rule) => ({
        rule,
        score: 0,
        reasons: ["imported-compatible"],
      }))],
      finalRule,
      compatibleImportedRules.length
        ? [`primary:${coreMatch.id}`, `merged-imported:${compatibleImportedRules.map((rule) => rule.id).join(",")}`]
        : [`primary:${coreMatch.id}`],
    );
  }

  const importedRankedMatches = matchWebTranslationRulesRanked(url, doc, importedRules);
  const importedPrimary = primaryRuleFromMatches(importedRankedMatches)?.rule;
  if (!importedPrimary) return resolveWebTranslationRuleResolution(url, doc, BUILTIN_WEB_TRANSLATION_RULES);

  const sameFamilyRules = importedMatches.filter((rule) => isSameRuleFamily(importedPrimary, rule, hostname));
  const sameFamilyMatches = orderRuleStack(sameFamilyRules.map((rule) => ({
    rule,
    score: 0,
    reasons: ["imported-same-family"],
  })));
  const mergeableSameFamilyMatches = sameFamilyMatches.filter((match) =>
    analyzeWebTranslationRuleCapability(match.rule).capability !== "unsafe"
  );
  const mergeableSameFamilyRules = mergeableSameFamilyMatches.map((match) => match.rule);
  const merged = mergeRuleStack(
    mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, { id: "general" }),
    mergeableSameFamilyMatches,
  );

  const finalRule = withRuleMetadata(merged, {
    ruleId: importedPrimary.id,
    ruleSource: importedPrimary.ruleSource ?? "imported-experimental",
    mergedRuleIds: mergeableSameFamilyRules.map((rule) => rule.id),
  });
  return createRuleResolutionResult(
    url,
    sameFamilyRules.map((rule) => ({ rule, score: 0, reasons: ["imported-same-family"] })),
    finalRule,
    sameFamilyRules.length > 1
      ? [`primary:${importedPrimary.id}`, `merged:${sameFamilyRules.map((rule) => rule.id).join(",")}`]
      : [`primary:${importedPrimary.id}`],
  );
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

function primaryRuleFromMatches(matches: readonly WebTranslationRuleMatch[]): WebTranslationRuleMatch | undefined {
  const usable = matches.filter((match) => analyzeWebTranslationRuleCapability(match.rule).capability !== "unsafe");
  return firstRuleWithCapability(usable, "content-ready") ??
    firstRuleWithCapability(usable, "scope-ready") ??
    firstRuleWithCapability(usable, "structure-only") ??
    firstRuleWithCapability(usable, "modifier-only") ??
    firstRuleWithCapability(usable, "dynamic-only") ??
    firstRuleWithCapability(usable, "match-only") ??
    usable[0] ??
    matches[0];
}

function firstRuleWithCapability(
  matches: readonly WebTranslationRuleMatch[],
  capability: WebTranslationRuleCapability,
): WebTranslationRuleMatch | undefined {
  return matches.find((match) => analyzeWebTranslationRuleCapability(match.rule).capability === capability);
}

function mergeRuleStack(
  base: ResolvedWebTranslationRule,
  matches: readonly WebTranslationRuleMatch[],
): ResolvedWebTranslationRule {
  return orderRuleStack(matches).reduce<ResolvedWebTranslationRule>((current, match) => {
    const capability = analyzeWebTranslationRuleCapability(match.rule).capability;
    if (capability === "unsafe") return current;
    return mergeWebTranslationRules(current, ruleForStackCapability(match.rule, capability));
  }, base);
}

function orderRuleStack(matches: readonly WebTranslationRuleMatch[]): readonly WebTranslationRuleMatch[] {
  return [...matches].sort((left, right) => {
    const capabilityDelta = stackCapabilityOrder(left.rule) - stackCapabilityOrder(right.rule);
    if (capabilityDelta !== 0) return capabilityDelta;
    return right.score - left.score;
  });
}

function stackCapabilityOrder(rule: WebTranslationRule): number {
  switch (analyzeWebTranslationRuleCapability(rule).capability) {
    case "content-ready":
      return 0;
    case "scope-ready":
      return 1;
    case "structure-only":
      return 2;
    case "modifier-only":
      return 3;
    case "dynamic-only":
      return 4;
    case "match-only":
      return 5;
    case "unsafe":
      return 99;
  }
}

function ruleForStackCapability(
  rule: WebTranslationRule,
  capability: WebTranslationRuleCapability,
): WebTranslationRule {
  switch (capability) {
    case "content-ready":
      return rule;
    case "scope-ready":
      return scopeRuleDelta(rule);
    case "structure-only":
      return structureRuleDelta(rule);
    case "modifier-only":
      return modifierRuleDelta(rule);
    case "dynamic-only":
      return dynamicRuleDelta(rule);
    case "match-only":
      return matchOnlyRuleDelta(rule);
    case "unsafe":
      return { id: rule.id, ruleCapability: "unsafe" };
  }
}

function baseStackDelta(rule: WebTranslationRule): WebTranslationRule {
  return {
    id: rule.id,
    ...(rule.siteKey ? { siteKey: rule.siteKey } : {}),
    ...(rule.ruleSource ? { ruleSource: rule.ruleSource } : {}),
    ...(rule.ruleCapability ? { ruleCapability: rule.ruleCapability } : {}),
    ...(rule.fallbackProfile ? { fallbackProfile: rule.fallbackProfile } : {}),
    ...(rule.selectorFallbackPolicy ? { selectorFallbackPolicy: rule.selectorFallbackPolicy } : {}),
  };
}

function scopeRuleDelta(rule: WebTranslationRule): WebTranslationRule {
  return {
    ...baseStackDelta(rule),
    ...(rule.mainFrameSelector ? { mainFrameSelector: rule.mainFrameSelector } : {}),
    ...(rule.mainFrameMinTextCount !== undefined ? { mainFrameMinTextCount: rule.mainFrameMinTextCount } : {}),
    ...(rule.mainFrameMinWordCount !== undefined ? { mainFrameMinWordCount: rule.mainFrameMinWordCount } : {}),
    ...(rule.bodyRule ? { bodyRule: rule.bodyRule } : {}),
    ...(rule.containerMinTextCount !== undefined ? { containerMinTextCount: rule.containerMinTextCount } : {}),
    ...stackArrayField("excludeSelectors", rule.excludeSelectors),
    ...stackArrayField("additionalExcludeSelectors", rule.additionalExcludeSelectors),
    ...stackArrayField("excludeTags", rule.excludeTags),
    ...stackArrayField("additionalExcludeTags", rule.additionalExcludeTags),
  };
}

function structureRuleDelta(rule: WebTranslationRule): WebTranslationRule {
  return {
    ...baseStackDelta(rule),
    ...stackArrayField("extraBlockSelectors", rule.extraBlockSelectors),
    ...stackArrayField("extraInlineSelectors", rule.extraInlineSelectors),
    ...stackArrayField("atomicBlockSelectors", rule.atomicBlockSelectors),
    ...stackArrayField("inlineTags", rule.inlineTags),
    ...stackArrayField("preWhitespaceDetectedTags", rule.preWhitespaceDetectedTags),
    ...stackArrayField("buildContainerSelectors", rule.buildContainerSelectors),
    ...stackArrayField("skipBuildContainerSelectors", rule.skipBuildContainerSelectors),
    ...stackArrayField("stayOriginalSelectors", rule.stayOriginalSelectors),
    ...stackArrayField("stayOriginalTags", rule.stayOriginalTags),
    ...stackArrayField("excludeSelectors", rule.excludeSelectors),
    ...stackArrayField("additionalExcludeSelectors", rule.additionalExcludeSelectors),
    ...stackArrayField("excludeTags", rule.excludeTags),
    ...stackArrayField("additionalExcludeTags", rule.additionalExcludeTags),
    ...(rule.paragraphMinTextCount !== undefined ? { paragraphMinTextCount: rule.paragraphMinTextCount } : {}),
    ...(rule.paragraphMinWordCount !== undefined ? { paragraphMinWordCount: rule.paragraphMinWordCount } : {}),
    ...(rule.blockMinTextCount !== undefined ? { blockMinTextCount: rule.blockMinTextCount } : {}),
    ...(rule.blockMinWordCount !== undefined ? { blockMinWordCount: rule.blockMinWordCount } : {}),
    ...(rule.containerMinTextCount !== undefined ? { containerMinTextCount: rule.containerMinTextCount } : {}),
    ...(rule.lineBreakMaxTextCount !== undefined ? { lineBreakMaxTextCount: rule.lineBreakMaxTextCount } : {}),
  };
}

function modifierRuleDelta(rule: WebTranslationRule): WebTranslationRule {
  return {
    ...baseStackDelta(rule),
    ...stackArrayField("excludeSelectors", rule.excludeSelectors),
    ...stackArrayField("additionalExcludeSelectors", rule.additionalExcludeSelectors),
    ...stackArrayField("excludeTags", rule.excludeTags),
    ...stackArrayField("additionalExcludeTags", rule.additionalExcludeTags),
    ...stackArrayField("mutationExcludeSelectors", rule.mutationExcludeSelectors),
    ...stackArrayField("injectedCss", rule.injectedCss),
    ...stackArrayField("additionalInjectedCss", rule.additionalInjectedCss),
    ...stackRecordField("globalStyles", rule.globalStyles),
    ...stackRecordField("globalAttributes", rule.globalAttributes),
    ...stackArrayField("translationClasses", rule.translationClasses),
    ...(rule.wrapperPrefix !== undefined ? { wrapperPrefix: rule.wrapperPrefix } : {}),
    ...(rule.wrapperSuffix !== undefined ? { wrapperSuffix: rule.wrapperSuffix } : {}),
  };
}

function dynamicRuleDelta(rule: WebTranslationRule): WebTranslationRule {
  return {
    ...baseStackDelta(rule),
    ...(rule.dynamicPreset ? { dynamicPreset: rule.dynamicPreset } : {}),
    ...(rule.isHighDynamic !== undefined ? { isHighDynamic: rule.isHighDynamic } : {}),
    ...(rule.allowTooltip !== undefined ? { allowTooltip: rule.allowTooltip } : {}),
    ...(rule.observeUrlChange !== undefined ? { observeUrlChange: rule.observeUrlChange } : {}),
    ...(rule.urlChangeDelay !== undefined ? { urlChangeDelay: rule.urlChangeDelay } : {}),
    ...(rule.debounceMs !== undefined ? { debounceMs: rule.debounceMs } : {}),
    ...(rule.lazyRootMargin !== undefined ? { lazyRootMargin: rule.lazyRootMargin } : {}),
    ...(rule.lazyThreshold !== undefined ? { lazyThreshold: rule.lazyThreshold } : {}),
    ...(rule.eagerLazyRootMargin !== undefined ? { eagerLazyRootMargin: rule.eagerLazyRootMargin } : {}),
    ...(rule.maxEagerLazyRoots !== undefined ? { maxEagerLazyRoots: rule.maxEagerLazyRoots } : {}),
    ...(rule.viewportSupplement !== undefined ? { viewportSupplement: rule.viewportSupplement } : {}),
    ...(rule.viewportSupplementDebounceMs !== undefined ? { viewportSupplementDebounceMs: rule.viewportSupplementDebounceMs } : {}),
    ...(rule.viewportSupplementRootMargin !== undefined ? { viewportSupplementRootMargin: rule.viewportSupplementRootMargin } : {}),
    ...(rule.viewportSupplementMaxRoots !== undefined ? { viewportSupplementMaxRoots: rule.viewportSupplementMaxRoots } : {}),
    ...(rule.maxQueueSize !== undefined ? { maxQueueSize: rule.maxQueueSize } : {}),
    ...(rule.maxRootsPerFlush !== undefined ? { maxRootsPerFlush: rule.maxRootsPerFlush } : {}),
    ...(rule.maxObservedRoots !== undefined ? { maxObservedRoots: rule.maxObservedRoots } : {}),
    ...(rule.maxMutationNodesPerWindow !== undefined ? { maxMutationNodesPerWindow: rule.maxMutationNodesPerWindow } : {}),
    ...(rule.mutationWindowMs !== undefined ? { mutationWindowMs: rule.mutationWindowMs } : {}),
    ...stackArrayField("mutationExcludeSelectors", rule.mutationExcludeSelectors),
    ...optionalRuleValue("advanceMergeConfig", stackDynamicAdvanceMergeConfig(rule)),
  };
}

function matchOnlyRuleDelta(rule: WebTranslationRule): WebTranslationRule {
  return baseStackDelta(rule);
}

function stackArrayField<Key extends keyof WebTranslationRule, T>(
  key: Key,
  value: RuleArrayValue<T> | undefined,
): Partial<WebTranslationRule> {
  return optionalRuleValue(key, stackAddOnly(value) as WebTranslationRule[Key] | undefined);
}

function stackRecordField<Key extends keyof WebTranslationRule, T>(
  key: Key,
  value: RuleRecordValue<T> | undefined,
): Partial<WebTranslationRule> {
  return optionalRuleValue(key, stackRecordAddOnly(value) as WebTranslationRule[Key] | undefined);
}

function stackDynamicAdvanceMergeConfig(rule: WebTranslationRule): WebTranslationRule["advanceMergeConfig"] | undefined {
  if (!rule.advanceMergeConfig?.length) return undefined;
  const entries = rule.advanceMergeConfig.flatMap((entry) => {
    const advanceConfig = dynamicAdvanceConfig(entry.advanceConfig);
    return Object.keys(advanceConfig).length ? [{ condition: entry.condition, advanceConfig }] : [];
  });
  return entries.length ? entries : undefined;
}

function dynamicAdvanceConfig(rule: WebTranslationAdvanceMergeEntry["advanceConfig"]): WebTranslationAdvanceMergeEntry["advanceConfig"] {
  return {
    ...(rule.dynamicPreset ? { dynamicPreset: rule.dynamicPreset } : {}),
    ...(rule.isHighDynamic !== undefined ? { isHighDynamic: rule.isHighDynamic } : {}),
    ...(rule.allowTooltip !== undefined ? { allowTooltip: rule.allowTooltip } : {}),
    ...(rule.observeUrlChange !== undefined ? { observeUrlChange: rule.observeUrlChange } : {}),
    ...(rule.urlChangeDelay !== undefined ? { urlChangeDelay: rule.urlChangeDelay } : {}),
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
    ...stackArrayField("mutationExcludeSelectors", rule.mutationExcludeSelectors),
  };
}

function compatibleRulesForPrimary(
  primary: WebTranslationRule,
  matches: readonly WebTranslationRuleMatch[],
  hostname: string,
): readonly WebTranslationRuleMatch[] {
  const compatible = matches.filter((match) => isSameRuleFamily(primary, match.rule, hostname));
  return compatible.length ? compatible : matches.filter((match) => match.rule.id === primary.id);
}

function createRuleResolutionResult(
  url: string,
  matches: readonly WebTranslationRuleMatch[],
  finalRule: ResolvedWebTranslationRule,
  reasons: readonly string[],
): RuleResolutionResult {
  const matchedRules = matches.map((match) => match.rule);
  const primaryContentRule = firstRuleByCapability(matchedRules, "content-ready");
  const primaryScopeRule = firstRuleByCapability(matchedRules, "scope-ready");
  const modifierRules = rulesByCapability(matchedRules, "modifier-only");
  const structureRules = rulesByCapability(matchedRules, "structure-only");
  const dynamicRules = rulesByCapability(matchedRules, "dynamic-only");
  const matchOnlyRules = rulesByCapability(matchedRules, "match-only");
  const unsafeRules = rulesByCapability(matchedRules, "unsafe");
  const confidence = confidenceForResolution({
    primaryContentRule,
    primaryScopeRule,
    modifierRules,
    structureRules,
    dynamicRules,
    matchOnlyRules,
    matchedRules,
  });
  const enrichedReasons = unique([
    ...reasons,
    matchedRules.length ? `matched:${matchedRules.length}` : "matched:0",
    primaryContentRule ? `content:${primaryContentRule.id}` : undefined,
    primaryScopeRule ? `scope:${primaryScopeRule.id}` : undefined,
    modifierRules.length ? `modifier:${modifierRules.map((rule) => rule.id).join(",")}` : undefined,
    structureRules.length ? `structure:${structureRules.map((rule) => rule.id).join(",")}` : undefined,
    dynamicRules.length ? `dynamic:${dynamicRules.map((rule) => rule.id).join(",")}` : undefined,
  ].filter((reason): reason is string => Boolean(reason)));
  const ruleResolution = toSitePolicyRuleResolution({
    matchedRules,
    primaryContentRule,
    primaryScopeRule,
    modifierRules,
    structureRules,
    dynamicRules,
    matchOnlyRules,
    unsafeRules,
    confidence,
    reasons: enrichedReasons,
  });

  return {
    url,
    matchedRules,
    ...(primaryContentRule ? { primaryContentRule } : {}),
    ...(primaryScopeRule ? { primaryScopeRule } : {}),
    modifierRules,
    structureRules,
    dynamicRules,
    matchOnlyRules,
    unsafeRules,
    finalRule: { ...finalRule, ruleResolution },
    confidence,
    reasons: enrichedReasons,
  };
}

function firstRuleByCapability(
  rules: readonly WebTranslationRule[],
  capability: WebTranslationRuleCapability,
): WebTranslationRule | undefined {
  return rules.find((rule) => analyzeWebTranslationRuleCapability(rule).capability === capability);
}

function rulesByCapability(
  rules: readonly WebTranslationRule[],
  capability: WebTranslationRuleCapability,
): readonly WebTranslationRule[] {
  return rules.filter((rule) => analyzeWebTranslationRuleCapability(rule).capability === capability);
}

function confidenceForResolution(input: {
  primaryContentRule?: WebTranslationRule | undefined;
  primaryScopeRule?: WebTranslationRule | undefined;
  modifierRules: readonly WebTranslationRule[];
  structureRules: readonly WebTranslationRule[];
  dynamicRules: readonly WebTranslationRule[];
  matchOnlyRules: readonly WebTranslationRule[];
  matchedRules: readonly WebTranslationRule[];
}): number {
  const base = input.primaryContentRule
    ? 90
    : input.primaryScopeRule
      ? 75
      : input.structureRules.length
        ? 62
        : input.modifierRules.length
          ? 58
          : input.dynamicRules.length
            ? 46
            : input.matchOnlyRules.length
              ? 32
              : 0;
  return Math.min(100, base + Math.min(10, Math.max(0, input.matchedRules.length - 1) * 3));
}

function toSitePolicyRuleResolution(input: {
  matchedRules: readonly WebTranslationRule[];
  primaryContentRule?: WebTranslationRule | undefined;
  primaryScopeRule?: WebTranslationRule | undefined;
  modifierRules: readonly WebTranslationRule[];
  structureRules: readonly WebTranslationRule[];
  dynamicRules: readonly WebTranslationRule[];
  matchOnlyRules: readonly WebTranslationRule[];
  unsafeRules: readonly WebTranslationRule[];
  confidence: number;
  reasons: readonly string[];
}): SitePolicyRuleResolution {
  return {
    matchedRuleIds: input.matchedRules.map((rule) => rule.id),
    ...(input.primaryContentRule ? { primaryContentRuleId: input.primaryContentRule.id } : {}),
    ...(input.primaryScopeRule ? { primaryScopeRuleId: input.primaryScopeRule.id } : {}),
    modifierRuleIds: input.modifierRules.map((rule) => rule.id),
    structureRuleIds: input.structureRules.map((rule) => rule.id),
    dynamicRuleIds: input.dynamicRules.map((rule) => rule.id),
    matchOnlyRuleIds: input.matchOnlyRules.map((rule) => rule.id),
    unsafeRuleIds: input.unsafeRules.map((rule) => rule.id),
    confidence: input.confidence,
    reasons: input.reasons,
  };
}

function capabilityFromRuleResolution(
  resolution: SitePolicyRuleResolution | undefined,
): WebTranslationRuleCapability | undefined {
  if (!resolution) return undefined;
  if (resolution.primaryContentRuleId) return "content-ready";
  if (resolution.primaryScopeRuleId) return "scope-ready";
  if (resolution.structureRuleIds.length) return "structure-only";
  if (resolution.modifierRuleIds.length) return "modifier-only";
  if (resolution.dynamicRuleIds.length) return "dynamic-only";
  if (resolution.matchOnlyRuleIds.length) return "match-only";
  if (resolution.unsafeRuleIds.length) return "unsafe";
  return undefined;
}

function defaultRuleResolutionForRule(
  rule: ResolvedWebTranslationRule,
  capability: { capability: WebTranslationRuleCapability },
): SitePolicyRuleResolution {
  return toSitePolicyRuleResolution({
    matchedRules: [rule],
    primaryContentRule: capability.capability === "content-ready" ? rule : undefined,
    primaryScopeRule: capability.capability === "scope-ready" ? rule : undefined,
    modifierRules: capability.capability === "modifier-only" ? [rule] : [],
    structureRules: capability.capability === "structure-only" ? [rule] : [],
    dynamicRules: capability.capability === "dynamic-only" ? [rule] : [],
    matchOnlyRules: capability.capability === "match-only" ? [rule] : [],
    unsafeRules: capability.capability === "unsafe" ? [rule] : [],
    confidence: confidenceForResolution({
      primaryContentRule: capability.capability === "content-ready" ? rule : undefined,
      primaryScopeRule: capability.capability === "scope-ready" ? rule : undefined,
      modifierRules: capability.capability === "modifier-only" ? [rule] : [],
      structureRules: capability.capability === "structure-only" ? [rule] : [],
      dynamicRules: capability.capability === "dynamic-only" ? [rule] : [],
      matchOnlyRules: capability.capability === "match-only" ? [rule] : [],
      matchedRules: [rule],
    }),
    reasons: [`single:${rule.ruleId}`, `capability:${capability.capability}`],
  });
}

function normalizeHostnameFromUrl(url: string): string {
  const parsed = parseUrl(url);
  return parsed?.hostname ? normalizeHostname(parsed.hostname) : normalizeHostname(url);
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
    contentSelectors: arrayValue(rule.contentSelectors, contentSelectorKey),
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

function arrayValue<T>(
  value: RuleArrayValue<T> | undefined,
  keyOf: (item: T) => string = (item) => String(item),
): readonly T[] {
  if (!value) return [];
  if (!isRuleArrayOperation(value)) return unique(listValue(value), keyOf);
  return unique(value.replace !== undefined ? listValue(value.replace) : listValue(value.add), keyOf);
}

function coreWebTranslationRule(id: string): WebTranslationRule {
  const rule = CORE_WEB_TRANSLATION_RULES.find((entry) => entry.id === id);
  if (!rule) throw new Error(`Missing core web translation rule: ${id}`);
  return rule;
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

function stackAddOnly<T>(value: RuleArrayValue<T> | undefined): RuleArrayValue<T> | undefined {
  if (!value) return undefined;
  if (!isRuleArrayOperation(value)) return { add: listValue(value) };
  const additions = [...listValue(value.replace), ...listValue(value.add)];
  return additions.length ? { add: additions } : undefined;
}

function stackRecordAddOnly<T>(value: RuleRecordValue<T> | undefined): RuleRecordValue<T> | undefined {
  if (!value) return undefined;
  if (isRuleRecord(value)) return { add: value };
  const additions = { ...(value.replace ?? {}), ...(value.add ?? {}) };
  return Object.keys(additions).length ? { add: additions } : undefined;
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

const WEAK_CANDIDATE_SELECTOR_TEXT = /(title|text|content|summary|name|desc|description|headline|body|caption|excerpt|abstract|comment|message|post)/i;
const LAYOUT_REPAIR_STYLE_TEXT = /(line-clamp|max-height|overflow|white-space|\bheight\b|\bdisplay\b)/i;
const EXCLUDE_HINT_SELECTOR_TEXT = /(^|[\s.#:[>+~_-])(nav|navigation|sidebar|footer|header|ad|ads|advert|sponsor|popup|modal|promo|toolbar|menu)([\s.#:[\]>+~_-]|$)/i;

export function inferStyleRuleIntent(rule: WebTranslationRule): StyleRuleIntent {
  const styleFixes: string[] = [];
  const weakCandidateSelectors: string[] = [];
  const excludeHints: string[] = [];
  const layoutHints: string[] = [];

  for (const { selectorText, styleText } of styleRuleEntries(rule)) {
    const hasLayoutRepair = LAYOUT_REPAIR_STYLE_TEXT.test(styleText);
    for (const selector of selectorText.split(",")) {
      const trimmed = selector.trim();
      if (!trimmed || isUnsafeWeakCandidateSelector(trimmed)) continue;
      if (hasLayoutRepair) {
        styleFixes.push(trimmed);
        layoutHints.push(trimmed);
        if (WEAK_CANDIDATE_SELECTOR_TEXT.test(trimmed)) weakCandidateSelectors.push(trimmed);
      }
      if (EXCLUDE_HINT_SELECTOR_TEXT.test(trimmed)) excludeHints.push(trimmed);
    }
  }

  return {
    styleFixes: unique(styleFixes),
    weakCandidateSelectors: unique(weakCandidateSelectors),
    excludeHints: unique(excludeHints),
    layoutHints: unique(layoutHints),
  };
}

function styleRuleEntries(rule: WebTranslationRule): Array<{ selectorText: string; styleText: string }> {
  const entries = Object.entries(recordValue(rule.globalStyles)).map(([selectorText, styleText]) => ({
    selectorText,
    styleText,
  }));

  for (const cssText of arrayValue(rule.injectedCss)) {
    entries.push(...cssRuleEntries(cssText));
  }
  for (const cssText of arrayValue(rule.additionalInjectedCss)) {
    entries.push(...cssRuleEntries(cssText));
  }
  return entries;
}

function cssRuleEntries(cssText: string): Array<{ selectorText: string; styleText: string }> {
  const entries: Array<{ selectorText: string; styleText: string }> = [];
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rulePattern.exec(cssText)) !== null) {
    const selectorText = match[1]?.trim();
    const styleText = match[2]?.trim();
    if (!selectorText || !styleText) continue;
    if (selectorText.startsWith("@")) continue;
    entries.push({ selectorText, styleText });
  }
  return entries;
}

function isUnsafeWeakCandidateSelector(selector: string): boolean {
  if (selector === "*" || selector === "body" || selector === "html") return true;
  if (/immersive-translate|imt-/i.test(selector)) return true;
  if (/[{}]/.test(selector)) return true;
  return false;
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
