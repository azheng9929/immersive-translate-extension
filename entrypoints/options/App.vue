<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  DEFAULT_EXTENSION_CONFIG,
  requestProfilePatch,
  type DisplayMode,
  type DynamicMode,
  type ExtensionConfig,
  type ExtensionConfigPatch,
  type ExtensionProvider,
  type FallbackProvider,
  type RequestProfile,
} from "../../src/shared/config";
import {
  exportGlossaryEntries,
  glossaryEntriesToText,
  glossaryTextToEntries,
  importGlossaryEntries,
} from "../../src/shared/glossary";
import type { MessageResponse } from "../../src/shared/messages";
import {
  normalizeSiteRuleKey,
  setSiteRule,
  type SiteAutoTranslateChoice,
  type SiteRule,
} from "../../src/shared/siteRules";
import type { TranslationCacheStats } from "../../src/shared/translationCache";

const config = reactive<ExtensionConfig>({ ...DEFAULT_EXTENSION_CONFIG });
const isLoading = ref(true);
const savedAt = ref("");
const glossaryText = ref("");
const glossaryImportText = ref("");
const glossaryExportText = ref("");
const glossaryImportError = ref("");
const siteRuleHost = ref("");
const siteRuleAutoTranslate = ref<SiteAutoTranslateChoice>("global");
const siteRuleDisplayMode = ref<DisplayMode | "global">("global");
const siteRuleProvider = ref<ExtensionProvider | "global">("global");
const siteRuleFallbackProvider = ref<FallbackProvider | "global">("global");
const siteRuleError = ref("");
const cacheStats = ref<TranslationCacheStats | undefined>();
const cacheStatsError = ref("");
const isClearingCache = ref(false);

const siteRules = computed(() =>
  Object.keys(config.siteRules)
    .map((siteKey) => ({
      siteKey,
      autoTranslate: config.siteRules[siteKey]?.autoTranslate,
      displayMode: config.siteRules[siteKey]?.displayMode,
      provider: config.siteRules[siteKey]?.provider,
      fallbackProvider: config.siteRules[siteKey]?.fallbackProvider,
    }))
    .sort((left, right) => left.siteKey.localeCompare(right.siteKey)),
);

const cacheStatsSummary = computed(() => {
  if (cacheStatsError.value) return cacheStatsError.value;
  if (!cacheStats.value) return "正在读取缓存";
  return `${cacheStats.value.entries} 条缓存，约 ${formatBytes(cacheStats.value.estimatedBytes)}`;
});

const cacheStatsDetails = computed(() => {
  if (!cacheStats.value) return "";
  const providers = cacheStats.value.providers.length ? cacheStats.value.providers.join(", ") : "无";
  const targetLangs = cacheStats.value.targetLangs.length ? cacheStats.value.targetLangs.join(", ") : "无";
  return `服务：${providers}；目标语言：${targetLangs}`;
});

const updateConfig = async (patch: ExtensionConfigPatch) => {
  Object.assign(config, patch);
  const response = (await chrome.runtime.sendMessage({ type: "IMT_UPDATE_CONFIG", patch })) as MessageResponse;
  if (response.ok && "config" in response) {
    Object.assign(config, response.config);
    savedAt.value = new Date().toLocaleTimeString();
  }
  if (!response.ok) console.warn(response.error);
};

const setProvider = (event: Event) => {
  void updateConfig({ provider: (event.target as HTMLSelectElement).value as ExtensionProvider });
};

const setFallbackProvider = (event: Event) => {
  void updateConfig({ fallbackProvider: (event.target as HTMLSelectElement).value as FallbackProvider });
};

const setRequestProfile = (event: Event) => {
  void updateConfig(requestProfilePatch((event.target as HTMLSelectElement).value as RequestProfile));
};

const setDynamicMode = (event: Event) => {
  void updateConfig({ dynamicMode: (event.target as HTMLSelectElement).value as DynamicMode });
};

const setOpenAIEndpoint = (event: Event) => {
  void updateConfig({ openaiEndpoint: (event.target as HTMLInputElement).value });
};

const setOpenAIApiKey = (event: Event) => {
  void updateConfig({ openaiApiKey: (event.target as HTMLInputElement).value });
};

const setOpenAIModel = (event: Event) => {
  void updateConfig({ openaiModel: (event.target as HTMLInputElement).value });
};

const setOpenAIMaxConcurrentRequests = (event: Event) => {
  void updateConfig({ openaiMaxConcurrentRequests: numberInputValue(event) });
};

const setOpenAIMaxBatchItems = (event: Event) => {
  void updateConfig({ openaiMaxBatchItems: numberInputValue(event) });
};

const setOpenAIMaxBatchChars = (event: Event) => {
  void updateConfig({ openaiMaxBatchChars: numberInputValue(event) });
};

const setOpenAIRequestTimeoutMs = (event: Event) => {
  void updateConfig({ openaiRequestTimeoutMs: numberInputValue(event) });
};

