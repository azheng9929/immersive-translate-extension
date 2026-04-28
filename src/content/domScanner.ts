import { normalizeVisibleText } from "../shared/normalize";
import { isMeaningfulText, isSkippableElement } from "../shared/skipRules";
import type { TranslatableAttribute, TranslatableAttributeName, UnitCategory } from "../shared/types";
import { resolveTextGranularity, type GranularityOptions } from "./granularityPolicy";
import {
  recordScanAccepted,
  recordScanSeen,
  recordScanSkipped,
  type TranslationDiagnostics,
} from "./translationDiagnostics";
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

export type TextScanOptions = GranularityOptions & {
  diagnostics?: TranslationDiagnostics;
};

export function scanDocumentText(root: ParentNode, options: TextScanOptions = {}): ScannedText[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = normalizeVisibleText(node.textContent ?? "");
      if (!text) return NodeFilter.FILTER_REJECT;
      recordScanSeen(options.diagnostics, "text");
      const parent = node.parentElement;
      if (!parent) return rejectText(options.diagnostics, "no-parent");
      if (isSkippableElement(parent)) return rejectText(options.diagnostics, "global-selector");
      if (!isVisibleElement(parent)) return rejectText(options.diagnostics, "hidden");
      const decision = resolveTextGranularity(parent, text, options);
      if (decision.skip) return rejectText(options.diagnostics, decision.reason);
      if (!isMeaningfulText(text, decision.category ?? getScannerCategory(parent))) {
        return rejectText(options.diagnostics, "not-meaningful");
      }
      recordScanAccepted(options.diagnostics, "text");
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
    for (const name of attributeNames) {
      const value = element.getAttribute(name);
      if (!value) continue;
      const text = normalizeVisibleText(value);
      if (!text) continue;
      recordScanSeen(options.diagnostics, "attributes");
      if (isSkippableElement(element)) {
        recordScanSkipped(options.diagnostics, "attributes", "global-selector");
        continue;
      }
      if (!isVisibleElement(element)) {
        recordScanSkipped(options.diagnostics, "attributes", "hidden");
        continue;
      }
      const decision = resolveTextGranularity(element, text, options);
      if (decision.skip) {
        recordScanSkipped(options.diagnostics, "attributes", decision.reason);
        continue;
      }
      if (!isMeaningfulText(text, "attribute")) {
        recordScanSkipped(options.diagnostics, "attributes", "not-meaningful");
        continue;
      }
      recordScanAccepted(options.diagnostics, "attributes");
      attrs.push({ element, name, originalValue: text });
    }
  }

  return attrs;
}

function rejectText(diagnostics: TranslationDiagnostics | undefined, reason = "unknown"): number {
  recordScanSkipped(diagnostics, "text", reason);
  return NodeFilter.FILTER_REJECT;
}
