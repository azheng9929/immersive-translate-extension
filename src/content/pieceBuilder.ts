import { normalizeVisibleText } from "../shared/normalize";
import { isSkippableElement } from "../shared/skipRules";
import type { TranslationPiecePlaceholder, TranslationPiecePlan } from "../shared/types";
import {
  classifyElementForTranslation,
  isStayOriginalElement,
  type CompiledFilterRule,
} from "./compiledFilterRule";
import { resolveTextGranularity, type GranularityOptions } from "./granularityPolicy";
import { isVisibleElement } from "./visibility";

type PieceBuilderOptions = GranularityOptions & {
  allowTooltip?: boolean;
  lineBreakMaxTextCount?: number;
};

type PieceTextPart = {
  text: string;
  breakBefore: boolean;
};

type PieceBuilderState = {
  modelParts: PieceTextPart[];
  displayParts: PieceTextPart[];
  placeholders: TranslationPiecePlaceholder[];
  nextPlaceholderId: number;
  complex: boolean;
};

const PRESERVED_INLINE_TAGS = new Set(["A", "ABBR", "B", "CITE", "EM", "I", "MARK", "SMALL", "STRONG", "SUB", "SUP", "U"]);
const STAY_ORIGINAL_INLINE_TAGS = new Set(["CODE", "KBD", "SAMP", "VAR"]);
const UNSAFE_RICH_INLINE_SELECTOR = [
  "button",
  "[role='button']",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "iframe",
  "canvas",
  "svg",
  "math",
].join(",");
const SAFE_INLINE_RICH_ROOT_SELECTOR = [
  "p",
  "li",
  "blockquote",
  "figcaption",
  "td",
  "th",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "legend",
  "summary",
  "a",
].join(",");

export function buildTranslationPiecePlan(
  root: HTMLElement,
  options: PieceBuilderOptions,
  filterRule?: CompiledFilterRule,
): TranslationPiecePlan | undefined {
  const state: PieceBuilderState = {
    modelParts: [],
    displayParts: [],
    placeholders: [],
    nextPlaceholderId: 1,
    complex: isComplexRichRoot(root),
  };

  for (const child of Array.from(root.childNodes)) {
    collectPieceNode(child, root, options, filterRule, state);
  }

  const modelText = normalizePieceText(state.modelParts, options.lineBreakMaxTextCount);
  const displayText = normalizePieceText(state.displayParts, options.lineBreakMaxTextCount);
  if (!modelText && !displayText) return undefined;

  const hasPlaceholders = state.placeholders.length > 0;
  const safeInlineRoot = root.matches(SAFE_INLINE_RICH_ROOT_SELECTOR);
  const kind = state.complex && (!safeInlineRoot || hasInteractiveDescendant(root))
    ? "complex"
    : hasPlaceholders
      ? "inline-rich"
      : "plain";

  return {
    kind,
    modelText: modelText || displayText,
    displayText: displayText || modelText,
    placeholders: state.placeholders,
  };
}

function collectPieceNode(
  node: Node,
  root: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
  state: PieceBuilderState,
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    collectTextNode(node as Text, root, options, filterRule, state);
    return;
  }

  if (!(node instanceof HTMLElement)) return;

  if (node !== root && isStayOriginalInlineElement(node, filterRule)) {
    if (shouldSkipStayOriginalElement(node, options, filterRule)) return;
    addStayOriginalPlaceholder(node, root, filterRule, state);
    return;
  }

  if (shouldSkipPieceElement(node, options, filterRule)) return;

  if (node !== root && isSingleMeaningfulInlineChild(node, root, options, filterRule)) {
    for (const child of Array.from(node.childNodes)) {
      collectPieceNode(child, root, options, filterRule, state);
    }
    return;
  }

  if (node !== root && isPreservedInlineElement(node, filterRule)) {
    addInlinePlaceholder(node, root, options, filterRule, state);
    return;
  }

  if (node !== root && hasInteractiveDescendant(node)) state.complex = true;
  for (const child of Array.from(node.childNodes)) {
    collectPieceNode(child, root, options, filterRule, state);
  }
}

