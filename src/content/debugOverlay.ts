import type { ExtensionConfig } from "../shared/config";
import type {
  PageTranslationRuleVisualizationGroup,
  PageTranslationSiteStatus,
  PageTranslationStatus,
} from "./pageTranslationSession";

type DebugOverlayOptions = {
  getStatus: () => PageTranslationStatus;
  subscribeStatus: (listener: (status: PageTranslationStatus) => void) => () => void;
  collectTranslatableRoots?: () => HTMLElement[];
};

export type ContentDebugApi = {
  getConfig: () => ExtensionConfig;
  getStatus: () => PageTranslationStatus;
  getRule: () => PageTranslationSiteStatus | undefined;
  restore: () => void;
  reAnalyze: () => Promise<PageTranslationStatus>;
};

export class DebugOverlay {
  private root: HTMLElement | undefined;
  private unsubscribe: (() => void) | undefined;
  private readonly ruleVisualizer = new RuleVisualizer();
  private ruleVisualizationActive = false;

  constructor(private readonly options: DebugOverlayOptions) {}

  mount(): void {
    if (this.root) return;
    this.root = document.createElement("aside");
    this.root.dataset.imtManaged = "true";
    this.root.dataset.imtDebugOverlay = "true";
    Object.assign(this.root.style, {
      position: "fixed",
      right: "12px",
      bottom: "12px",
      zIndex: "2147483646",
      width: "340px",
      maxWidth: "calc(100vw - 24px)",
      boxSizing: "border-box",
      padding: "12px",
      border: "1px solid rgba(20, 33, 61, 0.14)",
      borderRadius: "10px",
      color: "#14213d",
      background: "rgba(255, 255, 255, 0.95)",
      boxShadow: "0 18px 48px rgba(20, 33, 61, 0.18), 0 2px 8px rgba(20, 33, 61, 0.08)",
      backdropFilter: "blur(16px) saturate(1.12)",
      font: "12px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      letterSpacing: "0",
    });
    document.documentElement.append(this.root);
    this.unsubscribe = this.options.subscribeStatus((status) => this.render(status));
    this.render(this.options.getStatus());
  }

  unmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.ruleVisualizer.hide();
    this.ruleVisualizationActive = false;
    this.root?.remove();
    this.root = undefined;
  }

  private render(status: PageTranslationStatus): void {
    if (!this.root) return;
    this.root.replaceChildren(
      createTitle(),
      createRuleVisualizationButton(this.ruleVisualizationActive, () => this.toggleRuleVisualization()),
      createRow("候选", candidateLabel(status), "debug-overlay-candidates"),
      createRow("规则", ruleLabel(status), "debug-overlay-rule"),
      createRow("字段", ruleShapeLabel(status), "debug-overlay-rule-shape"),
      createRow("过滤", ruleFiltersLabel(status), "debug-overlay-rule-filters"),
      createRow("调度", ruleRuntimeLabel(status), "debug-overlay-rule-runtime"),
      createRow("阶段", `${status.phase} / ${status.observation}`, "debug-overlay-phase"),
      createRow("段落", `${status.translated}/${status.total} translated, failed ${status.failed}`, "debug-overlay-segments"),
      createRow("队列", `${status.pendingRoots} pending, ${status.observedRoots} lazy`, "debug-overlay-queue"),
      createRow("扫描", scanLabel(status), "debug-overlay-scan"),
      createRow("单元", unitsLabel(status), "debug-overlay-units"),
      createRow("缓存", cacheLabel(status), "debug-overlay-cache"),
      createRow("服务", providerLabel(status), "debug-overlay-provider"),
      createRow("动态", `${status.dynamicRuns} runs`, "debug-overlay-dynamic"),
    );
    if (this.ruleVisualizationActive) this.ruleVisualizer.show(status, this.collectTextCandidates());
  }

  private toggleRuleVisualization(): void {
    this.ruleVisualizationActive = !this.ruleVisualizationActive;
    const status = this.options.getStatus();
    if (!this.ruleVisualizationActive) this.ruleVisualizer.hide();
    this.render(status);
  }

  private collectTextCandidates(): HTMLElement[] {
    return this.options.collectTranslatableRoots?.() ?? [];
  }
}

