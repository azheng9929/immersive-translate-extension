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
  "TIME",
  "RUBY",
  "RT",
  "RP",
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

export type SkipRuleOptions = {
  allowTooltip?: boolean;
};

export function isSkippableElement(element: Element, options: SkipRuleOptions = {}): boolean {
  return explainSkippableElement(element, options) !== undefined;
}

export function explainSkippableElement(element: Element, options: SkipRuleOptions = {}): string | undefined {
  if (element.closest('[data-imt-managed="true"]')) return "managed";
  if (element.closest('[data-imt-skip="true"]')) return "explicit-skip";
  if (element.closest('[data-imt-state="loading"]')) return "loading";
  if (element.closest('[data-imt-state="translated"]')) return "translated";
  if (element.closest("[translate='no'], .notranslate")) return "notranslate";
  if (!options.allowTooltip && element.closest('[role="tooltip"], [popover]')) return "tooltip";
  if (
    element.closest(
      [
        ".social-share",
        ".share-nav",
        '[data-toolbar="share"]',
        ".o-share",
        ".prism-code",
        ".enlighter-code",
        ".rc-CodeBlock",
        '[role="code"]',
        "table.highlight",
        "hypothesis-highlight",
        ".hypothesis-highlight",
        ".material-icons",
        "material-icon",
        'span[class^="material-symbols-"]',
        ".google-symbols",
        "i.fa",
        'i[class^="fa-"]',
        "visuallyhidden",
        ".visuallyhidden",
        ".sr-only",
      ].join(","),
    )
  ) {
    return "site-ui";
  }

  let current: Element | null = element;
  while (current) {
    if (
      current.hasAttribute("contenteditable") &&
      current.getAttribute("contenteditable")?.trim().toLowerCase() !== "false"
    ) {
      return "editable";
    }
    if (SKIP_TAGS.has(current.tagName)) return "tag";
    current = current.parentElement;
  }

  return undefined;
}

export function isMeaningfulText(value: string, category: UnitCategory): boolean {
  const text = normalizeVisibleText(value);
  if (!text) return false;
  if (/^[\d\s.,:%+-]+$/.test(text)) return false;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
  if (/^@[A-Za-z0-9_.-]{1,50}$/.test(text)) return false;
  if (/^[ur]\/[A-Za-z0-9_-]{1,40}$/i.test(text)) return false;
  if (/^id@https?:\/\/(?:x\.com|twitter\.com)\/[\w-]+\/status\/\d+/i.test(text)) return false;
  if (/^[A-Za-z]:[\\/][^\s]+$/.test(text) || /^\.{0,2}[\\/][^\s]+$/.test(text)) return false;
  if (/^v?\d+(\.\d+){1,4}$/i.test(text)) return false;
  if (/^(?:[#$][a-f0-9]{7,}|0x[a-f0-9]{7,})$/i.test(text)) return false;
  if (/^[a-f0-9]{16,}$/i.test(text)) return false;
  if (text.length < 3 && !UI_CATEGORIES.has(category)) return false;
  return true;
}
