import type { SitePolicy } from "./sitePolicy";

export type SitePolicySignature = {
  ruleId: string;
  siteKey: string;
  ruleCapability: string;
  fallbackProfile: string;
  dynamicMode: string;
  mergedRuleIds: readonly string[];
  shapeHash: string;
};

export function createSitePolicySignature(policy: SitePolicy): SitePolicySignature {
  return {
    ruleId: policy.ruleId,
    siteKey: policy.siteKey,
    ruleCapability: policy.ruleCapability,
    fallbackProfile: policy.fallbackProfile,
    dynamicMode: policy.dynamicMode,
    mergedRuleIds: [...policy.mergedRuleIds],
    shapeHash: stableStringify({
      attributeNames: policy.attributeNames,
      mainFrameSelector: policy.mainFrameSelector,
      mainFrameMinTextCount: policy.mainFrameMinTextCount,
      mainFrameMinWordCount: policy.mainFrameMinWordCount,
      containerMinTextCount: policy.containerMinTextCount,
      bodyRule: policy.bodyRule,
      buildContainerSelectors: policy.buildContainerSelectors,
      skipBuildContainerSelectors: policy.skipBuildContainerSelectors,
      preferredScanRootSelectors: policy.preferredScanRootSelectors,
      weakCandidateSelectors: policy.weakCandidateSelectors,
      excludeSelectors: policy.excludeSelectors,
      contentSelectors: policy.contentSelectors,
      selectorFallbackPolicy: policy.selectorFallbackPolicy,
      allowTooltip: policy.allowTooltip,
      debounceMs: policy.debounceMs,
      lazyRootMargin: policy.lazyRootMargin,
      lazyThreshold: policy.lazyThreshold,
      eagerLazyRootMargin: policy.eagerLazyRootMargin,
      maxEagerLazyRoots: policy.maxEagerLazyRoots,
      viewportSupplement: policy.viewportSupplement,
      viewportSupplementDebounceMs: policy.viewportSupplementDebounceMs,
      viewportSupplementRootMargin: policy.viewportSupplementRootMargin,
      viewportSupplementMaxRoots: policy.viewportSupplementMaxRoots,
      maxQueueSize: policy.maxQueueSize,
      maxRootsPerFlush: policy.maxRootsPerFlush,
      maxObservedRoots: policy.maxObservedRoots,
      maxMutationNodesPerWindow: policy.maxMutationNodesPerWindow,
      mutationWindowMs: policy.mutationWindowMs,
      excludedDynamicSelectors: policy.excludedDynamicSelectors,
      injectedCss: policy.injectedCss,
      globalAttributes: policy.globalAttributes,
      translationClasses: policy.translationClasses,
      wrapperPrefix: policy.wrapperPrefix,
      wrapperSuffix: policy.wrapperSuffix,
      lineBreakMaxTextCount: policy.lineBreakMaxTextCount,
      observeUrlChange: policy.observeUrlChange,
      urlChangeDelay: policy.urlChangeDelay,
    }),
  };
}

export function areSitePolicySignaturesEqual(
  left: SitePolicySignature,
  right: SitePolicySignature,
): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function stableValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableValue);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableValue(entryValue)]),
  );
}
