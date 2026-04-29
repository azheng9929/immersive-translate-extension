type SelectionState = "idle" | "loading" | "translated" | "copied" | "failed";

type SelectionTranslatorOptions = {
  translateText: (text: string) => Promise<string>;
  copyText?: (text: string) => Promise<void> | void;
  getSelectionText?: () => string;
  getSelectionRect?: () => DOMRect | null;
  document?: Document;
};

const STYLE_TEXT = `
.imt-selection-root {
  position: fixed;
  z-index: 2147483647;
  color: #162033;
  font-family: "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
}
.imt-selection-trigger {
  display: block;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  background: #1766d8;
  box-shadow: 0 8px 18px rgba(15, 42, 95, 0.18), 0 1px 4px rgba(15, 42, 95, 0.2);
  cursor: pointer;
}
.imt-selection-trigger:hover,
.imt-selection-trigger:focus-visible {
  background: #0f57bd;
  outline: 2px solid rgba(20, 168, 150, 0.24);
  outline-offset: 2px;
}
.imt-selection-panel {
  overflow: hidden;
  border: 1px solid rgba(22, 32, 51, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 18px 42px rgba(22, 32, 51, 0.18);
  backdrop-filter: blur(14px);
}
.imt-selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 6px 12px;
}
.imt-selection-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}
.imt-selection-status {
  color: #138b78;
  font-size: 11px;
  font-weight: 700;
}
.imt-selection-close {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #68758a;
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  line-height: 1;
}
.imt-selection-close:hover {
  background: #f1f5f9;
}
.imt-selection-source,
.imt-selection-result,
.imt-selection-error {
  margin: 0;
  padding: 0 12px;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.imt-selection-source {
  max-height: 72px;
  overflow: hidden;
  color: #5a6678;
}
.imt-selection-result {
  padding-top: 8px;
  color: #101828;
  font-weight: 550;
}
.imt-selection-error {
  padding-top: 8px;
  color: #b42318;
}
.imt-selection-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
}
.imt-selection-button {
  min-width: 70px;
  min-height: 32px;
  border: 1px solid rgba(22, 32, 51, 0.13);
  border-radius: 9px;
  background: #ffffff;
  color: #1d2b45;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.imt-selection-button:hover {
  background: #f5f9ff;
}
.imt-selection-button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.imt-selection-button-primary {
  border-color: transparent;
  color: #ffffff;
  background: linear-gradient(135deg, #1758db 0%, #14a896 100%);
}
.imt-selection-button-primary:hover {
  background: linear-gradient(135deg, #164fc3 0%, #129887 100%);
}
`;

export class SelectionTranslator {
  private readonly doc: Document;
  private parent: HTMLElement | undefined;
  private root: HTMLElement | undefined;
  private selectedText = "";
  private translatedText = "";
  private error = "";
  private state: SelectionState = "idle";
  private expanded = false;
  private selectionRect: DOMRect | null = null;
  private mounted = false;
  private requestId = 0;

  constructor(private readonly options: SelectionTranslatorOptions) {
    this.doc = options.document ?? document;
  }

  mount(parent: HTMLElement = this.doc.body): void {
    if (this.mounted) return;
    this.parent = parent;
    this.mounted = true;
    this.doc.addEventListener("mouseup", this.handleSelectionEvent);
    this.doc.addEventListener("keyup", this.handleKeyUp);
    this.doc.addEventListener("pointerdown", this.handlePointerDown, true);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.doc.removeEventListener("mouseup", this.handleSelectionEvent);
    this.doc.removeEventListener("keyup", this.handleKeyUp);
    this.doc.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.mounted = false;
    this.hide();
  }

  showCurrentSelection(): void {
    const text = normalizeSelectionText(this.options.getSelectionText?.() ?? this.doc.getSelection()?.toString() ?? "");
    const rect = this.options.getSelectionRect?.() ?? getCurrentSelectionRect(this.doc);

    if (!isValidSelectionText(text) || this.isSelectionInsideManagedUi()) {
      this.hide();
      return;
    }

    this.requestId += 1;
    this.selectedText = text;
    this.translatedText = "";
    this.error = "";
    this.state = "idle";
    this.expanded = false;
    this.selectionRect = rect;
    this.render();
  }

  hide(): void {
    this.requestId += 1;
    this.root?.remove();
    this.root = undefined;
    this.translatedText = "";
    this.error = "";
    this.state = "idle";
    this.expanded = false;
  }

