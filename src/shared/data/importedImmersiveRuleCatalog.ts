import type { WebTranslationRule } from "../webRuleTypes";

// Lightweight URL/DOM-shape catalog derived from public/data/imported-immersive-web-rules.json.
// It lets background decide whether the full imported rule chunk is needed for the current page.
export type ImportedImmersiveRuleCatalogEntry = Pick<
  WebTranslationRule,
  "id" | "siteKey" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches"
>;

export const IMPORTED_IMMERSIVE_RULE_CATALOG = [
  {
    "id": "shopee",
    "siteKey": "seller.shopee.*",
    "matches": [
      "seller.shopee.*",
      "shopee.*"
    ]
  },
  {
    "id": "fanbox",
    "siteKey": "fanbox.cc",
    "matches": [
      "*.fanbox.cc"
    ]
  },
  {
    "id": "wikipedia",
    "siteKey": "wikipedia.org",
    "matches": [
      "*.wikipedia.org"
    ]
  },
  {
    "id": "twitter",
    "siteKey": "twitter.com",
    "matches": [
      "twitter.com",
      "mobile.twitter.com",
      "tweetdeck.twitter.com",
      "pro.twitter.com",
      "platform.twitter.com/embed*",
      "x.com",
      "mobile.x.com",
      "tweetdeck.x.com",
      "pro.x.com",
      "platform.x.com/embed*"
    ],
    "excludeMatches": [
      "twitter.com/i/premium_sign_up",
      "twitter.com/settings/subscription",
      "twitter.com/jobs/*",
      "x.com/i/premium_sign_up",
      "x.com/settings/subscription",
      "x.com/settings/account",
      "x.com/jobs/*",
      "x.com/*/tos*",
      "x.com/*/privacy*",
      "x.com/account/access*",
      "x.com/i/account_analytics*",
      "x.com/i/chat*",
      "x.com/settings*"
    ]
  },
  {
    "id": "zoom-asu",
    "siteKey": "zoom.us",
    "matches": [
      "*.zoom.us/rec/*"
    ]
  },
  {
    "id": "zoom",
    "siteKey": "zoom.us",
    "matches": [
      "*.zoom.us"
    ]
  },
  {
    "id": "team",
    "siteKey": "teams.live.com",
    "matches": [
      "teams.live.com",
      "teams.microsoft.com"
    ]
  },
  {
    "id": "googleMeet",
    "siteKey": "meet.google.com",
    "matches": [
      "meet.google.com"
    ]
  },
  {
    "id": "openrouter",
    "siteKey": "openrouter.ai",
    "matches": [
      "openrouter.ai"
    ]
  },
  {
    "id": "polymarket",
    "siteKey": "polymarket.com",
    "matches": [
      "polymarket.com"
    ]
  },
  {
    "id": "hoyolab",
    "siteKey": "www.hoyolab.com",
    "matches": [
      "www.hoyolab.com"
    ]
  },
  {
    "id": "chatter.hume.ai",
    "siteKey": "chatter.hume.ai",
    "matches": [
      "chatter.hume.ai"
    ]
  },
  {
    "id": "threads",
    "siteKey": "www.threads.net",
    "matches": [
      "www.threads.net"
    ]
  },
  {
    "id": "stackoverflow",
    "siteKey": "stackoverflow.com",
    "matches": [
      "stackoverflow.com",
      "*.stackexchange.com",
      "superuser.com",
      "askubuntu.com",
      "serverfault.com"
    ]
  },
  {
    "id": "appleDeveloper",
    "siteKey": "developer.apple.com",
    "matches": [
      "developer.apple.com/documentation/*"
    ]
  },
  {
    "id": "hackerNews",
    "siteKey": "news.ycombinator.com",
    "matches": [
      "news.ycombinator.com"
    ],
    "excludeMatches": [
      "https://news.ycombinator.com/submit",
      "https://news.ycombinator.com/newsfaq.html",
      "https://news.ycombinator.com/newsguidelines.html",
      "https://news.ycombinator.com/security.html"
    ]
  },
  {
    "id": "quora",
    "siteKey": "quora.com",
    "matches": [
      "*.quora.com",
      "quora.com"
    ]
  },
  {
    "id": "oldReddit",
    "siteKey": "old.reddit.com",
    "matches": [
      "old.reddit.com/*/.compact",
      "old.reddit.com/.compact",
      "www.reddit.com/*/.compact",
      "www.reddit.com/.compact"
    ]
  },
  {
    "id": "otherOldReddit",
    "siteKey": "old.reddit.com",
    "matches": [
      "old.reddit.com"
    ]
  },
  {
    "id": "redditList",
    "siteKey": "www.reddit.com",
    "matches": [
      "https://www.reddit.com/r/*/comments/*/*",
      "https://www.reddit.com/",
      "https://www.reddit.com/hot/",
      "https://www.reddit.com/new/",
      "https://www.reddit.com/top/"
    ],
    "excludeMatches": [
      "https://www.reddit.com/r/*/wiki/*"
    ]
  },
  {
    "id": "reddit",
    "siteKey": "www.reddit.com",
    "matches": [
      "www.reddit.com"
    ],
    "excludeMatches": [
      "https://www.reddit.com/r/*/wiki/*",
      "https://www.reddit.com/settings/*",
      "https://www.reddit.com/message/sent/*"
    ]
  },
  {
    "id": "angel",
    "siteKey": "www.angel.com",
    "matches": [
      "www.angel.com"
    ]
  },
  {
    "id": "reuters",
    "siteKey": "www.reuters.com",
    "matches": [
      "www.reuters.com"
    ]
  },
  {
    "id": "npmjs",
    "siteKey": "www.npmjs.com",
    "matches": [
      "https://www.npmjs.com/package/*"
    ]
  },
  {
    "id": "github",
    "siteKey": "github.com",
    "matches": [
      "github.com"
    ],
    "excludeMatches": [
      "https://github.com/*/*/settings",
      "https://github.com/*/*/settings/*",
      "https://github.com/settings/*",
      "https://github.com/sponsors/*",
      "https://github.com/readme/*",
      "https://github.com/readme/",
      "https://github.com/features/*",
      "https://github.com/codespaces",
      "https://github.com/customer-stories/*",
      "https://github.com/signup",
      "https://github.com/login",
      "https://github.com/marketplace",
      "https://github.com/github-copilot*",
      "https://github.com/collections*",
      "https://github.com/resources/events*",
      "https://github.com/pricing*"
    ]
  },
  {
    "id": "github-blog",
    "siteKey": "github.blog",
    "matches": [
      "github.blog"
    ]
  },
  {
    "id": "rmit",
    "siteKey": "www.rmit.edu.au",
    "matches": [
      "www.rmit.edu.au"
    ]
  },
  {
    "id": "youtubeMobile",
    "siteKey": "m.youtube.com",
    "matches": [
      "m.youtube.com"
    ]
  },
  {
    "id": "twitch",
    "siteKey": "www.twitch.tv",
    "matches": [
      "www.twitch.tv"
    ]
  },
  {
    "id": "youtube",
    "siteKey": "www.youtube.com",
    "matches": [
      "www.youtube.com"
    ]
  },
  {
    "id": "youtubekids",
    "siteKey": "www.youtubekids.com",
    "matches": [
      "www.youtubekids.com"
    ]
  },
  {
    "id": "instagramMessage",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/direct/*"
    ]
  },
  {
    "id": "instagramPost",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/p/*",
      "https://www.instagram.com/reels/*"
    ]
  },
  {
    "id": "otherInstagram",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/*"
    ],
    "excludeMatches": [
      "https://www.instagram.com/b/*"
    ]
  },
  {
    "id": "1paragraph",
    "siteKey": "1paragraph.app",
    "matches": [
      "1paragraph.app"
    ]
  },
  {
    "id": "poeditor",
    "siteKey": "poeditor.com",
    "matches": [
      "https://poeditor.com/projects/*"
    ]
  },
  {
    "id": "substack",
    "siteKey": "substack.com",
    "matches": [
      "*.substack.com",
      "newsletter.rootsofprogress.org"
    ],
    "selectorMatches": [
      "link[href^='https://substackcdn.com/bundle/'][rel=preload]"
    ]
  },
  {
    "id": "seekingalpha",
    "siteKey": "seekingalpha.com",
    "matches": [
      "seekingalpha.com/article/*",
      "seekingalpha.com/news/*"
    ]
  },
  {
    "id": "hnAlgolia",
    "siteKey": "hn.algolia.com",
    "matches": [
      "hn.algolia.com"
    ]
  },
  {
    "id": "readwise",
    "siteKey": "read.readwise.io",
    "matches": [
      "read.readwise.io"
    ]
  },
  {
    "id": "inoreader",
    "siteKey": "www.inoreader.com",
    "matches": [
      "www.inoreader.com",
      "*.inoreader.com"
    ],
    "excludeMatches": [
      "https://www.inoreader.com/features*",
      "https://www.inoreader.com/blog*",
      "https://www.inoreader.com/discover*",
      "https://www.inoreader.com/contact*",
      "https://www.inoreader.com/pricing*",
      "https://www.inoreader.com/enterprise*"
    ]
  },
  {
    "id": "aha",
    "siteKey": "ideas.aha.io",
    "matches": [
      "*.ideas.aha.io"
    ]
  },
  {
    "id": "googleScholar",
    "siteKey": "scholar.google.*",
    "matches": [
      "scholar.google.*/*",
      "scholar.google.com.*/*",
      "scholar.google.co.*/*"
    ]
  },
  {
    "id": "googleMail",
    "siteKey": "mail.google.com",
    "matches": [
      "mail.google.com"
    ]
  },
  {
    "id": "googleNews",
    "siteKey": "news.google.com",
    "matches": [
      "news.google.com"
    ]
  },
  {
    "id": "outlook",
    "siteKey": "outlook.live.com",
    "matches": [
      "outlook.live.com"
    ]
  },
  {
    "id": "producthunt",
    "siteKey": "www.producthunt.com",
    "matches": [
      "www.producthunt.com"
    ],
    "excludeMatches": [
      "https://www.producthunt.com/stories/*"
    ]
  },
  {
    "id": "discord",
    "siteKey": "discord.com",
    "matches": [
      "https://discord.com/channels/*"
    ]
  },
  {
    "id": "telegram",
    "siteKey": "web.telegram.org",
    "matches": [
      "web.telegram.org/z/*",
      "web.telegram.org/a/*",
      "web.telegram.org/k/*",
      "web.telegram.org/k/"
    ]
  },
  {
    "id": "githubGist",
    "siteKey": "gist.github.com",
    "matches": [
      "gist.github.com"
    ]
  },
  {
    "id": "lobste",
    "siteKey": "lobste.rs",
    "matches": [
      "lobste.rs"
    ],
    "excludeMatches": [
      "https://lobste.rs/about",
      "https://lobste.rs/chat"
    ]
  },
  {
    "id": "slack",
    "siteKey": "slack.com",
    "matches": [
      "*.slack.com"
    ]
  },
  {
    "id": "artstationArtwork",
    "siteKey": "www.artstation.com",
    "matches": [
      "www.artstation.com/artwork/*"
    ]
  },
  {
    "id": "artstationLearning",
    "siteKey": "www.artstation.com",
    "matches": [
      "www.artstation.com/learning/courses/*"
    ]
  },
  {
    "id": "artstationBlog",
    "siteKey": "www.artstation.com",
    "matches": [
      "https://www.artstation.com/blogs",
      "https://www.artstation.com/blogs/*"
    ]
  },
  {
    "id": "figmaCommunity",
    "siteKey": "www.figma.com",
    "matches": [
      "www.figma.com/community/*"
    ]
  },
  {
    "id": "googleIndex",
    "siteKey": "www.google.com",
    "matches": [
      "https://www.google.com/",
      "https://www.google.com.hk/"
    ]
  },
  {
    "id": "googleSearch",
    "siteKey": "www.google.*",
    "matches": [
      "www.google.*/search*"
    ]
  },
  {
    "id": "lowendtalk",
    "siteKey": "lowendtalk.com",
    "matches": [
      "lowendtalk.com"
    ]
  },
  {
    "id": "linkedinFeed",
    "siteKey": "linkedin.com",
    "matches": [
      "https://linkedin.com/feed/*"
    ]
  },
  {
    "id": "indiehackers",
    "siteKey": "www.indiehackers.com",
    "matches": [
      "www.indiehackers.com"
    ]
  },
  {
    "id": "deepwiki",
    "siteKey": "deepwiki.com",
    "matches": [
      "deepwiki.com"
    ]
  },
  {
    "id": "libreddit",
    "siteKey": "libreddit.de",
    "matches": [
      "libreddit.de"
    ]
  },
  {
    "id": "notionSite",
    "siteKey": "notion.site",
    "matches": [
      "notion.site",
      "*.notion.site"
    ],
    "selectorMatches": [
      ".notion-html body",
      ".notion-app"
    ]
  },
  {
    "id": "newyorker",
    "siteKey": "www.newyorker.com",
    "matches": [
      "www.newyorker.com"
    ]
  },
  {
    "id": "typora",
    "siteKey": "typora.io",
    "matches": [
      "typora.io"
    ]
  },
  {
    "id": "startme",
    "siteKey": "start.me",
    "matches": [
      "start.me"
    ]
  },
  {
    "id": "scmp",
    "siteKey": "www.scmp.com",
    "matches": [
      "www.scmp.com"
    ]
  },
  {
    "id": "lesswrong",
    "siteKey": "www.lesswrong.com",
    "matches": [
      "www.lesswrong.com"
    ]
  },
  {
    "id": "mastodon",
    "siteKey": "mastodon.social",
    "matches": [
      "mastodon.social",
      "mastodon.online",
      "kolektiva.social",
      "indieweb.social",
      "mastodon.world",
      "infosec.exchange"
    ],
    "selectorMatches": [
      "div#mastodon"
    ]
  },
  {
    "id": "cnbc",
    "siteKey": "www.cnbc.com",
    "matches": [
      "www.cnbc.com"
    ]
  },
  {
    "id": "dailyDev",
    "siteKey": "app.daily.dev",
    "matches": [
      "app.daily.dev"
    ]
  },
  {
    "id": "pornhub",
    "siteKey": "pornhub.com",
    "matches": [
      "*.pornhub.com",
      "pornhub.com"
    ],
    "excludeMatches": [
      "*.pornhub.com/insights/*",
      "pornhub.com/insights/*"
    ]
  },
  {
    "id": "yourporn",
    "siteKey": "www.youporn.com",
    "matches": [
      "https://www.youporn.com/*"
    ]
  },
  {
    "id": "xvideos",
    "siteKey": "www.xvideos.com",
    "matches": [
      "https://www.xvideos.com/*"
    ]
  },
  {
    "id": "missav",
    "siteKey": "missav.*",
    "matches": [
      "https://missav.*/*"
    ]
  },
  {
    "id": "javbus",
    "siteKey": "www.javbus.com",
    "matches": [
      "https://www.javbus.com/*"
    ]
  },
  {
    "id": "spankbang",
    "siteKey": "spankbang.com",
    "matches": [
      "https://spankbang.com/*"
    ]
  },
  {
    "id": "javdb",
    "siteKey": "javdb*.com",
    "matches": [
      "https://javdb*.com/*"
    ]
  },
  {
    "id": "netflav",
    "siteKey": "netflav*.com",
    "matches": [
      "https://netflav*.com/*"
    ]
  },
  {
    "id": "weibo",
    "siteKey": "weibo.com",
    "matches": [
      "weibo.com",
      "*.weibo.*"
    ],
    "excludeMatches": [
      "passport.weibo.com/sso/signin*"
    ]
  },
  {
    "id": "uxtension",
    "siteKey": "www.uxento.io",
    "matches": [
      "www.uxento.io"
    ]
  },
  {
    "id": "medium",
    "siteKey": "medium.com",
    "matches": [
      "medium.com",
      "*.medium.com"
    ],
    "selectorMatches": [
      "meta[property='al:ios:url'][content^='medium://']"
    ]
  },
  {
    "id": "economist",
    "siteKey": "www.economist.com",
    "matches": [
      "www.economist.com"
    ]
  },
  {
    "id": "healthline",
    "siteKey": "www.healthline.com",
    "matches": [
      "www.healthline.com"
    ]
  },
  {
    "id": "ebay",
    "siteKey": "www.ebay.com",
    "matches": [
      "www.ebay.com"
    ]
  },
  {
    "id": "skinstore",
    "siteKey": "www.skinstore.com",
    "matches": [
      "www.skinstore.com"
    ]
  },
  {
    "id": "tripadvisor",
    "siteKey": "www.tripadvisor.com",
    "matches": [
      "www.tripadvisor.com"
    ]
  },
  {
    "id": "primevideo",
    "siteKey": "www.primevideo.com",
    "matches": [
      "www.primevideo.com",
      "https://*.amazon.co.*/*video*",
      "https://*.amazon.com/*video*",
      "https://*.amazon.*/*video*"
    ]
  },
  {
    "id": "amazon",
    "siteKey": "www.amazon.*",
    "matches": [
      "www.amazon.*"
    ]
  },
  {
    "id": "sellercentral-amazon-message",
    "siteKey": "sellercentral.amazon.*",
    "matches": [
      "https://sellercentral.amazon.*/messaging/inbox*"
    ]
  },
  {
    "id": "visualstudioMarketplace",
    "siteKey": "marketplace.visualstudio.com",
    "matches": [
      "marketplace.visualstudio.com"
    ]
  },
  {
    "id": "bloomberg",
    "siteKey": "www.bloomberg.com",
    "matches": [
      "www.bloomberg.com"
    ],
    "excludeMatches": [
      "https://www.bloomberg.com/live/*"
    ]
  },
  {
    "id": "sciencedirect",
    "siteKey": "www.sciencedirect.com",
    "matches": [
      "www.sciencedirect.com"
    ],
    "excludeMatches": [
      "www.sciencedirect.com/*/pdf/download/*"
    ]
  },
  {
    "id": "thehighestofthemountains",
    "siteKey": "www.thehighestofthemountains.com",
    "matches": [
      "www.thehighestofthemountains.com"
    ]
  },
  {
    "id": "annasArchive",
    "siteKey": "annas-archive.org",
    "matches": [
      "*.annas-archive.org",
      "annas-archive.org"
    ]
  },
  {
    "id": "explainshell",
    "siteKey": "explainshell.com",
    "matches": [
      "explainshell.com"
    ]
  },
  {
    "id": "apnews",
    "siteKey": "apnews.com",
    "matches": [
      "apnews.com"
    ]
  },
  {
    "id": "googlePlay",
    "siteKey": "play.google.com",
    "matches": [
      "play.google.com"
    ]
  },
  {
    "id": "tumblr",
    "siteKey": "www.tumblr.com",
    "matches": [
      "www.tumblr.com"
    ]
  },
  {
    "id": "foxnews",
    "siteKey": "www.foxnews.com",
    "matches": [
      "www.foxnews.com"
    ]
  },
  {
    "id": "construct",
    "siteKey": "www.construct.net",
    "matches": [
      "www.construct.net"
    ],
    "excludeMatches": [
      "preview.construct.net",
      "editor.construct.net"
    ]
  },
  {
    "id": "getpocket",
    "siteKey": "getpocket.com",
    "matches": [
      "getpocket.com"
    ]
  },
  {
    "id": "fandom",
    "siteKey": "fandom.com",
    "matches": [
      "*.fandom.com"
    ]
  },
  {
    "id": "huggingface",
    "siteKey": "huggingface.co",
    "matches": [
      "huggingface.co"
    ]
  },
  {
    "id": "epubReader",
    "siteKey": "epub-reader.online",
    "matches": [
      "epub-reader.online"
    ]
  },
  {
    "id": "you",
    "siteKey": "you.com",
    "matches": [
      "https://you.com/search"
    ]
  },
  {
    "id": "auth0Openai",
    "siteKey": "auth0.openai.com",
    "matches": [
      "auth0.openai.com"
    ]
  },
  {
    "id": "chatOpenai",
    "siteKey": "chat.openai.com",
    "matches": [
      "chat.openai.com",
      "chatgpt.com"
    ]
  },
  {
    "id": "poe",
    "siteKey": "poe.com",
    "matches": [
      "https://poe.com/*"
    ]
  },
  {
    "id": "janitorai",
    "siteKey": "janitorai.com",
    "matches": [
      "https://janitorai.com"
    ]
  },
  {
    "id": "glasp",
    "siteKey": "glasp.co",
    "matches": [
      "glasp.co"
    ]
  },
  {
    "id": "developerChrome",
    "siteKey": "developer.chrome.com",
    "matches": [
      "developer.chrome.com"
    ]
  },
  {
    "id": "android",
    "siteKey": "developer.android.google.cn",
    "matches": [
      "developer.android.google.cn",
      "developer.android.com"
    ]
  },
  {
    "id": "ft",
    "siteKey": "www.ft.com",
    "matches": [
      "www.ft.com"
    ]
  },
  {
    "id": "microsoft",
    "siteKey": "apps.microsoft.com",
    "matches": [
      "https://apps.microsoft.com/store/detail/*"
    ]
  },
  {
    "id": "gitlab",
    "siteKey": "gitlab.com",
    "matches": [
      "gitlab.com"
    ]
  },
  {
    "id": "tiktok",
    "siteKey": "www.tiktok.com",
    "matches": [
      "https://www.tiktok.com/*/video/*",
      "https://www.tiktok.com/*"
    ]
  },
  {
    "id": "steamcommunity",
    "siteKey": "steamcommunity.com",
    "matches": [
      "steamcommunity.com"
    ]
  },
  {
    "id": "steampoweredApp",
    "siteKey": "store.steampowered.com",
    "matches": [
      "store.steampowered.com/app/*"
    ]
  },
  {
    "id": "steampowered",
    "siteKey": "store.steampowered.com",
    "matches": [
      "store.steampowered.com"
    ]
  },
  {
    "id": "nature",
    "siteKey": "www.nature.com",
    "matches": [
      "https://www.nature.com/articles/*"
    ],
    "excludeMatches": [
      "https://www.nature.com/articles/*.pdf"
    ]
  },
  {
    "id": "webofscience",
    "siteKey": "www.webofscience.com",
    "matches": [
      "https://www.webofscience.com/*",
      "https://webofscience.clarivate.*/*",
      "www-webofscience-com-*.*",
      "webofscience-clarivate*.*",
      "*.ustc.edu.*/*wos*"
    ],
    "selectorMatches": [
      "app-wos.mat-typography"
    ]
  },
  {
    "id": "science",
    "siteKey": "www.science.org",
    "matches": [
      "www.science.org"
    ]
  },
  {
    "id": "appleinsider",
    "siteKey": "appleinsider.com",
    "matches": [
      "appleinsider.com"
    ]
  },
  {
    "id": "jetbrains",
    "siteKey": "jetbrains.com",
    "matches": [
      "https://*.jetbrains.com"
    ]
  },
  {
    "id": "theverge",
    "siteKey": "www.theverge.com",
    "matches": [
      "www.theverge.com"
    ]
  },
  {
    "id": "simp",
    "siteKey": "beta.simp.red",
    "matches": [
      "https://beta.simp.red/trans*"
    ]
  },
  {
    "id": "lookintobitcoin",
    "siteKey": "www.lookintobitcoin.com",
    "matches": [
      "https://www.lookintobitcoin.com/charts/*"
    ]
  },
  {
    "id": "openaiAccount",
    "siteKey": "platform.openai.com",
    "matches": [
      "https://platform.openai.com/account/api-keys*"
    ]
  },
  {
    "id": "openaiDocs",
    "siteKey": "platform.openai.com",
    "matches": [
      "https://platform.openai.com/docs*"
    ]
  },
  {
    "id": "pkgStd",
    "siteKey": "pkg.go.dev",
    "matches": [
      "https://pkg.go.dev/std"
    ]
  },
  {
    "id": "pkg",
    "siteKey": "pkg.go.dev",
    "matches": [
      "https://pkg.go.dev/*"
    ]
  },
  {
    "id": "explainpaper",
    "siteKey": "www.explainpaper.com",
    "matches": [
      "https://www.explainpaper.com/reader*"
    ]
  },
  {
    "id": "coinmarketcap",
    "siteKey": "coinmarketcap.com",
    "matches": [
      "coinmarketcap.com"
    ]
  },
  {
    "id": "wandb",
    "siteKey": "wandb.ai",
    "matches": [
      "wandb.ai"
    ]
  },
  {
    "id": "paulgraham",
    "siteKey": "paulgraham.com",
    "matches": [
      "paulgraham.com"
    ]
  },
  {
    "id": "zendesk",
    "siteKey": "zendesk.com",
    "matches": [
      "https://*.zendesk.com/agent/*"
    ]
  },
  {
    "id": "migadu",
    "siteKey": "webmail.migadu.com",
    "matches": [
      "webmail.migadu.com"
    ]
  },
  {
    "id": "thehackernews",
    "siteKey": "thehackernews.com",
    "matches": [
      "thehackernews.com"
    ]
  },
  {
    "id": "brown",
    "siteKey": "cs.brown.edu",
    "matches": [
      "cs.brown.edu"
    ]
  },
  {
    "id": "fiverr",
    "siteKey": "www.fiverr.com",
    "matches": [
      "https://www.fiverr.com/inbox/*"
    ]
  },
  {
    "id": "fiverr-main",
    "siteKey": "fiverr.com",
    "matches": [
      "*.fiverr.com"
    ]
  },
  {
    "id": "jira",
    "siteKey": "jira.*.com",
    "matches": [
      "jira.*.com/browse/*",
      "jira.*.com/projects/*"
    ]
  },
  {
    "id": "thehill",
    "siteKey": "thehill.com",
    "matches": [
      "thehill.com"
    ]
  },
  {
    "id": "ubuntu",
    "siteKey": "manpages.ubuntu.com",
    "matches": [
      "manpages.ubuntu.com"
    ]
  },
  {
    "id": "promptingguide",
    "siteKey": "www.promptingguide.ai",
    "matches": [
      "www.promptingguide.ai"
    ]
  },
  {
    "id": "ietf",
    "siteKey": "ietf.org",
    "matches": [
      "*.ietf.org/doc/html/*"
    ]
  },
  {
    "id": "newsminimalist",
    "siteKey": "www.newsminimalist.com",
    "matches": [
      "https://www.newsminimalist.com/"
    ]
  },
  {
    "id": "yandexIndex",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/"
    ]
  },
  {
    "id": "yandexSearch",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/search/*"
    ]
  },
  {
    "id": "yandex",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/video/*"
    ]
  },
  {
    "id": "react",
    "siteKey": "react.dev",
    "matches": [
      "react.dev"
    ]
  },
  {
    "id": "perplexity",
    "siteKey": "www.perplexity.ai",
    "matches": [
      "https://www.perplexity.ai"
    ],
    "excludeMatches": [
      "https://www.perplexity.ai/hub/*",
      "https://www.perplexity.ai/*/hub/*",
      "https://www.perplexity.ai/onboarding",
      "https://www.perplexity.ai/enterprise*",
      "https://www.perplexity.ai/2024recap"
    ]
  },
  {
    "id": "allmyfaves",
    "siteKey": "allmyfaves.com",
    "matches": [
      "https://allmyfaves.com/"
    ]
  },
  {
    "id": "kadaza",
    "siteKey": "www.kadaza.com",
    "matches": [
      "https://www.kadaza.com/"
    ]
  },
  {
    "id": "urlChangeDelay",
    "siteKey": "babelnovel.com",
    "matches": [
      "https://babelnovel.com/books/*",
      "https://www.webnovel.com/book/*",
      "https://platform.openai.com/docs/*",
      "docs.oracle.com",
      "docs-cortex.paloaltonetworks.com",
      "forum.m5stack.com/topic/*",
      "community.m5stack.com/topic/*"
    ]
  },
  {
    "id": "genuine",
    "siteKey": "blog.genuine.com",
    "matches": [
      "blog.genuine.com"
    ]
  },
  {
    "id": "chinadaily",
    "siteKey": "www.chinadaily.com.cn",
    "matches": [
      "www.chinadaily.com.cn"
    ]
  },
  {
    "id": "braynzarsoft",
    "siteKey": "www.braynzarsoft.net",
    "matches": [
      "www.braynzarsoft.net"
    ]
  },
  {
    "id": "yuque",
    "siteKey": "www.yuque.com",
    "matches": [
      "https://www.yuque.com/*"
    ]
  },
  {
    "id": "researchgate",
    "siteKey": "www.researchgate.net",
    "matches": [
      "www.researchgate.net"
    ]
  },
  {
    "id": "theatlantic",
    "siteKey": "www.theatlantic.com",
    "matches": [
      "www.theatlantic.com",
      "https://mashable.com/*"
    ]
  },
  {
    "id": "dw",
    "siteKey": "www.dw.com",
    "matches": [
      "www.dw.com"
    ]
  },
  {
    "id": "sentry",
    "siteKey": "docs.sentry.io",
    "matches": [
      "docs.sentry.io"
    ]
  },
  {
    "id": "feedly",
    "siteKey": "feedly.com",
    "matches": [
      "feedly.com"
    ]
  },
  {
    "id": "whatsapp",
    "siteKey": "web.whatsapp.com",
    "matches": [
      "web.whatsapp.com"
    ]
  },
  {
    "id": "bing",
    "siteKey": "bing.com",
    "matches": [
      "https://*.bing.com/search*"
    ]
  },
  {
    "id": "drizzle",
    "siteKey": "orm.drizzle.team",
    "matches": [
      "orm.drizzle.team"
    ]
  },
  {
    "id": "yahoo",
    "siteKey": "yahoo.*",
    "matches": [
      "*.yahoo.*"
    ]
  },
  {
    "id": "wsj",
    "siteKey": "www.wsj.com",
    "matches": [
      "www.wsj.com",
      "cn.wsj.com"
    ]
  },
  {
    "id": "businessinsider",
    "siteKey": "www.businessinsider.com",
    "matches": [
      "www.businessinsider.com"
    ]
  },
  {
    "id": "goodreads",
    "siteKey": "www.goodreads.com",
    "matches": [
      "www.goodreads.com"
    ]
  },
  {
    "id": "nytimes",
    "siteKey": "www.nytimes.com",
    "matches": [
      "www.nytimes.com"
    ]
  },
  {
    "id": "bugsKde",
    "siteKey": "bugs.kde.org",
    "matches": [
      "bugs.kde.org"
    ]
  },
  {
    "id": "plati",
    "siteKey": "plati.market",
    "matches": [
      "plati.market"
    ]
  },
  {
    "id": "claudeAi",
    "siteKey": "claude.ai",
    "matches": [
      "claude.ai"
    ]
  },
  {
    "id": "feishu",
    "siteKey": "feishu.cn",
    "matches": [
      "*.feishu.cn",
      "*.larkoffice.com",
      "*.larksuite.com"
    ]
  },
  {
    "id": "kaggle",
    "siteKey": "www.kaggle.com",
    "matches": [
      "www.kaggle.com"
    ]
  },
  {
    "id": "ieee",
    "siteKey": "spectrum.ieee.org",
    "matches": [
      "spectrum.ieee.org"
    ]
  },
  {
    "id": "cnn",
    "siteKey": "cnn.com",
    "matches": [
      "*.cnn.com"
    ]
  },
  {
    "id": "uni-trier",
    "siteKey": "dblp.uni-trier.de",
    "matches": [
      "dblp.uni-trier.de"
    ]
  },
  {
    "id": "bilibili",
    "siteKey": "www.bilibili.com",
    "matches": [
      "www.bilibili.com"
    ]
  },
  {
    "id": "time",
    "siteKey": "time.com",
    "matches": [
      "time.com"
    ]
  },
  {
    "id": "docs-swift",
    "siteKey": "docs.swift.org",
    "matches": [
      "docs.swift.org"
    ]
  },
  {
    "id": "mail-yandex",
    "siteKey": "mail.yandex.com",
    "matches": [
      "mail.yandex.com"
    ]
  },
  {
    "id": "forums.zotero",
    "siteKey": "forums.zotero.org",
    "matches": [
      "forums.zotero.org"
    ]
  },
  {
    "id": "pubmed",
    "siteKey": "pubmed.ncbi.nlm.nih.gov",
    "matches": [
      "pubmed.ncbi.nlm.nih.gov",
      "pubmed*.pubmed*",
      "*.ncbi.nlm.nih.gov"
    ],
    "excludeMatches": [
      "*.ncbi.nlm.nih.gov/*.pdf",
      "pubmed*.pubmed*/*.pdf"
    ]
  },
  {
    "id": "chosun",
    "siteKey": "www.chosun.com",
    "matches": [
      "www.chosun.com"
    ]
  },
  {
    "id": "yna",
    "siteKey": "yna*",
    "matches": [
      "*.yna*"
    ]
  },
  {
    "id": "digitimes",
    "siteKey": "www.digitimes.com",
    "matches": [
      "www.digitimes.com"
    ]
  },
  {
    "id": "vdi-nachrichten",
    "siteKey": "www.vdi-nachrichten.com",
    "matches": [
      "www.vdi-nachrichten.com"
    ]
  },
  {
    "id": "qqMail",
    "siteKey": "mail.qq.com",
    "matches": [
      "*.mail.qq.com"
    ]
  },
  {
    "id": "brutalist",
    "siteKey": "brutalist.report",
    "matches": [
      "brutalist.report"
    ]
  },
  {
    "id": "maxroll",
    "siteKey": "maxroll.gg",
    "matches": [
      "maxroll.gg"
    ]
  },
  {
    "id": "gradioappdocs",
    "siteKey": "www.gradio.app",
    "matches": [
      "www.gradio.app/docs/*"
    ]
  },
  {
    "id": "arca",
    "siteKey": "arca.live",
    "matches": [
      "arca.live"
    ]
  },
  {
    "id": "app.element.io",
    "siteKey": "app.element.io",
    "matches": [
      "app.element.io"
    ]
  },
  {
    "id": "cpb-nl",
    "siteKey": "www.cpb.nl",
    "matches": [
      "www.cpb.nl"
    ]
  },
  {
    "id": "epam",
    "siteKey": "epam.com",
    "matches": [
      "*.epam.com"
    ]
  },
  {
    "id": "discussions.apple",
    "siteKey": "discussions.apple.com",
    "matches": [
      "discussions.apple.com"
    ]
  },
  {
    "id": "www.sixthtone.com",
    "siteKey": "www.sixthtone.com",
    "matches": [
      "www.sixthtone.com"
    ]
  },
  {
    "id": "forum.unity",
    "siteKey": "forum.unity.com",
    "matches": [
      "forum.unity.com"
    ]
  },
  {
    "id": "netflix",
    "siteKey": "www.netflix.com",
    "matches": [
      "www.netflix.com"
    ]
  },
  {
    "id": "udemy",
    "siteKey": "udemy.com",
    "matches": [
      "*.udemy.com"
    ]
  },
  {
    "id": "iview",
    "siteKey": "iview.abc.net.au",
    "matches": [
      "iview.abc.net.au"
    ]
  },
  {
    "id": "marketsurge",
    "siteKey": "marketsurge.investors.com",
    "matches": [
      "marketsurge.investors.com"
    ]
  },
  {
    "id": "nmaart",
    "siteKey": "www.nma.art",
    "matches": [
      "www.nma.art"
    ]
  },
  {
    "id": "wiley",
    "siteKey": "wiley.com",
    "matches": [
      "*.wiley.com"
    ],
    "excludeMatches": [
      "onlinelibrary.wiley.com/action/downloadSupplement*",
      "onlinelibrary.wiley.com/doi/pdf/*",
      "onlinelibrary.wiley.com/doi/am-pdf/*"
    ]
  },
  {
    "id": "patreon",
    "siteKey": "www.patreon.com",
    "matches": [
      "www.patreon.com"
    ]
  },
  {
    "id": "thaipbs",
    "siteKey": "www.thaipbs.*",
    "matches": [
      "www.thaipbs.*",
      "players.brightcove.net"
    ]
  },
  {
    "id": "hstream",
    "siteKey": "hstream.moe",
    "matches": [
      "hstream.moe"
    ]
  },
  {
    "id": "zenva",
    "siteKey": "academy.zenva.com",
    "matches": [
      "academy.zenva.com"
    ]
  },
  {
    "id": "lowstresshandling",
    "siteKey": "university.lowstresshandling.com",
    "matches": [
      "university.lowstresshandling.com"
    ]
  },
  {
    "id": "apple",
    "siteKey": "developer.apple.com",
    "matches": [
      "developer.apple.com"
    ]
  },
  {
    "id": "nebula",
    "siteKey": "nebula.tv",
    "matches": [
      "nebula.tv"
    ]
  },
  {
    "id": "zebrack-shueisha",
    "siteKey": "zebrack-comic.shueisha.*",
    "matches": [
      "zebrack-comic.shueisha.*"
    ]
  },
  {
    "id": "hentai",
    "siteKey": "e-hentai.org",
    "matches": [
      "e-hentai.org"
    ]
  },
  {
    "id": "scholar.cnki.net",
    "siteKey": "scholar.cnki.net",
    "matches": [
      "scholar.cnki.net"
    ]
  },
  {
    "id": "smokingbehindthesupermarket.com",
    "siteKey": "smokingbehindthesupermarket.com",
    "matches": [
      "smokingbehindthesupermarket.com"
    ],
    "selectorMatches": [
      "div.post-single-content#content"
    ]
  },
  {
    "id": "datalab.naver",
    "siteKey": "datalab.naver.com",
    "matches": [
      "datalab.naver.com"
    ]
  },
  {
    "id": "championcross.jp",
    "siteKey": "championcross.jp",
    "matches": [
      "https://championcross.jp"
    ]
  },
  {
    "id": "shonenjumpplus",
    "siteKey": "shonenjumpplus.com",
    "matches": [
      "shonenjumpplus.com",
      "viewer.heros-web.com",
      "comic-days.com",
      "www.corocoro.jp",
      "tonarinoyj.jp",
      "rimacomiplus.jp",
      "kuragebunch.com",
      "comic-gardo.com",
      "ichicomi.com",
      "rookie.shonenjump.com"
    ],
    "selectorMatches": [
      "img.page-image.js-page-image"
    ]
  },
  {
    "id": "runoob",
    "siteKey": "www.runoob.com",
    "matches": [
      "www.runoob.com"
    ]
  },
  {
    "id": "pixiv",
    "siteKey": "www.pixiv.net",
    "matches": [
      "www.pixiv.net"
    ]
  },
  {
    "id": "nicovideo",
    "siteKey": "seiga.nicovideo.*",
    "matches": [
      "seiga.nicovideo.*/watch/mg*"
    ]
  },
  {
    "id": "h5_nicovideo",
    "siteKey": "sp.*.nicovideo.*",
    "matches": [
      "sp.*.nicovideo.*/watch/mg*"
    ]
  },
  {
    "id": "frontendmasters",
    "siteKey": "frontendmasters.com",
    "matches": [
      "frontendmasters.com"
    ]
  },
  {
    "id": "udacity",
    "siteKey": "udacity.com",
    "matches": [
      "*.udacity.com"
    ]
  },
  {
    "id": "tubitv",
    "siteKey": "tubitv.com",
    "matches": [
      "tubitv.com"
    ]
  },
  {
    "id": "iaabcfoundation",
    "siteKey": "learning.iaabcfoundation.org",
    "matches": [
      "learning.iaabcfoundation.org"
    ]
  },
  {
    "id": "domestika",
    "siteKey": "www.domestika.org",
    "matches": [
      "www.domestika.org"
    ]
  },
  {
    "id": "barrons",
    "siteKey": "www.barrons.com",
    "matches": [
      "www.barrons.com"
    ]
  },
  {
    "id": "scrimba",
    "siteKey": "scrimba.com",
    "matches": [
      "scrimba.com"
    ]
  },
  {
    "id": "hbomax",
    "siteKey": "play.max.com",
    "matches": [
      "play.max.com",
      "play.hbomax.com"
    ]
  },
  {
    "id": "mindvalley",
    "siteKey": "home.mindvalley.com",
    "matches": [
      "home.mindvalley.com"
    ]
  },
  {
    "id": "viki",
    "siteKey": "www.viki.com",
    "matches": [
      "www.viki.com"
    ]
  },
  {
    "id": "masterclass",
    "siteKey": "www.masterclass.com",
    "matches": [
      "www.masterclass.com",
      "learn.microsoft.com"
    ]
  },
  {
    "id": "slideslive",
    "siteKey": "slideslive.com",
    "matches": [
      "slideslive.com"
    ]
  },
  {
    "id": "viu",
    "siteKey": "www.viu.com",
    "matches": [
      "www.viu.com"
    ]
  },
  {
    "id": "linkin",
    "siteKey": "linkedin.com",
    "matches": [
      "*.linkedin.com"
    ]
  },
  {
    "id": "kanopy",
    "siteKey": "kanopy.com",
    "matches": [
      "*.kanopy.com"
    ]
  },
  {
    "id": "iflix",
    "siteKey": "www.iflix.com",
    "matches": [
      "www.iflix.com",
      "wetv.vip"
    ]
  },
  {
    "id": "app.rapidlaunch.wtf",
    "siteKey": "app.rapidlaunch.wtf",
    "matches": [
      "app.rapidlaunch.wtf"
    ]
  },
  {
    "id": "letsjelly",
    "siteKey": "app.letsjelly.com",
    "matches": [
      "app.letsjelly.com"
    ]
  },
  {
    "id": "imdb",
    "siteKey": "www.imdb.com",
    "matches": [
      "www.imdb.com",
      "m.imdb.com"
    ]
  },
  {
    "id": "quark",
    "siteKey": "pan.quark.*",
    "matches": [
      "pan.quark.*"
    ]
  },
  {
    "id": "espn",
    "siteKey": "espn.com",
    "matches": [
      "*.espn.com"
    ]
  },
  {
    "id": "orchestraltools",
    "siteKey": "www.orchestraltools.com",
    "matches": [
      "www.orchestraltools.com"
    ]
  },
  {
    "id": "fmoviesz",
    "siteKey": "fmovies24.to",
    "matches": [
      "fmovies24.to",
      "*.fmovies.co",
      "vidplay.online",
      "c8365730d4.nl",
      "kerapoxy.cc",
      "vid41c.site",
      "https://*/*sub.info=*fmovies24.to*",
      "https://*/*sub.info=*bflixhd.to*",
      "mcloud.vvid30c.site",
      "rabbitstream.net",
      "kerolaunochan.*",
      "megacloud.*",
      "netusa.xyz",
      "cdnstreame.net",
      "9animetv.to",
      "hianime.to",
      "videostr.net",
      "anthropic.skilljar.com",
      "streameeeeee.site"
    ]
  },
  {
    "id": "dailymotion",
    "siteKey": "dailymotion.com",
    "matches": [
      "*.dailymotion.com"
    ]
  },
  {
    "id": "crunchyroll",
    "siteKey": "crunchyroll.com",
    "matches": [
      "*.crunchyroll.com"
    ]
  },
  {
    "id": "osmosis",
    "siteKey": "osmosis.org",
    "matches": [
      "*.osmosis.org"
    ]
  },
  {
    "id": "pbs",
    "siteKey": "pbs.org",
    "matches": [
      "*.pbs.org"
    ]
  },
  {
    "id": "internetfundamentals",
    "siteKey": "internetfundamentals.com",
    "matches": [
      "internetfundamentals.com"
    ]
  },
  {
    "id": "mgtv",
    "siteKey": "w.mgtv.com",
    "matches": [
      "w.mgtv.com"
    ]
  },
  {
    "id": "themotionmagic",
    "siteKey": "player.hotmart.com",
    "matches": [
      "player.hotmart.com"
    ],
    "selectorMatches": [
      "iframe[src*='player.hotmart.com']"
    ]
  },
  {
    "id": "movie-web",
    "siteKey": "movie-web.app",
    "matches": [
      "movie-web.app/media*",
      "movie-web-me.vercel.app/media*",
      "*.vidbinge.com",
      "vidsrc.xyz"
    ]
  },
  {
    "id": "deeplearning",
    "siteKey": "learn.deeplearning.ai",
    "matches": [
      "learn.deeplearning.ai"
    ]
  },
  {
    "id": "weverse",
    "siteKey": "weverse.io",
    "matches": [
      "weverse.io"
    ]
  },
  {
    "id": "docubay",
    "siteKey": "www.docubay.com",
    "matches": [
      "www.docubay.com"
    ]
  },
  {
    "id": "hubspotvideo",
    "siteKey": "hubspotvideo.com",
    "matches": [
      "*.hubspotvideo.com"
    ]
  },
  {
    "id": "quantinsti",
    "siteKey": "quantra.quantinsti.com",
    "matches": [
      "quantra.quantinsti.com"
    ]
  },
  {
    "id": "paramountplus",
    "siteKey": "paramountplus.com",
    "matches": [
      "*.paramountplus.com"
    ]
  },
  {
    "id": "pluto",
    "siteKey": "pluto.tv",
    "matches": [
      "pluto.tv"
    ]
  },
  {
    "id": "ted",
    "siteKey": "www.ted.com",
    "matches": [
      "www.ted.com"
    ]
  },
  {
    "id": "devEpicGames",
    "siteKey": "dev.epicgames.com",
    "matches": [
      "dev.epicgames.com"
    ]
  },
  {
    "id": "hikaritv",
    "siteKey": "boosterx.stream",
    "matches": [
      "boosterx.stream"
    ]
  },
  {
    "id": "khflix",
    "siteKey": "khflix.com",
    "matches": [
      "khflix.com",
      "watch.globaltv.com"
    ]
  },
  {
    "id": "donghuaworld",
    "siteKey": "dwserver.donghuaworld.com",
    "matches": [
      "dwserver.donghuaworld.com"
    ]
  },
  {
    "id": "lecturio",
    "siteKey": "app.lecturio.com",
    "matches": [
      "app.lecturio.com"
    ]
  },
  {
    "id": "ganjingworld",
    "siteKey": "www.ganjingworld.com",
    "matches": [
      "www.ganjingworld.com"
    ]
  },
  {
    "id": "fautv",
    "siteKey": "www.fau.tv",
    "matches": [
      "www.fau.tv"
    ]
  },
  {
    "id": "vimeo",
    "siteKey": "vimeo.com",
    "matches": [
      "vimeo.com",
      "training.leveleffect.com"
    ]
  },
  {
    "id": "player.vimeo",
    "siteKey": "player.vimeo.com",
    "matches": [
      "https://player.vimeo.com/video/*",
      "www.physeo.com"
    ],
    "selectorMatches": [
      "iframe[src*='player.vimeo.com']"
    ]
  },
  {
    "id": "tv.adobe",
    "siteKey": "tv.adobe.com",
    "matches": [
      "https://*.tv.adobe.com"
    ]
  },
  {
    "id": "threejs-journey",
    "siteKey": "threejs-journey.com",
    "matches": [
      "threejs-journey.com"
    ]
  },
  {
    "id": "comsol",
    "siteKey": "comsol.com",
    "matches": [
      "*.comsol.com"
    ]
  },
  {
    "id": "codewithchris",
    "siteKey": "learn.codewithchris.com",
    "matches": [
      "learn.codewithchris.com",
      "*.rachelsenglishacademy.com",
      "www.unrealsenseiacademy.com",
      "www.comsol.com/video/*",
      "www.comsol.com/blogs/*"
    ]
  },
  {
    "id": "panopto",
    "siteKey": "southampton.cloud.panopto.eu_no_subitle",
    "matches": [
      "southampton.cloud.panopto.eu_no_subitle"
    ]
  },
  {
    "id": "edx",
    "siteKey": "edx.org",
    "matches": [
      "*.edx.org",
      "courses.mitxonline.mit.edu"
    ]
  },
  {
    "id": "ardmediathek",
    "siteKey": "www.ardmediathek.*",
    "matches": [
      "www.ardmediathek.*"
    ]
  },
  {
    "id": "bbc-iplayer",
    "siteKey": "www.bbc.*",
    "matches": [
      "https://www.bbc.*/iplayer*"
    ]
  },
  {
    "id": "bbc-emp",
    "siteKey": "emp.bbc.*",
    "matches": [
      "https://emp.bbc.*/emp/*"
    ]
  },
  {
    "id": "bbc",
    "siteKey": "bbc.*",
    "matches": [
      "*.bbc.*"
    ]
  },
  {
    "id": "zdf.de",
    "siteKey": "www.zdf.de",
    "matches": [
      "www.zdf.de"
    ]
  },
  {
    "id": "disneyplus",
    "siteKey": "www.disneyplus.com",
    "matches": [
      "www.disneyplus.com"
    ]
  },
  {
    "id": "hulu",
    "siteKey": "hulu.com",
    "matches": [
      "https://*.hulu.com",
      "https://*.hulu.*"
    ]
  },
  {
    "id": "youku.tv",
    "siteKey": "www.youku.tv",
    "matches": [
      "www.youku.tv"
    ]
  },
  {
    "id": "starz",
    "siteKey": "www.starz.com",
    "matches": [
      "www.starz.com"
    ]
  },
  {
    "id": "rtve",
    "siteKey": "www.rtve.*",
    "matches": [
      "www.rtve.*"
    ]
  },
  {
    "id": "www.iq.com",
    "siteKey": "www.iq.com",
    "matches": [
      "www.iq.com"
    ]
  },
  {
    "id": "cbsnews",
    "siteKey": "www.cbsnews.com",
    "matches": [
      "www.cbsnews.com"
    ]
  },
  {
    "id": "gaia",
    "siteKey": "www.gaia.com",
    "matches": [
      "www.gaia.com"
    ]
  },
  {
    "id": "medbridge",
    "siteKey": "www.medbridge.com",
    "matches": [
      "www.medbridge.com"
    ]
  },
  {
    "id": "urplay",
    "siteKey": "urplay.se",
    "matches": [
      "urplay.se"
    ]
  },
  {
    "id": "medici",
    "siteKey": "www.medici.tv",
    "matches": [
      "www.medici.tv"
    ]
  },
  {
    "id": "asu",
    "siteKey": "api.playposit.com",
    "matches": [
      "api.playposit.com"
    ]
  },
  {
    "id": "gagaoolala",
    "siteKey": "www.gagaoolala.com",
    "matches": [
      "www.gagaoolala.com"
    ]
  },
  {
    "id": "curiositystream",
    "siteKey": "curiositystream.com",
    "matches": [
      "curiositystream.com"
    ]
  },
  {
    "id": "shangpaAcademy",
    "siteKey": "shangpa-academy.mn.co",
    "matches": [
      "shangpa-academy.mn.co"
    ]
  },
  {
    "id": "ucdavis",
    "siteKey": "aggievideo.canvas.ucdavis.edu",
    "matches": [
      "aggievideo.canvas.ucdavis.edu"
    ]
  },
  {
    "id": "f1tv",
    "siteKey": "f1tv.formula1.com",
    "matches": [
      "f1tv.formula1.com"
    ]
  },
  {
    "id": "datacamp",
    "siteKey": "projector.datacamp.com",
    "matches": [
      "projector.datacamp.com"
    ]
  },
  {
    "id": "imigresen-online",
    "siteKey": "imigresen-online.imi.gov.my",
    "matches": [
      "imigresen-online.imi.gov.my"
    ]
  },
  {
    "id": "orvehogar",
    "siteKey": "www.orvehogar.com",
    "matches": [
      "www.orvehogar.com"
    ]
  },
  {
    "id": "coindesk",
    "siteKey": "www.coindesk.com",
    "matches": [
      "www.coindesk.com"
    ]
  },
  {
    "id": "dr",
    "siteKey": "dr.dk",
    "matches": [
      "*.dr.dk"
    ]
  },
  {
    "id": "nrk",
    "siteKey": "tv.nrk.no",
    "matches": [
      "tv.nrk.no"
    ]
  },
  {
    "id": "mediadelivery",
    "siteKey": "iframe.mediadelivery.net",
    "matches": [
      "iframe.mediadelivery.net"
    ]
  },
  {
    "id": "tver",
    "siteKey": "tver.jp",
    "matches": [
      "tver.jp"
    ]
  },
  {
    "id": "aljazeera",
    "siteKey": "www.aljazeera.com",
    "matches": [
      "www.aljazeera.com"
    ]
  },
  {
    "id": "arte",
    "siteKey": "www.arte.tv",
    "matches": [
      "www.arte.tv"
    ]
  },
  {
    "id": "updraft",
    "siteKey": "updraft.cyfrin.io",
    "matches": [
      "updraft.cyfrin.io"
    ]
  },
  {
    "id": "learningSap",
    "siteKey": "learning.sap.com",
    "matches": [
      "learning.sap.com"
    ]
  },
  {
    "id": "feynmanlectures",
    "siteKey": "www.feynmanlectures.caltech.edu",
    "matches": [
      "www.feynmanlectures.caltech.edu"
    ]
  },
  {
    "id": "archiveToday",
    "siteKey": "archive.today",
    "matches": [
      "archive.today",
      "archive.ph",
      "archive.is",
      "archive.md"
    ]
  },
  {
    "id": "arxiv-vanity.com",
    "siteKey": "www.arxiv-vanity.com",
    "matches": [
      "www.arxiv-vanity.com"
    ]
  },
  {
    "id": "bardGoogle",
    "siteKey": "bard.google.com",
    "matches": [
      "bard.google.com"
    ]
  },
  {
    "id": "chatGoogle",
    "siteKey": "chat.google.com",
    "matches": [
      "chat.google.com"
    ]
  },
  {
    "id": "gemini.google",
    "siteKey": "gemini.google.com",
    "matches": [
      "gemini.google.com"
    ]
  },
  {
    "id": "otherGoogle",
    "siteKey": "google.com",
    "matches": [
      "*.google.com",
      "dart.dev",
      "*.google",
      "*.googleapis.com"
    ]
  },
  {
    "id": "arxiv",
    "siteKey": "browse.arxiv.org",
    "matches": [
      "https://browse.arxiv.org",
      "https://arxiv.org/html/*"
    ]
  },
  {
    "id": "ar5iv",
    "siteKey": "ar5iv.labs.arxiv.org",
    "matches": [
      "ar5iv.labs.arxiv.org"
    ]
  },
  {
    "id": "jstor",
    "siteKey": "www.jstor.org",
    "matches": [
      "www.jstor.org"
    ],
    "excludeMatches": [
      "www.jstor.org/stable/pdf*"
    ]
  },
  {
    "id": "tandfonline",
    "siteKey": "tandfonline.com",
    "matches": [
      "*.tandfonline.com"
    ]
  },
  {
    "id": "bsky.app",
    "siteKey": "bsky.app",
    "matches": [
      "https://bsky.app"
    ]
  },
  {
    "id": "peacocktv",
    "siteKey": "peacocktv.com",
    "matches": [
      "*.peacocktv.com"
    ]
  },
  {
    "id": "smzdm",
    "siteKey": "www.smzdm.com",
    "matches": [
      "www.smzdm.com"
    ]
  },
  {
    "id": "xiaohongshu.com",
    "siteKey": "www.xiaohongshu.com",
    "matches": [
      "www.xiaohongshu.com"
    ]
  },
  {
    "id": "notateslaapp",
    "siteKey": "www.notateslaapp.com",
    "matches": [
      "www.notateslaapp.com"
    ]
  },
  {
    "id": "eightfold",
    "siteKey": "eightfold.ai",
    "matches": [
      "*.eightfold.ai"
    ]
  },
  {
    "id": "soundcloud",
    "siteKey": "soundcloud.com",
    "matches": [
      "soundcloud.com"
    ]
  },
  {
    "id": "section.blog.naver.com",
    "siteKey": "section.blog.naver.com",
    "matches": [
      "section.blog.naver.com"
    ]
  },
  {
    "id": "hadoop.apache.org",
    "siteKey": "hadoop.apache.org",
    "matches": [
      "hadoop.apache.org"
    ]
  },
  {
    "id": "docs.unity3d",
    "siteKey": "docs.unity3d.com",
    "matches": [
      "docs.unity3d.com"
    ]
  },
  {
    "id": "pubs.acs.org",
    "siteKey": "pubs.acs.org",
    "matches": [
      "pubs.acs.org"
    ],
    "excludeMatches": [
      "pubs.acs.org/doi/pdf*"
    ]
  },
  {
    "id": "archiveofourown-chapter",
    "siteKey": "archiveofourown.org",
    "matches": [
      "archiveofourown.org/works*chapters/*"
    ]
  },
  {
    "id": "archiveofourown",
    "siteKey": "archiveofourown.org",
    "matches": [
      "archiveofourown.org"
    ]
  },
  {
    "id": "bitwarden.com",
    "siteKey": "bitwarden.com",
    "matches": [
      "bitwarden.com"
    ]
  },
  {
    "id": "www.ey.com",
    "siteKey": "www.ey.com",
    "matches": [
      "www.ey.com"
    ]
  },
  {
    "id": "yodayo.chat",
    "siteKey": "yodayo.com",
    "matches": [
      "https://yodayo.com/*/chat/*"
    ]
  },
  {
    "id": "ipinfo",
    "siteKey": "ipinfo.io",
    "matches": [
      "ipinfo.io"
    ]
  },
  {
    "id": "help.maxon.net",
    "siteKey": "help.maxon.net",
    "matches": [
      "help.maxon.net"
    ]
  },
  {
    "id": "character.ai",
    "siteKey": "character.ai",
    "matches": [
      "character.ai"
    ]
  },
  {
    "id": "queenslibrary.org",
    "siteKey": "queenslibrary.org",
    "matches": [
      "queenslibrary.org"
    ]
  },
  {
    "id": "ac.nowcoder",
    "siteKey": "ac.nowcoder.com",
    "matches": [
      "ac.nowcoder.com"
    ]
  },
  {
    "id": "chromium",
    "siteKey": "chromium.org",
    "matches": [
      "*.chromium.org"
    ]
  },
  {
    "id": "ffmpeg",
    "siteKey": "ffmpeg.org",
    "matches": [
      "ffmpeg.org"
    ]
  },
  {
    "id": "podcasts",
    "siteKey": "podcasts.apple.com",
    "matches": [
      "podcasts.apple.com"
    ]
  },
  {
    "id": "sp-codeSites",
    "siteKey": "docs.wxwidgets.org",
    "matches": [
      "docs.wxwidgets.org"
    ]
  },
  {
    "id": "wayfair",
    "siteKey": "www.wayfair.com",
    "matches": [
      "www.wayfair.com"
    ]
  },
  {
    "id": "followis",
    "siteKey": "app.follow.is",
    "matches": [
      "https://app.follow.is/feeds/*"
    ]
  },
  {
    "id": "svelte",
    "siteKey": "svelte.dev",
    "matches": [
      "svelte.dev/docs/*",
      "learn.svelte.dev"
    ]
  },
  {
    "id": "gitpod",
    "siteKey": "www.gitpod.io",
    "matches": [
      "www.gitpod.io/docs/*"
    ]
  },
  {
    "id": "service-now",
    "siteKey": "service-now.com",
    "matches": [
      "*.service-now.com"
    ]
  },
  {
    "id": "realpython",
    "siteKey": "realpython.com",
    "matches": [
      "realpython.com"
    ]
  },
  {
    "id": "casino",
    "siteKey": "www.casino.org",
    "matches": [
      "www.casino.org"
    ]
  },
  {
    "id": "wisdom",
    "siteKey": "wisdom.nec.com",
    "matches": [
      "wisdom.nec.com"
    ]
  },
  {
    "id": "www.acrobiosystems.com",
    "siteKey": "www.acrobiosystems.com",
    "matches": [
      "www.acrobiosystems.com"
    ]
  },
  {
    "id": "www.metacritic.com",
    "siteKey": "www.metacritic.com",
    "matches": [
      "www.metacritic.com"
    ]
  },
  {
    "id": "motrix.app",
    "siteKey": "motrix.app",
    "matches": [
      "motrix.app"
    ]
  },
  {
    "id": "xgo",
    "siteKey": "www.xgo.ing",
    "matches": [
      "www.xgo.ing"
    ]
  },
  {
    "id": "nebula.starbreeze",
    "siteKey": "nebula.starbreeze.com",
    "matches": [
      "https://nebula.starbreeze.com/support"
    ]
  },
  {
    "id": "app.schildi.chat",
    "siteKey": "app.schildi.chat",
    "matches": [
      "app.schildi.chat"
    ]
  },
  {
    "id": "balthild",
    "siteKey": "balthild.github.io",
    "matches": [
      "balthild.github.io"
    ]
  },
  {
    "id": "csust",
    "siteKey": "tsgvpn2.csust.edu.cn",
    "matches": [
      "tsgvpn2.csust.edu.cn"
    ]
  },
  {
    "id": "translation-font-size-unset",
    "siteKey": "m.yxlady.com",
    "matches": [
      "m.yxlady.com",
      "web3.fireverseai.com"
    ]
  },
  {
    "id": "ml4vis",
    "siteKey": "ml4vis.github.io",
    "matches": [
      "ml4vis.github.io"
    ]
  },
  {
    "id": "www.dgl.ai",
    "siteKey": "www.dgl.ai",
    "matches": [
      "www.dgl.ai"
    ]
  },
  {
    "id": "monmouthcoffee",
    "siteKey": "www.monmouthcoffee.*",
    "matches": [
      "www.monmouthcoffee.*"
    ]
  },
  {
    "id": "sakura",
    "siteKey": "www.sakura.fm",
    "matches": [
      "www.sakura.fm"
    ]
  },
  {
    "id": "appsumo",
    "siteKey": "appsumo.com",
    "matches": [
      "appsumo.com"
    ]
  },
  {
    "id": "jddonline.com",
    "siteKey": "jddonline.com",
    "matches": [
      "jddonline.com"
    ]
  },
  {
    "id": "novel-site",
    "siteKey": "www.piaotia.com",
    "matches": [
      "www.piaotia.com",
      "www.zhenhunxiaoshuo.com",
      "www.hetushu.com"
    ]
  },
  {
    "id": "xianqihaotianmi",
    "siteKey": "www.xianqihaotianmi.org",
    "matches": [
      "www.xianqihaotianmi.org"
    ]
  },
  {
    "id": "sobqg",
    "siteKey": "www.sobqg.com",
    "matches": [
      "www.sobqg.com/book/*"
    ]
  },
  {
    "id": "luminousfox",
    "siteKey": "www.luminousfox.com",
    "matches": [
      "www.luminousfox.com/book/*"
    ]
  },
  {
    "id": "doupocangqiong",
    "siteKey": "www.doupocangqiong.org",
    "matches": [
      "www.doupocangqiong.org"
    ]
  },
  {
    "id": "proko",
    "siteKey": "www.proko.com",
    "matches": [
      "www.proko.com"
    ]
  },
  {
    "id": "vodtw",
    "siteKey": "www.vodtw.com",
    "matches": [
      "www.vodtw.com/book/*"
    ]
  },
  {
    "id": "jwxs",
    "siteKey": "www.jwxs.org",
    "matches": [
      "www.jwxs.org/book/*"
    ]
  },
  {
    "id": "ceros",
    "siteKey": "view.ceros.com",
    "matches": [
      "view.ceros.com"
    ]
  },
  {
    "id": "xfiction.org",
    "siteKey": "xfiction.org",
    "matches": [
      "*.xfiction.org"
    ]
  },
  {
    "id": "aliexpress",
    "siteKey": "aliexpress.*",
    "matches": [
      "*.aliexpress.*"
    ]
  },
  {
    "id": "ozon",
    "siteKey": "www.ozon.ru",
    "matches": [
      "www.ozon.ru"
    ]
  },
  {
    "id": "mobalytics",
    "siteKey": "mobalytics.gg",
    "matches": [
      "mobalytics.gg"
    ]
  },
  {
    "id": "batchUnlimitHeight",
    "siteKey": "www.inven.co.kr",
    "matches": [
      "https://www.inven.co.kr/*",
      "*.grandefratello.mediaset.*"
    ]
  },
  {
    "id": "codeium",
    "siteKey": "codeium.com",
    "matches": [
      "codeium.com"
    ]
  },
  {
    "id": "book-douban",
    "siteKey": "book.douban.com",
    "matches": [
      "book.douban.com"
    ]
  },
  {
    "id": "taobao",
    "siteKey": "taobao.com",
    "matches": [
      "*.taobao.com"
    ]
  },
  {
    "id": "graphcore",
    "siteKey": "www.graphcore.ai",
    "matches": [
      "www.graphcore.ai"
    ]
  },
  {
    "id": "digitaltrends",
    "siteKey": "www.digitaltrends.com",
    "matches": [
      "www.digitaltrends.com"
    ]
  },
  {
    "id": "jscires",
    "siteKey": "jscires.org",
    "matches": [
      "jscires.org"
    ]
  },
  {
    "id": "vaseven",
    "siteKey": "www.vaseven.com",
    "matches": [
      "www.vaseven.com"
    ]
  },
  {
    "id": "qidian",
    "siteKey": "www.qidian.com",
    "matches": [
      "www.qidian.com"
    ]
  },
  {
    "id": "alphaxiv",
    "siteKey": "www.alphaxiv.org",
    "matches": [
      "www.alphaxiv.org"
    ]
  },
  {
    "id": "nexusmods",
    "siteKey": "www.nexusmods.com",
    "matches": [
      "www.nexusmods.com"
    ],
    "excludeMatches": [
      "https://www.nexusmods.com/games/*"
    ]
  },
  {
    "id": "ollama",
    "siteKey": "ollama.com",
    "matches": [
      "ollama.com"
    ]
  },
  {
    "id": "swaycloud",
    "siteKey": "sway.cloud.microsoft",
    "matches": [
      "sway.cloud.microsoft"
    ]
  },
  {
    "id": "teacherspayteachers",
    "siteKey": "www.teacherspayteachers.com",
    "matches": [
      "www.teacherspayteachers.com/browse/*"
    ]
  },
  {
    "id": "claudeartifacts",
    "siteKey": "claudeartifacts.com",
    "matches": [
      "claudeartifacts.com"
    ]
  },
  {
    "id": "1password",
    "siteKey": "1password.com",
    "matches": [
      "*.1password.com"
    ]
  },
  {
    "id": "descript",
    "siteKey": "www.descript.com",
    "matches": [
      "www.descript.com"
    ]
  },
  {
    "id": "law.mit.edu",
    "siteKey": "law.mit.edu",
    "matches": [
      "law.mit.edu"
    ]
  },
  {
    "id": "nextjs",
    "siteKey": "nextjs.org",
    "matches": [
      "nextjs.org"
    ]
  },
  {
    "id": "noon",
    "siteKey": "www.noon.com",
    "matches": [
      "www.noon.com"
    ]
  },
  {
    "id": "klibs",
    "siteKey": "klibs.io",
    "matches": [
      "klibs.io"
    ]
  },
  {
    "id": "androidpolice",
    "siteKey": "www.androidpolice.com",
    "matches": [
      "www.androidpolice.com"
    ]
  },
  {
    "id": "doc2x",
    "siteKey": "doc2x.com",
    "matches": [
      "doc2x.com",
      "doc2x.noedgeai.com"
    ]
  },
  {
    "id": "trade",
    "siteKey": "axiom.trade",
    "matches": [
      "axiom.trade"
    ]
  },
  {
    "id": "pytorch",
    "siteKey": "pytorch.org",
    "matches": [
      "pytorch.org"
    ]
  },
  {
    "id": "1688",
    "siteKey": "www.1688.com",
    "matches": [
      "www.1688.com"
    ]
  },
  {
    "id": "seller-tiktok",
    "siteKey": "seller.tiktok.com",
    "matches": [
      "seller.tiktok.com",
      "seller-my.tiktok.com",
      "affiliate.tiktok*.com",
      "seller.*.tiktokglobalshop.com",
      "seller.tiktokshopglobalselling.com"
    ]
  },
  {
    "id": "ccfddl",
    "siteKey": "ccfddl.com",
    "matches": [
      "ccfddl.com"
    ]
  },
  {
    "id": "pinboard",
    "siteKey": "pinboard.in",
    "matches": [
      "pinboard.in"
    ]
  },
  {
    "id": "flutterDev",
    "siteKey": "docs.flutter.dev",
    "matches": [
      "docs.flutter.dev",
      "docs.flutter.cn"
    ]
  },
  {
    "id": "dtmstation",
    "siteKey": "www.dtmstation.com",
    "matches": [
      "www.dtmstation.com"
    ]
  },
  {
    "id": "docs-tutorials",
    "siteKey": "docs.pytorch.org",
    "matches": [
      "docs.pytorch.org"
    ]
  },
  {
    "id": "autoHeight",
    "siteKey": "sooplive.*",
    "matches": [
      "*.sooplive.*",
      "zen-browser.app",
      "message.alibaba.com",
      "erp.91miaoshou.com",
      "jddonline.com",
      "cis.vemic.com",
      "scripod.com",
      "drjoedispenza.com",
      "www.x-mol.com",
      "webvpn.bnu.*",
      "www.connectedpapers.com",
      "isappscience.org",
      "www.dtmstation.com",
      "kalshi.com",
      "engoo.com",
      "puchipurabu.com",
      "www.wildberries.ru",
      "m.163.com",
      "discord.com/discovery*",
      "zhenghedata.com",
      "yoeshop.ssweet.*"
    ],
    "selectorMatches": [
      "#plugin-product-comment",
      ".plugin-product-comment-collections",
      "[class*='line-clamp-']"
    ]
  },
  {
    "id": "other-chatapps",
    "siteKey": "app.salesmartly.com",
    "matches": [
      "app.salesmartly.com/chat"
    ]
  },
  {
    "id": "wistia-hook",
    "siteKey": "agencysupremacy.io",
    "matches": [
      "agencysupremacy.io",
      "dynamous.ai",
      "dynamous.wistia.com"
    ]
  },
  {
    "id": "graphpad",
    "siteKey": "www.graphpad.com",
    "matches": [
      "www.graphpad.com"
    ]
  },
  {
    "id": "wistia",
    "siteKey": "ahrefs.com",
    "matches": [
      "ahrefs.com",
      "*.wistia.net",
      "*.thinkific.com",
      "courses.kevinpowell.co",
      "learn.ni.com",
      "cgcookie.com",
      "academy.yoast.com",
      "courses.mavenanalytics.io",
      "apclassroom.collegeboard.org"
    ],
    "selectorMatches": [
      ".wistia_embed"
    ]
  },
  {
    "id": "barotem",
    "siteKey": "www.barotem.com",
    "matches": [
      "www.barotem.com"
    ]
  },
  {
    "id": "msn",
    "siteKey": "www.msn.com",
    "matches": [
      "www.msn.com"
    ]
  },
  {
    "id": "edclub.com",
    "siteKey": "www.edclub.com",
    "matches": [
      "www.edclub.com"
    ]
  },
  {
    "id": "mediaspace",
    "siteKey": "mediaspace.illinois.edu",
    "matches": [
      "mediaspace.illinois.edu"
    ]
  },
  {
    "id": "nbcnews",
    "siteKey": "www.nbcnews.com",
    "matches": [
      "www.nbcnews.com"
    ]
  },
  {
    "id": "skool",
    "siteKey": "www.skool.com",
    "matches": [
      "www.skool.com"
    ]
  },
  {
    "id": "xiaosaas",
    "siteKey": "xiaosaas.com",
    "matches": [
      "*.xiaosaas.com"
    ]
  },
  {
    "id": "freecodecamp",
    "siteKey": "www.freecodecamp.org",
    "matches": [
      "www.freecodecamp.org"
    ]
  },
  {
    "id": "gta5-mods",
    "siteKey": "www.gta5-mods.com",
    "matches": [
      "www.gta5-mods.com"
    ]
  },
  {
    "id": "cooperativa",
    "siteKey": "cooperativa.cl",
    "matches": [
      "cooperativa.cl"
    ]
  },
  {
    "id": "sdk-cooperate",
    "siteKey": "pandaily.com",
    "matches": [
      "pandaily.com"
    ]
  },
  {
    "id": "read.amazon",
    "siteKey": "read.amazon.com",
    "matches": [
      "read.amazon.com"
    ]
  },
  {
    "id": "dcinside",
    "siteKey": "dcinside.com",
    "matches": [
      "*.dcinside.com"
    ]
  },
  {
    "id": "f95zone",
    "siteKey": "f95zone.to",
    "matches": [
      "f95zone.to"
    ]
  },
  {
    "id": "marquee-gs",
    "siteKey": "marquee.gs.com",
    "matches": [
      "marquee.gs.com"
    ]
  },
  {
    "id": "nof1.ai",
    "siteKey": "nof1.ai",
    "matches": [
      "nof1.ai"
    ]
  },
  {
    "id": "toneking",
    "siteKey": "www.toneking.com",
    "matches": [
      "www.toneking.com"
    ]
  },
  {
    "id": "folo",
    "siteKey": "app.folo.is",
    "matches": [
      "app.folo.is"
    ]
  },
  {
    "id": "fontFmaily",
    "siteKey": "skyvipservices.com",
    "matches": [
      "skyvipservices.com",
      "book.novelpia.com"
    ]
  },
  {
    "id": "arena",
    "siteKey": "lmarena.ai",
    "matches": [
      "lmarena.ai"
    ]
  },
  {
    "id": "murlok",
    "siteKey": "murlok.io",
    "matches": [
      "murlok.io"
    ]
  },
  {
    "id": "vercel",
    "siteKey": "vercel.com",
    "matches": [
      "vercel.com"
    ]
  },
  {
    "id": "moltbook",
    "siteKey": "www.moltbook.com",
    "matches": [
      "www.moltbook.com"
    ]
  },
  {
    "id": "dynamic-repets",
    "siteKey": "khovar.tj",
    "matches": [
      "khovar.tj"
    ]
  },
  {
    "id": "floatSites",
    "siteKey": "docs.stripe.com",
    "matches": [
      "docs.stripe.com"
    ]
  },
  {
    "id": "common-vtt-jw",
    "siteKey": "rottentomatoes.com",
    "matches": [
      "*.rottentomatoes.com",
      "megaplay.buzz",
      "www.brighttalk.com"
    ]
  },
  {
    "id": "txt",
    "siteKey": "*",
    "matches": [
      "*://*/*.txt",
      "file://*/*.txt"
    ],
    "selectorMatches": [
      "body > pre",
      ".transcripts > pre"
    ]
  },
  {
    "id": "overflow-sites",
    "siteKey": "www.highfrequencyelectronics.com",
    "matches": [
      "www.highfrequencyelectronics.com",
      "www.uzh.ch",
      "www-mail.icloud-sandbox.com",
      "*.cpaaustralia.com.*",
      "www.8du8.net/*",
      "ieltscat.xdf.*",
      "moddota.com",
      "www.nogizaka46.com"
    ]
  },
  {
    "id": "preSites",
    "siteKey": "mail.163.com",
    "matches": [
      "mail.163.com",
      "mail.jabber.org",
      "antirez.com",
      "patchwork.kernel.org",
      "lists.apache.org",
      "manned.org",
      "bugs.webkit.org",
      "bugzilla.mozilla.org",
      "scriptbin.works",
      "bugs.gentoo.org",
      "lwn.net/Articles/*",
      "docs.haproxy.org",
      "*.freebsd.org",
      "www.oreilly.com/openbook/opensources/book/*",
      "gamefaqs.gamespot.com",
      "bugs.java.com/bugdatabase/view_bug.do",
      "rachelsenglish.com",
      "privatter.net",
      "www.asuswrt-merlin.net",
      "tic80.com",
      "www.impo.*",
      "sotf-mods.com",
      "www.bls.gov",
      "www.sreality.cz",
      "alar.95chat.cloud",
      "novel.prcm.jp",
      "im.jinritemai.com",
      "lftp.yar.ru",
      "*.mercadolibre.com",
      "corpus-texmex.irisa.*",
      "www.imageen.com",
      "seller-id.tokopedia.com",
      "tortoisegit.org",
      "www.dove.com",
      "man7.org",
      "phrack.org"
    ],
    "selectorMatches": [
      "pre.changelog"
    ]
  },
  {
    "id": "fix-header",
    "siteKey": "societyforpsychotherapy.org",
    "matches": [
      "societyforpsychotherapy.org",
      "cbtm.manifestlao.com",
      "notefolio.net"
    ],
    "selectorMatches": [
      "article header",
      "header h1",
      "header h2",
      "header h3",
      "header p",
      "header nav"
    ]
  },
  {
    "id": "NoTranslate",
    "siteKey": "tiktok.com",
    "matches": [
      "*.tiktok.com",
      "altis.world",
      "*.newthingsunderthesun.com",
      "*.gumroad.com",
      "edstem.org",
      "actions.tldrnewsletter.com",
      "community.linkingyourthinking.com",
      "winaero.com",
      "community.afforai.com",
      "www.perplexity.ai",
      "hdsr.mitpress.mit.edu",
      "rent.men",
      "*.rwth-aachen.*",
      "www.backcountry.com",
      "intranet.alxswe.com",
      "www.steepandcheap.com",
      "whoer.is",
      "community.seniorswc.com",
      "www.skool.com",
      "sfget.jp",
      "talentcentral.eu.shl.com",
      "www.crd.york.ac.*",
      "www.campo.fau.de",
      "s.hoothin.com",
      "feedback.featurebase.app",
      "typefully.com",
      "*.affine.*",
      "*.shopify.com",
      "*.marscode.com",
      "nexus.evenant.com",
      "portal.achieve3000.net",
      "triumph-cubic.com",
      "ieeeforms.wufoo.com",
      "www.midjourney.com",
      "fifakitcreator.com",
      "app.voxy.com",
      "www.zome.*",
      "electrical-engineering-portal.com",
      "www.surveymonkey.com",
      "www.rawpixel.com",
      "mail.cstnet.cn",
      "mail.nudt.edu.cn",
      "lkml.org",
      "mail.qq.com",
      "kalimat.anghami.com",
      "changewindows.org",
      "scispace.com",
      "ww2.mathworks.cn",
      "paragon-eu.amazon.com"
    ],
    "excludeMatches": [
      "eproofing.springer.com/*/journals/*"
    ],
    "selectorMatches": [
      "html[translate=no]",
      "body[translate=no]",
      "body[class=notranslate]",
      "body[class^='notranslate']",
      "#app[translate=no]",
      "#root[translate=no]",
      "#editor-core-root [translate=no]",
      ".notranslate.chrome",
      ".main-content [translate=no]",
      "body.notranslate.rtb-desktop",
      ".survey-body .notranslate",
      ".ProseMirror[translate=no]",
      "#mainWrapper[translate=no]",
      "body.notranslate"
    ]
  }
] as const satisfies readonly ImportedImmersiveRuleCatalogEntry[];
