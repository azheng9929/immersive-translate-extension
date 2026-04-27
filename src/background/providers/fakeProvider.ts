import type { ProviderRequest, ProviderResponseItem, TranslationProvider } from "./providerTypes";

export const fakeProvider: TranslationProvider = {
  async translate(request: ProviderRequest): Promise<ProviderResponseItem[]> {
    return request.items.map((item) => ({
      id: item.id,
      text: `[${request.targetLang}] ${item.text}`,
      status: "ok",
    }));
  },
};
