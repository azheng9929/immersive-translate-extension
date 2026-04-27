export type UnitCategory =
  | "content-block"
  | "heading"
  | "list-item"
  | "comment"
  | "table-cell"
  | "button"
  | "nav"
  | "menu"
  | "label"
  | "inline-ui"
  | "card-text"
  | "attribute"
  | "fallback";

export type RenderMode =
  | "bilingual-inside"
  | "bilingual-after"
  | "replace-text"
  | "replace-attribute"
  | "compact-bilingual"
  | "skip";

export type UnitState = "pending" | "queued" | "loading" | "translated" | "failed" | "skipped";

export type TranslatableAttributeName = "placeholder" | "title" | "alt" | "aria-label";

export type TranslatableAttribute = {
  element: HTMLElement;
  name: TranslatableAttributeName;
  originalValue: string;
};

export type TranslationUnit = {
  id: string;
  sessionId: string;
  revision: number;
  root: HTMLElement;
  textNodes: Text[];
  attribute?: TranslatableAttribute;
  originalText: string;
  normalizedText: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang: string;
  category: UnitCategory;
  renderMode: RenderMode;
  priority: number;
  state: UnitState;
  reason?: string;
};

export type RestoreRecord =
  | { type: "inserted-node"; unitId: string; node: HTMLElement }
  | { type: "text-replace"; unitId: string; textNode: Text; originalText: string }
  | {
      type: "attribute-replace";
      unitId: string;
      element: HTMLElement;
      attribute: TranslatableAttributeName;
      originalValue: string | null;
    }
  | {
      type: "style-change";
      unitId: string;
      element: HTMLElement;
      property: string;
      originalValue: string;
    };
