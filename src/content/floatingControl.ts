import type { TranslationPageSummary } from "./pageController";
import type { PageTranslationPhase, PageTranslationStatus } from "./pageTranslationSession";
import type { DiagnosticReasonCounts, TranslationDiagnostics } from "./translationDiagnostics";

type FloatingState = "idle" | "translating" | "translated" | "updating" | "partial" | "failed" | "paused" | "suspended";
type FloatingStatus = TranslationPageSummary | PageTranslationStatus;

type FloatingTranslationControlOptions = {
  translatePage: () => Promise<FloatingStatus>;
  restorePage: () => void;
  getStatus?: () => PageTranslationStatus;
  subscribeStatus?: (listener: (status: PageTranslationStatus) => void) => () => void;
};

const STYLE_TEXT = `
.imt-floating-root {
  --imt-accent: #1f7ae0;
  --imt-accent-2: #18a999;
  --imt-ink: #10243f;
  --imt-muted: #62708a;
  --imt-line: rgba(16, 36, 63, 0.12);
  --imt-surface: rgba(255, 255, 255, 0.94);
  --imt-state: #8ca0bd;
  --imt-state-soft: rgba(140, 160, 189, 0.12);
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 2147483646;
  display: grid;
  justify-items: end;
  color: #0f2a5f;
  font-family: "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
  pointer-events: none;
}
.imt-floating-root,
.imt-floating-root * {
  box-sizing: border-box;
}
.imt-floating-root[data-state="translating"] {
  --imt-state: #f0a11a;
  --imt-state-soft: rgba(240, 161, 26, 0.14);
}
.imt-floating-root[data-state="updating"] {
  --imt-state: #1f7ae0;
  --imt-state-soft: rgba(31, 122, 224, 0.13);
}
.imt-floating-root[data-state="translated"] {
  --imt-state: #18a999;
  --imt-state-soft: rgba(24, 169, 153, 0.14);
}
.imt-floating-root[data-state="partial"] {
  --imt-state: #e68a00;
  --imt-state-soft: rgba(230, 138, 0, 0.14);
}
.imt-floating-root[data-state="failed"],
.imt-floating-root[data-state="suspended"] {
  --imt-state: #d83b45;
  --imt-state-soft: rgba(216, 59, 69, 0.14);
}
.imt-floating-root[data-state="paused"] {
  --imt-state: #7b8798;
  --imt-state-soft: rgba(123, 135, 152, 0.14);
}
.imt-floating-ball {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 64px;
  margin-right: 0;
  border: 1px solid rgba(16, 36, 63, 0.14);
  border-right: 0;
  border-radius: 17px 0 0 17px;
  color: var(--imt-ink);
  background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,248,252,0.9) 100%);
  box-shadow: 0 16px 34px rgba(16, 36, 63, 0.14), 0 2px 8px rgba(16, 36, 63, 0.1);
  backdrop-filter: blur(16px) saturate(1.18);
  cursor: pointer;
  overflow: hidden;
  pointer-events: auto;
  transition: transform 180ms ease, width 180ms ease, opacity 180ms ease, box-shadow 180ms ease;
}
.imt-floating-ball::before {
  content: "";
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 999px;
  background: var(--imt-state);
}
.imt-floating-logo {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--imt-accent) 0%, var(--imt-accent-2) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 7px 16px rgba(31, 122, 224, 0.26);
  transition: transform 180ms ease, opacity 180ms ease;
}
.imt-floating-grip {
  position: absolute;
  left: 6px;
  top: 50%;
  width: 3px;
  height: 22px;
  border-radius: 999px;
  background: rgba(16, 36, 63, 0.16);
  transform: translateY(-50%);
}
.imt-floating-grip::before,
.imt-floating-grip::after {
  content: "";
  position: absolute;
  left: 0;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(16, 36, 63, 0.22);
}
.imt-floating-grip::before {
  top: -7px;
}
.imt-floating-grip::after {
  bottom: -7px;
}
.imt-floating-logo svg {
  width: 18px;
  height: 18px;
  display: block;
}
.imt-floating-ball:hover {
  transform: translateX(-4px);
  box-shadow: 0 22px 48px rgba(16, 36, 63, 0.22), 0 4px 10px rgba(16, 36, 63, 0.13);
}
.imt-floating-root[data-collapsed="true"] .imt-floating-ball {
  width: 20px;
  height: 60px;
  margin-right: 0;
  opacity: 0.7;
  box-shadow: 0 10px 24px rgba(16, 36, 63, 0.14);
}
.imt-floating-root[data-collapsed="true"] .imt-floating-logo {
  opacity: 0;
  transform: translateX(12px) scale(0.9);
}
.imt-floating-root[data-collapsed="true"] .imt-floating-ball:hover {
  transform: translateX(-5px);
  opacity: 0.96;
}
.imt-floating-dot {
  position: absolute;
  right: 7px;
  bottom: 10px;
  width: 8px;
  height: 8px;
  border: 1.5px solid #ffffff;
  border-radius: 999px;
  background: var(--imt-state);
  box-shadow: 0 0 0 3px var(--imt-state-soft);
}
.imt-floating-panel {
  position: absolute;
  top: 50%;
  right: 58px;
  transform: translateY(-50%);
  width: 296px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 0;
  border: 1px solid rgba(16, 36, 63, 0.12);
  border-radius: 16px;
  background: var(--imt-surface);
  box-shadow: 0 24px 62px rgba(16, 36, 63, 0.2), 0 6px 18px rgba(16, 36, 63, 0.12);
  backdrop-filter: blur(18px) saturate(1.15);
  animation: imt-panel-in 160ms ease-out;
  pointer-events: auto;
}
.imt-floating-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 10px;
}
.imt-floating-brand {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.imt-floating-panel-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--imt-accent) 0%, var(--imt-accent-2) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 18px rgba(31, 122, 224, 0.22);
}
.imt-floating-panel-mark svg {
  width: 19px;
  height: 19px;
  display: block;
}
.imt-floating-title {
  margin: 0;
  color: var(--imt-ink);
  font-size: 13px;
  font-weight: 760;
  line-height: 1.2;
}
.imt-floating-subtitle {
  margin: 3px 0 0;
  color: var(--imt-muted);
  font-size: 11px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.imt-floating-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--imt-state-soft);
  color: var(--imt-state);
  font-size: 12px;
  font-weight: 700;
}
.imt-floating-panel-controls {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.imt-floating-icon-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(16, 36, 63, 0.1);
  border-radius: 8px;
  color: #52627a;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  font: inherit;
}
.imt-floating-icon-button:hover {
  color: var(--imt-ink);
  background: #f5f9ff;
  border-color: rgba(31, 122, 224, 0.22);
}
.imt-floating-icon-button svg {
  width: 15px;
  height: 15px;
  display: block;
}
.imt-floating-summary {
  margin: 0;
  padding: 0 14px 10px;
  color: var(--imt-muted);
  font-size: 12px;
  line-height: 1.4;
}
.imt-floating-progress {
  position: relative;
  height: 5px;
  margin: 0 14px 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(16, 36, 63, 0.08);
}
.imt-floating-progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--imt-accent) 0%, var(--imt-state) 100%);
  transition: width 220ms ease;
}
.imt-floating-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 0 14px 12px;
}
.imt-floating-metric {
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid rgba(16, 36, 63, 0.08);
  border-radius: 9px;
  background: rgba(244, 248, 252, 0.72);
  color: var(--imt-muted);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.imt-floating-metric strong {
  color: var(--imt-ink);
  font-weight: 760;
}
.imt-floating-diagnostics {
  margin: 0 14px 12px;
  padding: 8px;
  border-radius: 8px;
  color: var(--imt-muted);
  background: #f4f7fb;
  font-size: 11px;
  line-height: 1.35;
}
.imt-floating-details {
  display: grid;
  gap: 5px;
  margin: 0 14px 12px;
  padding: 8px;
  border: 1px solid rgba(16, 36, 63, 0.1);
  border-radius: 8px;
  background: #ffffff;
  color: var(--imt-muted);
  font-size: 11px;
  line-height: 1.35;
}
.imt-floating-detail-row {
  margin: 0;
}
.imt-floating-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(16, 36, 63, 0.08);
  background: rgba(248, 251, 253, 0.8);
}
.imt-floating-button {
  min-height: 34px;
  border: 1px solid rgba(16, 36, 63, 0.12);
  border-radius: 9px;
  background: #ffffff;
  color: var(--imt-ink);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
}
.imt-floating-button:hover {
  background: #f5f9ff;
  border-color: rgba(31, 122, 224, 0.24);
}
.imt-floating-button:disabled {
  cursor: wait;
  opacity: 0.62;
}
.imt-floating-button-primary {
  border-color: transparent;
  color: #ffffff;
  background: linear-gradient(135deg, var(--imt-accent) 0%, var(--imt-accent-2) 100%);
  box-shadow: 0 8px 18px rgba(31, 122, 224, 0.18);
}
.imt-floating-button-primary:hover {
  background: linear-gradient(135deg, #176bd0 0%, #149886 100%);
}
.imt-floating-button-subtle {
  grid-column: span 2;
  min-height: 30px;
  border-color: transparent;
  background: transparent;
  color: #62708a;
}
.imt-floating-button-subtle:hover {
  background: #f4f7fb;
}
@keyframes imt-panel-in {
  from {
    opacity: 0;
    transform: translate(8px, -50%) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate(0, -50%) scale(1);
  }
}
@media (max-height: 520px) {
  .imt-floating-panel {
    top: auto;
    bottom: -22px;
    transform: none;
  }
}
`;

