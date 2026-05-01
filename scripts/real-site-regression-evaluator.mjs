const DYNAMIC_FIXTURE_KINDS = new Set([
  "social-feed",
  "video-list",
  "forum",
  "data-dashboard",
  "hover-tooltip",
  "ai-chat",
  "search-results",
]);

const CRITICAL_NEGATIVE_KINDS = new Set(["code", "price", "rating", "username", "url", "input"]);

const SCORE_WEIGHTS = {
  rule: 0.12,
  contentDiscovery: 0.22,
  unitBuild: 0.15,
  provider: 0.15,
  render: 0.18,
  negative: 0.15,
  dynamic: 0.08,
  restore: 0.05,
};

export function buildStructuredRegressionReport(input) {
  const {
    site,
    config,
    metrics,
    translateResponse,
    pageStatusResponse,
    firstProgress,
    dynamicActionResult,
    hoverResult,
    restoreResponse,
    restoreMetrics,
    timings,
    screenshotPath,
    extensionErrors,
    siteErrors,
    siteErrorCount,
    gateReason,
    expectation,
  } = input;
  const pageStatus = pageStatusResponse?.ok ? pageStatusResponse.status : undefined;
  const diagnostics = pageStatus?.diagnostics;

  const access = evaluateAccess(site, metrics, gateReason);
  const injection = evaluateInjection(metrics, pageStatusResponse);
  const ruleResolution = evaluateRuleResolution(pageStatus, metrics);
  const policyCompilation = evaluatePolicyCompilation(pageStatus, metrics);
  const contentDiscovery = evaluateContentDiscovery(diagnostics, metrics, expectation);
  const unitBuild = evaluateUnitBuild(pageStatus, diagnostics, expectation);
  const provider = evaluateProvider(pageStatus, diagnostics, config, translateResponse);
  const render = evaluateRender(pageStatus, metrics);
  const negativeSamples = evaluateNegativeSamples(metrics, expectation);
  const dynamic = evaluateDynamic(site, config, pageStatus, firstProgress, hoverResult, dynamicActionResult, expectation);
  const restore = evaluateRestore(metrics, restoreResponse, restoreMetrics, access);
  const score = calculateScore({
    access,
    ruleResolution,
    contentDiscovery,
    unitBuild,
    provider,
    render,
    negativeSamples,
    dynamic,
    restore,
  });

  const report = {
    ...site,
    providerName: config.provider,
    dynamicMode: config.dynamicMode,
    site: {
      name: site.name,
      host: site.host,
      url: site.url,
      finalUrl: metrics?.url ?? site.url,
      fixtureKind: site.fixtureKind ?? "generic",
    },
    verdict: "FAIL",
    score,
    access,
    injection,
    ruleResolution,
    policyCompilation,
    contentDiscovery,
    unitBuild,
    provider: provider,
    render,
    negativeSamples,
    dynamic,
    restore,
    evidence: {
      translatedTextSamples: metrics?.translatedTextSamples ?? [],
      untranslatedPositiveSamples: metrics?.positiveSamples?.untranslatedSamples ?? [],
      negativeViolationSamples: negativeSamples.violations.slice(0, 12),
      ruleVisualizationSelectors: metrics?.ruleVisualizationSelectors ?? [],
    },
    timings,
    translateResponse,
    pageStatusResponse,
    metrics,
    hoverResult,
    dynamicActionResult,
    firstProgress,
    restoreResponse,
    restoreMetrics,
    screenshotPath,
    errors: extensionErrors,
    siteErrors: siteErrors.slice(0, 10),
    siteErrorCount,
  };

  report.verdict = evaluatePageReport(report);
  report.ok = report.verdict !== "FAIL";
  report.skipped = report.verdict === "GATED";
  report.summary = summarizeReport(report);
  return report;
}

