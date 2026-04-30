import { FloatingTranslationControl } from "./floatingControl";
import { BackgroundTranslationCache } from "./backgroundTranslationCache";
import { DebugOverlay, installContentDebugApi } from "./debugOverlay";
import { scheduleAutoTranslate } from "./autoTranslate";
import { InputTranslator } from "./inputTranslator";
import { shouldMountOriginalTextTooltip } from "./interactionPolicy";
import { OriginalTextTooltip } from "./originalTextTooltip";
import { PageController } from "./pageController";
import { PageTranslationSession } from "./pageTranslationSession";
import { shouldHandleContentMessage } from "./contentMessagePolicy";
import {
  providerChainId,
  translateBatchWithProviderFallback,
  type TranslationBatchItem,
  type TranslationBatchResult,
} from "./providerFallback";
import { SelectionTranslator } from "./selectionTranslator";
import { resolveSitePolicy, type SitePolicy } from "./sitePolicy";
import {
  DEFAULT_EXTENSION_CONFIG,
  displayModeToPageRenderState,
  normalizeExtensionConfig,
  resolveSiteConfig,
  type ExtensionConfig,
  type ExtensionProvider,
} from "../shared/config";
import { buildGlossarySystemPrompt } from "../shared/glossary";
import type { WebTranslationRule } from "../shared/webRuleTypes";

export async function runContentMain(): Promise<void> {
  if (window.__IMT_CONTENT_READY__ || window.__IMT_CONTENT_MAIN_LOADING__) return;
  window.__IMT_CONTENT_MAIN_LOADING__ = true;

  try {
    await waitForDocumentBody();
    let config = await loadConfig();
    let pageRules = await loadWebRules(window.location.href);
    const sitePolicy = resolveSitePolicy(window.location.href, config.dynamicMode, { document, rules: pageRules });
    injectSitePolicyCss(sitePolicy);
    let pageSession = createPageSession(config, pageRules);
    let selectionTranslator = createSelectionTranslator(config);
    let inputTranslator = config.showInputTranslator ? createInputTranslator(config) : undefined;
    let debugOverlay = createDebugOverlay(config, pageSession);
    let cancelAutoTranslate = scheduleAutoTranslate(config, () => pageSession.translatePage());
    const originalTextTooltip = shouldMountOriginalTextTooltip() ? new OriginalTextTooltip() : undefined;
    const floatingControl = new FloatingTranslationControl({
      translatePage: () => pageSession.translatePage(),
      restorePage: () => pageSession.restorePage(),
      setRenderState: (renderState) => pageSession.setRenderState(renderState),
      getStatus: () => pageSession.getStatus(),
      subscribeStatus: (listener) => pageSession.subscribe(listener),
    });
    if (config.showFloatingBall) floatingControl.mount();
    selectionTranslator.mount();
    inputTranslator?.mount();
    debugOverlay?.mount();
    originalTextTooltip?.mount();
    installContentDebugApi({
      getConfig: () => config,
      getStatus: () => pageSession.getStatus(),
      getRule: () => pageSession.getStatus().site,
      restore: () => pageSession.restorePage(),
      reAnalyze: () => pageSession.translatePage(),
    });

    const isTopFrame = isCurrentTopFrame();
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!shouldHandleContentMessage(message, isTopFrame)) return undefined;

      if (message?.type === "IMT_TRANSLATE_PAGE") {
        pageSession.translatePage().then(() => sendResponse({ ok: true }));
        return true;
      }
      if (message?.type === "IMT_RESTORE_PAGE") {
        pageSession.restorePage();
        sendResponse({ ok: true });
      }
      if (message?.type === "IMT_SET_PAGE_RENDER_STATE") {
        pageSession.setRenderState(message.renderState);
        sendResponse({ ok: true });
      }
      if (message?.type === "IMT_GET_PAGE_STATUS") {
        sendResponse({ ok: true, status: pageSession.getStatus() });
      }
      if (message?.type === "IMT_CONFIG_UPDATED") {
        void (async () => {
          const nextConfig = resolveSiteConfig(normalizeExtensionConfig(message.config), window.location.hostname);
          if (isDisplayModeOnlyConfigChange(config, nextConfig)) {
            config = nextConfig;
            pageSession.setRenderState(displayModeToPageRenderState(config.displayMode));
            sendResponse({ ok: true });
            return;
          }

          cancelAutoTranslate?.();
          pageSession.restorePage();
          pageSession.dispose();
          debugOverlay?.unmount();
          config = nextConfig;
          pageRules = await loadWebRules(window.location.href);
          injectSitePolicyCss(resolveSitePolicy(window.location.href, config.dynamicMode, { document, rules: pageRules }));
          pageSession = createPageSession(config, pageRules);
          debugOverlay = createDebugOverlay(config, pageSession);
          cancelAutoTranslate = scheduleAutoTranslate(config, () => pageSession.translatePage());
          selectionTranslator.unmount();
          selectionTranslator = createSelectionTranslator(config);
          selectionTranslator.mount();
          inputTranslator?.unmount();
          inputTranslator = config.showInputTranslator ? createInputTranslator(config) : undefined;
          inputTranslator?.mount();
          debugOverlay?.mount();
          floatingControl.hide();
          if (config.showFloatingBall) floatingControl.mount();
          sendResponse({ ok: true });
        })().catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
        return true;
      }
      return undefined;
    });

    window.__IMT_CONTENT_READY__ = true;
  } finally {
    window.__IMT_CONTENT_MAIN_LOADING__ = false;
  }
}

