import type { DynamicMode } from "../shared/config";
import type { TranslatableAttributeName, UnitCategory } from "../shared/types";
import type { WebTranslationRule } from "../shared/webRuleTypes";
import type { CompiledFilterRule } from "./compiledFilterRule";
import {
  DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  resolveWebTranslationPolicy,
} from "./webTranslationRules";

export { DEFAULT_EXCLUDED_DYNAMIC_SELECTORS };

export type DynamicTranslationMode = DynamicMode;
export type DynamicModeSource = "global" | "site-default" | "site-override";

export type SiteContentSelector = {
  selector: string;
  category: UnitCategory;
};

export type SitePolicy = {
  hostname: string;
  siteKey: string;
  dynamicModeSource: DynamicModeSource;
  isHighDynamic: boolean;
  dynamicMode: DynamicTranslationMode;
  attributeNames: readonly TranslatableAttributeName[];
  preferredScanRootSelectors: readonly string[];
  excludeSelectors: readonly string[];
  contentSelectors: readonly SiteContentSelector[];
  allowTooltip: boolean;
  debounceMs: number;
  lazyRootMargin: string;
  lazyThreshold: number;
  eagerLazyRootMargin: string;
  maxEagerLazyRoots: number;
  maxQueueSize: number;
  maxRootsPerFlush: number;
  maxObservedRoots: number;
  maxMutationNodesPerWindow: number;
  mutationWindowMs: number;
  excludedDynamicSelectors: readonly string[];
  injectedCss: readonly string[];
  filterRule: CompiledFilterRule;
  observeUrlChange: boolean;
  urlChangeDelay: number;
};

export type SitePolicyOptions = {
  siteDynamicMode?: DynamicMode;
  document?: Document;
  rules?: readonly WebTranslationRule[];
};

export function resolveSitePolicy(
  hostname: string = globalThis.location?.hostname ?? "",
  preferredDynamicMode: DynamicMode = "normal",
  options: SitePolicyOptions = {},
): SitePolicy {
  return resolveWebTranslationPolicy(hostname, preferredDynamicMode, options);
}

export function resolveSitePolicyKey(hostname: string = globalThis.location?.hostname ?? ""): string {
  return resolveSitePolicy(hostname).siteKey;
}
