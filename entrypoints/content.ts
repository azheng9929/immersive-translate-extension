import { PageController } from "../src/content/pageController";
import { IndexedDbTranslationCache } from "../src/shared/translationCache";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main() {
    const controller = new PageController({
      targetLang: "zh-Hans",
      providerId: "microsoft",
      cache: new IndexedDbTranslationCache(),
      translateBatch: async (items) => {
        const response = await chrome.runtime.sendMessage({
          type: "IMT_TRANSLATE_BATCH",
          request: {
            provider: "microsoft",
            sourceLang: "auto",
            targetLang: "zh-Hans",
            items,
          },
        });
        if (response?.ok && Array.isArray(response.items)) return response.items;
        const error = response?.error ?? "Translation failed";
        return items.map((item) => ({ id: item.id, text: "", status: "failed" as const, error }));
      },
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "IMT_TRANSLATE_PAGE") {
        controller.translatePage().then(() => sendResponse({ ok: true }));
        return true;
      }
      if (message?.type === "IMT_RESTORE_PAGE") {
        controller.restorePage();
        sendResponse({ ok: true });
      }
      return undefined;
    });

    window.__IMT_CONTENT_READY__ = true;
  },
});

declare global {
  interface Window {
    __IMT_CONTENT_READY__?: boolean;
  }
}