function isCurrentTopFrame(): boolean {
  try {
    return window.top === window;
  } catch {
    return false;
  }
}

async function waitForDocumentBody(): Promise<void> {
  if (document.body) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      observer.disconnect();
      document.removeEventListener("DOMContentLoaded", finish);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.body) finish();
    });

    observer.observe(document.documentElement, { childList: true });
    document.addEventListener("DOMContentLoaded", finish, { once: true });
  });
}

async function loadConfig(): Promise<ExtensionConfig> {
  const response = await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" });
  return resolveSiteConfig(
    response?.ok && "config" in response ? normalizeExtensionConfig(response.config) : DEFAULT_EXTENSION_CONFIG,
    window.location.hostname,
  );
}

async function loadWebRules(url: string): Promise<WebTranslationRule[]> {
  try {
    const response = await chrome.runtime.sendMessage({ type: "IMT_GET_WEB_RULES", url });
    if (response?.ok && "webRules" in response && Array.isArray(response.webRules)) return response.webRules;
  } catch {
    // Core rules are bundled in content_main; imported rules are an optimization layer.
  }
  return [];
}

function createController(config: ExtensionConfig, sitePolicy: SitePolicy): PageController {
  const options: ConstructorParameters<typeof PageController>[0] = {
    targetLang: config.targetLang,
    hostname: window.location.hostname,
    providerId: providerChainId(config),
    displayMode: config.displayMode,
    attributeNames: sitePolicy.attributeNames,
    ...(sitePolicy.mainFrameSelector ? { mainFrameSelector: sitePolicy.mainFrameSelector } : {}),
    ...(sitePolicy.mainFrameMinTextCount !== undefined ? { mainFrameMinTextCount: sitePolicy.mainFrameMinTextCount } : {}),
    ...(sitePolicy.mainFrameMinWordCount !== undefined ? { mainFrameMinWordCount: sitePolicy.mainFrameMinWordCount } : {}),
    ...(sitePolicy.bodyRule ? { bodyRule: sitePolicy.bodyRule } : {}),
    buildContainerSelectors: sitePolicy.buildContainerSelectors,
    skipBuildContainerSelectors: sitePolicy.skipBuildContainerSelectors,
    preferredScanRootSelectors: sitePolicy.preferredScanRootSelectors,
    excludeSelectors: sitePolicy.excludeSelectors,
    contentSelectors: sitePolicy.contentSelectors,
    filterRule: sitePolicy.filterRule,
    allowTooltip: sitePolicy.allowTooltip,
    getPageTitle: readPageTitleContext,
    ...progressivePageBatchOptions(config),
    retry: { maxAttempts: 3, delayMs: 800 },
    translateBatch: (items) => translateBatchWithProviderFallback(
      config,
      items,
      (provider, batch) => sendProviderBatch(config, provider, batch),
    ),
  };

  return new PageController(config.useCache ? { ...options, cache: new BackgroundTranslationCache() } : options);
}

