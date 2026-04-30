export type DiagnosticReasonCounts = Partial<Record<string, number>>;

export type ScanDiagnosticBucket = {
  seen: number;
  accepted: number;
  skipped: number;
  skippedByReason: DiagnosticReasonCounts;
};

export type UnitDiagnostics = {
  built: number;
  dropped: number;
  droppedByReason: DiagnosticReasonCounts;
  byCategory?: DiagnosticReasonCounts;
  totalTextLength?: number;
  maxTextLength?: number;
  codeUnits?: number;
  uiUnits?: number;
  duplicateUnits?: number;
};

export type CandidateDiagnostics = {
  evaluated: number;
  accepted: number;
  byProfile: DiagnosticReasonCounts;
  acceptedByProfile: DiagnosticReasonCounts;
};

export type DetectionTrace = {
  stage: "rule-match" | "root-scoring" | "scan" | "granularity" | "unit-build" | "translation" | "render";
  decision: "accepted" | "rejected" | "pending" | "translated";
  reasons: readonly string[];
  elementPath?: string;
  textPreview?: string;
  scores?: Readonly<Record<string, number | string>>;
  matchedRuleIds?: readonly string[];
};

export type TranslationDiagnostics = {
  scan: {
    text: ScanDiagnosticBucket;
    attributes: ScanDiagnosticBucket;
  };
  candidates: CandidateDiagnostics;
  units: UnitDiagnostics;
  cache: {
    hits: number;
    misses: number;
  };
  provider: {
    requested: number;
    failed: number;
    skipped: number;
  };
  traces?: DetectionTrace[];
};

type ScanBucketName = "text" | "attributes";

export function createTranslationDiagnostics(): TranslationDiagnostics {
  return {
    scan: {
      text: createScanBucket(),
      attributes: createScanBucket(),
    },
    candidates: {
      evaluated: 0,
      accepted: 0,
      byProfile: {},
      acceptedByProfile: {},
    },
    units: {
      built: 0,
      dropped: 0,
      droppedByReason: {},
      byCategory: {},
      totalTextLength: 0,
      maxTextLength: 0,
      codeUnits: 0,
      uiUnits: 0,
      duplicateUnits: 0,
    },
    cache: {
      hits: 0,
      misses: 0,
    },
    provider: {
      requested: 0,
      failed: 0,
      skipped: 0,
    },
    traces: [],
  };
}

export function cloneTranslationDiagnostics(diagnostics: TranslationDiagnostics): TranslationDiagnostics {
  return {
    scan: {
      text: cloneScanBucket(diagnostics.scan.text),
      attributes: cloneScanBucket(diagnostics.scan.attributes),
    },
    candidates: {
      evaluated: diagnostics.candidates.evaluated,
      accepted: diagnostics.candidates.accepted,
      byProfile: { ...diagnostics.candidates.byProfile },
      acceptedByProfile: { ...diagnostics.candidates.acceptedByProfile },
    },
    units: {
      built: diagnostics.units.built,
      dropped: diagnostics.units.dropped,
      droppedByReason: { ...diagnostics.units.droppedByReason },
      byCategory: { ...(diagnostics.units.byCategory ?? {}) },
      totalTextLength: diagnostics.units.totalTextLength ?? 0,
      maxTextLength: diagnostics.units.maxTextLength ?? 0,
      codeUnits: diagnostics.units.codeUnits ?? 0,
      uiUnits: diagnostics.units.uiUnits ?? 0,
      duplicateUnits: diagnostics.units.duplicateUnits ?? 0,
    },
    cache: {
      hits: diagnostics.cache.hits,
      misses: diagnostics.cache.misses,
    },
    provider: {
      requested: diagnostics.provider.requested,
      failed: diagnostics.provider.failed,
      skipped: diagnostics.provider.skipped,
    },
    traces: (diagnostics.traces ?? []).map((trace) => ({ ...trace })),
  };
}

export function recordScanSeen(diagnostics: TranslationDiagnostics | undefined, bucket: ScanBucketName): void {
  if (!diagnostics) return;
  diagnostics.scan[bucket].seen += 1;
}

