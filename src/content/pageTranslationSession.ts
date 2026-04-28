import type { PageController, TranslationPageSummary } from "./pageController";

export type PageTranslationPhase = "idle" | "translating" | "translated" | "updating" | "partial" | "failed";

export type PageTranslationStatus = TranslationPageSummary & {
  phase: PageTranslationPhase;
  dynamicRuns: number;
  lastError: string | undefined;
};

type PageTranslationSessionOptions = {
  observeRoot?: HTMLElement;
  debounceMs?: number;
  lazy?: boolean;
  lazyRootMargin?: string;
  lazyThreshold?: number;
};

type StatusListener = (status: PageTranslationStatus) => void;

const EMPTY_SUMMARY: TranslationPageSummary = {
  total: 0,
  translated: 0,
  failed: 0,
  skipped: 0,
};

export class PageTranslationSession {
  private status: PageTranslationStatus = { ...EMPTY_SUMMARY, phase: "idle", dynamicRuns: 0, lastError: undefined };
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

  constructor(
    private readonly controller: PageController,
    private readonly options: PageTranslationSessionOptions = {},
  ) {}

  getStatus(): PageTranslationStatus {
    return { ...this.status };
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
    this.setStatus({ ...EMPTY_SUMMARY, phase: "translating", dynamicRuns: 0, lastError: undefined });

    try {
      if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
        this.controller.restorePage();
        this.setStatus({ ...EMPTY_SUMMARY, phase: "translated", dynamicRuns: 0, lastError: undefined });
        this.observeLazyRoots(this.controller.collectTranslatableRoots(root), false);
        this.startObserver();
        return this.getStatus();
      }

      const summary = await this.controller.translatePage(root);
      if (operationId !== this.operationId) return this.getStatus();
      this.setStatus({ ...summary, phase: phaseFromSummary(summary), dynamicRuns: 0, lastError: undefined });
      this.startObserver();
    } catch (error) {
      if (operationId !== this.operationId) return this.getStatus();
      this.setStatus({ ...EMPTY_SUMMARY, phase: "failed", dynamicRuns: 0, lastError: errorMessage(error) });
    }

    return this.getStatus();
  }

  restorePage(): void {
    ++this.operationId;
    this.stopObserver();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    this.controller.restorePage();
    this.setStatus({ ...EMPTY_SUMMARY, phase: "idle", dynamicRuns: 0, lastError: undefined });
  }

  dispose(): void {
    this.stopObserver();
    this.listeners.clear();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
  }

  private startObserver(): void {
    const root = this.options.observeRoot ?? document.body;
    if (!root || typeof MutationObserver === "undefined") return;

    this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
    this.observer.observe(root, { childList: true, subtree: true });
  }

  private stopObserver(): void {
    this.observer?.disconnect();
    this.observer = undefined;
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
    if (!canSupplement(this.status.phase)) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const root = rootFromAddedNode(node);
        if (!root || !root.isConnected || shouldIgnoreRoot(root)) continue;
        this.addPendingRoot(root);
      }
    }

    if (this.pendingRoots.size === 0) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.flushPendingRoots();
    }, this.options.debounceMs ?? 250);
  }

  private addPendingRoot(root: HTMLElement): void {
    for (const pending of [...this.pendingRoots]) {
      if (pending instanceof Node && pending.contains(root)) return;
      if (root.contains(pending as Node)) this.pendingRoots.delete(pending);
    }
    this.pendingRoots.add(root);
  }

  private async flushPendingRoots(): Promise<void> {
    if (this.flushing || this.pendingRoots.size === 0 || !canSupplement(this.status.phase)) return;
    const roots = [...this.pendingRoots].filter((root): root is HTMLElement => root instanceof HTMLElement && root.isConnected && !shouldIgnoreRoot(root));
    this.pendingRoots.clear();

    if (roots.length === 0) return;
    if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
      this.observeLazyRoots(roots, true);
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
      if (!root.isConnected || shouldIgnoreRoot(root) || this.lazyObservedRoots.has(root)) continue;
      if (countDynamicRun) this.dynamicLazyRoots.add(root);
      this.lazyObservedRoots.add(root);
      this.lazyObserver.observe(root);
    }
  }

  private handleLazyIntersections(entries: IntersectionObserverEntry[]): void {
    const visibleRoots: HTMLElement[] = [];
    let countDynamicRun = false;

    for (const entry of entries) {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
      const root = entry.target;
      this.lazyObserver?.unobserve(root);
      this.lazyObservedRoots.delete(root);
      if (shouldIgnoreRoot(root)) continue;
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
        for (const root of roots) this.pendingRoots.add(root);
      }
      return;
    }

    this.flushing = true;
    const operationId = this.operationId;
    const previousPhase = this.status.phase;
    this.setStatus({ ...this.status, phase: "updating", lastError: undefined });

    try {
      let dynamicSummary: TranslationPageSummary = { ...EMPTY_SUMMARY };
      for (const root of roots) {
        if (operationId !== this.operationId) return;
        dynamicSummary = mergeSummary(dynamicSummary, await this.controller.translateNewContent(root));
      }

      if (operationId !== this.operationId) return;
      const summary = mergeSummary(this.status, dynamicSummary);
      const dynamicRuns = countDynamicRun && dynamicSummary.total > 0 ? this.status.dynamicRuns + 1 : this.status.dynamicRuns;
      this.setStatus({ ...summary, phase: phaseFromSummary(summary), dynamicRuns, lastError: undefined });
    } catch (error) {
      if (operationId !== this.operationId) return;
      this.setStatus({
        ...this.status,
        phase: this.status.translated > 0 ? "partial" : "failed",
        lastError: errorMessage(error),
      });
    } finally {
      this.flushing = false;
      if (operationId !== this.operationId) return;

      const pendingVisibleRoots = [...this.pendingVisibleLazyRoots].filter(
        (root) => root.isConnected && !shouldIgnoreRoot(root),
      );
      const pendingVisibleDynamicRun = this.pendingVisibleLazyDynamicRun;
      this.pendingVisibleLazyRoots.clear();
      this.pendingVisibleLazyDynamicRun = false;

      if (pendingVisibleRoots.length > 0 && canSupplement(this.status.phase)) {
        void this.translateRoots(pendingVisibleRoots, pendingVisibleDynamicRun);
        return;
      }

      if (this.pendingRoots.size > 0 && canSupplement(this.status.phase)) {
        this.debounceTimer = setTimeout(() => {
          this.debounceTimer = undefined;
          void this.flushPendingRoots();
        }, this.options.debounceMs ?? 250);
      } else if (this.status.phase === "updating") {
        this.setStatus({ ...this.status, phase: previousPhase });
      }
    }
  }

  private setStatus(status: PageTranslationStatus): void {
    this.status = status;
    for (const listener of this.listeners) listener(this.getStatus());
  }
}

function phaseFromSummary(summary: TranslationPageSummary): PageTranslationPhase {
  if (summary.total === 0) return "translated";
  if (summary.failed > 0 || summary.skipped > 0) return summary.translated > 0 ? "partial" : "failed";
  return "translated";
}

function mergeSummary(left: TranslationPageSummary, right: TranslationPageSummary): TranslationPageSummary {
  return {
    total: left.total + right.total,
    translated: left.translated + right.translated,
    failed: left.failed + right.failed,
    skipped: left.skipped + right.skipped,
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

function shouldIgnoreRoot(root: HTMLElement): boolean {
  return Boolean(root.closest('[data-imt-managed="true"], [data-imt-state="translated"], script, style, template, noscript'));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
