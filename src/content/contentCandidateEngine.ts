import { normalizeVisibleText } from "../shared/normalize";
import { isMeaningfulText, isSkippableElement } from "../shared/skipRules";
import type { WebTranslationFallbackProfile } from "../shared/webRuleTypes";
import { classifyElementForTranslation, isStayOriginalElement, type CompiledFilterRule } from "./compiledFilterRule";
import { isVisibleElement } from "./visibility";

export type PageContentProfile =
  | "article"
  | "docs"
  | "landing"
  | "card-list"
  | "video-list"
  | "commerce"
  | "forum"
  | "social"
  | "generic";

export type CandidateStats = {
  textLength: number;
  wordCount: number;
  textNodeCount: number;
  headingCount: number;
  paragraphCount: number;
  listItemCount: number;
  linkCount: number;
  buttonCount: number;
  imageCount: number;
  inputCount: number;
  linkTextLength: number;
  buttonTextLength: number;
  maxRepeatedChildSignatureCount: number;
  priceLikeTextCount: number;
  timeLikeTextCount: number;
  usernameLikeTextCount: number;
  avgTextLength: number;
  uniqueTextRatio: number;
  weakCandidateHitCount: number;
};

export type TextDrivenCandidate = {
  element: HTMLElement;
  profile: PageContentProfile;
  score: number;
  stats: CandidateStats;
  reasons: readonly string[];
};

export type TextDrivenCandidateOptions = {
  filterRule?: CompiledFilterRule;
  excludeSelectors?: readonly string[];
  weakCandidateSelectors?: readonly string[];
  profileHint?: WebTranslationFallbackProfile | PageContentProfile;
  maxTextNodes?: number;
  maxAncestorDepth?: number;
  maxRoots?: number;
};

type MutableStats = CandidateStats & {
  texts: string[];
  uniqueTexts: Set<string>;
};

const DEFAULT_MAX_TEXT_NODES = 1200;
const DEFAULT_MAX_ANCESTOR_DEPTH = 8;
const DEFAULT_MAX_ROOTS = 24;
const MIN_SCORE = 35;
const MIN_TEXT_LENGTH = 18;

const STRUCTURAL_CANDIDATE_TAGS = new Set([
  "A",
  "ARTICLE",
  "DIV",
  "FIGCAPTION",
  "LI",
  "MAIN",
  "P",
  "SECTION",
  "TD",
  "TH",
  "UL",
  "OL",
]);

export function selectTextDrivenTranslationRoots(
  root: ParentNode,
  options: TextDrivenCandidateOptions = {},
): HTMLElement[] {
  return collectTextDrivenCandidates(root, options)
    .filter((candidate) => candidate.score >= MIN_SCORE && candidate.stats.textLength >= MIN_TEXT_LENGTH)
    .slice(0, options.maxRoots ?? DEFAULT_MAX_ROOTS)
    .map((candidate) => candidate.element);
}

export function collectTextDrivenCandidates(
  root: ParentNode,
  options: TextDrivenCandidateOptions = {},
): TextDrivenCandidate[] {
  const statsByElement = new Map<HTMLElement, MutableStats>();
  const maxTextNodes = options.maxTextNodes ?? DEFAULT_MAX_TEXT_NODES;
  const maxAncestorDepth = options.maxAncestorDepth ?? DEFAULT_MAX_ANCESTOR_DEPTH;
  let acceptedTextNodes = 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (acceptedTextNodes >= maxTextNodes) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || !isCandidateTextParent(parent, options)) return NodeFilter.FILTER_REJECT;
      const text = normalizeVisibleText(node.textContent ?? "");
      if (!isMeaningfulText(text, "fallback")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    acceptedTextNodes += 1;
    const textNode = node as Text;
    const text = normalizeVisibleText(textNode.textContent ?? "");
    addTextNodeToAncestorCandidates(textNode, text, statsByElement, options, maxAncestorDepth);
    node = walker.nextNode();
  }

  const candidates = [...statsByElement.entries()]
    .map(([element, stats]) => finalizeCandidate(element, finalizeStats(element, stats, options), options))
    .filter((candidate) => candidate.stats.textLength >= MIN_TEXT_LENGTH)
    .sort((left, right) => right.score - left.score);

  return dedupeNestedCandidates(candidates);
}

