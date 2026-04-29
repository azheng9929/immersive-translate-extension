import { FloatingTranslationControl } from "../src/content/floatingControl";
import { InputTranslator } from "../src/content/inputTranslator";
import { shouldMountOriginalTextTooltip } from "../src/content/interactionPolicy";
import { OriginalTextTooltip } from "../src/content/originalTextTooltip";
import { PageController } from "../src/content/pageController";
import { PageTranslationSession } from "../src/content/pageTranslationSession";
import {
  providerChainId,
  translateBatchWithProviderFallback,
  type TranslationBatchItem,
  type TranslationBatchResult,
} from "../src/content/providerFallback";
import { SelectionTranslator } from "../src/content/selectionTranslator";
import { resolveSitePolicy, resolveSitePolicyKey, type SitePolicy } from "../src/content/sitePolicy";
import {
  DEFAULT_EXTENSION_CONFIG,
  normalizeExtensionConfig,
  resolveSiteConfig,
  type ExtensionConfig,
  type ExtensionProvider,
} from "../src/shared/config";
import { buildGlossarySystemPrompt } from "../src/shared/glossary";
import { IndexedDbTranslationCache } from "../src/shared/translationCache";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  async main() {
    let config = await loadConfig();
    let pageSession = createPageSession(config);
    let selectionTranslator = createSelectionTranslator(config);
    let inputTranslator = config.showInputTranslator ? createInputTranslator(config) : undefined;
    const originalTextTooltip = shouldMountOriginalTextTooltip() ? new OriginalTextTooltip() : undefined;
    const floatingControl = new FloatingTranslationControl({
      translatePage: () => pageSession.translatePage(),
      restorePage: () => pageSession.restorePage(),
      getStatus: () => pageSession.getStatus(),
      subscribeStatus: (listener) => pageSession.subscribe(listener),
    });
    if (config.showFloatingBall) floatingControl.mount();
    selectionTranslator.mount();
    inputTranslator?.mount();
    originalTextTooltip?.mount();

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "IMT_TRANSLATE_PAGE") {
        pageSession.translatePage().then(() => sendResponse({ ok: true }));
        return true;
      }
      if (message?.type === "IMT_RESTORE_PAGE") {
        pageSession.restorePage();
        sendResponse({ ok: true });
      }
      if (message?.type === "IMT_GET_PAGE_STATUS") {
        sendResponse({ ok: true, status: pageSession.getStatus() });
      }
      if (message?.type === "IMT_CONFIG_UPDATED") {
        pageSession.restorePage();
        pageSession.dispose();
        config = resolveSiteConfig(normalizeExtensionConfig(message.config), window.location.hostname);
        pageSession = createPageSession(config);
        selectionTranslator.unmount();
        selectionTranslator = createSelectionTranslator(config);
        selectionTranslator.mount();
        inputTranslator?.unmount();
        inputTranslator = config.showInputTranslator ? createInputTranslator(config) : undefined;
        inputTranslator?.mount();
        floatingControl.hide();
        if (config.showFloatingBall) floatingControl.mount();
        sendResponse({ ok: true });
      }
      return undefined;
    });

    window.__IMT_CONTENT_READY__ = true;
  },
});

async function loadConfig(): Promise<ExtensionConfig> {
  const response = await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" });
  return resolveSiteConfig(
    response?.ok && "config" in response ? normalizeExtensionConfig(response.config) : DEFAULT_EXTENSION_CONFIG,
    window.location.hostname,
  );
}

function createController(config: ExtensionConfig, sitePolicy: SitePolicy): PageController {
  const options: ConstructorParameters<typeof PageController>[0] = {
    targetLang: config.targetLang,
    hostname: window.location.hostname,
    providerId: providerChainId(config),
    displayMode: config.displayMode,
    attributeNames: sitePolicy.attributeNames,
    preferredScanRootSelectors: sitePolicy.preferredScanRootSelectors,
    getPageTitle: readPageTitleContext,
    retry: { maxAttempts: 3, delayMs: 800 },
    translateBatch: (items) => translateBatchWithProviderFallback(
      config,
      items,
      (provider, batch) => sendProviderBatch(config, provider, batch),
    ),
  };

  return new PageController(config.useCache ? { ...options, cache: new IndexedDbTranslationCache() } : options);
}