const setOpenAISystemPrompt = (event: Event) => {
  void updateConfig({ openaiSystemPrompt: (event.target as HTMLTextAreaElement).value });
};

const setGeminiEndpoint = (event: Event) => {
  void updateConfig({ geminiEndpoint: (event.target as HTMLInputElement).value });
};

const setGeminiApiKey = (event: Event) => {
  void updateConfig({ geminiApiKey: (event.target as HTMLInputElement).value });
};

const setGeminiModel = (event: Event) => {
  void updateConfig({ geminiModel: (event.target as HTMLInputElement).value });
};

const setGeminiMaxConcurrentRequests = (event: Event) => {
  void updateConfig({ geminiMaxConcurrentRequests: numberInputValue(event) });
};

const setGeminiMaxBatchItems = (event: Event) => {
  void updateConfig({ geminiMaxBatchItems: numberInputValue(event) });
};

const setGeminiMaxBatchChars = (event: Event) => {
  void updateConfig({ geminiMaxBatchChars: numberInputValue(event) });
};

const setGeminiRequestTimeoutMs = (event: Event) => {
  void updateConfig({ geminiRequestTimeoutMs: numberInputValue(event) });
};

const setGeminiSystemPrompt = (event: Event) => {
  void updateConfig({ geminiSystemPrompt: (event.target as HTMLTextAreaElement).value });
};

const setDeepSeekEndpoint = (event: Event) => {
  void updateConfig({ deepseekEndpoint: (event.target as HTMLInputElement).value });
};

const setDeepSeekApiKey = (event: Event) => {
  void updateConfig({ deepseekApiKey: (event.target as HTMLInputElement).value });
};

const setDeepSeekModel = (event: Event) => {
  void updateConfig({ deepseekModel: (event.target as HTMLInputElement).value });
};

const setDeepSeekMaxConcurrentRequests = (event: Event) => {
  void updateConfig({ deepseekMaxConcurrentRequests: numberInputValue(event) });
};

const setDeepSeekMaxBatchItems = (event: Event) => {
  void updateConfig({ deepseekMaxBatchItems: numberInputValue(event) });
};

const setDeepSeekMaxBatchChars = (event: Event) => {
  void updateConfig({ deepseekMaxBatchChars: numberInputValue(event) });
};

const setDeepSeekRequestTimeoutMs = (event: Event) => {
  void updateConfig({ deepseekRequestTimeoutMs: numberInputValue(event) });
};

const setDeepSeekSystemPrompt = (event: Event) => {
  void updateConfig({ deepseekSystemPrompt: (event.target as HTMLTextAreaElement).value });
};

const setAnthropicEndpoint = (event: Event) => {
  void updateConfig({ anthropicEndpoint: (event.target as HTMLInputElement).value });
};

const setAnthropicApiKey = (event: Event) => {
  void updateConfig({ anthropicApiKey: (event.target as HTMLInputElement).value });
};

const setAnthropicModel = (event: Event) => {
  void updateConfig({ anthropicModel: (event.target as HTMLInputElement).value });
};

const setAnthropicMaxConcurrentRequests = (event: Event) => {
  void updateConfig({ anthropicMaxConcurrentRequests: numberInputValue(event) });
};

const setAnthropicMaxBatchItems = (event: Event) => {
  void updateConfig({ anthropicMaxBatchItems: numberInputValue(event) });
};

const setAnthropicMaxBatchChars = (event: Event) => {
  void updateConfig({ anthropicMaxBatchChars: numberInputValue(event) });
};

const setAnthropicRequestTimeoutMs = (event: Event) => {
  void updateConfig({ anthropicRequestTimeoutMs: numberInputValue(event) });
};

const setAnthropicMaxOutputTokens = (event: Event) => {
  void updateConfig({ anthropicMaxOutputTokens: numberInputValue(event) });
};

const setAnthropicSystemPrompt = (event: Event) => {
  void updateConfig({ anthropicSystemPrompt: (event.target as HTMLTextAreaElement).value });
};

const setOpenRouterEndpoint = (event: Event) => {
  void updateConfig({ openrouterEndpoint: (event.target as HTMLInputElement).value });
};

const setOpenRouterApiKey = (event: Event) => {
  void updateConfig({ openrouterApiKey: (event.target as HTMLInputElement).value });
};

const setOpenRouterModel = (event: Event) => {
  void updateConfig({ openrouterModel: (event.target as HTMLInputElement).value });
};

const setOpenRouterMaxConcurrentRequests = (event: Event) => {
  void updateConfig({ openrouterMaxConcurrentRequests: numberInputValue(event) });
};

const setOpenRouterMaxBatchItems = (event: Event) => {
  void updateConfig({ openrouterMaxBatchItems: numberInputValue(event) });
};

const setOpenRouterMaxBatchChars = (event: Event) => {
  void updateConfig({ openrouterMaxBatchChars: numberInputValue(event) });
};