export function installContentDebugApi(api: ContentDebugApi): void {
  window.__OPENAI_IT_DEBUG__ = api;
}

function createTitle(): HTMLElement {
  const title = document.createElement("div");
  title.textContent = "翻译调试";
  Object.assign(title.style, {
    marginBottom: "8px",
    color: "#14213d",
    fontSize: "13px",
    fontWeight: "750",
  });
  return title;
}

function createRuleVisualizationButton(active: boolean, onClick: () => void): HTMLElement {
  const row = document.createElement("div");
  Object.assign(row.style, {
    display: "flex",
    justifyContent: "flex-end",
    margin: "0 0 8px",
  });

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.testid = "debug-overlay-visualize-rules";
  button.textContent = active ? "隐藏规则" : "显示规则";
  Object.assign(button.style, {
    border: "1px solid rgba(20, 33, 61, 0.14)",
    borderRadius: "8px",
    background: active ? "#14213d" : "#fff",
    color: active ? "#fff" : "#14213d",
    cursor: "pointer",
    font: "650 12px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "6px 9px",
  });
  button.addEventListener("click", onClick);
  row.append(button);
  return row;
}

function createRow(label: string, value: string, testId: string): HTMLElement {
  const row = document.createElement("div");
  row.dataset.testid = testId;
  Object.assign(row.style, {
    display: "grid",
    gridTemplateColumns: "68px minmax(0, 1fr)",
    gap: "8px",
    padding: "4px 0",
    borderTop: "1px solid rgba(20, 33, 61, 0.06)",
  });

  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  Object.assign(labelElement.style, {
    color: "#667085",
    fontWeight: "650",
  });

  const valueElement = document.createElement("span");
  valueElement.textContent = value;
  Object.assign(valueElement.style, {
    overflow: "hidden",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
    color: "#24324b",
  });

  row.append(labelElement, valueElement);
  return row;
}

function ruleLabel(status: PageTranslationStatus): string {
  const site = status.site;
  if (!site) return "generic";
  const dynamic = site.isHighDynamic ? `${site.dynamicMode}, high` : site.dynamicMode;
  const capability = `${site.ruleCapability}/${site.fallbackProfile}`;
  const merged = site.mergedRuleIds.length > 1 ? `, ${site.mergedRuleIds.join("+")}` : "";
  return `${site.siteKey} (${dynamic}, ${site.ruleSource}, ${capability}${merged})`;
}

function ruleShapeLabel(status: PageTranslationStatus): string {
  const diagnostics = status.site?.ruleDiagnostics;
  if (!diagnostics) return "roots 0, content 0, exclude 0";
  return [
    `roots ${diagnostics.scanRootSelectorCount}`,
    `content ${diagnostics.contentSelectorCount}`,
    `exclude ${diagnostics.excludeSelectorCount}`,
  ].join(", ");
}

function ruleFiltersLabel(status: PageTranslationStatus): string {
  const diagnostics = status.site?.ruleDiagnostics;
  if (!diagnostics) return "build 0, skip 0, css 0";
  return [
    `build ${diagnostics.buildContainerSelectorCount}`,
    `skip ${diagnostics.skipBuildContainerSelectorCount}`,
    `css ${diagnostics.injectedCssRuleCount}`,
    `attrs ${diagnostics.globalAttributeRuleCount}`,
    `page-attrs ${diagnostics.attributeNameCount}`,
    `classes ${diagnostics.translationClassCount}`,
    `container ${diagnostics.containerMinTextCount ?? "off"}`,
    `line ${diagnostics.lineBreakMaxTextCount ?? "off"}`,
  ].join(", ");
}

