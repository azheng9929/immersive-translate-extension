export type RegressionSite = {
  name: string;
  host: string;
  url: string;
  fixtureKind?: string;
  hoverTooltip?: boolean;
  hoverTooltipOptional?: boolean;
  hoverMaxAttempts?: number;
  hoverAttemptTimeoutMs?: number;
  requiresLogin?: boolean;
};

export type RegressionSelection = {
  profile: "smoke" | "high-dynamic" | "core-rules" | "long-tail-rules" | "fixture-matrix" | "all";
  dynamicModes: string[];
  siteFilter: string[];
  fixtureKinds: string[];
  selectedSites: RegressionSite[];
};

export const realSiteFixtureGroups: Record<string, RegressionSite[]>;
export const allRegressionSites: RegressionSite[];

export function resolveRegressionSelection(input?: {
  argv?: string[];
  env?: Record<string, string | undefined>;
}): RegressionSelection;

export function selectRegressionSites(siteFilter?: string[]): RegressionSite[];

export function selectRegressionSitesByFixtureKind(fixtureKinds?: string[], siteFilter?: string[]): RegressionSite[];

export function parseCsv(value: string): string[];
