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

const commonNegativeSelectors = [
  "pre",
  "code",
  "kbd",
  "samp",
  "script",
  "style",
  "textarea",
  "input",
  "select",
  "time",
  "[class*='price' i]",
  "[class*='rating' i]",
  "[class*='score' i]",
  "[class*='metric' i]",
  "[class*='username' i]",
  "[class*='user-name' i]",
  "[data-testid*='User' i]",
  "[href^='http'] cite",
];

export const realSiteFixtureExpectations = {
  article: {
    positiveSelectors: ["article h1", "article h2", "article h3", "article p", "main h1", "main h2", "main p", "blockquote", "figcaption", "li"],
    negativeSelectors: [...commonNegativeSelectors, "nav", "body > header", "footer", "[role='navigation']", "[aria-label*='share' i]", ".toc", "[class*='toc' i]"],
    minPositiveTranslated: 5,
    maxNegativeTranslated: 2,
    minUnits: 8,
    minAcceptedCandidates: 8,
    requiredCategories: ["heading", "content-block"],
  },
  "docs-code": {
    positiveSelectors: ["main h1", "main h2", "main p", "article h1", "article h2", "article p", "main li", "article li", "table td", "table th"],
    negativeSelectors: [...commonNegativeSelectors, "pre", "pre code", "code", "kbd", "samp", "nav", "aside", "[class*='sidebar' i]"],
    minPositiveTranslated: 5,
    maxNegativeTranslated: 1,
    minUnits: 8,
    minAcceptedCandidates: 8,
    requiredCategories: ["heading", "content-block"],
  },
  github: {
    positiveSelectors: [
      "article.markdown-body h1",
      "article.markdown-body h2",
      "article.markdown-body p",
      ".markdown-body h1",
      ".markdown-body h2",
      ".markdown-body p",
      "[data-testid='issue-title']",
      ".js-comment-body p",
      ".comment-body p",
    ],
    negativeSelectors: [...commonNegativeSelectors, "pre", "code", ".author", ".timeline-comment-header", "[data-testid*='avatar' i]", "relative-time", "button", "nav"],
    minPositiveTranslated: 3,
    maxNegativeTranslated: 1,
    minUnits: 5,
    minAcceptedCandidates: 5,
    requiredCategories: ["content-block", "card-text"],
  },
  "card-list": {
    positiveSelectors: [
      "article h2",
      "article h3",
      ".card h2",
      ".card h3",
      ".card p",
      "[class*='card' i] h2",
      "[class*='card' i] h3",
      "[class*='description' i]",
      "main a[href^='/products/']",
      "main a[href^='/posts/']",
    ],
    negativeSelectors: [...commonNegativeSelectors, "button", "[role='button']", "[class*='score' i]", "[class*='rank' i]", "[class*='stars' i]", "[class*='vote' i]"],
    minPositiveTranslated: 5,
    maxNegativeTranslated: 2,
    minUnits: 8,
    minAcceptedCandidates: 6,
    requiredCategories: ["card-text"],
  },
  "video-list": {
    positiveSelectors: [
      "#video-title",
      "span#video-title",
      "yt-formatted-string.metadata-snippet-text",
      ".ytLockupMetadataViewModelTitle",
      ".shortsLockupViewModelHostOutsideMetadataTitle",
      "[class*='video-title' i]",
      "[class*='VideoTitle']",
      "h1",
      "h2",
    ],
    negativeSelectors: [
      ...commonNegativeSelectors,
      "#masthead-container",
      "#guide-content",
      "#metadata-line",
      "ytd-thumbnail-overlay-time-status-renderer",
      "button",
      "[role='button']",
      "ytd-menu-renderer",
      "yt-icon",
      "[class*='duration' i]",
      "[class*='view-count' i]",
    ],
    minPositiveTranslated: 5,
    maxNegativeTranslated: 1,
    minUnits: 8,
    minAcceptedCandidates: 5,
    requiredCategories: ["card-text", "heading"],
    requiresDynamic: true,
  },
  commerce: {
    positiveSelectors: [
      "[data-component-type='s-search-result'] h2",
      "#productTitle",
      "#feature-bullets li",
      "#productDescription p",
      ".product-title",
      ".item-title",
      "[class*='product-title' i]",
      "[class*='ProductTitle']",
    ],
    negativeSelectors: [...commonNegativeSelectors, ".a-price", "[class*='price' i]", "[class*='rating' i]", "button", "[role='button']", "input", "select"],
    minPositiveTranslated: 3,
    maxNegativeTranslated: 0,
    minUnits: 5,
    minAcceptedCandidates: 4,
    requiredCategories: ["card-text", "content-block"],
  },
  forum: {
    positiveSelectors: [
      ".question-hyperlink",
      ".s-post-summary--content-title",
      ".js-post-body p",
      ".answercell p",
      ".comment-copy",
      ".md p",
      ".comment p",
      ".titleline a",
      ".subtext + .comment",
    ],
    negativeSelectors: [...commonNegativeSelectors, "pre", "code", ".user-details", ".user-info", ".score", ".subtext", ".age", ".reply", ".share", ".save-button"],
    minPositiveTranslated: 3,
    maxNegativeTranslated: 1,
    minUnits: 5,
    minAcceptedCandidates: 5,
    requiredCategories: ["comment", "content-block", "card-text"],
    requiresDynamic: true,
  },
  "social-feed": {
    positiveSelectors: [
      "article[data-testid='tweet'] div[data-testid='tweetText']",
      "div[data-testid='tweetText']",
      "[slot='text-body']",
      "[slot='comment']",
      "[data-ad-preview='message']",
      ".comment",
      ".post p",
    ],
    negativeSelectors: [
      ...commonNegativeSelectors,
      "[data-testid='User-Name']",
      "[data-testid='post_author_link']",
      "[data-testid='comment_author_link']",
      "[data-click-id='share']",
      "[data-click-id='upvote']",
      "[data-click-id='downvote']",
      "[role='button']",
      "button",
      "time",
      "[class*='sidebar' i]",
    ],
    minPositiveTranslated: 3,
    maxNegativeTranslated: 1,
    minUnits: 4,
    minAcceptedCandidates: 3,
    requiredCategories: ["comment", "content-block"],
    requiresDynamic: true,
  },
  landing: {
    positiveSelectors: ["main h1", "main h2", "main h3", "main p", "section h1", "section h2", "section h3", "section p", "[class*='hero' i] h1", "[class*='feature' i] p"],
    negativeSelectors: [...commonNegativeSelectors, "nav", "header", "footer", "button", "[role='button']", "[class*='legal' i]"],
    minPositiveTranslated: 4,
    maxNegativeTranslated: 2,
    minUnits: 6,
    minAcceptedCandidates: 5,
    requiredCategories: ["heading", "content-block", "card-text"],
  },
  "search-results": {
    positiveSelectors: ["#search h3", "#search .VwiC3b", "#search .IsZvec", ".result h2", ".result h3", ".result p", "[data-testid='result-title']", "[data-testid='result-snippet']"],
    negativeSelectors: [...commonNegativeSelectors, "cite", "input[type='search']", "form input", "[role='search']", "[aria-label*='filter' i]", "[class*='url' i]", "[class*='date' i]"],
    minPositiveTranslated: 4,
    maxNegativeTranslated: 1,
    minUnits: 6,
    minAcceptedCandidates: 5,
    requiredCategories: ["card-text", "content-block"],
    requiresDynamic: true,
  },
  "data-dashboard": {
    positiveSelectors: ["[class*='card' i] h2", "[class*='card' i] h3", "[class*='card' i] p", "[class*='tooltip' i]", "[role='tooltip']", "[class*='description' i]", "h1", "h2"],
    negativeSelectors: [...commonNegativeSelectors, "[class*='percent' i]", "[class*='rank' i]"],
    minPositiveTranslated: 4,
    maxNegativeTranslated: 1,
    minUnits: 5,
    minAcceptedCandidates: 4,
    requiredCategories: ["card-text", "content-block", "heading"],
    requiresDynamic: true,
  },
  "hover-tooltip": {
    positiveSelectors: ["[role='tooltip']", "[popover]", "[data-tippy-root]", ".tippy-box", ".tooltip", ".popover", "[class*='tooltip' i]"],
    negativeSelectors: [...commonNegativeSelectors, "[class*='icon' i]", "button", "[role='button']"],
    minPositiveTranslated: 1,
    maxNegativeTranslated: 1,
    minUnits: 1,
    minAcceptedCandidates: 1,
    requiredCategories: ["content-block", "card-text", "heading"],
    requiresDynamic: true,
    requiresHover: true,
  },
  "ai-chat": {
    positiveSelectors: ["[data-message-author-role='assistant']", "[data-testid*='conversation' i] p", "[class*='message' i] p", "[class*='assistant' i] p"],
    negativeSelectors: [...commonNegativeSelectors, "textarea", "[contenteditable='true']", "form textarea", "button", "[role='button']", "[class*='sidebar' i]"],
    minPositiveTranslated: 1,
    maxNegativeTranslated: 0,
    minUnits: 1,
    minAcceptedCandidates: 1,
    requiredCategories: ["comment", "content-block"],
    requiresDynamic: true,
  },
  "adult-video-list": {
    positiveSelectors: [".video-title", "[class*='video-title' i]", "[class*='VideoTitle']", ".title", "a.title", "h1", "h2", "h3"],
    negativeSelectors: [...commonNegativeSelectors, "[class*='duration' i]", "[class*='views' i]", "[class*='ad' i]", "button", "[role='button']", "[class*='sidebar' i]"],
    minPositiveTranslated: 5,
    maxNegativeTranslated: 1,
    minUnits: 6,
    minAcceptedCandidates: 5,
    requiredCategories: ["card-text", "heading"],
  },
};

