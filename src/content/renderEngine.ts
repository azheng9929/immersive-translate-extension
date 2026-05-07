import type { RestoreRecord, TranslationPiecePlaceholder, TranslationUnit } from "../shared/types";
import { isSafeHrefAttribute } from "../shared/urlSafety";
import { ensureRuntimeStyle } from "./style";

const ORIGINAL_TEXT_ATTRIBUTE = "data-imt-original-text";
const LOADING_SELECTOR = ":scope > .imt-translation-loading[data-imt-loading='true']";

export function renderTranslationLoading(unit: TranslationUnit): RestoreRecord[] {
  if (unit.category === "attribute" || unit.renderMode === "replace-attribute") return [];
  ensureRuntimeStyle();

  removeTranslationLoading(unit);
  unit.root.setAttribute("data-imt-unit-id", unit.id);
  unit.root.setAttribute("data-imt-state", "loading");

  const loading = document.createElement("span");
  loading.setAttribute("data-imt-managed", "true");
  loading.setAttribute("data-imt-loading", "true");
  loading.setAttribute("data-imt-unit-id", unit.id);
  loading.setAttribute("aria-label", "Translating");
  loading.setAttribute("role", "status");
  loading.className = "imt-translation-loading";
  applySourceTextStyle(loading, unit);
  unit.root.appendChild(loading);

  return [{ type: "inserted-node", unitId: unit.id, node: loading }];
}

export function removeTranslationLoading(unit: TranslationUnit): void {
  unit.root.querySelectorAll<HTMLElement>(LOADING_SELECTOR).forEach((node) => {
    if (node.getAttribute("data-imt-unit-id") === unit.id) node.remove();
  });

  if (unit.root.getAttribute("data-imt-state") === "loading") {
    unit.root.removeAttribute("data-imt-state");
    unit.root.removeAttribute("data-imt-unit-id");
  }
}

export function renderTranslation(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  ensureRuntimeStyle();
  removeTranslationLoading(unit);
  unit.root.setAttribute("data-imt-unit-id", unit.id);
  unit.root.setAttribute("data-imt-state", "translated");

  if (unit.renderMode === "replace-attribute" && unit.attribute) {
    const originalValue = unit.attribute.element.getAttribute(unit.attribute.name);
    unit.attribute.element.setAttribute(unit.attribute.name, translatedText);
    unit.attribute.element.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
    return [
      {
        type: "attribute-replace",
        unitId: unit.id,
        element: unit.attribute.element,
        attribute: unit.attribute.name,
        originalValue,
      },
    ];
  }

  if (unit.renderMode === "replace-rich-inline") {
    return renderRichInlineReplacement(unit, translatedText);
  }

  if (unit.renderMode === "replace-text") {
    return shouldUseRichTextReplacement(unit)
      ? renderRichTextReplacement(unit, translatedText)
      : renderTextReplacement(unit, translatedText);
  }

  const span = document.createElement("span");
  span.setAttribute("data-imt-managed", "true");
  span.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  span.className = [
    unit.renderMode === "compact-bilingual" ? "imt-translation-compact" : "imt-translation-block",
    ...(unit.translationClasses ?? []),
  ].filter(Boolean).join(" ");
  applySourceTextStyle(span, unit);
  appendTranslatedContent(span, unit, translatedText);
  unit.root.appendChild(span);
  return [{ type: "inserted-node", unitId: unit.id, node: span }];
}

function renderTextReplacement(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  const records: RestoreRecord[] = [];

  unit.textNodes.forEach((node, index) => {
    records.push({ type: "text-replace", unitId: unit.id, textNode: node, originalText: node.textContent ?? "" });
    node.textContent = index === 0 ? withWrapperText(unit, translatedText) : "";
  });

  unit.root.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  return records;
}

function renderRichTextReplacement(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  const records: RestoreRecord[] = [];
  const sourceTextNodes = textNodesForReplacement(unit);
  const replacement = document.createElement("span");
  replacement.setAttribute("data-imt-managed", "true");
  replacement.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  replacement.className = ["imt-translation-replacement", ...(unit.translationClasses ?? [])]
    .filter(Boolean)
    .join(" ");
  applySourceTextStyle(replacement, unit);
  appendTranslatedContent(replacement, unit, translatedText);

  unit.root.insertBefore(replacement, unit.root.firstChild);
  records.push({ type: "inserted-node", unitId: unit.id, node: replacement });

  sourceTextNodes.forEach((node) => {
    records.push({ type: "text-replace", unitId: unit.id, textNode: node, originalText: node.textContent ?? "" });
    node.textContent = "";
  });

  for (const child of Array.from(unit.root.children)) {
    if (!(child instanceof HTMLElement) || child === replacement || child.dataset.imtManaged === "true") continue;
    records.push({
      type: "style-change",
      unitId: unit.id,
      element: child,
      property: "display",
      originalValue: child.style.getPropertyValue("display"),
    });
    child.style.setProperty("display", "none");
  }

  unit.root.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  return records;
}

