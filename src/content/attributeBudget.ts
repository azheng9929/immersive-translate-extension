import type { TranslatableAttribute, TranslatableAttributeName } from "../shared/types";
import type { AttributeBudgetPolicy } from "../shared/webRuleTypes";
import type { ScannedText } from "./domScanner";
import {
  recordDetectionTrace,
  recordScanSkipped,
  type TranslationDiagnostics,
} from "./translationDiagnostics";
import { isVisibleElement } from "./visibility";

export const DEFAULT_ATTRIBUTE_BUDGET = {
  enabled: true,
  maxPerPage: 40,
  maxPerRoot: 1,
  maxRatioToTextUnits: 0.25,
  allowedNames: ["alt"],
  requireContentRoot: true,
  requireVisible: true,
} satisfies Required<AttributeBudgetPolicy>;

export const DENSE_UI_ATTRIBUTE_BUDGET = {
  enabled: true,
  maxPerPage: 50,
  maxPerRoot: 1,
  maxRatioToTextUnits: 0.2,
  allowedNames: ["title", "aria-label", "alt"],
  requireContentRoot: true,
  requireVisible: true,
} satisfies Required<AttributeBudgetPolicy>;

export const LIST_PAGE_ATTRIBUTE_BUDGET = {
  enabled: true,
  maxPerPage: 24,
  maxPerRoot: 1,
  maxRatioToTextUnits: 0.15,
  allowedNames: ["alt", "title"],
  requireContentRoot: true,
  requireVisible: true,
} satisfies Required<AttributeBudgetPolicy>;

type ApplyAttributeBudgetOptions = {
  budget?: AttributeBudgetPolicy | undefined;
  diagnostics?: TranslationDiagnostics | undefined;
};

export function normalizeAttributeBudget(
  budget: AttributeBudgetPolicy | undefined,
  fallback: AttributeBudgetPolicy = DEFAULT_ATTRIBUTE_BUDGET,
): AttributeBudgetPolicy {
  const allowedNames = budget?.allowedNames ?? fallback.allowedNames;
  const normalized: AttributeBudgetPolicy = {
    ...fallback,
    ...(budget ?? {}),
  };
  if (allowedNames !== undefined) normalized.allowedNames = allowedNames;
  return normalized;
}

export function applyAttributeBudget(
  attributes: readonly TranslatableAttribute[],
  scannedTexts: readonly ScannedText[],
  options: ApplyAttributeBudgetOptions = {},
): TranslatableAttribute[] {
  const budget = normalizeAttributeBudget(options.budget);
  if (budget.enabled === false) return [...attributes];

  const allowedNames = new Set(budget.allowedNames ?? []);
  const contentRoots = new Set(scannedTexts.map((text) => attributeBudgetRoot(text.root ?? text.parent)));
  const textUnitCount = contentRoots.size;
  const maxByRatio = budget.maxRatioToTextUnits === undefined
    ? Number.POSITIVE_INFINITY
    : Math.ceil(textUnitCount * Math.max(0, budget.maxRatioToTextUnits));
  const maxPerPage = budget.maxPerPage === undefined ? Number.POSITIVE_INFINITY : Math.max(0, budget.maxPerPage);
  const pageLimit = Math.min(maxPerPage, maxByRatio);
  const rootLimit = budget.maxPerRoot === undefined ? Number.POSITIVE_INFINITY : Math.max(0, budget.maxPerRoot);
  const accepted: TranslatableAttribute[] = [];
  const acceptedByRoot = new Map<HTMLElement, number>();

  for (const attribute of attributes) {
    const root = attributeBudgetRoot(attribute.element);
    const hasContentRoot = contentRoots.has(root);
    const skipReason = attributeBudgetSkipReason(attribute, {
      budget,
      allowedNames,
      hasContentRoot,
      pageAccepted: accepted.length,
      pageLimit,
      rootAccepted: acceptedByRoot.get(root) ?? 0,
      rootLimit,
    });
    if (skipReason) {
      recordBudgetSkip(options.diagnostics, attribute, skipReason);
      continue;
    }

    accepted.push(attribute);
    acceptedByRoot.set(root, (acceptedByRoot.get(root) ?? 0) + 1);
  }

  return accepted;
}

function attributeBudgetSkipReason(
  attribute: TranslatableAttribute,
  input: {
    budget: AttributeBudgetPolicy;
    allowedNames: Set<TranslatableAttributeName>;
    hasContentRoot: boolean;
    pageAccepted: number;
    pageLimit: number;
    rootAccepted: number;
    rootLimit: number;
  },
): string | undefined {
  if (input.allowedNames.size > 0 && !input.allowedNames.has(attribute.name)) return "name";
  if (input.budget.requireVisible !== false && !isVisibleElement(attribute.element)) return "visible";
  if (input.budget.requireContentRoot !== false && !input.hasContentRoot) return "content-root";
  if (input.pageAccepted >= input.pageLimit) return "page";
  if (input.rootAccepted >= input.rootLimit) return "root";
  return undefined;
}

function recordBudgetSkip(
  diagnostics: TranslationDiagnostics | undefined,
  attribute: TranslatableAttribute,
  reason: string,
): void {
  recordScanSkipped(diagnostics, "attributes", "attribute-budget");
  recordDetectionTrace(diagnostics, {
    stage: "scan",
    decision: "rejected",
    reasons: ["attribute-budget", reason],
    elementPath: elementPath(attribute.element),
    textPreview: attribute.originalValue.slice(0, 120),
  });
}

function attributeBudgetRoot(element: HTMLElement): HTMLElement {
  return element.closest<HTMLElement>(
    [
      "article",
      "section",
      "li",
      "[role='listitem']",
      "[data-testid]",
      "[class*='card' i]",
      "[class*='item' i]",
      "[class*='product' i]",
      "[class*='result' i]",
      "[class*='tooltip' i]",
      "[role='tooltip']",
    ].join(","),
  ) ?? element.parentElement ?? element;
}

function elementPath(element: HTMLElement): string {
  const parts: string[] = [];
  for (let current: HTMLElement | null = element; current && parts.length < 5; current = current.parentElement) {
    const id = current.id ? `#${current.id}` : "";
    const classes = Array.from(current.classList).slice(0, 2).map((className) => `.${className}`).join("");
    parts.unshift(`${current.tagName.toLowerCase()}${id}${classes}`);
  }
  return parts.join(" > ");
}