export class FloatingTranslationControl {
  private root: HTMLElement | undefined;
  private expanded = false;
  private collapsed = false;
  private state: FloatingState = "idle";
  private summary: FloatingStatus | undefined;
  private error: string | undefined;
  private detailsExpanded = false;
  private unsubscribeStatus: (() => void) | undefined;

  constructor(private readonly options: FloatingTranslationControlOptions) {}

  mount(parent: HTMLElement = document.body): void {
    if (this.root) return;
    this.root = document.createElement("section");
    this.root.className = "imt-floating-root";
    this.root.dataset.imtManaged = "true";
    this.root.dataset.imtControl = "root";
    parent.append(this.root);
    const status = this.options.getStatus?.();
    if (status) this.applyStatus(status);
    this.unsubscribeStatus = this.options.subscribeStatus?.((nextStatus) => this.applyStatus(nextStatus));
    this.render();
  }

  async translate(): Promise<void> {
    if (!this.root || this.state === "translating" || this.state === "updating") return;
    this.state = "translating";
    this.error = undefined;
    this.render();

    try {
      const summary = await this.options.translatePage();
      this.applyStatus(summary);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.state = "failed";
    }

    this.render();
  }

  restore(): void {
    this.options.restorePage();
    this.state = "idle";
    this.summary = undefined;
    this.error = undefined;
    this.detailsExpanded = false;
    this.render();
  }

