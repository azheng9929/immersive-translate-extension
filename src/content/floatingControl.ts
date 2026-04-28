import type { TranslationPageSummary } from "./pageController";
import type { PageTranslationPhase, PageTranslationStatus } from "./pageTranslationSession";

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
  position: fixed;
  right: 20px;
  bottom: 22px;
  z-index: 2147483646;
  color: #0f2a5f;
  font-family: "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
}
.imt-floating-ball {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255,255,255,0.72);
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, #1758db 0%, #12b8a5 100%);
  box-shadow: 0 12px 32px rgba(15, 42, 95, 0.22), 0 3px 10px rgba(15, 42, 95, 0.18);
  cursor: pointer;
  font-size: 17px;
  font-weight: 700;
}
.imt-floating-ball:hover {
  transform: translateY(-1px);
}
.imt-floating-dot {
  position: absolute;
  right: 2px;
  bottom: 3px;
  width: 10px;
  height: 10px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #8ca0bd;
}
.imt-floating-root[data-state="translating"] .imt-floating-dot {
  background: #f6b840;
}
.imt-floating-root[data-state="updating"] .imt-floating-dot {
  background: #38bdf8;
}
.imt-floating-root[data-state="translated"] .imt-floating-dot {
  background: #12b8a5;
}
.imt-floating-root[data-state="partial"],
.imt-floating-root[data-state="failed"] {
  color: #1f2937;
}
.imt-floating-root[data-state="partial"] .imt-floating-dot {
  background: #f59e0b;
}
.imt-floating-root[data-state="failed"] .imt-floating-dot {
  background: #ef4444;
}
.imt-floating-root[data-state="paused"] .imt-floating-dot {
  background: #94a3b8;
}
.imt-floating-root[data-state="suspended"] .imt-floating-dot {
  background: #ef4444;
}
.imt-floating-panel {
  position: absolute;
  right: 0;
  bottom: 54px;
  width: 248px;
  padding: 12px;
  border: 1px solid rgba(15, 42, 95, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 44px rgba(15, 42, 95, 0.18);
  backdrop-filter: blur(14px);
}
.imt-floating-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.imt-floating-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}
.imt-floating-status {
  font-size: 12px;
  font-weight: 650;
  color: #119985;
}
.imt-floating-summary {
  margin: 0 0 12px;
  color: #52627a;
  font-size: 12px;
  line-height: 1.4;
}
.imt-floating-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.imt-floating-button {
  min-height: 34px;
  border: 1px solid rgba(15, 42, 95, 0.14);
  border-radius: 9px;
  background: #ffffff;
  color: #102a5f;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
}
.imt-floating-button:hover {
  background: #f5f9ff;
}
.imt-floating-button:disabled {
  cursor: wait;
  opacity: 0.62;
}
.imt-floating-button-primary {
  border-color: transparent;
  color: #ffffff;
  background: linear-gradient(135deg, #1758db 0%, #14a896 100%);
}
.imt-floating-button-primary:hover {
  background: linear-gradient(135deg, #164fc3 0%, #129887 100%);
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
`;

export class FloatingTranslationControl {
  private root: HTMLElement | undefined;
  private expanded = false;
  private state: FloatingState = "idle";
  private summary: FloatingStatus | undefined;
  private error: string | undefined;
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
    this.render();
  }

  hide(): void {
    this.unsubscribeStatus?.();
    this.unsubscribeStatus = undefined;
    this.root?.remove();
    this.root = undefined;
  }

  private toggleExpanded(): void {
    this.expanded = !this.expanded;
    this.render();
  }

  private render(): void {
    if (!this.root) return;
    this.root.textContent = "";
    this.root.dataset.state = this.state;

    const style = document.createElement("style");
    style.textContent = STYLE_TEXT;

    const ball = document.createElement("button");
    ball.type = "button";
    ball.className = "imt-floating-ball";
    ball.dataset.imtControl = "ball";
    ball.setAttribute("aria-label", this.expanded ? "Close translation controls" : "Open translation controls");
    ball.setAttribute("aria-expanded", String(this.expanded));
    ball.textContent = "A";
    ball.addEventListener("click", () => this.toggleExpanded());

    const dot = document.createElement("span");
    dot.className = "imt-floating-dot";
    dot.setAttribute("aria-hidden", "true");
    ball.append(dot);

    this.root.append(style);
    if (this.expanded) this.root.append(this.createPanel());
    this.root.append(ball);
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "imt-floating-panel";
    panel.dataset.imtControl = "panel";

    const header = document.createElement("div");
    header.className = "imt-floating-header";

    const title = document.createElement("p");
    title.className = "imt-floating-title";
    title.textContent = "Page translation";

    const status = document.createElement("span");
    status.className = "imt-floating-status";
    status.dataset.imtControl = "status";
    status.textContent = statusLabel(this.state);

    header.append(title, status);

    const summary = document.createElement("p");
    summary.className = "imt-floating-summary";
    summary.dataset.imtControl = "summary";
    summary.textContent = this.error ?? summaryLabel(this.summary);

    const actions = document.createElement("div");
    actions.className = "imt-floating-actions";

    const translateButton = this.createButton("Translate", "translate", "imt-floating-button imt-floating-button-primary", () => {
      void this.translate();
    });
    translateButton.disabled = this.state === "translating" || this.state === "updating";

    const restoreButton = this.createButton("Restore", "restore", "imt-floating-button", () => this.restore());
    const hideButton = this.createButton("Hide on this page", "hide", "imt-floating-button imt-floating-button-subtle", () => this.hide());

    actions.append(translateButton, restoreButton, hideButton);
    panel.append(header, summary, actions);
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

  private applyStatus(status: FloatingStatus): void {
    this.summary = status;
    this.error = "lastError" in status ? status.lastError : undefined;
    this.state = "phase" in status ? floatingStateFromStatus(status) : stateFromSummary(status);
    this.render();
  }
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
    parts.push(`${summary.dynamicRuns} dynamic ${summary.dynamicRuns === 1 ? "update" : "updates"}`);
  }
  if ("observation" in summary && summary.observation === "paused") {
    parts.push("dynamic updates paused");
  }
  if ("observation" in summary && summary.observation === "suspended") {
    parts.push("dynamic updates suspended");
  }
  return parts.join(", ");
}
