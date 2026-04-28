import type { ExtensionConfig, ExtensionProvider } from "../shared/config";
import type { UnitCategory } from "../shared/types";

export type TranslationBatchItem = {
  id: string;
  text: string;
  category: UnitCategory;
};

export type TranslationBatchResult = {
  id: string;
  text: string;
  status: "ok" | "skipped" | "failed";
  error?: string;
};

export type ProviderBatchSender = (
  provider: ExtensionProvider,
  items: TranslationBatchItem[],
) => Promise<TranslationBatchResult[]>;

export async function translateBatchWithProviderFallback(
  config: ExtensionConfig,
  items: TranslationBatchItem[],
  send: ProviderBatchSender,
): Promise<TranslationBatchResult[]> {
  const primaryResults = await send(config.provider, items);
  const primaryById = new Map(primaryResults.map((result) => [result.id, result]));
  const fallbackProvider = effectiveFallbackProvider(config);
  const failedItems = fallbackProvider
    ? items.filter((item) => primaryById.get(item.id)?.status === "failed")
    : [];

  if (!fallbackProvider || failedItems.length === 0) {
    return items.map((item) => primaryById.get(item.id) ?? missingResult(item));
  }

  const fallbackResults = await send(fallbackProvider, failedItems);
  const fallbackById = new Map(fallbackResults.map((result) => [result.id, result]));

  return items.map((item) => {
    const primary = primaryById.get(item.id) ?? missingResult(item);
    if (primary.status !== "failed") return primary;

    const fallback = fallbackById.get(item.id);
    return fallback && fallback.status !== "failed" ? fallback : primary;
  });
}

export function effectiveFallbackProvider(config: ExtensionConfig): ExtensionProvider | undefined {
  if (config.fallbackProvider === "none" || config.fallbackProvider === config.provider) return undefined;
  return config.fallbackProvider;
}

export function providerChainId(config: ExtensionConfig): string {
  const fallbackProvider = effectiveFallbackProvider(config);
  return fallbackProvider ? `${config.provider}->${fallbackProvider}` : config.provider;
}

function missingResult(item: TranslationBatchItem): TranslationBatchResult {
  return {
    id: item.id,
    text: "",
    status: "failed",
    error: "Missing provider result",
  };
}
