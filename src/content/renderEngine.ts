import type { RestoreRecord, TranslationUnit } from "@/shared/types";
import { ensureRuntimeStyle } from "./style";

export function renderTranslation(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  ensureRuntimeStyle();
  unit.root.setAttribute("data-imt-unit-id", unit.id);
  unit.root.setAttribute("data-imt-state", "translated");

  if (unit.renderMode === "replace-attribute" && unit.attribute) {
    const originalValue = unit.attribute.element.getAttribute(unit.attribute.name);
    unit.attribute.element.setAttribute(unit.attribute.name, translatedText);
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
  span.className = unit.renderMode === "compact-bilingual" ? "imt-translation-compact" : "imt-translation-block";
  span.textContent = translatedText;
  unit.root.appendChild(span);
  return [{ type: "inserted-node", unitId: unit.id, node: span }];
}

function renderTextReplacement(unit: TranslationUnit, translatedText: string): RestoreRecord[] {
  const records: RestoreRecord[] = [];

  unit.textNodes.forEach((node, index) => {
    records.push({ type: "text-replace", unitId: unit.id, textNode: node, originalText: node.textContent ?? "" });
    node.textContent = index === 0 ? translatedText : "";
  });

  const originalTitle = unit.root.getAttribute("title");
  records.push({
    type: "attribute-replace",
    unitId: unit.id,
    element: unit.root,
    attribute: "title",
    originalValue: originalTitle,
  });
  unit.root.setAttribute("title", unit.originalText);

  return records;
}
