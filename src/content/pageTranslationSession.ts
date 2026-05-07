import type { BatchProfile, PageController, TranslationPageSummary, TranslationProgressDelta } from "./pageController";
import {
  DEFAULT_EXCLUDED_DYNAMIC_SELECTORS,
  type DynamicModeSource,
  type DynamicTranslationMode,
  type SitePolicyRuleResolution,
} from "./sitePolicy";
import { normalizeVisibleText } from "../shared/normalize";
import { isMeaningfulText } from "../shared/skipRules";
import type { PageRenderState } from "../shared/config";
import type { TranslationDiagnostics } from "./translationDiagnostics";
import type {
  WebTranslationFallbackProfile,
  WebTranslationRuleCapability,
  WebTranslationRuleSource,
} from "../shared/webRuleTypes";

export type PageTranslationPhase = "idle" | "translating" | "translated" | "updating" | "partial" | "failed";
export type DynamicObservationState = "inactive" | "observing" | "queued" | "paused" | "suspended";

export type PageTranslationSiteStatus = {
  hostname: string;
  siteKey: string;
  ruleId: string;
  ruleSource: WebTranslationRuleSource;
  ruleCapability: WebTranslationRuleCapability;
  fallbackProfile: WebTranslationFallbackProfile;
  mergedRuleIds: readonly string[];
  ruleResolution?: SitePolicyRuleResolution;
  dynamicMode: DynamicTranslationMode;
  dynamicModeSource: DynamicModeSource;
  isHighDynamic: boolean;
  ruleDiagnostics?: PageTranslationRuleDiagnostics;
};

export type PageTranslationRuleDiagnostics = {
  scanRootSelectorCount: number;
  contentSelectorCount: number;
  excludeSelectorCount: number;
  buildContainerSelectorCount: number;
  skipBuildContainerSelectorCount: number;
  injectedCssRuleCount: number;
  globalAttributeRuleCount: number;
  attributeNameCount: number;
  translationClassCount: number;
  containerMinTextCount?: number;
  lineBreakMaxTextCount?: number;
  allowTooltip: boolean;
  observeUrlChange: boolean;
  urlChangeDelay: number;
  maxQueueSize: number;
  maxRootsPerFlush: number;
  maxObservedRoots: number;
  maxMutationNodesPerWindow: number;
  mutationWindowMs: number;
  viewportSupplement: boolean;
  viewportSupplementMaxRoots: number;
  visualizationSelectors: readonly PageTranslationRuleVisualizationSelector[];
};

export type PageTranslationRuleVisualizationSelector = {
  group: PageTranslationRuleVisualizationGroup;
  selector: string;
  label?: string;
};

export type PageTranslationRuleVisualizationGroup =
  | "scan-root"
  | "text-candidate"
  | "content"
  | "exclude"
  | "build-container"
  | "skip-build-container"
  | "dynamic-exclude";

export type PageTranslationStatus = TranslationPageSummary & {
  phase: PageTranslationPhase;
  observation: DynamicObservationState;
  pendingRoots: number;
  observedRoots: number;
  dynamicRuns: number;
  lastError: string | undefined;
  renderState?: PageRenderState;
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
  firstWaveMaxRoots?: number;
  eagerTranslateRest?: boolean;
  backgroundEagerMaxRoots?: number;
  useBatchProfiles?: boolean;
  viewportFirst?: boolean;
  viewportSupplement?: boolean;
  viewportSupplementDebounceMs?: number;
  viewportSupplementRootMargin?: string;
  viewportSupplementMaxRoots?: number;
  lazyDiscoveryDelayMs?: number;
  dynamicMode?: DynamicTranslationMode;
  excludedDynamicSelectors?: readonly string[];
  maxQueueSize?: number;
  maxRootsPerFlush?: number;
  maxObservedRoots?: number;
  maxMutationNodesPerWindow?: number;
  mutationWindowMs?: number;
  observeUrlChange?: boolean;
  urlChangeDelay?: number;
  tooltipDebounceMs?: number;
  renderState?: PageRenderState;
  site?: PageTranslationSiteStatus;
  onUrlChange?: PageTranslationUrlChangeHandler;
};

type StatusListener = (status: PageTranslationStatus) => void;

type PendingRootOptions = {
  allowTranslatedRoot?: boolean;
};

