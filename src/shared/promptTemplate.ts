type TranslationPromptTemplateContext = {
  sourceLang?: string | undefined;
  targetLang: string;
};

export function renderTranslationPromptTemplate(
  template: string,
  context: TranslationPromptTemplateContext,
): string {
  const replacements: Record<string, string> = {
    from: context.sourceLang?.trim() || "auto",
    to: context.targetLang,
    title_prompt: "",
    summary_prompt: "",
    terms_prompt: "",
    imt_style_guide: "",
  };

  return template.replace(/\{\{([a-z_]+)\}\}/gi, (placeholder, name: string) => {
    const value = replacements[name.toLowerCase()];
    return value === undefined ? placeholder : value;
  });
}
