import type { TranslatableAttributeName } from "../shared/types";
import type { RuleContentSelector } from "../shared/webRuleTypes";

export type FilterRuleInput = {
  selectors?: readonly string[];
  excludeSelectors?: readonly string[];
  mutationExcludeSelectors?: readonly string[];
  injectedCss?: readonly string[];
  contentSelectors?: readonly RuleContentSelector[];
  attributeNames?: readonly TranslatableAttributeName[];
  extraBlockSelectors?: readonly string[];
  extraInlineSelectors?: readonly string[];
  atomicBlockSelectors?: readonly string[];
  stayOriginalSelectors?: readonly string[];
  stayOriginalTags?: readonly string[];
};

export type CompiledFilterRule = Required<Pick<
  FilterRuleInput,
  | "selectors"
  | "excludeSelectors"
  | "mutationExcludeSelectors"
  | "injectedCss"
  | "contentSelectors"
  | "attributeNames"
  | "extraBlockSelectors"
  | "extraInlineSelectors"
  | "atomicBlockSelectors"
  | "stayOriginalSelectors"
>> & {
  stayOriginalTags: readonly string[];
};

export type TranslationElementClass =
  | { kind: "excluded" | "stay-original" | "inline" | "block"; root: HTMLElement }
  | { kind: "atomic"; root: HTMLElement };

const DEFAULT_BLOCK_ROOT_SELECTOR = [
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
  "article",
  "section",
  "div",
].join(",");

const INLINE_DISPLAY_VALUES = new Set(["inline", "inline-block", "inline-flex", "inline-grid"]);

export function compileFilterRule(rule: FilterRuleInput): CompiledFilterRule {
  return {
    selectors: cleanSelectors(rule.selectors),
    excludeSelectors: cleanSelectors(rule.excludeSelectors),
    mutationExcludeSelectors: cleanSelectors(rule.mutationExcludeSelectors),
    injectedCss: cleanSelectors(rule.injectedCss),
    contentSelectors: [...(rule.contentSelectors ?? [])],
    attributeNames: [...(rule.attributeNames ?? [])],
    extraBlockSelectors: cleanSelectors(rule.extraBlockSelectors),
    extraInlineSelectors: cleanSelectors(rule.extraInlineSelectors),
    atomicBlockSelectors: cleanSelectors(rule.atomicBlockSelectors),
    stayOriginalSelectors: cleanSelectors(rule.stayOriginalSelectors),
    stayOriginalTags: [...new Set((rule.stayOriginalTags ?? []).map((tag) => tag.trim().toUpperCase()).filter(Boolean))],
  };
}

export function classifyElementForTranslation(element: Element, rule: CompiledFilterRule): TranslationElementClass {
  const root = element instanceof HTMLElement ? element : element.parentElement;
  if (!root) return { kind: "excluded", root: document.body };

  if (matchesClosestSelector(root, rule.excludeSelectors)) return { kind: "excluded", root };
  if (isStayOriginalElement(root, rule)) return { kind: "stay-original", root };

  const atomicRoot = closestMatchingElement(root, rule.atomicBlockSelectors);
  if (atomicRoot) return { kind: "atomic", root: atomicRoot };

  const extraBlockRoot = closestMatchingElement(root, rule.extraBlockSelectors);
  if (extraBlockRoot) return { kind: "block", root: extraBlockRoot };

  if (matchesClosestSelector(root, rule.extraInlineSelectors) || isInlineByStyle(root)) {
    return { kind: "inline", root };
  }

  return { kind: "block", root };
}

export function findTranslationRoot(element: HTMLElement, rule: CompiledFilterRule): HTMLElement {
  const classification = classifyElementForTranslation(element, rule);
  if (classification.kind === "atomic" || classification.kind === "block") return classification.root;

  const configuredContentRoot = findConfiguredContentRoot(element, rule);
  if (configuredContentRoot) return configuredContentRoot;

  const blockRoot = closestMatchingElement(element, [DEFAULT_BLOCK_ROOT_SELECTOR]);
  return blockRoot ?? element;
}

export function isStayOriginalElement(element: HTMLElement, rule: CompiledFilterRule): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (rule.stayOriginalTags.includes(current.tagName)) return true;
  }
  return matchesClosestSelector(element, rule.stayOriginalSelectors);
}

export function matchesClosestSelector(element: HTMLElement, selectors: readonly string[]): boolean {
  return Boolean(closestMatchingElement(element, selectors));
}

export function closestMatchingElement(element: HTMLElement, selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const match = element.closest<HTMLElement>(selector);
      if (match) return match;
    } catch {
      continue;
    }
  }
  return null;
}

function findConfiguredContentRoot(element: HTMLElement, rule: CompiledFilterRule): HTMLElement | null {
  for (const contentRule of rule.contentSelectors) {
    const root = closestMatchingElement(element, [contentRule.selector]);
    if (root) return root;
  }
  return null;
}

function isInlineByStyle(element: HTMLElement): boolean {
  const display = globalThis.getComputedStyle?.(element).display;
  return display ? INLINE_DISPLAY_VALUES.has(display) : false;
}

function cleanSelectors(selectors: readonly string[] | undefined): string[] {
  return [...new Set((selectors ?? []).map((selector) => selector.trim()).filter(Boolean))];
}
