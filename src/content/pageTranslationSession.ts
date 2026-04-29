import type { PageController, TranslationPageSummary, TranslationProgressDelta } from "./pageController";
import { DEFAULT_EXCLUDED_DYNAMIC_SELECTORS, type DynamicModeSource, type DynamicTranslationMode } from "./sitePolicy";
import type { TranslationDiagnostics } from "./translationDiagnostics";

export type PageTranslationPhase = "idle" | "translating" | "translated" | "updating" | "partial" | "failed";
export type DynamicObservationState = "inactive" | "observing" | "queued" | "paused" | "suspended";

export type PageTranslationSiteStatus = {
  hostname: string;
  siteKey: string;
  dynamicMode: DynamicTranslationMode;
  dynamicModeSource: DynamicModeSource;
  isHighDynamic: boolean;
};

export type PageTranslationStatus = TranslationPageSummary & {
  phase: PageTranslationPhase;
  observation: DynamicObservationState;
  pendingRoots: number;
  observedRoots: number;
  dynamicRuns: number;
  lastError: string | undefined;
  diagnostics?: TranslationDiagnostics;
  site?: PageTranslationSiteStatus;
};

type PageTranslationSessionOptions = {
  observeRoot?: HTMLElement;
  debounceMs?: number;
  lazy?: boolean;
  lazyRootMargin?: string;
  lazyThreshold?: number;
  eagerLazy?: boolean;
  eagerLazyRootMargin?: string;
  maxEagerLazyRoots?: number;
  dynamicMode?: DynamicTranslationMode;
  excludedDynamicSelectors?: readonly string[];
  maxQueueSize?: number;
  maxRootsPerFlush?: number;
  maxObservedRoots?: number;
  maxMutationNodesPerWindow?: number;
  mutationWindowMs?: number;
  site?: PageTranslationSiteStatus;
};

type StatusListener = (status: PageTranslationStatus) => void;

const EMPTY_SUMMARY: TranslationPageSummary = {
  total: 0,
  translated: 0,
  failed: 0,
  skipped: 0,
};

const SUSPENDED_MESSAGE = "Dynamic translation paused because this page is changing too quickly.";

export class PageTranslationSession {
  private status: PageTranslationStatus = {
    ...EMPTY_SUMMARY,
    phase: "idle",
    observation: "inactive",
    pendingRoots: 0,
    observedRoots: 0,
    dynamicRuns: 0,
    lastError: undefined,
  };
  private readonly listeners = new Set<StatusListener>();
  private readonly pendingRoots = new Set<ParentNode>();
  private observer: MutationObserver | undefined;
  private lazyObserver: IntersectionObserver | undefined;
  private readonly lazyObservedRoots = new Set<HTMLElement>();
  private readonly dynamicLazyRoots = new WeakSet<HTMLElement>();
  private readonly pendingVisibleLazyRoots = new Set<HTMLElement>();
  private pendingVisibleLazyDynamicRun = false;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private operationId = 0;
  private flushing = false;
  private dynamicSuspended = false;
  private mutationWindowStartedAt = 0;
  private mutationNodesInWindow = 0;
  private listeningForVisibility = false;
  private readonly handleVisibilityChangeBound = () => this.handleVisibilityChange();

  constructor(
    private readonly controller: PageController,
    private readonly options: PageTranslationSessionOptions = {},
  ) {}

