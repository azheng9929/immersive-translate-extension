import type { RenderMode, UnitCategory } from "@/shared/types";

export function decideRenderMode(category: UnitCategory, root: HTMLElement, text: string): RenderMode {
  if (category === "attribute") return "replace-attribute";
  if (category === "button" || category === "nav" || category === "menu" || category === "label" || category === "inline-ui") {
    return "replace-text";
  }

  if (category === "table-cell") {
    return text.length > 24 ? "compact-bilingual" : "replace-text";
  }

  if (hasTightLayout(root)) {
    return category === "content-block" || category === "list-item" || category === "heading"
      ? "compact-bilingual"
      : "replace-text";
  }

  if (category === "heading" || category === "card-text") return "compact-bilingual";
  if (category === "content-block" || category === "comment" || category === "list-item") return "bilingual-inside";
  return text.length > 40 ? "compact-bilingual" : "replace-text";
}

function hasTightLayout(root: HTMLElement): boolean {
  const parent = root.parentElement;
  if (!parent) return false;
  const parentStyle = window.getComputedStyle(parent);
  const rootStyle = window.getComputedStyle(root);
  if (parentStyle.display === "grid") return true;
  if (parentStyle.display === "flex" && parentStyle.flexDirection.startsWith("row")) return true;
  if (rootStyle.position === "absolute" || rootStyle.position === "fixed") return true;
  if (rootStyle.overflow === "hidden" && rootStyle.maxHeight !== "none") return true;
  return false;
}
