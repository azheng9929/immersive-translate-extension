import { DEFAULT_EXTENSION_CONFIG, DEFAULT_OPENAI_SYSTEM_PROMPT } from "../../shared/config";
import type { ProviderRequest, ProviderRequestItem, ProviderResponseItem, TranslationProvider } from "./providerTypes";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type ParsedProviderItem = Partial<ProviderResponseItem> & {
  id?: unknown;
  text?: unknown;
};

type OpenAIOptions = {
  endpoint: string;
  apiKey: string;
  model: string;
  maxConcurrentRequests: number;
  maxBatchItems: number;
  maxBatchChars: number;
  requestTimeoutMs: number;
  systemPrompt: string;
};

export const openaiProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    const options = normalizeOpenAIOptions(request);
    if (request.items.length === 0) return [];

    const chunks = chunkItems(request.items, options.maxBatchItems, options.maxBatchChars);
    const chunkResults = await mapWithConcurrency(chunks, options.maxConcurrentRequests, async (chunk) => {
      try {
        return await translateChunk(request, options, chunk);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return chunk.map((item) => failedItem(item, message));
      }
    });

    return chunkResults.flat();
  },
};

async function translateChunk(
  request: ProviderRequest,
  options: OpenAIOptions,
  items: ProviderRequestItem[],
): Promise<ProviderResponseItem[]> {
  const response = await fetchWithTimeout(options.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        {
          role: "system",
          content: options.systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLang: request.sourceLang ?? "auto",
            targetLang: request.targetLang,
            items: items.map((item) => ({
              id: item.id,
              category: item.category,
              text: item.text,
            })),
          }),
        },
      ],
    }),
  }, options.requestTimeoutMs);

  const data = await readOpenAIResponse(response);
  if (!response.ok) throw new Error(openAIErrorMessage(response.status, data));

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI API response missing content");

  const parsed = parseJsonContent(content);
  if (!Array.isArray(parsed.items)) throw new Error("OpenAI API response missing items");

  return reconcileChunkItems(items, parsed.items.map(normalizeProviderItem));
}

function normalizeOpenAIOptions(request: ProviderRequest): OpenAIOptions {
  const endpoint = request.endpoint?.trim();
  const apiKey = request.apiKey?.trim();
  if (!endpoint || !apiKey) {
    throw new Error("OpenAI API requires endpoint and API key");
  }

  return {
    endpoint,
    apiKey,
    model: request.model?.trim() || DEFAULT_EXTENSION_CONFIG.openaiModel,
    maxConcurrentRequests: normalizeInteger(request.maxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.openaiMaxConcurrentRequests, 1, 8),
    maxBatchItems: normalizeInteger(request.maxBatchItems, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchItems, 1, 80),
    maxBatchChars: normalizeInteger(request.maxBatchChars, DEFAULT_EXTENSION_CONFIG.openaiMaxBatchChars, 500, 30000),
    requestTimeoutMs: normalizeInteger(request.requestTimeoutMs, DEFAULT_EXTENSION_CONFIG.openaiRequestTimeoutMs, 5000, 180000),
    systemPrompt: request.systemPrompt?.trim() || DEFAULT_OPENAI_SYSTEM_PROMPT,
  };
}

function chunkItems(
  items: ProviderRequestItem[],
  maxBatchItems: number,
  maxBatchChars: number,
): ProviderRequestItem[][] {
  const chunks: ProviderRequestItem[][] = [];
  let current: ProviderRequestItem[] = [];
  let currentChars = 0;

  for (const item of items) {
    const itemChars = item.text.length;
    const wouldOverflowItems = current.length >= maxBatchItems;
    const wouldOverflowChars = current.length > 0 && currentChars + itemChars > maxBatchChars;

    if (wouldOverflowItems || wouldOverflowChars) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(item);
    currentChars += itemChars;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  maxConcurrent: number,
  run: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workerCount = Math.min(maxConcurrent, values.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await run(values[index] as T, index);
    }
  });

  await Promise.all(workers);
  return results;
}

async function fetchWithTimeout(endpoint: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (typeof AbortController === "undefined") return fetch(endpoint, init);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(endpoint, { ...init, signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) throw new Error(`OpenAI API timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readOpenAIResponse(response: Response): Promise<OpenAIResponse> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as OpenAIResponse;
  } catch {
    if (!response.ok) return { error: { message: text.slice(0, 300) } };
    throw new Error("OpenAI API returned invalid JSON");
  }
}

function openAIErrorMessage(status: number, data: OpenAIResponse): string {
  const message = data.error?.message?.trim();
  if (message) return `OpenAI API failed: ${status} ${message}`;
  return `OpenAI API failed: ${status}`;
}

function parseJsonContent(content: string): { items?: ParsedProviderItem[] } {
  let lastError: unknown;
  for (const candidate of jsonCandidates(content)) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (Array.isArray(parsed)) return { items: parsed as ParsedProviderItem[] };
      if (isRecord(parsed)) return parsed as { items?: ParsedProviderItem[] };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OpenAI API response content is not JSON");
}

function jsonCandidates(content: string): string[] {
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) candidates.push(trimmed.slice(objectStart, objectEnd + 1));

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));

  return [...new Set(candidates.filter(Boolean))];
}

function reconcileChunkItems(
  requestItems: ProviderRequestItem[],
  responseItems: ProviderResponseItem[],
): ProviderResponseItem[] {
  const responseById = new Map(responseItems.map((item) => [item.id, item]));

  return requestItems.map((requestItem) => {
    const response = responseById.get(requestItem.id);
    if (!response) return failedItem(requestItem, "Missing OpenAI API result");
    if (response.status === "ok" && response.text.length === 0) return failedItem(requestItem, "Empty OpenAI API result");
    return { ...response, id: requestItem.id };
  });
}

function normalizeProviderItem(item: ParsedProviderItem): ProviderResponseItem {
  const text = typeof item.text === "string" ? item.text : "";
  const status = normalizeStatus(item.status, text);
  const result: ProviderResponseItem = {
    id: String(item.id ?? ""),
    text,
    status,
  };
  if (item.detectedLang) result.detectedLang = item.detectedLang;
  if (item.error) result.error = item.error;
  return result;
}

function failedItem(item: ProviderRequestItem, error: string): ProviderResponseItem {
  return {
    id: item.id,
    text: "",
    status: "failed",
    error,
  };
}

function normalizeStatus(status: unknown, text: string): ProviderResponseItem["status"] {
  if (status === "ok" || status === "skipped" || status === "failed") return status;
  return text ? "ok" : "failed";
}

function normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(Math.max(Math.round(numberValue), min), max);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
