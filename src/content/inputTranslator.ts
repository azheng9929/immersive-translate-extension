type InputTranslatorState = "idle" | "loading" | "translated" | "copied" | "replaced" | "failed";

type EditableTarget = HTMLInputElement | HTMLTextAreaElement;

type InputTranslatorOptions = {
  translateText: (text: string) => Promise<string>;
  copyText?: (text: string) => Promise<void> | void;
  document?: Document;
};

const TEXT_INPUT_TYPES = new Set([
  "",
  "search",
  "text",
]);

const STYLE_TEXT = `
.imt-input-root {
  position: fixed;
  z-index: 2147483647;
  width: min(330px, calc(100vw - 24px));
  color: #162033;
  font-family: "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
}
.imt-input-panel {
  overflow: hidden;
  border: 1px solid rgba(22, 32, 51, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 18px 42px rgba(22, 32, 51, 0.18);
  backdrop-filter: blur(14px);
}
.imt-input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 6px 12px;
}
.imt-input-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}
.imt-input-status {
  color: #138b78;
  font-size: 11px;
  font-weight: 700;
}
.imt-input-close {
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
.imt-input-close:hover {
  background: #f1f5f9;
}
.imt-input-source,
.imt-input-result,
.imt-input-error {
  margin: 0;
  padding: 0 12px;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.imt-input-source {
  max-height: 66px;
  overflow: hidden;
  color: #5a6678;
}
.imt-input-result {
  padding-top: 8px;
  color: #101828;
  font-weight: 550;
}
.imt-input-error {
  padding-top: 8px;
  color: #b42318;
}
.imt-input-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
}
.imt-input-button {
  min-width: 68px;
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
.imt-input-button:hover {
  background: #f5f9ff;
}
.imt-input-button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.imt-input-button-primary {
  border-color: transparent;
  color: #ffffff;
  background: linear-gradient(135deg, #1758db 0%, #14a896 100%);
}
.imt-input-button-primary:hover {
  background: linear-gradient(135deg, #164fc3 0%, #129887 100%);
}
`;

export class InputTranslator {
  private readonly doc: Document;
  private parent: HTMLElement | undefined;
  private root: HTMLElement | undefined;
  private activeTarget: EditableTarget | undefined;
  private sourceText = "";
  private translatedText = "";
  private error = "";
  private state: InputTranslatorState = "idle";
  private mounted = false;

  constructor(private readonly options: InputTranslatorOptions) {
    this.doc = options.document ?? document;
  }

  mount(parent: HTMLElement = this.doc.body): void {
    if (this.mounted) return;
    this.parent = parent;
    this.mounted = true;
    this.doc.addEventListener("focusin", this.handleFocusIn);
    this.doc.addEventListener("input", this.handleInput, true);
    this.doc.addEventListener("keydown", this.handleKeyDown);
    this.doc.addEventListener("pointerdown", this.handlePointerDown, true);
    this.doc.addEventListener("scroll", this.handleScroll, true);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.doc.removeEventListener("focusin", this.handleFocusIn);
    this.doc.removeEventListener("input", this.handleInput, true);
    this.doc.removeEventListener("keydown", this.handleKeyDown);
    this.doc.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.doc.removeEventListener("scroll", this.handleScroll, true);
    this.mounted = false;
    this.hide();
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const target = toEditableTarget(event.target);
    if (!target || !isTranslatableTarget(target)) {
      this.hide();
      return;
    }
    this.showForTarget(target);
  };

  private readonly handleInput = (event: Event): void => {
    const target = toEditableTarget(event.target);
    if (!target || !isTranslatableTarget(target)) return;
    this.showForTarget(target);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") this.hide();
  };

  private readonly handlePointerDown = (event: Event): void => {
    const target = event.target;
    if (target instanceof Node && this.root?.contains(target)) return;
    if (target instanceof Node && target === this.activeTarget) return;
    if (target instanceof Node && target.parentElement?.closest("input, textarea")) return;
    this.hide();
  };

  private readonly handleScroll = (): void => {
    if (this.activeTarget) this.positionRoot(this.activeTarget);
  };

  private showForTarget(target: EditableTarget): void {
    const text = normalizeInputText(target.value);
    if (!text || target.closest('[data-imt-managed="true"]')) {
      this.hide();
      return;
    }

    const targetChanged = target !== this.activeTarget;
    this.activeTarget = target;
    this.sourceText = text;
    if (targetChanged || this.state !== "loading") {
      this.translatedText = "";
      this.error = "";
      this.state = "idle";
    }
    this.render();
  }