function ruleRuntimeLabel(status: PageTranslationStatus): string {
  const diagnostics = status.site?.ruleDiagnostics;
  if (!diagnostics) return "queue 0, flush 0, observed 0";
  return [
    `queue ${diagnostics.maxQueueSize}`,
    `flush ${diagnostics.maxRootsPerFlush}`,
    `observed ${diagnostics.maxObservedRoots}`,
    `mutation ${diagnostics.maxMutationNodesPerWindow}/${diagnostics.mutationWindowMs}ms`,
    `url ${diagnostics.observeUrlChange ? `${diagnostics.urlChangeDelay}ms` : "off"}`,
    `tooltip ${diagnostics.allowTooltip ? "on" : "off"}`,
    `viewport ${diagnostics.viewportSupplement ? diagnostics.viewportSupplementMaxRoots : "off"}`,
  ].join(", ");
}

function scanLabel(status: PageTranslationStatus): string {
  const text = status.diagnostics?.scan.text;
  const attributes = status.diagnostics?.scan.attributes;
  if (!text) return "0 / 0 / 0";
  const attributeLabel = attributes
    ? `; attr ${attributes.seen} / ${attributes.accepted} / ${attributes.skipped}${reasonSuffix(attributes.skippedByReason)}`
    : "";
  return `${text.seen} / ${text.accepted} / ${text.skipped}${reasonSuffix(text.skippedByReason)}${attributeLabel}`;
}

function candidateLabel(status: PageTranslationStatus): string {
  const candidates = status.diagnostics?.candidates;
  if (!candidates) return "0 / 0";
  const profileSummary = (Object.entries(candidates.acceptedByProfile) as Array<[string, number]>)
    .sort((left, right) => right[1] - left[1])
    .map(([profile, count]) => `${profile} ${count}`)
    .join(", ");
  return [`${candidates.evaluated} / ${candidates.accepted}`, profileSummary].filter(Boolean).join("; ");
}

function unitsLabel(status: PageTranslationStatus): string {
  const units = status.diagnostics?.units;
  if (!units) return "0 / 0";
  return `${units.built} / ${units.dropped}${reasonSuffix(units.droppedByReason)}`;
}

function cacheLabel(status: PageTranslationStatus): string {
  const cache = status.diagnostics?.cache;
  if (!cache) return "0 / 0";
  return `${cache.hits} / ${cache.misses}`;
}

function providerLabel(status: PageTranslationStatus): string {
  const provider = status.diagnostics?.provider;
  if (!provider) return "0 / 0";
  return `${provider.requested} / ${provider.failed} / ${provider.skipped}`;
}

function reasonSuffix(counts: Partial<Record<string, number>> | undefined): string {
  const label = topReasonsLabel(counts);
  return label ? ` (${label})` : "";
}

function topReasonsLabel(counts: Partial<Record<string, number>> | undefined): string {
  if (!counts) return "";
  return Object.entries(counts)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([reason, count]) => `${reason} ${count}`)
    .join(", ");
}

type RuleVisualizationSummary = {
  group: PageTranslationRuleVisualizationGroup;
  selectorCount: number;
  elementCount: number;
  selectors: RuleVisualizationSelectorSummary[];
};

type RuleVisualizationSelectorSummary = {
  group: PageTranslationRuleVisualizationGroup;
  selector: string;
  label?: string;
  elementCount: number;
};

class RuleVisualizer {
  private readonly markedElements = new Set<Element>();
  private styleElement: HTMLStyleElement | undefined;
  private legendElement: HTMLElement | undefined;
  private inspectorElement: HTMLElement | undefined;
  private readonly handleInspectClick = (event: MouseEvent): void => {
    const element = inspectableElementFromEvent(event);
    if (!element || isExtensionElement(element)) return;
    event.preventDefault();
    event.stopPropagation();
    this.showInspector(element, event.clientX, event.clientY);
  };

