const sites = {
  x: { name: "X", host: "x.com", url: "https://x.com/explore", fixtureKind: "social-feed" },
  threads: { name: "Threads", host: "threads.com", url: "https://www.threads.com/", fixtureKind: "social-feed" },
  youtube: { name: "YouTube", host: "youtube.com", url: "https://www.youtube.com/results?search_query=openai", fixtureKind: "video-list" },
  reddit: { name: "Reddit", host: "reddit.com", url: "https://www.reddit.com/r/technology/", fixtureKind: "social-feed" },
  oldReddit: { name: "Old Reddit", host: "old.reddit.com", url: "https://old.reddit.com/r/TrueReddit/", fixtureKind: "forum" },
  inworld: { name: "Inworld", host: "inworld.ai", url: "https://inworld.ai/", fixtureKind: "landing" },
  promptot: { name: "PromptOT", host: "promptot.com", url: "https://www.promptot.com/", fixtureKind: "landing" },
  metatft: { name: "MetaTFT", host: "metatft.com", url: "https://www.metatft.com/comps", fixtureKind: "data-dashboard" },
  metatftAugments: {
    name: "MetaTFT Augments",
    host: "metatft.com",
    url: "https://www.metatft.com/augments",
    fixtureKind: "data-dashboard",
  },
  tacticsHover: {
    name: "Tactics Tools Hover",
    host: "tactics.tools",
    url: "https://tactics.tools/team-compositions",
    fixtureKind: "hover-tooltip",
    hoverTooltip: true,
    hoverMaxAttempts: 6,
    hoverAttemptTimeoutMs: 1800,
  },
  stackOverflow: {
    name: "StackOverflow",
    host: "stackoverflow.com",
    url: "https://stackoverflow.com/questions/tagged/javascript",
    fixtureKind: "forum",
  },
  githubBlog: { name: "GitHub Blog", host: "github.blog", url: "https://github.blog/changelog/", fixtureKind: "article" },
  openaiDocs: {
    name: "OpenAI Docs",
    host: "developers.openai.com",
    url: "https://developers.openai.com/api/docs/guides/text",
    fixtureKind: "docs-code",
  },
  natureArticle: {
    name: "Nature Article",
    host: "nature.com",
    url: "https://www.nature.com/articles/s41586-020-2649-2",
    fixtureKind: "article",
  },
  productHunt: { name: "Product Hunt", host: "producthunt.com", url: "https://www.producthunt.com/", fixtureKind: "card-list" },
  amazonProduct: { name: "Amazon Product", host: "amazon.com", url: "https://www.amazon.com/s?k=kindle", fixtureKind: "commerce" },
  pornhub: { name: "Pornhub", host: "pornhub.com", url: "https://www.pornhub.com/", fixtureKind: "adult-video-list" },
  xvideos: { name: "XVideos", host: "xvideos.com", url: "https://www.xvideos.com/", fixtureKind: "adult-video-list" },
  wikipediaArticle: {
    name: "Wikipedia Article",
    host: "wikipedia.org",
    url: "https://en.wikipedia.org/wiki/Machine_translation",
    fixtureKind: "article",
  },
  mdnDocs: {
    name: "MDN JavaScript Guide",
    host: "developer.mozilla.org",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    fixtureKind: "docs-code",
  },
  reactDocs: { name: "React Reference", host: "react.dev", url: "https://react.dev/reference/react", fixtureKind: "docs-code" },
  githubReadme: { name: "GitHub README", host: "github.com", url: "https://github.com/microsoft/playwright", fixtureKind: "github" },
  githubIssues: { name: "GitHub Issues", host: "github.com", url: "https://github.com/vercel/next.js/issues", fixtureKind: "github" },
  githubTrending: { name: "GitHub Trending", host: "github.com", url: "https://github.com/trending", fixtureKind: "card-list" },
  alternativeTo: { name: "AlternativeTo", host: "alternativeto.net", url: "https://alternativeto.net/", fixtureKind: "card-list" },
  vimeo: { name: "Vimeo Watch", host: "vimeo.com", url: "https://vimeo.com/watch", fixtureKind: "video-list" },
  dailymotion: { name: "Dailymotion", host: "dailymotion.com", url: "https://www.dailymotion.com/us", fixtureKind: "video-list" },
  ebay: { name: "eBay Search", host: "ebay.com", url: "https://www.ebay.com/sch/i.html?_nkw=kindle", fixtureKind: "commerce" },
  etsy: { name: "Etsy Search", host: "etsy.com", url: "https://www.etsy.com/search?q=planner", fixtureKind: "commerce" },
  hackerNews: { name: "Hacker News", host: "news.ycombinator.com", url: "https://news.ycombinator.com/", fixtureKind: "forum" },
  linear: { name: "Linear Landing", host: "linear.app", url: "https://linear.app/", fixtureKind: "landing" },
  googleSearch: { name: "Google Search", host: "google.com", url: "https://www.google.com/search?q=openai", fixtureKind: "search-results" },
  bingSearch: { name: "Bing Search", host: "bing.com", url: "https://www.bing.com/search?q=openai", fixtureKind: "search-results" },
  duckDuckGoSearch: {
    name: "DuckDuckGo Search",
    host: "duckduckgo.com",
    url: "https://duckduckgo.com/?q=openai",
    fixtureKind: "search-results",
  },
  mobalyticsTft: { name: "Mobalytics TFT", host: "mobalytics.gg", url: "https://mobalytics.gg/tft/team-comps", fixtureKind: "data-dashboard" },
  uggHover: {
    name: "U.GG Champions",
    host: "u.gg",
    url: "https://u.gg/lol/champions",
    fixtureKind: "hover-tooltip",
    hoverTooltip: true,
    hoverTooltipOptional: true,
    hoverMaxAttempts: 6,
    hoverAttemptTimeoutMs: 2000,
  },
  opggHover: {
    name: "OP.GG Champions",
    host: "op.gg",
    url: "https://www.op.gg/champions",
    fixtureKind: "hover-tooltip",
    hoverTooltip: true,
    hoverTooltipOptional: true,
    hoverMaxAttempts: 6,
    hoverAttemptTimeoutMs: 2000,
  },
  chatgpt: { name: "ChatGPT", host: "chatgpt.com", url: "https://chatgpt.com/", fixtureKind: "ai-chat", requiresLogin: true },
  claude: { name: "Claude", host: "claude.ai", url: "https://claude.ai/", fixtureKind: "ai-chat", requiresLogin: true },
  poe: { name: "Poe", host: "poe.com", url: "https://poe.com/", fixtureKind: "ai-chat", requiresLogin: true },
};