  getStatus(): PageTranslationStatus {
    return {
      ...this.status,
      ...(this.status.site || !this.options.site ? {} : { site: this.options.site }),
    };
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async translatePage(root: ParentNode = this.options.observeRoot ?? document.body): Promise<PageTranslationStatus> {
    const operationId = ++this.operationId;
    this.stopObserver();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    this.dynamicSuspended = false;
    this.resetMutationWindow();
    this.setStatus({
      ...EMPTY_SUMMARY,
      phase: "translating",
      observation: "inactive",
      dynamicRuns: 0,
      lastError: undefined,
    });

    try {
      if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
        this.controller.restorePage();
        const initialRoots = this.controller.collectTranslatableRoots(root);
        const { eagerRoots, deferredRoots } = this.partitionInitialLazyRoots(initialRoots);
        this.observeLazyRoots(deferredRoots, false);
        const observation = this.activateDynamicObserver("translated");
        this.setStatus({
          ...EMPTY_SUMMARY,
          phase: eagerRoots.length > 0 ? "updating" : "translated",
          observation,
          dynamicRuns: 0,
          lastError: undefined,
        });
        if (eagerRoots.length > 0) void this.translateRoots(eagerRoots, false);
        return this.getStatus();
      }

      const summary = await this.controller.translatePage(root);
      if (operationId !== this.operationId) return this.getStatus();
      const phase = phaseFromSummary(summary);
      const observation = this.activateDynamicObserver(phase);
      this.setStatus({ ...summary, phase, observation, dynamicRuns: 0, lastError: undefined });
    } catch (error) {
      if (operationId !== this.operationId) return this.getStatus();
      this.setStatus({
        ...EMPTY_SUMMARY,
        phase: "failed",
        observation: "inactive",
        dynamicRuns: 0,
        lastError: errorMessage(error),
      });
    }

    return this.getStatus();
  }

  restorePage(): void {
    ++this.operationId;
    this.stopObserver();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    this.dynamicSuspended = false;
    this.resetMutationWindow();
    this.controller.restorePage();
    this.setStatus({
      ...EMPTY_SUMMARY,
      phase: "idle",
      observation: "inactive",
      dynamicRuns: 0,
      lastError: undefined,
    });
  }

  dispose(): void {
    this.stopObserver();
    this.listeners.clear();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
  }

  private activateDynamicObserver(phase: PageTranslationPhase = this.status.phase): DynamicObservationState {
    this.disconnectMutationObserver();
    if (this.dynamicSuspended) return "suspended";
    if (!canSupplement(phase) || this.dynamicMode() === "off") {
      this.removeVisibilityListener();
      return "inactive";
    }
    this.addVisibilityListener();
    if (!this.isPageVisible()) return "paused";
    if (!this.connectMutationObserver()) return "inactive";
    return this.pendingRoots.size > 0 ? "queued" : "observing";
  }

  private connectMutationObserver(): boolean {
    const root = this.options.observeRoot ?? document.body;
    if (!root || typeof MutationObserver === "undefined") return false;

    this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
    this.observer.observe(root, { childList: true, subtree: true });
    return true;
  }

  private disconnectMutationObserver(): void {
    this.observer?.disconnect();
    this.observer?.takeRecords();
    this.observer = undefined;
  }