function createPageSession(config: ExtensionConfig, pageRules: readonly WebTranslationRule[]): PageTranslationSession {
  const sitePolicy = resolveSitePolicy(window.location.href, config.dynamicMode, { document, rules: pageRules });
  return new PageTranslationSession(createController(config, sitePolicy), {
    observeRoot: document.body,
    debounceMs: sitePolicy.debounceMs,
    lazy: true,
    viewportFirst: true,
    lazyRootMargin: sitePolicy.lazyRootMargin,
    lazyThreshold: sitePolicy.lazyThreshold,
    eagerLazy: true,
    eagerLazyRootMargin: sitePolicy.eagerLazyRootMargin,
    maxEagerLazyRoots: sitePolicy.maxEagerLazyRoots,
    viewportSupplement: sitePolicy.viewportSupplement,
    viewportSupplementDebounceMs: sitePolicy.viewportSupplementDebounceMs,
    viewportSupplementRootMargin: sitePolicy.viewportSupplementRootMargin,
    viewportSupplementMaxRoots: sitePolicy.viewportSupplementMaxRoots,
    lazyDiscoveryDelayMs: sitePolicy.isHighDynamic ? 180 : 80,
    dynamicMode: sitePolicy.dynamicMode,
    excludedDynamicSelectors: sitePolicy.excludedDynamicSelectors,
    maxQueueSize: sitePolicy.maxQueueSize,
    maxRootsPerFlush: sitePolicy.maxRootsPerFlush,
    maxObservedRoots: sitePolicy.maxObservedRoots,
    maxMutationNodesPerWindow: sitePolicy.maxMutationNodesPerWindow,
    mutationWindowMs: sitePolicy.mutationWindowMs,
    observeUrlChange: sitePolicy.observeUrlChange,
    urlChangeDelay: sitePolicy.urlChangeDelay,
    tooltipDebounceMs: 120,
    renderState: displayModeToPageRenderState(config.displayMode),
    site: {
      hostname: sitePolicy.hostname,
      siteKey: sitePolicy.siteKey,
      ruleId: sitePolicy.ruleId,
      ruleSource: sitePolicy.ruleSource,
      ruleCapability: sitePolicy.ruleCapability,
      fallbackProfile: sitePolicy.fallbackProfile,
      mergedRuleIds: sitePolicy.mergedRuleIds,
      dynamicMode: sitePolicy.dynamicMode,
      dynamicModeSource: sitePolicy.dynamicModeSource,
      isHighDynamic: sitePolicy.isHighDynamic,
    },
  });
}

function createDebugOverlay(config: ExtensionConfig, pageSession: PageTranslationSession): DebugOverlay | undefined {
  if (!config.showDebugOverlay) return undefined;
  return new DebugOverlay({
    getStatus: () => pageSession.getStatus(),
    subscribeStatus: (listener) => pageSession.subscribe(listener),
  });
}

function isDisplayModeOnlyConfigChange(previous: ExtensionConfig, next: ExtensionConfig): boolean {
  const keys = Object.keys(DEFAULT_EXTENSION_CONFIG) as Array<keyof ExtensionConfig>;
  return keys.every((key) => key === "displayMode" || configValueEquals(previous[key], next[key]));
}