export function fixtureExpectationForKind(fixtureKind) {
  return realSiteFixtureExpectations[fixtureKind] ?? {
    positiveSelectors: ["h1", "h2", "h3", "p", "li", "blockquote"],
    negativeSelectors: commonNegativeSelectors,
    minPositiveTranslated: 3,
    maxNegativeTranslated: 1,
    minUnits: 3,
    minAcceptedCandidates: 3,
    requiredCategories: ["content-block"],
  };
}

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
    dynamicModes: ["normal"],
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

export function createRegressionProviderConfig({ provider = "fake", env = process.env } = {}) {
  return {
    provider,
    openaiEndpoint: env.IMT_REGRESSION_OPENAI_ENDPOINT ?? "https://api.openai.com/v1/chat/completions",
    openaiApiKey: env.IMT_REGRESSION_OPENAI_API_KEY ?? "",
    openaiModel: env.IMT_REGRESSION_OPENAI_MODEL ?? "gpt-4o-mini",
    openaiMaxConcurrentRequests: Number(env.IMT_REGRESSION_OPENAI_CONCURRENCY ?? 2),
    openaiMaxBatchItems: Number(env.IMT_REGRESSION_OPENAI_BATCH_ITEMS ?? 16),
    openaiMaxBatchChars: Number(env.IMT_REGRESSION_OPENAI_BATCH_CHARS ?? 6000),
    openaiRequestTimeoutMs: Number(env.IMT_REGRESSION_OPENAI_TIMEOUT_MS ?? 45000),
    deepseekEndpoint: env.IMT_REGRESSION_DEEPSEEK_ENDPOINT ?? "https://api.deepseek.com/chat/completions",
    deepseekApiKey: env.IMT_REGRESSION_DEEPSEEK_API_KEY ?? env.IMT_REGRESSION_OPENAI_API_KEY ?? "",
    deepseekModel: env.IMT_REGRESSION_DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    deepseekMaxConcurrentRequests: Number(env.IMT_REGRESSION_DEEPSEEK_CONCURRENCY ?? 4),
    deepseekMaxBatchItems: Number(env.IMT_REGRESSION_DEEPSEEK_BATCH_ITEMS ?? 4),
    deepseekMaxBatchChars: Number(env.IMT_REGRESSION_DEEPSEEK_BATCH_CHARS ?? 1200),
    deepseekRequestTimeoutMs: Number(env.IMT_REGRESSION_DEEPSEEK_TIMEOUT_MS ?? 45000),
    geminiEndpoint: env.IMT_REGRESSION_GEMINI_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta",
    geminiApiKey: env.IMT_REGRESSION_GEMINI_API_KEY ?? "",
    geminiModel: env.IMT_REGRESSION_GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview",
    geminiMaxConcurrentRequests: Number(env.IMT_REGRESSION_GEMINI_CONCURRENCY ?? 2),
    geminiMaxBatchItems: Number(env.IMT_REGRESSION_GEMINI_BATCH_ITEMS ?? 16),
    geminiMaxBatchChars: Number(env.IMT_REGRESSION_GEMINI_BATCH_CHARS ?? 6000),
    geminiRequestTimeoutMs: Number(env.IMT_REGRESSION_GEMINI_TIMEOUT_MS ?? 45000),
    firstTranslationTimeoutMs: Number(env.IMT_REGRESSION_FIRST_TRANSLATION_TIMEOUT_MS ?? (provider === "fake" ? 8000 : 20000)),
    translationSettleTimeoutMs: Number(env.IMT_REGRESSION_TRANSLATION_SETTLE_TIMEOUT_MS ?? (provider === "fake" ? 5000 : 45000)),
    translationSettleQuietMs: Number(env.IMT_REGRESSION_TRANSLATION_SETTLE_QUIET_MS ?? 1000),
    dynamicActionTimeoutMs: Number(env.IMT_REGRESSION_DYNAMIC_ACTION_TIMEOUT_MS ?? (provider === "fake" ? 8000 : 30000)),
    siteDynamicModes: parseSiteDynamicModeOverrides(env.IMT_REGRESSION_SITE_DYNAMIC_MODES ?? ""),
  };
}

