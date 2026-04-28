import { SAFE_TRANSLATABLE_ATTRIBUTES } from "./domScanner";
import type { TranslatableAttributeName } from "../shared/types";

export type DynamicTranslationMode = "off" | "conservative" | "normal";

export type SitePolicy = {
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

const DEFAULT_SITE_POLICY: SitePolicy = {
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

const TWITTER_SITE_POLICY: SitePolicy = {
  ...DEFAULT_SITE_POLICY,
  dynamicMode: "conservative",
  attributeNames: [],
  debounceMs: 3000,
  lazyRootMargin: "120px",
  maxQueueSize: 80,
  maxRootsPerFlush: 6,
  maxObservedRoots: 80,
  maxMutationNodesPerWindow: 240,
  excludedDynamicSelectors: TWITTER_EXCLUDED_DYNAMIC_SELECTORS,
};

export function resolveSitePolicy(hostname: string = globalThis.location?.hostname ?? ""): SitePolicy {
  const normalizedHostname = hostname.toLowerCase();
  if (
    normalizedHostname === "x.com" ||
    normalizedHostname.endsWith(".x.com") ||
    normalizedHostname === "twitter.com" ||
    normalizedHostname.endsWith(".twitter.com")
  ) {
    return TWITTER_SITE_POLICY;
  }
  return DEFAULT_SITE_POLICY;
}