export function classifyCandidateProfile(
  element: HTMLElement,
  stats: CandidateStats = collectElementStats(element),
  hint?: WebTranslationFallbackProfile | PageContentProfile,
): PageContentProfile {
  const hinted = normalizeProfileHint(hint);
  if (hinted && hinted !== "generic") return hinted;

  const className = element.className ? String(element.className).toLowerCase() : "";
  const id = element.id.toLowerCase();
  const marker = `${element.tagName.toLowerCase()} ${id} ${className}`;
  const linkDensity = stats.textLength > 0 ? stats.linkTextLength / stats.textLength : 0;

  if (/(comment|thread|reply|post)/i.test(marker) && stats.usernameLikeTextCount > 0) return "social";
  if (/(forum|comment|discussion|reply|post)/i.test(marker)) return "forum";
  if (
    stats.maxRepeatedChildSignatureCount >= 3 &&
    stats.imageCount >= 3 &&
    (titleLikeLinkCount(element) >= 3 || /video|thumb|media|playlist/i.test(marker))
  ) {
    return "video-list";
  }
  if (stats.maxRepeatedChildSignatureCount >= 3 && stats.priceLikeTextCount >= 2 && stats.imageCount >= 2) {
    return "commerce";
  }
  if (stats.maxRepeatedChildSignatureCount >= 3 && linkDensity >= 0.25) return "card-list";
  if (/(docs|documentation|markdown|readme)/i.test(marker)) return "docs";
  if (stats.paragraphCount >= 3 && stats.textLength >= 450 && linkDensity < 0.55) return "article";
  if (stats.headingCount >= 1 || stats.weakCandidateHitCount > 0) return "landing";
  return "generic";
}

function addTextNodeToAncestorCandidates(
  textNode: Text,
  text: string,
  statsByElement: Map<HTMLElement, MutableStats>,
  options: TextDrivenCandidateOptions,
  maxAncestorDepth: number,
): void {
  let current = textNode.parentElement;
  let depth = 0;
  while (current && current !== document.body && current !== document.documentElement && depth < maxAncestorDepth) {
    if (isDisqualifyingAncestor(current, options)) break;
    if (isStableContainerCandidate(current, options)) {
      addContribution(statsFor(statsByElement, current), current, text);
    }
    current = current.parentElement;
    depth += 1;
  }
}

function isCandidateTextParent(element: HTMLElement, options: TextDrivenCandidateOptions): boolean {
  if (isSkippableElement(element, { allowTooltip: true })) return false;
  if (!isVisibleElement(element)) return false;
  if (matchesClosestSelector(element, options.excludeSelectors)) return false;
  if (options.filterRule) {
    const classification = classifyElementForTranslation(element, options.filterRule);
    if (classification.kind === "excluded" || classification.kind === "stay-original") return false;
    if (isStayOriginalElement(element, options.filterRule)) return false;
  }
  return true;
}

function isStableContainerCandidate(element: HTMLElement, options: TextDrivenCandidateOptions): boolean {
  if (!STRUCTURAL_CANDIDATE_TAGS.has(element.tagName) && !matchesClosestSelector(element, options.weakCandidateSelectors)) {
    return false;
  }
  return !isDisqualifyingAncestor(element, options);
}

function isDisqualifyingAncestor(element: HTMLElement, options: TextDrivenCandidateOptions): boolean {
  if (element.matches("header,nav,footer,aside,form,button,[role='button'],menu,[role='menu'],[role='menuitem']")) {
    return true;
  }
  if (matchesClosestSelector(element, options.excludeSelectors)) return true;
  if (options.filterRule) {
    const classification = classifyElementForTranslation(element, options.filterRule);
    if (classification.kind === "excluded" || classification.kind === "stay-original") return true;
  }
  return false;
}

function statsFor(statsByElement: Map<HTMLElement, MutableStats>, element: HTMLElement): MutableStats {
  let stats = statsByElement.get(element);
  if (!stats) {
    stats = {
      textLength: 0,
      wordCount: 0,
      textNodeCount: 0,
      headingCount: 0,
      paragraphCount: 0,
      listItemCount: 0,
      linkCount: 0,
      buttonCount: 0,
      imageCount: 0,
      inputCount: 0,
      linkTextLength: 0,
      buttonTextLength: 0,
      maxRepeatedChildSignatureCount: 0,
      priceLikeTextCount: 0,
      timeLikeTextCount: 0,
      usernameLikeTextCount: 0,
      avgTextLength: 0,
      uniqueTextRatio: 1,
      weakCandidateHitCount: 0,
      texts: [],
      uniqueTexts: new Set(),
    };
    statsByElement.set(element, stats);
  }
  return stats;
}