function renderRichInlineReplacement(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  const records: RestoreRecord[] = [];
  const sourceTextNodes = textNodesForReplacement(unit);
  const replacement = document.createElement("span");
  replacement.setAttribute("data-imt-managed", "true");
  replacement.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  replacement.className = ["imt-translation-replacement", ...(unit.translationClasses ?? [])]
    .filter(Boolean)
    .join(" ");
  applySourceTextStyle(replacement, unit);
  appendTranslatedContent(replacement, unit, translatedText);

  unit.root.insertBefore(replacement, unit.root.firstChild);
  records.push({ type: "inserted-node", unitId: unit.id, node: replacement });

  sourceTextNodes.forEach((node) => {
    records.push({ type: "text-replace", unitId: unit.id, textNode: node, originalText: node.textContent ?? "" });
    node.textContent = "";
  });

  for (const child of Array.from(unit.root.children)) {
    if (!(child instanceof HTMLElement) || child === replacement || child.dataset.imtManaged === "true") continue;
    records.push({
      type: "style-change",
      unitId: unit.id,
      element: child,
      property: "display",
      originalValue: child.style.getPropertyValue("display"),
    });
    child.style.setProperty("display", "none");
  }

  unit.root.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  return records;
}

function shouldUseRichTextReplacement(unit: TranslationUnit): boolean {
  if (unit.textNodes.length <= 1) return false;
  return Array.from(unit.root.children).some((child) =>
    child instanceof HTMLElement && child.dataset.imtManaged !== "true"
  );
}

function appendTranslatedContent(parent: HTMLElement, unit: TranslationUnit, translatedText: string): void {
  const richNodes = translatedNodesFromPieces(unit, translatedText);
  if (!richNodes) {
    parent.textContent = withWrapperText(unit, translatedText);
    return;
  }

  if (unit.wrapperPrefix) parent.append(document.createTextNode(unit.wrapperPrefix));
  for (const node of richNodes) parent.append(node);
  if (unit.wrapperSuffix) parent.append(document.createTextNode(unit.wrapperSuffix));
}

function applySourceTextStyle(target: HTMLElement, unit: TranslationUnit): void {
  const sourceElement = sourceTextElement(unit);
  if (!sourceElement) return;
  const color = window.getComputedStyle(sourceElement).color;
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return;
  target.style.setProperty("--imt-source-color", color);
}

function sourceTextElement(unit: TranslationUnit): HTMLElement | undefined {
  const textNode = unit.textNodes.find((node) => (node.textContent ?? "").trim().length > 0);
  return textNode?.parentElement ?? unit.root;
}

function translatedNodesFromPieces(unit: TranslationUnit, translatedText: string): Node[] | undefined {
  if (!unit.piecePlan || unit.piecePlan.placeholders.length === 0) return undefined;
  const placeholders = new Map(unit.piecePlan.placeholders.map((placeholder) => [placeholder.id, placeholder]));
  const nodes: Node[] = [];
  const pattern = /<x\s+id=["']([^"']+)["']\s*\/>|<x\s+id=["']([^"']+)["']\s*>([\s\S]*?)<\/x>/g;
  let lastIndex = 0;
  let matchedKnownPlaceholder = false;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(translatedText)) !== null) {
    if (match.index > lastIndex) nodes.push(document.createTextNode(translatedText.slice(lastIndex, match.index)));
    const id = match[1] ?? match[2];
    const placeholder = id ? placeholders.get(id) : undefined;
    if (!placeholder) {
      nodes.push(document.createTextNode(match[0]));
    } else {
      matchedKnownPlaceholder = true;
      nodes.push(nodeForPlaceholder(placeholder, match[3]));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < translatedText.length) nodes.push(document.createTextNode(translatedText.slice(lastIndex)));
  return matchedKnownPlaceholder ? nodes : undefined;
}

function nodeForPlaceholder(placeholder: TranslationPiecePlaceholder, translatedInnerText: string | undefined): Node {
  const tagName = safePlaceholderTagName(placeholder.tagName);
  const element = document.createElement(tagName.toLowerCase());
  for (const [name, value] of Object.entries(placeholder.attributes ?? {})) {
    if (!isSafePlaceholderAttribute(tagName, name, value)) continue;
    element.setAttribute(name, value);
  }
  element.textContent = placeholder.kind === "stay-original"
    ? placeholder.text
    : translatedInnerText && translatedInnerText.trim()
      ? translatedInnerText
      : placeholder.text;
  return element;
}

function safePlaceholderTagName(tagName: string): string {
  const upper = tagName.toUpperCase();
  if (["A", "ABBR", "B", "CITE", "CODE", "EM", "I", "KBD", "MARK", "SAMP", "SMALL", "SPAN", "STRONG", "SUB", "SUP", "U", "VAR"].includes(upper)) {
    return upper;
  }
  return "SPAN";
}

function isSafePlaceholderAttribute(tagName: string, name: string, value: string): boolean {
  if (name === "href") return tagName === "A" && isSafeHrefAttribute(value);
  return name === "title" || name === "lang" || name === "dir" || name === "class";
}

function textNodesForReplacement(unit: TranslationUnit): Text[] {
  if (!unit.piecePlan) return unit.textNodes;
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(unit.root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent?.dataset.imtManaged !== "true") nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function withWrapperText(unit: TranslationUnit, translatedText: string): string {
  return `${unit.wrapperPrefix ?? ""}${translatedText}${unit.wrapperSuffix ?? ""}`;
}
