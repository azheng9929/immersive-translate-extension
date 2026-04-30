export const allRegressionSites = [
  { name: "X", host: "x.com", url: "https://x.com/explore" },
  { name: "Threads", host: "threads.com", url: "https://www.threads.com/" },
  { name: "YouTube", host: "youtube.com", url: "https://www.youtube.com/results?search_query=openai" },
  { name: "Reddit", host: "reddit.com", url: "https://www.reddit.com/r/technology/" },
  { name: "Old Reddit", host: "old.reddit.com", url: "https://old.reddit.com/r/TrueReddit/" },
  { name: "Inworld", host: "inworld.ai", url: "https://inworld.ai/" },
  { name: "MetaTFT", host: "metatft.com", url: "https://www.metatft.com/comps" },
  { name: "MetaTFT Augments", host: "metatft.com", url: "https://www.metatft.com/augments" },
  {
    name: "Tactics Tools Hover",
    host: "tactics.tools",
    url: "https://tactics.tools/team-compositions",
    hoverTooltip: true,
  },
  { name: "StackOverflow", host: "stackoverflow.com", url: "https://stackoverflow.com/questions/tagged/javascript" },
  { name: "GitHub Blog", host: "github.blog", url: "https://github.blog/changelog/" },
  { name: "OpenAI Docs", host: "platform.openai.com", url: "https://platform.openai.com/docs/guides/text" },
  { name: "Nature Article", host: "nature.com", url: "https://www.nature.com/articles/s41586-020-2649-2" },
  { name: "Product Hunt", host: "producthunt.com", url: "https://www.producthunt.com/" },
  { name: "Amazon Product", host: "amazon.com", url: "https://www.amazon.com/dp/B08N5WRWNW" },
];

const regressionProfiles = {
  smoke: {
    dynamicModes: ["conservative"],
    siteFilter: ["metatft augments"],
  },
  "high-dynamic": {
    dynamicModes: ["conservative"],
    siteFilter: ["x", "threads", "youtube", "https://www.reddit.com/r/technology/", "metatft", "metatft augments", "tactics"],
  },
  "core-rules": {
    dynamicModes: ["normal"],
    siteFilter: ["stackoverflow", "github blog", "openai docs", "nature article", "product hunt", "amazon product"],
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
    throw new Error(`Unsupported regression profile: ${profile}. Use smoke, high-dynamic, core-rules, or all.`);
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
  return allRegressionSites.filter((site) => filters.some((filter) => matchesSiteFilter(site, filter)));
}

export function parseCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function siteAccessGateReason(site, metrics) {
  if (isXLoginWall(site, metrics)) return "login wall";
  if (isRedditHumanityCheck(site, metrics)) return "humanity check";
  if (isRedditNetworkSecurityBlock(site, metrics)) return "network security block";
  if (isAmazonRobotCheck(site, metrics)) return "robot check";
  return undefined;
}

function readArg(argv, name) {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1] || "";
  return "";
}

function matchesSiteFilter(site, filter) {
  const name = site.name.toLowerCase();
  const host = site.host.toLowerCase();
  const url = site.url.toLowerCase();
  if (name.includes(filter) || host.includes(filter)) return true;
  if (filter.length <= 2) return false;
  return url.includes(filter);
}

function isXLoginWall(site, metrics) {
  return site.host === "x.com" && (
    metrics.url.includes("x.com/i/flow/login") ||
    metrics.bodyTextLength < 100
  );
}

function isRedditHumanityCheck(site, metrics) {
  return isRedditSite(site) && (
    /prove your humanity/i.test(metrics.title) ||
    metrics.url.includes("js_challenge=1") ||
    metrics.url.includes("/r/technology/?solution=")
  );
}

function isRedditNetworkSecurityBlock(site, metrics) {
  return isRedditSite(site) && /blocked by network security/i.test(metrics.bodyTextPreview ?? "");
}

function isAmazonRobotCheck(site, metrics) {
  return isAmazonSite(site) && /enter the characters you see below|not a robot|robot check/i.test(metrics.bodyTextPreview ?? "");
}

function isRedditSite(site) {
  return site.host === "reddit.com" || site.host === "old.reddit.com" || site.host.endsWith(".reddit.com");
}

function isAmazonSite(site) {
  return site.host === "amazon.com" || site.host.endsWith(".amazon.com");
}
