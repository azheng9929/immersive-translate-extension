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
};

export type CandidateDiagnostics = {
  evaluated: number;
  accepted: number;
  byProfile: DiagnosticReasonCounts;
  acceptedByProfile: DiagnosticReasonCounts;
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

export function recordUnitBuilt(diagnostics: TranslationDiagnostics | undefined): void {
  if (!diagnostics) return;
  diagnostics.units.built += 1;
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
