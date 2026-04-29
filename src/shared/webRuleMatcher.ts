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

function matchesRule(url: string, doc: Document | undefined, rule: WebTranslationRule): boolean {
  if (rule.matches?.length && !rule.matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (rule.excludeMatches?.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  if (rule.selectorMatches?.length && (!doc || !rule.selectorMatches.some((selector) => hasSelector(doc, selector)))) {
    return false;
  }
  if (doc && rule.excludeSelectorMatches?.some((selector) => hasSelector(doc, selector))) return false;
  return true;
}

function matchesUrlOnly(url: string, rule: WebTranslationRule): boolean {
  if (!rule.matches?.length) return false;
  if (!rule.matches.some((pattern) => matchesUrlPattern(url, pattern))) return false;
  return !rule.excludeMatches?.some((pattern) => matchesUrlPattern(url, pattern));
}

function hasSelectorConditions(rule: WebTranslationRule): boolean {
  return Boolean(rule.selectorMatches?.length || rule.excludeSelectorMatches?.length);
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
