import { SAFE_TRANSLATABLE_ATTRIBUTES } from "./domScanner";
import type { DynamicMode } from "../shared/config";
import type { TranslatableAttributeName, UnitCategory } from "../shared/types";
import type { DynamicModeSource, SitePolicy } from "./sitePolicy";
import { IMPORTED_IMMERSIVE_WEB_RULES } from "./importedImmersiveRules";

export type RuleArrayValue<T> = readonly T[] | {
  replace?: readonly T[];
  add?: readonly T[];
  remove?: readonly T[];
};

export type RuleContentSelector = {
  selector: string;
  category: UnitCategory;
};

export type WebTranslationRule = {
  id: string;
  siteKey?: string;
  matches?: readonly string[];
  excludeMatches?: readonly string[];
  selectorMatches?: readonly string[];
  excludeSelectorMatches?: readonly string[];
  selectors?: RuleArrayValue<string>;
  excludeSelectors?: RuleArrayValue<string>;
  mutationExcludeSelectors?: RuleArrayValue<string>;
  injectedCss?: RuleArrayValue<string>;
  contentSelectors?: RuleArrayValue<RuleContentSelector>;
  attributeNames?: RuleArrayValue<TranslatableAttributeName>;
  dynamicPreset?: "normal" | "conservative" | "twitter-fast" | "metatft-fast" | "tactics-fast" | "chat-stream";
  isHighDynamic?: boolean;
  allowTooltip?: boolean;
  paragraphMinTextCount?: number;
  paragraphMinWordCount?: number;
  blockMinTextCount?: number;
  blockMinWordCount?: number;
  debounceMs?: number;
  lazyRootMargin?: string;
  lazyThreshold?: number;
  eagerLazyRootMargin?: string;
  maxEagerLazyRoots?: number;
  maxQueueSize?: number;
  maxRootsPerFlush?: number;
  maxObservedRoots?: number;
  maxMutationNodesPerWindow?: number;
  mutationWindowMs?: number;
  advanceMergeConfig?: readonly {
    condition: "always" | "true";
    advanceConfig: Omit<WebTranslationRule, "id" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches" | "advanceMergeConfig">;
  }[];
};

type ResolvedWebTranslationRule = Omit<
  WebTranslationRule,
  "selectors" | "excludeSelectors" | "mutationExcludeSelectors" | "injectedCss" | "contentSelectors" | "attributeNames" | "advanceMergeConfig"
> & {
  selectors: readonly string[];
  excludeSelectors: readonly string[];
  mutationExcludeSelectors: readonly string[];
  injectedCss: readonly string[];
  contentSelectors: readonly RuleContentSelector[];
  attributeNames: readonly TranslatableAttributeName[];
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
  dynamicModeSource: "global" as DynamicModeSource,
  isHighDynamic: false,
  dynamicMode: "normal" as DynamicMode,
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  preferredScanRootSelectors: [],
  excludeSelectors: [],
  contentSelectors: [],
  allowTooltip: true,
  debounceMs: 1500,
  lazyRootMargin: "200px",
  lazyThreshold: 0.1,
  eagerLazyRootMargin: "900px",
  maxEagerLazyRoots: 120,
  maxQueueSize: 300,
  maxRootsPerFlush: 20,
  maxObservedRoots: 300,
  maxMutationNodesPerWindow: 1000,
  mutationWindowMs: 5000,
  excludedDynamicSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: [],
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
  siteKey: "",
  excludeSelectors: [],
  mutationExcludeSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  dynamicPreset: "normal",
  allowTooltip: true,
  paragraphMinTextCount: 2,
  paragraphMinWordCount: 1,
  blockMinTextCount: 24,
  blockMinWordCount: 4,
};