export const realSiteFixtureGroups = {
  article: [sites.wikipediaArticle, sites.natureArticle, sites.githubBlog],
  "docs-code": [sites.openaiDocs, sites.mdnDocs, sites.reactDocs],
  github: [sites.githubReadme, sites.githubIssues],
  "card-list": [sites.productHunt, sites.githubTrending, sites.alternativeTo],
  "video-list": [sites.youtube, sites.vimeo, sites.dailymotion],
  commerce: [sites.amazonProduct, sites.ebay, sites.etsy],
  forum: [sites.stackOverflow, sites.oldReddit, sites.hackerNews],
  "social-feed": [sites.x, sites.threads, sites.reddit],
  landing: [sites.inworld, sites.promptot, sites.linear],
  "search-results": [sites.googleSearch, sites.bingSearch, sites.duckDuckGoSearch],
  "data-dashboard": [sites.metatft, sites.metatftAugments, sites.mobalyticsTft],
  "hover-tooltip": [sites.tacticsHover, sites.uggHover, sites.opggHover],
  "ai-chat": [sites.chatgpt, sites.claude, sites.poe],
  "adult-video-list": [sites.pornhub, sites.xvideos],
};

export const allRegressionSites = [
  sites.x,
  sites.threads,
  sites.youtube,
  sites.reddit,
  sites.oldReddit,
  sites.inworld,
  sites.promptot,
  sites.metatft,
  sites.metatftAugments,
  sites.tacticsHover,
  sites.stackOverflow,
  sites.githubBlog,
  sites.openaiDocs,
  sites.natureArticle,
  sites.productHunt,
  sites.amazonProduct,
  sites.pornhub,
  sites.xvideos,
  sites.wikipediaArticle,
  sites.mdnDocs,
  sites.reactDocs,
  sites.githubReadme,
  sites.githubIssues,
  sites.githubTrending,
  sites.alternativeTo,
  sites.vimeo,
  sites.dailymotion,
  sites.ebay,
  sites.etsy,
  sites.hackerNews,
  sites.linear,
  sites.googleSearch,
  sites.bingSearch,
  sites.duckDuckGoSearch,
  sites.mobalyticsTft,
  sites.uggHover,
  sites.opggHover,
  sites.chatgpt,
  sites.claude,
  sites.poe,
];

