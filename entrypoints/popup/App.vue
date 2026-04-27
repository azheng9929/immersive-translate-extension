<script setup lang="ts">
import type { BackgroundMessage, MessageResponse } from "../../src/shared/messages";

const send = async (message: BackgroundMessage) => {
  const response = (await chrome.runtime.sendMessage(message)) as MessageResponse;
  if (!response.ok) console.warn(response.error);
};
</script>

<template>
  <main class="popup">
    <h1>Immersive Translate Lab</h1>
    <button type="button" @click="send({ type: 'IMT_POPUP_TRANSLATE_ACTIVE_TAB' })">Translate page</button>
    <button type="button" @click="send({ type: 'IMT_POPUP_RESTORE_ACTIVE_TAB' })">Restore original</button>
  </main>
</template>

<style scoped>
.popup {
  width: 280px;
  padding: 12px;
  font: 14px system-ui, sans-serif;
}

h1 {
  margin: 0 0 12px;
  font-size: 16px;
}

button {
  width: 100%;
  min-height: 36px;
  margin-block-start: 8px;
}
</style>