const setOpenRouterRequestTimeoutMs = (event: Event) => {
  void updateConfig({ openrouterRequestTimeoutMs: numberInputValue(event) });
};

const setOpenRouterSystemPrompt = (event: Event) => {
  void updateConfig({ openrouterSystemPrompt: (event.target as HTMLTextAreaElement).value });
};

const setTranslateNewContent = (event: Event) => {
  void updateConfig({ dynamicMode: (event.target as HTMLInputElement).checked ? "normal" : "off" });
};

const setGlossaryText = (event: Event) => {
  glossaryText.value = (event.target as HTMLTextAreaElement).value;
  void updateConfig({ glossary: glossaryTextToEntries(glossaryText.value) });
};

const exportGlossary = () => {
  glossaryExportText.value = exportGlossaryEntries(config.glossary);
};

const importGlossary = () => {
  try {
    const glossary = importGlossaryEntries(glossaryImportText.value);
    glossaryImportError.value = "";
    glossaryText.value = glossaryEntriesToText(glossary);
    void updateConfig({ glossary });
  } catch (error) {
    glossaryImportError.value = error instanceof Error ? error.message : String(error);
  }
};

const saveSiteRule = () => {
  const siteKey = normalizeSiteRuleKey(siteRuleHost.value);
  if (!siteKey) {
    siteRuleError.value = "站点无效";
    return;
  }
  siteRuleError.value = "";
  siteRuleHost.value = siteKey;
  const rule = buildSiteRulePatch();
  const siteRules = setSiteRule(config.siteRules, siteKey, rule);
  void updateConfig({ siteRules });
};

const removeSiteRule = (siteKey: string) => {
  void updateConfig({
    siteRules: setSiteRule(config.siteRules, siteKey, {}),
  });
};

const clearSiteRules = () => {
  void updateConfig({ siteRules: {}, siteDynamicModes: {} });
};

onMounted(async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
  await loadCacheStats();
  glossaryText.value = glossaryEntriesToText(config.glossary);
  isLoading.value = false;
});

const loadCacheStats = async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_PARAGRAPH_CACHE_STATS" })) as MessageResponse;
  if (response.ok && "cacheStats" in response) {
    cacheStats.value = response.cacheStats;
    cacheStatsError.value = "";
  }
  if (!response.ok) {
    cacheStatsError.value = response.error;
    console.warn(response.error);
  }
};

const clearAllCache = async () => {
  isClearingCache.value = true;
  const response = (await chrome.runtime.sendMessage({ type: "IMT_CLEAR_PARAGRAPH_CACHE" })) as MessageResponse;
  if (response.ok) {
    await loadCacheStats();
  } else {
    cacheStatsError.value = response.error;
    console.warn(response.error);
  }
  isClearingCache.value = false;
};

function numberInputValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}

function buildSiteRulePatch(): SiteRule {
  const rule: SiteRule = {};
  if (siteRuleAutoTranslate.value === "always") rule.autoTranslate = true;
  if (siteRuleAutoTranslate.value === "never") rule.autoTranslate = false;
  if (siteRuleDisplayMode.value !== "global") rule.displayMode = siteRuleDisplayMode.value;
  if (siteRuleProvider.value !== "global") rule.provider = siteRuleProvider.value;
  if (siteRuleFallbackProvider.value !== "global") rule.fallbackProvider = siteRuleFallbackProvider.value;
  return rule;
}

function siteRuleAutoLabel(value: boolean | undefined): string {
  if (value === true) return "自动翻译：总是";
  if (value === false) return "自动翻译：从不";
  return "自动翻译：跟随全局";
}

function displayModeLabel(value: DisplayMode): string {
  if (value === "smart") return "智能";
  if (value === "bilingual") return "双语";
  return "仅译文";
}