export function buildFailedRegressionReport({ site, config, error }) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? error.message : String(error);
  const access = {
    status: "network-failed",
    url: site.url,
    finalUrl: site.url,
    title: "",
    bodyTextLength: 0,
    bodyTextPreview: "",
    gateReason: undefined,
  };
  const failedStage = { status: "failed", error: message };
  const score = {
    access: 0,
    rule: 0,
    contentDiscovery: 0,
    unitBuild: 0,
    provider: 0,
    render: 0,
    negative: 0,
    dynamic: 0,
    restore: 0,
    total: 0,
  };

  return {
    ...site,
    providerName: config.provider,
    dynamicMode: config.dynamicMode,
    site: {
      name: site.name,
      host: site.host,
      url: site.url,
      finalUrl: site.url,
      fixtureKind: site.fixtureKind ?? "generic",
    },
    verdict: "FAIL",
    ok: false,
    skipped: false,
    score,
    access,
    injection: { ...failedStage, contentReady: false, hasFloatingControl: false, hasDebugApi: false },
    ruleResolution: emptyRuleResolution("miss"),
    policyCompilation: emptyPolicyCompilation("failed"),
    contentDiscovery: emptyContentDiscovery("failed", site.fixtureKind ?? "generic"),
    unitBuild: emptyUnitBuild("failed"),
    provider: emptyProvider("failed", config.provider, [message]),
    render: emptyRender("failed"),
    negativeSamples: { status: "ok", checked: 0, violations: [] },
    dynamic: { status: "not-applicable", observation: "inactive", initialTranslated: 0, dynamicRuns: 0, newlyAddedRoots: 0, newlyTranslatedRoots: 0, pendingRoots: 0, observedRoots: 0 },
    restore: { status: "failed", translatedDomBefore: 0, translatedDomAfter: 0, managedDomAfter: 0, loadingDomAfter: 0, textIntegrityOk: false, attributesRestored: false },
    evidence: {
      translatedTextSamples: [],
      untranslatedPositiveSamples: [],
      negativeViolationSamples: [],
      ruleVisualizationSelectors: [],
    },
    timings: { pageLoadMs: 0 },
    summary: message,
    errors: [stack],
  };
}

export function evaluatePageReport(report) {
  if (report.access.status === "gated") return "GATED";

  if (report.access.status !== "ok") return "FAIL";
  if (report.injection.status !== "ok") return "FAIL";
  if (report.contentDiscovery.status === "failed") return "FAIL";
  if (report.unitBuild.status === "failed") return "FAIL";
  if (report.provider.status === "failed") return "FAIL";
  if (report.render.status === "failed") return "FAIL";
  if (report.restore?.status === "failed") return "FAIL";
  if (report.negativeSamples.violations.some(isCriticalViolation)) return "FAIL";
  if (report.dynamic?.status === "failed") return "FAIL";

  if (report.score.total >= 85) return hasWarnStage(report) ? "WARN" : "PASS";
  if (report.score.total >= 70) return "WARN";
  return "FAIL";
}

export function isCriticalViolation(violation) {
  return CRITICAL_NEGATIVE_KINDS.has(violation.kind);
}

function hasWarnStage(report) {
  return Boolean(
    report.ruleResolution.hitLevel === "url-only" ||
    report.policyCompilation.status === "weak" ||
    report.contentDiscovery.status === "partial" ||
    report.unitBuild.status === "partial" ||
    report.provider.status === "partial" ||
    report.render.status === "partial" ||
    report.negativeSamples.status === "warn" ||
    report.dynamic?.status === "partial"
  );
}

function evaluateAccess(site, metrics, gateReason) {
  if (gateReason) {
    return {
      status: "gated",
      url: site.url,
      finalUrl: metrics?.url ?? site.url,
      title: metrics?.title ?? "",
      bodyTextLength: metrics?.bodyTextLength ?? 0,
      bodyTextPreview: metrics?.bodyTextPreview ?? "",
      gateReason,
    };
  }

  const bodyTextLength = metrics?.bodyTextLength ?? 0;
  return {
    status: bodyTextLength < 50 ? "empty-page" : "ok",
    url: site.url,
    finalUrl: metrics?.url ?? site.url,
    title: metrics?.title ?? "",
    bodyTextLength,
    bodyTextPreview: metrics?.bodyTextPreview ?? "",
    gateReason: undefined,
  };
}

function evaluateInjection(metrics, pageStatusResponse) {
  const contentReady = Boolean(metrics?.contentReady);
  const hasStatus = Boolean(pageStatusResponse?.ok);
  return {
    status: contentReady || hasStatus ? "ok" : "failed",
    contentReady,
    hasFloatingControl: Boolean(metrics?.floatingControl),
    hasDebugApi: Boolean(metrics?.hasDebugApi),
    ...(contentReady || hasStatus ? {} : { error: pageStatusResponse?.error ?? "content script did not respond" }),
  };
}

