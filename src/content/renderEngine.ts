import type { RestoreRecord, TranslationUnit } from "../shared/types";
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

  if (unit.renderMode === "replace-text") {
    return renderTextReplacement(unit, translatedText);
  }

  const span = document.createElement("span");
  span.setAttribute("data-imt-managed", "true");
  span.setAttribute(ORIGINAL_TEXT_ATTRIBUTE, unit.originalText);
  span.className = [
    unit.renderMode === "compact-bilingual" ? "imt-translation-compact" : "imt-translation-block",
    ...(unit.translationClasses ?? []),
  ].filter(Boolean).join(" ");
  span.textContent = withWrapperText(unit, translatedText);
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

function withWrapperText(unit: TranslationUnit, translatedText: string): string {
  return `${unit.wrapperPrefix ?? ""}${translatedText}${unit.wrapperSuffix ?? ""}`;
}
