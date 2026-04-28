<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { DEFAULT_EXTENSION_CONFIG, type DisplayMode, type DynamicMode, type ExtensionConfig, type ExtensionConfigPatch, type ExtensionProvider } from "../../src/shared/config";
import type { BackgroundMessage, MessageResponse } from "../../src/shared/messages";

const config = reactive<ExtensionConfig>({ ...DEFAULT_EXTENSION_CONFIG });
const isLoading = ref(true);

const send = async (message: BackgroundMessage) => {
  const response = (await chrome.runtime.sendMessage(message)) as MessageResponse;
  if (!response.ok) console.warn(response.error);
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

const setDisplayMode = (displayMode: DisplayMode) => {
  void updateConfig({ displayMode });
};

const setDynamicMode = (dynamicMode: DynamicMode) => {
  void updateConfig({ dynamicMode });
};

const openOptions = () => {
  void chrome.runtime.openOptionsPage();
};

onMounted(async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
  isLoading.value = false;
});
</script>

<template>
  <main class="popup">
    <header class="popup-header">
      <img src="/icons/icon-48.png" alt="" class="popup-icon" />
      <div>
        <h1>Immersive Translate Lab</h1>
        <p>当前页面</p>
      </div>
    </header>

    <section class="actions" aria-label="当前页面操作">
      <button class="primary-action" type="button" @click="send({ type: 'IMT_POPUP_TRANSLATE_ACTIVE_TAB' })">
        翻译当前页
      </button>
      <button class="secondary-action" type="button" @click="send({ type: 'IMT_POPUP_RESTORE_ACTIVE_TAB' })">
        还原原文
      </button>
    </section>

    <section class="settings" aria-label="基础设置" :aria-busy="isLoading">
      <label class="field">
        <span>目标语言</span>
        <select :value="config.targetLang" @change="setTargetLang">
          <option value="zh-Hans">简体中文</option>
          <option value="zh-Hant">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </label>

      <label class="field">
        <span>翻译服务</span>
        <select :value="config.provider" @change="setProvider">
          <option value="microsoft">Microsoft</option>
          <option value="fake">本地测试</option>
        </select>
      </label>

      <div class="field">
        <span>显示方式</span>
        <div class="segmented" role="group" aria-label="显示方式">
          <button type="button" :class="{ active: config.displayMode === 'smart' }" @click="setDisplayMode('smart')">智能</button>
          <button type="button" :class="{ active: config.displayMode === 'bilingual' }" @click="setDisplayMode('bilingual')">双语</button>
          <button type="button" :class="{ active: config.displayMode === 'translation-only' }" @click="setDisplayMode('translation-only')">译文</button>
        </div>
      </div>

      <div class="field">
        <span>动态补翻</span>
        <div class="segmented" role="group" aria-label="动态补翻模式">
          <button data-testid="dynamic-mode-off" type="button" :class="{ active: config.dynamicMode === 'off' }" @click="setDynamicMode('off')">关闭</button>
          <button data-testid="dynamic-mode-conservative" type="button" :class="{ active: config.dynamicMode === 'conservative' }" @click="setDynamicMode('conservative')">保守</button>
          <button data-testid="dynamic-mode-normal" type="button" :class="{ active: config.dynamicMode === 'normal' }" @click="setDynamicMode('normal')">正常</button>
        </div>
      </div>

      <label class="toggle-row">
        <span>悬浮球</span>
        <input type="checkbox" :checked="config.showFloatingBall" @change="updateConfig({ showFloatingBall: ($event.target as HTMLInputElement).checked })" />
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
.popup {
  width: 292px;
  padding: 14px;
  color: #102a5f;
  background: #f7fbfd;
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
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

h1 {
  margin: 0;
  font-size: 15px;
  line-height: 1.2;
}

p {
  margin: 3px 0 0;
  color: #66758c;
  font-size: 12px;
}

button {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
}

.actions {
  display: grid;
  gap: 8px;
}

.primary-action {
  border: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #1758db 0%, #14a896 100%);
  box-shadow: 0 10px 22px rgba(18, 94, 181, 0.18);
}

.primary-action:hover {
  background: linear-gradient(135deg, #164fc3 0%, #129887 100%);
}

.secondary-action,
.settings-link {
  border: 1px solid rgba(15, 42, 95, 0.14);
  color: #102a5f;
  background: #ffffff;
}

.secondary-action:hover,
.settings-link:hover {
  background: #f2f7fb;
}

.settings {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 42, 95, 0.1);
}

.field,
.toggle-row {
  display: grid;
  gap: 6px;
}

.field > span,
.toggle-row > span {
  color: #52627a;
  font-size: 12px;
  font-weight: 650;
}

select {
  width: 100%;
  min-height: 34px;
  border: 1px solid rgba(15, 42, 95, 0.14);
  border-radius: 9px;
  padding: 0 9px;
  color: #102a5f;
  background: #ffffff;
  font: inherit;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(15, 42, 95, 0.12);
  border-radius: 10px;
  background: #ffffff;
}

.segmented button {
  min-height: 30px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #52627a;
  box-shadow: none;
  font-size: 12px;
}

.segmented button.active {
  color: #ffffff;
  background: #1758db;
}

.toggle-row {
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 30px;
}

input[type="checkbox"] {
  width: 36px;
  height: 20px;
  accent-color: #14a896;
}

.settings-link {
  min-height: 32px;
  border-radius: 9px;
  box-shadow: none;
  font-size: 12px;
}
</style>
