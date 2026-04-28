import { scanDocumentText, scanTranslatableAttributes } from "./domScanner";
import { renderTranslation } from "./renderEngine";
import { restoreAll } from "./restoreEngine";
import { buildTranslationUnits } from "./unitBuilder";
import type { DisplayMode } from "../shared/config";
import { createTranslationCacheLookup, type TranslationCache, type TranslationCacheLookup, type TranslationCacheWrite } from "../shared/translationCache";
import type { RenderMode, RestoreRecord, TranslationUnit, UnitCategory } from "../shared/types";

type BatchItem = { id: string; text: string; category: TranslationUnit["category"] };
type BatchResult = { id: string; text: string; status: "ok" | "skipped" | "failed"; error?: string };

type ControllerOptions = {
  targetLang: string;
  providerId?: string;
  displayMode?: DisplayMode;
  cache?: TranslationCache;
  translateBatch: (items: BatchItem[]) => Promise<BatchResult[]>;
};

export type TranslationPageSummary = {
  total: number;
  translated: number;
  failed: number;
  skipped: number;
};

export class PageController {
  private sessionId = createSessionId();
  private revision = 0;
  private records: RestoreRecord[] = [];
  private units: TranslationUnit[] = [];

  constructor(private readonly options: ControllerOptions) {}

  async translatePage(root: ParentNode = document.body): Promise<TranslationPageSummary> {
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
    this.applyDisplayMode(this.units);

    const summary: TranslationPageSummary = {
      total: this.units.length,
      translated: 0,
      failed: 0,
      skipped: 0,
    };

    const lookupByUnitId = this.buildCacheLookups(this.units);
    const cacheHits = await this.readCache([...lookupByUnitId.values()]);
    if (revision !== this.revision) return summary;

    const missingUnits: TranslationUnit[] = [];
    for (const unit of this.units) {
      const lookup = lookupByUnitId.get(unit.id);
      const cachedText = lookup ? cacheHits.get(lookup.key) : undefined;
      if (cachedText !== undefined) {
        this.applyTranslation(unit, cachedText);
        summary.translated += 1;
      } else {
        missingUnits.push(unit);
      }
    }

    const batch = missingUnits.map((unit) => ({
      id: unit.id,
      text: unit.originalText,
      category: unit.category,
    }));

    if (batch.length === 0) return summary;

    const results = await this.options.translateBatch(batch);
    if (revision !== this.revision) return summary;

    const resultById = new Map(results.map((result) => [result.id, result]));

    const cacheWrites: TranslationCacheWrite[] = [];
    for (const unit of missingUnits) {
      const result = resultById.get(unit.id);
      if (!result || result.status !== "ok") {
        unit.state = result?.status === "skipped" ? "skipped" : "failed";
        if (unit.state === "skipped") summary.skipped += 1;
        else summary.failed += 1;
        continue;
      }
      this.applyTranslation(unit, result.text);
      summary.translated += 1;
      const lookup = lookupByUnitId.get(unit.id);
      if (lookup) cacheWrites.push({ ...lookup, translatedText: result.text });
    }

    await this.writeCache(cacheWrites);
    return summary;
  }

  restorePage(): void {
    restoreAll(this.records);
    this.records = [];
    this.units = [];
    this.revision += 1;
  }

  private buildCacheLookups(units: TranslationUnit[]): Map<string, TranslationCacheLookup> {
    const provider = this.options.providerId ?? "default";
    return new Map(
      units.map((unit) => [
        unit.id,
        createTranslationCacheLookup({
          provider,
          sourceLang: unit.sourceLang ?? "auto",
          targetLang: unit.targetLang,
          normalizedText: unit.normalizedText,
        }),
      ]),
    );
  }

  private async readCache(lookups: TranslationCacheLookup[]): Promise<Map<string, string>> {
    if (!this.options.cache) return new Map();
    try {
      return await this.options.cache.getMany(lookups);
    } catch (error) {
      console.warn("Failed to read translation cache", error);
      return new Map();
    }
  }

  private async writeCache(entries: TranslationCacheWrite[]): Promise<void> {
    if (!this.options.cache || entries.length === 0) return;
    try {
      await this.options.cache.putMany(entries);
    } catch (error) {
      console.warn("Failed to write translation cache", error);
    }
  }

  private applyTranslation(unit: TranslationUnit, translatedText: string): void {
    this.records.push(...renderTranslation(unit, translatedText));
    unit.translatedText = translatedText;
    unit.state = "translated";
  }

  private applyDisplayMode(units: TranslationUnit[]): void {
    const displayMode = this.options.displayMode ?? "smart";
    if (displayMode === "smart") return;

    for (const unit of units) {
      unit.renderMode = displayMode === "translation-only" ? translationOnlyMode(unit) : bilingualMode(unit);
    }
  }
}

function translationOnlyMode(unit: TranslationUnit): RenderMode {
  return unit.category === "attribute" ? "replace-attribute" : "replace-text";
}

function bilingualMode(unit: TranslationUnit): RenderMode {
  if (unit.category === "attribute") return "replace-attribute";
  if (isFragileCategory(unit.category)) return "replace-text";
  if (unit.category === "heading" || unit.category === "table-cell" || unit.category === "card-text") return "compact-bilingual";
  return "bilingual-inside";
}

function isFragileCategory(category: UnitCategory): boolean {
  return category === "button" || category === "nav" || category === "menu" || category === "label" || category === "inline-ui";
}

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `imt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
