<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  DEFAULT_EXTENSION_CONFIG,
  type DynamicMode,
  type ExtensionConfig,
  type ExtensionConfigPatch,
  type ExtensionProvider,
} from "../../src/shared/config";
import type { MessageResponse } from "../../src/shared/messages";

const config = reactive<ExtensionConfig>({ ...DEFAULT_EXTENSION_CONFIG });
const isLoading = ref(true);
const savedAt = ref("");

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

const setDynamicMode = (dynamicMode: DynamicMode) => {
  void updateConfig({ dynamicMode });
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

onMounted(async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
  isLoading.value = false;
});
</script>

<template>
  <main class="options">
    <header class="page-header">
      <img src="/icons/icon-48.png" alt="" class="page-icon" />
      <div>
        <h1>Immersive Translate Lab</h1>
        <p>Settings</p>
      </div>
      <span v-if="savedAt" class="saved">Saved {{ savedAt }}</span>
    </header>

    <section class="panel" aria-label="Translation provider settings" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>Translation provider</h2>
          <p>Choose the service used by page, selection, and input translation.</p>
        </div>
      </div>

      <label class="field">
        <span>Provider</span>
        <select :value="config.provider" @change="setProvider">
          <option value="microsoft">Microsoft</option>
          <option value="openai-compatible">OpenAI API</option>
          <option value="fake">Local test</option>
        </select>
      </label>

      <div class="openai-settings">
        <label class="field">
          <span>OpenAI API endpoint</span>
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
          <span>API key</span>
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
          <span>Model</span>
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
    </section>

    <section class="panel" aria-label="Dynamic translation settings" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>Dynamic updates</h2>
          <p>Control how the extension translates new content on feeds, comments, and infinite-scroll pages.</p>
        </div>
      </div>

      <div class="mode-grid" role="group" aria-label="Dynamic translation mode">
        <button data-testid="options-dynamic-mode-off" type="button" :class="{ active: config.dynamicMode === 'off' }" @click="setDynamicMode('off')">
          <strong>Off</strong>
          <span>Translate only the content already scanned on the page.</span>
        </button>
        <button data-testid="options-dynamic-mode-conservative" type="button" :class="{ active: config.dynamicMode === 'conservative' }" @click="setDynamicMode('conservative')">
          <strong>Safe</strong>
          <span>Use slower, smaller batches for X, YouTube, Reddit, and other busy pages.</span>
        </button>
        <button data-testid="options-dynamic-mode-normal" type="button" :class="{ active: config.dynamicMode === 'normal' }" @click="setDynamicMode('normal')">
          <strong>Normal</strong>
          <span>Use more active updates for articles, docs, and search results.</span>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #f6f8fb;
}

.options {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28px;
  color: #102a5f;
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
  border-radius: 10px;
}

h1,
h2,
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

p {
  color: #66758c;
  line-height: 1.5;
}

.saved {
  color: #128473;
  font-size: 12px;
  font-weight: 650;
}

.panel {
  display: grid;
  gap: 16px;
  max-width: 860px;
  margin: 0 auto 16px;
  padding: 20px;
  border: 1px solid rgba(15, 42, 95, 0.1);
  border-radius: 8px;
  background: #ffffff;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.field {
  display: grid;
  gap: 6px;
}

.field > span {
  color: #52627a;
  font-size: 12px;
  font-weight: 650;
}

select,
input {
  width: 100%;
  min-height: 36px;
  box-sizing: border-box;
  border: 1px solid rgba(15, 42, 95, 0.14);
  border-radius: 9px;
  padding: 0 10px;
  color: #102a5f;
  background: #ffffff;
  font: inherit;
}

.openai-settings {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr;
  gap: 12px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mode-grid button {
  min-height: 118px;
  padding: 14px;
  border: 1px solid rgba(15, 42, 95, 0.12);
  border-radius: 8px;
  color: #102a5f;
  background: #f9fbfd;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.mode-grid button.active {
  border-color: #1758db;
  background: #eef5ff;
  box-shadow: inset 0 0 0 1px #1758db;
}

.mode-grid strong {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
}

.mode-grid span {
  display: block;
  color: #52627a;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .options {
    padding: 18px;
  }

  .page-header,
  .panel-heading,
  .openai-settings,
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
