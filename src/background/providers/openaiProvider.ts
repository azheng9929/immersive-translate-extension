import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providerTypes";

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

export const openaiProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    const endpoint = request.endpoint?.trim();
    const apiKey = request.apiKey?.trim();
    if (!endpoint || !apiKey) {
      throw new Error("OpenAI API requires endpoint and API key");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a web translation engine. Translate each item to the target language. Return exactly JSON: {\"items\":[{\"id\":\"...\",\"text\":\"...\",\"status\":\"ok\"}]}. Preserve ids, item count, and item boundaries. Do not merge, split, omit, reorder, add notes, add Markdown, or add HTML. If translation is unnecessary, return the original text with status ok.",
          },
          {
            role: "user",
            content: JSON.stringify({
              targetLang: request.targetLang,
              items: request.items.map((item) => ({
                id: item.id,
                category: item.category,
                text: item.text,
              })),
            }),
          },
        ],
      }),
    });

    const data = await readOpenAIResponse(response);
    if (!response.ok) throw new Error(openAIErrorMessage(response.status, data));

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI API response missing content");

    const parsed = parseJsonContent(content);
    if (!Array.isArray(parsed.items)) throw new Error("OpenAI API response missing items");

    return parsed.items.map(normalizeProviderItem);
  },
};

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

function normalizeStatus(status: unknown, text: string): ProviderResponseItem["status"] {
  if (status === "ok" || status === "skipped" || status === "failed") return status;
  return text ? "ok" : "failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
