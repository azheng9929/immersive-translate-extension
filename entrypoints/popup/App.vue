<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  DEFAULT_EXTENSION_CONFIG,
  displayModeToPageRenderState,
  type DisplayMode,
  type ExtensionConfig,
  type ExtensionConfigPatch,
  type ExtensionProvider,
  type PageRenderState,
} from "../../src/shared/config";
import type { BackgroundMessage, MessageResponse } from "../../src/shared/messages";
import type { PageTranslationStatus } from "../../src/content/pageTranslationSession";
import type { DiagnosticReasonCounts, TranslationDiagnostics } from "../../src/content/translationDiagnostics";
import { normalizeSiteRuleKey, setSiteRule } from "../../src/shared/siteRules";

const config = reactive<ExtensionConfig>({ ...DEFAULT_EXTENSION_CONFIG });
const isLoading = ref(true);
const pageStatus = ref<PageTranslationStatus | undefined>();
const pageStatusError = ref("");

const send = async (message: BackgroundMessage) => {
  const response = (await chrome.runtime.sendMessage(message)) as MessageResponse;
  if (!response.ok) console.warn(response.error);
  if (message.type === "IMT_POPUP_TRANSLATE_ACTIVE_TAB" || message.type === "IMT_POPUP_RESTORE_ACTIVE_TAB") {
    await loadPageStatus();
  }
};