function addContribution(stats: MutableStats, element: HTMLElement, text: string): void {
  stats.textLength += text.length;
  stats.wordCount += countWords(text);
  stats.textNodeCount += 1;
  stats.texts.push(text);
  stats.uniqueTexts.add(text.toLowerCase());
  if (element.matches("h1,h2,h3,h4,h5,h6")) stats.headingCount += 1;
  if (element.matches("p,blockquote,figcaption")) stats.paragraphCount += 1;
  if (element.matches("li,[role='listitem']")) stats.listItemCount += 1;
  if (PRICE_LIKE.test(text)) stats.priceLikeTextCount += 1;
  if (TIME_LIKE.test(text)) stats.timeLikeTextCount += 1;
  if (USERNAME_LIKE.test(text)) stats.usernameLikeTextCount += 1;
}

function finalizeStats(
  element: HTMLElement,
  stats: MutableStats,
  options: TextDrivenCandidateOptions,
): CandidateStats {
  const textLength = normalizeVisibleText(element.textContent ?? "").length || stats.textLength;
  const linkTextLength = textLengthForSelector(element, "a");
  const buttonTextLength = textLengthForSelector(element, "button,[role='button']");
  const childSignatureCount = maxRepeatedChildSignatureCount(element);
  const weakCandidateHitCount = countSelectorMatches(element, options.weakCandidateSelectors);

  return {
    textLength,
    wordCount: stats.wordCount,
    textNodeCount: stats.textNodeCount,
    headingCount: stats.headingCount + element.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
    paragraphCount: stats.paragraphCount + element.querySelectorAll("p,blockquote,figcaption").length,
    listItemCount: stats.listItemCount + element.querySelectorAll("li,[role='listitem']").length,
    linkCount: element.querySelectorAll("a").length,
    buttonCount: element.querySelectorAll("button,[role='button']").length,
    imageCount: element.querySelectorAll("img,picture,video").length,
    inputCount: element.querySelectorAll("input,select,textarea").length,
    linkTextLength,
    buttonTextLength,
    maxRepeatedChildSignatureCount: childSignatureCount,
    priceLikeTextCount: stats.priceLikeTextCount,
    timeLikeTextCount: stats.timeLikeTextCount,
    usernameLikeTextCount: stats.usernameLikeTextCount,
    avgTextLength: stats.textNodeCount > 0 ? stats.textLength / stats.textNodeCount : 0,
    uniqueTextRatio: stats.texts.length > 0 ? stats.uniqueTexts.size / stats.texts.length : 1,
    weakCandidateHitCount,
  };
}

function collectElementStats(element: HTMLElement): CandidateStats {
  const text = normalizeVisibleText(element.textContent ?? "");
  return {
    textLength: text.length,
    wordCount: countWords(text),
    textNodeCount: text ? 1 : 0,
    headingCount: element.matches("h1,h2,h3,h4,h5,h6") ? 1 : element.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
    paragraphCount: element.matches("p,blockquote,figcaption") ? 1 : element.querySelectorAll("p,blockquote,figcaption").length,
    listItemCount: element.matches("li,[role='listitem']") ? 1 : element.querySelectorAll("li,[role='listitem']").length,
    linkCount: element.querySelectorAll("a").length + (element.matches("a") ? 1 : 0),
    buttonCount: element.querySelectorAll("button,[role='button']").length,
    imageCount: element.querySelectorAll("img,picture,video").length,
    inputCount: element.querySelectorAll("input,select,textarea").length,
    linkTextLength: textLengthForSelector(element, "a"),
    buttonTextLength: textLengthForSelector(element, "button,[role='button']"),
    maxRepeatedChildSignatureCount: maxRepeatedChildSignatureCount(element),
    priceLikeTextCount: text.match(PRICE_LIKE) ? 1 : 0,
    timeLikeTextCount: text.match(TIME_LIKE) ? 1 : 0,
    usernameLikeTextCount: text.match(USERNAME_LIKE) ? 1 : 0,
    avgTextLength: text.length,
    uniqueTextRatio: 1,
    weakCandidateHitCount: 0,
  };
}

function finalizeCandidate(
  element: HTMLElement,
  stats: CandidateStats,
  options: TextDrivenCandidateOptions,
): TextDrivenCandidate {
  const profile = classifyCandidateProfile(element, stats, options.profileHint);
  const { score, reasons } = scoreCandidate(element, stats, profile);
  return { element, profile, stats, score, reasons };
}