const fixtureMatrixSiteFilters = Object.values(realSiteFixtureGroups).flat().map((site) => site.url);

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
  "long-tail-rules": {
    dynamicModes: ["normal"],
    siteFilter: ["old reddit", "inworld", "promptot", "pornhub", "xvideos"],
  },
  "fixture-matrix": {
    dynamicModes: ["normal"],
    siteFilter: fixtureMatrixSiteFilters,
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
    throw new Error(`Unsupported regression profile: ${profile}. Use smoke, high-dynamic, core-rules, long-tail-rules, fixture-matrix, or all.`);
  }

  const fixtureKinds = parseFixtureKinds(readArg(argv, "fixture-kind") || env.IMT_REGRESSION_FIXTURE_KIND || "");
  const dynamicModes = parseCsv(env.IMT_REGRESSION_DYNAMIC_MODES ?? "").length > 0
    ? parseCsv(env.IMT_REGRESSION_DYNAMIC_MODES)
    : profileConfig.dynamicModes;
  const siteFilter = parseCsv(env.IMT_REGRESSION_SITE_FILTER ?? "").length > 0
    ? parseCsv(env.IMT_REGRESSION_SITE_FILTER).map((item) => item.toLowerCase())
    : profileConfig.siteFilter;
  const selectedSites = fixtureKinds.length > 0
    ? selectRegressionSitesByFixtureKind(fixtureKinds, siteFilter)
    : selectRegressionSites(siteFilter);

  return {
    profile,
    dynamicModes,
    siteFilter,
    fixtureKinds,
    selectedSites,
  };
}

export function selectRegressionSites(siteFilter = []) {
  if (siteFilter.length === 0) return allRegressionSites;
  const filters = siteFilter.map((item) => item.toLowerCase());
  return allRegressionSites.filter((site) => filters.some((filter) => matchesSiteFilter(site, filter)));
}

export function selectRegressionSitesByFixtureKind(fixtureKinds = [], siteFilter = []) {
  const selectedByKind = fixtureKinds.flatMap((kind) => realSiteFixtureGroups[kind] ?? []);
  const uniqueByUrl = [...new Map(selectedByKind.map((site) => [site.url, site])).values()];
  if (siteFilter.length === 0 || siteFilter === regressionProfiles["fixture-matrix"].siteFilter) return uniqueByUrl;
  const filters = siteFilter.map((item) => item.toLowerCase());
  return uniqueByUrl.filter((site) => filters.some((filter) => matchesSiteFilter(site, filter)));
}

export function parseCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseFixtureKinds(value) {
  const kinds = parseCsv(value).map((kind) => kind.toLowerCase());
  const unknown = kinds.filter((kind) => !realSiteFixtureGroups[kind]);
  if (unknown.length > 0) {
    throw new Error(`Unsupported fixture kind: ${unknown.join(", ")}. Use ${Object.keys(realSiteFixtureGroups).join(", ")}.`);
  }
  return kinds;
}

export function siteAccessGateReason(site, metrics) {
  if (site.requiresLogin) return "requires login";
  if (isXLoginWall(site, metrics)) return "login wall";
  if (isRedditHumanityCheck(site, metrics)) return "humanity check";
  if (isRedditNetworkSecurityBlock(site, metrics)) return "network security block";
  if (isAmazonRobotCheck(site, metrics)) return "robot check";
  if (isAmazonUnavailablePage(site, metrics)) return "unavailable page";
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
  if (filter.length <= 2) return name === filter || host === filter;
  if (name.includes(filter) || host.includes(filter)) return true;
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

function isAmazonUnavailablePage(site, metrics) {
  return isAmazonSite(site) && (
    /page not found|sorry! something went wrong/i.test(metrics.title ?? "") ||
    (metrics.bodyTextLength === 0 && /\/dp\/|\/gp\/product\//i.test(metrics.url ?? ""))
  );
}

function isRedditSite(site) {
  return site.host === "reddit.com" || site.host === "old.reddit.com" || site.host.endsWith(".reddit.com");
}

function isAmazonSite(site) {
  return site.host === "amazon.com" || site.host.endsWith(".amazon.com");
}
