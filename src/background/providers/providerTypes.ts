import type { UnitCategory } from "../../shared/types";

export type ProviderId = "fake" | "microsoft" | "openai-compatible";

export type ProviderRequestItem = {
  id: string;
  text: string;
  category: UnitCategory;
};

export type ProviderRequest = {
  provider: ProviderId;
  model?: string;
  endpoint?: string;
  apiKey?: string;
  maxConcurrentRequests?: number;
  maxBatchItems?: number;
  maxBatchChars?: number;
  requestTimeoutMs?: number;
  systemPrompt?: string;
  sourceLang?: string;
  targetLang: string;
  items: ProviderRequestItem[];
};

export type ProviderResponseItem = {
  id: string;
  text: string;
  detectedLang?: string;
  status: "ok" | "skipped" | "failed";
  error?: string;
};

export type TranslationProvider = {
  translate(request: ProviderRequest): Promise<ProviderResponseItem[]>;
};