const updateConfig = async (patch: ExtensionConfigPatch) => {
  Object.assign(config, patch);
  const response = (await chrome.runtime.sendMessage({ type: "IMT_UPDATE_CONFIG", patch })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
};

const setTargetLang = (event: Event) => {
  void updateConfig({ targetLang: (event.target as HTMLSelectElement).value });
};

const setProvider = (event: Event) => {
  void updateConfig({ provider: (event.target as HTMLSelectElement).value as ExtensionProvider });
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

const setGeminiEndpoint = (event: Event) => {
  void updateConfig({ geminiEndpoint: (event.target as HTMLInputElement).value });
};

const setGeminiApiKey = (event: Event) => {
  void updateConfig({ geminiApiKey: (event.target as HTMLInputElement).value });
};

const setGeminiModel = (event: Event) => {
  void updateConfig({ geminiModel: (event.target as HTMLInputElement).value });
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

const setAnthropicEndpoint = (event: Event) => {
  void updateConfig({ anthropicEndpoint: (event.target as HTMLInputElement).value });
};

const setAnthropicApiKey = (event: Event) => {
  void updateConfig({ anthropicApiKey: (event.target as HTMLInputElement).value });
};

const setAnthropicModel = (event: Event) => {
  void updateConfig({ anthropicModel: (event.target as HTMLInputElement).value });
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

const setActiveTabRenderState = async (renderState: PageRenderState) => {
  const response = (await chrome.runtime.sendMessage({
    type: "IMT_POPUP_SET_ACTIVE_TAB_RENDER_STATE",
    renderState,
  })) as MessageResponse;
  if (!response.ok) console.warn(response.error);
  await loadPageStatus();
};

const setDisplayMode = (displayMode: DisplayMode) => {
  void (async () => {
    await updateConfig({ displayMode });
    await setActiveTabRenderState(displayModeToPageRenderState(displayMode));
  })();
};

const showOriginal = () => {
  void setActiveTabRenderState("original");
};

const setCurrentSiteAutoTranslate = async (enabled: boolean) => {
  const siteKey = currentSiteRuleKey.value;
  if (!siteKey) return;
  const currentRule = config.siteRules[siteKey] ?? {};
  await updateConfig({
    siteRules: setSiteRule(config.siteRules, siteKey, { ...currentRule, autoTranslate: enabled }),
  });
  await loadPageStatus();
};

const openOptions = () => {
  void chrome.runtime.openOptionsPage();
};

const loadPageStatus = async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_POPUP_GET_ACTIVE_TAB_STATUS" })) as MessageResponse;
  if (response.ok && "status" in response) {
    pageStatus.value = response.status;
    pageStatusError.value = "";
    return;
  }
  pageStatus.value = undefined;
  pageStatusError.value = response.ok ? "暂无页面状态" : response.error;
};

const pageStatusSummary = computed(() => {
  if (pageStatusError.value) return pageStatusError.value;
  const status = pageStatus.value;
  if (!status) return "暂无页面状态";
  return `${statusLabel(status.phase)} - 已翻译 ${status.translated} / ${status.total}`;
});

const pageDiagnosticsRows = computed(() => detailedDiagnosticsLabels(pageStatus.value));

const currentSite = computed(() => pageStatus.value?.site);

const currentSiteRuleKey = computed(() => {
  const site = currentSite.value;
  if (!site) return "";
  return normalizeSiteRuleKey(site.hostname) || normalizeSiteRuleKey(site.siteKey);
});

const currentSiteAutoTranslate = computed(() => {
  const siteKey = currentSiteRuleKey.value;
  if (!siteKey) return false;
  return config.siteRules[siteKey]?.autoTranslate === true;
});

const currentSiteSummary = computed(() => {
  const site = currentSite.value;
  if (!site) return "暂无站点策略";
  return `${currentSiteRuleKey.value || site.siteKey} - 新内容自动处理`;
});

const openAIStatus = computed(() => {
  if (config.provider !== "openai-compatible") return "未选择";
  return config.openaiApiKey ? `就绪 - ${config.openaiModel}` : "需要 API Key";
});

const openAIEndpointSummary = computed(() => endpointSummary(config.openaiEndpoint));

const geminiStatus = computed(() => {
  if (config.provider !== "gemini") return "未选择";
  return config.geminiApiKey ? `就绪 - ${config.geminiModel}` : "需要 API Key";
});

const geminiEndpointSummary = computed(() => endpointSummary(config.geminiEndpoint));

const deepSeekStatus = computed(() => {
  if (config.provider !== "deepseek") return "未选择";
  return config.deepseekApiKey ? `就绪 - ${config.deepseekModel}` : "需要 API Key";
});

const deepSeekEndpointSummary = computed(() => endpointSummary(config.deepseekEndpoint));

const anthropicStatus = computed(() => {
  if (config.provider !== "anthropic") return "未选择";
  return config.anthropicApiKey ? `就绪 - ${config.anthropicModel}` : "需要 API Key";
});

const anthropicEndpointSummary = computed(() => endpointSummary(config.anthropicEndpoint));

const openRouterStatus = computed(() => {
  if (config.provider !== "openrouter") return "未选择";
  return config.openrouterApiKey ? `就绪 - ${config.openrouterModel}` : "需要 API Key";
});

const openRouterEndpointSummary = computed(() => endpointSummary(config.openrouterEndpoint));

onMounted(async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
  await loadPageStatus();
  isLoading.value = false;
});

function statusLabel(phase: PageTranslationStatus["phase"]): string {
  if (phase === "translating") return "翻译中";
  if (phase === "updating") return "更新中";
  if (phase === "translated") return "已翻译";
  if (phase === "partial") return "部分完成";
  if (phase === "failed") return "失败";
  return "就绪";
}

function detailedDiagnosticsLabels(status: PageTranslationStatus | undefined): string[] {
  if (!status?.diagnostics) return [];
  const diagnostics = status.diagnostics;
  const rows = [
    `新内容${observationLabel(status.observation)}，${status.pendingRoots} 个待处理，${status.observedRoots} 个懒加载`,
    `文本扫描 ${diagnostics.scan.text.seen}，接受 ${diagnostics.scan.text.accepted}，跳过 ${diagnostics.scan.text.skipped}`,
    `属性扫描 ${diagnostics.scan.attributes.seen}，接受 ${diagnostics.scan.attributes.accepted}，跳过 ${diagnostics.scan.attributes.skipped}`,
    `翻译单元 ${diagnostics.units.built}，丢弃 ${diagnostics.units.dropped}`,
    `缓存 ${diagnostics.cache.hits} 命中，${diagnostics.cache.misses} 未命中`,
    `服务请求 ${diagnostics.provider.requested}，失败 ${diagnostics.provider.failed}，跳过 ${diagnostics.provider.skipped}`,
  ];
  const skipped = diagnosticsLabel(diagnostics);
  if (skipped) rows.push(skipped);
  return rows;
}

function diagnosticsLabel(diagnostics: TranslationDiagnostics): string {
  const counts = new Map<string, number>();
  addReasonCounts(counts, diagnostics.scan.text.skippedByReason);
  addReasonCounts(counts, diagnostics.scan.attributes.skippedByReason);
  addReasonCounts(counts, diagnostics.units.droppedByReason);
  if (counts.size === 0) return "";
  const parts = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([label, count]) => `${count} ${label}`);
  return `跳过：${parts.join("，")}`;
}

function addReasonCounts(target: Map<string, number>, reasons: DiagnosticReasonCounts): void {
  for (const [reason, count] of Object.entries(reasons)) {
    if (!count) continue;
    const label = reasonLabel(reason);
    target.set(label, (target.get(label) ?? 0) + count);
  }
}

function reasonLabel(reason: string): string {
  if (reason === "target-language") return "目标语言";
  if (reason === "global-selector" || reason === "site-selector") return "插件或站点界面";
  if (reason === "global-text" || reason === "site-text" || reason === "site-phrase") return "元数据或控件文本";
  if (reason === "not-meaningful") return "短文本";
  if (reason === "hidden") return "隐藏文本";
  if (reason === "empty") return "空文本";
  return reason.replaceAll("-", " ");
}

function observationLabel(observation: PageTranslationStatus["observation"]): string {
  if (observation === "observing") return "观察中";
  if (observation === "queued") return "排队中";
  if (observation === "paused" || observation === "suspended") return "已暂停";
  if (observation === "inactive") return "未启用";
  return "空闲";
}

function endpointSummary(value: string): string {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return "自定义地址";
  }
}
</script>

