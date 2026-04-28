import { normalizeVisibleText } from "../shared/normalize";
import { isMeaningfulText, isSkippableElement } from "../shared/skipRules";
import type { TranslatableAttribute, TranslatableAttributeName, UnitCategory } from "../shared/types";
import { resolveTextGranularity, type GranularityOptions } from "./granularityPolicy";
import { isVisibleElement } from "./visibility";

export type ScannedText = {
  node: Text;
  parent: HTMLElement;
  text: string;
  root?: HTMLElement;
  category?: UnitCategory;
};

export const SAFE_TRANSLATABLE_ATTRIBUTES: readonly TranslatableAttributeName[] = ["placeholder", "alt"];
export const ALL_TRANSLATABLE_ATTRIBUTES: readonly TranslatableAttributeName[] = [
  "placeholder",
  "alt",
  "title",
  "aria-label",
];

function getScannerCategory(element: HTMLElement): UnitCategory {
  if (element.closest("button")) return "button";
  if (element.closest("nav")) return "nav";
  if (element.closest("menu")) return "menu";
  if (element.closest("label")) return "label";
  if (element.closest("td, th")) return "table-cell";
  return "fallback";
}

export type TextScanOptions = GranularityOptions;

export function scanDocumentText(root: ParentNode, options: TextScanOptions = {}): ScannedText[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (isSkippableElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
      const text = normalizeVisibleText(node.textContent ?? "");
      const decision = resolveTextGranularity(parent, text, options);
      if (decision.skip) return NodeFilter.FILTER_REJECT;
      if (!isMeaningfulText(text, decision.category ?? getScannerCategory(parent))) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const results: ScannedText[] = [];
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent) {
      const text = normalizeVisibleText(textNode.textContent ?? "");
      const decision = resolveTextGranularity(parent, text, options);
      const scanned: ScannedText = {
        node: textNode,
        parent,
        text,
      };
      if (decision.root) scanned.root = decision.root;
      if (decision.category) scanned.category = decision.category;
      results.push(scanned);
    }
    node = walker.nextNode();
  }
  return results;
}

export function scanTranslatableAttributes(
  root: ParentNode,
  attributeNames: readonly TranslatableAttributeName[] = SAFE_TRANSLATABLE_ATTRIBUTES,
  options: TextScanOptions = {},
): TranslatableAttribute[] {
  const elements = root instanceof HTMLElement
    ? [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]
    : Array.from(root.querySelectorAll<HTMLElement>("*"));
  const attrs: TranslatableAttribute[] = [];

  for (const element of elements) {
    if (isSkippableElement(element) || !isVisibleElement(element)) continue;
    for (const name of attributeNames) {
      const value = element.getAttribute(name);
      if (!value) continue;
      const text = normalizeVisibleText(value);
      if (resolveTextGranularity(element, text, options).skip) continue;
      if (!isMeaningfulText(text, "attribute")) continue;
      attrs.push({ element, name, originalValue: text });
    }
  }

  return attrs;
}
