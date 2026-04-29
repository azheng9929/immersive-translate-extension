import type { ProviderRequest, ProviderRequestItem, ProviderResponseItem, TranslationProvider } from "./providerTypes";
import { runProviderBatchesWithAdaptiveRetry } from "./providerScheduler";

type MicrosoftResult = Array<{
  detectedLanguage?: { language?: string };
  translations?: Array<{ text?: string; to?: string }>;
}>;

type MicrosoftOptions = {
  maxConcurrentRequests: number;
  maxBatchItems: number;
  maxBatchChars: number;
  requestTimeoutMs: number;
};

const MICROSOFT_MAX_CONCURRENT_REQUESTS = 2;
const MICROSOFT_MAX_BATCH_ITEMS = 50;
const MICROSOFT_MAX_BATCH_CHARS = 12000;
const MICROSOFT_REQUEST_TIMEOUT_MS = 45000;

export const microsoftProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    if (request.items.length === 0) return [];

    const options = normalizeMicrosoftOptions(request);
    const token = await fetchMicrosoftToken(options.requestTimeoutMs);
    return runProviderBatchesWithAdaptiveRetry(request.items, options, (chunk) =>
      translateChunk(request, options, token, chunk),
    );
  },
};

async function fetchMicrosoftToken(timeoutMs: number): Promise<string> {
  const tokenResponse = await fetchWithTimeout("https://edge.microsoft.com/translate/auth", {}, timeoutMs);
  if (!tokenResponse.ok) throw new Error(`Microsoft auth failed: ${tokenResponse.status}`);
  return tokenResponse.text();
}

async function translateChunk(
  request: ProviderRequest,
  options: MicrosoftOptions,
  token: string,
  items: ProviderRequestItem[],
): Promise<ProviderResponseItem[]> {
  const url = new URL("https://api-edge.cognitive.microsofttranslator.com/translate");
  url.searchParams.set("api-version", "3.0");
  url.searchParams.set("to", request.targetLang);
  if (request.sourceLang && request.sourceLang !== "auto") {
    url.searchParams.set("from", request.sourceLang);
  }

  const response = await fetchWithTimeout(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items.map((item) => ({ Text: item.text }))),
  }, options.requestTimeoutMs);

  if (!response.ok) throw new Error(`Microsoft translate failed: ${response.status}`);
  const data = (await response.json()) as MicrosoftResult;

  return items.map((item, index) => {
    const translatedText = data[index]?.translations?.[0]?.text;
    if (!translatedText) {
      return {
        id: item.id,
        text: "",
        status: "failed",
        error: "Missing Microsoft translation",
      };
    }
    const result: ProviderResponseItem = {
      id: item.id,
      text: translatedText,
      status: "ok",
    };
    const detectedLang = data[index]?.detectedLanguage?.language;
    if (detectedLang) result.detectedLang = detectedLang;
    return result;
  });
}

function normalizeMicrosoftOptions(request: ProviderRequest): MicrosoftOptions {
  return {
    maxConcurrentRequests: normalizeInteger(request.maxConcurrentRequests, MICROSOFT_MAX_CONCURRENT_REQUESTS, 1, 4),
    maxBatchItems: normalizeInteger(request.maxBatchItems, MICROSOFT_MAX_BATCH_ITEMS, 1, 100),
    maxBatchChars: normalizeInteger(request.maxBatchChars, MICROSOFT_MAX_BATCH_CHARS, 500, 50000),
    requestTimeoutMs: normalizeInteger(request.requestTimeoutMs, MICROSOFT_REQUEST_TIMEOUT_MS, 5000, 180000),
  };
}

async function fetchWithTimeout(endpoint: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (typeof AbortController === "undefined") return fetch(endpoint, init);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(endpoint, { ...init, signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) throw new Error(`Microsoft translate timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(Math.max(Math.round(numberValue), min), max);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
