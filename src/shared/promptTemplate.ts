type TranslationPromptTemplateContext = {
  sourceLang?: string | undefined;
  targetLang: string;
  pageTitle?: string | undefined;
};

export function renderTranslationPromptTemplate(
  template: string,
  context: TranslationPromptTemplateContext,
): string {
  const pageTitle = normalizePromptContext(context.pageTitle);
  const replacements: Record<string, string> = {
    from: context.sourceLang?.trim() || "auto",
    to: context.targetLang,
    imt_title: pageTitle,
    title_prompt: buildTitlePrompt(pageTitle),
    summary_prompt: "",
    terms_prompt: "",
    imt_style_guide: "",
  };

  return template.replace(/\{\{([a-z_]+)\}\}/gi, (placeholder, name: string) => {
    const value = replacements[name.toLowerCase()];
    return value === undefined ? placeholder : value;
  });
}

function buildTitlePrompt(pageTitle: string): string {
  if (!pageTitle) return "";
  return [
    "",
    "",
    "## Context Awareness",
    "Document Metadata:",
    `Title: 《${pageTitle}》`,
    "Use the title only to infer domain, terminology, and tone. Do not translate it unless it appears in the input items.",
  ].join("\n");
}

function normalizePromptContext(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 200);
}