function evaluateRuleResolution(pageStatus, metrics) {
  const site = pageStatus?.site;
  if (!site) return emptyRuleResolution("miss");

  const ruleDiagnostics = site.ruleDiagnostics ?? {};
  const selectorMatchesCount = sumSelectorMatches(metrics?.ruleVisualizationSelectors);
  const contentSelectorMatchesCount = sumSelectorMatches(metrics?.ruleVisualizationSelectors, new Set(["scan-root", "content", "build-container"]));
  const isGeneric = site.ruleId === "general" && site.fallbackProfile === "generic";
  const hitLevel = isGeneric
    ? "generic"
    : site.ruleCapability === "content-ready" && contentSelectorMatchesCount > 0
      ? "content-ready"
      : selectorMatchesCount > 0
        ? "dom-verified"
        : "url-only";
  const status = site.ruleCapability === "unsafe"
    ? "conflict"
    : isGeneric
      ? "generic"
      : "hit";

  return {
    status,
    hitLevel,
    ruleId: site.ruleId,
    siteKey: site.siteKey,
    ruleSource: site.ruleSource,
    ruleCapability: site.ruleCapability,
    fallbackProfile: site.fallbackProfile,
    mergedRuleIds: [...(site.mergedRuleIds ?? [])],
    matchedBy: {
      url: !isGeneric,
      selector: selectorMatchesCount > 0,
      excludeUrl: false,
      excludeSelector: false,
    },
    selectorMatchesCount,
    preferredScanRootSelectorCount: ruleDiagnostics.scanRootSelectorCount ?? 0,
    contentSelectorCount: ruleDiagnostics.contentSelectorCount ?? 0,
    excludeSelectorCount: ruleDiagnostics.excludeSelectorCount ?? 0,
    injectedCssRuleCount: ruleDiagnostics.injectedCssRuleCount ?? 0,
  };
}

function evaluatePolicyCompilation(pageStatus, metrics) {
  const site = pageStatus?.site;
  if (!site) return emptyPolicyCompilation("failed");

  const diagnostics = site.ruleDiagnostics ?? {};
  const selectors = metrics?.ruleVisualizationSelectors ?? [];
  const preferredScanRootSelectors = selectors.filter((item) => item.group === "scan-root").map((item) => item.selector);
  const contentSelectors = selectors
    .filter((item) => item.group === "content")
    .map((item) => ({ selector: item.selector, category: item.label ?? "content-block" }));
  const excludeSelectors = selectors.filter((item) => item.group === "exclude").map((item) => item.selector);
  const buildContainerSelectors = selectors.filter((item) => item.group === "build-container").map((item) => item.selector);
  const skipBuildContainerSelectors = selectors.filter((item) => item.group === "skip-build-container").map((item) => item.selector);
  const injectedCss = diagnostics.injectedCssRuleCount > 0 ? [`[omitted: ${diagnostics.injectedCssRuleCount} rule(s)]`] : [];
  const dynamicSignals = Number(Boolean(diagnostics.observeUrlChange)) + Number((diagnostics.maxObservedRoots ?? 0) > 0);
  const policySignalCount = preferredScanRootSelectors.length +
    contentSelectors.length +
    excludeSelectors.length +
    buildContainerSelectors.length +
    skipBuildContainerSelectors.length +
    injectedCss.length +
    (diagnostics.globalAttributeRuleCount ?? 0) +
    dynamicSignals;
  const matchedPreferredOrContent = selectors.some((item) =>
    (item.group === "scan-root" || item.group === "content") && item.matchedCount > 0
  );
  const status = policySignalCount === 0 && site.ruleId !== "general"
    ? "failed"
    : (preferredScanRootSelectors.length > 0 || contentSelectors.length > 0) && !matchedPreferredOrContent
      ? "weak"
      : "ok";

  return {
    status,
    preferredScanRootSelectors,
    weakCandidateSelectors: [],
    contentSelectors,
    excludeSelectors,
    buildContainerSelectors,
    skipBuildContainerSelectors,
    injectedCss,
    globalAttributesCount: diagnostics.globalAttributeRuleCount ?? 0,
    dynamicPreset: site.isHighDynamic ? "high-dynamic" : undefined,
    observeUrlChange: Boolean(diagnostics.observeUrlChange),
    urlChangeDelay: diagnostics.urlChangeDelay ?? 0,
  };
}

