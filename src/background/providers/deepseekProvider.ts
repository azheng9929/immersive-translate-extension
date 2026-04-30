import { DEFAULT_DEEPSEEK_SYSTEM_PROMPT, DEFAULT_EXTENSION_CONFIG } from "../../shared/config";
import { createChatCompletionProvider } from "./chatCompletionProvider";

export const deepseekProvider = createChatCompletionProvider({
  providerName: "DeepSeek",
  defaultModel: DEFAULT_EXTENSION_CONFIG.deepseekModel,
  defaultMaxConcurrentRequests: DEFAULT_EXTENSION_CONFIG.deepseekMaxConcurrentRequests,
  defaultMaxBatchItems: DEFAULT_EXTENSION_CONFIG.deepseekMaxBatchItems,
  defaultMaxBatchChars: DEFAULT_EXTENSION_CONFIG.deepseekMaxBatchChars,
  defaultRequestTimeoutMs: DEFAULT_EXTENSION_CONFIG.deepseekRequestTimeoutMs,
  defaultSystemPrompt: DEFAULT_DEEPSEEK_SYSTEM_PROMPT,
  responseFormat: "json_object",
  extraBody: () => ({
    thinking: { type: "disabled" },
  }),
});
