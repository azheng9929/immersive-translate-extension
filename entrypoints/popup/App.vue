<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  DEFAULT_EXTENSION_CONFIG,
  type DisplayMode,
  type DynamicMode,
  type ExtensionConfig,
  type ExtensionConfigPatch,
  type ExtensionProvider,
} from "../../src/shared/config";
import type { BackgroundMessage, MessageResponse } from "../../src/shared/messages";
import type { PageTranslationStatus } from "../../src/content/pageTranslationSession";
import type { DiagnosticReasonCounts, TranslationDiagnostics } from "../../src/content/translationDiagnostics";

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

const setDisplayMode = (displayMode: DisplayMode) => {
  void updateConfig({ displayMode });
};

const setDynamicMode = (dynamicMode: DynamicMode) => {
  void updateConfig({ dynamicMode });
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
  pageStatusError.value = response.ok ? "No page status available" : response.error;
};

const pageStatusSummary = computed(() => {
  if (pageStatusError.value) return pageStatusError.value;
  const status = pageStatus.value;
  if (!status) return "No page status yet";
  return `${statusLabel(status.phase)} - ${status.translated} / ${status.total} translated`;
});

const pageDiagnosticsRows = computed(() => detailedDiagnosticsLabels(pageStatus.value));

onMounted(async () => {
  const response = (await chrome.runtime.sendMessage({ type: "IMT_GET_CONFIG" })) as MessageResponse;
  if (response.ok && "config" in response) Object.assign(config, response.config);
  if (!response.ok) console.warn(response.error);
  await loadPageStatus();
  isLoading.value = false;
});

function statusLabel(phase: PageTranslationStatus["phase"]): string {
  if (phase === "translating") return "Translating";
  if (phase === "updating") return "Updating";
  if (phase === "translated") return "Translated";
  if (phase === "partial") return "Partial";
  if (phase === "failed") return "Failed";
  return "Ready";
}