const CORE_WEB_TRANSLATION_RULES: readonly WebTranslationRule[] = [
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
    ],
    contentSelectors: [
      { selector: 'div[data-testid="tweetText"], [data-testid="tweetText"]', category: "comment" },
      { selector: 'div[data-testid="UserDescription"]', category: "content-block" },
      { selector: '[data-testid="card.layoutSmall.detail"] > div:nth-child(2)', category: "card-text" },
      { selector: '[data-testid="developerBuiltCardContainer"] > div:nth-child(2)', category: "card-text" },
      { selector: '[data-testid="card.layoutLarge.detail"] > div:nth-child(2)', category: "card-text" },
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
    id: "youtube",
    siteKey: "youtube.com",
    matches: ["*://youtube.com/*", "*://*.youtube.com/*"],
    selectors: [
      "ytd-watch-metadata h1",
      "#video-title",
      "#description-inline-expander",
      "#description",
      "#content-text",
      "ytd-comment-view-model #content-text",
      "ytd-transcript-segment-renderer",
      "yt-formatted-string.ytd-channel-name",
    ],
    contentSelectors: [
      { selector: "h1.title, ytd-watch-metadata h1, h1 yt-formatted-string", category: "heading" },
      { selector: "yt-formatted-string#content-text", category: "comment" },
      { selector: "#description, #description-inline-expander, ytd-text-inline-expander", category: "content-block" },
      {
        selector:
          "#video-title, a#video-title, yt-formatted-string.ytd-compact-video-renderer, yt-formatted-string.ytd-grid-video-renderer",
        category: "card-text",
      },
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
#content-text,
ytd-watch-metadata h1,
ytd-transcript-segment-renderer {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    dynamicPreset: "conservative",
    isHighDynamic: true,
  },
  {
    id: "reddit",
    siteKey: "reddit.com",
    matches: ["*://reddit.com/*", "*://*.reddit.com/*"],
    selectors: [
      'shreddit-post [slot="title"]',
      'shreddit-post [slot="text-body"]',
      "shreddit-comment",
      "[data-testid='post-content']",
      "[data-test-id='comment']",
    ],
    contentSelectors: [
      { selector: '[data-testid="post-title"], a[data-testid="post-title"], [slot="title"]', category: "card-text" },
      {
        selector:
          '[data-testid="post-content"] p, [data-test-id="post-content"] p, shreddit-post [slot="text-body"], div[data-post-click-location="text-body"] p',
        category: "content-block",
      },
      { selector: '[data-testid="comment"] p, shreddit-comment p', category: "comment" },
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
      "faceplate-tracker",
      "faceplate-number",
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
[data-test-id="comment"] {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
    ],
    dynamicPreset: "conservative",
    isHighDynamic: true,
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
] as const;

export const BUILTIN_WEB_TRANSLATION_RULES = [
  ...CORE_WEB_TRANSLATION_RULES,
  ...IMPORTED_IMMERSIVE_WEB_RULES,
] as const satisfies readonly WebTranslationRule[];

export function matchWebTranslationRule(
  url: string,
  doc: Document | undefined = globalThis.document,
  rules: readonly WebTranslationRule[] = BUILTIN_WEB_TRANSLATION_RULES,
): WebTranslationRule | undefined {
  return rules.find((rule) => hasSelectorConditions(rule) && matchesRule(url, doc, rule)) ??
    rules.find((rule) => !hasSelectorConditions(rule) && matchesRule(url, doc, rule));
}

export function selectWebTranslationRulesForContent(
  url: string,
  rules: readonly WebTranslationRule[] = BUILTIN_WEB_TRANSLATION_RULES,
): WebTranslationRule[] {
  const selectorRules = rules.filter(hasSelectorConditions);
  const matchedUrlRule = rules.find((rule) => !hasSelectorConditions(rule) && matchesUrlOnly(url, rule));
  return matchedUrlRule ? [...selectorRules, matchedUrlRule] : selectorRules;
}

export function resolveWebTranslationRule(
  url: string,
  doc: Document | undefined = globalThis.document,
): ResolvedWebTranslationRule {
  const match = matchWebTranslationRule(url, doc);
  if (!match) return mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, { id: "general" });
  const base = match.id === "twitter"
    ? mergeWebTranslationRules(GENERAL_WEB_TRANSLATION_RULE, BUILTIN_WEB_TRANSLATION_RULES[0]!)
    : GENERAL_WEB_TRANSLATION_RULE;
  return mergeWebTranslationRules(base, match);
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
  const base = {
    ...DEFAULT_SITE_POLICY,
    ...preset,
    hostname: normalizedHostname,
    siteKey: rule.siteKey || normalizedHostname,
    isHighDynamic: Boolean(rule.isHighDynamic),
    attributeNames: rule.attributeNames,
    preferredScanRootSelectors: rule.selectors,
    excludeSelectors: rule.excludeSelectors,
    contentSelectors: rule.contentSelectors,
    allowTooltip: rule.allowTooltip ?? DEFAULT_SITE_POLICY.allowTooltip,
    excludedDynamicSelectors: unique([...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS, ...rule.excludeSelectors, ...rule.mutationExcludeSelectors]),
    injectedCss: rule.injectedCss,
    ...(rule.debounceMs !== undefined ? { debounceMs: rule.debounceMs } : {}),
    ...(rule.lazyRootMargin !== undefined ? { lazyRootMargin: rule.lazyRootMargin } : {}),
    ...(rule.lazyThreshold !== undefined ? { lazyThreshold: rule.lazyThreshold } : {}),
    ...(rule.eagerLazyRootMargin !== undefined ? { eagerLazyRootMargin: rule.eagerLazyRootMargin } : {}),
    ...(rule.maxEagerLazyRoots !== undefined ? { maxEagerLazyRoots: rule.maxEagerLazyRoots } : {}),
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

export function resolveWebTranslationPolicy(
  url: string,
  preferredDynamicMode: DynamicMode = "normal",
  options: { siteDynamicMode?: DynamicMode; document?: Document } = {},
): SitePolicy {
  const parsed = parseUrl(url);
  const hostname = parsed?.hostname ?? normalizeHostname(url);
  return compileRulePolicy(
    resolveWebTranslationRule(urlFromHostnameFallback(url, hostname), options.document),
    hostname,
    preferredDynamicMode,
    options,
  );
}

function mergeOneRule(base: ResolvedWebTranslationRule, delta: WebTranslationRule): ResolvedWebTranslationRule {
  const siteKey = delta.siteKey ?? base.siteKey;
  return {
    ...base,
    ...delta,
    id: delta.id,
    ...(siteKey ? { siteKey } : {}),
    selectors: mergeArray(base.selectors, delta.selectors),
    excludeSelectors: mergeArray(base.excludeSelectors, delta.excludeSelectors),
    mutationExcludeSelectors: mergeArray(base.mutationExcludeSelectors, delta.mutationExcludeSelectors),
    injectedCss: mergeArray(base.injectedCss, delta.injectedCss),
    contentSelectors: mergeArray(base.contentSelectors, delta.contentSelectors, contentSelectorKey),
    attributeNames: mergeArray(base.attributeNames, delta.attributeNames),
  };
}

function toResolvedRule(rule: WebTranslationRule): ResolvedWebTranslationRule {
  return {
    ...rule,
    selectors: arrayValue(rule.selectors),
    excludeSelectors: arrayValue(rule.excludeSelectors),
    mutationExcludeSelectors: arrayValue(rule.mutationExcludeSelectors),
    injectedCss: arrayValue(rule.injectedCss),
    contentSelectors: arrayValue(rule.contentSelectors),
    attributeNames: arrayValue(rule.attributeNames),
  };
}

function mergeArray<T>(
  base: readonly T[],
  value: RuleArrayValue<T> | undefined,
  keyOf: (item: T) => string = (item) => String(item),
): readonly T[] {
  if (!value) return base;
  if (isRuleArray(value)) return unique(value, keyOf);

  let next = value.replace ? [...value.replace] : [...base];
  const removeKeys = new Set((value.remove ?? []).map(keyOf));
  next = next.filter((item) => !removeKeys.has(keyOf(item)));
  if (value.add) next.push(...value.add);
  return unique(next, keyOf);
}

function arrayValue<T>(value: RuleArrayValue<T> | undefined): readonly T[] {
  if (!value) return [];
  if (isRuleArray(value)) return unique(value);
  return unique(value.replace ?? value.add ?? []);
}

function isRuleArray<T>(value: RuleArrayValue<T>): value is readonly T[] {
  return Array.isArray(value);
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

function matchesRule(url: string, doc: Document | undefined, rule: WebTranslationRule): boolean {
  if (rule.matches?.length && !rule.matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (rule.excludeMatches?.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (rule.selectorMatches?.length && (!doc || !rule.selectorMatches.some((selector) => hasSelector(doc, selector)))) return false;
  if (doc && rule.excludeSelectorMatches?.some((selector) => hasSelector(doc, selector))) return false;
  return true;
}

function matchesUrlOnly(url: string, rule: WebTranslationRule): boolean {
  if (!rule.matches?.length) return false;
  if (!rule.matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  return !rule.excludeMatches?.some((pattern) => matchesUrlPattern(url, pattern));
}

function hasSelectorConditions(rule: WebTranslationRule): boolean {
  return Boolean(rule.selectorMatches?.length || rule.excludeSelectorMatches?.length);
}

function matchesUrlPattern(url: string, pattern: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  const normalizedPattern = pattern.trim().toLowerCase();

  if (!normalizedPattern.includes("://")) {
    return matchesHostPattern(parsed, normalizedPattern);
  }

  const escaped = normalizedPattern.split("*").map(escapeRegExp).join(".*");
  return new RegExp(`^${escaped}$`, "i").test(parsed.href.toLowerCase());
}

function matchesHostPattern(parsed: URL, pattern: string): boolean {
  const host = parsed.hostname.toLowerCase();
  const hostAndPath = `${host}${parsed.pathname}${parsed.search}${parsed.hash}`.toLowerCase();

  if (pattern.includes("/")) {
    return wildcardPatternToRegExp(pattern).test(hostAndPath);
  }

  const normalizedHost = host.replace(/^www\./, "");
  const normalizedPattern = pattern.replace(/^www\./, "");

  if (normalizedPattern.startsWith("*.")) {
    const domain = normalizedPattern.slice(2);
    return host === domain || host.endsWith(`.${domain}`);
  }

  if (normalizedPattern.includes("*")) {
    return wildcardPatternToRegExp(normalizedPattern).test(normalizedHost);
  }

  return normalizedHost === normalizedPattern || normalizedHost.endsWith(`.${normalizedPattern}`);
}

function wildcardPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.split("*").map(escapeRegExp).join(".*");
  return new RegExp(`^${escaped}$`, "i");
}

function hasSelector(doc: Document, selector: string): boolean {
  try {
    return Boolean(doc.querySelector(selector));
  } catch {
    return false;
  }
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

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}
