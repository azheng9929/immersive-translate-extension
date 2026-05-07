import type { WebTranslationGlobalAttributes, WebTranslationRule, WebTranslationRuleSource } from "./webRuleTypes";
import { analyzeWebTranslationRuleCapability } from "./webRuleCapability";

const SUPPORTED_RULE_KEYS = new Set([
  "id",
  "ruleSource",
  "ruleCapability",
  "fallbackProfile",
  "globalSelectorRule",
  "selectorFallbackPolicy",
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
  "attributeBudget",
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
const BROAD_PAGE_STYLE_SELECTOR_PATTERN = /^\s*(?:html|body|\*|:root)\s*$/i;
const PAGE_HIDING_STYLE_PATTERN = /(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0\b|position\s*:\s*fixed|pointer-events\s*:\s*none|z-index\s*:|overflow\s*:\s*hidden)/i;
const UNSAFE_GLOBAL_ATTRIBUTE_PATTERN = /^on/i;
const SAFE_GLOBAL_ATTRIBUTE_PATTERN = /^(?:class|translate|lang|dir|title|data-[\w:-]+|aria-[\w:-]+)$/i;
const CSS_NETWORK_LOAD_PATTERN = /(?:@import\b|url\s*\()/i;

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
  "attributeBudget",
  "mainFrameSelector",
  "mainFrameMinTextCount",
  "mainFrameMinWordCount",
  "bodyRule",
  "containerMinTextCount",
  "lineBreakMaxTextCount",
  "dynamicPreset",
  "isHighDynamic",
  "aiRule",
  "advanceMergeConfig",
] as const satisfies readonly (keyof WebTranslationRule)[];

export function prepareImportedWebTranslationRules(rules: readonly WebTranslationRule[]): WebTranslationRule[] {
  const prepared: WebTranslationRule[] = [];

  for (const rule of rules) {
    const supported = normalizeAiRuleForWebRuntime(sanitizeImportedRule(pickSupportedRuleFields(rule)));
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

function sanitizeImportedRule(rule: WebTranslationRule): WebTranslationRule {
  const output: WebTranslationRule = { ...rule };

  if (rule.globalStyles !== undefined) {
    setOrDelete(output, "globalStyles", sanitizeRecordRuleValue(rule.globalStyles, sanitizeGlobalStyles));
  }
  if (rule.injectedCss !== undefined) {
    setOrDelete(output, "injectedCss", sanitizeArrayRuleValue(rule.injectedCss, sanitizeInjectedCssList));
  }
  if (rule.additionalInjectedCss !== undefined) {
    setOrDelete(output, "additionalInjectedCss", sanitizeArrayRuleValue(rule.additionalInjectedCss, sanitizeInjectedCssList));
  }
  if (rule.globalAttributes !== undefined) {
    setOrDelete(output, "globalAttributes", sanitizeRecordRuleValue(rule.globalAttributes, sanitizeGlobalAttributes));
  }

  return output;
}

function normalizeAiRuleForWebRuntime(rule: WebTranslationRule): WebTranslationRule {
  const aiRule = aiRuleRecord(rule.aiRule);
  if (!aiRule) return rule;

  const messageWrapperSelector = stringValue(aiRule.messageWrapperSelector);
  const messageContainerSelector = stringValue(aiRule.messageContainerSelector);
  const streamingSelector = stringValue(aiRule.streamingSelector);
  const primarySelector = messageContainerSelector ?? messageWrapperSelector;
  if (!primarySelector) return rule;

  const selectorAdditions = uniqueStrings([
    primarySelector,
    ...(messageWrapperSelector && messageWrapperSelector !== primarySelector ? [messageWrapperSelector] : []),
    ...(streamingSelector && selectorIncludesSelector(streamingSelector, primarySelector) ? [streamingSelector] : []),
  ]);
  const excludeSelectors = stripAiMessageWrapperExcludes(rule.excludeSelectors, [
    primarySelector,
    ...(messageWrapperSelector ? [messageWrapperSelector] : []),
  ]);
  const streamingDelayTime = numericValue(aiRule.streamingDelayTime);
  const output: WebTranslationRule = {
    ...rule,
    selectors: appendStringDeltas(rule.selectors, selectorAdditions),
    contentSelectors: appendArrayDeltas(rule.contentSelectors, [{ selector: primarySelector, category: "comment" as const }]),
    dynamicPreset: rule.dynamicPreset ?? "chat-stream",
    isHighDynamic: rule.isHighDynamic ?? true,
    allowTooltip: rule.allowTooltip ?? false,
    observeUrlChange: rule.observeUrlChange ?? true,
    ...(streamingDelayTime !== undefined ? { debounceMs: streamingDelayTime } : {}),
    fallbackProfile: rule.fallbackProfile ?? "social",
  };

  if (excludeSelectors === undefined) delete output.excludeSelectors;
  else output.excludeSelectors = excludeSelectors;

  return output;
}

function aiRuleRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function selectorIncludesSelector(selector: string, expected: string): boolean {
  return normalizeSelectorText(selector).includes(normalizeSelectorText(expected));
}

function stripAiMessageWrapperExcludes(
  excludeSelectors: WebTranslationRule["excludeSelectors"],
  messageSelectors: readonly string[],
): WebTranslationRule["excludeSelectors"] {
  const stripped = arrayValue(excludeSelectors).filter((selector) =>
    !isAiMessageWrapperDescendantExclude(String(selector), messageSelectors),
  );
  if (stripped.length === 0) return undefined;
  return stripped;
}

function isAiMessageWrapperDescendantExclude(selector: string, messageSelectors: readonly string[]): boolean {
  const normalized = normalizeSelectorText(selector);
  return messageSelectors.some((messageSelector) => normalized === `${normalizeSelectorText(messageSelector)} *`);
}

function appendStringDeltas(
  value: WebTranslationRule["selectors"],
  additions: readonly string[],
): NonNullable<WebTranslationRule["selectors"]> {
  return appendArrayDeltas(value, additions);
}

function appendArrayDeltas<T>(
  value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] } | undefined,
  additions: readonly T[],
): { replace?: T | readonly T[]; add: readonly T[]; remove?: T | readonly T[] } {
  if (isArrayOperation(value)) {
    return {
      ...(value.replace !== undefined ? { replace: value.replace } : {}),
      add: uniqueGeneric([...listValue(value.add), ...additions]),
      ...(value.remove !== undefined ? { remove: value.remove } : {}),
    };
  }
  return {
    ...(value !== undefined ? { replace: listValue(value) } : {}),
    add: uniqueGeneric(additions),
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return uniqueGeneric(values).filter(Boolean);
}

function uniqueGeneric<T>(values: readonly T[]): T[] {
  return [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];
}

function normalizeSelectorText(selector: string): string {
  return selector.trim().replace(/\s+/g, " ");
}

function setOrDelete<Key extends keyof WebTranslationRule>(
  rule: WebTranslationRule,
  key: Key,
  value: WebTranslationRule[Key] | undefined,
): void {
  if (value === undefined || isEmptyRuntimeValue(value)) {
    delete rule[key];
    return;
  }
  rule[key] = value;
}

function sanitizeGlobalStyles(styles: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  const output: Record<string, string> = {};
  for (const [selector, style] of Object.entries(styles)) {
    if (!selector.trim() || BROAD_PAGE_STYLE_SELECTOR_PATTERN.test(selector)) continue;
    if (CSS_NETWORK_LOAD_PATTERN.test(style)) continue;
    output[selector] = style;
  }
  return output;
}

function sanitizeInjectedCssList(cssRules: readonly string[]): readonly string[] {
  return cssRules
    .map((css) => css.trim())
    .filter((css) => css.length > 0 && !hasBroadPageStyleMutation(css));
}

function hasBroadPageStyleMutation(css: string): boolean {
  if (CSS_NETWORK_LOAD_PATTERN.test(css)) return true;
  return css.split("}").some((block) => {
    const [selectorText, styleText] = block.split("{");
    if (!selectorText || !styleText || !PAGE_HIDING_STYLE_PATTERN.test(styleText)) return false;
    return selectorText.split(",").some((selector) => BROAD_PAGE_STYLE_SELECTOR_PATTERN.test(selector));
  });
}

function sanitizeGlobalAttributes(attributes: WebTranslationGlobalAttributes): WebTranslationGlobalAttributes {
  const output: Record<string, Record<string, string | null>> = {};

  for (const [selector, selectorAttributes] of Object.entries(attributes)) {
    if (!selector.trim()) continue;
    const safeAttributes: Record<string, string | null> = {};
    for (const [attribute, value] of Object.entries(selectorAttributes)) {
      if (UNSAFE_GLOBAL_ATTRIBUTE_PATTERN.test(attribute)) continue;
      if (!SAFE_GLOBAL_ATTRIBUTE_PATTERN.test(attribute)) continue;
      safeAttributes[attribute] = value;
    }
    if (Object.keys(safeAttributes).length > 0) output[selector] = safeAttributes;
  }

  return output;
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

function arrayValue<T>(
  value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] } | undefined,
): readonly T[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (!isArrayOperation(value)) return [value as T];
  return listValue(value.replace ?? value.add);
}

function isArrayOperation<T>(
  value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] } | undefined,
): value is { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] } {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("replace" in value || "add" in value || "remove" in value),
  );
}

