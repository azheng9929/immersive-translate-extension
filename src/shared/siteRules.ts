import type {
  DisplayMode,
  DynamicMode,
  ExtensionProvider,
  FallbackProvider,
  RequestProfile,
  SiteDynamicModeOverrides,
} from "./config";

export type SiteDynamicModeChoice = DynamicMode | "auto";
export type SiteRule = {
  dynamicMode?: DynamicMode;
  displayMode?: DisplayMode;
  provider?: ExtensionProvider;
  fallbackProvider?: FallbackProvider;
  requestProfile?: RequestProfile;
};
export type SiteRules = Record<string, SiteRule>;

const CANONICAL_SITE_KEYS = ["x.com", "twitter.com", "youtube.com", "reddit.com"] as const;
const SUPPORTED_DYNAMIC_MODES = new Set<DynamicMode>(["off", "conservative", "normal"]);
const SUPPORTED_DISPLAY_MODES = new Set<DisplayMode>(["smart", "bilingual", "translation-only"]);
const SUPPORTED_PROVIDERS = new Set<ExtensionProvider>(["fake", "microsoft", "openai-compatible", "gemini"]);
const SUPPORTED_FALLBACK_PROVIDERS = new Set<FallbackProvider>(["none", "fake", "microsoft", "openai-compatible", "gemini"]);
const SUPPORTED_REQUEST_PROFILES = new Set<RequestProfile>(["stable", "balanced", "fast", "high-dynamic"]);

export function normalizeSiteRuleKey(value: string): string {
  let host = value.trim().toLowerCase();
  if (!host) return "";

  host = stripUrlParts(host);
  host = host.replace(/\.$/, "");
  host = host.replace(/^www\./, "");

  if (!/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";

  for (const siteKey of CANONICAL_SITE_KEYS) {
    if (host === siteKey || host.endsWith(`.${siteKey}`)) return siteKey;
  }

  return host;
}

export function setSiteDynamicModeRule(
  current: SiteDynamicModeOverrides,
  site: string,
  dynamicMode: SiteDynamicModeChoice,
): SiteDynamicModeOverrides {
  const siteKey = normalizeSiteRuleKey(site);
  if (!siteKey) return { ...current };

  const next = { ...current };
  if (dynamicMode === "auto") {
    delete next[siteKey];
    return next;
  }

  next[siteKey] = dynamicMode;
  return next;
}

export function normalizeSiteRules(value: unknown): SiteRules {
  if (!isRecord(value)) return {};

  const rules: SiteRules = {};
  for (const [rawSite, rawRule] of Object.entries(value)) {
    const siteKey = normalizeSiteRuleKey(rawSite);
    if (!siteKey) continue;

    const rule = normalizeSiteRule(rawRule);
    if (!rule) continue;
    rules[siteKey] = rule;
  }
  return rules;
}

export function setSiteRule(current: SiteRules, site: string, rule: unknown): SiteRules {
  const siteKey = normalizeSiteRuleKey(site);
  if (!siteKey) return { ...current };

  const next = { ...current };
  const normalizedRule = normalizeSiteRule(rule);
  if (!normalizedRule) {
    delete next[siteKey];
    return next;
  }

  next[siteKey] = normalizedRule;
  return next;
}

function normalizeSiteRule(value: unknown): SiteRule | undefined {
  if (!isRecord(value)) return undefined;

  const rule: SiteRule = {};
  if (typeof value.dynamicMode === "string" && SUPPORTED_DYNAMIC_MODES.has(value.dynamicMode as DynamicMode)) {
    rule.dynamicMode = value.dynamicMode as DynamicMode;
  }
  if (typeof value.displayMode === "string" && SUPPORTED_DISPLAY_MODES.has(value.displayMode as DisplayMode)) {
    rule.displayMode = value.displayMode as DisplayMode;
  }
  if (typeof value.provider === "string" && SUPPORTED_PROVIDERS.has(value.provider as ExtensionProvider)) {
    rule.provider = value.provider as ExtensionProvider;
  }
  if (typeof value.fallbackProvider === "string" && SUPPORTED_FALLBACK_PROVIDERS.has(value.fallbackProvider as FallbackProvider)) {
    rule.fallbackProvider = value.fallbackProvider as FallbackProvider;
  }
  if (typeof value.requestProfile === "string" && SUPPORTED_REQUEST_PROFILES.has(value.requestProfile as RequestProfile)) {
    rule.requestProfile = value.requestProfile as RequestProfile;
  }

  return Object.keys(rule).length > 0 ? rule : undefined;
}

function stripUrlParts(value: string): string {
  const urlLike = value.includes("://") ? value : `https://${value}`;
  try {
    return new URL(urlLike).hostname.toLowerCase();
  } catch {
    return value.split("/")[0]?.split("?")[0]?.split("#")[0]?.replace(/:\d+$/, "") ?? "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
