import { describe, expect, it } from "vitest";
import { renderTranslation } from "@/content/renderEngine";
import { restoreAll } from "@/content/restoreEngine";
import type { TranslationUnit } from "@/shared/types";

function baseUnit(root: HTMLElement, mode: TranslationUnit["renderMode"]): TranslationUnit {
  return {
    id: "u1",
    sessionId: "s1",
    revision: 1,
    root,
    textNodes: Array.from(root.childNodes).filter((node): node is Text => node.nodeType === Node.TEXT_NODE),
    originalText: root.textContent ?? "",
    normalizedText: (root.textContent ?? "").trim().toLowerCase(),
    translatedText: "translated text",
    targetLang: "zh-Hans",
    category: "content-block",
    renderMode: mode,
    priority: 100,
    state: "pending",
  };
}

describe("renderTranslation", () => {
  it("adds managed bilingual text inside a paragraph and restores it", () => {
    document.body.innerHTML = "<p>Hello world</p>";
    const unit = baseUnit(document.querySelector("p")!, "bilingual-inside");
    const records = renderTranslation(unit, "Translated hello");

    const translated = document.querySelector<HTMLElement>("[data-imt-managed='true']");
    expect(translated?.textContent).toBe("Translated hello");
    expect(translated?.getAttribute("data-imt-original-text")).toBe("Hello world");
    expect(unit.root.getAttribute("data-imt-unit-id")).toBe("u1");

    restoreAll(records);
    expect(document.body.innerHTML).toBe("<p>Hello world</p>");
  });

  it("replaces button text, exposes original text for hover, and restores it", () => {
    document.body.innerHTML = "<button>Submit</button>";
    const unit = baseUnit(document.querySelector("button")!, "replace-text");
    const records = renderTranslation(unit, "Translated submit");

    const button = document.querySelector("button")!;
    expect(button.textContent).toBe("Translated submit");
    expect(button.getAttribute("data-imt-original-text")).toBe("Submit");
    expect(button.hasAttribute("title")).toBe(false);

    restoreAll(records);
    expect(button.textContent).toBe("Submit");
    expect(button.hasAttribute("data-imt-original-text")).toBe(false);
    expect(button.hasAttribute("title")).toBe(false);
  });

  it("preserves an existing title while exposing original text through metadata", () => {
    document.body.innerHTML = '<button title="Native hint">Submit</button>';
    const unit = baseUnit(document.querySelector("button")!, "replace-text");
    const records = renderTranslation(unit, "Translated submit");

    const button = document.querySelector("button")!;
    expect(button.textContent).toBe("Translated submit");
    expect(button.getAttribute("data-imt-original-text")).toBe("Submit");
    expect(button.title).toBe("Native hint");

    restoreAll(records);
    expect(button.textContent).toBe("Submit");
    expect(button.title).toBe("Native hint");
  });

  it("replaces attributes, exposes original text for hover, and restores them", () => {
    document.body.innerHTML = '<input placeholder="Search docs" />';
    const input = document.querySelector("input")!;
    const unit = {
      ...baseUnit(input, "replace-attribute"),
      category: "attribute" as const,
      attribute: { element: input, name: "placeholder" as const, originalValue: "Search docs" },
      originalText: "Search docs",
    };

    const records = renderTranslation(unit, "Translated search");
    expect(input.getAttribute("placeholder")).toBe("Translated search");
    expect(input.getAttribute("data-imt-original-text")).toBe("Search docs");

    restoreAll(records);
    expect(input.getAttribute("placeholder")).toBe("Search docs");
    expect(input.hasAttribute("data-imt-original-text")).toBe(false);
  });
});
