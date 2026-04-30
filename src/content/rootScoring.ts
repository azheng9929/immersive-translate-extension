import { normalizeVisibleText } from "../shared/normalize";

export type TranslationRootScore = {
  element: HTMLElement;
  score: number;
  textLength: number;
  wordCount: number;
  linkDensity: number;
  buttonDensity: number;
  repeatedTextDensity: number;
  visibleArea: number;
};

const CANDIDATE_ROOT_SELECTOR = [
  "main",
  "[role='main']",
  "article",
  "[data-reader-root]",
  ".article",
  ".post",
  ".post-content",
  ".entry-content",
  ".content",
  "section",
].join(",");

const MIN_CONFIDENT_TEXT_LENGTH = 80;
const MIN_CONFIDENT_SCORE = 35;

export function scoreTranslationRoot(element: HTMLElement): TranslationRootScore {
  const text = normalizeVisibleText(element.innerText || element.textContent || "");
  const textLength = text.length;
  const wordCount = countWords(text);
  const linkDensity = textDensity(element, "a");
  const buttonDensity = textDensity(element, "button,[role='button'],input,select,textarea");
  const repeatedTextDensity = repeatedDensity(text);
  const visibleArea = visibleElementArea(element);
  const semanticBonus = semanticRootBonus(element);
  const areaBonus = visibleArea > 0 ? Math.min(10, Math.log10(visibleArea + 1)) : 4;

  const score =
    Math.min(30, textLength / 12) +
    Math.min(45, wordCount * 1.6) +
    semanticBonus +
    areaBonus -
    linkDensity * 60 -
    buttonDensity * 55 -
    repeatedTextDensity * 24;

  return {
    element,
    score,
    textLength,
    wordCount,
    linkDensity,
    buttonDensity,
    repeatedTextDensity,
    visibleArea,
  };
}

export function selectHighConfidenceTranslationRoots(root: ParentNode): HTMLElement[] {
  const candidates = collectCandidateRoots(root)
    .map(scoreTranslationRoot)
    .filter((candidate) => candidate.textLength >= MIN_CONFIDENT_TEXT_LENGTH && candidate.score >= MIN_CONFIDENT_SCORE)
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  return best ? [best.element] : [];
}

function collectCandidateRoots(root: ParentNode): HTMLElement[] {
  const candidates: HTMLElement[] = [];
  const add = (element: HTMLElement): void => {
    if (candidates.includes(element)) return;
    candidates.push(element);
  };

  try {
    if (root instanceof HTMLElement && root.matches(CANDIDATE_ROOT_SELECTOR)) add(root);
    root.querySelectorAll?.(CANDIDATE_ROOT_SELECTOR).forEach((element) => {
      if (element instanceof HTMLElement) add(element);
    });
  } catch {
    return [];
  }

  return candidates.filter((element) => !element.closest("nav,header,footer,aside,[data-imt-managed='true']"));
}

function textDensity(root: HTMLElement, selector: string): number {
  const rootTextLength = normalizeVisibleText(root.innerText || root.textContent || "").length;
  if (rootTextLength === 0) return 0;

  let matchedTextLength = 0;
  try {
    root.querySelectorAll(selector).forEach((element) => {
      matchedTextLength += normalizeVisibleText(element.textContent || "").length;
    });
  } catch {
    return 0;
  }
  return Math.min(1, matchedTextLength / rootTextLength);
}

function repeatedDensity(text: string): number {
  const parts = text.split(/[.!?\n。！？]+/).map((part) => part.trim()).filter((part) => part.length > 2);
  if (parts.length <= 1) return 0;
  const unique = new Set(parts.map((part) => part.toLowerCase()));
  return 1 - unique.size / parts.length;
}

function visibleElementArea(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function semanticRootBonus(element: HTMLElement): number {
  if (element.matches("main,[role='main']")) return 18;
  if (element.matches("article")) return 14;
  if (element.matches("[data-reader-root],.article,.post,.post-content,.entry-content")) return 10;
  if (element.matches(".content,section")) return 4;
  return 0;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
