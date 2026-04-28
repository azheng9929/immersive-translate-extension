<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { DEFAULT_EXTENSION_CONFIG, type DynamicMode, type ExtensionConfig, type ExtensionConfigPatch } from "../../src/shared/config";
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

const setDynamicMode = (dynamicMode: DynamicMode) => {
  void updateConfig({ dynamicMode });
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
        <p>设置</p>
      </div>
    </header>

    <section class="panel" aria-label="动态补翻设置" :aria-busy="isLoading">
      <div class="panel-heading">
        <div>
          <h2>动态补翻</h2>
          <p>控制页面滚动、懒加载、评论流和信息流更新时的补翻强度。</p>
        </div>
        <span v-if="savedAt" class="saved">已保存 {{ savedAt }}</span>
      </div>

      <div class="mode-grid" role="group" aria-label="动态补翻模式">
        <button data-testid="options-dynamic-mode-off" type="button" :class="{ active: config.dynamicMode === 'off' }" @click="setDynamicMode('off')">
          <strong>关闭</strong>
          <span>只翻译当前已扫描内容，不监听后续变化。</span>
        </button>
        <button data-testid="options-dynamic-mode-conservative" type="button" :class="{ active: config.dynamicMode === 'conservative' }" @click="setDynamicMode('conservative')">
          <strong>保守</strong>
          <span>适合 X、YouTube、Reddit 这类高动态页面，降低补翻频率。</span>
        </button>
        <button data-testid="options-dynamic-mode-normal" type="button" :class="{ active: config.dynamicMode === 'normal' }" @click="setDynamicMode('normal')">
          <strong>正常</strong>
          <span>适合普通文章、文档、搜索结果页，补翻更积极。</span>
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
  display: flex;
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

.panel {
  max-width: 860px;
  margin: 0 auto;
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
  margin-bottom: 16px;
}

.saved {
  flex: 0 0 auto;
  color: #128473;
  font-size: 12px;
  font-weight: 650;
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

  .panel-heading,
  .mode-grid {
    grid-template-columns: 1fr;
  }

  .panel-heading {
    display: grid;
  }
}
</style>
