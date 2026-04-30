import { DEFAULT_EXTENSION_CONFIG, DEFAULT_OPENAI_SYSTEM_PROMPT } from "../../shared/config";
import { createChatCompletionProvider } from "./chatCompletionProvider";

export const openaiProvider = createChatCompletionProvider({
  providerName: "OpenAI",
  defaultModel: DEFAULT_EXTENSION_CONFIG.openaiModel,
  defaultMaxConcurrentRequests: DEFAULT_EXTENSION_CONFIG.openaiMaxConcurrentRequests,
  defaultMaxBatchItems: DEFAULT_EXTENSION_CONFIG.openaiMaxBatchItems,
  defaultMaxBatchChars: DEFAULT_EXTENSION_CONFIG.openaiMaxBatchChars,
  defaultRequestTimeoutMs: DEFAULT_EXTENSION_CONFIG.openaiRequestTimeoutMs,
  defaultSystemPrompt: DEFAULT_OPENAI_SYSTEM_PROMPT,
  responseFormat: "json_schema",
});