<template>
  <main class="popup">
    <header class="popup-header">
      <img src="/icons/icon-48.png" alt="" class="popup-icon" />
      <div>
        <h1>沉浸式翻译</h1>
        <p>当前页面</p>
      </div>
    </header>

    <section class="actions" aria-label="当前页面操作">
      <button class="primary-action" type="button" @click="send({ type: 'IMT_POPUP_TRANSLATE_ACTIVE_TAB' })">
        翻译整页
      </button>
      <button class="secondary-action" type="button" @click="send({ type: 'IMT_POPUP_RESTORE_ACTIVE_TAB' })">
        恢复原文
      </button>
    </section>

    <section class="debug-panel" aria-label="当前页面诊断" :aria-busy="isLoading">
      <div class="debug-header">
        <div>
          <h2>页面状态</h2>
          <p data-testid="debug-status">{{ pageStatusSummary }}</p>
        </div>
        <button class="debug-refresh" type="button" @click="loadPageStatus">刷新</button>
      </div>
      <div v-if="pageDiagnosticsRows.length > 0" class="debug-details" data-testid="popup-debug-details">
        <p v-for="row in pageDiagnosticsRows" :key="row">{{ row }}</p>
      </div>
    </section>

    <section v-if="currentSite" class="site-panel" aria-label="当前站点控制">
      <div>
        <h2>站点控制</h2>
        <p>{{ currentSiteSummary }}</p>
      </div>
      <label class="toggle-row">
        <span>本站自动翻译</span>
        <input
          data-testid="site-auto-translate-toggle"
          type="checkbox"
          :checked="currentSiteAutoTranslate"
          @change="setCurrentSiteAutoTranslate(($event.target as HTMLInputElement).checked)"
        />
      </label>
    </section>

    <section class="settings" aria-label="基础设置" :aria-busy="isLoading">
      <label class="field">
        <span>目标语言</span>
        <select :value="config.targetLang" @change="setTargetLang">
          <option value="zh-Hans">简体中文</option>
          <option value="zh-Hant">繁体中文</option>
          <option value="en">英语</option>
          <option value="ja">日语</option>
          <option value="ko">韩语</option>
        </select>
      </label>

      <label class="field">
        <span>翻译服务</span>
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

      <div v-if="config.provider === 'openai-compatible'" class="openai-quick" aria-label="OpenAI API 设置">
        <div class="openai-quick-header">
          <div>
            <h2>OpenAI API</h2>
            <p data-testid="popup-openai-status">{{ openAIStatus }}</p>
          </div>
          <p class="openai-endpoint">{{ openAIEndpointSummary }}</p>
        </div>

        <label class="field">
          <span>接口地址</span>
          <input
            data-testid="popup-openai-endpoint"
            type="url"
            autocomplete="off"
            spellcheck="false"
            :value="config.openaiEndpoint"
            @input="setOpenAIEndpoint"
          />
        </label>

        <div class="openai-grid">
          <label class="field">
            <span>API Key</span>
            <input
              data-testid="popup-openai-api-key"
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
              data-testid="popup-openai-model"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :value="config.openaiModel"
              @input="setOpenAIModel"
            />
          </label>
        </div>
      </div>

      <div v-if="config.provider === 'gemini'" class="openai-quick" aria-label="Gemini API 设置">
        <div class="openai-quick-header">
          <div>
            <h2>Google Gemini</h2>
            <p data-testid="popup-gemini-status">{{ geminiStatus }}</p>
          </div>
          <p class="openai-endpoint">{{ geminiEndpointSummary }}</p>
        </div>

        <label class="field">
          <span>接口地址</span>
          <input
            data-testid="popup-gemini-endpoint"
            type="url"
            autocomplete="off"
            spellcheck="false"
            :value="config.geminiEndpoint"
            @input="setGeminiEndpoint"
          />
        </label>

        <div class="openai-grid">
          <label class="field">
            <span>API Key</span>
            <input
              data-testid="popup-gemini-api-key"
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
              data-testid="popup-gemini-model"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :value="config.geminiModel"
              @input="setGeminiModel"
            />
          </label>
        </div>
      </div>

      <div v-if="config.provider === 'deepseek'" class="openai-quick" aria-label="DeepSeek API 设置">
        <div class="openai-quick-header">
          <div>
            <h2>DeepSeek</h2>
            <p data-testid="popup-deepseek-status">{{ deepSeekStatus }}</p>
          </div>
          <p class="openai-endpoint">{{ deepSeekEndpointSummary }}</p>
        </div>
        <label class="field">
          <span>接口地址</span>
          <input data-testid="popup-deepseek-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.deepseekEndpoint" @input="setDeepSeekEndpoint" />
        </label>
        <div class="openai-grid">
          <label class="field">
            <span>API Key</span>
            <input data-testid="popup-deepseek-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.deepseekApiKey" @input="setDeepSeekApiKey" />
          </label>
          <label class="field">
            <span>模型</span>
            <input data-testid="popup-deepseek-model" type="text" autocomplete="off" spellcheck="false" :value="config.deepseekModel" @input="setDeepSeekModel" />
          </label>
        </div>
      </div>

      <div v-if="config.provider === 'anthropic'" class="openai-quick" aria-label="Claude API 设置">
        <div class="openai-quick-header">
          <div>
            <h2>Claude</h2>
            <p data-testid="popup-anthropic-status">{{ anthropicStatus }}</p>
          </div>
          <p class="openai-endpoint">{{ anthropicEndpointSummary }}</p>
        </div>
        <label class="field">
          <span>接口地址</span>
          <input data-testid="popup-anthropic-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.anthropicEndpoint" @input="setAnthropicEndpoint" />
        </label>
        <div class="openai-grid">
          <label class="field">
            <span>API Key</span>
            <input data-testid="popup-anthropic-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.anthropicApiKey" @input="setAnthropicApiKey" />
          </label>
          <label class="field">
            <span>模型</span>
            <input data-testid="popup-anthropic-model" type="text" autocomplete="off" spellcheck="false" :value="config.anthropicModel" @input="setAnthropicModel" />
          </label>
        </div>
      </div>

      <div v-if="config.provider === 'openrouter'" class="openai-quick" aria-label="OpenRouter API 设置">
        <div class="openai-quick-header">
          <div>
            <h2>OpenRouter</h2>
            <p data-testid="popup-openrouter-status">{{ openRouterStatus }}</p>
          </div>
          <p class="openai-endpoint">{{ openRouterEndpointSummary }}</p>
        </div>
        <label class="field">
          <span>接口地址</span>
          <input data-testid="popup-openrouter-endpoint" type="url" autocomplete="off" spellcheck="false" :value="config.openrouterEndpoint" @input="setOpenRouterEndpoint" />
        </label>
        <div class="openai-grid">
          <label class="field">
            <span>API Key</span>
            <input data-testid="popup-openrouter-api-key" type="password" autocomplete="off" spellcheck="false" :value="config.openrouterApiKey" @input="setOpenRouterApiKey" />
          </label>
          <label class="field">
            <span>模型</span>
            <input data-testid="popup-openrouter-model" type="text" autocomplete="off" spellcheck="false" :value="config.openrouterModel" @input="setOpenRouterModel" />
          </label>
        </div>
      </div>

      <div class="field">
        <span>显示方式</span>
        <div class="segmented" role="group" aria-label="显示方式">
          <button data-testid="display-mode-smart" type="button" :class="{ active: config.displayMode === 'smart' }" @click="setDisplayMode('smart')">智能</button>
          <button data-testid="display-mode-bilingual" type="button" :class="{ active: config.displayMode === 'bilingual' }" @click="setDisplayMode('bilingual')">双语</button>
          <button data-testid="display-mode-translation" type="button" :class="{ active: config.displayMode === 'translation-only' }" @click="setDisplayMode('translation-only')">译文</button>
          <button data-testid="display-mode-original" type="button" @click="showOriginal">原文</button>
        </div>
      </div>
      <label class="toggle-row">
        <span>悬浮球</span>
        <input type="checkbox" :checked="config.showFloatingBall" @change="updateConfig({ showFloatingBall: ($event.target as HTMLInputElement).checked })" />
      </label>

      <label class="toggle-row">
        <span>输入框翻译</span>
        <input
          data-testid="popup-input-translator-toggle"
          type="checkbox"
          :checked="config.showInputTranslator"
          @change="updateConfig({ showInputTranslator: ($event.target as HTMLInputElement).checked })"
        />
      </label>

      <label class="toggle-row">
        <span>缓存</span>
        <input type="checkbox" :checked="config.useCache" @change="updateConfig({ useCache: ($event.target as HTMLInputElement).checked })" />
      </label>

      <button class="settings-link" type="button" @click="openOptions">打开设置</button>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #eef2f6;
}

