import type { DynamicMode, SiteDynamicModeOverrides } from "./config";

export type SiteDynamicModeChoice = DynamicMode | "auto";

const CANONICAL_SITE_KEYS = ["x.com", "twitter.com", "youtube.com", "reddit.com"] as const;

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

function stripUrlParts(value: string): string {
  const urlLike = value.includes("://") ? value : `https://${value}`;
  try {
    return new URL(urlLike).hostname.toLowerCase();
  } catch {
    return value.split("/")[0]?.split("?")[0]?.split("#")[0]?.replace(/:\d+$/, "") ?? "";
  }
}