function detailedDiagnosticsLabels(status: PageTranslationStatus | undefined): string[] {
  if (!status?.diagnostics) return [];
  const diagnostics = status.diagnostics;
  const rows = [
    `Dynamic ${status.observation}, ${status.pendingRoots} pending, ${status.observedRoots} lazy`,
    `Text scan ${diagnostics.scan.text.seen} seen, ${diagnostics.scan.text.accepted} accepted, ${diagnostics.scan.text.skipped} skipped`,
    `Attributes ${diagnostics.scan.attributes.seen} seen, ${diagnostics.scan.attributes.accepted} accepted, ${diagnostics.scan.attributes.skipped} skipped`,
    `Units ${diagnostics.units.built} built, ${diagnostics.units.dropped} dropped`,
    `Cache ${diagnostics.cache.hits} ${plural("hit", diagnostics.cache.hits)}, ${diagnostics.cache.misses} ${plural("miss", diagnostics.cache.misses)}`,
    `Provider ${diagnostics.provider.requested} requested, ${diagnostics.provider.failed} failed, ${diagnostics.provider.skipped} skipped`,
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
  return `Skipped: ${parts.join(", ")}`;
}

function addReasonCounts(target: Map<string, number>, reasons: DiagnosticReasonCounts): void {
  for (const [reason, count] of Object.entries(reasons)) {
    if (!count) continue;
    const label = reasonLabel(reason);
    target.set(label, (target.get(label) ?? 0) + count);
  }
}

function reasonLabel(reason: string): string {
  if (reason === "target-language") return "target language";
  if (reason === "global-selector" || reason === "site-selector") return "extension/site UI";
  if (reason === "global-text" || reason === "site-text" || reason === "site-phrase") return "metadata/control text";
  if (reason === "not-meaningful") return "short text";
  if (reason === "hidden") return "hidden text";
  if (reason === "empty") return "empty text";
  return reason.replaceAll("-", " ");
}

function plural(label: string, count: number): string {
  return count === 1 ? label : `${label}s`;
}
</script>

<template>
  <main class="popup">
    <header class="popup-header">
      <img src="/icons/icon-48.png" alt="" class="popup-icon" />
      <div>
        <h1>Immersive Translate Lab</h1>
        <p>Current page</p>
      </div>
    </header>

    <section class="actions" aria-label="Current page actions">
      <button class="primary-action" type="button" @click="send({ type: 'IMT_POPUP_TRANSLATE_ACTIVE_TAB' })">
        Translate page
      </button>
      <button class="secondary-action" type="button" @click="send({ type: 'IMT_POPUP_RESTORE_ACTIVE_TAB' })">
        Restore original
      </button>
    </section>

    <section class="debug-panel" aria-label="Current page diagnostics" :aria-busy="isLoading">
      <div class="debug-header">
        <div>
          <h2>Page status</h2>
          <p data-testid="debug-status">{{ pageStatusSummary }}</p>
        </div>
        <button class="debug-refresh" type="button" @click="loadPageStatus">Refresh</button>
      </div>
      <div v-if="pageDiagnosticsRows.length > 0" class="debug-details" data-testid="popup-debug-details">
        <p v-for="row in pageDiagnosticsRows" :key="row">{{ row }}</p>
      </div>
    </section>

    <section class="settings" aria-label="Basic settings" :aria-busy="isLoading">
      <label class="field">
        <span>Target language</span>
        <select :value="config.targetLang" @change="setTargetLang">
          <option value="zh-Hans">Simplified Chinese</option>
          <option value="zh-Hant">Traditional Chinese</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
        </select>
      </label>

      <label class="field">
        <span>Provider</span>
        <select :value="config.provider" @change="setProvider">
          <option value="microsoft">Microsoft</option>
          <option value="openai-compatible">OpenAI compatible</option>
          <option value="fake">Local test</option>
        </select>
      </label>

      <div class="field">
        <span>Display</span>
        <div class="segmented" role="group" aria-label="Display mode">
          <button type="button" :class="{ active: config.displayMode === 'smart' }" @click="setDisplayMode('smart')">Smart</button>
          <button type="button" :class="{ active: config.displayMode === 'bilingual' }" @click="setDisplayMode('bilingual')">Bilingual</button>
          <button type="button" :class="{ active: config.displayMode === 'translation-only' }" @click="setDisplayMode('translation-only')">Translation</button>
        </div>
      </div>

      <div class="field">
        <span>Dynamic updates</span>
        <div class="segmented" role="group" aria-label="Dynamic translation mode">
          <button data-testid="dynamic-mode-off" type="button" :class="{ active: config.dynamicMode === 'off' }" @click="setDynamicMode('off')">Off</button>
          <button data-testid="dynamic-mode-conservative" type="button" :class="{ active: config.dynamicMode === 'conservative' }" @click="setDynamicMode('conservative')">Safe</button>
          <button data-testid="dynamic-mode-normal" type="button" :class="{ active: config.dynamicMode === 'normal' }" @click="setDynamicMode('normal')">Normal</button>
        </div>
      </div>

      <label class="toggle-row">
        <span>Floating ball</span>
        <input type="checkbox" :checked="config.showFloatingBall" @change="updateConfig({ showFloatingBall: ($event.target as HTMLInputElement).checked })" />
      </label>

      <label class="toggle-row">
        <span>Cache</span>
        <input type="checkbox" :checked="config.useCache" @change="updateConfig({ useCache: ($event.target as HTMLInputElement).checked })" />
      </label>

      <button class="settings-link" type="button" @click="openOptions">Open settings</button>
    </section>
  </main>
</template>

<style scoped>
.popup {
  width: 312px;
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
.settings-link,
.debug-refresh {
  border: 1px solid rgba(15, 42, 95, 0.14);
  color: #102a5f;
  background: #ffffff;
}

.secondary-action:hover,
.settings-link:hover,
.debug-refresh:hover {
  background: #f2f7fb;
}

.debug-panel,
.settings {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 42, 95, 0.1);
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
  border: 1px solid rgba(15, 42, 95, 0.1);
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
