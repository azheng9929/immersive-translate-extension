import type { WebTranslationRule } from "./webRuleTypes";

export function matchWebTranslationRule(
  url: string,
  doc: Document | undefined,
  rules: readonly WebTranslationRule[],
): WebTranslationRule | undefined {
  return rules.find((rule) => hasSelectorConditions(rule) && matchesRule(url, doc, rule)) ??
    rules.find((rule) => !hasSelectorConditions(rule) && matchesRule(url, doc, rule));
}

export function selectWebTranslationRulesForContent(
  url: string,
  rules: readonly WebTranslationRule[],
): WebTranslationRule[] {
  const selectorRules = rules.filter(hasSelectorConditions);
  const matchedUrlRule = rules.find((rule) => !hasSelectorConditions(rule) && matchesUrlOnly(url, rule));
  return matchedUrlRule ? [...selectorRules, matchedUrlRule] : selectorRules;
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
  return Boolean(matches.length || hasSelectorConditions(rule));
}

function matchesRule(url: string, doc: Document | undefined, rule: WebTranslationRule): boolean {
  const matches = listValue(rule.matches);
  const excludeMatches = listValue(rule.excludeMatches);
  const selectorMatches = listValue(rule.selectorMatches);
  const excludeSelectorMatches = listValue(rule.excludeSelectorMatches);
  if (matches.length && !matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (excludeMatches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (selectorMatches.length && (!doc || !selectorMatches.some((selector) => hasSelector(doc, selector)))) {
    return false;
  }
  if (doc && excludeSelectorMatches.some((selector) => hasSelector(doc, selector))) return false;
  return true;
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
