export type ExtensionProvider = "fake" | "microsoft" | "openai-compatible" | "gemini";
export type DisplayMode = "smart" | "bilingual" | "translation-only";
export type DynamicMode = "off" | "conservative" | "normal";
export type SiteDynamicModeOverrides = Record<string, DynamicMode>;

export const DEFAULT_OPENAI_SYSTEM_PROMPT =
  "You are a web translation engine. Translate each item to the target language. Return exactly JSON: {\"items\":[{\"id\":\"...\",\"text\":\"...\",\"status\":\"ok\"}]}. Preserve ids, item count, and item boundaries. Do not merge, split, omit, reorder, add notes, add Markdown, or add HTML. If translation is unnecessary, return the original text with status ok.";

export const DEFAULT_GEMINI_SYSTEM_PROMPT = DEFAULT_OPENAI_SYSTEM_PROMPT;

export type ExtensionConfig = {
  targetLang: string;
  provider: ExtensionProvider;
  displayMode: DisplayMode;
  dynamicMode: DynamicMode;
  openaiEndpoint: string;
  openaiApiKey: string;
  openaiModel: string;
  openaiMaxConcurrentRequests: number;
  openaiMaxBatchItems: number;
  openaiMaxBatchChars: number;
  openaiRequestTimeoutMs: number;
  openaiSystemPrompt: string;
  geminiEndpoint: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiMaxConcurrentRequests: number;
  geminiMaxBatchItems: number;
  geminiMaxBatchChars: number;
  geminiRequestTimeoutMs: number;
  geminiSystemPrompt: string;
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
  openaiEndpoint: "https://api.openai.com/v1/chat/completions",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  openaiMaxConcurrentRequests: 2,
  openaiMaxBatchItems: 16,
  openaiMaxBatchChars: 6000,
  openaiRequestTimeoutMs: 45000,
  openaiSystemPrompt: DEFAULT_OPENAI_SYSTEM_PROMPT,
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  geminiApiKey: "",
  geminiModel: "gemini-3.1-flash-lite-preview",
  geminiMaxConcurrentRequests: 2,
  geminiMaxBatchItems: 16,
  geminiMaxBatchChars: 6000,
  geminiRequestTimeoutMs: 45000,
  geminiSystemPrompt: DEFAULT_GEMINI_SYSTEM_PROMPT,
  siteDynamicModes: {},
  showFloatingBall: true,
  useCache: true,
};

const SUPPORTED_PROVIDERS = new Set<ExtensionProvider>(["fake", "microsoft", "openai-compatible", "gemini"]);
const SUPPORTED_DISPLAY_MODES = new Set<DisplayMode>(["smart", "bilingual", "translation-only"]);
const SUPPORTED_DYNAMIC_MODES = new Set<DynamicMode>(["off", "conservative", "normal"]);

