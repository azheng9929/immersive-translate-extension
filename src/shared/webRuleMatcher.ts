import type { WebTranslationRule } from "./webRuleTypes";
import { analyzeWebTranslationRuleCapability } from "./webRuleCapability";

export type WebTranslationRuleMatch = {
  rule: WebTranslationRule;
  score: number;
  reasons: readonly string[];
};

export function matchWebTranslationRule(
  url: string,
  doc: Document | undefined,
  rules: readonly WebTranslationRule[],
): WebTranslationRule | undefined {
  return matchWebTranslationRulesRanked(url, doc, rules)[0]?.rule;
}

export function matchWebTranslationRulesRanked(
  url: string,
  doc: Document | undefined,
  rules: readonly WebTranslationRule[],
): WebTranslationRuleMatch[] {
  return rules
    .map((rule, index) => ({ rule, index, match: matchRuleWithReasons(url, doc, rule) }))
    .filter((entry) => entry.match.matched)
    .map((entry) => ({
      rule: entry.rule,
      score: scoreRuleMatch(url, entry.rule, entry.match.reasons) - entry.index / 1000,
      reasons: entry.match.reasons,
    }))
    .sort((left, right) => right.score - left.score);
}

export function selectWebTranslationRulesForContent(
  url: string,
  rules: readonly WebTranslationRule[],
): WebTranslationRule[] {
  return rules.filter((rule) => mayWebTranslationRuleMatchUrl(url, rule));
}

export function selectPotentialWebTranslationRulesForUrl(
  url: string,
  rules: readonly WebTranslationRule[],
): WebTranslationRule[] {
  return rules.filter((rule) => mayWebTranslationRuleMatchUrl(url, rule));
}

export function filterMatchingWebTranslationRules(
  url: string,
  doc: Document | undefined,
  rules: readonly WebTranslationRule[],
): WebTranslationRule[] {
  return rules.filter((rule) => matchesRule(url, doc, rule));
}

export function mayWebTranslationRuleMatchUrl(url: string, rule: WebTranslationRule): boolean {
  const matches = listValue(rule.matches);
  const excludeMatches = listValue(rule.excludeMatches);
  if (matches.length && !matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (excludeMatches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  return Boolean(matches.length || isGlobalSelectorRule(rule));
}

function matchesRule(url: string, doc: Document | undefined, rule: WebTranslationRule): boolean {
  return matchRuleWithReasons(url, doc, rule).matched;
}

function matchRuleWithReasons(
  url: string,
  doc: Document | undefined,
  rule: WebTranslationRule,
): { matched: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const matches = listValue(rule.matches);
  const excludeMatches = listValue(rule.excludeMatches);
  const selectorMatches = listValue(rule.selectorMatches);
  const excludeSelectorMatches = listValue(rule.excludeSelectorMatches);
  if (!matches.length && hasSelectorConditions(rule) && !isGlobalSelectorRule(rule)) {
    return { matched: false, reasons: ["selector-only-without-global-scope"] };
  }
  if (matches.length) {
    if (!matches.some((pattern) => matchesUrlPattern(url, pattern))) return { matched: false, reasons: ["url-miss"] };
    reasons.push("url");
  }
  if (excludeMatches.some((pattern) => matchesUrlPattern(url, pattern))) return { matched: false, reasons: ["url-excluded"] };
  if (selectorMatches.length && (!doc || !selectorMatches.some((selector) => hasSelector(doc, selector)))) {
    return { matched: false, reasons: ["selector-miss"] };
  }
  if (selectorMatches.length) reasons.push("selector");
  if (doc && excludeSelectorMatches.some((selector) => hasSelector(doc, selector))) {
    return { matched: false, reasons: ["selector-excluded"] };
  }
  return { matched: true, reasons };
}

function matchesUrlOnly(url: string, rule: WebTranslationRule): boolean {
  const matches = listValue(rule.matches);
  if (!matches.length) return false;
  if (!matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  return !listValue(rule.excludeMatches).some((pattern) => matchesUrlPattern(url, pattern));
}

function hasSelectorConditions(rule: WebTranslationRule): boolean {
  return Boolean(listValue(rule.selectorMatches).length || listValue(rule.excludeSelectorMatches).length);
}

function isGlobalSelectorRule(rule: WebTranslationRule): boolean {
  return Boolean(rule.globalSelectorRule || (rule as WebTranslationRule & { globalShapeRule?: boolean }).globalShapeRule);
}

function scoreRuleMatch(url: string, rule: WebTranslationRule, reasons: readonly string[]): number {
  const sourceScore = sourcePriority(rule);
  const urlScore = urlSpecificityScore(url, rule);
  const selectorScore = reasons.includes("selector") || hasSelectorConditions(rule) ? 18 : 0;
  const capabilityScore = capabilityPriority(rule);
  const globalSelectorPenalty = !listValue(rule.matches).length && isGlobalSelectorRule(rule) ? -28 : 0;
  return sourceScore + urlScore + selectorScore + capabilityScore + globalSelectorPenalty;
}

function sourcePriority(rule: WebTranslationRule): number {
  switch (rule.ruleSource) {
    case "core":
    case "core+imported":
      return 400;
    case "imported-stable":
      return 240;
    case "imported-experimental":
      return 80;
    default:
      return 320;
  }
}

function capabilityPriority(rule: WebTranslationRule): number {
  const capability = analyzeWebTranslationRuleCapability(rule).capability;
  switch (capability) {
    case "content-ready":
      return 70;
    case "scope-ready":
      return 50;
    case "structure-only":
      return 35;
    case "modifier-only":
      return 25;
    case "match-only":
      return 5;
    case "unsafe":
      return -100;
  }
}

function urlSpecificityScore(url: string, rule: WebTranslationRule): number {
  const matches = listValue(rule.matches);
  if (!matches.length) return 0;
  const matchingPatterns = matches.filter((pattern) => matchesUrlPattern(url, pattern));
  if (!matchingPatterns.length) return 0;
  return Math.max(...matchingPatterns.map(patternSpecificityScore));
}

function patternSpecificityScore(pattern: string): number {
  const normalized = pattern.trim().toLowerCase();
  let score = 20;
  if (normalized.includes("://")) score += 12;
  if (normalized.includes("/")) score += 12;
  if (!normalized.includes("*")) score += 10;
  score += Math.min(24, normalized.replace(/\*/g, "").length / 3);
  return score;
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

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return undefined;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

function listValue<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value as readonly T[] : [value as T];
}
