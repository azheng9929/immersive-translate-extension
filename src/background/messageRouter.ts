import { createConfigStore } from "./configStore";
import { anthropicProvider } from "./providers/anthropicProvider";
import { deepseekProvider } from "./providers/deepseekProvider";
import { fakeProvider } from "./providers/fakeProvider";
import { geminiProvider } from "./providers/geminiProvider";
import { runProviderRequestWithInflightDedupe } from "./inflightTranslationDedupe";
import { microsoftProvider } from "./providers/microsoftProvider";
import { openaiProvider } from "./providers/openaiProvider";
import { openrouterProvider } from "./providers/openrouterProvider";
import { clearParagraphCache, getParagraphCacheStats, queryParagraphCache, setParagraphCache } from "./paragraphCache";
import { clearTranslationPermitQueues, withTranslationPermit } from "./translationPermit";
import { getWebRulesForUrl } from "./webRuleStore";
import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providers/providerTypes";
import type { BackgroundMessage, ContentMessage, MessageResponse } from "../shared/messages";

const providers: Record<ProviderRequest["provider"], TranslationProvider> = {
  fake: fakeProvider,
  microsoft: microsoftProvider,
  "openai-compatible": openaiProvider,
  gemini: geminiProvider,
  deepseek: deepseekProvider,
  anthropic: anthropicProvider,
  openrouter: openrouterProvider,
};

const CONTENT_SCRIPT_RETRY_DELAYS_MS = [250, 500, 1000] as const;

export async function sendToActiveTab(message: ContentMessage): Promise<MessageResponse> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  if (!tabId) return { ok: false, error: "No active tab" };

  let lastError: unknown;
  for (let attempt = 0; attempt <= CONTENT_SCRIPT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return (await chrome.tabs.sendMessage(tabId, message)) as MessageResponse;
    } catch (error) {
      lastError = error;
      if (!isTransientContentScriptMessageError(error) || attempt >= CONTENT_SCRIPT_RETRY_DELAYS_MS.length) break;
      const retryDelayMs = CONTENT_SCRIPT_RETRY_DELAYS_MS[attempt];
      if (retryDelayMs === undefined) break;
      await delay(retryDelayMs);
    }
  }

  return { ok: false, error: lastError instanceof Error ? lastError.message : String(lastError) };
}

function isTransientContentScriptMessageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /receiving end does not exist|could not establish connection|no receiver/i.test(message);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function notifyActiveTab(message: ContentMessage): Promise<void> {
  await sendToActiveTab(message);
}

async function translateBatch(request: ProviderRequest): Promise<MessageResponse> {
  const provider = providers[request.provider];
  if (!provider) return { ok: false, error: `Unsupported translation provider: ${request.provider}` };

  try {
    const items = await runProviderRequestWithInflightDedupe(request, (dedupedRequest) =>
      withTranslationPermit(request.provider, request.maxConcurrentRequests, () => provider.translate(dedupedRequest)),
    );
    return { ok: true, items: reconcileProviderItems(request.items, items) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function toggleActiveTabTranslation(): Promise<MessageResponse> {
  const status = await sendToActiveTab({ type: "IMT_GET_PAGE_STATUS" });
  if (status.ok && "status" in status && isTranslatedPhase(status.status.phase)) {
    return sendToActiveTab({ type: "IMT_RESTORE_PAGE" });
  }
  return sendToActiveTab({ type: "IMT_TRANSLATE_PAGE" });
}

export async function handleBackgroundMessage(message: BackgroundMessage): Promise<MessageResponse> {
  if (message.type === "IMT_POPUP_TRANSLATE_ACTIVE_TAB") {
    return sendToActiveTab({ type: "IMT_TRANSLATE_PAGE" });
  }
  if (message.type === "IMT_POPUP_RESTORE_ACTIVE_TAB") {
    return sendToActiveTab({ type: "IMT_RESTORE_PAGE" });
  }
  if (message.type === "IMT_POPUP_SET_ACTIVE_TAB_RENDER_STATE") {
    return sendToActiveTab({ type: "IMT_SET_PAGE_RENDER_STATE", renderState: message.renderState });
  }
  if (message.type === "IMT_POPUP_GET_ACTIVE_TAB_STATUS") {
    return sendToActiveTab({ type: "IMT_GET_PAGE_STATUS" });
  }
  if (message.type === "IMT_TRANSLATE_BATCH") {
    return translateBatch(message.request);
  }
  if (message.type === "IMT_QUERY_PARAGRAPH_CACHE") {
    const hits = await queryParagraphCache(message.lookups);
    return { ok: true, cacheHits: [...hits.entries()] };
  }
  if (message.type === "IMT_SET_PARAGRAPH_CACHE") {
    await setParagraphCache(message.entries);
    return { ok: true };
  }
  if (message.type === "IMT_GET_PARAGRAPH_CACHE_STATS") {
    return { ok: true, cacheStats: await getParagraphCacheStats() };
  }
  if (message.type === "IMT_CLEAR_PARAGRAPH_CACHE") {
    await clearParagraphCache(message.options);
    return { ok: true };
  }
  if (message.type === "IMT_CLEAR_TRANSLATE_QUEUE") {
    clearTranslationPermitQueues(message.provider);
    return { ok: true };
  }
  if (message.type === "IMT_GET_CONFIG") {
    const config = await createConfigStore().load();
    return { ok: true, config };
  }
  if (message.type === "IMT_GET_WEB_RULES") {
    return { ok: true, webRules: await getWebRulesForUrl(message.url) };
  }
  if (message.type === "IMT_UPDATE_CONFIG") {
    const config = await createConfigStore().update(message.patch);
    await notifyActiveTab({ type: "IMT_CONFIG_UPDATED", config });
    return { ok: true, config };
  }
  return { ok: false, error: "Unknown background message" };
}

function isTranslatedPhase(phase: string): boolean {
  return phase === "translated" || phase === "partial" || phase === "updating";
}

function reconcileProviderItems(requestItems: ProviderRequest["items"], responseItems: ProviderResponseItem[]): ProviderResponseItem[] {
  const responseById = new Map(responseItems.map((item) => [item.id, item]));

  return requestItems.map((requestItem) => {
    const response = responseById.get(requestItem.id);
    if (!response) {
      return {
        id: requestItem.id,
        text: "",
        status: "failed",
        error: "Missing provider result",
      };
    }
    if (response.status === "ok" && response.text.length === 0) {
      return {
        id: requestItem.id,
        text: "",
        status: "failed",
        error: "Empty provider result",
      };
    }
    return {
      ...response,
      id: requestItem.id,
    };
  });
}
