import type { TranslatableAttributeName, UnitCategory } from "./types";

export type RuleArrayValue<T> = readonly T[] | {
  replace?: readonly T[];
  add?: readonly T[];
  remove?: readonly T[];
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
  extraBlockSelectors?: RuleArrayValue<string>;
  extraInlineSelectors?: RuleArrayValue<string>;
  atomicBlockSelectors?: RuleArrayValue<string>;
  stayOriginalSelectors?: RuleArrayValue<string>;
  stayOriginalTags?: RuleArrayValue<string>;
  globalStyles?: RuleRecordValue<string>;
  contentSelectors?: RuleArrayValue<RuleContentSelector>;
  attributeNames?: RuleArrayValue<TranslatableAttributeName>;
  mainFrameSelector?: string;
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
    condition: string;
    advanceConfig: Omit<
      WebTranslationRule,
      "id" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches" | "advanceMergeConfig"
    >;
  }[];
};