function createPageSession(config: ExtensionConfig): PageTranslationSession {
  const hostname = window.location.hostname;
  const siteKey = resolveSitePolicyKey(hostname);
  const siteDynamicMode = config.siteDynamicModes[siteKey];
  const sitePolicy = resolveSitePolicy(
    hostname,
    config.dynamicMode,
    siteDynamicMode ? { siteDynamicMode } : {},
  );
  return new PageTranslationSession(createController(config, sitePolicy), {
    observeRoot: document.body,
    debounceMs: sitePolicy.debounceMs,
    lazy: true,
    lazyRootMargin: sitePolicy.lazyRootMargin,
    lazyThreshold: sitePolicy.lazyThreshold,
    eagerLazy: true,
    eagerLazyRootMargin: sitePolicy.eagerLazyRootMargin,
    maxEagerLazyRoots: sitePolicy.maxEagerLazyRoots,
    dynamicMode: sitePolicy.dynamicMode,
    excludedDynamicSelectors: sitePolicy.excludedDynamicSelectors,
    maxQueueSize: sitePolicy.maxQueueSize,
    maxRootsPerFlush: sitePolicy.maxRootsPerFlush,
    maxObservedRoots: sitePolicy.maxObservedRoots,
    maxMutationNodesPerWindow: sitePolicy.maxMutationNodesPerWindow,
    mutationWindowMs: sitePolicy.mutationWindowMs,
    site: {
      hostname: sitePolicy.hostname,
      siteKey: sitePolicy.siteKey,
      dynamicMode: sitePolicy.dynamicMode,
      dynamicModeSource: sitePolicy.dynamicModeSource,
      isHighDynamic: sitePolicy.isHighDynamic,
    },
  });
}

function createSelectionTranslator(config: ExtensionConfig): SelectionTranslator {
  return new SelectionTranslator({
    translateText: (text) => translateSingleText(config, "selection", text),
    copyText: async (text) => copyToClipboard(text),
  });
}

function createInputTranslator(config: ExtensionConfig): InputTranslator {
  return new InputTranslator({
    translateText: (text) => translateSingleText(config, "input", text),
    copyText: async (text) => copyToClipboard(text),
  });
}

async function translateSingleText(config: ExtensionConfig, scope: "selection" | "input", text: string): Promise<string> {
  const results = await translateBatchWithProviderFallback(
    config,
    [{ id: `${scope}-${Date.now()}`, text, category: "fallback" }],
    (provider, batch) => sendProviderBatch(config, provider, batch),
  );

  const result = results[0];
  if (!result || result.status !== "ok") {
    throw new Error(result?.error ?? "Translation failed");
  }
  return result.text;
}

async function sendProviderBatch(
  config: ExtensionConfig,
  provider: ExtensionProvider,
  items: TranslationBatchItem[],
): Promise<TranslationBatchResult[]> {
  const response = await chrome.runtime.sendMessage({
    type: "IMT_TRANSLATE_BATCH",
    request: {
      provider,
      ...providerRequestOptions(config, provider),
      sourceLang: "auto",
      targetLang: config.targetLang,
      pageTitle: readPageTitleContext(),
      items,
    },
  });

  if (response?.ok && "items" in response && Array.isArray(response.items)) return response.items;
  const error = response?.error ?? "Translation failed";
  return items.map((item) => ({ id: item.id, text: "", status: "failed" as const, error }));
}

function providerRequestOptions(config: ExtensionConfig, provider: ExtensionProvider) {
  if (provider === "gemini") {
    return {
      endpoint: config.geminiEndpoint,
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
      maxConcurrentRequests: config.geminiMaxConcurrentRequests,
      maxBatchItems: config.geminiMaxBatchItems,
      maxBatchChars: config.geminiMaxBatchChars,
      requestTimeoutMs: config.geminiRequestTimeoutMs,
      systemPrompt: buildGlossarySystemPrompt(config.geminiSystemPrompt, config.glossary),
    };
  }

  if (provider === "microsoft" || provider === "fake") return {};

  return {
    endpoint: config.openaiEndpoint,
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    maxConcurrentRequests: config.openaiMaxConcurrentRequests,
    maxBatchItems: config.openaiMaxBatchItems,
    maxBatchChars: config.openaiMaxBatchChars,
    requestTimeoutMs: config.openaiRequestTimeoutMs,
    systemPrompt: buildGlossarySystemPrompt(config.openaiSystemPrompt, config.glossary),
  };
}

function readPageTitleContext(): string | undefined {
  const title = document.title.replace(/\s+/g, " ").trim();
  return title.length > 0 ? title.slice(0, 200) : undefined;
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
