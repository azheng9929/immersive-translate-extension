import { describe, expect, it } from "vitest";
import { scanDocumentText } from "@/content/domScanner";
import { renderTranslation } from "@/content/renderEngine";
import { restoreAll } from "@/content/restoreEngine";
import { buildTranslationUnits } from "@/content/unitBuilder";
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

  it("uses the original text element color for inserted translations", () => {
    document.body.innerHTML = `
      <ul>
        <li style="color: rgb(0, 0, 0); background: rgb(0, 0, 0)">
          <span id="source" style="color: rgb(255, 255, 255)">x402 Payment Protocol</span>
        </li>
      </ul>
    `;
    const root = document.querySelector("li")!;
    const sourceText = document.querySelector("#source")!.firstChild as Text;
    const unit = {
      ...baseUnit(root, "bilingual-inside"),
      textNodes: [sourceText],
      originalText: "x402 Payment Protocol",
      normalizedText: "x402 payment protocol",
    };

    renderTranslation(unit, "x402 支付协议");

    const translated = document.querySelector<HTMLElement>(".imt-translation-block")!;
    expect(translated.style.getPropertyValue("--imt-source-color")).toBe("rgb(255, 255, 255)");
  });

  it("uses a readable fallback color when the source color has poor contrast", () => {
    document.body.innerHTML = `
      <section style="background: rgb(8, 12, 20)">
        <p style="color: rgb(0, 0, 0)">x402 Payment Protocol</p>
      </section>
    `;
    const root = document.querySelector("p")!;
    const unit = baseUnit(root, "bilingual-inside");

    renderTranslation(unit, "x402 支付协议");

    const translated = document.querySelector<HTMLElement>(".imt-translation-block")!;
    expect(translated.style.getPropertyValue("--imt-source-color")).toBe("rgb(255, 255, 255)");
    expect(translated.style.getPropertyPriority("color")).toBe("important");
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

  it("uses a managed replacement wrapper for complex inline-only rendering and restores rich markup", () => {
    document.body.innerHTML = '<p>Hello <a href="/docs">docs</a> and <strong>bold</strong> <code>const x = 1</code>.</p>';
    const root = document.querySelector("p")!;
    const unit = {
      ...baseUnit(root, "replace-text"),
      textNodes: Array.from(root.querySelectorAll("*"))
        .flatMap((element) => Array.from(element.childNodes))
        .concat(Array.from(root.childNodes))
        .filter((node): node is Text => node.nodeType === Node.TEXT_NODE),
    };

    const records = renderTranslation(unit, "Translated rich text.");

    const replacement = document.querySelector<HTMLElement>(".imt-translation-replacement");
    expect(replacement?.textContent).toBe("Translated rich text.");
    expect(document.querySelector("a")?.style.display).toBe("none");
    expect(document.querySelector("strong")?.style.display).toBe("none");
    expect(document.querySelector("code")?.style.display).toBe("none");
    expect(root.textContent).toBe("Translated rich text.");

    restoreAll(records);
    expect(document.body.innerHTML).toBe('<p>Hello <a href="/docs">docs</a> and <strong>bold</strong> <code>const x = 1</code>.</p>');
  });

  it("renders inline-rich placeholders back into links, emphasis, and original code", () => {
    document.body.innerHTML = '<p>Read the <a href="/docs">documentation</a> for <strong>production rollout</strong> with <code>useEffect</code>.</p>';
    const unit = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    })[0]!;
    unit.renderMode = "replace-rich-inline";

    const records = renderTranslation(
      unit,
      'Read <x id="p1">docs</x> and finish <x id="p2">rollout</x> while keeping <x id="p3"/>.',
    );

    const replacement = document.querySelector<HTMLElement>(".imt-translation-replacement")!;
    expect(replacement.querySelector("a")?.getAttribute("href")).toBe("/docs");
    expect(replacement.querySelector("a")?.textContent).toBe("docs");
    expect(replacement.querySelector("strong")?.textContent).toBe("rollout");
    expect(replacement.querySelector("code")?.textContent).toBe("useEffect");
    expect(replacement.textContent).toBe("Read docs and finish rollout while keeping useEffect.");

    restoreAll(records);
    expect(document.body.innerHTML).toBe('<p>Read the <a href="/docs">documentation</a> for <strong>production rollout</strong> with <code>useEffect</code>.</p>');
  });

  it("parses provider placeholders that come back with smart quotes", () => {
    document.body.innerHTML = '<p>Use the <a href="/docs">Responses API</a> with <code>client.responses.create</code>.</p>';
    const unit = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    })[0]!;
    unit.renderMode = "replace-rich-inline";

    renderTranslation(unit, "使用 <x id=“p1”>Responses API</x> 并保留 <x id=“p2”/>。");

    const replacement = document.querySelector<HTMLElement>(".imt-translation-replacement")!;
    expect(replacement.textContent).toBe("使用 Responses API 并保留 client.responses.create。");
    expect(replacement.innerHTML).not.toContain("<x");
    expect(replacement.querySelector("a")?.getAttribute("href")).toBe("/docs");
    expect(replacement.querySelector("code")?.textContent).toBe("client.responses.create");
  });

  it("strips leaked placeholder markup instead of showing it when a provider mangles an id", () => {
    document.body.innerHTML = '<p>Read the <a href="/docs">documentation</a>.</p>';
    const unit = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    })[0]!;

    renderTranslation(unit, "阅读 <x id=“unknown”>文档</x> 并继续。");

    const translated = document.querySelector<HTMLElement>(".imt-translation-block")!;
    expect(translated.textContent).toBe("阅读 文档 并继续。");
    expect(translated.textContent).not.toContain("<x");
  });

  it("does not recreate unsafe inline-rich link schemes in managed translations", () => {
    document.body.innerHTML = '<p>Open <a href="java&#10;script:alert(1)">dangerous docs</a>.</p>';
    const unit = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    })[0]!;
    unit.renderMode = "replace-rich-inline";

    renderTranslation(unit, 'Translated <x id="p1">safe docs</x>.');

    const replacement = document.querySelector<HTMLElement>(".imt-translation-replacement")!;
    const link = replacement.querySelector("a")!;
    expect(link.textContent).toBe("safe docs");
    expect(link.hasAttribute("href")).toBe(false);
  });

  it("drops unsafe placeholder href values even if a provider echoes them into the render plan", () => {
    document.body.innerHTML = "<p>Open docs.</p>";
    const root = document.querySelector("p")!;
    const unit = {
      ...baseUnit(root, "replace-rich-inline"),
      piecePlan: {
        kind: "inline-rich",
        modelText: 'Open <x id="p1">docs</x>.',
        displayText: "Open docs.",
        placeholders: [
          {
            id: "p1",
            kind: "inline",
            tagName: "A",
            text: "docs",
            attributes: { href: "data:text/html,<script>alert(1)</script>" },
          },
        ],
      },
    } satisfies TranslationUnit;

    renderTranslation(unit, 'Open <x id="p1">safe docs</x>.');

    const link = document.querySelector(".imt-translation-replacement a")!;
    expect(link.textContent).toBe("safe docs");
    expect(link.hasAttribute("href")).toBe(false);
  });

  it("parses placeholders in compact bilingual fallback for complex roots", () => {
    document.body.innerHTML = "<div>Read docs with code.</div>";
    const root = document.querySelector("div")!;
    const unit = {
      ...baseUnit(root, "compact-bilingual"),
      piecePlan: {
        kind: "complex",
        modelText: 'Read <x id="p1">docs</x> with <x id="p2"/>.',
        displayText: "Read docs with code.",
        placeholders: [
          { id: "p1", kind: "inline", tagName: "A", text: "docs", attributes: { href: "/docs" } },
          { id: "p2", kind: "stay-original", tagName: "CODE", text: "code" },
        ],
      },
    } satisfies TranslationUnit;

    renderTranslation(unit, 'Read <x id="p1">docs</x> and keep <x id="p2"/>.');

    const compact = document.querySelector<HTMLElement>(".imt-translation-compact")!;
    expect(compact.querySelector("a")?.getAttribute("href")).toBe("/docs");
    expect(compact.querySelector("a")?.textContent).toBe("docs");
    expect(compact.querySelector("code")?.textContent).toBe("code");
    expect(compact.textContent).toBe("Read docs and keep code.");
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

  it("applies rule translation classes and wrapper text to inserted translations", () => {
    document.body.innerHTML = "<p>Hello world</p>";
    const unit = {
      ...baseUnit(document.querySelector("p")!, "bilingual-inside"),
      translationClasses: ["imt-user-style", "site-translation"],
      wrapperPrefix: "[",
      wrapperSuffix: "]",
    };
    renderTranslation(unit, "Translated hello");

    const translated = document.querySelector<HTMLElement>("[data-imt-managed='true']");
    expect(translated?.classList.contains("imt-translation-block")).toBe(true);
    expect(translated?.classList.contains("imt-user-style")).toBe(true);
    expect(translated?.classList.contains("site-translation")).toBe(true);
    expect(translated?.textContent).toBe("[Translated hello]");
  });
});
