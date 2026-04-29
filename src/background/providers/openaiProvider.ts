import { DEFAULT_EXTENSION_CONFIG, DEFAULT_OPENAI_SYSTEM_PROMPT } from "../../shared/config";
import { renderTranslationPromptTemplate } from "../../shared/promptTemplate";
import type { ProviderRequest, ProviderRequestItem, ProviderResponseItem, TranslationProvider } from "./providerTypes";
import {
  ProviderAdaptiveError,
  type ProviderChunkRunResult,
  type ProviderThrottleSignal,
  runProviderBatchesWithAdaptiveRetry,
} from "./providerScheduler";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string; refusal?: string } }>;
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

type OpenAIRuntimeState = {
  structuredOutputsDisabled: boolean;
};

export const openaiProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    const options = normalizeOpenAIOptions(request);
    if (request.items.length === 0) return [];

    const runtime: OpenAIRuntimeState = { structuredOutputsDisabled: false };
    return runProviderBatchesWithAdaptiveRetry(request.items, options, (chunk) =>
      translateChunk(request, options, runtime, chunk),
    );
  },
};

async function translateChunk(
  request: ProviderRequest,
  options: OpenAIOptions,
  runtime: OpenAIRuntimeState,
  items: ProviderRequestItem[],
): Promise<ProviderChunkRunResult> {
  const useStructuredOutputs = !runtime.structuredOutputsDisabled;
  const response = await fetchWithTimeout(options.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(openAIRequestBody(request, options, items, useStructuredOutputs)),
  }, options.requestTimeoutMs);

  const data = await readOpenAIResponse(response);
  const throttle = openAIRateLimitSignal(response.headers);
  if (!response.ok) {
    const message = openAIErrorMessage(response.status, data);
    if (useStructuredOutputs && isStructuredOutputUnsupported(response.status, message)) {
      runtime.structuredOutputsDisabled = true;
      return translateChunk(request, options, runtime, items);
    }
    throw new ProviderAdaptiveError(message, throttle);
  }

  const message = data.choices?.[0]?.message;
  if (message?.refusal) throw new ProviderAdaptiveError(`OpenAI API refused request: ${message.refusal}`, throttle);

  const content = message?.content;
  if (!content) throw new Error("OpenAI API response missing content");

  const parsed = parseJsonContent(content);
  if (!Array.isArray(parsed.items)) throw new Error("OpenAI API response missing items");

  const responseItems = reconcileChunkItems(items, parsed.items.map(normalizeProviderItem));
  return throttle ? { items: responseItems, throttle } : responseItems;
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

function openAIRequestBody(
  request: ProviderRequest,
  options: OpenAIOptions,
  items: ProviderRequestItem[],
  useStructuredOutputs: boolean,
) {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      {
        role: "system",
        content: renderTranslationPromptTemplate(options.systemPrompt, {
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
        }),
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
  };

  if (useStructuredOutputs) body.response_format = translationResponseFormat();
  return body;
}

function translationResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "translation_batch",
      strict: true,
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "The exact id from the input item." },
                text: { type: "string", description: "The translated text, or an empty string when failed." },
                status: { type: "string", enum: ["ok", "skipped", "failed"] },
                detectedLang: { type: ["string", "null"] },
                error: { type: ["string", "null"] },
              },
              required: ["id", "text", "status", "detectedLang", "error"],
              additionalProperties: false,
            },
          },
        },
        required: ["items"],
        additionalProperties: false,
      },
    },
  };
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

function isStructuredOutputUnsupported(status: number, message: string): boolean {
  return status === 400 && /response_format|json_schema|structured output|unsupported.*schema|unknown parameter/i.test(message);
}

function openAIRateLimitSignal(headers: Headers | undefined): ProviderThrottleSignal | undefined {
  const remainingRequests = parseHeaderNumber(getHeader(headers, "x-ratelimit-remaining-requests"));
  const requestLimit = parseHeaderNumber(getHeader(headers, "x-ratelimit-limit-requests"));
  const remainingTokens = parseHeaderNumber(getHeader(headers, "x-ratelimit-remaining-tokens"));
  const tokenLimit = parseHeaderNumber(getHeader(headers, "x-ratelimit-limit-tokens"));
  const retryAfterMs = parseRetryAfterMs(getHeader(headers, "retry-after"));

  const requestPressure = isLowRemaining(remainingRequests, requestLimit, 2, 0.12) || retryAfterMs !== undefined;
  const tokenPressure = isLowRemaining(remainingTokens, tokenLimit, 2000, 0.12);

  if (!requestPressure && !tokenPressure) return undefined;

  const reasons: string[] = [];
  if (requestPressure) reasons.push("low request headroom");
  if (tokenPressure) reasons.push("low token headroom");
  if (retryAfterMs !== undefined) reasons.push(`retry-after ${retryAfterMs}ms`);

  const signal: ProviderThrottleSignal = {
    reason: `OpenAI rate limit headers: ${reasons.join(", ")}`,
  };
  if (requestPressure) signal.reduceConcurrency = true;
  if (tokenPressure) signal.reduceBatch = true;
  if (retryAfterMs !== undefined) signal.retryAfterMs = retryAfterMs;
  return signal;
}

function getHeader(headers: Headers | undefined, name: string): string | undefined {
  return headers?.get(name) ?? undefined;
}

function parseHeaderNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRetryAfterMs(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value.trim());
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds * 1000));

  const dateMs = Date.parse(value);
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.max(0, dateMs - Date.now());
}

function isLowRemaining(
  remaining: number | undefined,
  limit: number | undefined,
  absoluteFloor: number,
  ratioFloor: number,
): boolean {
  if (remaining === undefined) return false;
  if (remaining <= 0) return true;
  if (limit !== undefined && limit > 0) return remaining / limit <= ratioFloor;
  return remaining <= absoluteFloor;
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
