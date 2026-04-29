import type { TranslatableAttributeName, UnitCategory } from "./types";

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
    advanceConfig: Omit<
      WebTranslationRule,
      "id" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches" | "advanceMergeConfig"
    >;
  }[];
};
