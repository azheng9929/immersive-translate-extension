const ORIGINAL_TEXT_ATTRIBUTE = "data-imt-original-text";
const STYLE_ID = "imt-original-tooltip-style";

type OriginalTextTooltipOptions = {
  document?: Document;
};

const STYLE_TEXT = `
.imt-original-tooltip {
  position: fixed;
  z-index: 2147483645;
  max-width: min(360px, calc(100vw - 24px));
  padding: 8px 10px;
  border: 1px solid rgba(22, 32, 51, 0.12);
  border-radius: 9px;
  background: rgba(17, 24, 39, 0.94);
  color: #ffffff;
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.22);
  pointer-events: none;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.45;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
`;

export class OriginalTextTooltip {
  private readonly doc: Document;
  private parent: HTMLElement | undefined;
  private root: HTMLElement | undefined;
  private activeElement: HTMLElement | undefined;
  private mounted = false;

  constructor(options: OriginalTextTooltipOptions = {}) {
    this.doc = options.document ?? document;
  }

  mount(parent: HTMLElement = this.doc.body): void {
    if (this.mounted) return;
    this.parent = parent;
    this.mounted = true;
    ensureTooltipStyle(this.doc);
    this.doc.addEventListener("mouseover", this.handleMouseOver);
    this.doc.addEventListener("mouseout", this.handleMouseOut);
    this.doc.addEventListener("focusin", this.handleFocusIn);
    this.doc.addEventListener("focusout", this.handleFocusOut);
    this.doc.addEventListener("scroll", this.handleScroll, true);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.doc.removeEventListener("mouseover", this.handleMouseOver);
    this.doc.removeEventListener("mouseout", this.handleMouseOut);
    this.doc.removeEventListener("focusin", this.handleFocusIn);
    this.doc.removeEventListener("focusout", this.handleFocusOut);
    this.doc.removeEventListener("scroll", this.handleScroll, true);
    this.mounted = false;
    this.hide();
  }

  private readonly handleMouseOver = (event: MouseEvent): void => {
    const element = findOriginalTextElement(event.target);
    if (!element || !this.parent?.contains(element)) return;
    this.show(element, event.clientX, event.clientY);
  };

  private readonly handleMouseOut = (event: MouseEvent): void => {
    if (!this.activeElement) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && this.activeElement.contains(relatedTarget)) return;
    this.hide();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const element = findOriginalTextElement(event.target);
    if (!element || !this.parent?.contains(element)) return;
    this.show(element);
  };

  private readonly handleFocusOut = (): void => {
    this.hide();
  };

  private readonly handleScroll = (): void => {
    this.hide();
  };

  private show(element: HTMLElement, clientX?: number, clientY?: number): void {
    const originalText = element.getAttribute(ORIGINAL_TEXT_ATTRIBUTE)?.trim();
    if (!originalText) {
      this.hide();
      return;
    }

    this.activeElement = element;
    if (!this.root) {
      this.root = this.doc.createElement("div");
      this.root.className = "imt-original-tooltip";
      this.root.dataset.imtManaged = "true";
      this.root.dataset.imtOriginalTooltip = "root";
      this.parent?.append(this.root);
    }

    this.root.textContent = originalText;
    this.position(element, clientX, clientY);
  }

  private hide(): void {
    this.root?.remove();
    this.root = undefined;
    this.activeElement = undefined;
  }

  private position(element: HTMLElement, clientX?: number, clientY?: number): void {
    if (!this.root) return;

    const view = this.doc.defaultView;
    const viewportWidth = view?.innerWidth ?? 1024;
    const viewportHeight = view?.innerHeight ?? 768;
    const rect = element.getBoundingClientRect();
    const anchorX = clientX && clientX > 0 ? clientX : rect.left;
    const anchorY = clientY && clientY > 0 ? clientY : rect.bottom;
    const width = Math.min(360, Math.max(220, viewportWidth - 24));
    const left = clamp(anchorX + 10, 12, Math.max(12, viewportWidth - width - 12));
    const top = clamp(anchorY + 12, 12, Math.max(12, viewportHeight - 120));

    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
  }
}

function findOriginalTextElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(`[${ORIGINAL_TEXT_ATTRIBUTE}]`);
}

function ensureTooltipStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.dataset.imtManaged = "true";
  style.textContent = STYLE_TEXT;
  doc.documentElement.append(style);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
