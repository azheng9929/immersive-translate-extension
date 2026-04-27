import type { BackgroundMessage, ContentMessage, MessageResponse } from "../shared/messages";

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
  return { ok: false, error: "Unknown background message" };
}