function providerLabel(value: ExtensionProvider | FallbackProvider): string {
  if (value === "openai-compatible") return "OpenAI API";
  if (value === "gemini") return "Google Gemini";
  if (value === "deepseek") return "DeepSeek";
  if (value === "anthropic") return "Claude";
  if (value === "openrouter") return "OpenRouter";
  if (value === "fake") return "本地测试";
  if (value === "none") return "不使用";
  return "Microsoft";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<template>
  <main class="options">
    <header class="page-header">
      <img src="/icons/icon-48.png" alt="" class="page-icon" />
      <div>
        <h1>沉浸式翻译</h1>
        <p>设置</p>
      </div>
      <span v-if="savedAt" class="saved">已保存 {{ savedAt }}</span>
    </header>

    <section class="panel" aria-label="翻译服务设置" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>翻译服务</h2>
          <p>选择整页、划词和输入框翻译使用的服务。</p>
        </div>
      </div>

      <label class="field">
        <span>主服务</span>
        <select :value="config.provider" @change="setProvider">
          <option value="microsoft">Microsoft</option>
          <option value="openai-compatible">OpenAI API</option>
          <option value="gemini">Google Gemini</option>
          <option value="deepseek">DeepSeek</option>
          <option value="anthropic">Claude</option>
          <option value="openrouter">OpenRouter</option>
          <option value="fake">本地测试</option>
        </select>
      </label>

      <label class="field">
        <span>备用服务</span>
        <select data-testid="fallback-provider" :value="config.fallbackProvider" @change="setFallbackProvider">
          <option value="none">不使用</option>
          <option value="microsoft">Microsoft</option>
          <option value="openai-compatible">OpenAI API</option>
          <option value="gemini">Google Gemini</option>
          <option value="deepseek">DeepSeek</option>
          <option value="anthropic">Claude</option>
          <option value="openrouter">OpenRouter</option>
          <option value="fake">本地测试</option>
        </select>
      </label>

      <label class="field">
        <span>翻译策略</span>
        <select data-testid="options-request-profile" :value="config.requestProfile" @change="setRequestProfile">
          <option value="stable">稳定</option>
          <option value="balanced">均衡</option>
          <option value="fast">极速</option>
          <option data-testid="request-profile-high-dynamic" value="high-dynamic">高动态</option>
        </select>
      </label>

      <label class="field">
        <span>动态补翻</span>
        <select data-testid="options-dynamic-mode" :value="config.dynamicMode" @change="setDynamicMode">
          <option value="off">关闭</option>
          <option value="conservative">保守</option>
          <option value="normal">正常</option>
        </select>
      </label>

      <div v-if="config.provider === 'openai-compatible'" class="openai-settings">
        <label class="field">
          <span>OpenAI API 地址</span>
          <input
            data-testid="openai-endpoint"
            type="url"
            autocomplete="off"
            spellcheck="false"
            :value="config.openaiEndpoint"
            @input="setOpenAIEndpoint"
          />
        </label>

        <label class="field">
          <span>API Key</span>
          <input
            data-testid="openai-api-key"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :value="config.openaiApiKey"
            @input="setOpenAIApiKey"
          />
        </label>

        <label class="field">
          <span>模型</span>
          <input
            data-testid="openai-model"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :value="config.openaiModel"
            @input="setOpenAIModel"
          />
        </label>
      </div>

      <div v-if="config.provider === 'gemini'" class="gemini-settings">
        <label class="field">
          <span>Gemini API 地址</span>
          <input
            data-testid="gemini-endpoint"
            type="url"
            autocomplete="off"
            spellcheck="false"
            :value="config.geminiEndpoint"
            @input="setGeminiEndpoint"
          />
        </label>

        <label class="field">
          <span>API Key</span>
          <input
            data-testid="gemini-api-key"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :value="config.geminiApiKey"
            @input="setGeminiApiKey"
          />
        </label>

        <label class="field">
          <span>模型</span>
          <input
            data-testid="gemini-model"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :value="config.geminiModel"
            @input="setGeminiModel"
          />
        </label>
      </div>

      <div v-if="config.provider === 'openai-compatible'" class="openai-advanced" aria-label="OpenAI API 请求设置">
        <h3>OpenAI 请求设置</h3>
        <div class="tuning-grid">
          <label class="field">
            <span>并发数</span>
            <input
              data-testid="openai-max-concurrent"
              type="number"
              min="1"
              max="8"
              step="1"
              :value="config.openaiMaxConcurrentRequests"
              @input="setOpenAIMaxConcurrentRequests"
            />
          </label>

          <label class="field">
            <span>每批段落</span>
            <input
              data-testid="openai-max-batch-items"
              type="number"
              min="1"
              max="80"
              step="1"
              :value="config.openaiMaxBatchItems"
              @input="setOpenAIMaxBatchItems"
            />
          </label>

          <label class="field">
            <span>每批字符</span>
            <input
              data-testid="openai-max-batch-chars"
              type="number"
              min="500"
              max="30000"
              step="500"
              :value="config.openaiMaxBatchChars"
              @input="setOpenAIMaxBatchChars"
            />
          </label>

          <label class="field">
            <span>超时毫秒</span>
            <input
              data-testid="openai-request-timeout"
              type="number"
              min="5000"
              max="180000"
              step="5000"
              :value="config.openaiRequestTimeoutMs"
              @input="setOpenAIRequestTimeoutMs"
            />
          </label>
        </div>

        <label class="field prompt-field">
          <span>系统提示词</span>
          <textarea
            data-testid="openai-system-prompt"
            spellcheck="false"
            :value="config.openaiSystemPrompt"
            @input="setOpenAISystemPrompt"
          />
        </label>
      </div>

      <div v-if="config.provider === 'gemini'" class="gemini-advanced" aria-label="Gemini API 请求设置">
        <h3>Gemini 请求设置</h3>
        <div class="tuning-grid">
          <label class="field">
            <span>并发数</span>
            <input
              data-testid="gemini-max-concurrent"
              type="number"
              min="1"
              max="8"
              step="1"
              :value="config.geminiMaxConcurrentRequests"
              @input="setGeminiMaxConcurrentRequests"
            />
          </label>

          <label class="field">
            <span>每批段落</span>
            <input
              data-testid="gemini-max-batch-items"
              type="number"
              min="1"
              max="80"
              step="1"
              :value="config.geminiMaxBatchItems"
              @input="setGeminiMaxBatchItems"
            />
          </label>

          <label class="field">
            <span>每批字符</span>
            <input
              data-testid="gemini-max-batch-chars"
              type="number"
              min="500"
              max="30000"
              step="500"
              :value="config.geminiMaxBatchChars"
              @input="setGeminiMaxBatchChars"
            />
          </label>

          <label class="field">
            <span>超时毫秒</span>
            <input
              data-testid="gemini-request-timeout"
              type="number"
              min="5000"
              max="180000"
              step="5000"
              :value="config.geminiRequestTimeoutMs"
              @input="setGeminiRequestTimeoutMs"
            />
          </label>
        </div>

        <label class="field prompt-field">
          <span>系统提示词</span>
          <textarea
            data-testid="gemini-system-prompt"
            spellcheck="false"
            :value="config.geminiSystemPrompt"
            @input="setGeminiSystemPrompt"
          />
        </label>
      </div>

      <div v-if="config.provider === 'deepseek'" class="deepseek-settings">
        <label class="field">
          <span>DeepSeek API 地址</span>
          <input data-testid="deepseek-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.deepseekEndpoint" @input="setDeepSeekEndpoint" />
        </label>
        <label class="field">
          <span>API Key</span>
          <input data-testid="deepseek-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.deepseekApiKey" @input="setDeepSeekApiKey" />
        </label>
        <label class="field">
          <span>模型</span>
          <input data-testid="deepseek-model" type="text" autocomplete="off" spellcheck="false" :value="config.deepseekModel" @input="setDeepSeekModel" />
        </label>
      </div>

      <div v-if="config.provider === 'deepseek'" class="deepseek-advanced" aria-label="DeepSeek API 请求设置">
        <h3>DeepSeek 请求设置</h3>
        <div class="tuning-grid">
          <label class="field">
            <span>并发数</span>
            <input data-testid="deepseek-max-concurrent" type="number" min="1" max="8" step="1" :value="config.deepseekMaxConcurrentRequests" @input="setDeepSeekMaxConcurrentRequests" />
          </label>
          <label class="field">
            <span>每批段落</span>
            <input data-testid="deepseek-max-batch-items" type="number" min="1" max="80" step="1" :value="config.deepseekMaxBatchItems" @input="setDeepSeekMaxBatchItems" />
          </label>
          <label class="field">
            <span>每批字符</span>
            <input data-testid="deepseek-max-batch-chars" type="number" min="500" max="30000" step="500" :value="config.deepseekMaxBatchChars" @input="setDeepSeekMaxBatchChars" />
          </label>
          <label class="field">
            <span>超时毫秒</span>
            <input data-testid="deepseek-request-timeout" type="number" min="5000" max="180000" step="5000" :value="config.deepseekRequestTimeoutMs" @input="setDeepSeekRequestTimeoutMs" />
          </label>
        </div>
        <label class="field prompt-field">
          <span>系统提示词</span>
          <textarea data-testid="deepseek-system-prompt" spellcheck="false" :value="config.deepseekSystemPrompt" @input="setDeepSeekSystemPrompt" />
        </label>
      </div>

      <div v-if="config.provider === 'anthropic'" class="anthropic-settings">
        <label class="field">
          <span>Claude API 地址</span>
          <input data-testid="anthropic-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.anthropicEndpoint" @input="setAnthropicEndpoint" />
        </label>
        <label class="field">
          <span>API Key</span>
          <input data-testid="anthropic-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.anthropicApiKey" @input="setAnthropicApiKey" />
        </label>
        <label class="field">
          <span>模型</span>
          <input data-testid="anthropic-model" type="text" autocomplete="off" spellcheck="false" :value="config.anthropicModel" @input="setAnthropicModel" />
        </label>
      </div>

      <div v-if="config.provider === 'anthropic'" class="anthropic-advanced" aria-label="Claude API 请求设置">
        <h3>Claude 请求设置</h3>
        <div class="tuning-grid">
          <label class="field">
            <span>并发数</span>
            <input data-testid="anthropic-max-concurrent" type="number" min="1" max="8" step="1" :value="config.anthropicMaxConcurrentRequests" @input="setAnthropicMaxConcurrentRequests" />
          </label>
          <label class="field">
            <span>每批段落</span>
            <input data-testid="anthropic-max-batch-items" type="number" min="1" max="80" step="1" :value="config.anthropicMaxBatchItems" @input="setAnthropicMaxBatchItems" />
          </label>
          <label class="field">
            <span>每批字符</span>
            <input data-testid="anthropic-max-batch-chars" type="number" min="500" max="30000" step="500" :value="config.anthropicMaxBatchChars" @input="setAnthropicMaxBatchChars" />
          </label>
          <label class="field">
            <span>超时毫秒</span>
            <input data-testid="anthropic-request-timeout" type="number" min="5000" max="180000" step="5000" :value="config.anthropicRequestTimeoutMs" @input="setAnthropicRequestTimeoutMs" />
          </label>
          <label class="field">
            <span>最大输出 tokens</span>
            <input data-testid="anthropic-max-output-tokens" type="number" min="256" max="16000" step="256" :value="config.anthropicMaxOutputTokens" @input="setAnthropicMaxOutputTokens" />
          </label>
        </div>
        <label class="field prompt-field">
          <span>系统提示词</span>
          <textarea data-testid="anthropic-system-prompt" spellcheck="false" :value="config.anthropicSystemPrompt" @input="setAnthropicSystemPrompt" />
        </label>
      </div>

      <div v-if="config.provider === 'openrouter'" class="openrouter-settings">
        <label class="field">
          <span>OpenRouter API 地址</span>
          <input data-testid="openrouter-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.openrouterEndpoint" @input="setOpenRouterEndpoint" />
        </label>
        <label class="field">
          <span>API Key</span>
          <input data-testid="openrouter-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.openrouterApiKey" @input="setOpenRouterApiKey" />
        </label>
        <label class="field">
          <span>模型</span>
          <input data-testid="openrouter-model" type="text" autocomplete="off" spellcheck="false" :value="config.openrouterModel" @input="setOpenRouterModel" />
        </label>
      </div>

      <div v-if="config.provider === 'openrouter'" class="openrouter-advanced" aria-label="OpenRouter API 请求设置">
        <h3>OpenRouter 请求设置</h3>
        <div class="tuning-grid">
          <label class="field">
            <span>并发数</span>
            <input data-testid="openrouter-max-concurrent" type="number" min="1" max="8" step="1" :value="config.openrouterMaxConcurrentRequests" @input="setOpenRouterMaxConcurrentRequests" />
          </label>
          <label class="field">
            <span>每批段落</span>
            <input data-testid="openrouter-max-batch-items" type="number" min="1" max="80" step="1" :value="config.openrouterMaxBatchItems" @input="setOpenRouterMaxBatchItems" />
          </label>
          <label class="field">
            <span>每批字符</span>
            <input data-testid="openrouter-max-batch-chars" type="number" min="500" max="30000" step="500" :value="config.openrouterMaxBatchChars" @input="setOpenRouterMaxBatchChars" />
          </label>
          <label class="field">
            <span>超时毫秒</span>
            <input data-testid="openrouter-request-timeout" type="number" min="5000" max="180000" step="5000" :value="config.openrouterRequestTimeoutMs" @input="setOpenRouterRequestTimeoutMs" />
          </label>
        </div>
        <label class="field prompt-field">
          <span>系统提示词</span>
          <textarea data-testid="openrouter-system-prompt" spellcheck="false" :value="config.openrouterSystemPrompt" @input="setOpenRouterSystemPrompt" />
        </label>
      </div>
    </section>

    <section class="panel" aria-label="交互入口设置" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>交互入口</h2>
          <p>选择浏览网页时保留哪些页面工具。</p>
        </div>
      </div>

      <div class="toggle-list">
        <label class="toggle-row">
          <span>悬浮球</span>
          <input
            data-testid="options-floating-ball-toggle"
            type="checkbox"
            :checked="config.showFloatingBall"
            @change="updateConfig({ showFloatingBall: ($event.target as HTMLInputElement).checked })"
          />
        </label>

        <label class="toggle-row">
          <span>调试面板</span>
          <input
            data-testid="options-debug-overlay-toggle"
            type="checkbox"
            :checked="config.showDebugOverlay"
            @change="updateConfig({ showDebugOverlay: ($event.target as HTMLInputElement).checked })"
          />
        </label>

        <label class="toggle-row">
          <span>输入框翻译</span>
          <input
            data-testid="options-input-translator-toggle"
            type="checkbox"
            :checked="config.showInputTranslator"
            @change="updateConfig({ showInputTranslator: ($event.target as HTMLInputElement).checked })"
          />
        </label>

        <label class="toggle-row">
          <span>缓存</span>
          <input
            data-testid="options-cache-toggle"
            type="checkbox"
            :checked="config.useCache"
            @change="updateConfig({ useCache: ($event.target as HTMLInputElement).checked })"
          />
        </label>

        <div class="cache-management" aria-label="缓存管理">
          <div>
            <strong>缓存状态</strong>
            <p data-testid="cache-stats-summary">{{ cacheStatsSummary }}</p>
            <p v-if="cacheStatsDetails" class="cache-details">{{ cacheStatsDetails }}</p>
          </div>
          <div class="action-row cache-actions">
            <button data-testid="cache-stats-refresh" class="compact-button" type="button" @click="loadCacheStats">刷新</button>
            <button
              data-testid="cache-clear-all"
              class="compact-button danger-button"
              type="button"
              :disabled="isClearingCache"
              @click="clearAllCache"
            >
              清空缓存
            </button>
          </div>
        </div>

        <label class="toggle-row">
          <span>翻译新内容</span>
          <input
            data-testid="options-new-content-toggle"
            type="checkbox"
            :checked="config.dynamicMode !== 'off'"
            @change="setTranslateNewContent"
          />
        </label>
      </div>
    </section>

    <section class="panel" aria-label="个性化设置" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>个性化</h2>
          <p>保持产品名、技术术语和偏好译法一致。</p>
        </div>
      </div>

      <label class="field prompt-field">
        <span>术语表</span>
        <textarea
          data-testid="glossary-text"
          spellcheck="false"
          placeholder="OpenAI = OpenAI&#10;prompt = 提示词 # LLM 术语"
          :value="glossaryText"
          @input="setGlossaryText"
        />
      </label>

      <div class="action-row">
        <button data-testid="glossary-export" class="compact-button" type="button" @click="exportGlossary">导出术语表</button>
        <button data-testid="glossary-import" class="compact-button" type="button" @click="importGlossary">导入术语表</button>
      </div>

      <div class="import-grid">
        <label class="field prompt-field">
          <span>导入 JSON 或文本</span>
          <textarea
            data-testid="glossary-import-text"
            spellcheck="false"
            :value="glossaryImportText"
            @input="glossaryImportText = ($event.target as HTMLTextAreaElement).value"
          />
        </label>
        <label class="field prompt-field">
          <span>导出 JSON</span>
          <textarea data-testid="glossary-export-text" readonly spellcheck="false" :value="glossaryExportText" />
        </label>
      </div>
      <p v-if="glossaryImportError" class="error-text">{{ glossaryImportError }}</p>
    </section>

    <section class="panel" aria-label="站点规则设置" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>站点规则</h2>
          <p>为不同站点设置自动翻译、显示方式和翻译服务。</p>
        </div>
        <button v-if="siteRules.length > 0" class="compact-button danger-button" type="button" @click="clearSiteRules">清空</button>
      </div>

      <div class="site-rule-editor">
        <label class="field">
          <span>站点</span>
          <input
            data-testid="site-rule-host"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="youtube.com"
            :value="siteRuleHost"
            @input="siteRuleHost = ($event.target as HTMLInputElement).value"
          />
        </label>
        <label class="field">
          <span>自动翻译</span>
          <select data-testid="site-rule-auto-translate" :value="siteRuleAutoTranslate" @change="siteRuleAutoTranslate = ($event.target as HTMLSelectElement).value as SiteAutoTranslateChoice">
            <option value="global">跟随全局</option>
            <option value="always">总是</option>
            <option value="never">从不</option>
          </select>
        </label>
        <label class="field">
          <span>显示方式</span>
          <select data-testid="site-rule-display-mode" :value="siteRuleDisplayMode" @change="siteRuleDisplayMode = ($event.target as HTMLSelectElement).value as DisplayMode">
            <option value="global">跟随全局</option>
            <option value="smart">智能</option>
            <option value="bilingual">双语</option>
            <option value="translation-only">仅译文</option>
          </select>
        </label>
        <label class="field">
          <span>主服务</span>
          <select data-testid="site-rule-provider" :value="siteRuleProvider" @change="siteRuleProvider = ($event.target as HTMLSelectElement).value as ExtensionProvider">
            <option value="global">跟随全局</option>
            <option value="microsoft">Microsoft</option>
            <option value="openai-compatible">OpenAI API</option>
            <option value="gemini">Google Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="anthropic">Claude</option>
            <option value="openrouter">OpenRouter</option>
            <option value="fake">本地测试</option>
          </select>
        </label>
        <label class="field">
          <span>备用服务</span>
          <select data-testid="site-rule-fallback-provider" :value="siteRuleFallbackProvider" @change="siteRuleFallbackProvider = ($event.target as HTMLSelectElement).value as FallbackProvider">
            <option value="global">跟随全局</option>
            <option value="none">不使用</option>
            <option value="microsoft">Microsoft</option>
            <option value="openai-compatible">OpenAI API</option>
            <option value="gemini">Google Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="anthropic">Claude</option>
            <option value="openrouter">OpenRouter</option>
            <option value="fake">本地测试</option>
          </select>
        </label>
        <button data-testid="site-rule-save" class="compact-button site-rule-save" type="button" @click="saveSiteRule">保存规则</button>
      </div>
      <p v-if="siteRuleError" class="error-text">{{ siteRuleError }}</p>

      <div class="site-rule-list">
        <div v-for="rule in siteRules" :key="rule.siteKey" class="site-rule-row" :data-testid="`site-rule-row-${rule.siteKey}`">
          <div>
            <strong>{{ rule.siteKey }}</strong>
            <span>
              {{ siteRuleAutoLabel(rule.autoTranslate) }}
              <template v-if="rule.displayMode">，{{ displayModeLabel(rule.displayMode) }}</template>
              <template v-if="rule.provider">，{{ providerLabel(rule.provider) }}</template>
              <template v-if="rule.fallbackProvider">，备用 {{ providerLabel(rule.fallbackProvider) }}</template>
            </span>
          </div>
          <button
            class="compact-button danger-button"
            type="button"
            :data-testid="`site-rule-remove-${rule.siteKey}`"
            @click="removeSiteRule(rule.siteKey)"
          >
            删除
          </button>
        </div>
        <p v-if="siteRules.length === 0" class="empty-text">暂无站点规则</p>
      </div>
    </section>

  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #eef2f6;
}

