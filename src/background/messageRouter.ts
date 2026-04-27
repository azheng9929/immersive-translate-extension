import { fakeProvider } from "./providers/fakeProvider";
import { microsoftProvider } from "./providers/microsoftProvider";
import { openaiProvider } from "./providers/openaiProvider";
import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providers/providerTypes";
import type { BackgroundMessage, ContentMessage, MessageResponse } from "../shared/messages";

const providers: Record<ProviderRequest["provider"], TranslationProvider> = {
  fake: fakeProvider,
  microsoft: microsoftProvider,
  "openai-compatible": openaiProvider,
};

export async function sendToActiveTab(message: ContentMessage): Promise<MessageResponse> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  if (!tabId) return { ok: false, error: "No active tab" };

  try {
    return (await chrome.tabs.sendMessage(tabId, message)) as MessageResponse;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function handleBackgroundMessage(message: BackgroundMessage): Promise<MessageResponse> {
  if (message.type === "IMT_POPUP_TRANSLATE_ACTIVE_TAB") {
    return sendToActiveTab({ type: "IMT_TRANSLATE_PAGE" });
  }
  if (message.type === "IMT_POPUP_RESTORE_ACTIVE_TAB") {
    return sendToActiveTab({ type: "IMT_RESTORE_PAGE" });
  }
  if (message.type === "IMT_TRANSLATE_BATCH") {
    return translateBatch(message.request);
  }
  return { ok: false, error: "Unknown background message" };
}

async function translateBatch(request: ProviderRequest): Promise<MessageResponse> {
  const provider = providers[request.provider];
  if (!provider) return { ok: false, error: `Unsupported translation provider: ${request.provider}` };

  try {
    const items = await provider.translate(request);
    return { ok: true, items: reconcileProviderItems(request.items, items) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
