import type {
  PageTranslationRuleVisualizationSelector,
  PageTranslationStatus,
} from "./pageTranslationSession";
import { isVisibleElement } from "./visibility";
import { normalizeVisibleText } from "../shared/normalize";
import { explainSkippableElement, isMeaningfulText } from "../shared/skipRules";

type RuleTargetInspectorOptions = {
  getStatus: () => PageTranslationStatus | undefined;
  collectTranslatableRoots?: () => readonly HTMLElement[];
};

const INSPECTOR_STYLE_TEXT = `
[data-imt-rule-target-inspector="true"] {
  position: fixed;
  z-index: 2147483647;
  max-width: min(340px, calc(100vw - 24px));
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid rgba(20, 33, 61, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.98);
  color: #14213d;
  box-shadow: 0 16px 38px rgba(20, 33, 61, 0.22), 0 2px 8px rgba(20, 33, 61, 0.1);
  font: 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  pointer-events: none;
  white-space: pre-line;
}
`;

export class RuleTargetInspector {
  private active = false;
  private inspectorElement: HTMLElement | undefined;
  private styleElement: HTMLStyleElement | undefined;
  private readonly handleClick = (event: MouseEvent): void => {
    const element = inspectableElementFromEvent(event);
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    this.show(element, event.clientX, event.clientY);
  };

  constructor(private readonly options: RuleTargetInspectorOptions) {}

  isActive(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.ensureStyle();
    document.addEventListener("click", this.handleClick, true);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener("click", this.handleClick, true);
    this.inspectorElement?.remove();
    this.inspectorElement = undefined;
    this.styleElement?.remove();
    this.styleElement = undefined;
  }

  private show(element: Element, clientX: number, clientY: number): void {
    this.inspectorElement?.remove();
    const inspector = document.createElement("aside");
    inspector.dataset.imtManaged = "true";
    inspector.dataset.imtRuleTargetInspector = "true";
    const status = this.options.getStatus();
    inspector.textContent = buildRuleTargetExplanation(element, {
      ...(status ? { status } : {}),
      textCandidates: this.options.collectTranslatableRoots?.() ?? [],
    });

    const left = Math.min(Math.max(clientX + 12, 12), Math.max(window.innerWidth - 360, 12));
    const top = Math.min(Math.max(clientY + 12, 12), Math.max(window.innerHeight - 160, 12));
    inspector.style.left = `${left}px`;
    inspector.style.top = `${top}px`;
    document.documentElement.append(inspector);
    this.inspectorElement = inspector;
  }

  private ensureStyle(): void {
    if (this.styleElement) return;
    const style = document.createElement("style");
    style.dataset.imtManaged = "true";
    style.dataset.imtRuleTargetInspectorStyle = "true";
    style.textContent = INSPECTOR_STYLE_TEXT;
    (document.head || document.documentElement).append(style);
    this.styleElement = style;
  }
}

export function buildRuleTargetExplanation(
  element: Element,
  input: {
    status?: PageTranslationStatus;
    textCandidates?: readonly HTMLElement[];
  } = {},
): string {
  const translatedRoot = element.closest("[data-imt-state='translated']");
  const inspectionRoot = translatedRoot ?? element;
  const matchedRules = matchingRuleLabels(inspectionRoot, input.status?.site?.ruleDiagnostics?.visualizationSelectors ?? []);
  const textCandidateLabel = matchesTextCandidate(inspectionRoot, input.textCandidates ?? [])
    ? ["text-candidate: actual translated root"]
    : [];
  const rules = [...matchedRules, ...textCandidateLabel];
  const rows = [
    `状态: ${translatedRoot ? "已翻译" : "未翻译"}`,
    `元素: ${elementLabel(inspectionRoot)}`,
    ...(translatedRoot ? [] : [`原因: ${untranslatedReasonLabel(inspectionRoot, input)}`]),
    `规则: ${rules.length > 0 ? rules.join(" | ") : "未命中规则 selector"}`,
  ];
  const text = elementTextPreview(inspectionRoot);
  if (text) rows.push(`文本: ${text}`);
  return rows.join("\n");
}

function inspectableElementFromEvent(event: MouseEvent): Element | undefined {
  for (const item of event.composedPath()) {
    if (item instanceof Element) {
      if (isExtensionElement(item)) return undefined;
      return item.closest("[data-imt-state='translated']") ?? item;
    }
  }
  const target = event.target;
  if (!(target instanceof Element) || isExtensionElement(target)) return undefined;
  return target.closest("[data-imt-state='translated']") ?? target;
}