function collectTextNode(
  textNode: Text,
  root: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
  state: PieceBuilderState,
): void {
  const parent = textNode.parentElement;
  if (!parent || shouldSkipPieceElement(parent, options, filterRule)) return;
  if (parent !== root && isStayOriginalInlineElement(parent, filterRule)) return;

  const text = normalizeVisibleText(textNode.textContent ?? "");
  if (!text || resolveTextGranularity(parent, text, options).skip) return;
  const breakBefore = shouldBreakBeforePiece(parent, root, filterRule);
  addPart(state.modelParts, text, breakBefore);
  addPart(state.displayParts, text, breakBefore);
}

function addInlinePlaceholder(
  element: HTMLElement,
  root: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
  state: PieceBuilderState,
): void {
  const text = collectElementPieceText(element, options, filterRule);
  if (!text) return;

  const id = nextPlaceholderId(state);
  const placeholder: TranslationPiecePlaceholder = {
    id,
    kind: "inline",
    tagName: element.tagName,
    text,
    ...placeholderAttributes(element),
  };
  state.placeholders.push(placeholder);
  const breakBefore = shouldBreakBeforePiece(element, root, filterRule);
  addPart(state.modelParts, `<x id="${id}">${text}</x>`, breakBefore);
  addPart(state.displayParts, text, breakBefore);
}

function addStayOriginalPlaceholder(
  element: HTMLElement,
  root: HTMLElement,
  filterRule: CompiledFilterRule | undefined,
  state: PieceBuilderState,
): void {
  const text = normalizeVisibleText(element.textContent ?? "");
  if (!text) return;

  const id = nextPlaceholderId(state);
  const placeholder: TranslationPiecePlaceholder = {
    id,
    kind: "stay-original",
    tagName: element.tagName,
    text,
    ...placeholderAttributes(element),
  };
  state.placeholders.push(placeholder);
  const breakBefore = shouldBreakBeforePiece(element, root, filterRule);
  addPart(state.modelParts, `<x id="${id}"/>`, breakBefore);
  addPart(state.displayParts, text, breakBefore);
}

function collectElementPieceText(
  element: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
): string {
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent !== element && isStayOriginalInlineElement(parent, filterRule)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (shouldSkipPieceElement(parent, options, filterRule)) return NodeFilter.FILTER_REJECT;
      const text = normalizeVisibleText(node.textContent ?? "");
      if (!text || resolveTextGranularity(parent, text, options).skip) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    const text = normalizeVisibleText(node.textContent ?? "");
    if (text) parts.push(text);
    node = walker.nextNode();
  }
  return normalizeVisibleText(parts.join(" "));
}

function shouldSkipPieceElement(
  element: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
): boolean {
  if (isSkippableElement(element, options)) return true;
  if (!isVisibleElement(element)) return true;
  if (matchesClosestSelector(element, options.excludeSelectors)) return true;
  return filterRule ? classifyElementForTranslation(element, filterRule).kind === "excluded" : false;
}

function shouldSkipStayOriginalElement(
  element: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
): boolean {
  if (!isVisibleElement(element)) return true;
  if (matchesClosestSelector(element, options.excludeSelectors)) return true;
  return filterRule ? classifyElementForTranslation(element, filterRule).kind === "excluded" : false;
}

function isPreservedInlineElement(element: HTMLElement, filterRule: CompiledFilterRule | undefined): boolean {
  if (!PRESERVED_INLINE_TAGS.has(element.tagName)) return false;
  if (filterRule && isStayOriginalElement(element, filterRule)) return false;
  if (element.matches(UNSAFE_RICH_INLINE_SELECTOR)) return false;
  if (hasBlockDescendant(element)) return false;
  return true;
}