  show(status: PageTranslationStatus, textCandidates: readonly HTMLElement[] = []): void {
    this.hide();
    const selectors = status.site?.ruleDiagnostics?.visualizationSelectors ?? [];
    this.ensureStyle();
    document.addEventListener("click", this.handleInspectClick, true);

    const summaries = new Map<PageTranslationRuleVisualizationGroup, RuleVisualizationSummary>();
    for (const entry of selectors) {
      const summary = summaries.get(entry.group) ?? {
        group: entry.group,
        selectorCount: 0,
        elementCount: 0,
        selectors: [],
      };
      summary.selectorCount += 1;
      const matchedElements = queryRuleElements(entry.selector).filter((element) => !isExtensionElement(element));
      summary.selectors.push({
        group: entry.group,
        selector: entry.selector,
        ...(entry.label ? { label: entry.label } : {}),
        elementCount: matchedElements.length,
      });
      for (const element of matchedElements) {
        markElement(element, entry.group, ruleReasonLabel(entry.group, entry.selector, entry.label));
        this.markedElements.add(element);
        summary.elementCount += 1;
      }
      summaries.set(entry.group, summary);
    }
    const textSummary = summaries.get("text-candidate") ?? {
      group: "text-candidate" as const,
      selectorCount: 0,
      elementCount: 0,
      selectors: [],
    };
    for (const element of textCandidates) {
      if (isExtensionElement(element)) continue;
      markElement(element, "text-candidate", "text-candidate: actual translated root");
      this.markedElements.add(element);
      textSummary.elementCount += 1;
    }
    summaries.set("text-candidate", textSummary);

    this.legendElement = createRuleVisualizerLegend([...summaries.values()]);
    document.documentElement.append(this.legendElement);
  }

  hide(): void {
    document.removeEventListener("click", this.handleInspectClick, true);
    for (const element of this.markedElements) {
      element.removeAttribute("data-imt-rule-visualization");
      element.removeAttribute("data-imt-rule-visualization-reason");
    }
    this.markedElements.clear();
    this.legendElement?.remove();
    this.legendElement = undefined;
    this.inspectorElement?.remove();
    this.inspectorElement = undefined;
    this.styleElement?.remove();
    this.styleElement = undefined;
  }

  private showInspector(element: Element, clientX: number, clientY: number): void {
    this.inspectorElement?.remove();
    const inspector = document.createElement("aside");
    inspector.dataset.imtManaged = "true";
    inspector.dataset.imtRuleVisualizerInspector = "true";
    inspector.textContent = elementInspectionText(element);
    const left = Math.min(Math.max(clientX + 12, 12), Math.max(window.innerWidth - 320, 12));
    const top = Math.min(Math.max(clientY + 12, 12), Math.max(window.innerHeight - 120, 12));
    Object.assign(inspector.style, {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      zIndex: "2147483647",
      maxWidth: "300px",
      boxSizing: "border-box",
      padding: "8px 10px",
      borderRadius: "8px",
      border: "1px solid rgba(20, 33, 61, 0.16)",
      background: "rgba(255, 255, 255, 0.98)",
      color: "#14213d",
      boxShadow: "0 12px 32px rgba(20, 33, 61, 0.2)",
      font: "12px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflowWrap: "anywhere",
      pointerEvents: "none",
      whiteSpace: "normal",
    });
    document.documentElement.append(inspector);
    this.inspectorElement = inspector;
  }

  private ensureStyle(): void {
    if (this.styleElement) return;
    const style = document.createElement("style");
    style.dataset.imtManaged = "true";
    style.dataset.imtRuleVisualizerStyle = "true";
    style.textContent = `
[data-imt-rule-visualization~="scan-root"] { outline: 2px solid rgba(59, 130, 246, 0.88) !important; outline-offset: 2px !important; }
[data-imt-rule-visualization~="text-candidate"] { outline: 2px dashed rgba(14, 165, 233, 0.96) !important; outline-offset: 4px !important; }
[data-imt-rule-visualization~="content"] { outline: 2px solid rgba(16, 185, 129, 0.92) !important; outline-offset: 2px !important; }
[data-imt-rule-visualization~="build-container"] { box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.92) !important; }
[data-imt-rule-visualization~="skip-build-container"] { box-shadow: inset 0 0 0 2px rgba(100, 116, 139, 0.72) !important; }
[data-imt-rule-visualization~="dynamic-exclude"] { box-shadow: inset 0 0 0 2px rgba(168, 85, 247, 0.72) !important; }
[data-imt-rule-visualization~="exclude"] { outline: 2px solid rgba(239, 68, 68, 0.92) !important; outline-offset: 2px !important; }
`;
    (document.head || document.documentElement).append(style);
    this.styleElement = style;
  }
}