export function normalizeExtensionConfig(value: unknown): ExtensionConfig {
  const input = isRecord(value) ? value : {};

  return {
    targetLang: normalizeTargetLang(input.targetLang),
    provider: normalizeProvider(input.provider),
    displayMode: normalizeDisplayMode(input.displayMode),
    dynamicMode: normalizeDynamicMode(input.dynamicMode),
    openaiEndpoint: normalizeString(input.openaiEndpoint, DEFAULT_EXTENSION_CONFIG.openaiEndpoint),
    openaiApiKey: normalizeString(input.openaiApiKey, DEFAULT_EXTENSION_CONFIG.openaiApiKey),
    openaiModel: normalizeString(input.openaiModel, DEFAULT_EXTENSION_CONFIG.openaiModel),
    openaiMaxConcurrentRequests: normalizeInteger(input.openaiMaxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.openaiMaxConcurrentRequests, 1, 8),
    openaiMaxBatchItems: normalizeInteger(input.openaiMaxBatchItems, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchItems, 1, 80),
    openaiMaxBatchChars: normalizeInteger(input.openaiMaxBatchChars, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchChars, 500, 30000),
    openaiRequestTimeoutMs: normalizeInteger(input.openaiRequestTimeoutMs, DEFAULT_EXTENSION_CONFIG.openaiRequestTimeoutMs, 5000, 180000),
    openaiSystemPrompt: normalizeString(input.openaiSystemPrompt, DEFAULT_EXTENSION_CONFIG.openaiSystemPrompt),
    geminiEndpoint: normalizeString(input.geminiEndpoint, DEFAULT_EXTENSION_CONFIG.geminiEndpoint),
    geminiApiKey: normalizeString(input.geminiApiKey, DEFAULT_EXTENSION_CONFIG.geminiApiKey),
    geminiModel: normalizeString(input.geminiModel, DEFAULT_EXTENSION_CONFIG.geminiModel),
    geminiMaxConcurrentRequests: normalizeInteger(input.geminiMaxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.geminiMaxConcurrentRequests, 1, 8),
    geminiMaxBatchItems: normalizeInteger(input.geminiMaxBatchItems, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchItems, 1, 80),
    geminiMaxBatchChars: normalizeInteger(input.geminiMaxBatchChars, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchChars, 500, 30000),
    geminiRequestTimeoutMs: normalizeInteger(input.geminiRequestTimeoutMs, DEFAULT_EXTENSION_CONFIG.geminiRequestTimeoutMs, 5000, 180000),
    geminiSystemPrompt: normalizeString(input.geminiSystemPrompt, DEFAULT_EXTENSION_CONFIG.geminiSystemPrompt),
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
  if ("openaiEndpoint" in value) patch.openaiEndpoint = normalizeString(value.openaiEndpoint, DEFAULT_EXTENSION_CONFIG.openaiEndpoint);
  if ("openaiApiKey" in value) patch.openaiApiKey = normalizeString(value.openaiApiKey, DEFAULT_EXTENSION_CONFIG.openaiApiKey);
  if ("openaiModel" in value) patch.openaiModel = normalizeString(value.openaiModel, DEFAULT_EXTENSION_CONFIG.openaiModel);
  if ("openaiMaxConcurrentRequests" in value) patch.openaiMaxConcurrentRequests = normalizeInteger(value.openaiMaxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.openaiMaxConcurrentRequests, 1, 8);
  if ("openaiMaxBatchItems" in value) patch.openaiMaxBatchItems = normalizeInteger(value.openaiMaxBatchItems, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchItems, 1, 80);
  if ("openaiMaxBatchChars" in value) patch.openaiMaxBatchChars = normalizeInteger(value.openaiMaxBatchChars, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchChars, 500, 30000);
  if ("openaiRequestTimeoutMs" in value) patch.openaiRequestTimeoutMs = normalizeInteger(value.openaiRequestTimeoutMs, DEFAULT_EXTENSION_CONFIG.openaiRequestTimeoutMs, 5000, 180000);
  if ("openaiSystemPrompt" in value) patch.openaiSystemPrompt = normalizeString(value.openaiSystemPrompt, DEFAULT_EXTENSION_CONFIG.openaiSystemPrompt);
  if ("geminiEndpoint" in value) patch.geminiEndpoint = normalizeString(value.geminiEndpoint, DEFAULT_EXTENSION_CONFIG.geminiEndpoint);
  if ("geminiApiKey" in value) patch.geminiApiKey = normalizeString(value.geminiApiKey, DEFAULT_EXTENSION_CONFIG.geminiApiKey);
  if ("geminiModel" in value) patch.geminiModel = normalizeString(value.geminiModel, DEFAULT_EXTENSION_CONFIG.geminiModel);
  if ("geminiMaxConcurrentRequests" in value) patch.geminiMaxConcurrentRequests = normalizeInteger(value.geminiMaxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.geminiMaxConcurrentRequests, 1, 8);
  if ("geminiMaxBatchItems" in value) patch.geminiMaxBatchItems = normalizeInteger(value.geminiMaxBatchItems, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchItems, 1, 80);
  if ("geminiMaxBatchChars" in value) patch.geminiMaxBatchChars = normalizeInteger(value.geminiMaxBatchChars, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchChars, 500, 30000);
  if ("geminiRequestTimeoutMs" in value) patch.geminiRequestTimeoutMs = normalizeInteger(value.geminiRequestTimeoutMs, DEFAULT_EXTENSION_CONFIG.geminiRequestTimeoutMs, 5000, 180000);
  if ("geminiSystemPrompt" in value) patch.geminiSystemPrompt = normalizeString(value.geminiSystemPrompt, DEFAULT_EXTENSION_CONFIG.geminiSystemPrompt);
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

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(Math.max(Math.round(numberValue), min), max);
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
