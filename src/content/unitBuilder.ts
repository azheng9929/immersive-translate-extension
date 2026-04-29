import type { ScannedText } from "./domScanner";
import { normalizeForCache, normalizeVisibleText } from "../shared/normalize";
import { shouldSkipForTargetLanguage } from "../shared/languageHeuristics";
import { isSkippableElement } from "../shared/skipRules";
import type { TranslatableAttribute, TranslationUnit, UnitCategory } from "../shared/types";
import { resolveTextGranularity, type GranularityOptions } from "./granularityPolicy";
import { decideRenderMode } from "./renderDecider";
import {
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
  diagnostics?: TranslationDiagnostics;
};

const CONTENT_TAGS = new Set(["P", "BLOCKQUOTE", "FIGCAPTION", "ARTICLE"]);
const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const INLINE_TAGS = new Set(["A", "SPAN", "STRONG", "EM", "B", "I", "SMALL", "SUP", "SUB"]);

export function buildTranslationUnits(input: BuildInput): TranslationUnit[] {
  const rootToTexts = new Map<HTMLElement, Text[]>();
  const rootToCategories = new Map<HTMLElement, UnitCategory[]>();

  for (const scanned of input.scannedTexts) {
    const root = scanned.root ?? findSemanticRoot(scanned.parent);
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
    });
    if (!collected.text) {
      recordUnitDropped(input.diagnostics, collected.skipReason);
      continue;
    }
    const originalText = collected.text;
    const category = categoryFromScanned(rootToCategories.get(root)) ?? classifyRoot(root);
    recordUnitBuilt(input.diagnostics);
    units.push({
      id: `u-${input.revision}-${index++}`,
      sessionId: input.sessionId,
      revision: input.revision,
      root,
      textNodes,
      originalText,
      normalizedText: normalizeForCache(originalText),
      targetLang: input.targetLang,
      category,
      renderMode: decideRenderMode(category, root, originalText),
      priority: priorityForCategory(category),
      state: "pending",
    });
  }

  for (const attribute of input.attributes) {
    recordUnitBuilt(input.diagnostics);
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
      priority: priorityForCategory("attribute"),
      state: "pending",
    });
  }

  return sortUnitsByDocumentOrder(dedupeNestedUnits(units));
}

function collectUnitText(
  root: HTMLElement,
  fallbackTextNodes: Text[],
  options: GranularityOptions & { allowTooltip?: boolean },
): { text: string; skipReason?: string } {
  let rawText = "";
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (isSkippableElement(parent, options)) return NodeFilter.FILTER_REJECT;
      if (!isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    const nodeText = node.textContent ?? "";
    rawText += nodeText;
    const parent = node.parentElement;
    if (parent && !resolveTextGranularity(parent, normalizeVisibleText(nodeText), options).skip) {
      text += nodeText;
    }
    node = walker.nextNode();
  }

  const normalizedRawText = normalizeVisibleText(rawText);
  if (shouldSkipForTargetLanguage(normalizedRawText, options.targetLang)) return { text: "", skipReason: "target-language" };
  if (text) return { text: normalizeVisibleText(text) };
  const fallbackText = normalizeVisibleText(fallbackTextNodes.map((node) => node.textContent ?? "").join(" "));
  return fallbackText ? { text: fallbackText } : { text: "", skipReason: "empty" };
}

function categoryFromScanned(categories: UnitCategory[] | undefined): UnitCategory | undefined {
  if (!categories || categories.length === 0) return undefined;
  return [...new Set(categories)].sort((a, b) => priorityForCategory(b) - priorityForCategory(a))[0];
}

function findSemanticRoot(element: HTMLElement): HTMLElement {
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
  return unit.category === "button" || unit.category === "nav" || unit.category === "label";
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