  private readonly handleSelectionEvent = (event: MouseEvent): void => {
    const target = event.target;
    if (target instanceof Node && this.root?.contains(target)) return;
    this.doc.defaultView?.setTimeout(() => this.showCurrentSelection(), 0);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.hide();
      return;
    }
    this.doc.defaultView?.setTimeout(() => this.showCurrentSelection(), 0);
  };

  private readonly handlePointerDown = (event: Event): void => {
    const target = event.target;
    if (target instanceof Node && this.root?.contains(target)) return;
    if (this.root && !normalizeSelectionText(this.doc.getSelection()?.toString() ?? "")) this.hide();
  };

  private async translate(): Promise<void> {
    if (!this.selectedText || this.state === "loading") return;
    const requestId = ++this.requestId;
    this.state = "loading";
    this.error = "";
    this.render();

    try {
      const translatedText = await this.options.translateText(this.selectedText);
      if (requestId !== this.requestId || !this.expanded) return;
      this.translatedText = translatedText;
      this.state = "translated";
    } catch (error) {
      if (requestId !== this.requestId || !this.expanded) return;
      this.error = error instanceof Error ? error.message : String(error);
      this.state = "failed";
    }

    this.render();
  }

  private expandAndTranslate(): void {
    if (!this.selectedText) return;
    this.expanded = true;
    this.render();
    void this.translate();
  }

  private async copy(): Promise<void> {
    if (!this.translatedText) return;
    try {
      if (this.options.copyText) await this.options.copyText(this.translatedText);
      else await this.doc.defaultView?.navigator.clipboard?.writeText(this.translatedText);
      this.state = "copied";
      this.render();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.state = "failed";
      this.render();
    }
  }

  private render(): void {
    if (!this.parent) return;
    if (!this.root) {
      this.root = this.doc.createElement("section");
      this.root.className = "imt-selection-root";
      this.root.dataset.imtManaged = "true";
      this.root.dataset.imtSelection = "root";
      this.parent.append(this.root);
    }

    this.root.textContent = "";
    this.root.dataset.state = this.state;
    this.root.dataset.expanded = String(this.expanded);
    this.positionRoot();

    const style = this.doc.createElement("style");
    style.textContent = STYLE_TEXT;

    if (!this.expanded) {
      const trigger = this.doc.createElement("button");
      trigger.type = "button";
      trigger.className = "imt-selection-trigger";
      trigger.dataset.imtSelection = "trigger";
      trigger.setAttribute("aria-label", "翻译选中文本");
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.expandAndTranslate();
      });
      this.root.append(style, trigger);
      return;
    }

    const panel = this.doc.createElement("div");
    panel.className = "imt-selection-panel";

    const header = this.doc.createElement("div");
    header.className = "imt-selection-header";

    const title = this.doc.createElement("p");
    title.className = "imt-selection-title";
    title.textContent = "划词翻译";

    const status = this.doc.createElement("span");
    status.className = "imt-selection-status";
    status.dataset.imtSelectionStatus = "true";
    status.textContent = stateLabel(this.state);

    const closeButton = this.createButton("x", "close", "imt-selection-close", () => this.hide());
    closeButton.setAttribute("aria-label", "关闭划词翻译");

    header.append(title, status, closeButton);

    const source = this.doc.createElement("p");
    source.className = "imt-selection-source";
    source.dataset.imtSelection = "source";
    source.textContent = this.selectedText;

    const actions = this.doc.createElement("div");
    actions.className = "imt-selection-actions";

    if (this.state === "idle" || this.state === "failed") {
      const translateButton = this.createButton(
        this.state === "failed" ? "重试" : "翻译",
        "translate",
        "imt-selection-button imt-selection-button-primary",
        () => {
          void this.translate();
        },
      );
      actions.append(translateButton);
    }

    if (this.translatedText) {
      const copyButton = this.createButton("复制", "copy", "imt-selection-button", () => {
        void this.copy();
      });
      actions.append(copyButton);
    }

    panel.append(header, source);

    if (this.translatedText) {
      const result = this.doc.createElement("p");
      result.className = "imt-selection-result";
      result.dataset.imtSelection = "result";
      result.textContent = this.translatedText;
      panel.append(result);
    }

    if (this.error) {
      const error = this.doc.createElement("p");
      error.className = "imt-selection-error";
      error.dataset.imtSelection = "error";
      error.textContent = this.error;
      panel.append(error);
    }

    panel.append(actions);
    this.root.append(style, panel);
  }

  private positionRoot(): void {
    if (!this.root) return;
    const view = this.doc.defaultView;
    const viewportWidth = view?.innerWidth ?? 1024;
    const viewportHeight = view?.innerHeight ?? 768;
    const rect = this.selectionRect;

    if (!this.expanded) {
      const size = 22;
      const left = clamp(rect ? rect.right + 8 : 12, 8, Math.max(8, viewportWidth - size - 8));
      const top = clamp(rect ? rect.bottom - size / 2 : 80, 8, Math.max(8, viewportHeight - size - 8));
      this.root.style.width = `${size}px`;
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
      return;
    }

    const width = Math.min(320, Math.max(220, viewportWidth - 24));
    const left = clamp(rect ? rect.left : 12, 12, Math.max(12, viewportWidth - width - 12));
    const topCandidate = rect ? rect.bottom + 8 : 80;
    const top = clamp(topCandidate, 12, Math.max(12, viewportHeight - 180));

    this.root.style.width = `${width}px`;
    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
  }

  private createButton(label: string, action: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = this.doc.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.imtSelectionAction = action;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  private isSelectionInsideManagedUi(): boolean {
    const selection = this.doc.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const ancestor = selection.getRangeAt(0).commonAncestorContainer;
    const element = ancestor instanceof Element ? ancestor : ancestor.parentElement;
    return Boolean(element?.closest('[data-imt-managed="true"]'));
  }
}

function getCurrentSelectionRect(doc: Document): DOMRect | null {
  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) return rect;

  const firstClientRect = range.getClientRects()[0];
  return firstClientRect ?? null;
}

function normalizeSelectionText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isValidSelectionText(value: string): boolean {
  if (value.length < 2) return false;
  if (value.length > 4096) return false;
  if (/^[\d\s.,:%+-]+$/.test(value)) return false;
  return true;
}

function stateLabel(state: SelectionState): string {
  if (state === "loading") return "翻译中";
  if (state === "translated") return "已翻译";
  if (state === "copied") return "已复制";
  if (state === "failed") return "失败";
  return "就绪";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