export function validateRegressionProviderConfig(config, { dynamicModes = [], selectedSites = [], siteFilter = [] } = {}) {
  const supportedProviders = new Set(["fake", "microsoft", "openai-compatible", "deepseek", "gemini"]);
  if (!supportedProviders.has(config.provider)) {
    throw new Error(`Unsupported IMT_REGRESSION_PROVIDER: ${config.provider}`);
  }
  const supportedDynamicModes = new Set(["off", "conservative", "normal"]);
  for (const dynamicMode of dynamicModes) {
    if (!supportedDynamicModes.has(dynamicMode)) throw new Error(`Unsupported IMT_REGRESSION_DYNAMIC_MODES value: ${dynamicMode}`);
  }
  if (dynamicModes.length === 0) throw new Error("IMT_REGRESSION_DYNAMIC_MODES must include at least one mode");
  if (selectedSites.length === 0) throw new Error(`IMT_REGRESSION_SITE_FILTER matched no sites: ${siteFilter.join(", ")}`);
  if (config.provider === "openai-compatible" && !config.openaiApiKey) {
    throw new Error("IMT_REGRESSION_OPENAI_API_KEY is required when IMT_REGRESSION_PROVIDER=openai-compatible");
  }
  if (config.provider === "deepseek" && !config.deepseekApiKey) {
    throw new Error("IMT_REGRESSION_DEEPSEEK_API_KEY is required when IMT_REGRESSION_PROVIDER=deepseek");
  }
  if (config.provider === "gemini" && !config.geminiApiKey) {
    throw new Error("IMT_REGRESSION_GEMINI_API_KEY is required when IMT_REGRESSION_PROVIDER=gemini");
  }
}

