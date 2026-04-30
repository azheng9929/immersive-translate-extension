export type WebTranslationTestVerdict = "PASS" | "WARN" | "FAIL" | "GATED";

export function buildStructuredRegressionReport(input: Record<string, unknown>): any;

export function buildFailedRegressionReport(input: {
  site: Record<string, unknown>;
  config: Record<string, unknown>;
  error: unknown;
}): any;

export function evaluatePageReport(report: any): WebTranslationTestVerdict;

export function isCriticalViolation(violation: { kind?: string }): boolean;
