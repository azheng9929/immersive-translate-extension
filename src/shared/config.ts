import { normalizeGlossaryEntries, type GlossaryEntry } from "./glossary";
import {
  normalizeSiteRuleKey,
  normalizeSiteRules,
  type SiteRules,
} from "./siteRules";

export type ExtensionProvider = "fake" | "microsoft" | "openai-compatible" | "gemini";
export type FallbackProvider = "none" | ExtensionProvider;
export type DisplayMode = "smart" | "bilingual" | "translation-only";
export type PageRenderState = "smart" | "bilingual" | "translation" | "original";
export type DynamicMode = "off" | "conservative" | "normal";
export type RequestProfile = "stable" | "balanced" | "fast" | "high-dynamic";
export type SiteDynamicModeOverrides = Record<string, DynamicMode>;

export const DEFAULT_LLM_TRANSLATION_SYSTEM_PROMPT = `You are a professional {{to}} native translator who needs to fluently translate text into {{to}}.

## Translation Rules
1. Output only the translated content for each item, without explanations or additional content.
2. Preserve the exact item count, item ids, and item order from the request.
3. The returned translation for each item must maintain the same paragraph count and internal format as the original item text.
4. If the text contains HTML tags, place the tags naturally in the translated text while preserving valid markup.
5. Keep content that should not be translated, such as proper nouns, product names, code, variables, URLs, and placeholders.
6. If an item contains %% separators, keep the same number of %% separators in that item's translation. If an item has no %%, do not add %%.

## Structured Output
Return only the requested JSON object. For every input item, return one output item with the same id, translated text, and status ok. Do not merge, split, omit, reorder, add Markdown, or add HTML that was not present in the source.{{title_prompt}}{{summary_prompt}}{{terms_prompt}}{{imt_style_guide}}`;

export const DEFAULT_OPENAI_SYSTEM_PROMPT = DEFAULT_LLM_TRANSLATION_SYSTEM_PROMPT;

export const DEFAULT_GEMINI_SYSTEM_PROMPT = DEFAULT_OPENAI_SYSTEM_PROMPT;

export type ExtensionConfig = {
  targetLang: string;
  autoTranslate: boolean;
  provider: ExtensionProvider;
  fallbackProvider: FallbackProvider;
  displayMode: DisplayMode;
  dynamicMode: DynamicMode;
  requestProfile: RequestProfile;
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
  glossary: GlossaryEntry[];
  siteRules: SiteRules;
  siteDynamicModes: SiteDynamicModeOverrides;
  showFloatingBall: boolean;
  showDebugOverlay: boolean;
  showInputTranslator: boolean;
  useCache: boolean;
};

export type ExtensionConfigPatch = Partial<ExtensionConfig>;

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  targetLang: "zh-Hans",
  autoTranslate: false,
  provider: "microsoft",
  fallbackProvider: "none",
  displayMode: "smart",
  dynamicMode: "normal",
  requestProfile: "balanced",
  openaiEndpoint: "https://api.openai.com/v1/chat/completions",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  openaiMaxConcurrentRequests: 4,
  openaiMaxBatchItems: 4,
  openaiMaxBatchChars: 1200,
  openaiRequestTimeoutMs: 45000,
  openaiSystemPrompt: DEFAULT_OPENAI_SYSTEM_PROMPT,
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  geminiApiKey: "",
  geminiModel: "gemini-3.1-flash-lite-preview",
  geminiMaxConcurrentRequests: 4,
  geminiMaxBatchItems: 4,
  geminiMaxBatchChars: 1200,
  geminiRequestTimeoutMs: 45000,
  geminiSystemPrompt: DEFAULT_GEMINI_SYSTEM_PROMPT,
  glossary: [],
  siteRules: {},
  siteDynamicModes: {},
  showFloatingBall: true,
  showDebugOverlay: false,
  showInputTranslator: false,
  useCache: true,
};

