import type { TranslatableAttributeName, UnitCategory } from "./types";

export type RuleListValue<T> = T | readonly T[];

export type RuleArrayValue<T> = RuleListValue<T> | {
  replace?: RuleListValue<T>;
  add?: RuleListValue<T>;
  remove?: RuleListValue<T>;
};

export type RuleRecordValue<T> = Readonly<Record<string, T>> | {
  replace?: Readonly<Record<string, T>>;
  add?: Readonly<Record<string, T>>;
  remove?: readonly string[];
};

export type RuleContentSelector = {
  selector: string;
  category: UnitCategory;
};

export type WebTranslationRuleSource = "core" | "core+imported" | "imported-stable" | "imported-experimental";
export type WebTranslationRuleCapability =
  | "content-ready"
  | "scope-ready"
  | "modifier-only"
  | "structure-only"
  | "dynamic-only"
  | "match-only"
  | "unsafe";
export type WebTranslationFallbackProfile = "none" | "article" | "video" | "social" | "forum" | "commerce" | "generic";
export type SelectorFallbackPolicy = "none" | "conservative" | "generic";
export type WebTranslationGlobalAttributes = Readonly<Record<string, Readonly<Record<string, string | null>>>>;

export type WebTranslationBodyRule = {
  enable?: boolean;
  minTextLength?: number;
  bodySelector?: string;
  articleSelector?: string;
  xpathRule?: readonly unknown[];
  matchNodeRule?: Readonly<Record<string, unknown>>;
};

export type WebTranslationRule = {
  id: string;
  ruleSource?: WebTranslationRuleSource;
  ruleCapability?: WebTranslationRuleCapability;
  fallbackProfile?: WebTranslationFallbackProfile;
  globalSelectorRule?: boolean;
  selectorFallbackPolicy?: SelectorFallbackPolicy;
  siteKey?: string;
  matches?: RuleListValue<string>;
  excludeMatches?: RuleListValue<string>;
  selectorMatches?: RuleListValue<string>;
  excludeSelectorMatches?: RuleListValue<string>;
  selectors?: RuleArrayValue<string>;
  additionalSelectors?: RuleArrayValue<string>;
  excludeSelectors?: RuleArrayValue<string>;
  additionalExcludeSelectors?: RuleArrayValue<string>;
  excludeTags?: RuleArrayValue<string>;
  additionalExcludeTags?: RuleArrayValue<string>;
  mutationExcludeSelectors?: RuleArrayValue<string>;
  injectedCss?: RuleArrayValue<string>;
  additionalInjectedCss?: RuleArrayValue<string>;
  extraBlockSelectors?: RuleArrayValue<string>;
  extraInlineSelectors?: RuleArrayValue<string>;
  atomicBlockSelectors?: RuleArrayValue<string>;
  inlineTags?: RuleArrayValue<string>;
  preWhitespaceDetectedTags?: RuleArrayValue<string>;
  buildContainerSelectors?: RuleArrayValue<string>;
  skipBuildContainerSelectors?: RuleArrayValue<string>;
  stayOriginalSelectors?: RuleArrayValue<string>;
  stayOriginalTags?: RuleArrayValue<string>;
  globalStyles?: RuleRecordValue<string>;
  globalAttributes?: RuleRecordValue<Readonly<Record<string, string | null>>>;
  translationClasses?: RuleArrayValue<string>;
  wrapperPrefix?: string;
  wrapperSuffix?: string;
  contentSelectors?: RuleArrayValue<RuleContentSelector>;
  attributeNames?: RuleArrayValue<TranslatableAttributeName>;
  mainFrameSelector?: string;
  mainFrameMinTextCount?: number;
  mainFrameMinWordCount?: number;
  bodyRule?: WebTranslationBodyRule;
  observeUrlChange?: boolean;
  urlChangeDelay?: number;
  detectParagraphLanguage?: boolean;
  dynamicPreset?: "normal" | "conservative" | "twitter-fast" | "metatft-fast" | "tactics-fast" | "chat-stream";
  isHighDynamic?: boolean;
  allowTooltip?: boolean;
  paragraphMinTextCount?: number;
  paragraphMinWordCount?: number;
  blockMinTextCount?: number;
  blockMinWordCount?: number;
  containerMinTextCount?: number;
  lineBreakMaxTextCount?: number;
  debounceMs?: number;
  lazyRootMargin?: string;
  lazyThreshold?: number;
  eagerLazyRootMargin?: string;
  maxEagerLazyRoots?: number;
  viewportSupplement?: boolean;
  viewportSupplementDebounceMs?: number;
  viewportSupplementRootMargin?: string;
  viewportSupplementMaxRoots?: number;
  maxQueueSize?: number;
  maxRootsPerFlush?: number;
  maxObservedRoots?: number;
  maxMutationNodesPerWindow?: number;
  mutationWindowMs?: number;
  aiRule?: Readonly<Record<string, unknown>>;
  advanceMergeConfig?: readonly {
    condition: string;
    advanceConfig: Omit<
      WebTranslationRule,
      "id" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches" | "advanceMergeConfig"
    >;
  }[];
};
