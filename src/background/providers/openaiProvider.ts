import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providerTypes";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type ParsedProviderItem = Partial<ProviderResponseItem> & {
  id?: unknown;
  text?: unknown;
};

export const openaiProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    if (!request.endpoint || !request.apiKey) {
      throw new Error("OpenAI-compatible provider requires endpoint and apiKey");
    }

    const response = await fetch(request.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a web translation engine. Translate each item to the target language. Return only JSON with an items array. Preserve ids. Do not add HTML.",
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

    if (!response.ok) throw new Error(`OpenAI-compatible translate failed: ${response.status}`);
    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI-compatible response missing content");

    const parsed = parseJsonContent(content);
    if (!Array.isArray(parsed.items)) throw new Error("OpenAI-compatible response missing items");

    return parsed.items.map(normalizeProviderItem);
  },
};

function parseJsonContent(content: string): { items?: ParsedProviderItem[] } {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed) as { items?: ParsedProviderItem[] };
}

function normalizeProviderItem(item: ParsedProviderItem): ProviderResponseItem {
  const text = typeof item.text === "string" ? item.text : "";
  const result: ProviderResponseItem = {
    id: String(item.id ?? ""),
    text,
    status: item.status ?? (text ? "ok" : "failed"),
  };
  if (item.detectedLang) result.detectedLang = item.detectedLang;
  if (item.error) result.error = item.error;
  return result;
}
