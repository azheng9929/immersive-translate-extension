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
      width: "280px",
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
      createRow("阶段", `${status.phase} / ${status.observation}`, "debug-overlay-phase"),
      createRow("Segments", `${status.translated}/${status.total} translated, failed ${status.failed}`, "debug-overlay-segments"),
      createRow("Queue", `${status.pendingRoots} pending, ${status.observedRoots} lazy`, "debug-overlay-queue"),
      createRow("Scan", scanLabel(status), "debug-overlay-scan"),
      createRow("Cache", cacheLabel(status), "debug-overlay-cache"),
      createRow("Provider", providerLabel(status), "debug-overlay-provider"),
      createRow("Dynamic", `${status.dynamicRuns} runs`, "debug-overlay-dynamic"),
    );
  }
}

export function installContentDebugApi(api: ContentDebugApi): void {
  window.__OPENAI_IT_DEBUG__ = api;
}

function createTitle(): HTMLElement {
  const title = document.createElement("div");
  title.textContent = "Immersive Debug";
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
    gridTemplateColumns: "72px 1fr",
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
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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

function scanLabel(status: PageTranslationStatus): string {
  const text = status.diagnostics?.scan.text;
  if (!text) return "0 / 0 / 0";
  return `${text.seen} / ${text.accepted} / ${text.skipped}`;
}

function cacheLabel(status: PageTranslationStatus): string {
  const cache = status.diagnostics?.cache;
  if (!cache) return "0 / 0";
  return `${cache.hits} / ${cache.misses}`;
}

function providerLabel(status: PageTranslationStatus): string {
  const provider = status.diagnostics?.provider;
  if (!provider) return "0 / 0";
  return `${provider.requested} / ${provider.failed}`;
}

declare global {
  interface Window {
    __OPENAI_IT_DEBUG__?: ContentDebugApi;
  }
}