export type PageTranslationUrlChange = {
  previousUrl: string;
  currentUrl: string;
};

export type PageTranslationUrlChangeHandler = (
  change: PageTranslationUrlChange,
) => boolean | Promise<boolean>;

const EMPTY_SUMMARY: TranslationPageSummary = {
  total: 0,
  translated: 0,
  failed: 0,
  skipped: 0,
};

const SUSPENDED_MESSAGE = "Dynamic translation paused because this page is changing too quickly.";
const URL_CHANGE_EVENT = "imt:urlchange";

let historyUrlChangeEventsPatched = false;

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
  private readonly pendingRoots = new Set<HTMLElement>();
  private readonly pendingRootOptions = new WeakMap<HTMLElement, PendingRootOptions>();
  private observer: MutationObserver | undefined;
  private lazyObserver: IntersectionObserver | undefined;
  private readonly lazyObservedRoots = new Set<HTMLElement>();
  private readonly dynamicLazyRoots = new WeakSet<HTMLElement>();
  private readonly pendingVisibleLazyRoots = new Set<HTMLElement>();
  private pendingVisibleLazyDynamicRun = false;
  private pendingVisibleLazyBatchProfile: BatchProfile = "normal";
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private lazyDiscoveryTimer: ReturnType<typeof setTimeout> | undefined;
  private debounceDueAt = 0;
  private operationId = 0;
  private flushing = false;
  private dynamicSuspended = false;
  private mutationWindowStartedAt = 0;
  private mutationNodesInWindow = 0;
  private listeningForVisibility = false;
  private listeningForUrlChange = false;
  private lastObservedUrl = globalThis.location?.href ?? "";
  private urlChangeTimer: ReturnType<typeof setTimeout> | undefined;
  private viewportSupplementTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly handleVisibilityChangeBound = () => this.handleVisibilityChange();
  private readonly handleUrlChangeBound = () => this.handleUrlChange();
  private readonly handleViewportScrollBound = () => this.handleViewportScroll();
  private renderState: PageRenderState;
  private listeningForViewportScroll = false;

  constructor(
    private readonly controller: PageController,
    private readonly options: PageTranslationSessionOptions = {},
  ) {
    this.renderState = options.renderState ?? "smart";
    this.status = { ...this.status, renderState: this.renderState };
  }

  getStatus(): PageTranslationStatus {
    return {
      ...this.status,
      ...(this.status.site || !this.options.site ? {} : { site: this.options.site }),
    };
  }

  collectTranslatableRoots(root: ParentNode = this.options.observeRoot ?? document.body): HTMLElement[] {
    return this.controller.collectTranslatableRoots(root);
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
    this.pendingVisibleLazyBatchProfile = "normal";
    this.dynamicSuspended = false;
    this.resetMutationWindow();
    this.lastObservedUrl = globalThis.location?.href ?? this.lastObservedUrl;
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
        if (this.options.viewportFirst) {
          const firstWaveRoots = this.controller.collectViewportTranslatableRoots(root, {
            rootMargin: this.options.eagerLazyRootMargin ?? this.options.lazyRootMargin ?? "900px",
            maxRoots: this.options.firstWaveMaxRoots ?? this.options.maxEagerLazyRoots ?? 120,
          });
          const observation = this.activateDynamicObserver("translated");
          this.setStatus({
            ...EMPTY_SUMMARY,
            phase: firstWaveRoots.length > 0 ? "updating" : "translated",
            observation,
            dynamicRuns: 0,
            lastError: undefined,
          });
          if (firstWaveRoots.length > 0) {
            this.scheduleLazyRootDiscovery(root, operationId, firstWaveRoots);
            void this.translateRoots(firstWaveRoots, false, this.batchProfile("first-wave"));
          } else {
            const fallbackRoots = this.controller.collectTranslatableRoots(root);
            const maxEagerRoots = this.options.firstWaveMaxRoots ?? this.options.maxEagerLazyRoots ?? 120;
            const eagerRoots = fallbackRoots.slice(0, maxEagerRoots);
            const deferredRoots = fallbackRoots.slice(eagerRoots.length);
            this.observeLazyRoots(deferredRoots, false);
            this.setStatus({
              ...EMPTY_SUMMARY,
              phase: eagerRoots.length > 0 || fallbackRoots.length === 0 ? "updating" : "translated",
              observation,
              dynamicRuns: 0,
              lastError: undefined,
            });
            if (eagerRoots.length > 0) void this.translateRoots(eagerRoots, false, this.batchProfile("first-wave"));
            else if (fallbackRoots.length === 0) {
              const rootElement = root instanceof HTMLElement ? root : root instanceof Document ? root.body : undefined;
              if (rootElement) void this.translateRoots([rootElement], false, this.batchProfile("first-wave"));
            }
          }
          return this.getStatus();
        }

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
        if (eagerRoots.length > 0) void this.translateRoots(eagerRoots, false, this.batchProfile("first-wave"));
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
    this.pendingVisibleLazyBatchProfile = "normal";
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

  setRenderState(renderState: PageRenderState): PageTranslationStatus {
    this.renderState = renderState;
    this.controller.setRenderState(renderState);
    this.setStatus({ ...this.status });
    return this.getStatus();
  }

  dispose(): void {
    this.stopObserver();
    this.listeners.clear();
    this.pendingRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    this.pendingVisibleLazyBatchProfile = "normal";
  }

  private activateDynamicObserver(phase: PageTranslationPhase = this.status.phase): DynamicObservationState {
    const pendingMutations = this.collectPendingMutationRecords();
    this.removeUrlChangeListener();
    this.updateViewportSupplementListener(canSupplement(phase) && this.dynamicMode() !== "off" && !this.dynamicSuspended);
    if (this.dynamicSuspended) {
      this.disconnectMutationObserver();
      return "suspended";
    }
    if (!canSupplement(phase) || this.dynamicMode() === "off") {
      this.disconnectMutationObserver();
      this.removeVisibilityListener();
      this.removeViewportSupplementListener();
      return "inactive";
    }
    this.addVisibilityListener();
    this.addUrlChangeListener();
    if (!this.isPageVisible()) {
      this.disconnectMutationObserver();
      return "paused";
    }
    if (!this.connectMutationObserver()) return "inactive";
    if (pendingMutations.length > 0) this.handleMutations(pendingMutations);
    return this.pendingRoots.size > 0 ? "queued" : "observing";
  }

  private connectMutationObserver(): boolean {
    if (this.observer) return true;
    const root = this.options.observeRoot ?? document.body;
    if (!root || typeof MutationObserver === "undefined") return false;

    this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
    this.observer.observe(root, {
      attributes: true,
      attributeFilter: ["placeholder", "alt", "title", "aria-label"],
      characterData: true,
      childList: true,
      subtree: true,
    });
    return true;
  }

  private collectPendingMutationRecords(): MutationRecord[] {
    return this.observer?.takeRecords() ?? [];
  }

  private disconnectMutationObserver(): void {
    const observer = this.observer;
    if (!observer) return;
    observer.disconnect();
    observer.takeRecords();
    this.observer = undefined;
  }

  private stopObserver(): void {
    this.disconnectMutationObserver();
    this.removeVisibilityListener();
    this.removeUrlChangeListener();
    this.lazyObserver?.disconnect();
    this.lazyObserver = undefined;
    this.lazyObservedRoots.clear();
    this.pendingVisibleLazyRoots.clear();
    this.pendingVisibleLazyDynamicRun = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
      this.debounceDueAt = 0;
    }
    if (this.lazyDiscoveryTimer) {
      clearTimeout(this.lazyDiscoveryTimer);
      this.lazyDiscoveryTimer = undefined;
    }
    if (this.urlChangeTimer) {
      clearTimeout(this.urlChangeTimer);
      this.urlChangeTimer = undefined;
    }
    if (this.viewportSupplementTimer) {
      clearTimeout(this.viewportSupplementTimer);
      this.viewportSupplementTimer = undefined;
    }
    this.removeViewportSupplementListener();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (!this.canHandleDynamicMutations()) return;

    const roots: { root: HTMLElement; allowTranslatedRoot: boolean }[] = [];
    let hasHoverOverlayRoot = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          const root = rootFromAddedNode(node);
          if (!root || !root.isConnected || this.shouldIgnoreRoot(root, true)) continue;
          if (!hasPotentialTranslatableContent(root)) continue;
          if (isLikelyHoverOverlayRoot(root)) hasHoverOverlayRoot = true;
          roots.push({ root, allowTranslatedRoot: true });
        }
        continue;
      }

      const changedRoot = rootFromChangedMutation(mutation);
      if (!changedRoot || !changedRoot.isConnected || this.shouldIgnoreRoot(changedRoot, true)) continue;
      if (!hasPotentialTranslatableContent(changedRoot)) continue;
      if (isLikelyHoverOverlayRoot(changedRoot)) hasHoverOverlayRoot = true;
      roots.push({ root: changedRoot, allowTranslatedRoot: true });
    }

    if (roots.length === 0) return;
    if (!this.recordMutationVolume(roots.length)) return;

    for (const { root, allowTranslatedRoot } of roots) {
      if (!this.addPendingRoot(root, false, { allowTranslatedRoot })) return;
    }

    if (this.pendingRoots.size === 0) return;
    this.scheduleFlush(hasHoverOverlayRoot ? this.tooltipDebounceMs() : undefined);
  }

  private handleVisibilityChange(): void {
    if (this.dynamicSuspended || !canSupplement(this.status.phase) || this.dynamicMode() === "off") return;

    if (!this.isPageVisible()) {
      this.disconnectMutationObserver();
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = undefined;
        this.debounceDueAt = 0;
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

  private handleUrlChange(): void {
    if (!this.options.observeUrlChange || !this.canHandleDynamicMutations()) return;
    const currentUrl = globalThis.location?.href ?? "";
    if (!currentUrl || currentUrl === this.lastObservedUrl) return;
    const previousUrl = this.lastObservedUrl;
    this.lastObservedUrl = currentUrl;

    if (this.urlChangeTimer) clearTimeout(this.urlChangeTimer);
    this.urlChangeTimer = setTimeout(() => {
      void this.handleUrlChangeAfterDelay(previousUrl, currentUrl);
    }, Math.max(0, this.options.urlChangeDelay ?? 250));
  }

  private async handleUrlChangeAfterDelay(previousUrl: string, currentUrl: string): Promise<void> {
    try {
      this.urlChangeTimer = undefined;
      if (!this.canHandleDynamicMutations()) return;
      if (await this.options.onUrlChange?.({ previousUrl, currentUrl })) return;
      const root = this.options.observeRoot ?? document.body;
      if (root instanceof HTMLElement && root.isConnected) {
        this.controller.restorePage();
        this.pendingRoots.clear();
        this.addPendingRoot(root, false, { allowTranslatedRoot: true });
        this.scheduleFlush(0);
      }
    } catch (error) {
      this.setStatus({
        ...this.status,
        observation: this.activateDynamicObserver(this.status.phase),
        lastError: errorMessage(error),
      });
    }
  }

  private handleViewportScroll(): void {
    if (!this.options.viewportSupplement || !this.canHandleDynamicMutations()) return;
    this.scheduleViewportSupplement();
  }

  private scheduleViewportSupplement(delayMs = this.viewportSupplementDebounceMs()): void {
    if (!this.options.viewportSupplement || this.dynamicSuspended || !this.canHandleDynamicMutations()) return;
    if (this.viewportSupplementTimer) clearTimeout(this.viewportSupplementTimer);
    if (this.isPageVisible()) this.setStatus({ ...this.status, observation: "queued" });
    this.viewportSupplementTimer = setTimeout(() => {
      this.viewportSupplementTimer = undefined;
      void this.flushViewportSupplement();
    }, delayMs);
  }

  private async flushViewportSupplement(): Promise<void> {
    if (!this.options.viewportSupplement || !this.canHandleDynamicMutations()) return;
    const root = this.options.observeRoot ?? document.body;
    if (!(root instanceof HTMLElement)) return;

    const roots = this.controller.collectViewportTranslatableRoots(root, {
      rootMargin: this.options.viewportSupplementRootMargin ?? this.options.eagerLazyRootMargin ?? "900px",
      maxRoots: this.options.viewportSupplementMaxRoots ?? this.maxRootsPerFlush(),
    }).filter((candidate) => candidate.isConnected && !this.shouldIgnoreRoot(candidate));

    if (roots.length === 0) {
      this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }

    await this.translateRoots(roots, true, this.batchProfile("dynamic"));
  }

  private addPendingRoot(
    root: HTMLElement,
    notify = true,
    options: PendingRootOptions = {},
  ): boolean {
    if (this.dynamicSuspended || this.shouldIgnoreRoot(root, options.allowTranslatedRoot)) return true;
    const allowTranslatedRoot = Boolean(options.allowTranslatedRoot);

    for (const pending of [...this.pendingRoots]) {
      const pendingAllowsTranslatedRoot = Boolean(this.pendingRootOptions.get(pending)?.allowTranslatedRoot);
      if (pending.contains(root)) {
        if (allowTranslatedRoot && !pendingAllowsTranslatedRoot && root.closest('[data-imt-state="translated"]')) {
          continue;
        }
        if (allowTranslatedRoot && !pendingAllowsTranslatedRoot) {
          this.pendingRootOptions.set(pending, { allowTranslatedRoot: true });
        }
        return true;
      }
      if (root.contains(pending)) {
        if (pendingAllowsTranslatedRoot && !allowTranslatedRoot) continue;
        this.pendingRoots.delete(pending);
      }
    }
    this.pendingRoots.add(root);
    this.pendingRootOptions.set(root, { allowTranslatedRoot });

    if (this.pendingRoots.size > this.maxQueueSize()) {
      this.suspendDynamicTranslation();
      return false;
    }

    if (notify) this.setStatus({ ...this.status, observation: "queued" });
    return true;
  }

  private scheduleFlush(delayMs = this.dynamicDebounceMs()): void {
    if (this.dynamicSuspended) return;
    if (!this.isPageVisible()) {
      this.setStatus({ ...this.status, observation: "paused" });
      return;
    }
    const dueAt = Date.now() + delayMs;
    if (this.debounceTimer && this.debounceDueAt > 0 && this.debounceDueAt <= dueAt) {
      this.setStatus({ ...this.status, observation: "queued" });
      return;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.setStatus({ ...this.status, observation: "queued" });
    this.debounceDueAt = dueAt;
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.debounceDueAt = 0;
      void this.flushPendingRoots();
    }, delayMs);
  }

  private async flushPendingRoots(): Promise<void> {
    if (this.flushing || this.pendingRoots.size === 0 || !this.canHandleDynamicMutations()) return;
    if (!this.isPageVisible()) {
      this.setStatus({ ...this.status, observation: "paused" });
      return;
    }

    const allRoots = [...this.pendingRoots]
      .map((root) => ({ root, options: this.pendingRootOptions.get(root) ?? {} }))
      .filter(({ root, options }) =>
        root.isConnected &&
        !this.shouldIgnoreRoot(root, options.allowTranslatedRoot || root.getAttribute("data-imt-state") === "translated")
      );
    this.pendingRoots.clear();

    const rootEntries = allRoots.slice(0, this.maxRootsPerFlush());
    const roots = rootEntries.map(({ root }) => root);
    for (const { root: overflowRoot, options } of allRoots.slice(this.maxRootsPerFlush())) {
      this.addPendingRoot(overflowRoot, false, options);
    }

    if (roots.length === 0) {
      this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }

    if (this.options.lazy && !this.options.eagerTranslateRest && typeof IntersectionObserver !== "undefined") {
      const { eagerRoots, deferredRoots } = this.partitionDynamicLazyRoots(roots);
      this.observeLazyRoots(deferredRoots, true);
      if (eagerRoots.length > 0) {
        await this.translateRoots(eagerRoots, true, this.batchProfile("dynamic"));
        return;
      }
      if (this.pendingRoots.size > 0) this.scheduleFlush();
      else this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }

    await this.translateRoots(roots, true, this.batchProfile("dynamic"));
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
      if (!root.isConnected || this.shouldIgnoreRoot(root, countDynamicRun) || this.lazyObservedRoots.has(root)) continue;
      if (this.lazyObservedRoots.size >= this.maxObservedRoots()) {
        this.addPendingRoot(root, false);
        continue;
      }
      if (countDynamicRun) this.dynamicLazyRoots.add(root);
      this.lazyObservedRoots.add(root);
      this.lazyObserver.observe(root);
    }
  }

  private scheduleLazyRootDiscovery(root: ParentNode, operationId: number, firstWaveRoots: readonly HTMLElement[]): void {
    if (this.lazyDiscoveryTimer) clearTimeout(this.lazyDiscoveryTimer);
    const delayMs = Math.max(0, this.options.lazyDiscoveryDelayMs ?? 80);
    this.lazyDiscoveryTimer = setTimeout(() => {
      this.lazyDiscoveryTimer = undefined;
      this.discoverLazyRoots(root, operationId, firstWaveRoots);
    }, delayMs);
  }

  private discoverLazyRoots(root: ParentNode, operationId: number, firstWaveRoots: readonly HTMLElement[]): void {
    if (operationId !== this.operationId || !this.options.lazy || typeof IntersectionObserver === "undefined") return;
    const handledRoots = new Set(firstWaveRoots);
    const initialRoots = this.controller.collectTranslatableRoots(root).filter((candidate) => {
      if (!candidate.isConnected || this.shouldIgnoreRoot(candidate)) return false;
      for (const handled of handledRoots) {
        if (handled === candidate || handled.contains(candidate) || candidate.contains(handled)) return false;
      }
      return true;
    });
    if (this.options.eagerTranslateRest) {
      const maxBackgroundRoots = normalizeInteger(this.options.backgroundEagerMaxRoots, 360, 1, 1000);
      const backgroundRoots = initialRoots.slice(0, maxBackgroundRoots);
      const overflowRoots = initialRoots.slice(backgroundRoots.length);
      this.observeLazyRoots(overflowRoots, false);
      if (backgroundRoots.length > 0) {
        void this.translateRoots(backgroundRoots, false, this.batchProfile("normal"));
        return;
      }
      this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
      return;
    }
    const { eagerRoots, deferredRoots } = this.partitionInitialLazyRoots(initialRoots);
    this.observeLazyRoots(deferredRoots, false);
    if (eagerRoots.length > 0) {
      void this.translateRoots(eagerRoots, false, this.batchProfile("normal"));
      return;
    }
    this.setStatus({ ...this.status, observation: this.activateDynamicObserver(this.status.phase) });
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

  private partitionDynamicLazyRoots(roots: HTMLElement[]): { eagerRoots: HTMLElement[]; deferredRoots: HTMLElement[] } {
    const eagerRoots: HTMLElement[] = [];
    const deferredRoots: HTMLElement[] = [];
    const rootMargin = this.options.eagerLazyRootMargin ?? this.options.lazyRootMargin ?? "900px";
    const maxEagerRoots = this.maxRootsPerFlush();

    for (const root of roots) {
      if (eagerRoots.length < maxEagerRoots && (isLikelyHoverOverlayRoot(root) || isNearViewport(root, rootMargin))) {
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
      const dynamicLazyRoot = this.dynamicLazyRoots.has(root);
      if (this.shouldIgnoreRoot(root, dynamicLazyRoot)) continue;
      if (dynamicLazyRoot) countDynamicRun = true;
      visibleRoots.push(root);
    }

    if (visibleRoots.length > 0) void this.translateRoots(visibleRoots, countDynamicRun, this.batchProfile(countDynamicRun ? "dynamic" : "normal"));
  }

  private async translateRoots(
    roots: HTMLElement[],
    countDynamicRun: boolean,
    batchProfile: BatchProfile = this.batchProfile(countDynamicRun ? "dynamic" : "normal"),
  ): Promise<void> {
    if (this.flushing) {
      if (this.options.lazy && typeof IntersectionObserver !== "undefined") {
        for (const root of roots) this.pendingVisibleLazyRoots.add(root);
        this.pendingVisibleLazyDynamicRun = this.pendingVisibleLazyDynamicRun || countDynamicRun;
        this.pendingVisibleLazyBatchProfile = mergeBatchProfiles(this.pendingVisibleLazyBatchProfile, batchProfile);
      } else {
        for (const root of roots) this.addPendingRoot(root, false);
      }
      return;
    }

    this.flushing = true;
    const operationId = this.operationId;
    const previousPhase = this.status.phase;
    const cleanupDynamicRootMarkers = countDynamicRun ? markDynamicRoots(roots) : () => {};
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

      const dynamicSummary = await this.controller.translateNewContents(roots, reportProgress, { batchProfile });

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
      cleanupDynamicRootMarkers();
      this.flushing = false;
      if (operationId !== this.operationId) return;

      const pendingVisibleDynamicRun = this.pendingVisibleLazyDynamicRun;
      const pendingVisibleBatchProfile = this.pendingVisibleLazyBatchProfile;
      const pendingVisibleRoots = [...this.pendingVisibleLazyRoots].filter(
        (root) =>
          root.isConnected &&
          !this.shouldIgnoreRoot(root, pendingVisibleDynamicRun || this.dynamicLazyRoots.has(root)),
      );
      this.pendingVisibleLazyRoots.clear();
      this.pendingVisibleLazyDynamicRun = false;
      this.pendingVisibleLazyBatchProfile = "normal";

      if (pendingVisibleRoots.length > 0 && this.canHandleDynamicMutations()) {
        void this.translateRoots(pendingVisibleRoots, pendingVisibleDynamicRun, pendingVisibleBatchProfile);
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

  private batchProfile(profile: BatchProfile): BatchProfile {
    return this.options.useBatchProfiles ? profile : "normal";
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
      this.debounceDueAt = 0;
    }
    this.disconnectMutationObserver();
    this.removeVisibilityListener();
    this.removeUrlChangeListener();
    this.removeViewportSupplementListener();
    if (this.viewportSupplementTimer) {
      clearTimeout(this.viewportSupplementTimer);
      this.viewportSupplementTimer = undefined;
    }
    this.setStatus({ ...this.status, observation: "suspended", lastError: SUSPENDED_MESSAGE });
  }

  private resetMutationWindow(): void {
    this.mutationWindowStartedAt = 0;
    this.mutationNodesInWindow = 0;
  }

  private shouldIgnoreRoot(root: HTMLElement, allowTranslatedRoot = false): boolean {
    return shouldIgnoreDynamicRoot(root, this.options.excludedDynamicSelectors ?? DEFAULT_EXCLUDED_DYNAMIC_SELECTORS, {
      allowTranslatedRoot,
    });
  }

  private dynamicMode(): DynamicTranslationMode {
    return this.options.dynamicMode ?? "normal";
  }

  private dynamicDebounceMs(): number {
    return this.options.debounceMs ?? 250;
  }

  private tooltipDebounceMs(): number {
    return Math.min(this.dynamicDebounceMs(), this.options.tooltipDebounceMs ?? 120);
  }

  private viewportSupplementDebounceMs(): number {
    return Math.max(0, this.options.viewportSupplementDebounceMs ?? 700);
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

  private addUrlChangeListener(): void {
    if (!this.options.observeUrlChange || this.listeningForUrlChange) return;
    ensureHistoryUrlChangeEvents();
    window.addEventListener("popstate", this.handleUrlChangeBound, false);
    window.addEventListener("hashchange", this.handleUrlChangeBound, false);
    window.addEventListener(URL_CHANGE_EVENT, this.handleUrlChangeBound, false);
    this.listeningForUrlChange = true;
  }

  private removeUrlChangeListener(): void {
    if (!this.listeningForUrlChange) return;
    window.removeEventListener("popstate", this.handleUrlChangeBound, false);
    window.removeEventListener("hashchange", this.handleUrlChangeBound, false);
    window.removeEventListener(URL_CHANGE_EVENT, this.handleUrlChangeBound, false);
    this.listeningForUrlChange = false;
  }

  private updateViewportSupplementListener(active: boolean): void {
    if (active && this.options.viewportSupplement) {
      this.addViewportSupplementListener();
      return;
    }
    this.removeViewportSupplementListener();
  }

  private addViewportSupplementListener(): void {
    if (this.listeningForViewportScroll) return;
    window.addEventListener("scroll", this.handleViewportScrollBound, { passive: true });
    this.listeningForViewportScroll = true;
  }

  private removeViewportSupplementListener(): void {
    if (!this.listeningForViewportScroll) return;
    window.removeEventListener("scroll", this.handleViewportScrollBound);
    this.listeningForViewportScroll = false;
  }

  private setStatus(status: Omit<PageTranslationStatus, "pendingRoots" | "observedRoots" | "diagnostics" | "site" | "renderState"> & {
    diagnostics?: TranslationDiagnostics;
    site?: PageTranslationSiteStatus;
  }): void {
    const site = status.site ?? this.options.site;
    this.status = {
      ...status,
      pendingRoots: this.pendingRoots.size,
      observedRoots: this.lazyObservedRoots.size,
      renderState: this.renderState,
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

function ensureHistoryUrlChangeEvents(): void {
  if (historyUrlChangeEventsPatched || !globalThis.history) return;
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  historyUrlChangeEventsPatched = true;
}

function patchHistoryMethod(method: "pushState" | "replaceState"): void {
  const original = history[method];
  history[method] = function patchedHistoryMethod(this: History, ...args: Parameters<History[typeof method]>) {
    const result = original.apply(this, args);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    return result;
  } as History[typeof method];
}

function rootFromChangedMutation(mutation: MutationRecord): HTMLElement | null {
  if (mutation.type === "characterData") {
    const parent = mutation.target.parentElement;
    if (!parent || parent.closest('[data-imt-managed="true"]')) return null;
    return parent.closest<HTMLElement>('[data-imt-state="translated"]') ?? findNearestTextRoot(parent);
  }

  if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
    const target = mutation.target;
    if (target.closest('[data-imt-managed="true"]')) return null;
    return target.closest<HTMLElement>('[data-imt-state="translated"]') ?? target;
  }

  return null;
}

function findNearestTextRoot(element: HTMLElement): HTMLElement {
  return element.closest<HTMLElement>(
    "button,[role='button'],td,th,li,p,blockquote,figcaption,h1,h2,h3,h4,h5,h6,label,legend,summary,a",
  ) ?? element;
}

function shouldIgnoreDynamicRoot(
  root: HTMLElement,
  selectors: readonly string[],
  options: { allowTranslatedRoot?: boolean } = {},
): boolean {
  for (const selector of selectors) {
    try {
      if (options.allowTranslatedRoot && isTranslatedStateSelector(selector) && root.closest(selector)) continue;
      if (root.closest(selector)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function isTranslatedStateSelector(selector: string): boolean {
  return selector.includes("data-imt-state") && selector.includes("translated");
}

function hasPotentialTranslatableContent(root: HTMLElement): boolean {
  const text = normalizeVisibleText(root.textContent ?? "");
  if (text && isMeaningfulText(text, "fallback")) return true;

  for (const attribute of ["placeholder", "alt", "title", "aria-label"] as const) {
    const value = normalizeVisibleText(root.getAttribute(attribute) ?? "");
    if (value && isMeaningfulText(value, "attribute")) return true;
  }

  const attributeElement = root.querySelector?.("[placeholder],[alt],[title],[aria-label]");
  if (!(attributeElement instanceof HTMLElement)) return false;
  for (const attribute of ["placeholder", "alt", "title", "aria-label"] as const) {
    const value = normalizeVisibleText(attributeElement.getAttribute(attribute) ?? "");
    if (value && isMeaningfulText(value, "attribute")) return true;
  }
  return false;
}

function isLikelyHoverOverlayRoot(root: HTMLElement): boolean {
  try {
    if (
      root.closest(
        [
          '[role="tooltip"]',
          "[popover]",
          "[data-tippy-root]",
          ".tippy-box",
          ".tooltip",
          ".popover",
          '[class*="tooltip"]',
          '[class*="popover"]',
        ].join(","),
      )
    ) {
      return true;
    }
  } catch {
    // Fall through to the positioned-overlay heuristic.
  }

  const text = root.textContent?.trim();
  if (!text || text.length > 2000) return false;
  const style = window.getComputedStyle(root);
  const zIndex = Number.parseInt(style.zIndex, 10);
  return (style.position === "fixed" || style.position === "absolute") && Number.isFinite(zIndex) && zIndex >= 10;
}

function markDynamicRoots(roots: readonly HTMLElement[]): () => void {
  const records: Array<{ root: HTMLElement; previous: string | null }> = [];
  for (const root of roots) {
    records.push({ root, previous: root.getAttribute("data-imt-dynamic-root") });
    root.setAttribute("data-imt-dynamic-root", "true");
  }
  return () => {
    for (const { root, previous } of records) {
      if (previous === null) root.removeAttribute("data-imt-dynamic-root");
      else root.setAttribute("data-imt-dynamic-root", previous);
    }
  };
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

function normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(Math.max(Math.round(numberValue), min), max);
}

function mergeBatchProfiles(left: BatchProfile, right: BatchProfile): BatchProfile {
  return batchProfileRank(right) > batchProfileRank(left) ? right : left;
}

function batchProfileRank(profile: BatchProfile): number {
  if (profile === "dynamic") return 2;
  if (profile === "first-wave") return 1;
  return 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