function evaluateContentDiscovery(diagnostics, metrics, expectation) {
  const textScan = diagnostics?.scan?.text ?? {};
  const attributeScan = diagnostics?.scan?.attributes ?? {};
  const acceptedCandidateCount = (textScan.accepted ?? 0) + (attributeScan.accepted ?? 0);
  const rejectedCandidateCount = (textScan.skipped ?? 0) + (attributeScan.skipped ?? 0);
  const scanRootCount = Math.max(
    sumSelectorMatches(metrics?.ruleVisualizationSelectors, new Set(["scan-root"])),
    acceptedCandidateCount > 0 ? 1 : 0,
  );
  const minAccepted = expectation?.minAcceptedCandidates ?? 3;
  const status = scanRootCount === 0 || acceptedCandidateCount === 0
    ? "failed"
    : acceptedCandidateCount >= minAccepted
      ? "ok"
      : "partial";

  return {
    status,
    pageProfile: metrics?.fixtureKind ?? "generic",
    scanRootCount,
    highConfidenceRootCount: diagnostics?.candidates?.accepted ?? 0,
    preferredRootMatchCount: sumSelectorMatches(metrics?.ruleVisualizationSelectors, new Set(["scan-root"])),
    weakCandidateRootCount: 0,
    candidateCount: diagnostics?.candidates?.evaluated ?? (textScan.seen ?? 0),
    acceptedCandidateCount,
    rejectedCandidateCount,
    rootProfiles: { ...(diagnostics?.candidates?.acceptedByProfile ?? {}) },
    reasons: mergeReasonCounts(
      textScan.skippedByReason,
      attributeScan.skippedByReason,
      diagnostics?.units?.droppedByReason,
    ),
  };
}

function evaluateUnitBuild(pageStatus, diagnostics, expectation) {
  const units = diagnostics?.units ?? {};
  const totalUnits = pageStatus?.total ?? units.built ?? 0;
  const codeUnits = units.codeUnits ?? 0;
  const uiUnits = units.uiUnits ?? 0;
  const minUnits = expectation?.minUnits ?? 3;
  const averageTextLength = units.built > 0 ? Math.round((units.totalTextLength ?? 0) / units.built) : 0;
  const status = totalUnits === 0 || codeUnits > 0
    ? "failed"
    : totalUnits < minUnits || uiUnits > Math.max(4, totalUnits * 0.6)
      ? "partial"
      : "ok";

  return {
    status,
    totalUnits,
    unitsByCategory: { ...(units.byCategory ?? {}) },
    droppedUnits: units.dropped ?? 0,
    droppedByReason: { ...(units.droppedByReason ?? {}) },
    duplicateUnits: units.duplicateUnits ?? 0,
    averageTextLength,
    maxTextLength: units.maxTextLength ?? 0,
    codeUnits,
    uiUnits,
  };
}

function evaluateProvider(pageStatus, diagnostics, config, translateResponse) {
  const limits = providerLimits(config);
  const requestedItems = diagnostics?.provider?.requested ?? 0;
  const failedItems = diagnostics?.provider?.failed ?? 0;
  const skippedItems = diagnostics?.provider?.skipped ?? 0;
  const okItems = Math.max(0, requestedItems - failedItems - skippedItems);
  const cacheHits = diagnostics?.cache?.hits ?? 0;
  const cacheMisses = diagnostics?.cache?.misses ?? 0;
  const errors = [
    translateResponse?.ok === false ? translateResponse.error : undefined,
    pageStatus?.lastError,
  ].filter(Boolean);
  const okRatio = requestedItems > 0 ? okItems / requestedItems : cacheHits > 0 ? 1 : 0;
  const status = (pageStatus?.total ?? 0) === 0
    ? "skipped"
    : requestedItems === 0 && cacheHits > 0
      ? "ok"
      : requestedItems > 0 && okItems === 0
        ? "failed"
        : okRatio >= 0.9
          ? "ok"
          : okRatio >= 0.7
            ? "partial"
            : "failed";

  return {
    status,
    requestedItems,
    okItems,
    failedItems,
    skippedItems,
    batchCount: requestedItems > 0 ? Math.ceil(requestedItems / limits.maxBatchItems) : 0,
    maxBatchItems: limits.maxBatchItems,
    maxBatchChars: limits.maxBatchChars,
    cacheHits,
    cacheMisses,
    providerName: config.provider,
    errors,
  };
}