function queryRuleElements(selector: string): Element[] {
  const results: Element[] = [];
  const seenElements = new Set<Element>();
  const seenRoots = new Set<ParentNode>();

  const addResult = (element: Element): void => {
    if (seenElements.has(element)) return;
    seenElements.add(element);
    results.push(element);
  };

  const visit = (root: ParentNode): void => {
    if (seenRoots.has(root)) return;
    seenRoots.add(root);

    if (root instanceof Element && root.matches(selector)) addResult(root);
    root.querySelectorAll?.(selector).forEach(addResult);

    for (const element of elementsInRoot(root)) {
      if (element.shadowRoot) visit(element.shadowRoot);
    }
  };

  try {
    visit(document);
    return results;
  } catch {
    return [];
  }
}

function elementsInRoot(root: ParentNode): Element[] {
  const descendants = Array.from(root.querySelectorAll?.("*") ?? []);
  return root instanceof Element ? [root, ...descendants] : descendants;
}

function isExtensionElement(element: Element): boolean {
  return Boolean(element.closest('[data-imt-managed="true"]'));
}

function markElement(element: Element, group: PageTranslationRuleVisualizationGroup, reason: string): void {
  const groups = new Set((element.getAttribute("data-imt-rule-visualization") ?? "").split(/\s+/).filter(Boolean));
  const reasons = new Set((element.getAttribute("data-imt-rule-visualization-reason") ?? "").split(" | ").filter(Boolean));
  groups.add(group);
  reasons.add(reason);
  element.setAttribute("data-imt-rule-visualization", [...groups].join(" "));
  element.setAttribute("data-imt-rule-visualization-reason", [...reasons].join(" | "));
}

function ruleReasonLabel(group: PageTranslationRuleVisualizationGroup, selector: string, label: string | undefined): string {
  const labelSuffix = label ? `:${label}` : "";
  return `${group}${labelSuffix}: ${selector}`;
}

function inspectableElementFromEvent(event: MouseEvent): Element | undefined {
  const target = event.target;
  if (!(target instanceof Element) || isExtensionElement(target)) return undefined;
  const translatedRoot = target.closest("[data-imt-state='translated']");
  if (translatedRoot && !isExtensionElement(translatedRoot)) return translatedRoot;
  const visualizedRoot = visualizedElementFromEvent(event);
  if (visualizedRoot) return visualizedRoot;
  return target;
}

function visualizedElementFromEvent(event: MouseEvent): Element | undefined {
  for (const item of event.composedPath()) {
    if (item instanceof Element && item.hasAttribute("data-imt-rule-visualization")) return item;
  }
  const target = event.target;
  if (!(target instanceof Element)) return undefined;
  return target.closest("[data-imt-rule-visualization]") ?? undefined;
}

