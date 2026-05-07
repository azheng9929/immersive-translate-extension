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
    parent.textContent = withWrapperText(unit, sanitizeLeakedPiecePlaceholders(translatedText));
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
  const readableColor = readableTextColor(color, sourceElement);
  target.style.setProperty("--imt-source-color", readableColor);
  target.style.setProperty("color", "var(--imt-source-color, currentColor)", "important");
}

function sourceTextElement(unit: TranslationUnit): HTMLElement | undefined {
  const textNode = unit.textNodes.find((node) => (node.textContent ?? "").trim().length > 0);
  return textNode?.parentElement ?? unit.root;
}

function translatedNodesFromPieces(unit: TranslationUnit, translatedText: string): Node[] | undefined {
  if (!unit.piecePlan || unit.piecePlan.placeholders.length === 0) return undefined;
  const placeholders = new Map(unit.piecePlan.placeholders.map((placeholder) => [placeholder.id, placeholder]));
  const nodes: Node[] = [];
  const pattern = /<x\b(?=[^>]*\bid\s*=\s*["'\u201c\u201d\u2018\u2019]([^"'\u201c\u201d\u2018\u2019>\s]+)["'\u201c\u201d\u2018\u2019])[^>]*(?:\/>|>([\s\S]*?)<\/x>)/gi;
  let lastIndex = 0;
  let matchedKnownPlaceholder = false;
  let matchedAnyPlaceholder = false;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(translatedText)) !== null) {
    if (match.index > lastIndex) nodes.push(document.createTextNode(translatedText.slice(lastIndex, match.index)));
    matchedAnyPlaceholder = true;
    const id = match[1];
    const placeholder = id ? placeholders.get(id) : undefined;
    if (!placeholder) {
      const fallbackText = sanitizeLeakedPiecePlaceholders(match[2] ?? "");
      if (fallbackText) nodes.push(document.createTextNode(fallbackText));
    } else {
      matchedKnownPlaceholder = true;
      nodes.push(nodeForPlaceholder(placeholder, match[2]));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < translatedText.length) nodes.push(document.createTextNode(translatedText.slice(lastIndex)));
  return matchedKnownPlaceholder || matchedAnyPlaceholder ? nodes : undefined;
}

function sanitizeLeakedPiecePlaceholders(text: string): string {
  return text
    .replace(/<x\b(?=[^>]*\bid\s*=\s*["'\u201c\u201d\u2018\u2019][^"'\u201c\u201d\u2018\u2019>\s]+["'\u201c\u201d\u2018\u2019])[^>]*>([\s\S]*?)<\/x>/gi, "$1")
    .replace(/<x\b(?=[^>]*\bid\s*=\s*["'\u201c\u201d\u2018\u2019][^"'\u201c\u201d\u2018\u2019>\s]+["'\u201c\u201d\u2018\u2019])[^>]*\/>/gi, "")
    .replace(/<\/?x\b[^>]*>/gi, "");
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

type RgbColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

function readableTextColor(color: string, sourceElement: HTMLElement): string {
  const foreground = parseCssRgb(color);
  const background = nearestBackgroundColor(sourceElement) ?? { r: 255, g: 255, b: 255, a: 1 };
  if (!foreground || contrastRatio(foreground, background) >= 3) return color;

  const white = { r: 255, g: 255, b: 255, a: 1 };
  const black = { r: 0, g: 0, b: 0, a: 1 };
  return contrastRatio(white, background) >= contrastRatio(black, background)
    ? "rgb(255, 255, 255)"
    : "rgb(0, 0, 0)";
}

function nearestBackgroundColor(element: HTMLElement): RgbColor | undefined {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const color = parseCssRgb(window.getComputedStyle(current).backgroundColor);
    if (color && color.a > 0.05) return color;
  }
  return undefined;
}

function parseCssRgb(value: string): RgbColor | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "transparent") return undefined;

  const match = normalized.match(/^rgba?\((.+)\)$/);
  if (!match) return undefined;

  const parts = match[1]!
    .replace(/\s*\/\s*/g, " ")
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 3) return undefined;

  const [r, g, b] = parts.slice(0, 3).map(parseCssColorChannel);
  if (r === undefined || g === undefined || b === undefined) return undefined;

  const alpha = parts[3] === undefined ? 1 : parseCssAlpha(parts[3]!);
  return {
    r,
    g,
    b,
    a: alpha ?? 1,
  };
}

function parseCssColorChannel(value: string): number | undefined {
  const parsed = value.endsWith("%")
    ? Number(value.slice(0, -1)) * 2.55
    : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return clampColorChannel(parsed);
}

function parseCssAlpha(value: string): number | undefined {
  const parsed = value.endsWith("%")
    ? Number(value.slice(0, -1)) / 100
    : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(1, parsed));
}

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: RgbColor): number {
  const [r, g, b] = [color.r, color.g, color.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