  private hide(): void {
    this.root?.remove();
    this.root = undefined;
    this.activeTarget = undefined;
    this.sourceText = "";
    this.translatedText = "";
    this.error = "";
    this.state = "idle";
  }

  private async translate(): Promise<void> {
    if (!this.activeTarget || !this.sourceText || this.state === "loading") return;
    const sourceText = this.sourceText;
    this.state = "loading";
    this.error = "";
    this.render();

    try {
      this.translatedText = await this.options.translateText(sourceText);
      this.state = "translated";
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.state = "failed";
    }

    this.render();
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

  private replace(): void {
    if (!this.activeTarget || !this.translatedText) return;
    this.activeTarget.value = this.translatedText;
    this.activeTarget.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: this.translatedText }));
    this.state = "replaced";
    this.sourceText = this.translatedText;
    this.render();
  }

  private render(): void {
    if (!this.parent || !this.activeTarget) return;
    if (!this.root) {
      this.root = this.doc.createElement("section");
      this.root.className = "imt-input-root";
      this.root.dataset.imtManaged = "true";
      this.root.dataset.imtInput = "root";
      this.parent.append(this.root);
    }

    this.root.textContent = "";
    this.root.dataset.state = this.state;
    this.positionRoot(this.activeTarget);

    const style = this.doc.createElement("style");
    style.textContent = STYLE_TEXT;

    const panel = this.doc.createElement("div");
    panel.className = "imt-input-panel";

    const header = this.doc.createElement("div");
    header.className = "imt-input-header";

    const title = this.doc.createElement("p");
    title.className = "imt-input-title";
    title.textContent = "输入框翻译";

    const status = this.doc.createElement("span");
    status.className = "imt-input-status";
    status.dataset.imtInputStatus = "true";
    status.textContent = stateLabel(this.state);

    const closeButton = this.createButton("x", "close", "imt-input-close", () => this.hide());
    closeButton.setAttribute("aria-label", "关闭输入框翻译");

    header.append(title, status, closeButton);

    const source = this.doc.createElement("p");
    source.className = "imt-input-source";
    source.dataset.imtInput = "source";
    source.textContent = this.sourceText;

    const actions = this.doc.createElement("div");
    actions.className = "imt-input-actions";

    const translateButton = this.createButton(
      this.state === "loading" ? "翻译中" : "翻译",
      "translate",
      "imt-input-button imt-input-button-primary",
      () => {
        void this.translate();
      },
    );
    translateButton.disabled = this.state === "loading";
    actions.append(translateButton);

    if (this.translatedText) {
      actions.append(
        this.createButton("复制", "copy", "imt-input-button", () => {
          void this.copy();
        }),
        this.createButton("替换", "replace", "imt-input-button", () => this.replace()),
      );
    }

    panel.append(header, source);

    if (this.translatedText) {
      const result = this.doc.createElement("p");
      result.className = "imt-input-result";
      result.dataset.imtInput = "result";
      result.textContent = this.translatedText;
      panel.append(result);
    }

    if (this.error) {
      const error = this.doc.createElement("p");
      error.className = "imt-input-error";
      error.dataset.imtInput = "error";
      error.textContent = this.error;
      panel.append(error);
    }

    panel.append(actions);
    this.root.append(style, panel);
  }

  private positionRoot(target: EditableTarget): void {
    if (!this.root) return;
    const view = this.doc.defaultView;
    const viewportWidth = view?.innerWidth ?? 1024;
    const viewportHeight = view?.innerHeight ?? 768;
    const rect = target.getBoundingClientRect();
    const width = Math.min(330, Math.max(230, viewportWidth - 24));
    const left = clamp(rect.left, 12, Math.max(12, viewportWidth - width - 12));
    const topCandidate = rect.bottom + 8;
    const top = clamp(topCandidate, 12, Math.max(12, viewportHeight - 190));

    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
  }

  private createButton(label: string, action: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = this.doc.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.imtInputAction = action;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }
}

function toEditableTarget(target: EventTarget | null): EditableTarget | null {
  if (target instanceof HTMLTextAreaElement) return target;
  if (target instanceof HTMLInputElement) return target;
  return null;
}

function isTranslatableTarget(target: EditableTarget): boolean {
  if (target.disabled || target.readOnly) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  return TEXT_INPUT_TYPES.has(target.type.toLowerCase());
}

function normalizeInputText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stateLabel(state: InputTranslatorState): string {
  if (state === "loading") return "翻译中";
  if (state === "translated") return "已翻译";
  if (state === "copied") return "已复制";
  if (state === "replaced") return "已替换";
  if (state === "failed") return "失败";
  return "就绪";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