  hide(): void {
    this.unsubscribeStatus?.();
    this.unsubscribeStatus = undefined;
    this.root?.remove();
    this.root = undefined;
  }

  private toggleExpanded(): void {
    if (this.collapsed) {
      this.collapsed = false;
      this.expanded = true;
      this.render();
      return;
    }
    this.expanded = !this.expanded;
    this.render();
  }

  private collapseToEdge(): void {
    this.collapsed = true;
    this.expanded = false;
    this.render();
  }

  private render(): void {
    if (!this.root) return;
    this.root.textContent = "";
    this.root.dataset.state = this.state;
    this.root.dataset.imtDock = "right-center";
    this.root.dataset.imtSurface = "edge-tray";
    this.root.dataset.collapsed = String(this.collapsed);

    const style = document.createElement("style");
    style.textContent = STYLE_TEXT;

    const ball = document.createElement("button");
    ball.type = "button";
    ball.className = "imt-floating-ball";
    ball.dataset.imtControl = "ball";
    ball.setAttribute("aria-label", this.collapsed ? "Show translation controls" : this.expanded ? "Close translation controls" : "Open translation controls");
    ball.setAttribute("aria-expanded", String(this.expanded && !this.collapsed));
    const grip = document.createElement("span");
    grip.className = "imt-floating-grip";
    grip.dataset.imtControl = "handle-grip";
    grip.setAttribute("aria-hidden", "true");
    ball.append(grip);

    const logo = document.createElement("span");
    logo.className = "imt-floating-logo";
    logo.dataset.imtControl = "logo";
    logo.append(createTranslateIcon());
    ball.append(logo);
    ball.addEventListener("click", () => this.toggleExpanded());

    const dot = document.createElement("span");
    dot.className = "imt-floating-dot";
    dot.setAttribute("aria-hidden", "true");
    ball.append(dot);

    this.root.append(style);
    if (this.expanded && !this.collapsed) this.root.append(this.createPanel());
    this.root.append(ball);
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "imt-floating-panel";
    panel.dataset.imtControl = "panel";

    const header = document.createElement("div");
    header.className = "imt-floating-header";

    const brand = document.createElement("div");
    brand.className = "imt-floating-brand";

    const panelMark = document.createElement("span");
    panelMark.className = "imt-floating-panel-mark";
    panelMark.dataset.imtControl = "panel-logo";
    panelMark.append(createTranslateIcon());

    const titleBlock = document.createElement("div");

    const title = document.createElement("p");
    title.className = "imt-floating-title";
    title.dataset.imtControl = "panel-title";
    title.textContent = "Page translator";

    const subtitle = document.createElement("p");
    subtitle.className = "imt-floating-subtitle";
    subtitle.textContent = statusSubtitle(this.summary);

    titleBlock.append(title, subtitle);
    brand.append(panelMark, titleBlock);

    const status = document.createElement("span");
    status.className = "imt-floating-status";
    status.dataset.imtControl = "status";
    status.textContent = statusLabel(this.state);

    const panelControls = document.createElement("div");
    panelControls.className = "imt-floating-panel-controls";
    panelControls.dataset.imtControl = "panel-controls";
    panelControls.append(
      this.createIconButton("Minimize controls", "collapse", "minus", () => this.collapseToEdge()),
      this.createIconButton("Hide on this page", "hide", "x", () => this.hide()),
    );

    header.append(brand, status, panelControls);

    const summary = document.createElement("p");
    summary.className = "imt-floating-summary";
    summary.dataset.imtControl = "summary";
    summary.textContent = this.error ? userFacingError(this.error) : summaryLabel(this.summary);

    const progressValue = progressPercent(this.summary);
    const progress = document.createElement("div");
    progress.className = "imt-floating-progress";
    progress.dataset.imtControl = "progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", String(progressValue));

