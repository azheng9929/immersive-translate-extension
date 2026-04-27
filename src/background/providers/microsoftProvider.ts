import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providerTypes";

type MicrosoftResult = Array<{
  detectedLanguage?: { language?: string };
  translations?: Array<{ text?: string; to?: string }>;
}>;

export const microsoftProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    const tokenResponse = await fetch("https://edge.microsoft.com/translate/auth");
    if (!tokenResponse.ok) throw new Error(`Microsoft auth failed: ${tokenResponse.status}`);
    const token = await tokenResponse.text();

    const url = new URL("https://api-edge.cognitive.microsofttranslator.com/translate");
    url.searchParams.set("api-version", "3.0");
    url.searchParams.set("to", request.targetLang);
    if (request.sourceLang && request.sourceLang !== "auto") {
      url.searchParams.set("from", request.sourceLang);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.items.map((item) => ({ Text: item.text }))),
    });

    if (!response.ok) throw new Error(`Microsoft translate failed: ${response.status}`);
    const data = (await response.json()) as MicrosoftResult;

    return request.items.map((item, index) => {
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
  },
};
