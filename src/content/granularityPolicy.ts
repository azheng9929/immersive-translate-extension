import { normalizeVisibleText } from "../shared/normalize";
import { shouldSkipForTargetLanguage } from "../shared/languageHeuristics";
import type { UnitCategory } from "../shared/types";

export type GranularityOptions = {
  hostname?: string;
  targetLang?: string;
  allowTooltip?: boolean;
  contentSelectors?: readonly ContentRule[];
  excludeSelectors?: readonly string[];
};

export type TextGranularityDecision = {
  skip: boolean;
  root?: HTMLElement;
  category?: UnitCategory;
  reason?: string;
};

type ContentRule = {
  selector: string;
  category: UnitCategory;
};

type SiteGranularityPolicy = {
  domains: readonly string[];
  contentRules: readonly ContentRule[];
  skipSelectors: readonly string[];
  skipPhrases: readonly string[];
  skipTextPatterns: readonly RegExp[];
  skipBeforeContent?: boolean;
};

const GLOBAL_SKIP_SELECTORS = [
  '[data-imt-managed="true"]',
  '[data-imt-skip="true"]',
  '[data-imt-state="translated"]',
  '[translate="no"]',
  "[translate=no]",
  ".notranslate",
  '[role="tooltip"]',
  "[popover]",
  "meta",
  "link",
  "script",
  "noscript",
  "style",
  "code",
  "pre",
  "textarea",
  "time",
  "kbd",
  "svg",
  "g",
  "ruby",
  "rt",
  "rp",
  "math",
  "d-math",
  "samp",
  ".social-share",
  ".share-nav",
  '[data-toolbar="share"]',
  ".o-share",
  ".prism-code",
  ".enlighter-code",
  ".rc-CodeBlock",
  '[role="code"]',
  "table.highlight",
  "hypothesis-highlight",
  ".hypothesis-highlight",
  ".material-icons",
  "material-icon",
  'span[class^="material-symbols-"]',
  ".google-symbols",
  "i.fa",
  'i[class^="fa-"]',
  "visuallyhidden",
  ".visuallyhidden",
  ".sr-only",
] as const;

const GLOBAL_SKIP_SELECTORS_WITH_ALLOWED_TOOLTIPS = GLOBAL_SKIP_SELECTORS.filter(
  (selector) => selector !== '[role="tooltip"]' && selector !== "[popover]",
);