function scoreCandidate(
  element: HTMLElement,
  stats: CandidateStats,
  profile: PageContentProfile,
): { score: number; reasons: string[] } {
  const reasons: string[] = [profile];
  const linkDensity = stats.textLength > 0 ? stats.linkTextLength / stats.textLength : 0;
  const buttonDensity = stats.textLength > 0 ? stats.buttonTextLength / stats.textLength : 0;
  const repeated = stats.maxRepeatedChildSignatureCount;
  let score =
    Math.min(30, stats.textLength / 10) +
    Math.min(36, stats.wordCount * 1.35) +
    Math.min(12, stats.headingCount * 3) +
    Math.min(12, stats.paragraphCount * 2) +
    Math.min(18, stats.weakCandidateHitCount * 9);

  if (profile === "article" || profile === "docs") {
    score += stats.paragraphCount * 3;
    score -= linkDensity * 45;
    score -= buttonDensity * 45;
    if (repeated >= 4) score -= 18;
  } else if (profile === "video-list" || profile === "card-list") {
    score += Math.min(35, repeated * 7);
    score += Math.min(18, stats.imageCount * 3);
    score += Math.min(18, titleLikeLinkCount(element) * 4);
    score -= buttonDensity * 18;
    reasons.push("high-link-content");
  } else if (profile === "commerce") {
    score += Math.min(32, repeated * 6);
    score += Math.min(14, stats.imageCount * 2);
    score += Math.min(12, stats.priceLikeTextCount * 3);
    score -= buttonDensity * 22;
  } else if (profile === "landing") {
    score += Math.min(18, stats.headingCount * 4 + stats.weakCandidateHitCount * 4);
    score -= buttonDensity * 25;
  } else {
    score -= linkDensity * 22;
    score -= buttonDensity * 30;
  }

  if (stats.inputCount > 0) score -= 25;
  if (stats.uniqueTextRatio < 0.45) score -= 12;
  return { score, reasons };
}

function dedupeNestedCandidates(candidates: TextDrivenCandidate[]): TextDrivenCandidate[] {
  const accepted: TextDrivenCandidate[] = [];
  for (const candidate of candidates) {
    const containing = accepted.find((existing) => existing.element.contains(candidate.element));
    if (containing) continue;

    for (const existing of [...accepted]) {
      if (candidate.element.contains(existing.element)) {
        accepted.splice(accepted.indexOf(existing), 1);
      }
    }
    accepted.push(candidate);
  }
  return accepted.sort(compareDocumentOrder);
}

function normalizeProfileHint(hint: WebTranslationFallbackProfile | PageContentProfile | undefined): PageContentProfile | undefined {
  if (!hint || hint === "none") return undefined;
  if (hint === "video") return "video-list";
  return hint;
}

function textLengthForSelector(element: HTMLElement, selector: string): number {
  let length = 0;
  if (element.matches(selector)) length += normalizeVisibleText(element.textContent ?? "").length;
  element.querySelectorAll(selector).forEach((node) => {
    length += normalizeVisibleText(node.textContent ?? "").length;
  });
  return length;
}

function titleLikeLinkCount(element: HTMLElement): number {
  let count = 0;
  const links = element.matches("a") ? [element] : Array.from(element.querySelectorAll("a"));
  for (const link of links) {
    const text = normalizeVisibleText(link.textContent ?? "");
    if (text.length >= 10 && !TIME_LIKE.test(text) && !PRICE_LIKE.test(text)) count += 1;
  }
  return count;
}

function maxRepeatedChildSignatureCount(element: HTMLElement): number {
  const counts = new Map<string, number>();
  for (const child of Array.from(element.children)) {
    if (!(child instanceof HTMLElement)) continue;
    const key = childSignature(child);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function childSignature(element: HTMLElement): string {
  const stableClass = Array.from(element.classList).slice(0, 2).join(".");
  return `${element.tagName}.${stableClass}`;
}

function countSelectorMatches(element: HTMLElement, selectors: readonly string[] | undefined): number {
  if (!selectors?.length) return 0;
  let count = 0;
  for (const selector of selectors) {
    try {
      if (element.matches(selector)) count += 1;
      count += element.querySelectorAll(selector).length;
    } catch {
      continue;
    }
  }
  return count;
}

function matchesClosestSelector(element: HTMLElement, selectors: readonly string[] | undefined): boolean {
  if (!selectors?.length) return false;
  for (const selector of selectors) {
    try {
      if (element.closest(selector)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function compareDocumentOrder(left: TextDrivenCandidate, right: TextDrivenCandidate): number {
  if (left.element === right.element) return right.score - left.score;
  const position = left.element.compareDocumentPosition(right.element);
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  return right.score - left.score;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const PRICE_LIKE = /(?:[$€£¥]\s?\d|\d+(?:\.\d+)?\s?(?:usd|eur|gbp|cny|rmb))/i;
const TIME_LIKE = /^(?:\d{1,2}:\d{2}(?::\d{2})?|\d+\s*(?:views?|likes?|comments?|mins?|minutes?|hours?|days?|weeks?|months?|years?)\b|\d+[smhdw])$/i;
const USERNAME_LIKE = /^[@u/]?[A-Za-z0-9_.-]{1,40}$/;