.popup {
  --imt-accent: #1769d1;
  --imt-accent-strong: #1459b8;
  --imt-success: #10a38f;
  --imt-ink: #14213d;
  --imt-muted: #667085;
  --imt-line: rgba(20, 33, 61, 0.12);
  --imt-soft: #f6f8fb;
  width: 326px;
  box-sizing: border-box;
  padding: 14px;
  color: var(--imt-ink);
  background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
  font: 14px "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 2px 12px;
}

.popup-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(20, 33, 61, 0.12);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 15px;
  line-height: 1.2;
}

h2 {
  font-size: 13px;
  line-height: 1.2;
}

p {
  color: var(--imt-muted);
  font-size: 12px;
}

button {
  width: 100%;
  min-height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid rgba(23, 105, 209, 0.42);
  outline-offset: 2px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.primary-action {
  border: 0;
  color: #ffffff;
  background: var(--imt-accent);
  box-shadow: 0 10px 22px rgba(23, 105, 209, 0.2);
}

.primary-action:hover {
  background: var(--imt-accent-strong);
  transform: translateY(-1px);
}

.secondary-action,
.settings-link,
.debug-refresh {
  border: 1px solid var(--imt-line);
  color: var(--imt-ink);
  background: #ffffff;
}

.secondary-action:hover,
.settings-link:hover,
.debug-refresh:hover {
  background: var(--imt-soft);
  border-color: rgba(23, 105, 209, 0.22);
}

.debug-panel,
.site-panel,
.settings {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--imt-line);
}