export function recordScanAccepted(diagnostics: TranslationDiagnostics | undefined, bucket: ScanBucketName): void {
  if (!diagnostics) return;
  diagnostics.scan[bucket].accepted += 1;
}

export function recordScanSkipped(
  diagnostics: TranslationDiagnostics | undefined,
  bucket: ScanBucketName,
  reason = "unknown",
): void {
  if (!diagnostics) return;
  diagnostics.scan[bucket].skipped += 1;
  incrementReason(diagnostics.scan[bucket].skippedByReason, reason);
}

export function recordUnitBuilt(
  diagnostics: TranslationDiagnostics | undefined,
  category = "unknown",
  textLength = 0,
  options: { code?: boolean; ui?: boolean } = {},
): void {
  if (!diagnostics) return;
  diagnostics.units.built += 1;
  diagnostics.units.byCategory ??= {};
  diagnostics.units.totalTextLength ??= 0;
  diagnostics.units.maxTextLength ??= 0;
  diagnostics.units.codeUnits ??= 0;
  diagnostics.units.uiUnits ??= 0;
  incrementReason(diagnostics.units.byCategory, category);
  diagnostics.units.totalTextLength += Math.max(0, textLength);
  diagnostics.units.maxTextLength = Math.max(diagnostics.units.maxTextLength, Math.max(0, textLength));
  if (options.code) diagnostics.units.codeUnits += 1;
  if (options.ui) diagnostics.units.uiUnits += 1;
}

export function recordDuplicateUnits(diagnostics: TranslationDiagnostics | undefined, count: number): void {
  if (!diagnostics || count <= 0) return;
  diagnostics.units.duplicateUnits ??= 0;
  diagnostics.units.duplicateUnits += count;
}

export function recordCandidateEvaluated(
  diagnostics: TranslationDiagnostics | undefined,
  profile: string,
): void {
  if (!diagnostics) return;
  diagnostics.candidates.evaluated += 1;
  incrementReason(diagnostics.candidates.byProfile, profile);
}

export function recordCandidateAccepted(
  diagnostics: TranslationDiagnostics | undefined,
  profile: string,
): void {
  if (!diagnostics) return;
  diagnostics.candidates.accepted += 1;
  incrementReason(diagnostics.candidates.acceptedByProfile, profile);
}

export function recordUnitDropped(diagnostics: TranslationDiagnostics | undefined, reason = "empty"): void {
  if (!diagnostics) return;
  diagnostics.units.dropped += 1;
  incrementReason(diagnostics.units.droppedByReason, reason);
}

export function recordCacheUsage(
  diagnostics: TranslationDiagnostics | undefined,
  hits: number,
  misses: number,
): void {
  if (!diagnostics) return;
  diagnostics.cache.hits += hits;
  diagnostics.cache.misses += misses;
}

export function recordProviderUsage(
  diagnostics: TranslationDiagnostics | undefined,
  requested: number,
  failed: number,
  skipped: number,
): void {
  if (!diagnostics) return;
  diagnostics.provider.requested += requested;
  diagnostics.provider.failed += failed;
  diagnostics.provider.skipped += skipped;
}

export function recordDetectionTrace(
  diagnostics: TranslationDiagnostics | undefined,
  trace: DetectionTrace,
): void {
  if (!diagnostics) return;
  diagnostics.traces ??= [];
  if (diagnostics.traces.length >= 200) return;
  diagnostics.traces.push(trace);
}

function createScanBucket(): ScanDiagnosticBucket {
  return {
    seen: 0,
    accepted: 0,
    skipped: 0,
    skippedByReason: {},
  };
}

function cloneScanBucket(bucket: ScanDiagnosticBucket): ScanDiagnosticBucket {
  return {
    seen: bucket.seen,
    accepted: bucket.accepted,
    skipped: bucket.skipped,
    skippedByReason: { ...bucket.skippedByReason },
  };
}

function incrementReason(counts: DiagnosticReasonCounts, reason: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}