.options {
  --imt-accent: #1769d1;
  --imt-accent-strong: #1459b8;
  --imt-success: #10a38f;
  --imt-danger: #b43b3b;
  --imt-ink: #14213d;
  --imt-muted: #667085;
  --imt-line: rgba(20, 33, 61, 0.12);
  --imt-soft: #f6f8fb;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28px;
  color: var(--imt-ink);
  font: 14px "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
}

.page-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  max-width: 860px;
  margin: 0 auto 20px;
}

.page-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(20, 33, 61, 0.12);
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: 20px;
  line-height: 1.2;
}

h2 {
  font-size: 17px;
  line-height: 1.25;
}

h3 {
  font-size: 14px;
  line-height: 1.25;
}

p {
  color: var(--imt-muted);
  line-height: 1.5;
}

.saved {
  color: #0f8d7d;
  font-size: 12px;
  font-weight: 650;
}

.panel {
  display: grid;
  gap: 16px;
  max-width: 860px;
  margin: 0 auto 16px;
  padding: 20px;
  border: 1px solid var(--imt-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 28px rgba(20, 33, 61, 0.06);
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.compact-button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  color: var(--imt-ink);
  background: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.compact-button:focus-visible,
select:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgba(23, 105, 209, 0.42);
  outline-offset: 2px;
}

.compact-button:hover {
  background: var(--imt-soft);
  border-color: rgba(23, 105, 209, 0.22);
}

.danger-button {
  color: var(--imt-danger);
}

.import-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.site-rule-editor {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 12px;
}

.site-rule-save {
  align-self: end;
  min-width: 112px;
}

.site-rule-list {
  display: grid;
  gap: 8px;
}

.site-rule-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  background: var(--imt-soft);
}

