export const allRegressionSites = [
  { name: "X", host: "x.com", url: "https://x.com/explore" },
  { name: "YouTube", host: "youtube.com", url: "https://www.youtube.com/results?search_query=openai" },
  { name: "Reddit", host: "reddit.com", url: "https://www.reddit.com/r/technology/" },
  { name: "MetaTFT", host: "metatft.com", url: "https://www.metatft.com/comps" },
  { name: "MetaTFT Augments", host: "metatft.com", url: "https://www.metatft.com/augments" },
  {
    name: "Tactics Tools Hover",
    host: "tactics.tools",
    url: "https://tactics.tools/team-compositions",
    hoverTooltip: true,
  },
];

const regressionProfiles = {
  smoke: {
    dynamicModes: ["conservative"],
    siteFilter: ["metatft augments"],
  },
  "high-dynamic": {
    dynamicModes: ["conservative"],
    siteFilter: ["x", "youtube", "reddit", "metatft", "metatft augments", "tactics"],
  },
  all: {
    dynamicModes: ["conservative", "normal"],
    siteFilter: [],
  },
};

export function resolveRegressionSelection({ argv = [], env = process.env } = {}) {
  const profile = readArg(argv, "profile") || env.IMT_REGRESSION_PROFILE || "all";
  const profileConfig = regressionProfiles[profile];
  if (!profileConfig) {
    throw new Error(`Unsupported regression profile: ${profile}. Use smoke, high-dynamic, or all.`);
  }

  const dynamicModes = parseCsv(env.IMT_REGRESSION_DYNAMIC_MODES ?? "").length > 0
    ? parseCsv(env.IMT_REGRESSION_DYNAMIC_MODES)
    : profileConfig.dynamicModes;
  const siteFilter = parseCsv(env.IMT_REGRESSION_SITE_FILTER ?? "").length > 0
    ? parseCsv(env.IMT_REGRESSION_SITE_FILTER).map((item) => item.toLowerCase())
    : profileConfig.siteFilter;
  const selectedSites = selectRegressionSites(siteFilter);

  return {
    profile,
    dynamicModes,
    siteFilter,
    selectedSites,
  };
}

export function selectRegressionSites(siteFilter = []) {
  if (siteFilter.length === 0) return allRegressionSites;
  const filters = siteFilter.map((item) => item.toLowerCase());
  return allRegressionSites.filter((site) =>
    filters.some((filter) =>
      site.name.toLowerCase().includes(filter) ||
      site.host.toLowerCase().includes(filter) ||
      site.url.toLowerCase().includes(filter),
    ),
  );
}

export function parseCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function readArg(argv, name) {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1] || "";
  return "";
}