function configValueEquals(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

function injectSitePolicyCss(sitePolicy: SitePolicy): void {
  const styleId = "imt-site-policy-css";
  document.getElementById(styleId)?.remove();
  if (sitePolicy.injectedCss.length === 0) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.dataset.imtManaged = "true";
  style.textContent = sitePolicy.injectedCss.join("\n");
  (document.head || document.documentElement).append(style);
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
    throw new Error(result?.error ?? "翻译失败");
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
  const error = response?.error ?? "翻译失败";
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

  if (provider === "deepseek") {
    return {
      endpoint: config.deepseekEndpoint,
      apiKey: config.deepseekApiKey,
      model: config.deepseekModel,
      maxConcurrentRequests: config.deepseekMaxConcurrentRequests,
      maxBatchItems: config.deepseekMaxBatchItems,
      maxBatchChars: config.deepseekMaxBatchChars,
      requestTimeoutMs: config.deepseekRequestTimeoutMs,
      systemPrompt: buildGlossarySystemPrompt(config.deepseekSystemPrompt, config.glossary),
    };
  }

  if (provider === "anthropic") {
    return {
      endpoint: config.anthropicEndpoint,
      apiKey: config.anthropicApiKey,
      model: config.anthropicModel,
      maxConcurrentRequests: config.anthropicMaxConcurrentRequests,
      maxBatchItems: config.anthropicMaxBatchItems,
      maxBatchChars: config.anthropicMaxBatchChars,
      requestTimeoutMs: config.anthropicRequestTimeoutMs,
      maxOutputTokens: config.anthropicMaxOutputTokens,
      systemPrompt: buildGlossarySystemPrompt(config.anthropicSystemPrompt, config.glossary),
    };
  }

  if (provider === "openrouter") {
    return {
      endpoint: config.openrouterEndpoint,
      apiKey: config.openrouterApiKey,
      model: config.openrouterModel,
      maxConcurrentRequests: config.openrouterMaxConcurrentRequests,
      maxBatchItems: config.openrouterMaxBatchItems,
      maxBatchChars: config.openrouterMaxBatchChars,
      requestTimeoutMs: config.openrouterRequestTimeoutMs,
      systemPrompt: buildGlossarySystemPrompt(config.openrouterSystemPrompt, config.glossary),
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

function progressivePageBatchOptions(config: ExtensionConfig) {
  if (config.provider === "openai-compatible") {
    return {
      progressiveBatchItems: Math.min(config.openaiMaxBatchItems, 8),
      progressiveBatchChars: config.openaiMaxBatchChars,
      progressiveConcurrentBatches: config.openaiMaxConcurrentRequests,
    };
  }

  if (config.provider === "gemini") {
    return {
      progressiveBatchItems: Math.min(config.geminiMaxBatchItems, 8),
      progressiveBatchChars: config.geminiMaxBatchChars,
      progressiveConcurrentBatches: config.geminiMaxConcurrentRequests,
    };
  }

  if (config.provider === "deepseek") {
    return {
      progressiveBatchItems: Math.min(config.deepseekMaxBatchItems, 8),
      progressiveBatchChars: config.deepseekMaxBatchChars,
      progressiveConcurrentBatches: config.deepseekMaxConcurrentRequests,
    };
  }

  if (config.provider === "anthropic") {
    return {
      progressiveBatchItems: Math.min(config.anthropicMaxBatchItems, 8),
      progressiveBatchChars: config.anthropicMaxBatchChars,
      progressiveConcurrentBatches: config.anthropicMaxConcurrentRequests,
    };
  }

  if (config.provider === "openrouter") {
    return {
      progressiveBatchItems: Math.min(config.openrouterMaxBatchItems, 8),
      progressiveBatchChars: config.openrouterMaxBatchChars,
      progressiveConcurrentBatches: config.openrouterMaxConcurrentRequests,
    };
  }

  return {
    progressiveBatchItems: 16,
    progressiveBatchChars: 6000,
    progressiveConcurrentBatches: 4,
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
  if (!ok) throw new Error("复制失败");
}

declare global {
  interface Window {
    __IMT_CONTENT_READY__?: boolean;
    __IMT_CONTENT_MAIN_LOADING__?: boolean;
  }
}
