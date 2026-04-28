import { FloatingTranslationControl } from "../src/content/floatingControl";
import { PageController } from "../src/content/pageController";
import { SelectionTranslator } from "../src/content/selectionTranslator";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig, type ExtensionConfig } from "../src/shared/config";
import { IndexedDbTranslationCache } from "../src/shared/translationCache";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  async main() {
    let config = await loadConfig();
    let controller = createController(config);
    let selectionTranslator = createSelectionTranslator(config);
    const floatingControl = new FloatingTranslationControl({
      translatePage: () => controller.translatePage(),
      restorePage: () => controller.restorePage(),
    });
    if (config.showFloatingBall) floatingControl.mount();
    selectionTranslator.mount();

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
        selectionTranslator.unmount();
        selectionTranslator = createSelectionTranslator(config);
        selectionTranslator.mount();
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

function createSelectionTranslator(config: ExtensionConfig): SelectionTranslator {
  return new SelectionTranslator({
    translateText: async (text) => {
      const response = await chrome.runtime.sendMessage({
        type: "IMT_TRANSLATE_BATCH",
        request: {
          provider: config.provider,
          sourceLang: "auto",
          targetLang: config.targetLang,
          items: [{ id: `selection-${Date.now()}`, text, category: "fallback" }],
        },
      });

      if (!response?.ok || !("items" in response) || !Array.isArray(response.items)) {
        throw new Error(response?.error ?? "Translation failed");
      }

      const result = response.items[0];
      if (!result || result.status !== "ok") {
        throw new Error(result?.error ?? "Translation failed");
      }
      return result.text;
    },
    copyText: async (text) => copyToClipboard(text),
  });
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.dataset.imtManaged = "true";
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Copy failed");
}

declare global {
  interface Window {
    __IMT_CONTENT_READY__?: boolean;
  }
}