const SUPPORTED_PROVIDERS = new Set<ExtensionProvider>(["fake", "microsoft", "openai-compatible", "gemini"]);
const SUPPORTED_FALLBACK_PROVIDERS = new Set<FallbackProvider>(["none", "fake", "microsoft", "openai-compatible", "gemini"]);
const SUPPORTED_DISPLAY_MODES = new Set<DisplayMode>(["smart", "bilingual", "translation-only"]);
const SUPPORTED_DYNAMIC_MODES = new Set<DynamicMode>(["off", "conservative", "normal"]);
const SUPPORTED_REQUEST_PROFILES = new Set<RequestProfile>(["stable", "balanced", "fast", "high-dynamic"]);

const REQUEST_PROFILE_PRESETS: Record<RequestProfile, {
  dynamicMode: DynamicMode;
  maxConcurrentRequests: number;
  maxBatchItems: number;
  maxBatchChars: number;
  requestTimeoutMs: number;
}> = {
  stable: {
    dynamicMode: "conservative",
    maxConcurrentRequests: 2,
    maxBatchItems: 2,
    maxBatchChars: 800,
    requestTimeoutMs: 60000,
  },
  balanced: {
    dynamicMode: "normal",
    maxConcurrentRequests: 4,
    maxBatchItems: 4,
    maxBatchChars: 1200,
    requestTimeoutMs: 45000,
  },
  fast: {
    dynamicMode: "normal",
    maxConcurrentRequests: 6,
    maxBatchItems: 4,
    maxBatchChars: 1200,
    requestTimeoutMs: 45000,
  },
  "high-dynamic": {
    dynamicMode: "conservative",
    maxConcurrentRequests: 2,
    maxBatchItems: 3,
    maxBatchChars: 1000,
    requestTimeoutMs: 60000,
  },
};

export function normalizeExtensionConfig(value: unknown): ExtensionConfig {
  const input = isRecord(value) ? value : {};

  return {
    targetLang: normalizeTargetLang(input.targetLang),
    autoTranslate: normalizeBoolean(input.autoTranslate, DEFAULT_EXTENSION_CONFIG.autoTranslate),
    provider: normalizeProvider(input.provider),
    fallbackProvider: normalizeFallbackProvider(input.fallbackProvider),
    displayMode: normalizeDisplayMode(input.displayMode),
    dynamicMode: normalizeDynamicMode(input.dynamicMode),
    requestProfile: normalizeRequestProfile(input.requestProfile),
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
    glossary: normalizeGlossaryEntries(input.glossary),
    siteRules: normalizeSiteRules(input.siteRules),
    siteDynamicModes: normalizeSiteDynamicModes(input.siteDynamicModes),
    showFloatingBall: normalizeBoolean(input.showFloatingBall, DEFAULT_EXTENSION_CONFIG.showFloatingBall),
    showDebugOverlay: normalizeBoolean(input.showDebugOverlay, DEFAULT_EXTENSION_CONFIG.showDebugOverlay),
    showInputTranslator: normalizeBoolean(input.showInputTranslator, DEFAULT_EXTENSION_CONFIG.showInputTranslator),
    useCache: normalizeBoolean(input.useCache, DEFAULT_EXTENSION_CONFIG.useCache),
  };
}

