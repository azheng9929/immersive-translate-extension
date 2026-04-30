import { normalizeVisibleText } from "../shared/normalize";
import {
  collectTextDrivenCandidates,
  type PageContentProfile,
} from "./contentCandidateEngine";
import type { WebTranslationFallbackProfile } from "../shared/webRuleTypes";
import { classifyElementForTranslation, matchesClosestSelector, type CompiledFilterRule } from "./compiledFilterRule";
import {
  recordCandidateAccepted,
  recordCandidateEvaluated,
  type TranslationDiagnostics,
} from "./translationDiagnostics";

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

export type TranslationRootScoreOptions = {
  profileHint?: WebTranslationFallbackProfile | PageContentProfile;
  weakCandidateSelectors?: readonly string[];
  excludeSelectors?: readonly string[];
  filterRule?: CompiledFilterRule;
  diagnostics?: TranslationDiagnostics;
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
const MAX_CONFIDENT_ROOTS = 24;

export function scoreTranslationRoot(element: HTMLElement): TranslationRootScore {
  return scoreTranslationRootWithOptions(element, {});
}

function scoreTranslationRootWithOptions(
  element: HTMLElement,
  options: TranslationRootScoreOptions,
): TranslationRootScore {
  const text = translationRootText(element, options);
  const textLength = text.length;
  const wordCount = countWords(text);
  const linkDensity = textDensity(element, "a", options);
  const buttonDensity = textDensity(element, "button,[role='button'],input,select,textarea", options);
  const repeatedTextDensity = repeatedDensity(text);
  const visibleArea = visibleElementArea(element);
  const semanticBonus = semanticRootBonus(element);
  const areaBonus = visibleArea > 0 ? Math.min(10, Math.log10(visibleArea + 1)) : 4;
  const rawTextLength = normalizeVisibleText(element.textContent ?? "").length;
  const excludedTextPenalty = rawTextLength > textLength
    ? Math.min(25, ((rawTextLength - textLength) / Math.max(rawTextLength, 1)) * 35)
    : 0;

  const score =
    Math.min(30, textLength / 12) +
    Math.min(45, wordCount * 1.6) +
    semanticBonus +
    areaBonus -
    linkDensity * 60 -
    buttonDensity * 55 -
    repeatedTextDensity * 24 -
    excludedTextPenalty;

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

export function selectHighConfidenceTranslationRoots(
  root: ParentNode,
  options: TranslationRootScoreOptions = {},
): HTMLElement[] {
  const selectorCandidates = collectCandidateRoots(root)
    .filter((element) => isAllowedScoringRoot(element, options))
    .map((element) => scoreTranslationRootWithOptions(element, options))
    .filter((candidate) => candidate.textLength >= MIN_CONFIDENT_TEXT_LENGTH && candidate.score >= MIN_CONFIDENT_SCORE);
  const textDrivenOptions: Parameters<typeof collectTextDrivenCandidates>[1] = {};
  if (options.profileHint) textDrivenOptions.profileHint = options.profileHint;
  if (options.weakCandidateSelectors?.length) {
    textDrivenOptions.weakCandidateSelectors = options.weakCandidateSelectors;
  }
  if (options.excludeSelectors?.length) textDrivenOptions.excludeSelectors = options.excludeSelectors;
  if (options.filterRule) textDrivenOptions.filterRule = options.filterRule;
  const rawTextDrivenCandidates = collectTextDrivenCandidates(root, textDrivenOptions);
  for (const candidate of rawTextDrivenCandidates) recordCandidateEvaluated(options.diagnostics, candidate.profile);
  const profileByElement = new Map(rawTextDrivenCandidates.map((candidate) => [candidate.element, candidate.profile]));
  const textDrivenCandidates = rawTextDrivenCandidates.map((candidate) => ({
    element: candidate.element,
    score: candidate.score,
    textLength: candidate.stats.textLength,
    wordCount: candidate.stats.wordCount,
    linkDensity: candidate.stats.textLength > 0 ? candidate.stats.linkTextLength / candidate.stats.textLength : 0,
    buttonDensity: candidate.stats.textLength > 0 ? candidate.stats.buttonTextLength / candidate.stats.textLength : 0,
    repeatedTextDensity: 1 - candidate.stats.uniqueTextRatio,
    visibleArea: visibleElementArea(candidate.element),
  }));
  const candidates = mergeCandidateScores(selectorCandidates, textDrivenCandidates)
    .filter((candidate) => candidate.textLength >= MIN_CONFIDENT_TEXT_LENGTH || candidate.score >= MIN_CONFIDENT_SCORE)
    .sort((left, right) => right.score - left.score);

  const selected: HTMLElement[] = [];
  for (const candidate of candidates) {
    if (selected.length >= MAX_CONFIDENT_ROOTS) break;
    if (selected.some((element) => element.contains(candidate.element) || candidate.element.contains(element))) continue;
    selected.push(candidate.element);
    const profile = profileByElement.get(candidate.element);
    if (profile) recordCandidateAccepted(options.diagnostics, profile);
  }

  return selected.sort(compareDocumentOrder);
}

function isAllowedScoringRoot(element: HTMLElement, options: TranslationRootScoreOptions): boolean {
  if (matchesClosestSelector(element, options.excludeSelectors ?? [])) return false;
  if (!options.filterRule) return true;
  const classification = classifyElementForTranslation(element, options.filterRule);
  return classification.kind !== "excluded" && classification.kind !== "stay-original";
}

function mergeCandidateScores(
  left: readonly TranslationRootScore[],
  right: readonly TranslationRootScore[],
): TranslationRootScore[] {
  const byElement = new Map<HTMLElement, TranslationRootScore>();
  for (const candidate of [...left, ...right]) {
    const existing = byElement.get(candidate.element);
    if (!existing || candidate.score > existing.score) byElement.set(candidate.element, candidate);
  }
  return [...byElement.values()];
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

function textDensity(root: HTMLElement, selector: string, options: TranslationRootScoreOptions): number {
  const rootTextLength = translationRootText(root, options).length;
  if (rootTextLength === 0) return 0;

  let matchedTextLength = 0;
  try {
    root.querySelectorAll(selector).forEach((element) => {
      if (element instanceof HTMLElement && isAllowedScoringRoot(element, options)) {
        matchedTextLength += translationRootText(element, options).length;
      }
    });
  } catch {
    return 0;
  }
  return Math.min(1, matchedTextLength / rootTextLength);
}

function translationRootText(root: HTMLElement, options: TranslationRootScoreOptions): string {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || isIgnoredScoringElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!isAllowedScoringRoot(parent, options)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    parts.push(node.textContent ?? "");
    node = walker.nextNode();
  }

  return normalizeVisibleText(parts.join(" "));
}

function isIgnoredScoringElement(element: Element): boolean {
  return Boolean(element.closest("script,style,noscript,template,pre,code,kbd,samp,svg,canvas,nav,header,footer,aside,button,[role='button'],input,select,textarea,[data-imt-managed='true']"));
}

function compareDocumentOrder(left: HTMLElement, right: HTMLElement): number {
  if (left === right) return 0;
  const position = left.compareDocumentPosition(right);
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  return 0;
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
