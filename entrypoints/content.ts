import { FloatingTranslationControl } from "../src/content/floatingControl";
import { PageController } from "../src/content/pageController";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, type ExtensionConfig } from "../src/shared/config";
import { IndexedDbTranslationCache } from "../src/shared/translationCache";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  async main() {
    let config = await loadConfig();
    let controller = createController(config);
    const floatingControl = new FloatingTranslationControl({
      translatePage: () => controller.translatePage(),
      restorePage: () => controller.restorePage(),
    });
    if (config.showFloatingBall) floatingControl.mount();

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "IMT_TRANSLATE_PAGE") {
        floatingControl.translate().then(() => sendResponse({ ok: true }));
        return true;
      }
      if (message?.type === "IMT_RESTORE_PAGE") {
        floatingControl.restore();
        sendResponse({ ok: true });
      }
      if (message?.type === "IMT_CONFIG_UPDATED") {
        controller.restorePage();
        config = normalizeExtensionConfig(message.config);
        controller = createController(config);
        if (config.showFloatingBall) floatingControl.mount();
        else floatingControl.hide();
        sendResponse({ ok: true });
      }
      return undefined;
    });

    window.__IMT_CONTENT_READY__ = true;
  },
});

async function loadConfig(): Promise<ExtensionConfig> {
  const response = await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" });
  return response?.ok && "config" in response ? normalizeExtensionConfig(response.config) : DEFAULT_EXTENSION_CONFIG;
}

function createController(config: ExtensionConfig): PageController {
  const options: ConstructorParameters<typeof PageController>[0] = {
    targetLang: config.targetLang,
    providerId: config.provider,
    displayMode: config.displayMode,
    translateBatch: async (items) => {
      const response = await chrome.runtime.sendMessage({
        type: "IMT_TRANSLATE_BATCH",
        request: {
          provider: config.provider,
          sourceLang: "auto",
          targetLang: config.targetLang,
          items,
        },
      });
      if (response?.ok && Array.isArray(response.items)) return response.items;
      const error = response?.error ?? "Translation failed";
      return items.map((item) => ({ id: item.id, text: "", status: "failed" as const, error }));
    },
  };

  return new PageController(config.useCache ? { ...options, cache: new IndexedDbTranslationCache() } : options);
}

declare global {
  interface Window {
    __IMT_CONTENT_READY__?: boolean;
  }
}
