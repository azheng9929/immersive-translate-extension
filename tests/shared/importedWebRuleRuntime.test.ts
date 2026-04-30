import { describe, expect, it } from "vitest";
import { prepareImportedWebTranslationRules } from "@/shared/importedWebRuleRuntime";
import type { WebTranslationRule } from "@/shared/webRuleTypes";

describe("importedWebRuleRuntime", () => {
  it("filters non-webpage surfaces without dropping normal domains that contain similar words", () => {
    const rules: WebTranslationRule[] = [
      { id: "pdf", matches: ["https://example.com/pdf/*"] },
      { id: "isEbook", selectorMatches: ["meta[name='immersive-translate-ebook-viewer']"] },
      { id: "facebook", matches: ["*.facebook.com"], selectors: ["[data-ad-preview]"] },
      { id: "githubNotebook", matches: ["notebooks.githubusercontent.com"], selectors: [".jp-Notebook"] },
    ];

    expect(prepareImportedWebTranslationRules(rules).map((rule) => rule.id)).toEqual(["facebook", "githubNotebook"]);
  });
});