function sanitizeArrayRuleValue<T>(
  value: T | readonly T[] | { replace?: T | readonly T[]; add?: T | readonly T[]; remove?: T | readonly T[] },
  sanitize: (values: readonly T[]) => readonly T[],
): T | readonly T[] | { replace?: readonly T[]; add?: readonly T[]; remove?: readonly T[] } | undefined {
  if (!isArrayOperation(value)) return sanitize(listValue(value));

  const replace = value.replace !== undefined ? sanitize(listValue(value.replace)) : undefined;
  const add = value.add !== undefined ? sanitize(listValue(value.add)) : undefined;
  const remove = value.remove !== undefined ? listValue(value.remove) : undefined;
  if (!replace?.length && !add?.length && !remove?.length) return undefined;
  return {
    ...(replace?.length ? { replace } : {}),
    ...(add?.length ? { add } : {}),
    ...(remove?.length ? { remove } : {}),
  };
}

function sanitizeRecordRuleValue<T>(
  value: Readonly<Record<string, T>> | {
    replace?: Readonly<Record<string, T>>;
    add?: Readonly<Record<string, T>>;
    remove?: readonly string[];
  },
  sanitize: (values: Readonly<Record<string, T>>) => Readonly<Record<string, T>>,
): Readonly<Record<string, T>> | {
  replace?: Readonly<Record<string, T>>;
  add?: Readonly<Record<string, T>>;
  remove?: readonly string[];
} | undefined {
  if (!isRecordOperation(value)) return sanitize(plainRecordValue(value));

  const replace = value.replace !== undefined ? sanitize(plainRecordValue(value.replace)) : undefined;
  const add = value.add !== undefined ? sanitize(plainRecordValue(value.add)) : undefined;
  const remove = value.remove;
  if (!Object.keys(replace ?? {}).length && !Object.keys(add ?? {}).length && !remove?.length) return undefined;
  return {
    ...(replace && Object.keys(replace).length ? { replace } : {}),
    ...(add && Object.keys(add).length ? { add } : {}),
    ...(remove?.length ? { remove } : {}),
  };
}

function plainRecordValue<T>(
  value: Readonly<Record<string, T>> | {
    replace?: Readonly<Record<string, T>>;
    add?: Readonly<Record<string, T>>;
    remove?: readonly string[];
  } | undefined,
): Readonly<Record<string, T>> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  if (isRecordOperation(value)) return { ...(value.replace ?? {}), ...(value.add ?? {}) };
  return { ...(value as Readonly<Record<string, T>>) };
}

function isRecordOperation<T>(
  value: Readonly<Record<string, T>> | {
    replace?: Readonly<Record<string, T>>;
    add?: Readonly<Record<string, T>>;
    remove?: readonly string[];
  },
): value is {
  replace?: Readonly<Record<string, T>>;
  add?: Readonly<Record<string, T>>;
  remove?: readonly string[];
} {
  return "replace" in value || "add" in value || "remove" in value;
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

function isEmptyRuntimeValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