function evaluateRender(pageStatus, metrics) {
  const translatedDomCount = metrics?.translatedRoots ?? 0;
  const visibleTranslationCount = Math.max(
    translatedDomCount,
    (metrics?.translatedBlocks ?? 0) + (metrics?.translatedReplacements ?? 0),
  );
  const expectedTranslations = pageStatus?.translated ?? 0;
  const loadingDomCount = metrics?.loadingDomCount ?? 0;
  const status = expectedTranslations > 0 && visibleTranslationCount === 0
    ? "failed"
    : loadingDomCount > 0
      ? "failed"
      : expectedTranslations > 0 && visibleTranslationCount < expectedTranslations * 0.7
        ? "partial"
        : "ok";

  return {
    status,
    translatedDomCount,
    loadingDomCount,
    managedNodeCount: metrics?.managedNodeCount ?? 0,
    translatedTextLength: metrics?.translatedTextLength ?? 0,
    orphanLoadingCount: metrics?.orphanLoadingCount ?? 0,
    duplicateTranslationCount: metrics?.duplicateTranslationCount ?? 0,
    renderModeCounts: {
      "bilingual-inside": metrics?.translatedBlocks ?? 0,
      "compact-bilingual": metrics?.translatedCompacts ?? 0,
      "replace-text": metrics?.translatedReplacements ?? 0,
      "replace-attribute": metrics?.translatedAttributes ?? 0,
    },
  };
}

function evaluateNegativeSamples(metrics, expectation) {
  const violations = metrics?.negativeSamples?.violations ?? [];
  const maxNegativeTranslated = expectation?.maxNegativeTranslated ?? 1;
  const criticalCount = violations.filter(isCriticalViolation).length;
  return {
    status: criticalCount > 0 ? "failed" : violations.length > maxNegativeTranslated ? "warn" : "ok",
    checked: metrics?.negativeSamples?.checked ?? 0,
    violations,
  };
}

function evaluateDynamic(site, config, pageStatus, firstProgress, hoverResult, dynamicActionResult, expectation) {
  const required = Boolean(expectation?.requiresDynamic || DYNAMIC_FIXTURE_KINDS.has(site.fixtureKind));
  if (!required || config.dynamicMode === "off") {
    return {
      status: "not-applicable",
      observation: pageStatus?.observation ?? "inactive",
      initialTranslated: firstProgress?.translatedRoots ?? 0,
      dynamicRuns: pageStatus?.dynamicRuns ?? 0,
      newlyAddedRoots: 0,
      newlyTranslatedRoots: 0,
      pendingRoots: pageStatus?.pendingRoots ?? 0,
      observedRoots: pageStatus?.observedRoots ?? 0,
    };
  }

  const dynamicRuns = pageStatus?.dynamicRuns ?? 0;
  const hoverOk = expectation?.requiresHover ? Boolean(hoverResult?.ok) || Boolean(site.hoverTooltipOptional) : false;
  const dynamicActionOk = Boolean(dynamicActionResult?.ok);
  const suspended = pageStatus?.observation === "suspended";
  const pendingRoots = pageStatus?.pendingRoots ?? 0;
  const observedRoots = pageStatus?.observedRoots ?? 0;
  const initialTranslated = firstProgress?.translatedRoots ?? 0;
  const translatedAtLeastOnce = (pageStatus?.translated ?? 0) > 0 || initialTranslated > 0;
  const status = suspended
    ? translatedAtLeastOnce && pendingRoots === 0 ? "partial" : "failed"
    : dynamicRuns > 0 || hoverOk || dynamicActionOk
      ? pendingRoots > Math.max(4, observedRoots * 0.25) ? "partial" : "ok"
      : translatedAtLeastOnce ? "partial" : "failed";

  return {
    status,
    observation: pageStatus?.observation ?? "inactive",
    initialTranslated,
    dynamicRuns,
    newlyAddedRoots: observedRoots,
    newlyTranslatedRoots: dynamicRuns > 0 || dynamicActionOk ? Math.max(1, (pageStatus?.translated ?? 0) - initialTranslated) : 0,
    pendingRoots,
    observedRoots,
    suspendedReason: suspended ? pageStatus?.lastError : undefined,
  };
}

