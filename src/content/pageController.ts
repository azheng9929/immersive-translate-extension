import { scanDocumentText, scanTranslatableAttributes } from "./domScanner";
import { removeTranslationLoading, renderTranslation, renderTranslationLoading } from "./renderEngine";
import { restoreAll, restoreRecords } from "./restoreEngine";
import { buildTranslationUnits } from "./unitBuilder";
import type { DisplayMode } from "../shared/config";
import { normalizeVisibleText } from "../shared/normalize";
import { isMeaningfulText, isSkippableElement } from "../shared/skipRules";
import { createTranslationCacheLookup, type TranslationCache, type TranslationCacheLookup, type TranslationCacheWrite } from "../shared/translationCache";
import type { RenderMode, RestoreRecord, TranslatableAttributeName, TranslationUnit, UnitCategory } from "../shared/types";
import type { CompiledFilterRule } from "./compiledFilterRule";
import type { SiteContentSelector } from "./sitePolicy";
import {
  cloneTranslationDiagnostics,
  createTranslationDiagnostics,
  recordCacheUsage,
  recordProviderUsage,
  type TranslationDiagnostics,
} from "./translationDiagnostics";

type BatchItem = { id: string; text: string; category: TranslationUnit["category"] };
type BatchResult = { id: string; text: string; status: "ok" | "skipped" | "failed"; error?: string };
type MissingUnit = { unit: TranslationUnit; item: BatchItem };
export type TranslationProgressDelta = TranslationPageSummary;
export type TranslationProgressListener = (delta: TranslationProgressDelta) => void;
type TranslationRetryOptions = {
  maxAttempts: number;
  delayMs: number;
};
type ViewportRootOptions = {
  rootMargin?: string;
  maxRoots?: number;
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
  excludeSelectors?: readonly string[];
  contentSelectors?: readonly SiteContentSelector[];
  filterRule?: CompiledFilterRule;
  allowTooltip?: boolean;
  getPageTitle?: () => string | undefined;
  progressiveBatchItems?: number;
  progressiveBatchChars?: number;
  progressiveConcurrentBatches?: number;
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

  async translatePage(
    root: ParentNode = document.body,
    onProgress?: TranslationProgressListener,
  ): Promise<TranslationPageSummary> {
    this.restorePage();
    return this.translateRoots([root], onProgress);
  }

  async translateNewContent(
    root: ParentNode,
    onProgress?: TranslationProgressListener,
  ): Promise<TranslationPageSummary> {
    return this.translateRoots([root], onProgress);
  }

  async translateNewContents(
    roots: readonly ParentNode[],
    onProgress?: TranslationProgressListener,
  ): Promise<TranslationPageSummary> {
    return this.translateRoots(roots, onProgress);
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

  collectViewportTranslatableRoots(
    root: ParentNode = document.body,
    options: ViewportRootOptions = {},
  ): HTMLElement[] {
    const candidates = collectCandidateViewportRoots(root, this.options.preferredScanRootSelectors);
    const roots: HTMLElement[] = [];
    const margin = options.rootMargin ?? "900px";
    const maxRoots = normalizeInteger(options.maxRoots, 80, 1, 500);

    for (const candidate of candidates) {
      if (roots.length >= maxRoots) break;
      if (!candidate.isConnected) continue;
      if (!isNearViewport(candidate, margin)) continue;
      if (isSkippableElement(candidate, { ...(this.options.allowTooltip ? { allowTooltip: true } : {}) })) continue;
      if (matchesClosestSelector(candidate, this.options.excludeSelectors)) continue;
      const text = normalizeVisibleText(candidate.textContent ?? "");
      if (!isMeaningfulText(text, classifyViewportCandidate(candidate))) continue;
      addRoot(roots, candidate);
    }

    return roots;
  }

  getDiagnostics(): TranslationDiagnostics {
    return cloneTranslationDiagnostics(this.diagnostics);
  }

  private async translateRoots(
    roots: readonly ParentNode[],
    onProgress?: TranslationProgressListener,
  ): Promise<TranslationPageSummary> {
    if (roots.length === 0) return { total: 0, translated: 0, failed: 0, skipped: 0 };

    const revision = this.revision + 1;
    this.revision = revision;
    this.restoreExactTranslatedRoots(roots);

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
    notifyProgress(onProgress, { total: units.length, translated: cacheHitsCount, failed: 0, skipped: 0 });

    const cacheWrites: TranslationCacheWrite[] = [];
    await this.translateMissingUnits(
      missingUnits.map((unit) => ({
        unit,
        item: {
          id: unit.id,
          text: unit.originalText,
          category: unit.category,
        },
      })),
      lookupByUnitId,
      cacheWrites,
      summary,
      revision,
      onProgress,
    );

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
      ...(this.options.allowTooltip ? { allowTooltip: true } : {}),
      ...(this.options.excludeSelectors ? { excludeSelectors: this.options.excludeSelectors } : {}),
      ...(this.options.contentSelectors ? { contentSelectors: this.options.contentSelectors } : {}),
      ...(this.options.filterRule ? { filterRule: this.options.filterRule } : {}),
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
      ...(this.options.allowTooltip ? { allowTooltip: true } : {}),
      ...(this.options.excludeSelectors ? { excludeSelectors: this.options.excludeSelectors } : {}),
      ...(this.options.contentSelectors ? { contentSelectors: this.options.contentSelectors } : {}),
      ...(this.options.filterRule ? { filterRule: this.options.filterRule } : {}),
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

  private restoreExactTranslatedRoots(roots: readonly ParentNode[]): void {
    const translatedRoots = roots.filter(
      (root): root is HTMLElement => root instanceof HTMLElement && root.getAttribute("data-imt-state") === "translated",
    );
    if (translatedRoots.length === 0) return;

    const remaining: RestoreRecord[] = [];
    const restoring: RestoreRecord[] = [];

    for (const record of this.records) {
      if (recordBelongsToRoots(record, translatedRoots)) restoring.push(record);
      else remaining.push(record);
    }

    restoreRecords(restoring);
    this.records = remaining;
    this.units = this.units.filter((unit) => !translatedRoots.some((root) => root === unit.root));
  }

  private buildCacheLookups(units: TranslationUnit[]): Map<string, TranslationCacheLookup> {
    const provider = this.options.providerId ?? "default";
    const pageTitle = this.options.getPageTitle?.();
    return new Map(
      units.map((unit) => [
        unit.id,
        createTranslationCacheLookup({
          provider,
          sourceLang: unit.sourceLang ?? "auto",
          targetLang: unit.targetLang,
          pageTitle,
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

  private async translateMissingUnits(
    missingUnits: MissingUnit[],
    lookupByUnitId: Map<string, TranslationCacheLookup>,
    cacheWrites: TranslationCacheWrite[],
    summary: TranslationPageSummary,
    revision: number,
    onProgress: TranslationProgressListener | undefined,
  ): Promise<void> {
    if (missingUnits.length === 0) return;

    const chunks = chunkMissingUnits(
      missingUnits,
      this.progressiveBatchItems(missingUnits.length),
      this.progressiveBatchChars(),
    );
    const workerCount = Math.min(this.progressiveConcurrentBatches(), chunks.length);
    let nextChunkIndex = 0;

    const runWorker = async (): Promise<void> => {
      while (revision === this.revision) {
        const chunk = chunks[nextChunkIndex];
        nextChunkIndex += 1;
        if (!chunk) return;
        await this.translateMissingUnitChunk(chunk, lookupByUnitId, cacheWrites, summary, revision, onProgress);
      }
    };

    await Promise.all(Array.from({ length: workerCount }, runWorker));
  }

  private async translateMissingUnitChunk(
    missingUnits: MissingUnit[],
    lookupByUnitId: Map<string, TranslationCacheLookup>,
    cacheWrites: TranslationCacheWrite[],
    summary: TranslationPageSummary,
    revision: number,
    onProgress: TranslationProgressListener | undefined,
  ): Promise<void> {
    const batch = missingUnits.map((entry) => entry.item);
    for (const { unit } of missingUnits) {
      this.records.push(...renderTranslationLoading(unit));
      unit.state = "loading";
    }

    const results = await this.translateBatchWithRetries(batch);
    if (revision !== this.revision) return;

    const failed = results.filter((result) => result.status === "failed").length;
    const skipped = results.filter((result) => result.status === "skipped").length;
    recordProviderUsage(this.diagnostics, batch.length, failed, skipped);

    const resultById = new Map(results.map((result) => [result.id, result]));
    const delta: TranslationProgressDelta = { total: 0, translated: 0, failed: 0, skipped: 0 };

    for (const { unit } of missingUnits) {
      const result = resultById.get(unit.id);
      removeTranslationLoading(unit);
      if (!result || result.status !== "ok") {
        unit.state = result?.status === "skipped" ? "skipped" : "failed";
        if (unit.state === "skipped") {
          summary.skipped += 1;
          delta.skipped += 1;
        } else {
          summary.failed += 1;
          delta.failed += 1;
        }
        continue;
      }

      this.applyTranslation(unit, result.text);
      summary.translated += 1;
      delta.translated += 1;
      const lookup = lookupByUnitId.get(unit.id);
      if (lookup) cacheWrites.push({ ...lookup, translatedText: result.text });
    }

    notifyProgress(onProgress, delta);
  }

  private progressiveBatchItems(fallback: number): number {
    return normalizeInteger(this.options.progressiveBatchItems, fallback, 1, 80);
  }

  private progressiveBatchChars(): number {
    return normalizeInteger(this.options.progressiveBatchChars, Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER);
  }

  private progressiveConcurrentBatches(): number {
    return normalizeInteger(this.options.progressiveConcurrentBatches, 1, 1, 8);
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

function chunkMissingUnits(missingUnits: MissingUnit[], maxItems: number, maxChars: number): MissingUnit[][] {
  const chunks: MissingUnit[][] = [];
  let chunk: MissingUnit[] = [];
  let chunkChars = 0;

  for (const entry of missingUnits) {
    const itemChars = entry.item.text.length;
    const wouldOverflowItems = chunk.length >= maxItems;
    const wouldOverflowChars = chunk.length > 0 && chunkChars + itemChars > maxChars;
    if (wouldOverflowItems || wouldOverflowChars) {
      chunks.push(chunk);
      chunk = [];
      chunkChars = 0;
    }

    chunk.push(entry);
    chunkChars += itemChars;
  }

  if (chunk.length > 0) chunks.push(chunk);
  return chunks;
}

function notifyProgress(listener: TranslationProgressListener | undefined, delta: TranslationProgressDelta): void {
  if (!listener) return;
  if (delta.total === 0 && delta.translated === 0 && delta.failed === 0 && delta.skipped === 0) return;
  listener(delta);
}

function normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(Math.max(Math.round(numberValue), min), max);
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

const DEFAULT_VIEWPORT_ROOT_SELECTORS = [
  "main p",
  "main li",
  "article p",
  "article li",
  "section p",
  "section li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "blockquote",
  "figcaption",
  "li",
  "td",
  "th",
  "[role='listitem']",
] as const;

function collectCandidateViewportRoots(root: ParentNode, preferredSelectors: readonly string[] | undefined): HTMLElement[] {
  const selectorText = (preferredSelectors && preferredSelectors.length > 0
    ? preferredSelectors
    : DEFAULT_VIEWPORT_ROOT_SELECTORS).join(",");
  const candidates: HTMLElement[] = [];

  const addCandidate = (element: HTMLElement): void => {
    if (candidates.includes(element)) return;
    candidates.push(element);
  };

  try {
    if (root instanceof HTMLElement && root.matches(selectorText)) addCandidate(root);
    root.querySelectorAll?.(selectorText).forEach((element) => {
      if (element instanceof HTMLElement) addCandidate(element);
    });
  } catch {
    return [];
  }

  return candidates;
}

function addRoot(roots: HTMLElement[], candidate: HTMLElement): void {
  for (const existing of [...roots]) {
    if (existing === candidate || existing.contains(candidate)) return;
    if (candidate.contains(existing)) roots.splice(roots.indexOf(existing), 1);
  }
  roots.push(candidate);
}

function classifyViewportCandidate(element: HTMLElement): UnitCategory {
  if (element.matches("td,th")) return "table-cell";
  if (element.matches("li,[role='listitem']")) return "list-item";
  if (element.matches("h1,h2,h3,h4,h5,h6")) return "heading";
  if (element.matches("p,blockquote,figcaption")) return "content-block";
  return "fallback";
}

function matchesClosestSelector(element: HTMLElement, selectors: readonly string[] | undefined): boolean {
  if (!selectors?.length) return false;
  for (const selector of selectors) {
    try {
      if (element.closest(selector)) return true;
    } catch {
      continue;
    }
  }
  return false;
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

function recordBelongsToRoots(record: RestoreRecord, roots: readonly HTMLElement[]): boolean {
  const node = restoreRecordNode(record);
  return Boolean(node && roots.some((root) => root === node || root.contains(node)));
}

function restoreRecordNode(record: RestoreRecord): Node | undefined {
  if (record.type === "inserted-node") return record.node.parentElement ?? record.node;
  if (record.type === "text-replace") return record.textNode.parentElement ?? record.textNode;
  if (record.type === "attribute-replace") return record.element;
  if (record.type === "style-change") return record.element;
  return undefined;
}

function isNearViewport(element: HTMLElement, rootMargin: string): boolean {
  const rect = element.getBoundingClientRect();
  const margin = parseRootMarginPx(rootMargin);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  return rect.bottom >= -margin &&
    rect.top <= viewportHeight + margin &&
    rect.right >= -margin &&
    rect.left <= viewportWidth + margin;
}

function parseRootMarginPx(rootMargin: string): number {
  const match = rootMargin.trim().match(/^(-?\d+(?:\.\d+)?)px\b/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
