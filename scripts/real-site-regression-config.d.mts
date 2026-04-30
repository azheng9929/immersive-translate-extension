export type RegressionSite = {
  name: string;
  host: string;
  url: string;
  hoverTooltip?: boolean;
};

export type RegressionSelection = {
  profile: "smoke" | "high-dynamic" | "all";
  dynamicModes: string[];
  siteFilter: string[];
  selectedSites: RegressionSite[];
};

export const allRegressionSites: RegressionSite[];

export function resolveRegressionSelection(input?: {
  argv?: string[];
  env?: Record<string, string | undefined>;
}): RegressionSelection;

export function selectRegressionSites(siteFilter?: string[]): RegressionSite[];

export function parseCsv(value: string): string[];
