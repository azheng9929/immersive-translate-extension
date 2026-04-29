import { scanDocumentText, scanTranslatableAttributes } from "./domScanner";
import { renderTranslation } from "./renderEngine";
import { restoreAll } from "./restoreEngine";
import { buildTranslationUnits } from "./unitBuilder";
import type { DisplayMode } from "../shared/config";
import { createTranslationCacheLookup, type TranslationCache, type TranslationCacheLookup, type TranslationCacheWrite } from "../shared/translationCache";
import type { RenderMode, RestoreRecord, TranslatableAttributeName, TranslationUnit, UnitCategory } from "../shared/types";
import {
  cloneTranslationDiagnostics,
  createTranslationDiagnostics,
  recordCacheUsage,
  recordProviderUsage,
  type TranslationDiagnostics,
} from "./translationDiagnostics";

type BatchItem = { id: string; text: string; category: TranslationUnit["category"] };
type BatchResult = { id: string; text: string; status: "ok" | "skipped" | "failed"; error?: string };
type TranslationRetryOptions = {
  maxAttempts: number;
  delayMs: number;
};

type ControllerOptions = {
  targetLang: string;
  hostname?: string;
  providerId?: string;
  displayMode?: DisplayMode;
  cache?: TranslationCache;
  retry?: TranslationRetryOptions;
  attributeNames?: readonly TranslatableAttributeName[];
  preferredScanRootSelectors?: readonly string[];
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
  private diagnostics: TranslationDiagnostics = createTranslationDiagnostics();

  constructor(private readonly options: ControllerOptions) {}

  async translatePage(root: ParentNode = document.body): Promise<TranslationPageSummary> {
    this.restorePage();
    return this.translateRoots([root]);
  }

  async translateNewContent(root: ParentNode): Promise<TranslationPageSummary> {
    return this.translateRoots([root]);
  }

  async translateNewContents(roots: readonly ParentNode[]): Promise<TranslationPageSummary> {
    return this.translateRoots(roots);
  }

  collectTranslatableRoots(root: ParentNode = document.body): HTMLElement[] {
    const units = this.buildUnits(root, this.revision + 1, createTranslationDiagnostics());
    const seen = new Set<HTMLElement>();
    const roots: HTMLElement[] = [];

    for (const unit of units) {
      if (seen.has(unit.root)) continue;
      seen.add(unit.root);
      roots.push(unit.root);
    }

    return roots;
  }

  getDiagnostics(): TranslationDiagnostics {
    return cloneTranslationDiagnostics(this.diagnostics);
  }

  private async translateRoots(roots: readonly ParentNode[]): Promise<TranslationPageSummary> {
    if (roots.length === 0) return { total: 0, translated: 0, failed: 0, skipped: 0 };

    const revision = this.revision + 1;
    this.revision = revision;

    const units = this.buildUnitsForRoots(roots, this.revision, this.diagnostics);
    this.applyDisplayMode(units);
    this.units.push(...units);

    const summary: TranslationPageSummary = {
      total: units.length,
      translated: 0,
      failed: 0,
      skipped: 0,
    };

    const lookupByUnitId = this.buildCacheLookups(units);
    const cacheHits = await this.readCache([...lookupByUnitId.values()]);
    if (revision !== this.revision) return summary;

    const missingUnits: TranslationUnit[] = [];
    let cacheHitsCount = 0;
    let cacheMissesCount = 0;
    for (const unit of units) {
      const lookup = lookupByUnitId.get(unit.id);
      const cachedText = lookup ? cacheHits.get(lookup.key) : undefined;
      if (cachedText !== undefined) {
        cacheHitsCount += 1;
        this.applyTranslation(unit, cachedText);
        summary.translated += 1;
      } else {
        cacheMissesCount += 1;
        missingUnits.push(unit);
      }
    }
    recordCacheUsage(this.diagnostics, cacheHitsCount, cacheMissesCount);

    const batch = missingUnits.map((unit) => ({
      id: unit.id,
      text: unit.originalText,
      category: unit.category,
    }));

    if (batch.length === 0) return summary;

    const results = await this.translateBatchWithRetries(batch);
    if (revision !== this.revision) return summary;
    recordProviderUsage(
      this.diagnostics,
      batch.length,
      results.filter((result) => result.status === "failed").length,
      results.filter((result) => result.status === "skipped").length,
    );

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

  private buildUnits(root: ParentNode, revision: number, diagnostics: TranslationDiagnostics): TranslationUnit[] {
    return this.buildUnitsForRoots([root], revision, diagnostics);
  }

  private buildUnitsForRoots(
    roots: readonly ParentNode[],
    revision: number,
    diagnostics: TranslationDiagnostics,
  ): TranslationUnit[] {
    const hostname = this.options.hostname ?? globalThis.location?.hostname ?? "";
    const scanOptions = {
      ...(hostname ? { hostname } : {}),
      targetLang: this.options.targetLang,
      diagnostics,
    };
    const scanRoots = dedupeParentNodes(
      roots.flatMap((root) => collectScanRoots(root, this.options.preferredScanRootSelectors)),
    );
    const scannedTexts = scanRoots.flatMap((scanRoot) => scanDocumentText(scanRoot, scanOptions));
    const attributes = scanRoots.flatMap((scanRoot) =>
      scanTranslatableAttributes(scanRoot, this.options.attributeNames, scanOptions),
    );
    return buildTranslationUnits({
      scannedTexts,
      attributes,
      sessionId: this.sessionId,
      revision,
      targetLang: this.options.targetLang,
      hostname,
      diagnostics,
    });
  }

  restorePage(): void {
    restoreAll(this.records);
    this.records = [];
    this.units = [];
    this.diagnostics = createTranslationDiagnostics();
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

  private async translateBatchWithRetries(batch: BatchItem[]): Promise<BatchResult[]> {
    const maxAttempts = Math.max(1, this.options.retry?.maxAttempts ?? 1);
    const delayMs = Math.max(0, this.options.retry?.delayMs ?? 0);
    const resultById = new Map<string, BatchResult>();
    let remaining = batch;

    for (let attempt = 1; attempt <= maxAttempts && remaining.length > 0; attempt += 1) {
      const attemptResults = await this.runTranslateBatch(remaining);
      const attemptResultById = new Map(attemptResults.map((result) => [result.id, result]));

      for (const item of remaining) {
        const result = attemptResultById.get(item.id) ?? {
          id: item.id,
          text: "",
          status: "failed" as const,
          error: "Missing provider result",
        };
        resultById.set(item.id, result);
      }

      if (attempt >= maxAttempts) break;
      remaining = remaining.filter((item) => resultById.get(item.id)?.status === "failed");
      if (remaining.length > 0 && delayMs > 0) await sleep(delayMs);
    }

    return batch.map((item) => resultById.get(item.id) ?? {
      id: item.id,
      text: "",
      status: "failed" as const,
      error: "Missing provider result",
    });
  }

  private async runTranslateBatch(batch: BatchItem[]): Promise<BatchResult[]> {
    try {
      return await this.options.translateBatch(batch);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return batch.map((item) => ({ id: item.id, text: "", status: "failed" as const, error: message }));
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

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function collectScanRoots(root: ParentNode, preferredSelectors: readonly string[] | undefined): ParentNode[] {
  if (!preferredSelectors || preferredSelectors.length === 0) return [root];

  const roots: HTMLElement[] = [];
  const addRoot = (candidate: HTMLElement): void => {
    for (const existing of [...roots]) {
      if (existing === candidate) return;
      if (candidate.contains(existing)) return;
      if (existing.contains(candidate)) {
        roots.splice(roots.indexOf(existing), 1);
      }
    }
    roots.push(candidate);
  };

  for (const selector of preferredSelectors) {
    try {
      if (root instanceof HTMLElement && root.matches(selector)) addRoot(root);
      root.querySelectorAll?.(selector).forEach((element) => {
        if (element instanceof HTMLElement) addRoot(element);
      });
    } catch {
      continue;
    }
  }

  return roots;
}

function dedupeParentNodes(roots: ParentNode[]): ParentNode[] {
  const accepted: ParentNode[] = [];

  for (const candidate of roots) {
    if (!(candidate instanceof Node)) {
      accepted.push(candidate);
      continue;
    }

    let shouldSkip = false;
    for (const existing of [...accepted]) {
      if (!(existing instanceof Node)) continue;
      if (existing === candidate || existing.contains(candidate)) {
        shouldSkip = true;
        break;
      }
      if (candidate.contains(existing)) {
        const index = accepted.indexOf(existing);
        if (index >= 0) accepted.splice(index, 1);
      }
    }

    if (!shouldSkip) accepted.push(candidate);
  }

  return accepted;
}