    const progressBar = document.createElement("span");
    progressBar.className = "imt-floating-progress-bar";
    progressBar.style.width = `${progressValue}%`;
    progress.append(progressBar);

    const metrics = document.createElement("div");
    metrics.className = "imt-floating-metrics";
    const metricValues = statusMetrics(this.summary);
    metrics.append(
      createMetric("translated", metricValues.translated, "translated"),
      createMetric("failed", metricValues.failed, "failed"),
      createMetric("pending", metricValues.pending, "pending"),
    );

    const actions = document.createElement("div");
    actions.className = "imt-floating-actions";

    const translateButton = this.createButton("Translate", "translate", "imt-floating-button imt-floating-button-primary", () => {
      void this.translate();
    });
    translateButton.disabled = this.state === "translating" || this.state === "updating";

    const restoreButton = this.createButton("Restore", "restore", "imt-floating-button", () => this.restore());

    actions.append(translateButton, restoreButton);
    panel.append(header, summary, progress, metrics);
    const diagnostics = diagnosticsLabel(this.summary);
    if (diagnostics) {
      const diagnosticsNode = document.createElement("p");
      diagnosticsNode.className = "imt-floating-diagnostics";
      diagnosticsNode.dataset.imtControl = "diagnostics";
      diagnosticsNode.textContent = diagnostics;
      panel.append(diagnosticsNode);

      const detailsButton = this.createButton(
        this.detailsExpanded ? "Hide details" : "Details",
        "toggle-debug-details",
        "imt-floating-button imt-floating-button-subtle",
        () => this.toggleDetails(),
      );
      actions.append(detailsButton);
    }
    const detailRows = detailedDiagnosticsLabels(this.summary);
    if (this.detailsExpanded && detailRows.length > 0) {
      const details = document.createElement("div");
      details.className = "imt-floating-details";
      details.dataset.imtControl = "diagnostics-details";
      for (const rowText of detailRows) {
        const row = document.createElement("p");
        row.className = "imt-floating-detail-row";
        row.textContent = rowText;
        details.append(row);
      }
      panel.append(details);
    }
    panel.append(actions);
    return panel;
  }

  private createButton(label: string, action: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.imtAction = action;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  private createIconButton(label: string, action: string, icon: "minus" | "x", onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "imt-floating-icon-button";
    button.dataset.imtAction = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.append(createPanelActionIcon(icon));
    button.addEventListener("click", onClick);
    return button;
  }

  private applyStatus(status: FloatingStatus): void {
    this.summary = status;
    this.error = "lastError" in status ? status.lastError : undefined;
    this.state = "phase" in status ? floatingStateFromStatus(status) : stateFromSummary(status);
    this.render();
  }

  private toggleDetails(): void {
    this.detailsExpanded = !this.detailsExpanded;
    this.render();
  }
}

function createTranslateIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");

  const source = document.createElementNS("http://www.w3.org/2000/svg", "path");
  source.setAttribute(
    "d",
    "M4 4.75h7.8M7.9 3v1.75M6 8.2c.85 1.55 2.05 2.95 3.55 4.05M10.9 6.75c-.72 2.05-2.15 4-4.45 5.92",
  );
  source.setAttribute("stroke", "currentColor");
  source.setAttribute("stroke-width", "1.8");
  source.setAttribute("stroke-linecap", "round");
  source.setAttribute("stroke-linejoin", "round");

  const target = document.createElementNS("http://www.w3.org/2000/svg", "path");
  target.setAttribute("d", "M13.25 20l1.05-2.65h4.25L19.6 20M15.05 15.45l1.38-3.45 1.38 3.45");
  target.setAttribute("stroke", "currentColor");
  target.setAttribute("stroke-width", "1.8");
  target.setAttribute("stroke-linecap", "round");
  target.setAttribute("stroke-linejoin", "round");

  const frame = document.createElementNS("http://www.w3.org/2000/svg", "path");
  frame.setAttribute("d", "M5 15.4v1.1A2.5 2.5 0 0 0 7.5 19H10M19 8.6V7.5A2.5 2.5 0 0 0 16.5 5H14");
  frame.setAttribute("stroke", "currentColor");
  frame.setAttribute("stroke-width", "1.8");
  frame.setAttribute("stroke-linecap", "round");

  svg.append(source, target, frame);
  return svg;
}

function createPanelActionIcon(icon: "minus" | "x"): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", icon === "minus" ? "M6 12h12" : "M7 7l10 10M17 7L7 17");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

function createMetric(kind: "translated" | "failed" | "pending", value: number, label: string): HTMLElement {
  const metric = document.createElement("span");
  metric.className = "imt-floating-metric";
  metric.dataset.imtControl = `metric-${kind}`;

  const strong = document.createElement("strong");
  strong.textContent = String(value);

  metric.append(strong, ` ${label}`);
  return metric;
}

function statusMetrics(summary: FloatingStatus | undefined): { translated: number; failed: number; pending: number } {
  if (!summary) return { translated: 0, failed: 0, pending: 0 };
  return {
    translated: summary.translated,
    failed: summary.failed,
    pending: "pendingRoots" in summary ? summary.pendingRoots : 0,
  };
}

function progressPercent(summary: FloatingStatus | undefined): number {
  if (!summary || summary.total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((summary.translated / summary.total) * 100)));
}

function statusSubtitle(summary: FloatingStatus | undefined): string {
  if (!summary) return "Quiet controls for this page";
  if ("observation" in summary) return `New content ${summary.observation}`;
  return "Page translation report";
}

function floatingStateFromStatus(status: PageTranslationStatus): FloatingState {
  if (status.observation === "suspended") return "suspended";
  if (status.observation === "paused") return "paused";
  return floatingStateFromPhase(status.phase);
}

function floatingStateFromPhase(phase: PageTranslationPhase): FloatingState {
  if (phase === "translating") return "translating";
  if (phase === "updating") return "updating";
  if (phase === "translated") return "translated";
  if (phase === "partial") return "partial";
  if (phase === "failed") return "failed";
  return "idle";
}

function stateFromSummary(summary: TranslationPageSummary): FloatingState {
  if (summary.total === 0) return "translated";
  if (summary.failed > 0 || summary.skipped > 0) return summary.translated > 0 ? "partial" : "failed";
  return "translated";
}

