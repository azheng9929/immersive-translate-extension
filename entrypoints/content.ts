import { PageController } from "../src/content/pageController";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main() {
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({
          id: item.id,
          text: `[zh-Hans] ${item.text}`,
          status: "ok" as const,
        })),
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