export function normalizeExtensionConfigPatch(value: unknown): ExtensionConfigPatch {
  if (!isRecord(value)) return {};

  const patch: ExtensionConfigPatch = {};
  if ("targetLang" in value) patch.targetLang = normalizeTargetLang(value.targetLang);
  if ("autoTranslate" in value) patch.autoTranslate = normalizeBoolean(value.autoTranslate, DEFAULT_EXTENSION_CONFIG.autoTranslate);
  if ("provider" in value) patch.provider = normalizeProvider(value.provider);
  if ("fallbackProvider" in value) patch.fallbackProvider = normalizeFallbackProvider(value.fallbackProvider);
  if ("displayMode" in value) patch.displayMode = normalizeDisplayMode(value.displayMode);
  if ("dynamicMode" in value) patch.dynamicMode = normalizeDynamicMode(value.dynamicMode);
  if ("requestProfile" in value) patch.requestProfile = normalizeRequestProfile(value.requestProfile);
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
  if ("glossary" in value) patch.glossary = normalizeGlossaryEntries(value.glossary);
  if ("siteRules" in value) patch.siteRules = normalizeSiteRules(value.siteRules);
  if ("siteDynamicModes" in value) patch.siteDynamicModes = normalizeSiteDynamicModes(value.siteDynamicModes);
  if ("showFloatingBall" in value) patch.showFloatingBall = normalizeBoolean(value.showFloatingBall, DEFAULT_EXTENSION_CONFIG.showFloatingBall);
  if ("showDebugOverlay" in value) patch.showDebugOverlay = normalizeBoolean(value.showDebugOverlay, DEFAULT_EXTENSION_CONFIG.showDebugOverlay);
  if ("showInputTranslator" in value) patch.showInputTranslator = normalizeBoolean(value.showInputTranslator, DEFAULT_EXTENSION_CONFIG.showInputTranslator);
  if ("useCache" in value) patch.useCache = normalizeBoolean(value.useCache, DEFAULT_EXTENSION_CONFIG.useCache);
  return patch;
}

export function requestProfilePatch(value: unknown): ExtensionConfigPatch {
  const requestProfile = normalizeRequestProfile(value);
  const preset = REQUEST_PROFILE_PRESETS[requestProfile];
  return {
    requestProfile,
    dynamicMode: preset.dynamicMode,
    openaiMaxConcurrentRequests: preset.maxConcurrentRequests,
    openaiMaxBatchItems: preset.maxBatchItems,
    openaiMaxBatchChars: preset.maxBatchChars,
    openaiRequestTimeoutMs: preset.requestTimeoutMs,
    geminiMaxConcurrentRequests: preset.maxConcurrentRequests,
    geminiMaxBatchItems: preset.maxBatchItems,
    geminiMaxBatchChars: preset.maxBatchChars,
    geminiRequestTimeoutMs: preset.requestTimeoutMs,
  };
}

export function displayModeToPageRenderState(displayMode: DisplayMode): PageRenderState {
  if (displayMode === "translation-only") return "translation";
  return displayMode;
}

export function resolveSiteConfig(config: ExtensionConfig, hostname: string): ExtensionConfig {
  const siteKey = normalizeSiteRuleKey(hostname);
  const rule = siteKey ? config.siteRules[siteKey] : undefined;
  if (!siteKey || !rule) return config;

  return normalizeExtensionConfig({
    ...config,
    ...(typeof rule.autoTranslate === "boolean" ? { autoTranslate: rule.autoTranslate } : {}),
    ...(rule.provider ? { provider: rule.provider } : {}),
    ...(rule.fallbackProvider ? { fallbackProvider: rule.fallbackProvider } : {}),
    ...(rule.displayMode ? { displayMode: rule.displayMode } : {}),
  });
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

function normalizeFallbackProvider(value: unknown): FallbackProvider {
  return typeof value === "string" && SUPPORTED_FALLBACK_PROVIDERS.has(value as FallbackProvider)
    ? (value as FallbackProvider)
    : DEFAULT_EXTENSION_CONFIG.fallbackProvider;
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

function normalizeRequestProfile(value: unknown): RequestProfile {
  return typeof value === "string" && SUPPORTED_REQUEST_PROFILES.has(value as RequestProfile)
    ? (value as RequestProfile)
    : DEFAULT_EXTENSION_CONFIG.requestProfile;
}

function normalizeSiteDynamicModes(value: unknown): SiteDynamicModeOverrides {
  if (!isRecord(value)) return {};

  const overrides: SiteDynamicModeOverrides = {};
  for (const [rawKey, rawMode] of Object.entries(value)) {
    if (typeof rawMode !== "string" || !SUPPORTED_DYNAMIC_MODES.has(rawMode as DynamicMode)) continue;
    const key = normalizeSiteRuleKey(rawKey);
    if (!key) continue;
    overrides[key] = rawMode as DynamicMode;
  }
  return overrides;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