export function publicRegressionConfig(config) {
  return {
    ...config,
    openaiApiKey: config.openaiApiKey ? "[set]" : "",
    deepseekApiKey: config.deepseekApiKey ? "[set]" : "",
    geminiApiKey: config.geminiApiKey ? "[set]" : "",
  };
}

function parseSiteDynamicModeOverrides(value) {
  const overrides = {};
  for (const entry of parseCsv(value)) {
    const [rawHost, rawMode] = entry.split("=").map((part) => part?.trim()).filter(Boolean);
    if (!rawHost || !["off", "conservative", "normal"].includes(rawMode)) continue;
    overrides[rawHost] = rawMode;
  }
  return overrides;
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
  if (isCloudflareChallenge(metrics)) return "cloudflare challenge";
  if (isAmazonRobotCheck(site, metrics)) return "robot check";
  if (isAmazonUnavailablePage(site, metrics)) return "unavailable page";
  if (isEtsyAccessDeniedPage(site, metrics)) return "access denied page";
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

function isCloudflareChallenge(metrics) {
  const text = `${metrics.title ?? ""} ${metrics.bodyTextPreview ?? ""}`;
  return /cloudflare|checking if the site connection is secure|verify you are human|正在进行安全验证|安全服务防护恶意自动程序|由 Cloudflare 提供/i.test(text);
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

function isEtsyAccessDeniedPage(site, metrics) {
  return site.host === "etsy.com" &&
    metrics.bodyTextLength === 0 &&
    /etsy\.com/i.test(`${metrics.title ?? ""} ${metrics.url ?? ""}`);
}

function isRedditSite(site) {
  return site.host === "reddit.com" || site.host === "old.reddit.com" || site.host.endsWith(".reddit.com");
}

function isAmazonSite(site) {
  return site.host === "amazon.com" || site.host.endsWith(".amazon.com");
}