function elementInspectionText(element: Element): string {
  const translatedRoot = element.closest("[data-imt-state='translated']");
  const ruleReason = element.getAttribute("data-imt-rule-visualization-reason") ??
    element.closest("[data-imt-rule-visualization]")?.getAttribute("data-imt-rule-visualization-reason");
  const rows = [
    `状态: ${translatedRoot ? "已翻译" : "未翻译"}`,
    `元素: ${elementLabel(element)}`,
    `规则: ${ruleReason ?? "未命中规则 selector"}`,
  ];
  const textPreview = elementTextPreview(element);
  if (textPreview) rows.push(`文本: ${textPreview}`);
  return rows.join("\n");
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

function createRuleVisualizerLegend(summaries: RuleVisualizationSummary[]): HTMLElement {
  const legend = document.createElement("section");
  legend.dataset.imtManaged = "true";
  legend.dataset.imtRuleVisualizer = "true";
  Object.assign(legend.style, {
    position: "fixed",
    left: "12px",
    bottom: "12px",
    zIndex: "2147483645",
    width: "300px",
    maxWidth: "calc(100vw - 24px)",
    maxHeight: "48vh",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid rgba(20, 33, 61, 0.14)",
    borderRadius: "10px",
    background: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 18px 48px rgba(20, 33, 61, 0.18), 0 2px 8px rgba(20, 33, 61, 0.08)",
    backdropFilter: "blur(16px) saturate(1.12)",
    color: "#14213d",
    font: "12px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    letterSpacing: "0",
    overflowY: "auto",
  });

  const title = document.createElement("div");
  title.textContent = "规则可视化";
  Object.assign(title.style, {
    fontWeight: "750",
    marginBottom: "8px",
  });
  legend.append(title);

  const orderedSummaries = RULE_VISUALIZATION_GROUPS.map((group) =>
    summaries.find((summary) => summary.group === group) ?? {
      group,
      selectorCount: 0,
      elementCount: 0,
      selectors: [],
    },
  );
  for (const summary of orderedSummaries) {
    const row = document.createElement("div");
    row.textContent = `${summary.group} ${summary.elementCount} 元素 / ${summary.selectorCount} selector`;
    Object.assign(row.style, {
      display: "flex",
      gap: "6px",
      padding: "2px 0",
      color: RULE_VISUALIZATION_COLORS[summary.group],
    });
    legend.append(row);
    appendSelectorRows(legend, summary);
  }

  return legend;
}

function appendSelectorRows(legend: HTMLElement, summary: RuleVisualizationSummary): void {
  const selectorSummaries = summary.selectors.slice(0, 18);
  for (const selectorSummary of selectorSummaries) {
    const row = document.createElement("div");
    row.textContent = `${selectorSummaryLabel(selectorSummary)} ${selectorSummary.elementCount} · ${selectorSummary.selector}`;
    Object.assign(row.style, {
      marginLeft: "10px",
      padding: "1px 0 2px",
      color: RULE_VISUALIZATION_COLORS[summary.group],
      fontSize: "11px",
      opacity: selectorSummary.elementCount > 0 ? "0.82" : "0.58",
      overflowWrap: "anywhere",
      whiteSpace: "normal",
    });
    legend.append(row);
  }

  const hiddenCount = summary.selectors.length - selectorSummaries.length;
  if (hiddenCount <= 0) return;
  const row = document.createElement("div");
  row.textContent = `还有 ${hiddenCount} 条 selector 未展开`;
  Object.assign(row.style, {
    marginLeft: "10px",
    padding: "1px 0 2px",
    color: RULE_VISUALIZATION_COLORS[summary.group],
    fontSize: "11px",
    opacity: "0.6",
  });
  legend.append(row);
}

function selectorSummaryLabel(summary: RuleVisualizationSelectorSummary): string {
  return summary.label ? `${summary.group}:${summary.label}` : summary.group;
}

const RULE_VISUALIZATION_GROUPS: readonly PageTranslationRuleVisualizationGroup[] = [
  "scan-root",
  "text-candidate",
  "content",
  "exclude",
  "build-container",
  "skip-build-container",
  "dynamic-exclude",
];

const RULE_VISUALIZATION_COLORS: Record<PageTranslationRuleVisualizationGroup, string> = {
  "scan-root": "#2563eb",
  "text-candidate": "#0284c7",
  content: "#059669",
  exclude: "#dc2626",
  "build-container": "#d97706",
  "skip-build-container": "#64748b",
  "dynamic-exclude": "#9333ea",
};

declare global {
  interface Window {
    __OPENAI_IT_DEBUG__?: ContentDebugApi;
  }
}
