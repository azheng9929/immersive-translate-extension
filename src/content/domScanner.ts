import { normalizeVisibleText } from "@/shared/normalize";
import { isMeaningfulText, isSkippableElement } from "@/shared/skipRules";
import type { TranslatableAttribute, TranslatableAttributeName } from "@/shared/types";
import { isVisibleElement } from "./visibility";

export type ScannedText = {
  node: Text;
  parent: HTMLElement;
  text: string;
};

const ATTRIBUTE_NAMES: TranslatableAttributeName[] = ["placeholder", "title", "alt", "aria-label"];

export function scanDocumentText(root: ParentNode): ScannedText[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (isSkippableElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
      const text = normalizeVisibleText(node.textContent ?? "");
      if (!isMeaningfulText(text, "fallback")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const results: ScannedText[] = [];
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent) {
      results.push({
        node: textNode,
        parent,
        text: normalizeVisibleText(textNode.textContent ?? ""),
      });
    }
    node = walker.nextNode();
  }
  return results;
}

export function scanTranslatableAttributes(root: ParentNode): TranslatableAttribute[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("*"));
  const attrs: TranslatableAttribute[] = [];

  for (const element of elements) {
    if (isSkippableElement(element) || !isVisibleElement(element)) continue;
    for (const name of ATTRIBUTE_NAMES) {
      const value = element.getAttribute(name);
      if (!value) continue;
      const text = normalizeVisibleText(value);
      if (!isMeaningfulText(text, "attribute")) continue;
      attrs.push({ element, name, originalValue: text });
    }
  }

  return attrs;
}
