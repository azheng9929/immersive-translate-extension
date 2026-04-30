import type { RestoreRecord } from "../shared/types";

const ORIGINAL_TEXT_ATTRIBUTE = "data-imt-original-text";

export function restoreAll(records: RestoreRecord[]): void {
  restoreRecords(records);

  document.querySelectorAll("[data-imt-unit-id]").forEach((node) => {
    node.removeAttribute("data-imt-unit-id");
    node.removeAttribute("data-imt-state");
  });

  document.querySelectorAll(`[${ORIGINAL_TEXT_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute(ORIGINAL_TEXT_ATTRIBUTE);
  });
}

export function restoreRecords(records: RestoreRecord[]): void {
  const affectedNodes = new Set<Element>();

  for (const record of [...records].reverse()) {
    if (record.type === "inserted-node") {
      affectedNodes.add(record.node.parentElement ?? record.node);
      record.node.remove();
    } else if (record.type === "text-replace") {
      const parent = record.textNode.parentElement;
      if (parent) affectedNodes.add(parent);
      record.textNode.textContent = record.originalText;
    } else if (record.type === "attribute-replace") {
      affectedNodes.add(record.element);
      if (record.originalValue === null) {
        record.element.removeAttribute(record.attribute);
      } else {
        record.element.setAttribute(record.attribute, record.originalValue);
      }
    } else if (record.type === "style-change") {
      affectedNodes.add(record.element);
      if (record.originalValue) record.element.style.setProperty(record.property, record.originalValue);
      else record.element.style.removeProperty(record.property);
      if (!record.element.getAttribute("style")) record.element.removeAttribute("style");
    }
  }

  for (const node of affectedNodes) {
    node.removeAttribute("data-imt-unit-id");
    node.removeAttribute("data-imt-state");
    node.removeAttribute(ORIGINAL_TEXT_ATTRIBUTE);
  }
}