function isSingleMeaningfulInlineChild(
  element: HTMLElement,
  root: HTMLElement,
  options: PieceBuilderOptions,
  filterRule: CompiledFilterRule | undefined,
): boolean {
  if (element.parentElement !== root || !isPreservedInlineElement(element, filterRule)) return false;
  let meaningfulChildren = 0;
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (normalizeVisibleText(child.textContent ?? "")) meaningfulChildren += 1;
      continue;
    }
    if (child instanceof HTMLElement && !shouldSkipPieceElement(child, options, filterRule)) meaningfulChildren += 1;
  }
  return meaningfulChildren === 1;
}

function isStayOriginalInlineElement(element: HTMLElement, filterRule: CompiledFilterRule | undefined): boolean {
  if (STAY_ORIGINAL_INLINE_TAGS.has(element.tagName)) return true;
  return Boolean(filterRule && isStayOriginalElement(element, filterRule) && !hasBlockDescendant(element));
}

function hasBlockDescendant(element: HTMLElement): boolean {
  return Boolean(element.querySelector("address,article,aside,div,dl,fieldset,form,menu,nav,ol,p,pre,section,table,ul"));
}

function isComplexRichRoot(root: HTMLElement): boolean {
  return hasInteractiveDescendant(root) || root.querySelectorAll("pre,table,iframe,canvas,svg,math").length > 0;
}

function hasInteractiveDescendant(element: HTMLElement): boolean {
  return Boolean(element.querySelector(UNSAFE_RICH_INLINE_SELECTOR));
}

function placeholderAttributes(element: HTMLElement): { attributes?: Readonly<Record<string, string>> } {
  const attributes: Record<string, string> = {};
  if (element instanceof HTMLAnchorElement && element.href) attributes.href = element.getAttribute("href") ?? element.href;
  for (const name of ["title", "lang", "dir", "class"]) {
    const value = element.getAttribute(name);
    if (value) attributes[name] = value;
  }
  return Object.keys(attributes).length ? { attributes } : {};
}

function nextPlaceholderId(state: PieceBuilderState): string {
  return `p${state.nextPlaceholderId++}`;
}

function addPart(parts: PieceTextPart[], text: string, breakBefore: boolean): void {
  if (!text) return;
  parts.push({ text, breakBefore });
}

function normalizePieceText(parts: readonly PieceTextPart[], lineBreakMaxTextCount: number | undefined): string {
  let text = "";
  for (const part of parts) {
    if (!text) {
      text = part.text;
      continue;
    }
    text += `${part.breakBefore ? "\n" : " "}${part.text}`;
  }

  const normalized = text
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\s+([.,!?;:%])/g, "$1")
    .trim();
  return applyLineBreakMaxTextCount(normalized, lineBreakMaxTextCount);
}

function shouldBreakBeforePiece(
  element: HTMLElement,
  root: HTMLElement,
  filterRule: CompiledFilterRule | undefined,
): boolean {
  const tags = filterRule?.preWhitespaceDetectedTags;
  if (!tags || tags.length === 0) return false;

  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (tags.includes(current.tagName)) return true;
    if (current === root) return false;
  }
  return false;
}

function applyLineBreakMaxTextCount(text: string, lineBreakMaxTextCount: number | undefined): string {
  if (!lineBreakMaxTextCount || lineBreakMaxTextCount <= 0 || text.length <= lineBreakMaxTextCount) return text;
  return text
    .split("\n")
    .flatMap((line) => splitLongLine(line, lineBreakMaxTextCount))
    .join("\n")
    .trim();
}

function splitLongLine(line: string, maxTextCount: number): string[] {
  if (line.length <= maxTextCount) return [line];
  const sentenceParts = line.match(/[^.!?。！？]+[.!?。！？]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [line];
  const lines: string[] = [];
  let current = "";

  for (const sentence of sentenceParts) {
    if (!current) {
      current = sentence;
      continue;
    }

    if (`${current} ${sentence}`.length > maxTextCount) {
      lines.push(current);
      current = sentence;
    } else {
      current = `${current} ${sentence}`;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [line];
}

function matchesClosestSelector(element: HTMLElement, selectors: readonly string[] | undefined): boolean {
  if (!selectors?.length) return false;
  for (const selector of selectors) {
    try {
      if (element.closest(selector)) return true;
    } catch {
      continue;
    }
  }
  return false;
}
