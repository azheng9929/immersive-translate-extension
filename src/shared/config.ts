export type ExtensionProvider = "fake" | "microsoft" | "openai-compatible";
export type DisplayMode = "smart" | "bilingual" | "translation-only";
export type DynamicMode = "off" | "conservative" | "normal";
export type SiteDynamicModeOverrides = Record<string, DynamicMode>;

export type ExtensionConfig = {
  targetLang: string;
  provider: ExtensionProvider;
  displayMode: DisplayMode;
  dynamicMode: DynamicMode;
  siteDynamicModes: SiteDynamicModeOverrides;
  showFloatingBall: boolean;
  useCache: boolean;
};

export type ExtensionConfigPatch = Partial<ExtensionConfig>;

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  targetLang: "zh-Hans",
  provider: "microsoft",
  displayMode: "smart",
  dynamicMode: "normal",
  siteDynamicModes: {},
  showFloatingBall: true,
  useCache: true,
};

const SUPPORTED_PROVIDERS = new Set<ExtensionProvider>(["fake", "microsoft", "openai-compatible"]);
const SUPPORTED_DISPLAY_MODES = new Set<DisplayMode>(["smart", "bilingual", "translation-only"]);
const SUPPORTED_DYNAMIC_MODES = new Set<DynamicMode>(["off", "conservative", "normal"]);

export function normalizeExtensionConfig(value: unknown): ExtensionConfig {
  const input = isRecord(value) ? value : {};

  return {
    targetLang: normalizeTargetLang(input.targetLang),
    provider: normalizeProvider(input.provider),
    displayMode: normalizeDisplayMode(input.displayMode),
    dynamicMode: normalizeDynamicMode(input.dynamicMode),
    siteDynamicModes: normalizeSiteDynamicModes(input.siteDynamicModes),
    showFloatingBall: normalizeBoolean(input.showFloatingBall, DEFAULT_EXTENSION_CONFIG.showFloatingBall),
    useCache: normalizeBoolean(input.useCache, DEFAULT_EXTENSION_CONFIG.useCache),
  };
}

export function normalizeExtensionConfigPatch(value: unknown): ExtensionConfigPatch {
  if (!isRecord(value)) return {};

  const patch: ExtensionConfigPatch = {};
  if ("targetLang" in value) patch.targetLang = normalizeTargetLang(value.targetLang);
  if ("provider" in value) patch.provider = normalizeProvider(value.provider);
  if ("displayMode" in value) patch.displayMode = normalizeDisplayMode(value.displayMode);
  if ("dynamicMode" in value) patch.dynamicMode = normalizeDynamicMode(value.dynamicMode);
  if ("siteDynamicModes" in value) patch.siteDynamicModes = normalizeSiteDynamicModes(value.siteDynamicModes);
  if ("showFloatingBall" in value) patch.showFloatingBall = normalizeBoolean(value.showFloatingBall, DEFAULT_EXTENSION_CONFIG.showFloatingBall);
  if ("useCache" in value) patch.useCache = normalizeBoolean(value.useCache, DEFAULT_EXTENSION_CONFIG.useCache);
  return patch;
}

export function setSiteDynamicModeOverride(
  current: SiteDynamicModeOverrides,
  siteKey: string,
  dynamicMode: DynamicMode | "auto",
): SiteDynamicModeOverrides {
  const normalizedSiteKey = normalizeSiteKey(siteKey);
  if (!normalizedSiteKey) return { ...current };

  const next = { ...current };
  if (dynamicMode === "auto") {
    delete next[normalizedSiteKey];
    return next;
  }

  next[normalizedSiteKey] = dynamicMode;
  return next;
}

function normalizeTargetLang(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_EXTENSION_CONFIG.targetLang;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_EXTENSION_CONFIG.targetLang;
}

function normalizeProvider(value: unknown): ExtensionProvider {
  return typeof value === "string" && SUPPORTED_PROVIDERS.has(value as ExtensionProvider)
    ? (value as ExtensionProvider)
    : DEFAULT_EXTENSION_CONFIG.provider;
}

function normalizeDisplayMode(value: unknown): DisplayMode {
  return typeof value === "string" && SUPPORTED_DISPLAY_MODES.has(value as DisplayMode)
    ? (value as DisplayMode)
    : DEFAULT_EXTENSION_CONFIG.displayMode;
}

function normalizeDynamicMode(value: unknown): DynamicMode {
  return typeof value === "string" && SUPPORTED_DYNAMIC_MODES.has(value as DynamicMode)
    ? (value as DynamicMode)
    : DEFAULT_EXTENSION_CONFIG.dynamicMode;
}

function normalizeSiteDynamicModes(value: unknown): SiteDynamicModeOverrides {
  if (!isRecord(value)) return {};

  const overrides: SiteDynamicModeOverrides = {};
  for (const [rawKey, rawMode] of Object.entries(value)) {
    if (typeof rawMode !== "string" || !SUPPORTED_DYNAMIC_MODES.has(rawMode as DynamicMode)) continue;
    const key = normalizeSiteKey(rawKey);
    if (!key) continue;
    overrides[key] = rawMode as DynamicMode;
  }
  return overrides;
}

function normalizeSiteKey(value: string): string {
  let key = value.trim().toLowerCase();
  if (!key) return "";

  const schemeIndex = key.indexOf("://");
  if (schemeIndex >= 0) {
    key = key.slice(schemeIndex + 3);
  }

  key = key.split("/")[0] ?? "";
  key = key.split("?")[0] ?? "";
  key = key.replace(/:\d+$/, "");
  key = key.replace(/\.$/, "");

  return /^[a-z0-9.-]+$/.test(key) ? key : "";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
