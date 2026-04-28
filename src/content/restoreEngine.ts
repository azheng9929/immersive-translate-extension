import type { RestoreRecord } from "../shared/types";

const ORIGINAL_TEXT_ATTRIBUTE = "data-imt-original-text";

export function restoreAll(records: RestoreRecord[]): void {
  for (const record of [...records].reverse()) {
    if (record.type === "inserted-node") {
      record.node.remove();
    } else if (record.type === "text-replace") {
      record.textNode.textContent = record.originalText;
    } else if (record.type === "attribute-replace") {
      if (record.originalValue === null) {
        record.element.removeAttribute(record.attribute);
      } else {
        record.element.setAttribute(record.attribute, record.originalValue);
      }
    } else if (record.type === "style-change") {
      record.element.style.setProperty(record.property, record.originalValue);
    }
  }

  document.querySelectorAll("[data-imt-unit-id]").forEach((node) => {
    node.removeAttribute("data-imt-unit-id");
    node.removeAttribute("data-imt-state");
  });

  document.querySelectorAll(`[${ORIGINAL_TEXT_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute(ORIGINAL_TEXT_ATTRIBUTE);
  });
}
