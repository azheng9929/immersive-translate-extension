import { scanDocumentText, scanTranslatableAttributes } from "./domScanner";
import { renderTranslation } from "./renderEngine";
import { restoreAll } from "./restoreEngine";
import { buildTranslationUnits } from "./unitBuilder";
import type { RestoreRecord, TranslationUnit } from "@/shared/types";

type BatchItem = { id: string; text: string; category: TranslationUnit["category"] };
type BatchResult = { id: string; text: string; status: "ok" | "skipped" | "failed"; error?: string };

type ControllerOptions = {
  targetLang: string;
  translateBatch: (items: BatchItem[]) => Promise<BatchResult[]>;
};

export class PageController {
  private sessionId = createSessionId();
  private revision = 0;
  private records: RestoreRecord[] = [];
  private units: TranslationUnit[] = [];

  constructor(private readonly options: ControllerOptions) {}

  async translatePage(root: ParentNode = document.body): Promise<void> {
    this.restorePage();
    const revision = this.revision + 1;
    this.revision = revision;

    const scannedTexts = scanDocumentText(root);
    const attributes = scanTranslatableAttributes(root);
    this.units = buildTranslationUnits({
      scannedTexts,
      attributes,
      sessionId: this.sessionId,
      revision: this.revision,
      targetLang: this.options.targetLang,
    });

    const batch = this.units.map((unit) => ({
      id: unit.id,
      text: unit.originalText,
      category: unit.category,
    }));

    if (batch.length === 0) return;

    const results = await this.options.translateBatch(batch);
    if (revision !== this.revision) return;

    const resultById = new Map(results.map((result) => [result.id, result]));

    for (const unit of this.units) {
      const result = resultById.get(unit.id);
      if (!result || result.status !== "ok") {
        unit.state = "failed";
        continue;
      }
      this.records.push(...renderTranslation(unit, result.text));
      unit.state = "translated";
    }
  }

  restorePage(): void {
    restoreAll(this.records);
    this.records = [];
    this.units = [];
    this.revision += 1;
  }
}

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `imt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