  private stopObserver(): void {
    this.disconnectMutationObserver();
    this.removeVisibilityListener();
    this.lazyObserver?.disconnect();
    this.lazyObserver = undefined;
    this.lazyObservedRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (!this.canHandleDynamicMutations()) return;

    const roots: HTMLElement[] = [];
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const root = rootFromAddedNode(node);
        if (!root || !root.isConnected || this.shouldIgnoreRoot(root)) continue;
        roots.push(root);
      }
    }

    if (roots.length === 0) return;
    if (!this.recordMutationVolume(roots.length)) return;

    for (const root of roots) {
      if (!this.addPendingRoot(root, false)) return;
    }

    if (this.pendingRoots.size === 0) return;
    this.scheduleFlush();
  }

  private handleVisibilityChange(): void {
    if (this.dynamicSuspended || !canSupplement(this.status.phase) || this.dynamicMode() === "off") return;

    if (!this.isPageVisible()) {
      this.disconnectMutationObserver();
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = undefined;
      }
      this.setStatus({ ...this.status, observation: "paused" });
      return;
    }

    const root = this.options.observeRoot ?? document.body;
    if (root instanceof HTMLElement && root.isConnected) this.addPendingRoot(root, false);
    const observation = this.activateDynamicObserver(this.status.phase);
    if (this.pendingRoots.size > 0) this.scheduleFlush();
    else this.setStatus({ ...this.status, observation });
  }

  private addPendingRoot(root: HTMLElement, notify = true): boolean {
    if (this.dynamicSuspended || this.shouldIgnoreRoot(root)) return true;

    for (const pending of [...this.pendingRoots]) {
      if (pending instanceof Node && pending.contains(root)) return true;
      if (root.contains(pending as Node)) this.pendingRoots.delete(pending);
    }
    this.pendingRoots.add(root);

    if (this.pendingRoots.size > this.maxQueueSize()) {
      this.suspendDynamicTranslation();
      return false;
    }

    if (notify) this.setStatus({ ...this.status, observation: "queued" });
    return true;
  }

  private scheduleFlush(): void {
    if (this.dynamicSuspended) return;
    if (!this.isPageVisible()) {
      this.setStatus({ ...this.status, observation: "paused" });
      return;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.setStatus({ ...this.status, observation: "queued" });
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.flushPendingRoots();
    }, this.options.debounceMs ?? 250);
  }

  private async flushPendingRoots(): Promise<void> {
    if (this.flushing || this.pendingRoots.size === 0 || !this.canHandleDynamicMutations()) return;
    if (!this.isPageVisible()) {
      this.setStatus({ ...this.status, observation: "paused" });
      return;
    }

    const allRoots = [...this.pendingRoots].filter(
      (root): root is HTMLElement => root instanceof HTMLElement && root.isConnected && !this.shouldIgnoreRoot(root),
    );
    this.pendingRoots.clear();

    const roots = allRoots.slice(0, this.maxRootsPerFlush());
    for (const overflowRoot of allRoots.slice(this.maxRootsPerFlush())) this.addPendingRoot(overflowRoot, false);

    if (roots.length === 0) {
      this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }

    if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
      this.observeLazyRoots(roots, true);
      if (this.pendingRoots.size > 0) this.scheduleFlush();
      else this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }

    await this.translateRoots(roots, true);
  }

  private observeLazyRoots(roots: HTMLElement[], countDynamicRun: boolean): void {
    if (roots.length === 0 || typeof IntersectionObserver === "undefined") return;
    if (!this.lazyObserver) {
      this.lazyObserver = new IntersectionObserver((entries) => this.handleLazyIntersections(entries), {
        root: null,
        rootMargin: this.options.lazyRootMargin ?? "200px",
        threshold: this.options.lazyThreshold ?? 0.1,
      });
    }

    for (const root of roots) {
      if (!root.isConnected || this.shouldIgnoreRoot(root) || this.lazyObservedRoots.has(root)) continue;
      if (this.lazyObservedRoots.size >= this.maxObservedRoots()) {
        this.addPendingRoot(root, false);
        continue;
      }
      if (countDynamicRun) this.dynamicLazyRoots.add(root);
      this.lazyObservedRoots.add(root);
      this.lazyObserver.observe(root);
    }
  }

  private partitionInitialLazyRoots(roots: HTMLElement[]): { eagerRoots: HTMLElement[]; deferredRoots: HTMLElement[] } {
    if (!this.options.eagerLazy) return { eagerRoots: [], deferredRoots: roots };

    const eagerRoots: HTMLElement[] = [];
    const deferredRoots: HTMLElement[] = [];
    const maxEagerRoots = this.options.maxEagerLazyRoots ?? 120;
    const rootMargin = this.options.eagerLazyRootMargin ?? this.options.lazyRootMargin ?? "900px";

    for (const root of roots) {
      if (eagerRoots.length < maxEagerRoots && isNearViewport(root, rootMargin)) {
        eagerRoots.push(root);
      } else {
        deferredRoots.push(root);
      }
    }

    return { eagerRoots, deferredRoots };
  }

  private handleLazyIntersections(entries: IntersectionObserverEntry[]): void {
    const visibleRoots: HTMLElement[] = [];
    let countDynamicRun = false;

    for (const entry of entries) {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
      const root = entry.target;
      this.lazyObserver?.unobserve(root);
      this.lazyObservedRoots.delete(root);
      if (this.shouldIgnoreRoot(root)) continue;
      if (this.dynamicLazyRoots.has(root)) countDynamicRun = true;
      visibleRoots.push(root);
    }

    if (visibleRoots.length > 0) void this.translateRoots(visibleRoots, countDynamicRun);
  }

  private async translateRoots(roots: HTMLElement[], countDynamicRun: boolean): Promise<void> {
    if (this.flushing) {
      if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
        for (const root of roots) this.pendingVisibleLazyRoots.add(root);
        this.pendingVisibleLazyDynamicRun = this.pendingVisibleLazyDynamicRun || countDynamicRun;
      } else {
        for (const root of roots) this.addPendingRoot(root, false);
      }
      return;
    }

    this.flushing = true;
    const operationId = this.operationId;
    const previousPhase = this.status.phase;
    this.setStatus({ ...this.status, phase: "updating", observation: "observing", lastError: undefined });

    try {
      let reportedSummary: TranslationPageSummary = { ...EMPTY_SUMMARY };
      const reportProgress = (delta: TranslationProgressDelta): void => {
        if (operationId !== this.operationId) return;
        reportedSummary = mergeSummary(reportedSummary, delta);
        const nextSummary = mergeSummary(this.status, delta);
        this.setStatus({
          ...nextSummary,
          phase: isSummaryComplete(nextSummary) ? phaseFromSummary(nextSummary) : "updating",
          observation: "observing",
          dynamicRuns: this.status.dynamicRuns,
          lastError: undefined,
        });
      };

      const dynamicSummary = await this.controller.translateNewContents(roots, reportProgress);

      if (operationId !== this.operationId) return;
      const summary = mergeSummary(this.status, subtractSummary(dynamicSummary, reportedSummary));
      const dynamicRuns = countDynamicRun && dynamicSummary.total > 0 ? this.status.dynamicRuns + 1 : this.status.dynamicRuns;
      const phase = phaseFromSummary(summary);
      this.setStatus({
        ...summary,
        phase,
        observation: this.activateDynamicObserver(phase),
        dynamicRuns,
        lastError: undefined,
      });
    } catch (error) {
      if (operationId !== this.operationId) return;
      const phase = this.status.translated > 0 ? "partial" : "failed";
      this.setStatus({
        ...this.status,
        phase,
        observation: this.activateDynamicObserver(phase),
        lastError: errorMessage(error),
      });
    } finally {
      this.flushing = false;
      if (operationId !== this.operationId) return;

      const pendingVisibleRoots = [...this.pendingVisibleLazyRoots].filter(
        (root) => root.isConnected && !this.shouldIgnoreRoot(root),
      );
      const pendingVisibleDynamicRun = this.pendingVisibleLazyDynamicRun;
      this.pendingVisibleLazyRoots.clear();
      this.pendingVisibleLazyDynamicRun = false;

      if (pendingVisibleRoots.length > 0 && this.canHandleDynamicMutations()) {
        void this.translateRoots(pendingVisibleRoots, pendingVisibleDynamicRun);
        return;
      }

      if (this.pendingRoots.size > 0 && this.canHandleDynamicMutations()) {
        this.scheduleFlush();
      } else if (this.status.phase === "updating") {
        this.setStatus({ ...this.status, phase: previousPhase, observation: this.activateDynamicObserver(previousPhase) });
      }
    }
  }

  private canHandleDynamicMutations(): boolean {
    return (canSupplement(this.status.phase) || this.status.phase === "updating") &&
      this.dynamicMode() !== "off" &&
      !this.dynamicSuspended;
  }

  private recordMutationVolume(count: number): boolean {
    const windowMs = this.options.mutationWindowMs ?? 5000;
    const now = Date.now();
    if (this.mutationWindowStartedAt === 0 || now - this.mutationWindowStartedAt > windowMs) {
      this.mutationWindowStartedAt = now;
      this.mutationNodesInWindow = 0;
    }

    this.mutationNodesInWindow += count;
    if (this.mutationNodesInWindow <= this.maxMutationNodesPerWindow()) return true;

    this.suspendDynamicTranslation();
    return false;
  }

  private suspendDynamicTranslation(): void {
    this.dynamicSuspended = true;
    this.pendingRoots.clear();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.disconnectMutationObserver();
    this.removeVisibilityListener();
    this.setStatus({ ...this.status, observation: "suspended", lastError: SUSPENDED_MESSAGE });
  }

  private resetMutationWindow(): void {
    this.mutationWindowStartedAt = 0;
    this.mutationNodesInWindow = 0;
  }

  private shouldIgnoreRoot(root: HTMLElement): boolean {
    return shouldIgnoreDynamicRoot(root, this.options.excludedDynamicSelectors ?? DEFAULT_EXCLUDED_DYNAMIC_SELECTORS);
  }

  private dynamicMode(): DynamicTranslationMode {
    return this.options.dynamicMode ?? "normal";
  }

  private maxQueueSize(): number {
    return this.options.maxQueueSize ?? (this.dynamicMode() === "conservative" ? 80 : 300);
  }

  private maxRootsPerFlush(): number {
    return this.options.maxRootsPerFlush ?? (this.dynamicMode() === "conservative" ? 6 : 20);
  }

  private maxObservedRoots(): number {
    return this.options.maxObservedRoots ?? (this.dynamicMode() === "conservative" ? 80 : 300);
  }

  private maxMutationNodesPerWindow(): number {
    return this.options.maxMutationNodesPerWindow ?? (this.dynamicMode() === "conservative" ? 240 : 1000);
  }

  private isPageVisible(): boolean {
    return document.visibilityState !== "hidden";
  }

  private addVisibilityListener(): void {
    if (this.listeningForVisibility) return;
    document.addEventListener("visibilitychange", this.handleVisibilityChangeBound, false);
    this.listeningForVisibility = true;
  }

  private removeVisibilityListener(): void {
    if (!this.listeningForVisibility) return;
    document.removeEventListener("visibilitychange", this.handleVisibilityChangeBound, false);
    this.listeningForVisibility = false;
  }

  private setStatus(status: Omit<PageTranslationStatus, "pendingRoots" | "observedRoots" | "diagnostics" | "site"> & {
    diagnostics?: TranslationDiagnostics;
    site?: PageTranslationSiteStatus;
  }): void {
    const site = status.site ?? this.options.site;
    this.status = {
      ...status,
      pendingRoots: this.pendingRoots.size,
      observedRoots: this.lazyObservedRoots.size,
      diagnostics: status.diagnostics ?? this.controller.getDiagnostics(),
      ...(site ? { site } : {}),
    };
    for (const listener of this.listeners) listener(this.getStatus());
  }
}