.debug-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 10px;
}

.debug-refresh {
  width: auto;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
}

.debug-details {
  display: grid;
  gap: 5px;
  padding: 8px;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  background: #ffffff;
}

.debug-details p {
  line-height: 1.35;
}

.field,
.toggle-row {
  display: grid;
  gap: 6px;
}

.field > span,
.toggle-row > span {
  color: #526b7f;
  font-size: 12px;
  font-weight: 650;
}

select {
  width: 100%;
  min-height: 34px;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  padding: 0 9px;
  color: var(--imt-ink);
  background: #ffffff;
  font: inherit;
}

.field input {
  width: 100%;
  min-height: 34px;
  box-sizing: border-box;
  border: 1px solid var(--imt-line);
  border-radius: 8px;
  padding: 0 9px;
  color: var(--imt-ink);
  background: #ffffff;
  font: inherit;
}

.openai-quick {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(16, 163, 143, 0.18);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(20, 33, 61, 0.06);
}

.openai-quick-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 8px;
}

.openai-endpoint {
  max-width: 118px;
  overflow: hidden;
  color: #0f8d7d;
  font-weight: 650;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.openai-grid {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 8px;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(15, 42, 95, 0.12);
  border-radius: 8px;
  background: #ffffff;
}

.segmented button {
  min-height: 30px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #526b7f;
  box-shadow: none;
  font-size: 12px;
}

.segmented button.active {
  color: #ffffff;
  background: var(--imt-accent);
}

.toggle-row {
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 30px;
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

.settings-link {
  min-height: 32px;
  border-radius: 8px;
  box-shadow: none;
  font-size: 12px;
}
</style>