function evaluateRestore(metrics, restoreResponse, restoreMetrics, access) {
  if (access.status === "gated") {
    return {
      status: "ok",
      translatedDomBefore: metrics?.translatedRoots ?? 0,
      translatedDomAfter: 0,
      managedDomAfter: 0,
      loadingDomAfter: 0,
      textIntegrityOk: true,
      attributesRestored: true,
      originalTextMarkersAfter: 0,
      unitIdMarkersAfter: 0,
    };
  }

  const translatedDomAfter = restoreMetrics?.translatedDomAfter ?? 0;
  const loadingDomAfter = restoreMetrics?.loadingDomAfter ?? 0;
  const managedDomAfter = restoreMetrics?.managedDomAfter ?? 0;
  const originalTextMarkersAfter = restoreMetrics?.originalTextMarkersAfter ?? 0;
  const unitIdMarkersAfter = restoreMetrics?.unitIdMarkersAfter ?? 0;
  const status = restoreResponse?.ok &&
    translatedDomAfter === 0 &&
    loadingDomAfter === 0 &&
    originalTextMarkersAfter === 0 &&
    unitIdMarkersAfter === 0
    ? "ok"
    : "failed";

  return {
    status,
    translatedDomBefore: metrics?.translatedRoots ?? 0,
    translatedDomAfter,
    managedDomAfter,
    loadingDomAfter,
    originalTextMarkersAfter,
    unitIdMarkersAfter,
    textIntegrityOk: translatedDomAfter === 0 && loadingDomAfter === 0,
    attributesRestored: originalTextMarkersAfter === 0 && unitIdMarkersAfter === 0,
  };
}

function calculateScore(stages) {
  const access = stages.access.status === "ok" || stages.access.status === "gated" ? 100 : 0;
  const rule = scoreRule(stages.ruleResolution);
  const contentDiscovery = scoreStatus(stages.contentDiscovery.status, { ok: 100, partial: 65, failed: 0 });
  const unitBuild = scoreStatus(stages.unitBuild.status, { ok: 100, partial: 65, failed: 0 });
  const provider = scoreStatus(stages.provider.status, { ok: 100, partial: 75, skipped: 70, failed: 0 });
  const render = scoreStatus(stages.render.status, { ok: 100, partial: 70, failed: 0 });
  const negative = scoreNegative(stages.negativeSamples);
  const dynamic = scoreStatus(stages.dynamic?.status, { ok: 100, partial: 65, "not-applicable": 100, failed: 0 });
  const restore = scoreStatus(stages.restore?.status, { ok: 100, failed: 0 });
  const weightedEntries = [
    ["rule", rule],
    ["contentDiscovery", contentDiscovery],
    ["unitBuild", unitBuild],
    ["provider", provider],
    ["render", render],
    ["negative", negative],
    ["restore", restore],
  ];
  if (stages.dynamic?.status !== "not-applicable") weightedEntries.push(["dynamic", dynamic]);
  const totalWeight = weightedEntries.reduce((sum, [key]) => sum + SCORE_WEIGHTS[key], 0);
  const total = totalWeight > 0
    ? weightedEntries.reduce((sum, [key, value]) => sum + value * SCORE_WEIGHTS[key], 0) / totalWeight
    : 0;

  return {
    access,
    rule,
    contentDiscovery,
    unitBuild,
    provider,
    render,
    negative,
    dynamic,
    restore,
    total: Math.round(total),
  };
}

function scoreRule(ruleResolution) {
  if (ruleResolution.status === "conflict" || ruleResolution.status === "miss") return 0;
  if (ruleResolution.hitLevel === "content-ready") return 100;
  if (ruleResolution.hitLevel === "dom-verified") return 92;
  if (ruleResolution.hitLevel === "url-only") return 72;
  if (ruleResolution.hitLevel === "generic") return 78;
  return 0;
}

function scoreNegative(negativeSamples) {
  const critical = negativeSamples.violations.filter(isCriticalViolation).length;
  const minor = negativeSamples.violations.length - critical;
  return Math.max(0, 100 - critical * 50 - minor * 15);
}

function scoreStatus(status, scores) {
  return scores[status] ?? 0;
}

