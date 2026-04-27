import type { UnitCategory } from "./types";
import { normalizeVisibleText } from "./normalize";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "SVG",
  "CANVAS",
  "MATH",
  "PRE",
  "CODE",
  "KBD",
  "SAMP",
  "TEXTAREA",
  "SELECT",
  "VIDEO",
  "AUDIO",
  "IFRAME",
]);

const UI_CATEGORIES = new Set<UnitCategory>([
  "button",
  "nav",
  "menu",
  "label",
  "inline-ui",
  "attribute",
  "table-cell",
]);

export function isSkippableElement(element: Element): boolean {
  if (element.closest('[data-imt-managed="true"]')) return true;
  if (element.closest("[translate='no'], .notranslate")) return true;
  if (element.closest("[contenteditable='true'], [contenteditable='']")) return true;
  return SKIP_TAGS.has(element.tagName);
}

export function isMeaningfulText(value: string, category: UnitCategory): boolean {
  const text = normalizeVisibleText(value);
  if (!text) return false;
  if (/^[\d\s.,:%+-]+$/.test(text)) return false;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
  if (/^v?\d+(\.\d+){1,4}$/i.test(text)) return false;
  if (/^[#$]?[a-f0-9]{7,}$/i.test(text)) return false;
  if (text.length < 3 && !UI_CATEGORIES.has(category)) return false;
  return true;
}
