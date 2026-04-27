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
    translatedText: "译文",
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
    const records = renderTranslation(unit, "你好，世界");

    expect(document.querySelector("[data-imt-managed='true']")?.textContent).toBe("你好，世界");
    expect(unit.root.getAttribute("data-imt-unit-id")).toBe("u1");

    restoreAll(records);
    expect(document.body.innerHTML).toBe("<p>Hello world</p>");
  });

  it("replaces button text and restores it", () => {
    document.body.innerHTML = "<button>Submit</button>";
    const unit = baseUnit(document.querySelector("button")!, "replace-text");
    const records = renderTranslation(unit, "提交");

    expect(document.querySelector("button")!.textContent).toBe("提交");
    expect(document.querySelector("button")!.title).toBe("Submit");

    restoreAll(records);
    expect(document.querySelector("button")!.textContent).toBe("Submit");
    expect(document.querySelector("button")!.hasAttribute("title")).toBe(false);
  });

  it("replaces attributes and restores them", () => {
    document.body.innerHTML = '<input placeholder="Search docs" />';
    const input = document.querySelector("input")!;
    const unit = {
      ...baseUnit(input, "replace-attribute"),
      category: "attribute" as const,
      attribute: { element: input, name: "placeholder" as const, originalValue: "Search docs" },
      originalText: "Search docs",
    };

    const records = renderTranslation(unit, "搜索文档");
    expect(input.getAttribute("placeholder")).toBe("搜索文档");

    restoreAll(records);
    expect(input.getAttribute("placeholder")).toBe("Search docs");
  });
});
