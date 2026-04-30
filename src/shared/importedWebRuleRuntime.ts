import type { WebTranslationRule, WebTranslationRuleSource } from "./webRuleTypes";
import { analyzeWebTranslationRuleCapability } from "./webRuleCapability";

const SUPPORTED_RULE_KEYS = new Set([
  "id",
  "ruleSource",
  "ruleCapability",
  "fallbackProfile",
  "siteKey",
  "matches",
  "excludeMatches",
  "selectorMatches",
  "excludeSelectorMatches",
  "selectors",
  "additionalSelectors",
  "excludeSelectors",
  "additionalExcludeSelectors",
  "excludeTags",
  "additionalExcludeTags",
  "mutationExcludeSelectors",
  "injectedCss",
  "additionalInjectedCss",
  "extraBlockSelectors",
  "extraInlineSelectors",
  "atomicBlockSelectors",
  "inlineTags",
  "preWhitespaceDetectedTags",
  "buildContainerSelectors",
  "skipBuildContainerSelectors",
  "stayOriginalSelectors",
  "stayOriginalTags",
  "globalStyles",
  "globalAttributes",
  "translationClasses",
  "wrapperPrefix",
  "wrapperSuffix",
  "contentSelectors",
  "attributeNames",
  "mainFrameSelector",
  "mainFrameMinTextCount",
  "mainFrameMinWordCount",
  "bodyRule",
  "observeUrlChange",
  "urlChangeDelay",
  "detectParagraphLanguage",
  "dynamicPreset",
  "isHighDynamic",
  "allowTooltip",
  "paragraphMinTextCount",
  "paragraphMinWordCount",
  "blockMinTextCount",
  "blockMinWordCount",
  "containerMinTextCount",
  "lineBreakMaxTextCount",
  "debounceMs",
  "lazyRootMargin",
  "lazyThreshold",
  "eagerLazyRootMargin",
  "maxEagerLazyRoots",
  "viewportSupplement",
  "viewportSupplementDebounceMs",
  "viewportSupplementRootMargin",
  "viewportSupplementMaxRoots",
  "maxQueueSize",
  "maxRootsPerFlush",
  "maxObservedRoots",
  "maxMutationNodesPerWindow",
  "mutationWindowMs",
  "aiRule",
  "advanceMergeConfig",
]);

const SUPPORTED_DELTA_FIELDS = [
  "selectors",
  "additionalSelectors",
  "excludeSelectors",
  "additionalExcludeSelectors",
  "excludeTags",
  "additionalExcludeTags",
  "mutationExcludeSelectors",
  "injectedCss",
  "additionalInjectedCss",
  "extraBlockSelectors",
  "extraInlineSelectors",
  "atomicBlockSelectors",
  "inlineTags",
  "preWhitespaceDetectedTags",
  "buildContainerSelectors",
  "skipBuildContainerSelectors",
  "stayOriginalSelectors",
  "stayOriginalTags",
  "globalStyles",
  "globalAttributes",
  "translationClasses",
  "contentSelectors",
  "attributeNames",
];

const NON_WEB_RULE_ID_PATTERN = /^(?:is)?ebook(?:builder)?$|pdf|subtitle|ocr|(?:^|[-_.])vtt(?:$|[-_.])|text-track|ebutt|notranslate/i;
const NON_WEB_RULE_TEXT_PATTERN = /immersive-translate-(pdf|ebook|subtitle)|application\/pdf|download-subtitle|\.vtt\b/i;

const STABLE_RUNTIME_FIELDS = [
  "selectors",
  "additionalSelectors",
  "excludeSelectors",
  "additionalExcludeSelectors",
  "excludeTags",
  "mutationExcludeSelectors",
  "injectedCss",
  "additionalInjectedCss",
  "extraBlockSelectors",
  "extraInlineSelectors",
  "atomicBlockSelectors",
  "inlineTags",
  "buildContainerSelectors",
  "skipBuildContainerSelectors",
  "stayOriginalSelectors",
  "stayOriginalTags",
  "globalStyles",
  "globalAttributes",
  "translationClasses",
  "contentSelectors",
  "attributeNames",
  "mainFrameSelector",
  "bodyRule",
  "dynamicPreset",
  "isHighDynamic",
  "advanceMergeConfig",
] as const satisfies readonly (keyof WebTranslationRule)[];

export function prepareImportedWebTranslationRules(rules: readonly WebTranslationRule[]): WebTranslationRule[] {
  const prepared: WebTranslationRule[] = [];

  for (const rule of rules) {
    const supported = pickSupportedRuleFields(rule);
    if (!isRuntimeWebPageRule(supported)) continue;
    const capability = analyzeWebTranslationRuleCapability(supported);
    prepared.push({
      ...supported,
      ruleSource: importedRuleSource(supported),
      ruleCapability: capability.capability,
      fallbackProfile: capability.fallbackProfile,
    });
  }

  return prepared;
}

function pickSupportedRuleFields(rule: WebTranslationRule): WebTranslationRule {
  const raw = rule as WebTranslationRule & Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (SUPPORTED_RULE_KEYS.has(key) || isSupportedVersionedDeltaKey(key)) output[key] = value;
  }

  return output as WebTranslationRule;
}

function isSupportedVersionedDeltaKey(key: string): boolean {
  return SUPPORTED_DELTA_FIELDS.some((field) =>
    key === `${field}.add` ||
    key === `${field}.remove` ||
    key === `${field}.replace` ||
    key.startsWith(`${field}.add_v.`) ||
    key.startsWith(`${field}.remove_v.`)
  );
}

function isRuntimeWebPageRule(rule: WebTranslationRule): boolean {
  const id = rule.id.trim();
  if (!id || NON_WEB_RULE_ID_PATTERN.test(id)) return false;

  const searchableText = [
    id,
    rule.siteKey,
    ...listValue(rule.matches),
    ...listValue(rule.selectorMatches),
    ...arrayValue(rule.selectors),
    ...arrayValue(rule.additionalSelectors),
  ].filter(Boolean).join("\n");

  return !NON_WEB_RULE_TEXT_PATTERN.test(searchableText);
}

function listValue<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value as readonly T[] : [value as T];
}

function arrayValue<T>(value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[] } | undefined): readonly T[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (!isArrayOperation(value)) return [value as T];
  return listValue(value.replace ?? value.add);
}

function isArrayOperation<T>(
  value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[] } | undefined,
): value is { replace?: T | readonly T[]; add?: T | readonly T[] } {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("replace" in value || "add" in value),
  );
}

function importedRuleSource(rule: WebTranslationRule): WebTranslationRuleSource {
  return STABLE_RUNTIME_FIELDS.some((field) => hasRuntimeValue(rule[field]))
    ? "imported-stable"
    : "imported-experimental";
}

function hasRuntimeValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}