function summarizeReport(report) {
  if (report.verdict === "GATED") {
    return `Access GATED - ${report.access.gateReason ?? "external access gate"} (${report.access.bodyTextLength} chars)`;
  }

  return [
    `score=${report.score.total}`,
    `rule=${report.ruleResolution.status}/${report.ruleResolution.hitLevel}`,
    `content=${report.contentDiscovery.status}:${report.contentDiscovery.acceptedCandidateCount}`,
    `units=${report.unitBuild.status}:${report.unitBuild.totalUnits}`,
    `provider=${report.provider.status}:${report.provider.okItems}/${report.provider.requestedItems}`,
    `render=${report.render.status}:${report.render.translatedDomCount}`,
    `negative=${report.negativeSamples.status}:${report.negativeSamples.violations.length}`,
    report.dynamic?.status !== "not-applicable" ? `dynamic=${report.dynamic.status}:${report.dynamic.dynamicRuns}` : undefined,
    `restore=${report.restore.status}`,
  ].filter(Boolean).join(", ");
}

function emptyRuleResolution(status) {
  return {
    status,
    hitLevel: "none",
    ruleId: "",
    siteKey: "",
    ruleSource: "core",
    ruleCapability: "match-only",
    fallbackProfile: "generic",
    mergedRuleIds: [],
    matchedBy: {
      url: false,
      selector: false,
      excludeUrl: false,
      excludeSelector: false,
    },
    selectorMatchesCount: 0,
    preferredScanRootSelectorCount: 0,
    contentSelectorCount: 0,
    excludeSelectorCount: 0,
    injectedCssRuleCount: 0,
  };
}

function emptyPolicyCompilation(status) {
  return {
    status,
    preferredScanRootSelectors: [],
    weakCandidateSelectors: [],
    contentSelectors: [],
    excludeSelectors: [],
    buildContainerSelectors: [],
    skipBuildContainerSelectors: [],
    injectedCss: [],
    globalAttributesCount: 0,
    dynamicPreset: undefined,
    observeUrlChange: false,
    urlChangeDelay: 0,
  };
}

function emptyContentDiscovery(status, pageProfile) {
  return {
    status,
    pageProfile,
    scanRootCount: 0,
    highConfidenceRootCount: 0,
    preferredRootMatchCount: 0,
    weakCandidateRootCount: 0,
    candidateCount: 0,
    acceptedCandidateCount: 0,
    rejectedCandidateCount: 0,
    rootProfiles: {},
    reasons: {},
  };
}

function emptyUnitBuild(status) {
  return {
    status,
    totalUnits: 0,
    unitsByCategory: {},
    droppedUnits: 0,
    droppedByReason: {},
    duplicateUnits: 0,
    averageTextLength: 0,
    maxTextLength: 0,
    codeUnits: 0,
    uiUnits: 0,
  };
}

function emptyProvider(status, providerName, errors = []) {
  return {
    status,
    requestedItems: 0,
    okItems: 0,
    failedItems: 0,
    skippedItems: 0,
    batchCount: 0,
    maxBatchItems: 0,
    maxBatchChars: 0,
    cacheHits: 0,
    cacheMisses: 0,
    providerName,
    errors,
  };
}

function emptyRender(status) {
  return {
    status,
    translatedDomCount: 0,
    loadingDomCount: 0,
    managedNodeCount: 0,
    translatedTextLength: 0,
    orphanLoadingCount: 0,
    duplicateTranslationCount: 0,
    renderModeCounts: {},
  };
}

function providerLimits(config) {
  if (config.provider === "openai-compatible") {
    return {
      maxBatchItems: Number(config.openaiMaxBatchItems ?? 16),
      maxBatchChars: Number(config.openaiMaxBatchChars ?? 6000),
    };
  }
  if (config.provider === "gemini") {
    return {
      maxBatchItems: Number(config.geminiMaxBatchItems ?? 16),
      maxBatchChars: Number(config.geminiMaxBatchChars ?? 6000),
    };
  }
  if (config.provider === "deepseek") {
    return {
      maxBatchItems: Number(config.deepseekMaxBatchItems ?? 4),
      maxBatchChars: Number(config.deepseekMaxBatchChars ?? 1200),
    };
  }
  return {
    maxBatchItems: 16,
    maxBatchChars: 6000,
  };
}

function sumSelectorMatches(selectors = [], groups) {
  return selectors
    .filter((item) => !groups || groups.has(item.group))
    .reduce((sum, item) => sum + (item.matchedCount ?? 0), 0);
}

function mergeReasonCounts(...countsList) {
  const merged = {};
  for (const counts of countsList) {
    if (!counts) continue;
    for (const [key, value] of Object.entries(counts)) {
      if (!value) continue;
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}