const GLOBAL_SKIP_TEXT_PATTERNS = [
  /^@[A-Za-z0-9_.-]{1,50}$/,
  /^u\/[A-Za-z0-9_-]{1,40}$/i,
  /^r\/[A-Za-z0-9_-]{1,40}$/i,
  /^id@https?:\/\/(?:x\.com|twitter\.com)\/[\w-]+\/status\/\d+/i,
  /^https?:\/\//i,
  /^[A-Za-z]:[\\/][^\s]+$/,
  /^\.{0,2}[\\/][^\s]+$/,
  /^[#$][a-f0-9]{7,}$/i,
  /^0x[a-f0-9]{7,}$/i,
  /^[a-f0-9]{16,}$/i,
  /^(?:const|let|var|function|import|from|require\(|export\s)/,
] as const;

const YOUTUBE_POLICY: SiteGranularityPolicy = {
  domains: ["youtube.com"],
  contentRules: [
    { selector: "h1.title, ytd-watch-metadata h1, h1 yt-formatted-string", category: "heading" },
    { selector: "yt-formatted-string#content-text", category: "comment" },
    { selector: "#description, #description-inline-expander, ytd-text-inline-expander", category: "content-block" },
    {
      selector: "yt-formatted-string#description-text, yt-formatted-string.metadata-snippet-text",
      category: "card-text",
    },
    {
      selector:
        "#video-title, a#video-title, yt-formatted-string.ytd-compact-video-renderer, yt-formatted-string.ytd-grid-video-renderer",
      category: "card-text",
    },
    { selector: "span.captions-text", category: "comment" },
  ],
  skipSelectors: [
    "#masthead-container",
    "#guide-content",
    "ytd-mini-guide-renderer",
    "ytd-guide-entry-renderer",
    "ytd-searchbox",
    "#top-level-buttons-computed",
    "#metadata-line",
    "ytd-thumbnail-overlay-time-status-renderer",
    "ytd-live-chat-frame",
    "ytd-menu-renderer",
    "ytd-button-renderer",
    "yt-icon",
    "button",
    '[role="button"]',
    "#owner",
    "#subscribe-button",
    "ytd-subscribe-button-renderer",
    "ytd-comments-header-renderer",
    "ytd-sort-filter-sub-menu-renderer",
    "ytd-comment-action-buttons-renderer",
    ".ytp-chrome-bottom",
    ".ytp-chrome-top",
    ".ytp-button",
    "#hover-overlays",
    "ytd-thumbnail",
  ],
  skipPhrases: [
    "subscribe",
    "subscribed",
    "subscribers",
    "join",
    "share",
    "save",
    "report",
    "download",
    "show more",
    "show less",
    "like",
    "dislike",
    "reply",
    "sort by",
    "top comments",
    "newest first",
    "edit",
    "view",
    "autoplay",
    "cast",
    "settings",
    "play",
    "pause",
    "skip",
    "next",
    "previous",
    "transcript",
    "captions",
    "quality",
    "playback speed",
    "more",
    "stats for nerds",
  ],
  skipTextPatterns: [
    /^\d+(\.\d+)?[KMB\u4e07\u4ebf]?$/i,
    /^\d+:\d{2}(?::\d{2})?$/,
    /^\d+(\.\d+)?[KMB]?\s+views?\b/i,
    /^\d+(\.\d+)?[KMB]?\s+watching now\b/i,
    /\b\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago$/i,
    /^@\w[\w.-]{0,40}$/,
  ],
};

const REDDIT_POLICY: SiteGranularityPolicy = {
  domains: ["reddit.com"],
  contentRules: [
    { selector: '[data-testid="post-title"], a[data-testid="post-title"], [slot="title"]', category: "card-text" },
    {
      selector:
        '[data-testid="post-content"] p, [data-test-id="post-content"] p, shreddit-post [slot="text-body"], div[data-post-click-location="text-body"] p',
      category: "content-block",
    },
    { selector: '[data-testid="comment"] p, shreddit-comment p', category: "comment" },
    { selector: "#right-sidebar-container .i18n-translatable-text", category: "card-text" },
    { selector: "#right-sidebar-container h2.i18n-translatable-text", category: "card-text" },
    { selector: '#right-sidebar-container [data-testid="community-status-text"] p', category: "content-block" },
  ],
  skipSelectors: [
    "faceplate-timeago",
    "time",
    "faceplate-screen-reader-content",
    "shreddit-post-overflow-menu",
    "shreddit-join-button",
    "faceplate-hovercard",
    "faceplate-tracker",
    "faceplate-number",
    "shreddit-post-flair",
    "shreddit-distinguished-post-tags",
    '[data-testid="post_author_link"]',
    '[data-testid="comment_author_link"]',
    '[data-testid="comment_author"]',
    "a.author",
    "span.author",
    '[slot="credit-bar"]',
    "#feed-post-credit-bar",
    '[data-click-id="share"]',
    '[data-click-id="upvote"]',
    '[data-click-id="downvote"]',
    '[data-click-id="comments"]',
    '[data-click-id="save"]',
    '[data-click-id="award"]',
    "button",
    '[role="button"]',
    "nav",
    "header",
    "footer",
    "input",
    "textarea",
    "form",
    '[data-promoted="true"]',
  ],
  skipPhrases: [
    "upvote",
    "downvote",
    "share",
    "save",
    "hide",
    "report",
    "crosspost",
    "award",
    "reply",
    "give award",
    "comments",
    "comment",
    "best",
    "top",
    "new",
    "controversial",
    "old",
    "random",
    "live",
    "hot",
    "rising",
    "follow",
    "join",
    "create post",
    "community options",
    "sort by",
    "leave",
    "view all comments",
    "more comments",
    "continue this thread",
    "copy link",
    "mark as spoiler",
    "delete",
    "edit",
    "embed",
    "open in app",
    "view community",
  ],
  skipTextPatterns: [
    /^u\/[A-Za-z0-9_-]{1,40}$/i,
    /^r\/[A-Za-z0-9_-]{1,40}$/i,
    /^[+-]?\d+(\.\d+)?[KMB\u4e07\u4ebf]?$/i,
    /^\d+(\.\d+)?[KMB]?\s+comments?$/i,
    /^(?:posted\s+)?\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago$/i,
  ],
};

const OLD_REDDIT_POLICY: SiteGranularityPolicy = {
  domains: ["old.reddit.com"],
  contentRules: [
    { selector: "p.title > a.title, .thing.link .entry a.title", category: "card-text" },
    { selector: ".linkflairlabel", category: "label" },
    {
      selector:
        ".selftext .usertext-body .md, .expando .usertext .md, .res-expando-box .md, .media-gallery .usertext",
      category: "content-block",
    },
    { selector: ".comment .usertext-body .md, .commentarea .comment .usertext-body .md", category: "comment" },
    { selector: ".side .md h1, .side .md h2, .side .md h3", category: "heading" },
    { selector: ".side .md p, .side .md li", category: "content-block" },
  ],
  skipSelectors: [
    "#sr-header-area",
    "#header",
    "#header-bottom-left",
    "#header-bottom-right",
    "#searchexpando",
    "#search",
    ".tabmenu",
    ".pagename",
    ".rank",
    ".score",
    ".midcol",
    ".arrow",
    ".thumbnail",
    ".expando-button",
    ".entry .tagline",
    ".tagline",
    ".flat-list",
    ".buttons",
    ".domain",
    ".redditname",
    ".subscribers",
    ".users-online",
    ".subscribe-button",
    ".fancy-toggle-button",
    ".sidebox",
    ".login-form-side",
    ".morelink",
    ".titlebox .bottom",
    ".titlebox .age",
    ".account-activity-box",
    ".footer-parent",
    ".bottommenu",
    ".nextprev",
    "a.author",
    "span.author",
    ".userattrs",
    ".age",
    "time",
    "button",
    "input",
    "textarea",
    "select",
    "form",
  ],
  skipPhrases: [
    "share",
    "save",
    "hide",
    "report",
    "reply",
    "permalink",
    "source",
    "embed",
    "give award",
    "load more comments",
    "continue this thread",
    "sorted by",
    "best",
    "top",
    "new",
    "controversial",
    "old",
    "q&a",
  ],
  skipTextPatterns: [
    /^u\/[A-Za-z0-9_-]{1,40}$/i,
    /^r\/[A-Za-z0-9_-]{1,40}$/i,
    /^[+-]?\d+(\.\d+)?[KMB\u4e07\u4ebf]?$/i,
    /^\d+(\.\d+)?[KMB]?\s+(?:points?|comments?)$/i,
    /^\(?[a-z0-9.-]+\.[a-z]{2,}\)?$/i,
    /^(?:submitted\s+)?\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago(?:\s+by)?$/i,
  ],
};

const X_POLICY: SiteGranularityPolicy = {
  domains: ["x.com", "twitter.com"],
  contentRules: [
    { selector: 'div[data-testid="tweetText"], [data-testid="tweetText"]', category: "comment" },
    { selector: 'div[data-testid="UserDescription"]', category: "content-block" },
    { selector: '[data-testid="card.layoutSmall.detail"] > div:nth-child(2)', category: "card-text" },
    { selector: '[data-testid="developerBuiltCardContainer"] > div:nth-child(2)', category: "card-text" },
    { selector: '[data-testid="card.layoutLarge.detail"] > div:nth-child(2)', category: "card-text" },
    { selector: 'article div[lang]:not([role="button"])', category: "comment" },
  ],
  skipSelectors: [
    '[data-testid="HoverCard"]',
    '[data-testid="hoverCardParent"]',
    '[data-testid="placementTracking"]',
    '[aria-live="polite"]',
    '[data-testid="sidebarColumn"]',
    '[aria-label="Timeline: Trending now"]',
    '[data-testid="SearchBox_Search_Input"]',
    '[role="button"]',
    "nav",
    "aside",
    'header[role="banner"]',
    "time",
    '[data-testid="User-Name"]',
    '[data-testid="UserName"]',
    '[data-testid="UserCell"]',
    '[data-testid="suggestedUserHover"]',
    '[data-testid="trend"]',
    '[data-testid="reply"]',
    '[data-testid="retweet"]',
    '[data-testid="like"]',
    '[data-testid="share"]',
    '[data-testid="bookmark"]',
    '[data-testid="analytics"]',
    '[role="group"][aria-label]',
  ],
  skipPhrases: [
    "reply",
    "repost",
    "like",
    "view",
    "share",
    "follow",
    "following",
    "show more",
    "copy link",
    "likes",
    "liked",
    "reposts",
    "quotes",
    "views",
  ],
  skipTextPatterns: [
    /^@\w[\w.-]{0,40}$/,
    /^\d+(\.\d+)?[KMB\u4e07\u4ebf]?$/i,
    /^\d+[smhdw]$/i,
    /^\d+(\.\d+)?[KMB\u4e07\u4ebf]?\s+(?:likes?|reposts?|quotes?|views?)$/i,
  ],
};

const THREADS_POLICY: SiteGranularityPolicy = {
  domains: ["threads.com", "threads.net"],
  skipBeforeContent: true,
  contentRules: [
    { selector: '[role="article"] div[dir="auto"], article div[dir="auto"]', category: "comment" },
    { selector: '[role="article"] span[dir="auto"], article span[dir="auto"]', category: "comment" },
    { selector: '[data-pressable-container="true"] div[dir="auto"]', category: "comment" },
    { selector: '[data-pressable-container="true"] span[dir="auto"]', category: "comment" },
    { selector: '[role="dialog"] [role="article"] div[dir="auto"]', category: "comment" },
    { selector: '[role="dialog"] [role="article"] span[dir="auto"]', category: "comment" },
  ],
  skipSelectors: [
    "nav",
    "header",
    "footer",
    "aside",
    "menu",
    "time",
    "button",
    '[role="button"]',
    '[role="menu"]',
    '[role="menuitem"]',
    '[role="navigation"]',
    '[aria-live="polite"]',
    'a[href^="/@"]',
    'a[href*="/@"]',
    ".x1rg5ohu",
    ".xat24cr.xdj266r a",
    ".x6s0dn4.x40hh3e.xrvj5dj.xxfwaov",
    ".x6s0dn4.x78zum5",
    ".xpvyfi4.x1xdureb.x1agbcgv",
    ".xpvyfi4.x1npkx4u.x1ms6mhf",
  ],
  skipPhrases: [
    "for you",
    "following",
    "reply",
    "repost",
    "like",
    "likes",
    "share",
    "send",
    "follow",
    "log in",
    "sign up",
    "view replies",
    "show this thread",
    "liked by",
    "original author",
  ],
  skipTextPatterns: [
    /^@\w[\w.-]{0,40}$/,
    /^\d+(\.\d+)?[KMB\u4e07\u4ebf]?$/i,
    /^\d+[smhdw]$/i,
    /^\d+(\.\d+)?[KMB\u4e07\u4ebf]?\s+(?:likes?|replies?|reposts?|quotes?|views?)$/i,
    /^(?:\d+\s+)?(?:replies?|likes?|reposts?|quotes?|views?)$/i,
  ],
};

const SITE_POLICIES = [YOUTUBE_POLICY, OLD_REDDIT_POLICY, REDDIT_POLICY, X_POLICY, THREADS_POLICY] as const;

export function resolveTextGranularity(
  element: HTMLElement,
  value: string,
  options: GranularityOptions = {},
): TextGranularityDecision {
  const text = normalizeVisibleText(value);
  if (!text) return { skip: true, reason: "empty" };

  if (matchesClosest(element, globalSkipSelectors(options))) return { skip: true, reason: "global-selector" };
  if (matchesAnyPattern(text, GLOBAL_SKIP_TEXT_PATTERNS)) return { skip: true, reason: "global-text" };
  if (shouldSkipForTargetLanguage(text, options.targetLang)) return { skip: true, reason: "target-language" };

  if (options.excludeSelectors?.length && matchesClosest(element, options.excludeSelectors)) {
    return { skip: true, reason: "rule-selector" };
  }

  const configuredContentRule = findContentRule(element, options.contentSelectors ?? []);
  if (configuredContentRule) {
    return {
      skip: false,
      root: configuredContentRule.root,
      category: configuredContentRule.category,
    };
  }

  const policy = resolvePolicy(options.hostname);
  if (!policy) return { skip: false };

  if (policy.skipBeforeContent) {
    const skipDecision = resolveSiteSkipDecision(element, text, policy);
    if (skipDecision) return skipDecision;
  }

  const contentRule = findContentRule(element, policy.contentRules);
  if (contentRule) {
    return {
      skip: false,
      root: contentRule.root,
      category: contentRule.category,
    };
  }

  return resolveSiteSkipDecision(element, text, policy) ?? { skip: false };
}

function globalSkipSelectors(options: GranularityOptions): readonly string[] {
  return options.allowTooltip ? GLOBAL_SKIP_SELECTORS_WITH_ALLOWED_TOOLTIPS : GLOBAL_SKIP_SELECTORS;
}

function resolvePolicy(hostname = ""): SiteGranularityPolicy | undefined {
  const normalizedHostname = hostname.toLowerCase();
  return SITE_POLICIES.find((policy) =>
    policy.domains.some((domain) => normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`)),
  );
}

function findContentRule(
  element: HTMLElement,
  rules: readonly ContentRule[],
): { root: HTMLElement; category: UnitCategory } | undefined {
  for (const rule of rules) {
    const root = closestMatchingElement(element, rule.selector);
    if (root) return { root, category: rule.category };
  }
  return undefined;
}

function matchesClosest(element: HTMLElement, selectors: readonly string[]): boolean {
  return selectors.some((selector) => Boolean(closestMatchingElement(element, selector)));
}

function closestMatchingElement(element: HTMLElement, selector: string): HTMLElement | null {
  try {
    return element.closest<HTMLElement>(selector);
  } catch {
    return null;
  }
}

function matchesExactPhrase(text: string, phrases: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return phrases.includes(normalized);
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function resolveSiteSkipDecision(
  element: HTMLElement,
  text: string,
  policy: SiteGranularityPolicy,
): TextGranularityDecision | undefined {
  if (matchesClosest(element, policy.skipSelectors)) return { skip: true, reason: "site-selector" };
  if (matchesExactPhrase(text, policy.skipPhrases)) return { skip: true, reason: "site-phrase" };
  if (matchesAnyPattern(text, policy.skipTextPatterns)) return { skip: true, reason: "site-text" };
  return undefined;
}
