import { SAFE_TRANSLATABLE_ATTRIBUTES } from "./domScanner";
import type { DynamicMode } from "../shared/config";
import type { TranslatableAttributeName } from "../shared/types";

export type DynamicTranslationMode = DynamicMode;
export type DynamicModeSource = "global" | "site-default" | "site-override";

export type SitePolicy = {
  hostname: string;
  siteKey: string;
  dynamicModeSource: DynamicModeSource;
  isHighDynamic: boolean;
  dynamicMode: DynamicTranslationMode;
  attributeNames: readonly TranslatableAttributeName[];
  debounceMs: number;
  lazyRootMargin: string;
  lazyThreshold: number;
  maxQueueSize: number;
  maxRootsPerFlush: number;
  maxObservedRoots: number;
  maxMutationNodesPerWindow: number;
  mutationWindowMs: number;
  excludedDynamicSelectors: readonly string[];
};

export type SitePolicyOptions = {
  siteDynamicMode?: DynamicMode;
};

export const DEFAULT_EXCLUDED_DYNAMIC_SELECTORS = [
  '[data-imt-managed="true"]',
  '[data-imt-skip="true"]',
  '[data-imt-state="translated"]',
  '[translate="no"]',
  ".notranslate",
  '[role="tooltip"]',
  "[popover]",
  "script",
  "style",
  "template",
  "noscript",
  "svg",
  "canvas",
  "textarea",
  "input",
  "select",
  "button",
  "nav",
  "menu",
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
] as const;

const TWITTER_EXCLUDED_DYNAMIC_SELECTORS = [
  ...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  '[data-testid="HoverCard"]',
  '[data-testid="hoverCardParent"]',
  '[data-testid="placementTracking"]',
  '[aria-live="polite"]',
] as const;

const YOUTUBE_EXCLUDED_DYNAMIC_SELECTORS = [
  ...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  "ytd-popup-container",
  "tp-yt-iron-dropdown",
  "ytd-menu-renderer",
  "ytd-button-renderer",
  "yt-icon",
  ".ytp-chrome-bottom",
  ".ytp-chrome-top",
  ".ytp-button",
  "#hover-overlays",
] as const;

const REDDIT_EXCLUDED_DYNAMIC_SELECTORS = [
  ...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  "faceplate-hovercard",
  "faceplate-tooltip",
  "shreddit-post-overflow-menu",
  "shreddit-comment-overflow-menu",
  "faceplate-tracker",
  "faceplate-number",
] as const;

const DEFAULT_SITE_POLICY: SitePolicy = {
  hostname: "",
  siteKey: "",
  dynamicModeSource: "global",
  isHighDynamic: false,
  dynamicMode: "normal",
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  debounceMs: 1500,
  lazyRootMargin: "200px",
  lazyThreshold: 0.1,
  maxQueueSize: 300,
  maxRootsPerFlush: 20,
  maxObservedRoots: 300,
  maxMutationNodesPerWindow: 1000,
  mutationWindowMs: 5000,
  excludedDynamicSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
};

const CONSERVATIVE_DYNAMIC_LIMITS = {
  dynamicMode: "conservative",
  debounceMs: 3000,
  lazyRootMargin: "120px",
  maxQueueSize: 80,
  maxRootsPerFlush: 6,
  maxObservedRoots: 80,
  maxMutationNodesPerWindow: 240,
} satisfies Partial<SitePolicy>;

const NORMAL_DYNAMIC_LIMITS = {
  dynamicMode: "normal",
  debounceMs: DEFAULT_SITE_POLICY.debounceMs,
  lazyRootMargin: DEFAULT_SITE_POLICY.lazyRootMargin,
  maxQueueSize: DEFAULT_SITE_POLICY.maxQueueSize,
  maxRootsPerFlush: DEFAULT_SITE_POLICY.maxRootsPerFlush,
  maxObservedRoots: DEFAULT_SITE_POLICY.maxObservedRoots,
  maxMutationNodesPerWindow: DEFAULT_SITE_POLICY.maxMutationNodesPerWindow,
} satisfies Partial<SitePolicy>;

const TWITTER_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...CONSERVATIVE_DYNAMIC_LIMITS,
  attributeNames: [],
  excludedDynamicSelectors: TWITTER_EXCLUDED_DYNAMIC_SELECTORS,
};

const YOUTUBE_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...CONSERVATIVE_DYNAMIC_LIMITS,
  excludedDynamicSelectors: YOUTUBE_EXCLUDED_DYNAMIC_SELECTORS,
};

const REDDIT_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...CONSERVATIVE_DYNAMIC_LIMITS,
  excludedDynamicSelectors: REDDIT_EXCLUDED_DYNAMIC_SELECTORS,
};

export function resolveSitePolicy(
  hostname: string = globalThis.location?.hostname ?? "",
  preferredDynamicMode: DynamicMode = "normal",
  options: SitePolicyOptions = {},
): SitePolicy {
  const normalizedHostname = normalizeHostname(hostname);
  const match = resolveBasePolicy(normalizedHostname);
  const base = {
    ...match.policy,
    hostname: normalizedHostname,
    siteKey: match.siteKey,
    isHighDynamic: match.isHighDynamic,
  };

  if (options.siteDynamicMode) {
    return {
      ...applyDynamicMode(base, options.siteDynamicMode),
      dynamicModeSource: "site-override",
    };
  }

  if (preferredDynamicMode === "off" || preferredDynamicMode === "conservative") {
    return {
      ...applyDynamicMode(base, preferredDynamicMode),
      dynamicModeSource: "global",
    };
  }

  return {
    ...base,
    dynamicModeSource: match.isHighDynamic ? "site-default" : "global",
  };
}

export function resolveSitePolicyKey(hostname: string = globalThis.location?.hostname ?? ""): string {
  return resolveBasePolicy(normalizeHostname(hostname)).siteKey;
}

function resolveBasePolicy(hostname: string): { policy: SitePolicy; siteKey: string; isHighDynamic: boolean } {
  if (matchesDomain(hostname, "x.com") || matchesDomain(hostname, "twitter.com")) {
    return {
      policy: TWITTER_SITE_POLICY,
      siteKey: matchesDomain(hostname, "twitter.com") ? "twitter.com" : "x.com",
      isHighDynamic: true,
    };
  }
  if (matchesDomain(hostname, "youtube.com")) {
    return { policy: YOUTUBE_SITE_POLICY, siteKey: "youtube.com", isHighDynamic: true };
  }
  if (matchesDomain(hostname, "reddit.com")) {
    return { policy: REDDIT_SITE_POLICY, siteKey: "reddit.com", isHighDynamic: true };
  }
  return { policy: DEFAULT_SITE_POLICY, siteKey: hostname, isHighDynamic: false };
}

function applyDynamicMode(policy: SitePolicy, dynamicMode: DynamicMode): SitePolicy {
  if (dynamicMode === "off") return { ...policy, dynamicMode: "off" };
  if (dynamicMode === "conservative") return { ...policy, ...CONSERVATIVE_DYNAMIC_LIMITS };
  return { ...policy, ...NORMAL_DYNAMIC_LIMITS };
}

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}
