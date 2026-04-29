import type { WebTranslationRule } from "../webRuleTypes";

// Lightweight URL/DOM-shape catalog derived from public/data/imported-immersive-web-rules.json.
// It lets background decide whether the full imported rule chunk is needed for the current page.
export type ImportedImmersiveRuleCatalogEntry = Pick<
  WebTranslationRule,
  "id" | "siteKey" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches"
>;

export const IMPORTED_IMMERSIVE_RULE_CATALOG = [
  {
    "id": "isSubtitleBuilder",
    "siteKey": "*.immersivetranslate.*",
    "matches": [
      "https://*.immersivetranslate.*/subtitle*",
      "https://*.immersivetranslate.*/*/download-subtitle",
      "http://localhost:38001/*/download-subtitle*",
      "https://*.immersivetranslate.*/*/subtitle*"
    ],
    "selectorMatches": [
      "meta[name='immersive-translate-subtitle-builder'][content='true']"
    ]
  },
  {
    "id": "pdf",
    "siteKey": "app.immersivetranslate.*",
    "matches": [
      "https://app.immersivetranslate.*/pdf",
      "https://test-app.immersivetranslate.*/pdf",
      "https://app.immersivetranslate.*/pdf/*",
      "https://test-app.immersivetranslate.*/pdf/*",
      "https://app.infread.com/pdf/*",
      "http://localhost:38001/pdf*"
    ],
    "selectorMatches": [
      "meta[name='immersive-translate-pdf-viewer'][content='true']"
    ]
  },
  {
    "id": "isEbook",
    "selectorMatches": [
      "meta[name='immersive-translate-ebook-viewer'][content='true']"
    ]
  },
  {
    "id": "isEbookBuilder",
    "siteKey": "*.immersivetranslate.*",
    "matches": [
      "https://*.immersivetranslate.*/ebook/make*",
      "https://*.immersivetranslate.*/ebook/make/*",
      "https://app.infread.com/ebook/make*",
      "http://localhost:38001/ebook/make*",
      "http://localhost:3000/*/ebook-make*",
      "https://*.immersivetranslate.*/*/*/ebook-make*",
      "https://immersivetranslate.*/*/*/ebook-make*"
    ],
    "selectorMatches": [
      "meta[name='immersive-translate-ebook-builder'][content='true']"
    ]
  },
  {
    "id": "immersiveTranslateIosOnBoarding",
    "selectorMatches": [
      "meta[name=immersiveTranslateIosOnBoarding]"
    ]
  },
  {
    "id": "immersiveTranslateIosOnBoardingStep1",
    "selectorMatches": [
      "meta[name=immersiveTranslateIosOnBoardingStep1]"
    ]
  },
  {
    "id": "immersivePreview",
    "siteKey": "immersivetranslate.*",
    "matches": [
      "https://immersivetranslate.*/preview*",
      "https://immersivetranslate.*/drafts*"
    ]
  },
  {
    "id": "dash-immersive",
    "siteKey": "dash.immersivetranslate.com",
    "matches": [
      "https://dash.immersivetranslate.com/*",
      "http://localhost:8000/dist/userscript/options*"
    ]
  },
  {
    "id": "pro-pdf-immersive",
    "siteKey": "*.immersivetranslate.*",
    "matches": [
      "https://*.immersivetranslate.*/pdf-pro*"
    ]
  },
  {
    "id": "babelR-render",
    "selectorMatches": [
      ".babelR-offline-render"
    ]
  },
  {
    "id": "onboarding",
    "siteKey": "onboarding.immersivetranslate.*",
    "matches": [
      "https://onboarding.immersivetranslate.*",
      "https://*onboarding.immersivetranslate.*"
    ]
  },
  {
    "id": "immersive-word",
    "siteKey": "*.immersivetranslate.*",
    "matches": [
      "https://*.immersivetranslate.*/word*",
      "https://*.immersivetranslate.*/*/word*"
    ]
  },
  {
    "id": "immersive",
    "siteKey": "localhost",
    "matches": [
      "https://immersivetranslate.*",
      "https://*.immersivetranslate.*",
      "http://localhost:38001",
      "https://app.infread.com",
      "https://*.immersivetranslate.*/*"
    ]
  },
  {
    "id": "simpread",
    "selectorMatches": [
      "div.simpread-read-root.simpread-read-root-show > sr-read"
    ]
  },
  {
    "id": "hangejp",
    "siteKey": "arad.hange.jp",
    "matches": [
      "arad.hange.jp",
      "arad.nexon.co.jp",
      "oapi.dingtalk.com",
      "login.dingtalk.com"
    ]
  },
  {
    "id": "shopee",
    "siteKey": "seller.shopee.*",
    "matches": [
      "seller.shopee.*",
      "shopee.*"
    ]
  },
  {
    "id": "xiapi",
    "siteKey": "*.xiapibuy.*",
    "matches": [
      "*.xiapibuy.*"
    ]
  },
  {
    "id": "fanbox",
    "siteKey": "*.fanbox.cc",
    "matches": [
      "*.fanbox.cc"
    ]
  },
  {
    "id": "twmanga",
    "siteKey": "www.twmanga.com",
    "matches": [
      "www.twmanga.com"
    ]
  },
  {
    "id": "mgeko",
    "siteKey": "www.mgeko.cc",
    "matches": [
      "www.mgeko.cc"
    ]
  },
  {
    "id": "jmcomic",
    "siteKey": "jmcomic-zzz.one",
    "matches": [
      "jmcomic-zzz.one"
    ]
  },
  {
    "id": "fenoxo",
    "siteKey": "www.fenoxo.com",
    "matches": [
      "www.fenoxo.com"
    ]
  },
  {
    "id": "wikipedia",
    "siteKey": "*.wikipedia.org",
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
    "id": "common-vtt",
    "siteKey": "gdc-search.github.io",
    "matches": [
      "gdc-search.github.io"
    ]
  },
  {
    "id": "zoom-asu",
    "siteKey": "*.zoom.us",
    "matches": [
      "*.zoom.us/rec/*"
    ]
  },
  {
    "id": "zoom",
    "siteKey": "*.zoom.us",
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
    "id": "tv.apple",
    "siteKey": "tv.apple.com",
    "matches": [
      "tv.apple.com"
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
    "id": "githubNotebook",
    "siteKey": "notebooks.githubusercontent.com",
    "matches": [
      "notebooks.githubusercontent.com"
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
    "id": "mfacebook",
    "siteKey": "m.facebook.com",
    "matches": [
      "m.facebook.com"
    ]
  },
  {
    "id": "facebook",
    "siteKey": "*.facebook.com",
    "matches": [
      "*.facebook.com"
    ],
    "excludeMatches": [
      "www.facebook.com/business/*",
      "business.facebook.com/*",
      "www.facebook.com/help*",
      "www.facebook.com/settings*",
      "www.facebook.com/ads/library/*",
      "developers.facebook.com/*",
      "www.facebook.com/v20.0/plugins/*",
      "www.facebook.com/support*",
      "www.facebook.com/terms*",
      "www.facebook.com/privacy*"
    ]
  },
  {
    "id": "facebookV20VideoPlugin",
    "siteKey": "www.facebook.com",
    "matches": [
      "www.facebook.com/v20.0/plugins/*"
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
    "id": "yotube-embed",
    "siteKey": "www.youtube.com",
    "matches": [
      "https://www.youtube.com/embed*"
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
    "id": "tvYoutube",
    "siteKey": "tv.youtube.com",
    "matches": [
      "tv.youtube.com"
    ]
  },
  {
    "id": "youtube-subtitle",
    "siteKey": "www.youtube-nocookie.com",
    "matches": [
      "www.youtube-nocookie.com",
      "music.youtube.com"
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
    "siteKey": "newsletter.rootsofprogress.org",
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
    "siteKey": "*.ideas.aha.io",
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
    "id": "codeforces",
    "siteKey": "codeforces.com",
    "matches": [
      "https://codeforces.com/*"
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
    "siteKey": "*.slack.com",
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
    "id": "modelhub",
    "siteKey": "www.modelhub.com",
    "matches": [
      "https://www.modelhub.com/*"
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
    "id": "jable",
    "siteKey": "jable.tv",
    "matches": [
      "https://jable.tv/*"
    ]
  },
  {
    "id": "netflav.player",
    "siteKey": "netflavns1.com",
    "matches": [
      "https://netflavns1.com",
      "https://embedrise.com"
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
    "id": "czechvideo",
    "siteKey": "czechvideo.co",
    "matches": [
      "https://czechvideo.co/*"
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
    "id": "nitter",
    "selectorMatches": [
      "meta[property='og:site_name'][content='Nitter']"
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
    "id": "kelbyone",
    "siteKey": "members.kelbyone.com",
    "matches": [
      "members.kelbyone.com"
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
    "id": "baiduPanVideo",
    "siteKey": "pan.baidu.com",
    "matches": [
      "pan.baidu.com"
    ]
  },
  {
    "id": "baiduXueshu",
    "siteKey": "xueshu.baidu.com",
    "matches": [
      "xueshu.baidu.com"
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
    "id": "tinytask",
    "siteKey": "www.tinytask.net",
    "matches": [
      "https://www.tinytask.net"
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
    "id": "afreecatv",
    "siteKey": "www.afreecatv.com",
    "matches": [
      "www.afreecatv.com"
    ]
  },
  {
    "id": "opennet",
    "siteKey": "opennet.ru",
    "matches": [
      "opennet.ru"
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
    "siteKey": "*.fandom.com",
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
    "id": "statista",
    "siteKey": "www.statista.com",
    "matches": [
      "www.statista.com"
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
    "id": "deepseek",
    "siteKey": "chat.deepseek.com",
    "matches": [
      "chat.deepseek.com"
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
    "id": "kindroid",
    "siteKey": "kindroid.ai",
    "matches": [
      "kindroid.ai"
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
    "id": "nyassembly",
    "siteKey": "nyassembly.gov",
    "matches": [
      "nyassembly.gov"
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
    "id": "rfcEditor",
    "siteKey": "www.rfc-editor.org",
    "matches": [
      "www.rfc-editor.org",
      "docs.haproxy.org"
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
    "siteKey": "*.jetbrains.com",
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
    "id": "gatesnotes",
    "siteKey": "www.gatesnotes.com",
    "matches": [
      "www.gatesnotes.com"
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
    "siteKey": "*.zendesk.com",
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
    "id": "tass",
    "siteKey": "tass.ru",
    "matches": [
      "tass.ru"
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
    "siteKey": "*.fiverr.com",
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
    "id": "spiedigitallibrary",
    "siteKey": "www.spiedigitallibrary.org",
    "matches": [
      "www.spiedigitallibrary.org"
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
    "id": "ground",
    "siteKey": "ground.news",
    "matches": [
      "ground.news"
    ]
  },
  {
    "id": "ietf",
    "siteKey": "*.ietf.org",
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
    "siteKey": "docs.oracle.com",
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
    "id": "lawhub",
    "siteKey": "lawhub.lsac.org",
    "matches": [
      "https://lawhub.lsac.org/question/*"
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
    "id": "bearblog",
    "siteKey": "bearblog.dev",
    "matches": [
      "https://bearblog.dev/discover/*"
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
    "id": "openai-blog",
    "siteKey": "openai.com",
    "matches": [
      "https://openai.com/blog/*"
    ]
  },
  {
    "id": "urlComment",
    "selectorMatches": [
      "meta[name='generator'][content^='Discourse']"
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
    "siteKey": "*.bing.com",
    "matches": [
      "https://*.bing.com/search*"
    ]
  },
  {
    "id": "bingNews",
    "siteKey": "*.bing.com",
    "matches": [
      "https://*.bing.com/news/search*"
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
    "siteKey": "*.yahoo.*",
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
    "id": "loom",
    "siteKey": "www.loom.com",
    "matches": [
      "www.loom.com"
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
    "id": "feeder",
    "siteKey": "feeder.co",
    "matches": [
      "https://feeder.co/*"
    ]
  },
  {
    "id": "elektrotechnik",
    "siteKey": "www.elektrotechnik.rwth-aachen.de",
    "matches": [
      "https://www.elektrotechnik.rwth-aachen.de/*"
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
    "id": "eastmoney",
    "siteKey": "guba.eastmoney.com",
    "matches": [
      "guba.eastmoney.com"
    ]
  },
  {
    "id": "xueqiu",
    "siteKey": "xueqiu.com",
    "matches": [
      "xueqiu.com"
    ]
  },
  {
    "id": "laohu8",
    "siteKey": "www.laohu8.com",
    "matches": [
      "www.laohu8.com"
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
    "id": "futunn",
    "siteKey": "www.futunn.com",
    "matches": [
      "www.futunn.com"
    ]
  },
  {
    "id": "bmvrMarseille",
    "siteKey": "www.bmvr.marseille.fr",
    "matches": [
      "www.bmvr.marseille.fr"
    ]
  },
  {
    "id": "piAi",
    "siteKey": "pi.ai",
    "matches": [
      "pi.ai/talk"
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
    "siteKey": "*.feishu.cn",
    "matches": [
      "*.feishu.cn",
      "*.larkoffice.com",
      "*.larksuite.com"
    ]
  },
  {
    "id": "gitbook",
    "selectorMatches": [
      ".gitbook-root"
    ]
  },
  {
    "id": "mitre",
    "siteKey": "cwe.mitre.org",
    "matches": [
      "cwe.mitre.org"
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
    "id": "ieeexplore",
    "siteKey": "ieeexplore.ieee.org",
    "matches": [
      "ieeexplore.ieee.org"
    ],
    "excludeMatches": [
      "ieeexplore.ieee.org/*/getPDF.jsp*"
    ]
  },
  {
    "id": "cnn",
    "siteKey": "*.cnn.com",
    "matches": [
      "*.cnn.com"
    ]
  },
  {
    "id": "githubBlog",
    "siteKey": "github.blog",
    "matches": [
      "github.blog"
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
    "siteKey": "*.yna*",
    "matches": [
      "*.yna*"
    ]
  },
  {
    "id": "cnet",
    "siteKey": "www.cnet.com",
    "matches": [
      "www.cnet.com"
    ]
  },
  {
    "id": "dolmods",
    "siteKey": "dolmods.net",
    "matches": [
      "dolmods.net"
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
    "id": "htdp",
    "siteKey": "htdp.org",
    "matches": [
      "htdp.org"
    ]
  },
  {
    "id": "newsletterss",
    "siteKey": "newsletterss.com",
    "matches": [
      "newsletterss.com"
    ]
  },
  {
    "id": "docusaurus",
    "selectorMatches": [
      "#__docusaurus"
    ]
  },
  {
    "id": "mercari",
    "siteKey": "*.mercari.com",
    "matches": [
      "*.mercari.com"
    ]
  },
  {
    "id": "qqMail",
    "siteKey": "*.mail.qq.com",
    "matches": [
      "*.mail.qq.com"
    ]
  },
  {
    "id": "nikkei",
    "siteKey": "www.nikkei.com",
    "matches": [
      "www.nikkei.com"
    ]
  },
  {
    "id": "pubs.rsc.org",
    "siteKey": "pubs.rsc.org",
    "matches": [
      "pubs.rsc.org"
    ],
    "excludeMatches": [
      "https://pubs.rsc.org/*/articlepdf/*"
    ]
  },
  {
    "id": "indeed",
    "siteKey": "*.indeed.com",
    "matches": [
      "*.indeed.com"
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
    "id": "chatpdf",
    "siteKey": "www.chatpdf.com",
    "matches": [
      "www.chatpdf.com"
    ]
  },
  {
    "id": "inciteful",
    "siteKey": "inciteful.xyz",
    "matches": [
      "inciteful.xyz"
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
    "id": "mkdocs-material",
    "selectorMatches": [
      ".md-container[data-md-component]"
    ]
  },
  {
    "id": "termynal",
    "selectorMatches": [
      "link[href*='termynal.css']"
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
    "id": "hub.logseq",
    "siteKey": "hub.logseq.com",
    "matches": [
      "hub.logseq.com"
    ]
  },
  {
    "id": "chat.zalo",
    "siteKey": "chat.zalo.me",
    "matches": [
      "chat.zalo.me"
    ]
  },
  {
    "id": "epam",
    "siteKey": "*.epam.com",
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
    "id": "wattpad",
    "siteKey": "www.wattpad.com",
    "matches": [
      "www.wattpad.com"
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
    "siteKey": "*.udemy.com",
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
    "siteKey": "*.wiley.com",
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
    "id": "investors",
    "siteKey": "www.investors.com",
    "matches": [
      "www.investors.com"
    ]
  },
  {
    "id": "abc.net",
    "siteKey": "www.abc.net.au",
    "matches": [
      "www.abc.net.au"
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
    "siteKey": "players.brightcove.net",
    "matches": [
      "www.thaipbs.*",
      "players.brightcove.net"
    ]
  },
  {
    "id": "matlabacademy",
    "siteKey": "matlabacademy.mathworks.com",
    "matches": [
      "matlabacademy.mathworks.com"
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
    "id": "khanacademy",
    "siteKey": "www.khanacademy.org",
    "matches": [
      "www.khanacademy.org"
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
    "id": "ko-commic",
    "siteKey": "m.xn--h10b90bbmq49b63sq4e.com",
    "matches": [
      "*.xn--h10b90bbmq49b63sq4e.com",
      "m.뉴토끼대피소.com",
      "뉴토끼대피소.com",
      "funbe*.com",
      "happytoon01.com",
      "tkor*.com",
      "m.블랙툰.co"
    ]
  },
  {
    "id": "comic-meteor",
    "siteKey": "comic-meteor.jp",
    "matches": [
      "comic-meteor.jp",
      "omegascans.org"
    ]
  },
  {
    "id": "greentoon.net",
    "siteKey": "greentoon.net",
    "matches": [
      "greentoon.net"
    ]
  },
  {
    "id": "klmanga",
    "siteKey": "klmanga.*",
    "matches": [
      "klmanga.*"
    ]
  },
  {
    "id": "dynasty-scans",
    "siteKey": "dynasty-scans.com",
    "matches": [
      "dynasty-scans.com"
    ]
  },
  {
    "id": "fawesome",
    "siteKey": "fawesome.tv",
    "matches": [
      "fawesome.tv"
    ]
  },
  {
    "id": "readallcomics",
    "siteKey": "readallcomics.com",
    "matches": [
      "readallcomics.com"
    ]
  },
  {
    "id": "mangaplus-shueisha",
    "siteKey": "mangaplus.shueisha.*",
    "matches": [
      "mangaplus.shueisha.*"
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
    "id": "globalcomix",
    "siteKey": "globalcomix.com",
    "matches": [
      "globalcomix.com"
    ]
  },
  {
    "id": "comix",
    "siteKey": "comix.to",
    "matches": [
      "comix.to"
    ]
  },
  {
    "id": "mangatoto",
    "siteKey": "mangatoto.com",
    "matches": [
      "mangatoto.com",
      "batotoo.com",
      "mangatoto.net"
    ]
  },
  {
    "id": "ranfren.neocities.org",
    "siteKey": "ranfren.neocities.org",
    "matches": [
      "ranfren.neocities.org"
    ]
  },
  {
    "id": "manga18",
    "siteKey": "manga18.club",
    "matches": [
      "manga18.club"
    ]
  },
  {
    "id": "readmanga18",
    "siteKey": "readmanga18.com",
    "matches": [
      "readmanga18.com"
    ]
  },
  {
    "id": "rawlazy",
    "siteKey": "rawlazy.io",
    "matches": [
      "rawlazy.io"
    ]
  },
  {
    "id": "utoon",
    "siteKey": "utoon.net",
    "matches": [
      "utoon.net"
    ]
  },
  {
    "id": "klz9",
    "siteKey": "klz9.com",
    "matches": [
      "klz9.com"
    ]
  },
  {
    "id": "hentairox.com",
    "siteKey": "hentairox.com",
    "matches": [
      "hentairox.com"
    ]
  },
  {
    "id": "comemh8",
    "siteKey": "www.comemh8.com",
    "matches": [
      "www.comemh8.com"
    ]
  },
  {
    "id": "manhuapica",
    "siteKey": "manhuapica.com",
    "matches": [
      "manhuapica.com"
    ]
  },
  {
    "id": "Tencent-Manga",
    "siteKey": "m.ac.qq.com",
    "matches": [
      "m.ac.qq.com"
    ]
  },
  {
    "id": "fhentai",
    "siteKey": "fhentai.net",
    "matches": [
      "fhentai.net"
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
    "id": "visortmo",
    "siteKey": "visortmo_notranslate.com",
    "matches": [
      "visortmo_notranslate.com"
    ]
  },
  {
    "id": "hitomi",
    "siteKey": "hitomi.la",
    "matches": [
      "hitomi.la",
      "hitomi.si"
    ]
  },
  {
    "id": "acgmhh",
    "siteKey": "acgmhh.com",
    "matches": [
      "acgmhh.com"
    ]
  },
  {
    "id": "www.comic-ryu.jp",
    "siteKey": "www.comic-ryu.jp",
    "matches": [
      "www.comic-ryu.jp"
    ]
  },
  {
    "id": "177picyy",
    "siteKey": "www.177picyy.com",
    "matches": [
      "www.177picyy.com"
    ]
  },
  {
    "id": "ideastatica",
    "siteKey": "www.ideastatica.com",
    "matches": [
      "www.ideastatica.com"
    ]
  },
  {
    "id": "yymanhua",
    "siteKey": "yymanhua.com",
    "matches": [
      "yymanhua.com"
    ]
  },
  {
    "id": "antbyw",
    "siteKey": "www.antbyw.com",
    "matches": [
      "www.antbyw.com"
    ]
  },
  {
    "id": "jmanga",
    "siteKey": "jmanga.*",
    "matches": [
      "jmanga.*",
      "*.jmanga.*"
    ]
  },
  {
    "id": "news.talos-web",
    "siteKey": "news.talos-web.com",
    "matches": [
      "news.talos-web.com"
    ]
  },
  {
    "id": "twicomi",
    "siteKey": "twicomi.com",
    "matches": [
      "https://twicomi.com/manga*"
    ]
  },
  {
    "id": "wnacg",
    "siteKey": "wnacg.com",
    "matches": [
      "wnacg.com",
      "www.wnacg.com",
      "www.wn02.cc",
      "www.wnacg.ru",
      "www.wnacg*.cc"
    ]
  },
  {
    "id": "readcomicsonline",
    "siteKey": "readcomicsonline.ru",
    "matches": [
      "readcomicsonline.ru"
    ]
  },
  {
    "id": "nhentai",
    "siteKey": "nhentai.net",
    "matches": [
      "nhentai.net",
      "6hentai.net",
      "nhentai.com",
      "vortexscans.org"
    ]
  },
  {
    "id": "kemono",
    "siteKey": "kemono.su",
    "matches": [
      "kemono.su",
      "kemono.cr"
    ]
  },
  {
    "id": "weebcentral",
    "siteKey": "weebcentral.com",
    "matches": [
      "weebcentral.com"
    ]
  },
  {
    "id": "iframe-manga",
    "siteKey": "freeonlinehd.site",
    "matches": [
      "freeonlinehd.site",
      "weebrook.com"
    ]
  },
  {
    "id": "mangadistrict-manhwaclan",
    "siteKey": "mangadistrict2.com",
    "matches": [
      "mangadistrict2.com",
      "manhwaclan.com",
      "manhuaread.com",
      "www.mangaread.org",
      "mangaforfree.net",
      "bakamh.com",
      "yakshascans.com",
      "topcomicporno.com",
      "toonclash.com",
      "rawdex.net",
      "reset-scans.org",
      "cultivationmanhua.com",
      "freeonlinehd.site",
      "weebrook.com"
    ]
  },
  {
    "id": "wn01",
    "siteKey": "www.wn01.*",
    "matches": [
      "www.wn01.*"
    ]
  },
  {
    "id": "pixhentai.com",
    "siteKey": "pixhentai.com",
    "matches": [
      "pixhentai.com"
    ]
  },
  {
    "id": "manhwaread",
    "siteKey": "manhwaread.com",
    "matches": [
      "manhwaread.com",
      "www.manhwaread.com"
    ]
  },
  {
    "id": "manhwabuddy",
    "siteKey": "manhwabuddy.com",
    "matches": [
      "manhwabuddy.com"
    ]
  },
  {
    "id": "zerobywai",
    "siteKey": "www.zerobywai.com",
    "matches": [
      "www.zerobywai.com"
    ]
  },
  {
    "id": "toongod",
    "siteKey": "toongod.cc",
    "matches": [
      "toongod.cc"
    ]
  },
  {
    "id": "fantia",
    "siteKey": "fantia_notranslate.*",
    "matches": [
      "fantia_notranslate.*"
    ]
  },
  {
    "id": "wto.to",
    "siteKey": "wto.to",
    "matches": [
      "wto.to"
    ]
  },
  {
    "id": "pash-up",
    "siteKey": "pash-up.jp",
    "matches": [
      "pash-up.jp"
    ]
  },
  {
    "id": "piccoma.com",
    "siteKey": "piccoma.com",
    "matches": [
      "piccoma.com"
    ]
  },
  {
    "id": "sukima",
    "siteKey": "www.sukima.me",
    "matches": [
      "www.sukima.me"
    ]
  },
  {
    "id": "colamanga",
    "siteKey": "www.colamanga.com",
    "matches": [
      "www.colamanga.com"
    ]
  },
  {
    "id": "ganganonline",
    "siteKey": "*.ganganonline.com",
    "matches": [
      "*.ganganonline.com"
    ]
  },
  {
    "id": "bato",
    "siteKey": "bato.to",
    "matches": [
      "bato.to",
      "battwo.com",
      "bato.si",
      "mto.to"
    ]
  },
  {
    "id": "asuracomic",
    "siteKey": "asuracomic.net",
    "matches": [
      "asuracomic.net"
    ]
  },
  {
    "id": "asurascanz",
    "siteKey": "asurascanz.com",
    "matches": [
      "asurascanz.com"
    ]
  },
  {
    "id": "asurascans",
    "siteKey": "asurascans.com",
    "matches": [
      "asurascans.com"
    ]
  },
  {
    "id": "lezhinus",
    "siteKey": "www.lezhinus.com",
    "matches": [
      "www.lezhinus.com"
    ]
  },
  {
    "id": "allmanga",
    "siteKey": "allmanga.to",
    "matches": [
      "allmanga.to"
    ]
  },
  {
    "id": "allporncomic",
    "siteKey": "allporncomic.com",
    "matches": [
      "allporncomic.com"
    ]
  },
  {
    "id": "mangaz",
    "siteKey": "*.mangaz.com",
    "matches": [
      "*.mangaz.com"
    ]
  },
  {
    "id": "girls-h-comics",
    "siteKey": "girls-h-comics.com",
    "matches": [
      "girls-h-comics.com"
    ]
  },
  {
    "id": "futabanet",
    "siteKey": "gaugau.futabanet_block_too_much.jp",
    "matches": [
      "gaugau.futabanet_block_too_much.jp"
    ]
  },
  {
    "id": "mrblue",
    "siteKey": "*.mrblue.com",
    "matches": [
      "*.mrblue.com"
    ]
  },
  {
    "id": "web-ace",
    "siteKey": "web-ace.*",
    "matches": [
      "web-ace.*"
    ]
  },
  {
    "id": "toonily",
    "siteKey": "toonily_notranslate.me",
    "matches": [
      "toonily_notranslate.me"
    ]
  },
  {
    "id": "omegascans",
    "siteKey": "omegascans_notranslate.org",
    "matches": [
      "omegascans_notranslate.org",
      "reaperscans.com",
      "www.omegascans.org"
    ]
  },
  {
    "id": "zerobywzz",
    "siteKey": "www.zerobywzz.com",
    "matches": [
      "www.zerobywzz.com"
    ]
  },
  {
    "id": "dokusho-ojikan.jp",
    "siteKey": "dokusho-ojikan.jp",
    "matches": [
      "dokusho-ojikan.jp"
    ]
  },
  {
    "id": "newtoki468",
    "siteKey": "newtoki*.com",
    "matches": [
      "newtoki*.com"
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
    "id": "idmzj",
    "siteKey": "m.idmzj.com",
    "matches": [
      "m.idmzj.com"
    ]
  },
  {
    "id": "bomtoon",
    "siteKey": "www.bomtoon_notranslate.com",
    "matches": [
      "www.bomtoon_notranslate.com",
      "www.bomtoon.com"
    ]
  },
  {
    "id": "yamibo",
    "siteKey": "www.yamibo.com",
    "matches": [
      "www.yamibo.com"
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
    "id": "copymanga",
    "siteKey": "www.copymanga.site",
    "matches": [
      "www.copymanga.site"
    ]
  },
  {
    "id": "readcomiconline",
    "siteKey": "readcomiconline.li",
    "matches": [
      "readcomiconline.li"
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
    "id": "comic-zenon",
    "siteKey": "comic-zenon.com",
    "matches": [
      "comic-zenon.com"
    ]
  },
  {
    "id": "mechacomic.jp",
    "siteKey": "mechacomic.jp",
    "matches": [
      "mechacomic.jp"
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
    "id": "comic-top",
    "siteKey": "comic-top.com",
    "matches": [
      "comic-top.com"
    ]
  },
  {
    "id": "mangafire",
    "siteKey": "mangafire.to",
    "matches": [
      "mangafire.to"
    ]
  },
  {
    "id": "jumptoon-next",
    "siteKey": "jumptoon-next.com",
    "matches": [
      "jumptoon-next.com"
    ]
  },
  {
    "id": "jumptoon",
    "siteKey": "jumptoon_tiaoman.com",
    "matches": [
      "jumptoon_tiaoman.com",
      "jumptoon.com"
    ]
  },
  {
    "id": "comic-trail",
    "siteKey": "comic-trail.com",
    "matches": [
      "comic-trail.com"
    ]
  },
  {
    "id": "comic-walker",
    "siteKey": "comic-walker.com",
    "matches": [
      "comic-walker.com"
    ]
  },
  {
    "id": "comick",
    "siteKey": "comick.io",
    "matches": [
      "comick.io",
      "comick.art"
    ]
  },
  {
    "id": "manga18fx",
    "siteKey": "manga18fx.com",
    "matches": [
      "manga18fx.com",
      "bakamh.ru"
    ]
  },
  {
    "id": "mangasincensura",
    "siteKey": "www.mangasincensura.com",
    "matches": [
      "www.mangasincensura.com"
    ]
  },
  {
    "id": "manhwa-raw",
    "siteKey": "manhwa-raw.com",
    "matches": [
      "manhwa-raw.com",
      "ero18x.com"
    ]
  },
  {
    "id": "lrr.tvc-16.science",
    "siteKey": "lrr.tvc-16.science",
    "matches": [
      "lrr.tvc-16.science"
    ]
  },
  {
    "id": "mangarawad",
    "siteKey": "mangarawad.org",
    "matches": [
      "mangarawad.org",
      "mangarawad.blog"
    ]
  },
  {
    "id": "managall",
    "siteKey": "s1.managall.com",
    "matches": [
      "s1.managall.com"
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
    "id": "manhwato",
    "siteKey": "manhwato.com",
    "matches": [
      "manhwato.com"
    ]
  },
  {
    "id": "manhwatop",
    "siteKey": "manhwatop.com",
    "matches": [
      "manhwatop.com"
    ]
  },
  {
    "id": "manga-park",
    "siteKey": "manga-park.com",
    "matches": [
      "manga-park.com"
    ]
  },
  {
    "id": "ko-comic",
    "siteKey": "*comic.naver.com",
    "matches": [
      "*comic.naver.com"
    ]
  },
  {
    "id": "fxfx302",
    "siteKey": "fxfx302.com",
    "matches": [
      "fxfx302.com"
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
    "id": "newtoki341.com",
    "siteKey": "newtoki_notranslate*.com",
    "matches": [
      "newtoki_notranslate*.com"
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
    "id": "writing.com",
    "siteKey": "writing.com",
    "matches": [
      "writing.com"
    ]
  },
  {
    "id": "comic-fuz",
    "siteKey": "comic-fuz.com",
    "matches": [
      "comic-fuz.com"
    ]
  },
  {
    "id": "mangadex",
    "siteKey": "mangadex.org",
    "matches": [
      "mangadex.org"
    ]
  },
  {
    "id": "kuaikanmanhua",
    "siteKey": "*.kuaikanmanhua_notranslate.com",
    "matches": [
      "*.kuaikanmanhua_notranslate.com"
    ]
  },
  {
    "id": "sexkomix2",
    "siteKey": "sexkomix2.com",
    "matches": [
      "sexkomix2.com"
    ]
  },
  {
    "id": "mangapark",
    "siteKey": "mangapark.net",
    "matches": [
      "mangapark.net",
      "mangapark.to",
      "mangapark.org"
    ]
  },
  {
    "id": "mangaflame",
    "siteKey": "mangaflame.org",
    "matches": [
      "mangaflame.org",
      "manhwa404.com"
    ]
  },
  {
    "id": "templetoons",
    "siteKey": "templetoons.com",
    "matches": [
      "templetoons.com"
    ]
  },
  {
    "id": "poipiku",
    "siteKey": "poipiku.com",
    "matches": [
      "poipiku.com"
    ]
  },
  {
    "id": "batocomic",
    "siteKey": "batocomic.net",
    "matches": [
      "batocomic.net",
      "zbato.org"
    ]
  },
  {
    "id": "mangasuika",
    "siteKey": "www.mangasuika.com",
    "matches": [
      "www.mangasuika.com"
    ]
  },
  {
    "id": "firemanga",
    "siteKey": "www.firemanga.com",
    "matches": [
      "www.firemanga.com"
    ]
  },
  {
    "id": "lmanga",
    "siteKey": "www.lmanga.com",
    "matches": [
      "www.lmanga.com"
    ]
  },
  {
    "id": "ganma",
    "siteKey": "share.ganma.jp",
    "matches": [
      "share.ganma.jp",
      "ganma.jp"
    ]
  },
  {
    "id": "manhwahub",
    "siteKey": "manhwahub.net",
    "matches": [
      "manhwahub.net",
      "manhuatop.org",
      "aedexnox.vxviral.xyz"
    ]
  },
  {
    "id": "hentaizap",
    "siteKey": "hentaizap.com",
    "matches": [
      "hentaizap.com"
    ]
  },
  {
    "id": "younganimal",
    "siteKey": "younganimal.com",
    "matches": [
      "younganimal.com"
    ]
  },
  {
    "id": "bilibili-manga",
    "siteKey": "manga.bilibili.com",
    "matches": [
      "manga.bilibili.com"
    ]
  },
  {
    "id": "comic-growl",
    "siteKey": "comic-growl.com",
    "matches": [
      "comic-growl.com"
    ]
  },
  {
    "id": "manhuabika",
    "siteKey": "manhuabika.com",
    "matches": [
      "manhuabika.com"
    ]
  },
  {
    "id": "manhwahentai",
    "siteKey": "manhwahentai.io",
    "matches": [
      "manhwahentai.io",
      "beehentai.com"
    ]
  },
  {
    "id": "xmanga",
    "siteKey": "xmanga.org",
    "matches": [
      "xmanga.org"
    ]
  },
  {
    "id": "comic-action",
    "siteKey": "comic-action.com",
    "matches": [
      "comic-action.com"
    ]
  },
  {
    "id": "animatebookstore",
    "siteKey": "www.animatebookstore.com",
    "matches": [
      "www.animatebookstore.com"
    ]
  },
  {
    "id": "rokuhentai",
    "siteKey": "rokuhentai.com",
    "matches": [
      "rokuhentai.com"
    ]
  },
  {
    "id": "hanime1",
    "siteKey": "hanime1.me",
    "matches": [
      "hanime1.me"
    ]
  },
  {
    "id": "rawotaku",
    "siteKey": "rawotaku.com",
    "matches": [
      "rawotaku.com"
    ]
  },
  {
    "id": "rawkuma.net",
    "siteKey": "rawkuma.net",
    "matches": [
      "rawkuma.net",
      "florascans.net"
    ]
  },
  {
    "id": "pixiv.app",
    "siteKey": "pixiv.app",
    "matches": [
      "pixiv.app"
    ]
  },
  {
    "id": "speed-manga",
    "siteKey": "speed-manga.com",
    "matches": [
      "speed-manga.com"
    ]
  },
  {
    "id": "cmoa",
    "siteKey": "www.cmoa.jp",
    "matches": [
      "www.cmoa.jp",
      "booklive.jp",
      "www.yomonga.com"
    ]
  },
  {
    "id": "global.manga",
    "siteKey": "global.manga-up.com",
    "matches": [
      "global.manga-up.com"
    ]
  },
  {
    "id": "mangaball",
    "siteKey": "mangaball.net",
    "matches": [
      "mangaball.net"
    ]
  },
  {
    "id": "yanmaga.jp",
    "siteKey": "yanmaga.jp",
    "matches": [
      "yanmaga.jp",
      "viewer.bookhodai.jp"
    ]
  },
  {
    "id": "tkr-manga",
    "siteKey": "tkr*.com",
    "matches": [
      "tkr*.com"
    ]
  },
  {
    "id": "manhwa18.com",
    "siteKey": "manhwa18.com",
    "matches": [
      "manhwa18.com"
    ]
  },
  {
    "id": "comic.mf-fleur.jp",
    "siteKey": "comic.mf-fleur.jp",
    "matches": [
      "comic.mf-fleur.jp"
    ]
  },
  {
    "id": "wfwf",
    "siteKey": "wfwf395.com",
    "matches": [
      "wfwf395.com",
      "wfwf399.com"
    ]
  },
  {
    "id": "play.comipo.app",
    "siteKey": "play.comipo.app",
    "matches": [
      "play.comipo.app"
    ]
  },
  {
    "id": "mangafreak",
    "siteKey": "ww2.mangafreak.me",
    "matches": [
      "ww2.mangafreak.me"
    ]
  },
  {
    "id": "komiic",
    "siteKey": "komiic.com",
    "matches": [
      "komiic.com"
    ]
  },
  {
    "id": "page.kakao",
    "siteKey": "page.kakao.com",
    "matches": [
      "page.kakao.com"
    ]
  },
  {
    "id": "manhwaus.org",
    "siteKey": "manhwaus.org",
    "matches": [
      "manhwaus.org",
      "manga18.me"
    ]
  },
  {
    "id": "tichct",
    "siteKey": "www.tichct.org",
    "matches": [
      "www.tichct.org"
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
    "siteKey": "*.udacity.com",
    "matches": [
      "*.udacity.com"
    ]
  },
  {
    "id": "skillshare",
    "siteKey": "www.skillshare.com",
    "matches": [
      "www.skillshare.com"
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
    "id": "svtplay",
    "siteKey": "www.svtplay.se",
    "matches": [
      "www.svtplay.se"
    ]
  },
  {
    "id": "unity-learn",
    "siteKey": "learn.unity.com",
    "matches": [
      "learn.unity.com"
    ]
  },
  {
    "id": "hbogo",
    "siteKey": "www.hbogoasia.*",
    "matches": [
      "www.hbogoasia.*"
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
    "id": "video-barrons",
    "siteKey": "video-api.wsj.com",
    "matches": [
      "video-api.wsj.com"
    ]
  },
  {
    "id": "aetv",
    "siteKey": "play.aetv.com",
    "matches": [
      "play.aetv.com"
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
    "siteKey": "*.linkedin.com",
    "matches": [
      "*.linkedin.com"
    ]
  },
  {
    "id": "kanopy",
    "siteKey": "*.kanopy.com",
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
    "id": "itv",
    "siteKey": "*.itv.com",
    "matches": [
      "*.itv.com"
    ]
  },
  {
    "id": "vk.com",
    "siteKey": "vkvideo.ru",
    "matches": [
      "vk.com/video*",
      "vkvideo.ru"
    ]
  },
  {
    "id": "egghead",
    "siteKey": "egghead.io",
    "matches": [
      "egghead.io"
    ]
  },
  {
    "id": "coursera1",
    "selectorMatches": [
      ".rc-MetatagsWrapper .rc-VLPContainerWrapperCds"
    ]
  },
  {
    "id": "coursera2",
    "selectorMatches": [
      ".rc-MetatagsWrapper .rc-Course"
    ]
  },
  {
    "id": "whop",
    "siteKey": "courses.apps.whop.com",
    "matches": [
      "courses.apps.whop.com"
    ]
  },
  {
    "id": "servicenow",
    "siteKey": "www.servicenow.com",
    "matches": [
      "www.servicenow.com"
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
    "id": "kika",
    "siteKey": "www.kika.de",
    "matches": [
      "www.kika.de"
    ]
  },
  {
    "id": "ocrtraining",
    "siteKey": "ocrtraining.cit.nih.gov",
    "matches": [
      "ocrtraining.cit.nih.gov",
      "videocast.nih.gov"
    ]
  },
  {
    "id": "espn",
    "siteKey": "*.espn.com",
    "matches": [
      "*.espn.com"
    ]
  },
  {
    "id": "anthropic-course",
    "siteKey": "anthropic.skilljar.com",
    "matches": [
      "anthropic.skilljar.com"
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
    "siteKey": "*.dailymotion.com",
    "matches": [
      "*.dailymotion.com"
    ]
  },
  {
    "id": "crunchyroll",
    "siteKey": "*.crunchyroll.com",
    "matches": [
      "*.crunchyroll.com"
    ]
  },
  {
    "id": "osmosis",
    "siteKey": "*.osmosis.org",
    "matches": [
      "*.osmosis.org"
    ]
  },
  {
    "id": "pbs",
    "siteKey": "*.pbs.org",
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
    "id": "smartpoly.teachable.com",
    "siteKey": "smartpoly.teachable.com",
    "matches": [
      "smartpoly.teachable.com"
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
    "siteKey": "vidsrc.xyz",
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
    "id": "backrooms-wiki",
    "siteKey": "backrooms-wiki.wikidot.com",
    "matches": [
      "backrooms-wiki.wikidot.com"
    ]
  },
  {
    "id": "hubspotvideo",
    "siteKey": "*.hubspotvideo.com",
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
    "siteKey": "*.paramountplus.com",
    "matches": [
      "*.paramountplus.com"
    ]
  },
  {
    "id": "plex.tv",
    "siteKey": "watch.plex.tv",
    "matches": [
      "watch.plex.tv"
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
    "siteKey": "www.physeo.com",
    "matches": [
      "https://player.vimeo.com/video/*",
      "www.physeo.com"
    ],
    "selectorMatches": [
      "iframe[src*='player.vimeo.com']"
    ]
  },
  {
    "id": "laracasts.com",
    "siteKey": "laracasts.com",
    "matches": [
      "laracasts.com"
    ]
  },
  {
    "id": "tv.adobe",
    "siteKey": "*.tv.adobe.com",
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
    "siteKey": "*.comsol.com",
    "matches": [
      "*.comsol.com"
    ]
  },
  {
    "id": "jove",
    "siteKey": "*.jove.com",
    "matches": [
      "*.jove.com"
    ]
  },
  {
    "id": "rumble",
    "siteKey": "rumble.com",
    "matches": [
      "rumble.com"
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
    "siteKey": "courses.mitxonline.mit.edu",
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
    "siteKey": "*.bbc.*",
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
    "id": "piped.video",
    "siteKey": "piped.video",
    "matches": [
      "piped.video"
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
    "id": "mubi",
    "siteKey": "mubi.com",
    "matches": [
      "https://mubi.com",
      "https://mubi.de"
    ]
  },
  {
    "id": "hulu",
    "siteKey": "*.hulu.com",
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
    "id": "jointherealworld",
    "siteKey": "app.jointherealworld.com",
    "matches": [
      "app.jointherealworld.com"
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
    "id": "dmm",
    "siteKey": "tv.dmm.com",
    "matches": [
      "tv.dmm.com"
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
    "id": "codewithandrea",
    "siteKey": "customer-*.cloudflarestream.com",
    "matches": [
      "customer-*.cloudflarestream.com"
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
    "siteKey": "*.dr.dk",
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
    "id": "fibery",
    "siteKey": "the.fibery.io",
    "matches": [
      "the.fibery.io"
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
    "siteKey": "dart.dev",
    "matches": [
      "*.google.com",
      "dart.dev",
      "*.google",
      "*.googleapis.com"
    ]
  },
  {
    "id": "etymonline",
    "siteKey": "www.etymonline.com",
    "matches": [
      "www.etymonline.com"
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
    "siteKey": "*.tandfonline.com",
    "matches": [
      "*.tandfonline.com"
    ]
  },
  {
    "id": "boringreport",
    "siteKey": "www.boringreport.org",
    "matches": [
      "www.boringreport.org"
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
    "siteKey": "*.peacocktv.com",
    "matches": [
      "*.peacocktv.com"
    ]
  },
  {
    "id": "jmir",
    "siteKey": "*.jmir.org",
    "matches": [
      "*.jmir.org"
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
    "id": "learnopengl",
    "siteKey": "learnopengl.com",
    "matches": [
      "learnopengl.com"
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
    "siteKey": "*.eightfold.ai",
    "matches": [
      "*.eightfold.ai"
    ]
  },
  {
    "id": "chub.ai",
    "siteKey": "chub.ai",
    "matches": [
      "chub.ai"
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
    "id": "gradio-app",
    "selectorMatches": [
      "gradio-app"
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
    "id": "docs.unity.cn",
    "siteKey": "docs.unity.cn",
    "matches": [
      "docs.unity.cn"
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
    "id": "typeset.io",
    "siteKey": "typeset.io",
    "matches": [
      "typeset.io"
    ]
  },
  {
    "id": "transformer-circuits.pub",
    "siteKey": "transformer-circuits.pub",
    "matches": [
      "transformer-circuits.pub"
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
    "id": "trankynam",
    "siteKey": "www.trankynam.com",
    "matches": [
      "www.trankynam.com"
    ]
  },
  {
    "id": "chromium",
    "siteKey": "*.chromium.org",
    "matches": [
      "*.chromium.org"
    ]
  },
  {
    "id": "noRichTranslate",
    "siteKey": "www.omim.org",
    "matches": [
      "www.omim.org",
      "*.nisanyanadlar.com",
      "www.360doc.cn"
    ]
  },
  {
    "id": "longPage",
    "siteKey": "neuralnetworksanddeeplearning.com",
    "matches": [
      "neuralnetworksanddeeplearning.com",
      "www.alphapolis.co.jp",
      "sive.rs"
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
    "id": "duolingo",
    "siteKey": "www.duolingo.com",
    "matches": [
      "www.duolingo.com"
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
    "id": "sphinx-rtd-theme",
    "selectorMatches": [
      ".wy-nav-side"
    ]
  },
  {
    "id": "arenascan",
    "siteKey": "arenascan.com",
    "matches": [
      "arenascan.com",
      "luvyaa.my.id"
    ]
  },
  {
    "id": "manhuaplus",
    "siteKey": "manhuaplus.org",
    "matches": [
      "manhuaplus.org"
    ]
  },
  {
    "id": "hentai.name",
    "siteKey": "www.hentai.name",
    "matches": [
      "www.hentai.name"
    ]
  },
  {
    "id": "www.manhuazhan.com",
    "siteKey": "www.manhuazhan.com",
    "matches": [
      "www.manhuazhan.com"
    ]
  },
  {
    "id": "momon-ga.com",
    "siteKey": "momon-ga.com",
    "matches": [
      "momon-ga.com"
    ]
  },
  {
    "id": "blossommanga.com",
    "siteKey": "blossommanga.com",
    "matches": [
      "blossommanga.com"
    ]
  },
  {
    "id": "w226.npdn.top",
    "siteKey": "w226.npdn.top",
    "matches": [
      "w226.npdn.top",
      "www.hmttmh.com"
    ]
  },
  {
    "id": "dlsite",
    "siteKey": "*.dlsite.com",
    "matches": [
      "*.dlsite.com"
    ]
  },
  {
    "id": "rawkuma",
    "siteKey": "rawkuma.com",
    "matches": [
      "rawkuma.com"
    ]
  },
  {
    "id": "manhuaus.com",
    "siteKey": "manhuaus.com",
    "matches": [
      "manhuaus.com"
    ]
  },
  {
    "id": "toondex",
    "siteKey": "toondex.co",
    "matches": [
      "toondex.co"
    ]
  },
  {
    "id": "jestful",
    "siteKey": "jestful.net",
    "matches": [
      "jestful.net"
    ]
  },
  {
    "id": "manwadd",
    "siteKey": "manwadd.cc",
    "matches": [
      "manwadd.cc",
      "manwadb.cc",
      "manwadb.xyz",
      "manwath.cc",
      "manwa.me",
      "manwa*.*"
    ]
  },
  {
    "id": "saucemanhwa",
    "siteKey": "saucemanhwa.com",
    "matches": [
      "saucemanhwa.com",
      "saucemanhwa.org"
    ]
  },
  {
    "id": "kaijimanga",
    "siteKey": "w9.kaijimanga.com",
    "matches": [
      "w9.kaijimanga.com",
      "rawfree.*"
    ]
  },
  {
    "id": "mangakoinu",
    "siteKey": "www.mangakoinu.com",
    "matches": [
      "www.mangakoinu.com"
    ]
  },
  {
    "id": "comicmanga",
    "siteKey": "comicmanga.cc",
    "matches": [
      "comicmanga.cc"
    ]
  },
  {
    "id": "mangajikan",
    "siteKey": "www.mangajikan.com",
    "matches": [
      "www.mangajikan.com"
    ]
  },
  {
    "id": "manhwaden",
    "siteKey": "www.manhwaden.com",
    "matches": [
      "www.manhwaden.com"
    ]
  },
  {
    "id": "jcomic",
    "siteKey": "jcomic.net",
    "matches": [
      "jcomic.net"
    ]
  },
  {
    "id": "komiku",
    "siteKey": "komiku.com",
    "matches": [
      "komiku.com",
      "komiku.one",
      "manga18fx.cc"
    ]
  },
  {
    "id": "sololevelingmangafree",
    "siteKey": "www.sololevelingmangafree.com",
    "matches": [
      "www.sololevelingmangafree.com"
    ]
  },
  {
    "id": "dvamh-vzwp7",
    "siteKey": "dvamh-vzwp7.top",
    "matches": [
      "dvamh-vzwp7.top"
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
    "siteKey": "learn.svelte.dev",
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
    "siteKey": "*.service-now.com",
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
    "id": "palcy",
    "siteKey": "palcy.jp",
    "matches": [
      "palcy.jp"
    ]
  },
  {
    "id": "xbato",
    "siteKey": "xbato.com",
    "matches": [
      "xbato.com"
    ]
  },
  {
    "id": "syosetu",
    "siteKey": "syosetu.si",
    "matches": [
      "syosetu.si"
    ]
  },
  {
    "id": "iqiyi-manga",
    "siteKey": "www.iqiyi.com",
    "matches": [
      "www.iqiyi.com/manhua/*"
    ]
  },
  {
    "id": "mangarawjp",
    "siteKey": "mangarawjp.me",
    "matches": [
      "mangarawjp.me"
    ]
  },
  {
    "id": "cartoonporn",
    "siteKey": "cartoonporn.to",
    "matches": [
      "cartoonporn.to"
    ]
  },
  {
    "id": "e621",
    "siteKey": "e621.net",
    "matches": [
      "e621.net"
    ]
  },
  {
    "id": "comic.pixiv.net",
    "siteKey": "comic.pixiv.net",
    "matches": [
      "comic.pixiv.net"
    ]
  },
  {
    "id": "www.comico.jp",
    "siteKey": "www.comico.jp",
    "matches": [
      "www.comico.jp"
    ]
  },
  {
    "id": "rule34",
    "siteKey": "rule34.xxx",
    "matches": [
      "rule34.xxx"
    ]
  },
  {
    "id": "hentaipaw",
    "siteKey": "hentaipaw.com",
    "matches": [
      "hentaipaw.com",
      "ja.hentaipaw.com"
    ]
  },
  {
    "id": "mn4u",
    "siteKey": "mn4u.net",
    "matches": [
      "mn4u.net"
    ]
  },
  {
    "id": "imhentai",
    "siteKey": "imhentai.xxx",
    "matches": [
      "imhentai.xxx"
    ]
  },
  {
    "id": "book18",
    "siteKey": "book18.fans",
    "matches": [
      "book18.fans"
    ]
  },
  {
    "id": "18comic",
    "siteKey": "18comic.vip",
    "matches": [
      "18comic.vip"
    ]
  },
  {
    "id": "uzakichanmanga",
    "siteKey": "*.uzakichanmanga.com",
    "matches": [
      "*.uzakichanmanga.com"
    ]
  },
  {
    "id": "manhwas",
    "siteKey": "www.manhwas.men",
    "matches": [
      "www.manhwas.men"
    ]
  },
  {
    "id": "yinmh",
    "siteKey": "www.yinmh.com",
    "matches": [
      "www.yinmh.com"
    ]
  },
  {
    "id": "webtoonraw",
    "siteKey": "webtoonraw.com",
    "matches": [
      "webtoonraw.com"
    ]
  },
  {
    "id": "webtoons",
    "siteKey": "www.webtoons.com",
    "matches": [
      "www.webtoons.com",
      "m.webtoons.com"
    ]
  },
  {
    "id": "lezhin",
    "siteKey": "lezhin.com",
    "matches": [
      "lezhin.com",
      "www.lezhin.com"
    ]
  },
  {
    "id": "ridibooks.com",
    "siteKey": "ridibooks.com",
    "matches": [
      "ridibooks.com"
    ]
  },
  {
    "id": "sololevelingfree.vip",
    "siteKey": "sololevelingfree.vip",
    "matches": [
      "sololevelingfree.vip"
    ]
  },
  {
    "id": "topreadmanga.com",
    "siteKey": "topreadmanga.com",
    "matches": [
      "topreadmanga.com",
      "kissmanga.in"
    ]
  },
  {
    "id": "revengeoftheiron-bloodedswordhound.one",
    "siteKey": "revengeoftheiron-bloodedswordhound.one",
    "matches": [
      "revengeoftheiron-bloodedswordhound.one"
    ]
  },
  {
    "id": "www.wn03.ru",
    "siteKey": "www.wn03.ru",
    "matches": [
      "www.wn03.ru"
    ]
  },
  {
    "id": "www.sunday-webry.com",
    "siteKey": "www.sunday-webry.com",
    "matches": [
      "www.sunday-webry.com"
    ]
  },
  {
    "id": "ynjn",
    "siteKey": "ynjn.jp",
    "matches": [
      "ynjn.jp"
    ]
  },
  {
    "id": "mangalove",
    "siteKey": "mangalove.me",
    "matches": [
      "mangalove.me"
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
    "id": "t1.xtoon2.com",
    "siteKey": "t1.xtoon2.com",
    "matches": [
      "t1.xtoon2.com"
    ]
  },
  {
    "id": "t1.xtoon365.com",
    "siteKey": "t1.xtoon365.com",
    "matches": [
      "t1.xtoon365.com"
    ]
  },
  {
    "id": "02.ikiru.wtf",
    "siteKey": "02.ikiru.wtf",
    "matches": [
      "02.ikiru.wtf"
    ]
  },
  {
    "id": "mangahub",
    "siteKey": "mangahub.ru",
    "matches": [
      "mangahub.ru"
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
    "id": "z-lib",
    "siteKey": "*.z-lib.*",
    "matches": [
      "*.z-lib.*"
    ]
  },
  {
    "id": "otter.ai",
    "siteKey": "otter.ai",
    "matches": [
      "otter.ai"
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
    "id": "curseforge",
    "siteKey": "www.curseforge.com",
    "matches": [
      "www.curseforge.com"
    ]
  },
  {
    "id": "duckduckgo",
    "siteKey": "duckduckgo.com",
    "matches": [
      "duckduckgo.com"
    ]
  },
  {
    "id": "justia",
    "siteKey": "supreme.justia.com",
    "matches": [
      "supreme.justia.com"
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
    "id": "rebang",
    "siteKey": "rebang.today",
    "matches": [
      "rebang.today"
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
    "id": "mocharymethod.com",
    "siteKey": "beta.mocharymethod.com",
    "matches": [
      "beta.mocharymethod.com"
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
    "id": "bb-rich",
    "selectorMatches": [
      "bb-rich-text-editor",
      ".bb-editor-root",
      ".ql-editor"
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
    "id": "readthedocs",
    "siteKey": "*.readthedocs.*",
    "matches": [
      "*.readthedocs.*"
    ]
  },
  {
    "id": "surveymyopinion.researchnow",
    "siteKey": "surveymyopinion.researchnow.com",
    "matches": [
      "surveymyopinion.researchnow.com"
    ]
  },
  {
    "id": "xfiction.org",
    "siteKey": "*.xfiction.org",
    "matches": [
      "*.xfiction.org"
    ]
  },
  {
    "id": "new.rayyan.ai",
    "siteKey": "new.rayyan.ai",
    "matches": [
      "new.rayyan.ai"
    ]
  },
  {
    "id": "aliexpress",
    "siteKey": "*.aliexpress.*",
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
    "id": "journals.aps",
    "siteKey": "journals.aps.*",
    "matches": [
      "journals.aps.*"
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
    "id": "JeffyReader",
    "selectorMatches": [
      "br-span"
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
    "siteKey": "*.taobao.com",
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
    "id": "next_westlaw",
    "siteKey": "*.next.westlaw.com",
    "matches": [
      "*.next.westlaw.com"
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
    "id": "sp.nexusmods",
    "selectorMatches": [
      ".next-container section [data-lexical-editor]"
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
    "id": "ya.ru",
    "siteKey": "ya.ru",
    "matches": [
      "ya.ru"
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
    "id": "rubyonrails",
    "siteKey": "api.rubyonrails.org",
    "matches": [
      "api.rubyonrails.org"
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
    "id": "gothamist",
    "siteKey": "gothamist.com",
    "matches": [
      "gothamist.com"
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
    "siteKey": "*.1password.com",
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
    "id": "turboscribe",
    "siteKey": "turboscribe.ai",
    "matches": [
      "turboscribe.ai"
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
    "id": "mathsisfun",
    "siteKey": "www.mathsisfun.com",
    "matches": [
      "www.mathsisfun.com"
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
    "id": "trade-padre",
    "siteKey": "trade.padre.gg",
    "matches": [
      "trade.padre.gg"
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
    "id": "disableAutoHeight",
    "siteKey": "app.intercom.com",
    "matches": [
      "app.intercom.com"
    ]
  },
  {
    "id": "autoHeight",
    "siteKey": "zen-browser.app",
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
    "id": "www.ti.com.cn",
    "siteKey": "www.ti.com.cn",
    "matches": [
      "www.ti.com.cn"
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
    "id": "investopedia",
    "siteKey": "www.investopedia.com",
    "matches": [
      "www.investopedia.com"
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
    "id": "futuretools",
    "siteKey": "www.futuretools.io",
    "matches": [
      "www.futuretools.io"
    ]
  },
  {
    "id": "ficbook.net",
    "siteKey": "ficbook.net",
    "matches": [
      "ficbook.net"
    ]
  },
  {
    "id": "xiaosaas",
    "siteKey": "*.xiaosaas.com",
    "matches": [
      "*.xiaosaas.com"
    ]
  },
  {
    "id": "migflash",
    "siteKey": "migflash.com",
    "matches": [
      "migflash.com"
    ]
  },
  {
    "id": "jfrog",
    "siteKey": "jfrog.com",
    "matches": [
      "jfrog.com"
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
    "id": "solidity-by-example",
    "siteKey": "solidity-by-example.org",
    "matches": [
      "solidity-by-example.org"
    ]
  },
  {
    "id": "kemono.cr",
    "siteKey": "kemono.cr",
    "matches": [
      "kemono.cr"
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
    "id": "spicychat.ai",
    "siteKey": "spicychat.ai",
    "matches": [
      "spicychat.ai"
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
    "id": "mckinsey",
    "siteKey": "www.mckinsey.com",
    "matches": [
      "www.mckinsey.com"
    ]
  },
  {
    "id": "dcinside",
    "siteKey": "*.dcinside.com",
    "matches": [
      "*.dcinside.com"
    ]
  },
  {
    "id": "radix-ui",
    "siteKey": "www.radix-ui.com",
    "matches": [
      "www.radix-ui.com"
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
    "id": "remove_em",
    "siteKey": "git-scm.com",
    "matches": [
      "git-scm.com",
      "models.com"
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
    "id": "live_attach_basic",
    "selectorMatches": [
      "meta[name='immersive-translate-live-attach-basic'][content='true']"
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
    "id": "common-text-track",
    "siteKey": "www.typing.com",
    "matches": [
      "www.typing.com",
      "*.video-stream-hosting.de",
      "*.thieme.de",
      "videos.sproutvideo.com"
    ]
  },
  {
    "id": "common-vtt-jw",
    "siteKey": "megaplay.buzz",
    "matches": [
      "*.rottentomatoes.com",
      "megaplay.buzz",
      "www.brighttalk.com"
    ]
  },
  {
    "id": "common-ebutt",
    "siteKey": "www.tagesschau.de",
    "matches": [
      "www.tagesschau.de"
    ]
  },
  {
    "id": "formatPreSites",
    "siteKey": "macro.com",
    "matches": [
      "macro.com"
    ]
  },
  {
    "id": "txt",
    "siteKey": "*:",
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
    "id": "cms",
    "siteKey": "silverbullet.md",
    "matches": [
      "silverbullet.md"
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
    "id": "preCodeSites",
    "siteKey": "taylor.town",
    "matches": [
      "taylor.town",
      "www.flatpanelshd.com",
      "www.rarlab.com",
      "bugs.mysql.com",
      "crushon.ai"
    ]
  },
  {
    "id": "otherMathSites",
    "selectorMatches": [
      "math",
      "mjx-container",
      "[class*='MathJax']",
      "[class*='math-']"
    ]
  },
  {
    "id": "htmlLangFirst",
    "selectorMatches": [
      "[lang=he-IL]",
      "[lang=nl-NL]",
      "[lang=ar-SA]",
      "[lang=fa-IR]",
      "[lang=fi]",
      "[lang=fi-FI]"
    ]
  },
  {
    "id": "deepFrameTranslate",
    "siteKey": "anarchothaumaturgist.itch.io",
    "matches": [
      "anarchothaumaturgist.itch.io",
      "darkpetal16.itch.io",
      "registry.khronos.org",
      "achieve.macmillanlearning.com",
      "mail.shanghai.*",
      "help.autodesk.com",
      "*.vitalsource.com",
      "*.sumtotal.host",
      "academy.notion.com",
      "www.unigui.com"
    ]
  },
  {
    "id": "common.pdfWebPage",
    "selectorMatches": [
      "embed[type='application/pdf']"
    ]
  },
  {
    "id": "finalCommon.pdfWebPage",
    "siteKey": "obgyn.onlinelibrary.wiley.com",
    "matches": [
      "https://obgyn.onlinelibrary.wiley.com/doi/pdf/*",
      "https://onlinelibrary.wiley.com/doi/pdf/*",
      "https://docs.amd.com/v/u/*/*",
      "https://arxiv.org/pdf/*"
    ],
    "selectorMatches": [
      "embed[type='application/pdf']",
      "iframe[type='application/pdf']",
      "[id=myPdfIframe][src*=pdf]",
      "#article [type='application/pdf'][src*=pdf]",
      ".textFrame [type='application/pdf'][src*=pdf]",
      ".ggPdf",
      "[id=pdfCanvasContainer] > iframe[src*=pdf]",
      ".viewercontent-container  iframe[src*=documents]",
      "object[type='application/pdf']"
    ]
  },
  {
    "id": "common4.pdfWebPage",
    "selectorMatches": [
      "#statements-pdf"
    ]
  },
  {
    "id": "common-query.pdfWebPage",
    "selectorMatches": [
      "[id=pdfCanvasContainer] > iframe[src*=pdf]"
    ]
  },
  {
    "id": "fix-nav2header",
    "siteKey": "www.acea.auto",
    "matches": [
      "www.acea.auto",
      "news.cgtn.com"
    ]
  },
  {
    "id": "strict-fix-nav2header",
    "siteKey": "www.talkclassical.com",
    "matches": [
      "www.talkclassical.com"
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
    "siteKey": "altis.world",
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
