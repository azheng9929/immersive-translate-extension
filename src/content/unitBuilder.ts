import type { ScannedText } from "./domScanner";
import { normalizeForCache, normalizeVisibleText } from "../shared/normalize";
import { shouldSkipForTargetLanguage } from "../shared/languageHeuristics";
import { isSkippableElement } from "../shared/skipRules";
import type { TranslatableAttribute, TranslationUnit, UnitCategory } from "../shared/types";
import {
  classifyElementForTranslation,
  findTranslationRoot,
  isStayOriginalElement,
  type CompiledFilterRule,
} from "./compiledFilterRule";
import { resolveTextGranularity, type GranularityOptions } from "./granularityPolicy";
import { decideRenderMode } from "./renderDecider";
import { buildTranslationPiecePlan } from "./pieceBuilder";
import {
  recordDuplicateUnits,
  recordUnitBuilt,
  recordUnitDropped,
  type TranslationDiagnostics,
} from "./translationDiagnostics";
import { isVisibleElement } from "./visibility";

type BuildInput = {
  scannedTexts: ScannedText[];
  attributes: TranslatableAttribute[];
  sessionId: string;
  revision: number;
  targetLang: string;
  hostname?: string;
  allowTooltip?: boolean;
  contentSelectors?: GranularityOptions["contentSelectors"];
  excludeSelectors?: GranularityOptions["excludeSelectors"];
  filterRule?: CompiledFilterRule;
  translationClasses?: readonly string[];
  wrapperPrefix?: string;
  wrapperSuffix?: string;
  lineBreakMaxTextCount?: number;
  diagnostics?: TranslationDiagnostics;
};

type TextPart = {
  text: string;
  breakBefore: boolean;
};

const CONTENT_TAGS = new Set(["P", "BLOCKQUOTE", "FIGCAPTION", "ARTICLE"]);
const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const INLINE_TAGS = new Set(["A", "SPAN", "STRONG", "EM", "B", "I", "SMALL", "SUP", "SUB"]);

export function buildTranslationUnits(input: BuildInput): TranslationUnit[] {
  const rootToTexts = new Map<HTMLElement, Text[]>();
  const rootToCategories = new Map<HTMLElement, UnitCategory[]>();

  for (const scanned of input.scannedTexts) {
    const root = scanned.root ?? findSemanticRoot(scanned.parent, input.filterRule);
    const texts = rootToTexts.get(root) ?? [];
    texts.push(scanned.node);
    rootToTexts.set(root, texts);
    if (scanned.category) {
      const categories = rootToCategories.get(root) ?? [];
      categories.push(scanned.category);
      rootToCategories.set(root, categories);
    }
  }

  const units: TranslationUnit[] = [];
  let index = 0;

  for (const [root, textNodes] of rootToTexts) {
    const collected = collectUnitText(root, textNodes, {
      ...(input.hostname ? { hostname: input.hostname } : {}),
      ...(input.allowTooltip ? { allowTooltip: true } : {}),
      ...(input.contentSelectors ? { contentSelectors: input.contentSelectors } : {}),
      ...(input.excludeSelectors ? { excludeSelectors: input.excludeSelectors } : {}),
      targetLang: input.targetLang,
      ...(input.lineBreakMaxTextCount !== undefined ? { lineBreakMaxTextCount: input.lineBreakMaxTextCount } : {}),
    }, input.filterRule);
    if (!collected.text) {
      recordUnitDropped(input.diagnostics, collected.skipReason);
      continue;
    }
    const originalText = collected.text;
    const piecePlan = buildTranslationPiecePlan(root, {
      ...(input.hostname ? { hostname: input.hostname } : {}),
      ...(input.allowTooltip ? { allowTooltip: true } : {}),
      ...(input.contentSelectors ? { contentSelectors: input.contentSelectors } : {}),
      ...(input.excludeSelectors ? { excludeSelectors: input.excludeSelectors } : {}),
      targetLang: input.targetLang,
      ...(input.lineBreakMaxTextCount !== undefined ? { lineBreakMaxTextCount: input.lineBreakMaxTextCount } : {}),
    }, input.filterRule);
    const displayText = piecePlan?.displayText || originalText;
    const modelText = piecePlan?.modelText || displayText;
    const category = categoryFromScanned(rootToCategories.get(root)) ?? classifyRoot(root);
    recordUnitBuilt(input.diagnostics, category, displayText.length, {
      code: isCodeLikeRoot(root),
      ui: isUiCategory(category),
    });
    units.push({
      id: `u-${input.revision}-${index++}`,
      sessionId: input.sessionId,
      revision: input.revision,
      root,
      textNodes,
      originalText: displayText,
      ...(modelText !== displayText ? { modelText } : {}),
      normalizedText: normalizeForCache(modelText),
      targetLang: input.targetLang,
      category,
      renderMode: decideRenderMode(category, root, displayText),
      ...(input.translationClasses ? { translationClasses: input.translationClasses } : {}),
      ...(input.wrapperPrefix !== undefined ? { wrapperPrefix: input.wrapperPrefix } : {}),
      ...(input.wrapperSuffix !== undefined ? { wrapperSuffix: input.wrapperSuffix } : {}),
      ...(piecePlan && piecePlan.kind !== "plain" ? { piecePlan } : {}),
      priority: priorityForCategory(category),
      state: "pending",
    });
  }

  for (const attribute of input.attributes) {
    recordUnitBuilt(input.diagnostics, "attribute", attribute.originalValue.length, {
      ui: true,
    });
    units.push({
      id: `u-${input.revision}-${index++}`,
      sessionId: input.sessionId,
      revision: input.revision,
      root: attribute.element,
      textNodes: [],
      attribute,
      originalText: attribute.originalValue,
      normalizedText: normalizeForCache(attribute.originalValue),
      targetLang: input.targetLang,
      category: "attribute",
      renderMode: "replace-attribute",
      ...(input.translationClasses ? { translationClasses: input.translationClasses } : {}),
      ...(input.wrapperPrefix !== undefined ? { wrapperPrefix: input.wrapperPrefix } : {}),
      ...(input.wrapperSuffix !== undefined ? { wrapperSuffix: input.wrapperSuffix } : {}),
      priority: priorityForCategory("attribute"),
      state: "pending",
    });
  }

  const dedupedUnits = dedupeNestedUnits(units);
  recordDuplicateUnits(input.diagnostics, units.length - dedupedUnits.length);
  return sortUnitsByDocumentOrder(dedupedUnits);
}

