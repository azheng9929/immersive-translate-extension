import type {
  RuleArrayValue,
  RuleContentSelector,
  WebTranslationFallbackProfile,
  WebTranslationRule,
  WebTranslationRuleCapability,
} from "./webRuleTypes";

export type WebTranslationRuleCapabilitySummary = {
  capability: WebTranslationRuleCapability;
  fallbackProfile: WebTranslationFallbackProfile;
  hasContentAnchors: boolean;
  hasLayoutHints: boolean;
  hasStructureHints: boolean;
  hasDynamicHints: boolean;
  contentAnchorCount: number;
  reasons: readonly string[];
};

const VIDEO_HINTS = [
  "youtube",
  "youtu.be",
  "pornhub",
  "xvideos",
  "youporn",
  "vimeo",
  "twitch",
  "bilibili",
  "dailymotion",
  "tiktok",
] as const;

const SOCIAL_HINTS = [
  "twitter",
  "x.com",
  "threads",
  "facebook",
  "instagram",
  "mastodon",
  "discord",
  "telegram",
] as const;

const FORUM_HINTS = ["reddit", "stackoverflow", "stackexchange", "hackernews", "news.ycombinator"] as const;

const COMMERCE_HINTS = ["amazon", "aliexpress", "shop", "store", "product", "taobao", "tmall", "jd.com"] as const;

const ARTICLE_HINTS = [
  "docs",
  "documentation",
  "wiki",
  "wikipedia",
  "medium",
  "substack",
  "news",
  "blog",
  "article",
  "reuters",
  "bbc",
  "cnn",
] as const;

export function analyzeWebTranslationRuleCapability(rule: WebTranslationRule): WebTranslationRuleCapabilitySummary {
  const contentAnchorCount = countContentAnchors(rule);
  const hasContentAnchors = contentAnchorCount > 0;
  const hasLayoutHints = hasAnyRecordValue(rule.globalStyles) || hasAnyArrayValue(rule.injectedCss);
  const hasStructureHints = [
    rule.extraBlockSelectors,
    rule.extraInlineSelectors,
    rule.atomicBlockSelectors,
    rule.buildContainerSelectors,
    rule.skipBuildContainerSelectors,
    rule.stayOriginalSelectors,
    rule.stayOriginalTags,
  ].some(hasAnyArrayValue);
  const hasDynamicHints = Boolean(
    rule.observeUrlChange !== undefined ||
      rule.urlChangeDelay !== undefined ||
      rule.dynamicPreset ||
      rule.isHighDynamic ||
      rule.advanceMergeConfig?.length,
  );
  const derivedCapability = deriveCapability({
    hasContentAnchors,
    hasLayoutHints,
    hasStructureHints,
    hasDynamicHints,
  });
  const capability = rule.ruleCapability ?? derivedCapability;
  const fallbackProfile = rule.fallbackProfile ?? inferFallbackProfile(rule);

  return {
    capability,
    fallbackProfile,
    hasContentAnchors,
    hasLayoutHints,
    hasStructureHints,
    hasDynamicHints,
    contentAnchorCount,
    reasons: capabilityReasons({
      contentAnchorCount,
      hasLayoutHints,
      hasStructureHints,
      hasDynamicHints,
    }),
  };
}

function deriveCapability(input: {
  hasContentAnchors: boolean;
  hasLayoutHints: boolean;
  hasStructureHints: boolean;
  hasDynamicHints: boolean;
}): WebTranslationRuleCapability {
  if (input.hasContentAnchors) return "content-ready";
  if (input.hasLayoutHints) return "modifier-only";
  if (input.hasStructureHints || input.hasDynamicHints) return "structure-only";
  return "match-only";
}

function countContentAnchors(rule: WebTranslationRule): number {
  return [
    ...arrayValue(rule.selectors),
    ...arrayValue<RuleContentSelector>(rule.contentSelectors).map((entry) => entry.selector),
    rule.mainFrameSelector,
    rule.bodyRule?.bodySelector,
    rule.bodyRule?.articleSelector,
  ].filter(Boolean).length;
}

function inferFallbackProfile(rule: WebTranslationRule): WebTranslationFallbackProfile {
  const text = [
    rule.id,
    rule.siteKey,
    ...(rule.matches ?? []),
    ...(rule.selectorMatches ?? []),
  ].join("\n").toLowerCase();

  if (hasHint(text, VIDEO_HINTS)) return "video";
  if (hasHint(text, FORUM_HINTS)) return "forum";
  if (hasHint(text, SOCIAL_HINTS)) return "social";
  if (hasHint(text, COMMERCE_HINTS)) return "commerce";
  if (hasHint(text, ARTICLE_HINTS)) return "article";
  return "generic";
}

function hasHint(text: string, hints: readonly string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

function hasAnyArrayValue(value: RuleArrayValue<unknown> | undefined): boolean {
  return arrayValue(value).length > 0;
}

function hasAnyRecordValue(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as { replace?: unknown; add?: unknown; remove?: unknown } & Record<string, unknown>;
  if (record.replace && typeof record.replace === "object") return Object.keys(record.replace).length > 0;
  if (record.add && typeof record.add === "object") return Object.keys(record.add).length > 0;
  return Object.keys(record).some((key) => !["replace", "add", "remove"].includes(key));
}

function arrayValue<T>(value: RuleArrayValue<T> | undefined): readonly T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const operation = value as { replace?: readonly T[]; add?: readonly T[] };
  return operation.replace ?? operation.add ?? [];
}

function capabilityReasons(input: {
  contentAnchorCount: number;
  hasLayoutHints: boolean;
  hasStructureHints: boolean;
  hasDynamicHints: boolean;
}): readonly string[] {
  const reasons: string[] = [];
  if (input.contentAnchorCount > 0) reasons.push(`${input.contentAnchorCount} content anchors`);
  if (input.hasLayoutHints) reasons.push("layout hints");
  if (input.hasStructureHints) reasons.push("structure hints");
  if (input.hasDynamicHints) reasons.push("dynamic hints");
  return reasons;
}
