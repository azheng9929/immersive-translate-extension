<script setup lang="ts">
import type { BackgroundMessage, MessageResponse } from "../../src/shared/messages";

const send = async (message: BackgroundMessage) => {
  const response = (await chrome.runtime.sendMessage(message)) as MessageResponse;
  if (!response.ok) console.warn(response.error);
};
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
        Translate
      </button>
      <button class="secondary-action" type="button" @click="send({ type: 'IMT_POPUP_RESTORE_ACTIVE_TAB' })">
        Restore
      </button>
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

.secondary-action {
  border: 1px solid rgba(15, 42, 95, 0.14);
  color: #102a5f;
  background: #ffffff;
}

.secondary-action:hover {
  background: #f2f7fb;
}
</style>
