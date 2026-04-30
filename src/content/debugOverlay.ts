import type { ExtensionConfig } from "../shared/config";
import type { PageTranslationSiteStatus, PageTranslationStatus } from "./pageTranslationSession";

type DebugOverlayOptions = {
  getStatus: () => PageTranslationStatus;
  subscribeStatus: (listener: (status: PageTranslationStatus) => void) => () => void;
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
      width: "360px",
      maxWidth: "calc(100vw - 24px)",
      boxSizing: "border-box",
      padding: "10px",
      border: "1px solid rgba(15, 23, 42, 0.16)",
      borderRadius: "8px",
      color: "#0f172a",
      background: "rgba(255, 255, 255, 0.96)",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
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
    this.root?.remove();
    this.root = undefined;
  }

  private render(status: PageTranslationStatus): void {
    if (!this.root) return;
    this.root.replaceChildren(
      createTitle(),
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
  }
}

export function installContentDebugApi(api: ContentDebugApi): void {
  window.__OPENAI_IT_DEBUG__ = api;
}

function createTitle(): HTMLElement {
  const title = document.createElement("div");
  title.textContent = "翻译调试";
  Object.assign(title.style, {
    marginBottom: "6px",
    fontWeight: "700",
  });
  return title;
}

function createRow(label: string, value: string, testId: string): HTMLElement {
  const row = document.createElement("div");
  row.dataset.testid = testId;
  Object.assign(row.style, {
    display: "grid",
    gridTemplateColumns: "76px minmax(0, 1fr)",
    gap: "8px",
    padding: "2px 0",
  });

  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  Object.assign(labelElement.style, {
    color: "#64748b",
    fontWeight: "650",
  });

  const valueElement = document.createElement("span");
  valueElement.textContent = value;
  Object.assign(valueElement.style, {
    overflow: "hidden",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
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

declare global {
  interface Window {
    __OPENAI_IT_DEBUG__?: ContentDebugApi;
  }
}
