import { DEFAULT_EXTENSION_CONFIG, DEFAULT_OPENROUTER_SYSTEM_PROMPT } from "../../shared/config";
import { createChatCompletionProvider } from "./chatCompletionProvider";

export const openrouterProvider = createChatCompletionProvider({
  providerName: "OpenRouter",
  defaultModel: DEFAULT_EXTENSION_CONFIG.openrouterModel,
  defaultMaxConcurrentRequests: DEFAULT_EXTENSION_CONFIG.openrouterMaxConcurrentRequests,
  defaultMaxBatchItems: DEFAULT_EXTENSION_CONFIG.openrouterMaxBatchItems,
  defaultMaxBatchChars: DEFAULT_EXTENSION_CONFIG.openrouterMaxBatchChars,
  defaultRequestTimeoutMs: DEFAULT_EXTENSION_CONFIG.openrouterRequestTimeoutMs,
  defaultSystemPrompt: DEFAULT_OPENROUTER_SYSTEM_PROMPT,
  responseFormat: "json_schema",
});
