export type ExtensionProvider = "fake" | "microsoft" | "openai-compatible";
export type DisplayMode = "smart" | "bilingual" | "translation-only";

export type ExtensionConfig = {
  targetLang: string;
  provider: ExtensionProvider;
  displayMode: DisplayMode;
  showFloatingBall: boolean;
  useCache: boolean;
};

export type ExtensionConfigPatch = Partial<ExtensionConfig>;

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  targetLang: "zh-Hans",
  provider: "microsoft",
  displayMode: "smart",
  showFloatingBall: true,
  useCache: true,
};

const SUPPORTED_PROVIDERS = new Set<ExtensionProvider>(["fake", "microsoft", "openai-compatible"]);
const SUPPORTED_DISPLAY_MODES = new Set<DisplayMode>(["smart", "bilingual", "translation-only"]);

export function normalizeExtensionConfig(value: unknown): ExtensionConfig {
  const input = isRecord(value) ? value : {};

  return {
    targetLang: normalizeTargetLang(input.targetLang),
    provider: normalizeProvider(input.provider),
    displayMode: normalizeDisplayMode(input.displayMode),
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
  if ("showFloatingBall" in value) patch.showFloatingBall = normalizeBoolean(value.showFloatingBall, DEFAULT_EXTENSION_CONFIG.showFloatingBall);
  if ("useCache" in value) patch.useCache = normalizeBoolean(value.useCache, DEFAULT_EXTENSION_CONFIG.useCache);
  return patch;
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

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
