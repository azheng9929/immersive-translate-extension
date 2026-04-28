import { DEFAULT_EXTENSION_CONFIG, DEFAULT_GEMINI_SYSTEM_PROMPT } from "../../shared/config";
import type { ProviderRequest, ProviderRequestItem, ProviderResponseItem, TranslationProvider } from "./providerTypes";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};

type ParsedProviderItem = Partial<ProviderResponseItem> & {
  id?: unknown;
  text?: unknown;
};

type GeminiOptions = {
  endpoint: string;
  apiKey: string;
  model: string;
  maxConcurrentRequests: number;
  maxBatchItems: number;
  maxBatchChars: number;
  requestTimeoutMs: number;
  systemPrompt: string;
};

export const geminiProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    const options = normalizeGeminiOptions(request);
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
  options: GeminiOptions,
  items: ProviderRequestItem[],
): Promise<ProviderResponseItem[]> {
  const response = await fetchWithTimeout(geminiGenerateContentEndpoint(options.endpoint, options.model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: options.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
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
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: translationResponseSchema(),
        thinkingConfig: {
          thinkingLevel: "low",
        },
      },
    }),
  }, options.requestTimeoutMs);

  const data = await readGeminiResponse(response);
  if (!response.ok) throw new Error(geminiErrorMessage(response.status, data));

  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) throw new Error("Gemini API response missing content");

  const parsed = parseJsonContent(content);
  if (!Array.isArray(parsed.items)) throw new Error("Gemini API response missing items");

  return reconcileChunkItems(items, parsed.items.map(normalizeProviderItem));
}

function normalizeGeminiOptions(request: ProviderRequest): GeminiOptions {
  const endpoint = request.endpoint?.trim();
  const apiKey = request.apiKey?.trim();
  if (!endpoint || !apiKey) {
    throw new Error("Gemini API requires endpoint and API key");
  }

  return {
    endpoint,
    apiKey,
    model: request.model?.trim() || DEFAULT_EXTENSION_CONFIG.geminiModel,
    maxConcurrentRequests: normalizeInteger(request.maxConcurrentRequests, DEFAULT_EXTENSION_CONFIG.geminiMaxConcurrentRequests, 1, 8),
    maxBatchItems: normalizeInteger(request.maxBatchItems, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchItems, 1, 80),
    maxBatchChars: normalizeInteger(request.maxBatchChars, DEFAULT_EXTENSION_CONFIG.geminiMaxBatchChars, 500, 30000),
    requestTimeoutMs: normalizeInteger(request.requestTimeoutMs, DEFAULT_EXTENSION_CONFIG.geminiRequestTimeoutMs, 5000, 180000),
    systemPrompt: request.systemPrompt?.trim() || DEFAULT_GEMINI_SYSTEM_PROMPT,
  };
}

function geminiGenerateContentEndpoint(endpoint: string, model: string): string {
  const trimmedEndpoint = endpoint.replace(/\/+$/, "");
  if (trimmedEndpoint.endsWith(":generateContent")) return trimmedEndpoint;

  const modelId = model.replace(/^models\//, "");
  return `${trimmedEndpoint}/models/${encodeURIComponent(modelId)}:generateContent`;
}

function translationResponseSchema() {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            text: { type: "string" },
            status: { type: "string" },
            detectedLang: { type: "string" },
            error: { type: "string" },
          },
          required: ["id", "text", "status"],
        },
      },
    },
    required: ["items"],
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
    if (isAbortError(error)) throw new Error(`Gemini API timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readGeminiResponse(response: Response): Promise<GeminiResponse> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as GeminiResponse;
  } catch {
    if (!response.ok) return { error: { message: text.slice(0, 300) } };
    throw new Error("Gemini API returned invalid JSON");
  }
}

function geminiErrorMessage(status: number, data: GeminiResponse): string {
  const message = data.error?.message?.trim();
  if (message) return `Gemini API failed: ${status} ${message}`;
  return `Gemini API failed: ${status}`;
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
  throw lastError instanceof Error ? lastError : new Error("Gemini API response content is not JSON");
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
    if (!response) return failedItem(requestItem, "Missing Gemini API result");
    if (response.status === "ok" && response.text.length === 0) return failedItem(requestItem, "Empty Gemini API result");
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