function phaseFromSummary(summary: TranslationPageSummary): PageTranslationPhase {
  if (summary.total === 0) return "translated";
  if (summary.failed > 0 || summary.skipped > 0) return summary.translated > 0 ? "partial" : "failed";
  return "translated";
}

function isSummaryComplete(summary: TranslationPageSummary): boolean {
  return summary.total > 0 && summary.translated + summary.failed + summary.skipped >= summary.total;
}

function mergeSummary(left: TranslationPageSummary, right: TranslationPageSummary): TranslationPageSummary {
  return {
    total: left.total + right.total,
    translated: left.translated + right.translated,
    failed: left.failed + right.failed,
    skipped: left.skipped + right.skipped,
  };
}

function subtractSummary(left: TranslationPageSummary, right: TranslationPageSummary): TranslationPageSummary {
  return {
    total: Math.max(0, left.total - right.total),
    translated: Math.max(0, left.translated - right.translated),
    failed: Math.max(0, left.failed - right.failed),
    skipped: Math.max(0, left.skipped - right.skipped),
  };
}

function canSupplement(phase: PageTranslationPhase): boolean {
  return phase === "translated" || phase === "partial";
}

function rootFromAddedNode(node: Node): HTMLElement | null {
  if (node instanceof HTMLElement) return node;
  const parent = node.parentNode;
  return parent instanceof HTMLElement ? parent : null;
}

function shouldIgnoreDynamicRoot(root: HTMLElement, selectors: readonly string[]): boolean {
  for (const selector of selectors) {
    try {
      if (root.closest(selector)) return true;
    } catch {
      continue;
    }
  }
  return false;
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