.site-rule-row strong,
.site-rule-row span {
  display: block;
}

.site-rule-row span,
.empty-text,
.error-text {
  color: var(--imt-muted);
  font-size: 12px;
}

.error-text {
  color: var(--imt-danger);
  font-weight: 650;
}

.field {
  display: grid;
  gap: 6px;
}

.toggle-list {
  display: grid;
  gap: 10px;
}

.toggle-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 40px;
  padding: 0 2px;
}

.toggle-row > span {
  color: #526b7f;
  font-size: 13px;
  font-weight: 650;
}

.cache-management {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  background: var(--imt-soft);
}

.cache-management strong {
  display: block;
  color: var(--imt-ink);
  font-size: 13px;
}

.cache-details {
  font-size: 12px;
}

.cache-actions {
  justify-content: flex-end;
}

.field > span {
  color: #526b7f;
  font-size: 12px;
  font-weight: 650;
}

select,
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  color: var(--imt-ink);
  background: #ffffff;
  font: inherit;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

select,
input {
  min-height: 36px;
  padding: 0 10px;
}

input[type="checkbox"] {
  position: relative;
  width: 38px;
  height: 22px;
  appearance: none;
  border: 1px solid rgba(20, 33, 61, 0.16);
  border-radius: 999px;
  background: #dbe2eb;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}

input[type="checkbox"]::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(20, 33, 61, 0.18);
  transition: transform 160ms ease;
}

input[type="checkbox"]:checked {
  border-color: rgba(16, 163, 143, 0.5);
  background: var(--imt-success);
}

input[type="checkbox"]:checked::before {
  transform: translateX(16px);
}

textarea {
  min-height: 116px;
  resize: vertical;
  padding: 10px;
  line-height: 1.45;
}

.openai-settings,
.gemini-settings,
.deepseek-settings,
.anthropic-settings,
.openrouter-settings {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr;
  gap: 12px;
}

.openai-advanced,
.gemini-advanced,
.deepseek-advanced,
.anthropic-advanced,
.openrouter-advanced {
  display: grid;
  gap: 12px;
  padding-top: 4px;
}

.tuning-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.prompt-field {
  max-width: 100%;
}

@media (max-width: 720px) {
  .options {
    padding: 18px;
  }

  .page-header,
  .panel-heading,
  .cache-management,
  .openai-settings,
  .gemini-settings,
  .deepseek-settings,
  .anthropic-settings,
  .openrouter-settings,
  .tuning-grid,
  .import-grid,
  .site-rule-editor {
    grid-template-columns: 1fr;
  }
}
</style>