function statusLabel(state: FloatingState): string {
  if (state === "translating") return "Translating";
  if (state === "updating") return "Updating";
  if (state === "translated") return "Translated";
  if (state === "partial") return "Partial";
  if (state === "failed") return "Failed";
  if (state === "paused") return "Paused";
  if (state === "suspended") return "Suspended";
  return "Ready";
}

function summaryLabel(summary: FloatingStatus | undefined): string {
  if (!summary) return "No page translation yet";
  if (summary.total === 0) return "No translatable text found";

  const parts = [`${summary.translated} / ${summary.total} translated`];
  if (summary.failed > 0) parts.push(`${summary.failed} failed`);
  if (summary.skipped > 0) parts.push(`${summary.skipped} skipped`);
  if ("dynamicRuns" in summary && summary.dynamicRuns > 0) {
    parts.push(`${summary.dynamicRuns} new content ${summary.dynamicRuns === 1 ? "update" : "updates"}`);
  }
  if ("observation" in summary && summary.observation === "paused") {
    parts.push("new content paused");
  }
  if ("observation" in summary && summary.observation === "suspended") {
    parts.push("new content suspended");
  }
  return parts.join(", ");
}

function userFacingError(error: string): string {
  if (error.startsWith("Dynamic translation paused because")) {
    return error.replace("Dynamic translation", "New content");
  }
  return error;
}

function diagnosticsLabel(summary: FloatingStatus | undefined): string {
  if (!summary || !("diagnostics" in summary) || !summary.diagnostics) return "";

  const skipped = collectSkippedReasons(summary.diagnostics);
  if (skipped.size === 0) return "";

  const parts = [...skipped.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([label, count]) => `${count} ${label}`);

  return `Skipped: ${parts.join(", ")}`;
}

function detailedDiagnosticsLabels(summary: FloatingStatus | undefined): string[] {
  if (!summary || !("diagnostics" in summary) || !summary.diagnostics) return [];
  const diagnostics = summary.diagnostics;
  const rows = [
    `Text scan ${diagnostics.scan.text.seen} seen, ${diagnostics.scan.text.accepted} accepted, ${diagnostics.scan.text.skipped} skipped`,
    `Attributes ${diagnostics.scan.attributes.seen} seen, ${diagnostics.scan.attributes.accepted} accepted, ${diagnostics.scan.attributes.skipped} skipped`,
    `Units ${diagnostics.units.built} built, ${diagnostics.units.dropped} dropped`,
    `Cache ${diagnostics.cache.hits} ${plural("hit", diagnostics.cache.hits)}, ${diagnostics.cache.misses} ${plural("miss", diagnostics.cache.misses)}`,
    `Provider ${diagnostics.provider.requested} requested, ${diagnostics.provider.failed} failed, ${diagnostics.provider.skipped} skipped`,
  ];

  if ("observation" in summary) {
    rows.unshift(`New content ${summary.observation}, ${summary.pendingRoots} pending, ${summary.observedRoots} lazy`);
  }

  const skipped = diagnosticsLabel(summary);
  if (skipped) rows.push(skipped);
  return rows;
}

function collectSkippedReasons(diagnostics: TranslationDiagnostics): Map<string, number> {
  const counts = new Map<string, number>();
  addReasonCounts(counts, diagnostics.scan.text.skippedByReason);
  addReasonCounts(counts, diagnostics.scan.attributes.skippedByReason);
  addReasonCounts(counts, diagnostics.units.droppedByReason);
  return counts;
}

function addReasonCounts(target: Map<string, number>, reasons: DiagnosticReasonCounts): void {
  for (const [reason, count] of Object.entries(reasons)) {
    if (!count) continue;
    const label = reasonLabel(reason);
    target.set(label, (target.get(label) ?? 0) + count);
  }
}

function reasonLabel(reason: string): string {
  if (reason === "target-language") return "target language";
  if (reason === "global-selector" || reason === "site-selector") return "extension/site UI";
  if (reason === "global-text" || reason === "site-text" || reason === "site-phrase") return "metadata/control text";
  if (reason === "not-meaningful") return "short text";
  if (reason === "hidden") return "hidden text";
  if (reason === "empty") return "empty text";
  return reason.replaceAll("-", " ");
}

function plural(label: string, count: number): string {
  return count === 1 ? label : `${label}s`;
}
