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
  preferredScanRootSelectors: readonly string[];
  allowTooltip: boolean;
  debounceMs: number;
  lazyRootMargin: string;
  lazyThreshold: number;
  eagerLazyRootMargin: string;
  maxEagerLazyRoots: number;
  maxQueueSize: number;
  maxRootsPerFlush: number;
  maxObservedRoots: number;
  maxMutationNodesPerWindow: number;
  mutationWindowMs: number;
  excludedDynamicSelectors: readonly string[];
  injectedCss: readonly string[];
};

export type SitePolicyOptions = {
  siteDynamicMode?: DynamicMode;
};

export const DEFAULT_EXCLUDED_DYNAMIC_SELECTORS = [
  '[data-imt-managed="true"]',
  '[data-imt-skip="true"]',
  '[data-imt-state="loading"]',
  '[data-imt-state="translated"]',
  '[translate="no"]',
  ".notranslate",
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

const TOOLTIP_DYNAMIC_SELECTORS = ['[role="tooltip"]', "[popover]"] as const;

const TWITTER_EXCLUDED_DYNAMIC_SELECTORS = [
  ...DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  ...TOOLTIP_DYNAMIC_SELECTORS,
  '[data-testid="HoverCard"]',
  '[data-testid="hoverCardParent"]',
  '[data-testid="placementTracking"]',
  '[aria-live="polite"]',
  '[data-testid="sidebarColumn"]',
  '[aria-label="Timeline: Trending now"]',
  '[data-testid="SearchBox_Search_Input"]',
  '[data-testid="User-Name"]',
  '[data-testid="UserName"]',
  '[data-testid="UserCell"]',
  '[data-testid="suggestedUserHover"]',
  '[data-testid="reply"]',
  '[data-testid="retweet"]',
  '[data-testid="like"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
  '[data-testid="analytics"]',
  '[role="group"][aria-label]',
  'header[role="banner"]',
  "aside",
  "time",
] as const;

const TWITTER_PREFERRED_SCAN_ROOT_SELECTORS = [
  'article[data-testid="tweet"] div[data-testid="tweetText"]',
  'div[data-testid="tweetText"]',
  'div[data-testid="UserDescription"]',
  '[data-testid="birdwatch-pivot"]',
  '[data-testid="tweetTextarea_0RichTextInputContainer"]',
  '[data-testid="card.layoutSmall.detail"] > div:nth-child(2)',
  '[data-testid="developerBuiltCardContainer"] > div:nth-child(2)',
  '[data-testid="card.layoutLarge.detail"] > div:nth-child(2)',
] as const;

const TWITTER_INJECTED_CSS = [
  `
[data-testid="tweetText"],
[data-testid="tweetText"] *,
[data-testid="UserDescription"],
[data-testid="UserDescription"] *,
[data-testid="card.layoutSmall.detail"],
[data-testid="card.layoutLarge.detail"] {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
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

const YOUTUBE_PREFERRED_SCAN_ROOT_SELECTORS = [
  "ytd-watch-metadata h1",
  "#video-title",
  "#description-inline-expander",
  "#description",
  "#content-text",
  "ytd-comment-view-model #content-text",
  "ytd-transcript-segment-renderer",
  "yt-formatted-string.ytd-channel-name",
] as const;

const YOUTUBE_INJECTED_CSS = [
  `
#video-title,
#description,
#description-inline-expander,
#content-text,
ytd-watch-metadata h1,
ytd-transcript-segment-renderer {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
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

const REDDIT_PREFERRED_SCAN_ROOT_SELECTORS = [
  'shreddit-post [slot="title"]',
  'shreddit-post [slot="text-body"]',
  "shreddit-comment",
  "[data-testid='post-content']",
  "[data-test-id='comment']",
] as const;

const REDDIT_INJECTED_CSS = [
  `
shreddit-post [slot="title"],
shreddit-post [slot="text-body"],
shreddit-comment,
[data-testid="post-content"],
[data-test-id="comment"] {
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
  max-height: none !important;
  overflow: visible !important;
}
`,
] as const;

const DEFAULT_SITE_POLICY: SitePolicy = {
  hostname: "",
  siteKey: "",
  dynamicModeSource: "global",
  isHighDynamic: false,
  dynamicMode: "normal",
  attributeNames: SAFE_TRANSLATABLE_ATTRIBUTES,
  preferredScanRootSelectors: [],
  allowTooltip: true,
  debounceMs: 1500,
  lazyRootMargin: "200px",
  lazyThreshold: 0.1,
  eagerLazyRootMargin: "900px",
  maxEagerLazyRoots: 120,
  maxQueueSize: 300,
  maxRootsPerFlush: 20,
  maxObservedRoots: 300,
  maxMutationNodesPerWindow: 1000,
  mutationWindowMs: 5000,
  excludedDynamicSelectors: DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: [],
};

const CONSERVATIVE_DYNAMIC_LIMITS = {
  dynamicMode: "conservative",
  debounceMs: 3000,
  lazyRootMargin: "120px",
  eagerLazyRootMargin: "400px",
  maxEagerLazyRoots: 40,
  maxQueueSize: 80,
  maxRootsPerFlush: 6,
  maxObservedRoots: 80,
  maxMutationNodesPerWindow: 240,
} satisfies Partial<SitePolicy>;

const TWITTER_FAST_DYNAMIC_LIMITS = {
  dynamicMode: "conservative",
  debounceMs: 1200,
  lazyRootMargin: "700px",
  eagerLazyRootMargin: "900px",
  maxEagerLazyRoots: 80,
  maxQueueSize: 120,
  maxRootsPerFlush: 12,
  maxObservedRoots: 160,
  maxMutationNodesPerWindow: 420,
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

const METATFT_FAST_DYNAMIC_LIMITS = {
  dynamicMode: "normal",
  debounceMs: 500,
  lazyRootMargin: "1400px",
  eagerLazyRootMargin: "1800px",
  maxEagerLazyRoots: 260,
  maxQueueSize: 900,
  maxRootsPerFlush: 90,
  maxObservedRoots: 900,
  maxMutationNodesPerWindow: 2200,
} satisfies Partial<SitePolicy>;

const TACTICS_TOOLS_FAST_DYNAMIC_LIMITS = {
  dynamicMode: "normal",
  debounceMs: 120,
  lazyRootMargin: "1200px",
  eagerLazyRootMargin: "1400px",
  maxEagerLazyRoots: 180,
  maxQueueSize: 300,
  maxRootsPerFlush: 32,
  maxObservedRoots: 500,
  maxMutationNodesPerWindow: 1200,
} satisfies Partial<SitePolicy>;

const TWITTER_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...TWITTER_FAST_DYNAMIC_LIMITS,
  attributeNames: [],
  preferredScanRootSelectors: TWITTER_PREFERRED_SCAN_ROOT_SELECTORS,
  allowTooltip: false,
  excludedDynamicSelectors: TWITTER_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: TWITTER_INJECTED_CSS,
};

const YOUTUBE_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...CONSERVATIVE_DYNAMIC_LIMITS,
  preferredScanRootSelectors: YOUTUBE_PREFERRED_SCAN_ROOT_SELECTORS,
  excludedDynamicSelectors: YOUTUBE_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: YOUTUBE_INJECTED_CSS,
};

const REDDIT_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...CONSERVATIVE_DYNAMIC_LIMITS,
  preferredScanRootSelectors: REDDIT_PREFERRED_SCAN_ROOT_SELECTORS,
  excludedDynamicSelectors: REDDIT_EXCLUDED_DYNAMIC_SELECTORS,
  injectedCss: REDDIT_INJECTED_CSS,
};

const METATFT_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...METATFT_FAST_DYNAMIC_LIMITS,
};

const TACTICS_TOOLS_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  ...TACTICS_TOOLS_FAST_DYNAMIC_LIMITS,
  allowTooltip: true,
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
  if (matchesDomain(hostname, "metatft.com")) {
    return { policy: METATFT_SITE_POLICY, siteKey: "metatft.com", isHighDynamic: true };
  }
  if (matchesDomain(hostname, "tactics.tools")) {
    return { policy: TACTICS_TOOLS_SITE_POLICY, siteKey: "tactics.tools", isHighDynamic: true };
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