function matchingRuleLabels(
  element: Element,
  selectors: readonly PageTranslationRuleVisualizationSelector[],
): string[] {
  return [...new Set(matchingRuleEntries(element, selectors).map((entry) => ruleLabel(entry)))];
}

function matchesSelectorContext(element: Element, selector: string): boolean {
  try {
    if (element.matches(selector)) return true;
    return Boolean(element.closest(selector));
  } catch {
    return false;
  }
}

function matchesTextCandidate(element: Element, textCandidates: readonly HTMLElement[]): boolean {
  return textCandidates.some((candidate) =>
    candidate === element ||
    candidate.contains(element) ||
    element.contains(candidate)
  );
}

function ruleLabel(entry: PageTranslationRuleVisualizationSelector): string {
  return entry.label ? `${entry.group}:${entry.label}` : entry.group;
}

function untranslatedReasonLabel(
  element: Element,
  input: {
    status?: PageTranslationStatus;
    textCandidates?: readonly HTMLElement[];
  },
): string {
  const selectors = input.status?.site?.ruleDiagnostics?.visualizationSelectors ?? [];
  const matchedEntries = matchingRuleEntries(element, selectors);
  if (matchedEntries.some((entry) => entry.group === "exclude")) {
    return "命中排除规则，当前元素或祖先在排除范围内";
  }
  if (matchedEntries.some((entry) => entry.group === "dynamic-exclude")) {
    return "命中动态排除规则，动态补翻会跳过这里";
  }
  if (matchedEntries.some((entry) => entry.group === "skip-build-container")) {
    return "命中跳过构建容器规则，扫描根构建时会跳过这里";
  }
  if (!isVisibleElement(element)) {
    return "元素隐藏或祖先隐藏，扫描时会跳过";
  }
  const allowTooltip = input.status?.site?.ruleDiagnostics?.allowTooltip ?? false;
  const skippableReason = explainSkippableElement(element, { allowTooltip });
  if (skippableReason) return skippableReasonLabel(skippableReason);
  const text = normalizeVisibleText(element.textContent ?? "");
  if (text && !isMeaningfulText(text, classifyInspectionCategory(element))) {
    return "文本更像短文本、编号、链接或标识符，当前启发式会跳过";
  }
  return "没有命中内容规则或实际翻译候选根";
}

function elementLabel(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList)
    .filter((className) => /^[\w-]+$/.test(className))
    .slice(0, 3)
    .map((className) => `.${className}`)
    .join("");
  return `${tag}${id}${classes}`;
}

function elementTextPreview(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function matchingRuleEntries(
  element: Element,
  selectors: readonly PageTranslationRuleVisualizationSelector[],
): PageTranslationRuleVisualizationSelector[] {
  const labels: PageTranslationRuleVisualizationSelector[] = [];
  for (const entry of selectors) {
    if (!matchesSelectorContext(element, entry.selector)) continue;
    labels.push(entry);
  }
  return labels;
}

function classifyInspectionCategory(
  element: Element,
): "button" | "nav" | "menu" | "label" | "table-cell" | "fallback" {
  if (element.closest("button")) return "button";
  if (element.closest("nav")) return "nav";
  if (element.closest("menu")) return "menu";
  if (element.closest("label")) return "label";
  if (element.closest("td, th")) return "table-cell";
  return "fallback";
}

function skippableReasonLabel(reason: string): string {
  if (reason === "managed" || reason === "loading" || reason === "translated") {
    return "当前元素属于插件管理区域，不参与扫描";
  }
  if (reason === "explicit-skip" || reason === "notranslate") {
    return "页面显式标记为不翻译";
  }
  if (reason === "tooltip") {
    return "当前元素位于 tooltip/popover，默认不翻译";
  }
  if (reason === "site-ui") {
    return "当前元素更像站点界面、分享区或代码展示区域";
  }
  if (reason === "editable") {
    return "当前元素位于可编辑区域，默认不翻译";
  }
  if (reason === "tag") {
    return "当前元素位于代码、媒体或其它默认跳过的标签中";
  }
  return "当前元素命中了默认跳过规则";
}

function isExtensionElement(element: Element): boolean {
  return Boolean(element.closest('[data-imt-managed="true"]'));
}