function collectUnitText(
  root: HTMLElement,
  fallbackTextNodes: Text[],
  options: GranularityOptions & { allowTooltip?: boolean; lineBreakMaxTextCount?: number },
  filterRule?: CompiledFilterRule,
): { text: string; skipReason?: string } {
  let rawText = "";
  const textParts: TextPart[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (isSkippableElement(parent, options)) return NodeFilter.FILTER_REJECT;
      if (isExcludedFromUnitText(parent, options, filterRule)) return NodeFilter.FILTER_REJECT;
      if (filterRule && isStayOriginalElement(parent, filterRule)) return NodeFilter.FILTER_REJECT;
      if (!isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    const nodeText = node.textContent ?? "";
    rawText += nodeText;
    const parent = node.parentElement;
    if (
      parent &&
      !isExcludedFromUnitText(parent, options, filterRule) &&
      !(filterRule && isStayOriginalElement(parent, filterRule)) &&
      !resolveTextGranularity(parent, normalizeVisibleText(nodeText), options).skip
    ) {
      const visibleText = normalizeVisibleText(nodeText);
      if (visibleText) {
        textParts.push({
          text: visibleText,
          breakBefore: shouldBreakBeforeTextPart(parent, root, filterRule),
        });
      }
    }
    node = walker.nextNode();
  }

  const normalizedRawText = normalizeVisibleText(rawText);
  if (shouldSkipForTargetLanguage(normalizedRawText, options.targetLang)) return { text: "", skipReason: "target-language" };
  const text = normalizeCollectedText(textParts, options.lineBreakMaxTextCount);
  if (text) {
    if (shouldSkipForTargetLanguage(text, options.targetLang)) return { text: "", skipReason: "target-language" };
    return { text };
  }
  const fallbackText = applyLineBreakMaxTextCount(
    normalizeVisibleText(fallbackTextNodes.map((node) => node.textContent ?? "").join(" ")),
    options.lineBreakMaxTextCount,
  );
  if (shouldSkipForTargetLanguage(fallbackText, options.targetLang)) return { text: "", skipReason: "target-language" };
  return fallbackText ? { text: fallbackText } : { text: "", skipReason: "empty" };
}

function isExcludedFromUnitText(
  element: HTMLElement,
  options: GranularityOptions,
  filterRule?: CompiledFilterRule,
): boolean {
  if (matchesClosestSelector(element, options.excludeSelectors)) return true;
  return filterRule ? classifyElementForTranslation(element, filterRule).kind === "excluded" : false;
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

function normalizeCollectedText(parts: readonly TextPart[], lineBreakMaxTextCount: number | undefined): string {
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

function shouldBreakBeforeTextPart(
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

function categoryFromScanned(categories: UnitCategory[] | undefined): UnitCategory | undefined {
  if (!categories || categories.length === 0) return undefined;
  return [...new Set(categories)].sort((a, b) => priorityForCategory(b) - priorityForCategory(a))[0];
}

function findSemanticRoot(element: HTMLElement, filterRule: CompiledFilterRule | undefined): HTMLElement {
  if (filterRule) return findTranslationRoot(element, filterRule);

  const direct = element.closest<HTMLElement>(
    "button,[role='button'],td,th,li,p,blockquote,figcaption,h1,h2,h3,h4,h5,h6,label,legend,summary,a",
  );

  if (!direct) return element;

  if (INLINE_TAGS.has(direct.tagName)) {
    const block = direct.closest<HTMLElement>("p,li,blockquote,figcaption,td,th,h1,h2,h3,h4,h5,h6");
    return block ?? direct;
  }

  return direct;
}

function classifyRoot(root: HTMLElement): UnitCategory {
  if (root.matches("button,[role='button']")) return "button";
  if (root.matches("[role='menuitem']") || root.closest("menu,[role='menu']")) return "menu";
  if (root.matches("[role='tab']") || root.closest("nav,[role='navigation']")) return "nav";
  if (root.matches("td,th")) return "table-cell";
  if (root.matches("label,legend")) return "label";
  if (root.tagName === "LI") return "list-item";
  if (HEADING_TAGS.has(root.tagName)) return "heading";
  if (CONTENT_TAGS.has(root.tagName)) return "content-block";
  return "fallback";
}

function priorityForCategory(category: UnitCategory): number {
  if (category === "content-block" || category === "comment") return 100;
  if (category === "heading") return 90;
  if (category === "card-text") return 85;
  if (category === "list-item") return 80;
  if (category === "table-cell") return 50;
  if (category === "attribute") return 20;
  return 40;
}

function isCodeLikeRoot(root: HTMLElement): boolean {
  return Boolean(root.closest("pre,code,kbd,samp"));
}

function isUiCategory(category: UnitCategory): boolean {
  return category === "button" ||
    category === "nav" ||
    category === "menu" ||
    category === "label" ||
    category === "inline-ui" ||
    category === "attribute";
}

function dedupeNestedUnits(units: TranslationUnit[]): TranslationUnit[] {
  const accepted: TranslationUnit[] = [];

  for (const unit of units) {
    const conflicts = accepted.filter((existing) => rootsOverlap(existing.root, unit.root));
    if (conflicts.length === 0 || unit.category === "attribute") {
      accepted.push(unit);
      continue;
    }

    if (shouldPreferUnit(unit)) {
      for (const conflict of conflicts) {
        const index = accepted.indexOf(conflict);
        if (index >= 0) accepted.splice(index, 1);
      }
      accepted.push(unit);
      continue;
    }

    if (!conflicts.some((conflict) => shouldPreferUnit(conflict))) {
      accepted.push(unit);
    }
  }

  return accepted;
}

function rootsOverlap(a: HTMLElement, b: HTMLElement): boolean {
  return a === b || a.contains(b) || b.contains(a);
}

function shouldPreferUnit(unit: TranslationUnit): boolean {
  return priorityForCategory(unit.category) >= 80;
}

function sortUnitsByDocumentOrder(units: TranslationUnit[]): TranslationUnit[] {
  return [...units].sort((a, b) => {
    if (a.root === b.root) return a.id.localeCompare(b.id);
    const position = a.root.compareDocumentPosition(b.root);
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    return a.id.localeCompare(b.id);
  });
}
