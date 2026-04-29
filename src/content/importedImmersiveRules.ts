import type { WebTranslationRule } from "../shared/webRuleTypes";

// Derived from the local chrome-immersive-translate-1_28_5 package.
// Only webpage-translation fields are retained; PDF, OCR, image, subtitle, and product-platform fields are intentionally omitted.
export const IMPORTED_IMMERSIVE_WEB_RULES = [
  {
    "id": "shopee",
    "siteKey": "seller.shopee.*",
    "matches": [
      "seller.shopee.*",
      "shopee.*"
    ],
    "injectedCss": [
      ".WBVL_7,.ellipsis-content {-webkit-line-clamp:unset!important;}"
    ]
  },
  {
    "id": "fanbox",
    "siteKey": "fanbox.cc",
    "matches": [
      "*.fanbox.cc"
    ],
    "mutationExcludeSelectors": [
      "[class^='Body__PostBodyText']"
    ],
    "isHighDynamic": true
  },
  {
    "id": "wikipedia",
    "siteKey": "wikipedia.org",
    "matches": [
      "*.wikipedia.org"
    ],
    "selectors": [
      "#content",
      "#bodyContent"
    ],
    "contentSelectors": [
      {
        "selector": "#content",
        "category": "content-block"
      },
      {
        "selector": "#bodyContent",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".mw-editsection",
      ".mw-cite-backlink",
      "#p-lang-btn",
      "#right-navigation",
      "#p-associated-pages",
      ".vector-header",
      ".lazy-image-placeholder"
    ],
    "injectedCss": [
      ".immersive-translate-target-translation-block-wrapper { display: block !important; }",
      ".mwe-popups-extract {max-height:unset!important;height:unset!important;}",
      ".immersive-translate-target-wrapper {content-visibility:auto;}"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
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
    ],
    "selectors": [
      "[data-testid='tweetText']",
      "[style*='-webkit-line-clamp']",
      ".tweet-text",
      "[data-testid='tweet'] [class='css-175oi2r r-13awgt0 r-eqz5dr r-iphfwy r-3o4zer r-ttdzmv']",
      "[data-testid='tweet'] .css-175oi2r span",
      ".js-quoted-tweet-text",
      "[data-testid='card.layoutSmall.detail'] > div:nth-child(2)",
      "[data-testid='developerBuiltCardContainer'] > div:nth-child(2)",
      "[data-testid='card.layoutLarge.detail'] > div:nth-child(2)",
      "[data-testid='cellInnerDiv'] div[data-testid='UserCell'] > div> div:nth-child(2)",
      "[data-testid='UserDescription']",
      "[data-testid='HoverCard'] div[dir=auto]",
      "[data-testid='HoverCard'] span[dir=auto]",
      "[data-testid='HoverCard'] [role='dialog'] div[dir=ltr]",
      "[data-testid='birdwatch-pivot'] div[dir=ltr]",
      "[data-testid='twitterArticleReadView']",
      "[aria-label='Grok']",
      "[role=dialog]",
      "[class='css-175oi2r r-1awozwy r-13awgt0 r-1rnoaur r-13qz1uu']",
      "[class='css-175oi2r r-kemksi r-1kqtdi0 r-1q9bdsx r-1phboty r-rs99b7 r-1udh08x r-13qz1uu']",
      "[class='css-175oi2r r-uef6q5 r-dnmrzs r-97e31f r-13qz1uu r-13awgt0 r-dgnwoc r-1me0s30 r-t3sqpr r-1dqxon3']",
      "[class='css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0']",
      "[data-testid='inlinePrompt']",
      "span[class='css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-n6v787 r-1cwl3u0']",
      "[data-testid=primaryColumn] [class='css-175oi2r r-kzbkwu r-3pj75a'] > div > span[class='css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3']",
      "[data-testid=\"tweetText\"] div.r-6koalj"
    ],
    "contentSelectors": [
      {
        "selector": "[data-testid='tweetText']",
        "category": "content-block"
      },
      {
        "selector": "[style*='-webkit-line-clamp']",
        "category": "content-block"
      },
      {
        "selector": ".tweet-text",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='tweet'] [class='css-175oi2r r-13awgt0 r-eqz5dr r-iphfwy r-3o4zer r-ttdzmv']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='tweet'] .css-175oi2r span",
        "category": "content-block"
      },
      {
        "selector": ".js-quoted-tweet-text",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='card.layoutSmall.detail'] > div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='developerBuiltCardContainer'] > div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='card.layoutLarge.detail'] > div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='cellInnerDiv'] div[data-testid='UserCell'] > div> div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='UserDescription']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='HoverCard'] div[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='HoverCard'] span[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='HoverCard'] [role='dialog'] div[dir=ltr]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='birdwatch-pivot'] div[dir=ltr]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='twitterArticleReadView']",
        "category": "content-block"
      },
      {
        "selector": "[aria-label='Grok']",
        "category": "content-block"
      },
      {
        "selector": "[role=dialog]",
        "category": "content-block"
      },
      {
        "selector": "[class='css-175oi2r r-1awozwy r-13awgt0 r-1rnoaur r-13qz1uu']",
        "category": "content-block"
      },
      {
        "selector": "[class='css-175oi2r r-kemksi r-1kqtdi0 r-1q9bdsx r-1phboty r-rs99b7 r-1udh08x r-13qz1uu']",
        "category": "content-block"
      },
      {
        "selector": "[class='css-175oi2r r-uef6q5 r-dnmrzs r-97e31f r-13qz1uu r-13awgt0 r-dgnwoc r-1me0s30 r-t3sqpr r-1dqxon3']",
        "category": "content-block"
      },
      {
        "selector": "[class='css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='inlinePrompt']",
        "category": "content-block"
      },
      {
        "selector": "span[class='css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-n6v787 r-1cwl3u0']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=primaryColumn] [class='css-175oi2r r-kzbkwu r-3pj75a'] > div > span[class='css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=\"tweetText\"] div.r-6koalj",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[aria-describedby][role=button]",
      "header",
      "[data-testid='radioGroupplayback_rate'] div",
      "[data-testid='userFollowIndicator']",
      "[class='css-901oao r-14j79pv r-37j5jr r-n6v787 r-16dba41 r-1cwl3u0 r-bcqeeo r-qvutc0']",
      "[class='css-175oi2r r-1wbh5a2 r-dnmrzs']",
      "[aria-label=Grok] button",
      "[aria-label=Grok] [style*='rgb(89, 93, 98)']",
      "[aria-label=Grok] .r-uho16t",
      "[data-testid=User-Name]",
      "[data-testid=socialContext]",
      "[data-testid=tweet-text-show-more-link]",
      "[aria-label=Grok] [class='css-175oi2r r-1habvwh r-vqp9x9 r-1q9bdsx r-1loqt21 r-9njtsq r-1wtj0ep r-nsbfu8 r-xbdcod r-13c7hvr'] > div:last-child",
      "[role='tab']",
      "[data-testid=hoverCardParent] [role=menuitem]",
      "[data-testid=sidebarColumn]",
      "h2[role=heading]",
      "[class='css-175oi2r r-1awozwy r-18u37iz r-1wtj0ep r-6gpygo'],[class='css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2 r-1471scf'],[class='css-175oi2r r-1kbdv8c r-18u37iz r-1wtj0ep r-1ye8kvj r-1s2bzr4']",
      ".imt-caption-container *"
    ],
    "injectedCss": [
      "[data-testid='card.layoutLarge.detail'] > div:nth-child(2) {-webkit-line-clamp: unset!important;}",
      "[data-testid='card.layoutSmall.detail'] > div:nth-child(2) {-webkit-line-clamp: unset!important;}",
      "[data-testid='tweetText'],[style*='-webkit-line-clamp'] {-webkit-line-clamp: unset!important;}",
      "[role=dialog] [style*='webkit-line-clamp'] {-webkit-line-clamp: unset!important;}",
      ".r-h9hxbl{width:unset;}",
      "[aria-label=Grok] [data-testid=ScrollSnap-SwipeableList] [role=presentation] > div > div { max-height: unset !important; }",
      ".css-9pa8cd.imt-img {top: 50%!important;left: 50%!important;transform: translate(-50%, -50%)!important;position:absolute!important;height:unset!important;object-fit: cover !important;}"
    ],
    "paragraphMinTextCount": 2,
    "paragraphMinWordCount": 1,
    "blockMinTextCount": 0,
    "blockMinWordCount": 0
  },
  {
    "id": "zoom-asu",
    "siteKey": "zoom.us",
    "matches": [
      "*.zoom.us/rec/*"
    ],
    "excludeSelectors": [
      ".player-share .video-js"
    ],
    "mutationExcludeSelectors": [
      ".player-share .video-js *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "zoom",
    "siteKey": "zoom.us",
    "matches": [
      "*.zoom.us"
    ],
    "excludeSelectors": [
      ".live-transcription-subtitle__box"
    ],
    "mutationExcludeSelectors": [
      ".live-transcription-subtitle__box *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "team",
    "siteKey": "teams.live.com",
    "matches": [
      "teams.live.com",
      "teams.microsoft.com"
    ],
    "excludeSelectors": [
      ".ui-box .ui-box[class='ui-box']",
      "[data-tid='author']",
      ".fui-ChatMessageCompact__author"
    ],
    "mutationExcludeSelectors": [
      ".ui-box .ui-box[class='ui-box'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "googleMeet",
    "siteKey": "meet.google.com",
    "matches": [
      "meet.google.com"
    ],
    "excludeSelectors": [
      ".iOzk7[jsname='dsyhDe']",
      ".ygicle.VbkSUe"
    ],
    "mutationExcludeSelectors": [
      ".iOzk7[jsname='dsyhDe'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "openrouter",
    "siteKey": "openrouter.ai",
    "matches": [
      "openrouter.ai"
    ],
    "excludeSelectors": [
      ".line-clamp-1.text-lg",
      ".text-muted-foreground.text-sm.col-span-4.text-right",
      "div[title='Tokens this week']",
      ".text-green-600.font-medium",
      ".text-xl.text-slate-11",
      "button[role='tab']",
      "[data-badge-type=http-method]",
      "div[role='region'] > div > ul"
    ]
  },
  {
    "id": "polymarket",
    "siteKey": "polymarket.com",
    "matches": [
      "polymarket.com"
    ],
    "excludeSelectors": [
      "number-flow-react",
      "button",
      "a.inline-flex"
    ],
    "injectedCss": [
      "div[data-index] p.decoration-2 {-webkit-line-clamp:unset;}",
      "div[data-index] .items-start.relative.gap-2.px-3.flex.w-full {height:unset; max-height:unset;}",
      "div[data-index] .absolute.w-full {overflow:scroll;}"
    ]
  },
  {
    "id": "hoyolab",
    "siteKey": "www.hoyolab.com",
    "matches": [
      "www.hoyolab.com"
    ],
    "selectors": [
      ".reply-card__content__detail p:first-child",
      ".reply-card-inner-reply__content > p:first-child"
    ],
    "contentSelectors": [
      {
        "selector": ".reply-card__content__detail p:first-child",
        "category": "content-block"
      },
      {
        "selector": ".reply-card-inner-reply__content > p:first-child",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".reply-card__nickname",
      ".mhy-user-card__name",
      ".mhy-account-title__name"
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
    ],
    "excludeSelectors": [
      ".x6s0dn4.x40hh3e.xrvj5dj.xxfwaov",
      ".x6s0dn4.x78zum5",
      ".xpvyfi4.x1xdureb.x1agbcgv",
      ".xpvyfi4.x1npkx4u.x1ms6mhf"
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
    ],
    "selectors": [
      "span.comment-copy"
    ],
    "contentSelectors": [
      {
        "selector": "span.comment-copy",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".votecell",
      "header",
      "#footer",
      "#question-header + div",
      "div.postcell div.mb0",
      "div[id^=comments-link-]",
      "#answers-header",
      ".new-post-login",
      ".form-submit",
      "a[href='/questions/ask']",
      "#left-sidebar",
      "a.comment-user",
      "span.comment-date",
      "div.s-prose.js-post-body + div",
      ".bottom-notice",
      "div[data-campaign-name=stk]",
      ".s-post-summary--stats",
      ".s-post-summary--meta"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
  },
  {
    "id": "appleDeveloper",
    "siteKey": "developer.apple.com",
    "matches": [
      "developer.apple.com/documentation/*"
    ],
    "selectors": [
      ".container",
      "h3.title",
      "div.content"
    ],
    "contentSelectors": [
      {
        "selector": ".container",
        "category": "content-block"
      },
      {
        "selector": "h3.title",
        "category": "content-block"
      },
      {
        "selector": "div.content",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".vue-recycle-scroller"
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
    ],
    "selectors": [
      ".titleline > a",
      ".comment > .commtext",
      ".toptext",
      "a.hn-item-title",
      ".hn-comment-text",
      ".hn-story-title"
    ],
    "contentSelectors": [
      {
        "selector": ".titleline > a",
        "category": "content-block"
      },
      {
        "selector": ".comment > .commtext",
        "category": "content-block"
      },
      {
        "selector": ".toptext",
        "category": "content-block"
      },
      {
        "selector": "a.hn-item-title",
        "category": "content-block"
      },
      {
        "selector": ".hn-comment-text",
        "category": "content-block"
      },
      {
        "selector": ".hn-story-title",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".reply",
      ".comhead",
      ".subtext"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper {content-visibility:auto;}"
    ]
  },
  {
    "id": "quora",
    "siteKey": "quora.com",
    "matches": [
      "*.quora.com",
      "quora.com"
    ],
    "excludeSelectors": [
      ".dom_annotate_multifeed_bundle_AskQuestionPromptBundle",
      ".dom_annotate_feed_switcher",
      "[class='q-box qu-py--small qu-color--gray_light']",
      "[class='q-box spacing_log_answer_header']",
      "[class='q-box qu-flex--auto']",
      "[class='q-text qu-dynamicFontSize--small qu-mt--small qu-color--gray_light qu-passColorToLinks']",
      ".AnswerFooter___StyledFlex-sc-2xbo88-0",
      "[class='q-box qu-mb--small']",
      "button.q-click-wrapper",
      "[class='q-text qu-dynamicFontSize--tiny qu-pb--tiny qu-mt--small qu-color--gray_light qu-passColorToLinks']",
      "[class='q-text qu-dynamicFontSize--tiny qu-mt--small qu-color--gray_light qu-passColorToLinks']",
      ".qt_read_more",
      "[class='q-flex qu-alignItems--flex-start']",
      "[class='q-box qu-pl--tiny']",
      ".qu-zIndex--action_bar"
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
    ],
    "selectors": [
      ".title > a",
      ".usertext-body"
    ],
    "contentSelectors": [
      {
        "selector": ".title > a",
        "category": "content-block"
      },
      {
        "selector": ".usertext-body",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "otherOldReddit",
    "siteKey": "old.reddit.com",
    "matches": [
      "old.reddit.com"
    ],
    "selectors": [
      "p.title > a",
      "[role=main] .md-container",
      ".media-gallery .usertext",
      ".expando .usertext",
      ".res-expando-box .md"
    ],
    "contentSelectors": [
      {
        "selector": "p.title > a",
        "category": "content-block"
      },
      {
        "selector": "[role=main] .md-container",
        "category": "content-block"
      },
      {
        "selector": ".media-gallery .usertext",
        "category": "content-block"
      },
      {
        "selector": ".expando .usertext",
        "category": "content-block"
      },
      {
        "selector": ".res-expando-box .md",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      "h1",
      ".PostHeader__post-title-line",
      "[data-click-id=body] h3",
      "[data-click-id=background] h3",
      "[data-testid=comment]",
      "[data-adclicklocation='title'] h3",
      "[data-adclicklocation=media]",
      "[data-testid='post-title-text']",
      ".PostContent",
      ".post-content",
      ".Comment__body",
      "faceplate-batch .md",
      "[slot=comment]",
      ".RichTextJSON-root",
      "[slot=title]",
      "[slot=text-body]",
      "p.title > a",
      "[role=main] .md-container",
      ".room-message-text",
      ".crosspost-title",
      "div.md[id^=t3_]",
      ".pt-md"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": ".PostHeader__post-title-line",
        "category": "content-block"
      },
      {
        "selector": "[data-click-id=body] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-click-id=background] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=comment]",
        "category": "content-block"
      },
      {
        "selector": "[data-adclicklocation='title'] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-adclicklocation=media]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='post-title-text']",
        "category": "content-block"
      },
      {
        "selector": ".PostContent",
        "category": "content-block"
      },
      {
        "selector": ".post-content",
        "category": "content-block"
      },
      {
        "selector": ".Comment__body",
        "category": "content-block"
      },
      {
        "selector": "faceplate-batch .md",
        "category": "content-block"
      },
      {
        "selector": "[slot=comment]",
        "category": "content-block"
      },
      {
        "selector": ".RichTextJSON-root",
        "category": "content-block"
      },
      {
        "selector": "[slot=title]",
        "category": "content-block"
      },
      {
        "selector": "[slot=text-body]",
        "category": "content-block"
      },
      {
        "selector": "p.title > a",
        "category": "content-block"
      },
      {
        "selector": "[role=main] .md-container",
        "category": "content-block"
      },
      {
        "selector": ".room-message-text",
        "category": "content-block"
      },
      {
        "selector": ".crosspost-title",
        "category": "content-block"
      },
      {
        "selector": "div.md[id^=t3_]",
        "category": "content-block"
      },
      {
        "selector": ".pt-md",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "shreddit-comment-action-row",
      "faceplate-hovercard"
    ],
    "isHighDynamic": true
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
    ],
    "selectors": [
      "#search-results-tab-slot",
      "h1",
      ".PostHeader__post-title-line",
      "[data-click-id=body] h3",
      "[data-click-id=background] h3",
      "[data-testid=comment]",
      "[data-adclicklocation='title'] h3",
      "[data-testid='post-title-text']",
      "[data-testid=search-subreddit-desc-text]",
      "[slot=comment]",
      "[data-adclicklocation=media]",
      ".PostContent",
      ".post-content",
      ".Comment__body",
      "faceplate-batch .md",
      "[slot=text-body]",
      "p.title > a",
      "[role=main] .md-container",
      "#-post-rtjson-content",
      ".RichTextJSON-root",
      "[slot='title']",
      ".room-message-text",
      "[source=re_reddit] div > a.text-neutral-content-weak",
      "#response-container",
      "#streaming-response",
      "[noun='recommendation']",
      "#subgrid-container h1, #subgrid-container h2",
      ".i18n-subreddit-description",
      "#response-container_streaming",
      "search-telemetry-tracker > a.text-neutral-content-strong",
      "span[data-testid='guides-title']",
      ".rendererd-rtjson > p",
      "community-recommendation p"
    ],
    "contentSelectors": [
      {
        "selector": "#search-results-tab-slot",
        "category": "content-block"
      },
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": ".PostHeader__post-title-line",
        "category": "content-block"
      },
      {
        "selector": "[data-click-id=body] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-click-id=background] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=comment]",
        "category": "content-block"
      },
      {
        "selector": "[data-adclicklocation='title'] h3",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='post-title-text']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=search-subreddit-desc-text]",
        "category": "content-block"
      },
      {
        "selector": "[slot=comment]",
        "category": "content-block"
      },
      {
        "selector": "[data-adclicklocation=media]",
        "category": "content-block"
      },
      {
        "selector": ".PostContent",
        "category": "content-block"
      },
      {
        "selector": ".post-content",
        "category": "content-block"
      },
      {
        "selector": ".Comment__body",
        "category": "content-block"
      },
      {
        "selector": "faceplate-batch .md",
        "category": "content-block"
      },
      {
        "selector": "[slot=text-body]",
        "category": "content-block"
      },
      {
        "selector": "p.title > a",
        "category": "content-block"
      },
      {
        "selector": "[role=main] .md-container",
        "category": "content-block"
      },
      {
        "selector": "#-post-rtjson-content",
        "category": "content-block"
      },
      {
        "selector": ".RichTextJSON-root",
        "category": "content-block"
      },
      {
        "selector": "[slot='title']",
        "category": "content-block"
      },
      {
        "selector": ".room-message-text",
        "category": "content-block"
      },
      {
        "selector": "[source=re_reddit] div > a.text-neutral-content-weak",
        "category": "content-block"
      },
      {
        "selector": "#response-container",
        "category": "content-block"
      },
      {
        "selector": "#streaming-response",
        "category": "content-block"
      },
      {
        "selector": "[noun='recommendation']",
        "category": "content-block"
      },
      {
        "selector": "#subgrid-container h1, #subgrid-container h2",
        "category": "content-block"
      },
      {
        "selector": ".i18n-subreddit-description",
        "category": "content-block"
      },
      {
        "selector": "#response-container_streaming",
        "category": "content-block"
      },
      {
        "selector": "search-telemetry-tracker > a.text-neutral-content-strong",
        "category": "content-block"
      },
      {
        "selector": "span[data-testid='guides-title']",
        "category": "content-block"
      },
      {
        "selector": ".rendererd-rtjson > p",
        "category": "content-block"
      },
      {
        "selector": "community-recommendation p",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".text-neutral-content-weak"
    ],
    "paragraphMinTextCount": 5,
    "paragraphMinWordCount": 2
  },
  {
    "id": "angel",
    "siteKey": "www.angel.com",
    "matches": [
      "www.angel.com"
    ],
    "excludeSelectors": [
      ".bmpui-subtitle-position-vtt *"
    ],
    "mutationExcludeSelectors": [
      ".bmpui-subtitle-position-vtt *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "reuters",
    "siteKey": "www.reuters.com",
    "matches": [
      "www.reuters.com"
    ],
    "selectors": [
      "[data-testid=MainContent]",
      "[data-testid=ArticleBody]"
    ],
    "contentSelectors": [
      {
        "selector": "[data-testid=MainContent]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=ArticleBody]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[promotext]",
      "[data-testid=Leaderboard]",
      "[data-testid=HomeTickerV2]",
      "[data-testid=SiteFooter]",
      "[class^=refinitiv-promo-bar__container]",
      "[data-testid=ResponsiveAdSlot]"
    ]
  },
  {
    "id": "npmjs",
    "siteKey": "www.npmjs.com",
    "matches": [
      "https://www.npmjs.com/package/*"
    ],
    "selectors": [
      "#tabpanel-readme > div:first-child"
    ],
    "contentSelectors": [
      {
        "selector": "#tabpanel-readme > div:first-child",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      "h1",
      "[aria-label=Issues] .markdown-title",
      "[aria-labelledby=discussions-list] .markdown-title",
      "h3 .markdown-title",
      ".markdown-body",
      ".Layout-sidebar p",
      "div > span.search-match",
      "li.repo-list-item p",
      "#responsive-meta-container p",
      "article p",
      "feed-container article ul li a span",
      "feed-container article .FormControl-caption",
      "div.repo-description p",
      "[itemprop=description]",
      ".integrations-auth-wrapper",
      ".new-feed-onboarding-notice",
      "article section[aria-label='card content'] > div > div > div  > div:nth-child(2)",
      ".js-notice h2, .js-notice p",
      ".TimelineItem-body a span, .TimelineItem-body a div, .TimelineItem-body form span, .TimelineItem-body form div",
      "[role=\"navigation\"] p",
      "[data-testid=\"commit-row-item\"] h4",
      ".font-mktg",
      ".search-title,.search-match",
      ".pinned-item-desc",
      "#repo-content-turbo-frame .markdown-title",
      "[app-name='blackbird-search'] [data-hpc='true']",
      ".topic-box > a > p:nth-of-type(2)",
      "[data-testid=\"listitem-title-link\"]",
      "#repo-content-turbo-frame p",
      "#repo-content-turbo-frame h4",
      "[aria-label=\"card content\"] .flex-column > div:nth-child(2)",
      "[class*=TitleHeader]",
      ".bpDald",
      ".discussion-title",
      ".copilotPreview__footer",
      ".heading-element",
      ".js-feed-item-component h3 a[data-hovercard-type=pull_request]",
      "[aria-labelledby=outline-id] nav",
      "[data-testid='issue-pr-title-link']",
      "div.user-profile-bio",
      "div.news > div.js-notice",
      "#memex-project-view-root a [class^='prc-Text-Text']",
      "[class^=OverviewContent] [class*=DirectoryRichtextContent]",
      "[id^=pullrequestreview]",
      "[class^='ChatMessage']",
      "a[data-hovercard-type='issue']",
      "[class*=prc-FormControl] > [class*=prc-Text], [class*=prc-FormControl] [class*=prc-FormControl-LabelContainer] [class*=prc-Text]",
      "[data-testid='beginners-playlist-section']",
      "[data-testid='getting-started-checklist-section']",
      "[data-testid='docs-section']",
      "[data-testid='recommendations-section']",
      ".Layout-main react-partial pre",
      ".feed-item-content section[data-view-component] [class='flex-1 d-flex flex-column'] div:nth-child(2)",
      "#org-new-form",
      ".trial-info-large",
      ".dfd-trial__container-form",
      "dialog-helper",
      ".blankslate-heading",
      ".activity-overview-box",
      "#spaces-list",
      "[class*='ContentView-module__serviceDescription']",
      ".BannerDescription",
      "copilot-user-settings",
      "h2:has(~ copilot-user-settings)",
      "div:has(~ copilot-user-settings)",
      "[class='f4 color-fg-muted col-md-6 mx-auto']",
      "[class='col-lg-9 position-relative pr-lg-5 mb-6 mr-lg-5']",
      "[class*='IssueIndexPage-module__middlePaneGrid'] div[class='p-4 text-center rounded-2 border color-border-muted']",
      "[class*='ModelsPlaygroundRoute-module__playgroundContainer']",
      "article [class='f6 color-fg-muted mt-1']",
      "bdi"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "[aria-label=Issues] .markdown-title",
        "category": "content-block"
      },
      {
        "selector": "[aria-labelledby=discussions-list] .markdown-title",
        "category": "content-block"
      },
      {
        "selector": "h3 .markdown-title",
        "category": "content-block"
      },
      {
        "selector": ".markdown-body",
        "category": "content-block"
      },
      {
        "selector": ".Layout-sidebar p",
        "category": "content-block"
      },
      {
        "selector": "div > span.search-match",
        "category": "content-block"
      },
      {
        "selector": "li.repo-list-item p",
        "category": "content-block"
      },
      {
        "selector": "#responsive-meta-container p",
        "category": "content-block"
      },
      {
        "selector": "article p",
        "category": "content-block"
      },
      {
        "selector": "feed-container article ul li a span",
        "category": "content-block"
      },
      {
        "selector": "feed-container article .FormControl-caption",
        "category": "content-block"
      },
      {
        "selector": "div.repo-description p",
        "category": "content-block"
      },
      {
        "selector": "[itemprop=description]",
        "category": "content-block"
      },
      {
        "selector": ".integrations-auth-wrapper",
        "category": "content-block"
      },
      {
        "selector": ".new-feed-onboarding-notice",
        "category": "content-block"
      },
      {
        "selector": "article section[aria-label='card content'] > div > div > div  > div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": ".js-notice h2, .js-notice p",
        "category": "content-block"
      },
      {
        "selector": ".TimelineItem-body a span, .TimelineItem-body a div, .TimelineItem-body form span, .TimelineItem-body form div",
        "category": "content-block"
      },
      {
        "selector": "[role=\"navigation\"] p",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=\"commit-row-item\"] h4",
        "category": "content-block"
      },
      {
        "selector": ".font-mktg",
        "category": "content-block"
      },
      {
        "selector": ".search-title,.search-match",
        "category": "content-block"
      },
      {
        "selector": ".pinned-item-desc",
        "category": "content-block"
      },
      {
        "selector": "#repo-content-turbo-frame .markdown-title",
        "category": "content-block"
      },
      {
        "selector": "[app-name='blackbird-search'] [data-hpc='true']",
        "category": "content-block"
      },
      {
        "selector": ".topic-box > a > p:nth-of-type(2)",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=\"listitem-title-link\"]",
        "category": "content-block"
      },
      {
        "selector": "#repo-content-turbo-frame p",
        "category": "content-block"
      },
      {
        "selector": "#repo-content-turbo-frame h4",
        "category": "content-block"
      },
      {
        "selector": "[aria-label=\"card content\"] .flex-column > div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "[class*=TitleHeader]",
        "category": "content-block"
      },
      {
        "selector": ".bpDald",
        "category": "content-block"
      },
      {
        "selector": ".discussion-title",
        "category": "content-block"
      },
      {
        "selector": ".copilotPreview__footer",
        "category": "content-block"
      },
      {
        "selector": ".heading-element",
        "category": "content-block"
      },
      {
        "selector": ".js-feed-item-component h3 a[data-hovercard-type=pull_request]",
        "category": "content-block"
      },
      {
        "selector": "[aria-labelledby=outline-id] nav",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='issue-pr-title-link']",
        "category": "content-block"
      },
      {
        "selector": "div.user-profile-bio",
        "category": "content-block"
      },
      {
        "selector": "div.news > div.js-notice",
        "category": "content-block"
      },
      {
        "selector": "#memex-project-view-root a [class^='prc-Text-Text']",
        "category": "content-block"
      },
      {
        "selector": "[class^=OverviewContent] [class*=DirectoryRichtextContent]",
        "category": "content-block"
      },
      {
        "selector": "[id^=pullrequestreview]",
        "category": "content-block"
      },
      {
        "selector": "[class^='ChatMessage']",
        "category": "content-block"
      },
      {
        "selector": "a[data-hovercard-type='issue']",
        "category": "content-block"
      },
      {
        "selector": "[class*=prc-FormControl] > [class*=prc-Text], [class*=prc-FormControl] [class*=prc-FormControl-LabelContainer] [class*=prc-Text]",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='beginners-playlist-section']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='getting-started-checklist-section']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='docs-section']",
        "category": "content-block"
      },
      {
        "selector": "[data-testid='recommendations-section']",
        "category": "content-block"
      },
      {
        "selector": ".Layout-main react-partial pre",
        "category": "content-block"
      },
      {
        "selector": ".feed-item-content section[data-view-component] [class='flex-1 d-flex flex-column'] div:nth-child(2)",
        "category": "content-block"
      },
      {
        "selector": "#org-new-form",
        "category": "content-block"
      },
      {
        "selector": ".trial-info-large",
        "category": "content-block"
      },
      {
        "selector": ".dfd-trial__container-form",
        "category": "content-block"
      },
      {
        "selector": "dialog-helper",
        "category": "content-block"
      },
      {
        "selector": ".blankslate-heading",
        "category": "content-block"
      },
      {
        "selector": ".activity-overview-box",
        "category": "content-block"
      },
      {
        "selector": "#spaces-list",
        "category": "content-block"
      },
      {
        "selector": "[class*='ContentView-module__serviceDescription']",
        "category": "content-block"
      },
      {
        "selector": ".BannerDescription",
        "category": "content-block"
      },
      {
        "selector": "copilot-user-settings",
        "category": "content-block"
      },
      {
        "selector": "h2:has(~ copilot-user-settings)",
        "category": "content-block"
      },
      {
        "selector": "div:has(~ copilot-user-settings)",
        "category": "content-block"
      },
      {
        "selector": "[class='f4 color-fg-muted col-md-6 mx-auto']",
        "category": "content-block"
      },
      {
        "selector": "[class='col-lg-9 position-relative pr-lg-5 mb-6 mr-lg-5']",
        "category": "content-block"
      },
      {
        "selector": "[class*='IssueIndexPage-module__middlePaneGrid'] div[class='p-4 text-center rounded-2 border color-border-muted']",
        "category": "content-block"
      },
      {
        "selector": "[class*='ModelsPlaygroundRoute-module__playgroundContainer']",
        "category": "content-block"
      },
      {
        "selector": "article [class='f6 color-fg-muted mt-1']",
        "category": "content-block"
      },
      {
        "selector": "bdi",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[data-test-selector='commit-tease-commit-message']",
      "[data-test-selector='create-branch.developmentForm']",
      "div.Box-header.position-relative",
      "div.blob-wrapper-embedded",
      "div.Box.Box--condensed.my-2",
      "div.jp-CodeCell",
      "[aria-label=\"Account\"] .markdown-title",
      ".js-repos-container .markdown-title",
      "a.anchor",
      "div.file-navigation + div.Box",
      "[data-testid^='breadcrumbs']",
      "[data-ga-click*=Star]",
      ".markdown-body h3",
      "div.vcard-names-container",
      "div.js-disable-context-menu",
      ".BorderGrid-cell a[role='link']",
      ".BorderGrid-cell .topic-tag-link",
      "table[class*='Table-module__Box']",
      ".author,.assignee",
      ".blob-code",
      ".timeline-comment-header",
      ".review-thread-reply",
      ".codeRepository",
      "a[data-hovercard-type]",
      "[title='Label: Private']",
      "[aria-label*='language']",
      ".js-suggested-changes-blob.diff-view",
      "h1[data-component=PH_Title] span[class*='issueNumberText']"
    ],
    "mutationExcludeSelectors": [
      ".react-blob-sticky-header *"
    ],
    "injectedCss": [
      ".bpDald,.discussion-title {-webkit-line-clamp:unset!important;}",
      "li>div[class*='Box-sc'],div[class*='Box-sc']>button[class*='prc-Token-TokenBase'],li[class*='card-label-module']>button[class*='prc-Token-TokenBase'] {height:unset!important;}",
      "#memex-project-view-root [class*=table-row__StyledTableRow-sc],#memex-project-view-root [class*=base-cell-module__Box] {height:unset!important;}",
      "[class*='GridCard-module__description'] {-webkit-line-clamp: unset;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "github-blog",
    "siteKey": "github.blog",
    "matches": [
      "github.blog"
    ],
    "injectedCss": [
      "font {word-break: break-all !important;}"
    ]
  },
  {
    "id": "rmit",
    "siteKey": "www.rmit.edu.au",
    "matches": [
      "www.rmit.edu.au"
    ],
    "injectedCss": [
      ".colfeature-content{height:unset!important;}"
    ]
  },
  {
    "id": "youtubeMobile",
    "siteKey": "m.youtube.com",
    "matches": [
      "m.youtube.com"
    ],
    "selectors": [
      ".comment-text",
      "#content-text",
      ".media-item-headline",
      ".slim-video-information-title",
      ".yt-spec-button-view-model",
      ".yt-core-attributed-string > span",
      ".yt-core-attributed-string",
      ".shortsLockupViewModelHostMetadataTitle",
      ".YtmCommentRendererText",
      ".ytAttributedStringHost",
      ".title",
      ".caption-visual-line"
    ],
    "contentSelectors": [
      {
        "selector": ".comment-text",
        "category": "content-block"
      },
      {
        "selector": "#content-text",
        "category": "content-block"
      },
      {
        "selector": ".media-item-headline",
        "category": "content-block"
      },
      {
        "selector": ".slim-video-information-title",
        "category": "content-block"
      },
      {
        "selector": ".yt-spec-button-view-model",
        "category": "content-block"
      },
      {
        "selector": ".yt-core-attributed-string > span",
        "category": "content-block"
      },
      {
        "selector": ".yt-core-attributed-string",
        "category": "content-block"
      },
      {
        "selector": ".shortsLockupViewModelHostMetadataTitle",
        "category": "content-block"
      },
      {
        "selector": ".YtmCommentRendererText",
        "category": "content-block"
      },
      {
        "selector": ".ytAttributedStringHost",
        "category": "content-block"
      },
      {
        "selector": ".title",
        "category": "content-block"
      },
      {
        "selector": ".caption-visual-line",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ytm-badge-and-byline-item-byline",
      ".ytp-caption-window-container",
      "text",
      ".imt-caption-container",
      "ytd-live-chat-frame"
    ],
    "mutationExcludeSelectors": [
      ".imt-caption-container *"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper img { width: 16px; height: 16px }",
      ".shortsLockupViewModelHostMetadataTitle,h4.compact-media-item-headline {max-height:unset !important;line-clamp:unset !important;overflow:unset !important;-webkit-line-clamp:unset !important;}",
      ".comment-text {max-height:unset;}",
      ".details,.subhead,.video-card-title,.media-item-headline {max-height:unset!important;-webkit-line-clamp:unset!important;}",
      "truncated-text-content {max-height: unset !important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "twitch",
    "siteKey": "www.twitch.tv",
    "matches": [
      "www.twitch.tv"
    ],
    "excludeSelectors": [
      ".persistent-player",
      ".chat-line__username-container",
      ".chat-line__no-background span[aria-hidden=true]",
      "[data-a-target=animated-channel-viewers-count],.live-time"
    ]
  },
  {
    "id": "youtube",
    "siteKey": "www.youtube.com",
    "matches": [
      "www.youtube.com"
    ],
    "selectors": [
      "yt-formatted-string[slot=content].ytd-comment-renderer",
      "yt-formatted-string.ytd-video-renderer",
      "yt-formatted-string#content-text",
      "h1",
      "yt-formatted-string#video-title",
      ".ytLockupMetadataViewModelTitle,.shortsLockupViewModelHostOutsideMetadataTitle",
      "yt-formatted-string.span",
      "span#video-title",
      "a#video-title",
      "yt-formatted-string.ytd-transcript-segment-renderer",
      "#description-inline-expander > yt-attributed-string > span",
      "yt-attributed-string > span",
      "yt-formatted-string > span",
      "ytd-notification-renderer .message",
      "#message",
      ".yt_to_text_transcript_text",
      "video-summary-content-view-model",
      ".yt-core-attributed-string",
      "#title",
      ".product-item-title",
      ".product-item-price",
      "#commentCanvas .cmt",
      ".ytwTranscriptSegmentViewModelHost",
      ".caption-visual-line"
    ],
    "contentSelectors": [
      {
        "selector": "yt-formatted-string[slot=content].ytd-comment-renderer",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string.ytd-video-renderer",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string#content-text",
        "category": "content-block"
      },
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string#video-title",
        "category": "content-block"
      },
      {
        "selector": ".ytLockupMetadataViewModelTitle,.shortsLockupViewModelHostOutsideMetadataTitle",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string.span",
        "category": "content-block"
      },
      {
        "selector": "span#video-title",
        "category": "content-block"
      },
      {
        "selector": "a#video-title",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string.ytd-transcript-segment-renderer",
        "category": "content-block"
      },
      {
        "selector": "#description-inline-expander > yt-attributed-string > span",
        "category": "content-block"
      },
      {
        "selector": "yt-attributed-string > span",
        "category": "content-block"
      },
      {
        "selector": "yt-formatted-string > span",
        "category": "content-block"
      },
      {
        "selector": "ytd-notification-renderer .message",
        "category": "content-block"
      },
      {
        "selector": "#message",
        "category": "content-block"
      },
      {
        "selector": ".yt_to_text_transcript_text",
        "category": "content-block"
      },
      {
        "selector": "video-summary-content-view-model",
        "category": "content-block"
      },
      {
        "selector": ".yt-core-attributed-string",
        "category": "content-block"
      },
      {
        "selector": "#title",
        "category": "content-block"
      },
      {
        "selector": ".product-item-title",
        "category": "content-block"
      },
      {
        "selector": ".product-item-price",
        "category": "content-block"
      },
      {
        "selector": "#commentCanvas .cmt",
        "category": "content-block"
      },
      {
        "selector": ".ytwTranscriptSegmentViewModelHost",
        "category": "content-block"
      },
      {
        "selector": ".caption-visual-line",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ytp-caption-window-container",
      "text",
      ".imt-caption-container",
      "ytd-button-renderer",
      ".ytp-sfn-content div :last-child",
      "ytd-live-chat-frame",
      "yt-button-shape",
      "ytd-comments-header-renderer",
      "yt-content-metadata-view-model",
      "yt-description-preview-view-model button",
      ".yt-page-header-view-model__page-header-title"
    ],
    "mutationExcludeSelectors": [
      ".imt-caption-container *"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper img { width: 16px; height: 16px }",
      ".metadata-snippet-container {max-height: unset !important;}",
      ".immersive-translate-target-wrapper {text-align: left;}",
      ".immersive-translate-target-wrapper[dir=rtl] {text-align: right;}",
      "#commentCanvas .cmt {display:flex;flex-direction: column;}",
      "#commentCanvas .cmt font br {display: none;}",
      "#video-title,h1.ytd-watch-metadata,.ytd-video-renderer,.yt-lockup-metadata-view-model-wiz__title {-webkit-line-clamp: unset !important;max-height: unset !important;}",
      "yt-formatted-string#video-title,.ShortsLockupViewModelHostOutsideMetadataTitle {-webkit-line-clamp: unset !important;max-height: unset !important;}",
      "ytd-expander.ytd-comment-renderer {--ytd-expander-max-lines: 1000;}",
      ".page-header-view-model-wiz__page-header-title--page-header-title-large {-webkit-line-clamp: unset !important;max-height: unset !important;}",
      "#title,#video-title,.yt-lockup-metadata-view-model__title,.ytLockupMetadataViewModelTitle,.shortsLockupViewModelHostOutsideMetadataTitle,h1.ytd-watch-metadata,.ytwFeedAdMetadataViewModelHostTextsStyleStandardHeadline {-webkit-line-clamp: unset !important;max-height: unset !important;}"
    ],
    "blockMinTextCount": 0,
    "blockMinWordCount": 0,
    "isHighDynamic": true
  },
  {
    "id": "youtubekids",
    "siteKey": "www.youtubekids.com",
    "matches": [
      "www.youtubekids.com"
    ],
    "blockMinTextCount": 0,
    "blockMinWordCount": 0,
    "isHighDynamic": true
  },
  {
    "id": "instagramMessage",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/direct/*"
    ],
    "selectors": [
      "div[dir=auto].html-div"
    ],
    "contentSelectors": [
      {
        "selector": "div[dir=auto].html-div",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "instagramPost",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/p/*",
      "https://www.instagram.com/reels/*"
    ],
    "selectors": [
      "h1",
      "ul li h3+div span[dir=auto]",
      "hr+div span[dir=auto][style]",
      "div > div[dir=auto]",
      "div:not([class]) > div > div:nth-child(2)"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "ul li h3+div span[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "hr+div span[dir=auto][style]",
        "category": "content-block"
      },
      {
        "selector": "div > div[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "div:not([class]) > div > div:nth-child(2)",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "hr+div span[dir=auto][style] > span"
    ],
    "injectedCss": [
      "article ._aagw {position:unset !important;}"
    ],
    "paragraphMinTextCount": 2,
    "blockMinTextCount": 1
  },
  {
    "id": "otherInstagram",
    "siteKey": "www.instagram.com",
    "matches": [
      "https://www.instagram.com/*"
    ],
    "excludeMatches": [
      "https://www.instagram.com/b/*"
    ],
    "selectors": [
      "h1",
      "article span[dir=auto] > span[dir=auto]",
      "._ab1y",
      "ul li h3+div span[dir=auto]",
      "hr+div span[dir=auto][style]",
      "span[dir=auto] > div > span",
      "div > h1[dir=auto]",
      ".x1fkh5qu.x1ddbhtg.x1dlrdel",
      "a[href*='explore/locations/']"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "article span[dir=auto] > span[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "._ab1y",
        "category": "content-block"
      },
      {
        "selector": "ul li h3+div span[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": "hr+div span[dir=auto][style]",
        "category": "content-block"
      },
      {
        "selector": "span[dir=auto] > div > span",
        "category": "content-block"
      },
      {
        "selector": "div > h1[dir=auto]",
        "category": "content-block"
      },
      {
        "selector": ".x1fkh5qu.x1ddbhtg.x1dlrdel",
        "category": "content-block"
      },
      {
        "selector": "a[href*='explore/locations/']",
        "category": "content-block"
      }
    ],
    "paragraphMinTextCount": 2,
    "blockMinWordCount": 1
  },
  {
    "id": "1paragraph",
    "siteKey": "1paragraph.app",
    "matches": [
      "1paragraph.app"
    ],
    "selectors": [
      "#book"
    ],
    "contentSelectors": [
      {
        "selector": "#book",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "poeditor",
    "siteKey": "poeditor.com",
    "matches": [
      "https://poeditor.com/projects/*"
    ],
    "selectors": [
      ".comment-body",
      ".reference_language .source-string"
    ],
    "contentSelectors": [
      {
        "selector": ".comment-body",
        "category": "content-block"
      },
      {
        "selector": ".reference_language .source-string",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      ".reader2-post-title",
      ".tweet-link-top",
      ".tweet-link-bottom",
      ".expanded-link"
    ],
    "contentSelectors": [
      {
        "selector": ".reader2-post-title",
        "category": "content-block"
      },
      {
        "selector": ".tweet-link-top",
        "category": "content-block"
      },
      {
        "selector": ".tweet-link-bottom",
        "category": "content-block"
      },
      {
        "selector": ".expanded-link",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".publication-footer",
      ".subscribe-footer",
      ".main-menu",
      ".navbar-title-link",
      "[data-testid='navbar']",
      ".navbar-title",
      ".captioned-button-wrap",
      ".subscription-widget-wrap",
      ".tweet-header",
      ".tweet-link-bottom",
      ".expanded-link",
      ".meta-subheader",
      ".comment-meta",
      ".comment-actions"
    ],
    "isHighDynamic": true
  },
  {
    "id": "seekingalpha",
    "siteKey": "seekingalpha.com",
    "matches": [
      "seekingalpha.com/article/*",
      "seekingalpha.com/news/*"
    ],
    "selectors": [
      "[data-test-id=card-container]",
      "[data-test-id=comments-section]"
    ],
    "contentSelectors": [
      {
        "selector": "[data-test-id=card-container]",
        "category": "content-block"
      },
      {
        "selector": "[data-test-id=comments-section]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[data-test-id=post-page-meta]",
      "header > div:first-child"
    ]
  },
  {
    "id": "hnAlgolia",
    "siteKey": "hn.algolia.com",
    "matches": [
      "hn.algolia.com"
    ],
    "selectors": [
      ".Story_title > a:first-child",
      ".Story_comment > span"
    ],
    "contentSelectors": [
      {
        "selector": ".Story_title > a:first-child",
        "category": "content-block"
      },
      {
        "selector": ".Story_comment > span",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "readwise",
    "siteKey": "read.readwise.io",
    "matches": [
      "read.readwise.io"
    ],
    "selectors": [
      "div[class^='_titleRow_']",
      "#document-text-content"
    ],
    "contentSelectors": [
      {
        "selector": "div[class^='_titleRow_']",
        "category": "content-block"
      },
      {
        "selector": "#document-text-content",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      ".article_header_title",
      ".article_title_link",
      ".article_content",
      ".article_magazine_title_link",
      ".blog-post-page",
      "#welcome_center",
      ".gad_overview_articles_wrapper",
      ".library_article_text h4",
      ".header_name",
      ".blog-content"
    ],
    "contentSelectors": [
      {
        "selector": ".article_header_title",
        "category": "content-block"
      },
      {
        "selector": ".article_title_link",
        "category": "content-block"
      },
      {
        "selector": ".article_content",
        "category": "content-block"
      },
      {
        "selector": ".article_magazine_title_link",
        "category": "content-block"
      },
      {
        "selector": ".blog-post-page",
        "category": "content-block"
      },
      {
        "selector": "#welcome_center",
        "category": "content-block"
      },
      {
        "selector": ".gad_overview_articles_wrapper",
        "category": "content-block"
      },
      {
        "selector": ".library_article_text h4",
        "category": "content-block"
      },
      {
        "selector": ".header_name",
        "category": "content-block"
      },
      {
        "selector": ".blog-content",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      ".article_title_link,.library_article_text h4,.gadget_overview_article_title,.article_magazine_title_link,.reader_pane_view_style_2 .column_view_title {-webkit-line-clamp: unset!important;max-height: unset!important;}",
      ".article_tile_content_wraper,div.article_tile {overflow:auto}",
      ".article_header_title {white-space:normal;max-height: unset!important;}",
      ".article_header_title span {display:flex !important;flex-direction: column;}",
      ".ar.article_no_thumbnail,[data-type=article] {height:unset!important;}",
      ".view_style_2 #reader_pane .ar .article_header_text .column_view_info {position:relative!important;}"
    ]
  },
  {
    "id": "aha",
    "siteKey": "ideas.aha.io",
    "matches": [
      "*.ideas.aha.io"
    ],
    "excludeSelectors": [
      ".comment-header",
      ".vote-status",
      ".idea-meta",
      ".filters-title",
      ".ideas-showing-count",
      ".my-ideas-filters-wrapper",
      ".statuses-filters-wrapper",
      ".categories-filters-wrapper",
      "[class^='attachment']",
      "span[class^='attachment-name']"
    ]
  },
  {
    "id": "googleScholar",
    "siteKey": "scholar.google.*",
    "matches": [
      "scholar.google.*/*",
      "scholar.google.com.*/*",
      "scholar.google.co.*/*"
    ],
    "selectors": [
      "h3 a[data-clk]",
      "div.gs_rs",
      "td a.gsc_a_at",
      "td div.gs_gray:last-of-type",
      "div.gsc_oci_value",
      "#gs_opinion",
      ".gs_rt",
      ".gsh_csp",
      ".gs_fma_wpr",
      "#gs_as_hp_main"
    ],
    "contentSelectors": [
      {
        "selector": "h3 a[data-clk]",
        "category": "content-block"
      },
      {
        "selector": "div.gs_rs",
        "category": "content-block"
      },
      {
        "selector": "td a.gsc_a_at",
        "category": "content-block"
      },
      {
        "selector": "td div.gs_gray:last-of-type",
        "category": "content-block"
      },
      {
        "selector": "div.gsc_oci_value",
        "category": "content-block"
      },
      {
        "selector": "#gs_opinion",
        "category": "content-block"
      },
      {
        "selector": ".gs_rt",
        "category": "content-block"
      },
      {
        "selector": ".gsh_csp",
        "category": "content-block"
      },
      {
        "selector": ".gs_fma_wpr",
        "category": "content-block"
      },
      {
        "selector": "#gs_as_hp_main",
        "category": "content-block"
      }
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
    ],
    "excludeSelectors": [
      ".EyERq",
      ".AOl7G.eejsDc",
      "[aria-label='Home']",
      "[aria-label='For you']",
      "[aria-label='Following']",
      "[aria-label='World']",
      "[aria-label='Local']",
      ".gb_Fc",
      ".wBQf7b",
      ".yPI8Rb",
      ".jKHa4e",
      ".u43Gd",
      ".Zgjpyb",
      "[role='button']",
      "[jsname='rymPhb']",
      ".cbz1ld",
      ".VfPpkd-P5QLlc",
      ".XvhY1d",
      "time",
      ".bInasb"
    ],
    "injectedCss": [
      ".oovtQ,.MCAGUe,.To2ZZb.DbQnIe {height: unset;}",
      "h4,.IBr9hb,.gPFEn{-webkit-line-clamp: unset!important;}",
      ".cp7Yvc > h2 {display: block;}"
    ],
    "blockMinTextCount": 26,
    "blockMinWordCount": 5
  },
  {
    "id": "outlook",
    "siteKey": "outlook.live.com",
    "matches": [
      "outlook.live.com"
    ],
    "excludeSelectors": [
      ".jHAG3.XG5Jd",
      ".OZZZK",
      ".lDdSm",
      ".ZfoST.VlT6S.azUpZ",
      ".GssDD,.xpAva,.oHwUF,.D1eg_",
      "[id=CenterRegion]",
      "[id=RibbonRoot]",
      "[role=toolbar]",
      ".qQbyL,.bkYAr,.gpJ9q,.threeColumnCirclePersonaDivWidth",
      "[class='_rWRU Ejrkd qq2gS D8iyG']"
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
    ],
    "excludeSelectors": [
      ".styles_extraInfo__Xs_5Y",
      "[data-test=\"show-more-shoutouts-button\"]",
      ".styles_buttons__kKy_S",
      ".styles_count___6_8F"
    ]
  },
  {
    "id": "discord",
    "siteKey": "discord.com",
    "matches": [
      "https://discord.com/channels/*"
    ],
    "selectors": [
      "li[id^=chat-messages] div[id^=message-content]",
      "div[class^=headerText]",
      "section[aria-label='Search Results'] div[id^=message-content]",
      "div[class^=messagesPopout]",
      "[class^='embedTitle']",
      "[class^='embedDescription']",
      "[class^='promptContent']",
      "li[class^='container'] > div[class^='header']",
      "[class^='embedFieldValue']",
      "li[class^='card'] div[class^='message']",
      "[data-list-item-id^='forum-channel-list'] div[class^='headerText']"
    ],
    "contentSelectors": [
      {
        "selector": "li[id^=chat-messages] div[id^=message-content]",
        "category": "content-block"
      },
      {
        "selector": "div[class^=headerText]",
        "category": "content-block"
      },
      {
        "selector": "section[aria-label='Search Results'] div[id^=message-content]",
        "category": "content-block"
      },
      {
        "selector": "div[class^=messagesPopout]",
        "category": "content-block"
      },
      {
        "selector": "[class^='embedTitle']",
        "category": "content-block"
      },
      {
        "selector": "[class^='embedDescription']",
        "category": "content-block"
      },
      {
        "selector": "[class^='promptContent']",
        "category": "content-block"
      },
      {
        "selector": "li[class^='container'] > div[class^='header']",
        "category": "content-block"
      },
      {
        "selector": "[class^='embedFieldValue']",
        "category": "content-block"
      },
      {
        "selector": "li[class^='card'] div[class^='message']",
        "category": "content-block"
      },
      {
        "selector": "[data-list-item-id^='forum-channel-list'] div[class^='headerText']",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[class*='username']",
      "[class*='repliedMessage']"
    ],
    "injectedCss": [
      "main div[class^=headerText],main div[class^=message],main div[class^=text] {max-height: unset;}",
      "h3[data-text-variant='heading-lg/semibold'] {-webkit-line-clamp: unset;line-height: unset;}",
      "[class*='guildDetails'] > [class*='description'] {-webkit-line-clamp: unset;}"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2,
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "telegram",
    "siteKey": "web.telegram.org",
    "matches": [
      "web.telegram.org/z/*",
      "web.telegram.org/a/*",
      "web.telegram.org/k/*",
      "web.telegram.org/k/"
    ],
    "selectors": [
      ".text-content",
      ".message",
      ".reply-markup-button-text",
      ".bot-commands-list-element-description",
      "[class*='tabs-tab page-password active']",
      "#auth-qr-form",
      ".message.spoilers-container em",
      ".message.spoilers-container strong"
    ],
    "contentSelectors": [
      {
        "selector": ".text-content",
        "category": "content-block"
      },
      {
        "selector": ".message",
        "category": "content-block"
      },
      {
        "selector": ".reply-markup-button-text",
        "category": "content-block"
      },
      {
        "selector": ".bot-commands-list-element-description",
        "category": "content-block"
      },
      {
        "selector": "[class*='tabs-tab page-password active']",
        "category": "content-block"
      },
      {
        "selector": "#auth-qr-form",
        "category": "content-block"
      },
      {
        "selector": ".message.spoilers-container em",
        "category": "content-block"
      },
      {
        "selector": ".message.spoilers-container strong",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".time",
      ".peer-title",
      ".document-wrapper",
      ".message.spoilers-container custom-emoji-element"
    ],
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "githubGist",
    "siteKey": "gist.github.com",
    "matches": [
      "gist.github.com"
    ],
    "selectors": [
      ".markdown-body",
      ".readme"
    ],
    "contentSelectors": [
      {
        "selector": ".markdown-body",
        "category": "content-block"
      },
      {
        "selector": ".readme",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      ".u-repost-of",
      ".comment_text",
      ".story_text"
    ],
    "contentSelectors": [
      {
        "selector": ".u-repost-of",
        "category": "content-block"
      },
      {
        "selector": ".comment_text",
        "category": "content-block"
      },
      {
        "selector": ".story_text",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "slack",
    "siteKey": "slack.com",
    "matches": [
      "*.slack.com"
    ],
    "selectors": [
      ".p-rich_text_block",
      ".p-message_pane__foreword",
      ".c-alert__message",
      "[data-qa=message_attachment_text]"
    ],
    "contentSelectors": [
      {
        "selector": ".p-rich_text_block",
        "category": "content-block"
      },
      {
        "selector": ".p-message_pane__foreword",
        "category": "content-block"
      },
      {
        "selector": ".c-alert__message",
        "category": "content-block"
      },
      {
        "selector": "[data-qa=message_attachment_text]",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "artstationArtwork",
    "siteKey": "www.artstation.com",
    "matches": [
      "www.artstation.com/artwork/*"
    ],
    "selectors": [
      ".project-description",
      "div.project-comment-text",
      ".asset-caption"
    ],
    "contentSelectors": [
      {
        "selector": ".project-description",
        "category": "content-block"
      },
      {
        "selector": "div.project-comment-text",
        "category": "content-block"
      },
      {
        "selector": ".asset-caption",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".project-description a"
    ]
  },
  {
    "id": "artstationLearning",
    "siteKey": "www.artstation.com",
    "matches": [
      "www.artstation.com/learning/courses/*"
    ],
    "selectors": [
      "footer.learning-course-description.ng-star-inserted > span"
    ],
    "contentSelectors": [
      {
        "selector": "footer.learning-course-description.ng-star-inserted > span",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".learning-card-meta",
      ".vjs-text-track-display",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "artstationBlog",
    "siteKey": "www.artstation.com",
    "matches": [
      "https://www.artstation.com/blogs",
      "https://www.artstation.com/blogs/*"
    ],
    "selectors": [
      ".author-headline",
      ".author-location",
      ".comment-item-body"
    ],
    "contentSelectors": [
      {
        "selector": ".author-headline",
        "category": "content-block"
      },
      {
        "selector": ".author-location",
        "category": "content-block"
      },
      {
        "selector": ".comment-item-body",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "blog-card-thumbnail",
      "blog-card-header",
      ".blog-card-author",
      ".blog-card-meta",
      ".blog-view-header",
      ".blog-grid-title",
      ".post-meta-header"
    ]
  },
  {
    "id": "figmaCommunity",
    "siteKey": "www.figma.com",
    "matches": [
      "www.figma.com/community/*"
    ],
    "selectors": [
      "div[class*='mini_cardBottomRow_Metadata']"
    ],
    "contentSelectors": [
      {
        "selector": "div[class*='mini_cardBottomRow_Metadata']",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "div[class*='metadataRight']",
      "div[class*='commentMetaAndOptions']"
    ]
  },
  {
    "id": "googleIndex",
    "siteKey": "www.google.com",
    "matches": [
      "https://www.google.com/",
      "https://www.google.com.hk/"
    ],
    "excludeSelectors": [
      "#gb",
      "#SIvCob"
    ]
  },
  {
    "id": "googleSearch",
    "siteKey": "www.google.*",
    "matches": [
      "www.google.*/search*"
    ],
    "selectors": [
      ".MUFPAc",
      "[role=heading]"
    ],
    "contentSelectors": [
      {
        "selector": ".MUFPAc",
        "category": "content-block"
      },
      {
        "selector": "[role=heading]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "a h3 + div",
      "div#sfooter",
      ".b5ZQcf",
      ".CEMjEf",
      ".MgUUmf.NUnG9d",
      "#result-stats",
      "[role=navigation]",
      "div.sCuL3",
      "div.eFM0qc.BCF2pd",
      "div.WZ8Tjf",
      "div.adDDi",
      "#headerSection",
      "#rateChatDiv",
      ".title-D5Lgyj",
      "[data-attrid='VisualDigestVideoResult']",
      ".search-enhance-WDIEkP h4",
      ".SPZz6b h2",
      ".CtCigf",
      ".VLkRKc",
      ".EbH0bb",
      ".Wr0c6d",
      ".jleFbf",
      "#searchform",
      ".yg51vc",
      ".CbAZb",
      ".B6fmyf.byrV5b.Mg1HEd",
      "[class='SPa6uf Hqu6dd OSrXXb']",
      "[class='ZtihLe YrbPuc']",
      "[class='kb0PBd A9Y9g'] .TXwUJf,[class='kb0PBd cvP2Ce'] .TXwUJf",
      "[class='wep10b vDF3Oc jIrdcd'],[class='gqF9jc YrbPuc']",
      "span[data-ts]",
      "[jscontroller='UsftYd']"
    ],
    "injectedCss": [
      ".V82bz,.uAKcGb,.F0FGWb,.Hdw6tb,.M1Sizc,.XVPTd,.Yt787.JGD2rd,.ITZIwc {-webkit-line-clamp: unset!important;max-height: unset!important;}",
      ".pe7FNb {-webkit-line-clamp: unset!important;}",
      ".promotion-3PDMAb {display: none!important;}",
      "div[data-content-feature='1'] > div {-webkit-line-clamp: unset!important;max-height: unset!important;}",
      "div[style='-webkit-line-clamp:*'] {-webkit-line-clamp: unset!important;max-height: unset!important;}",
      ".Pw4Ldf.RsCEN {height:unset!important;}",
      ".related-question-pair {overflow:auto!important;}"
    ],
    "blockMinTextCount": 32,
    "blockMinWordCount": 3
  },
  {
    "id": "lowendtalk",
    "siteKey": "lowendtalk.com",
    "matches": [
      "lowendtalk.com"
    ],
    "selectors": [
      "[role=heading]",
      "h1",
      ".userContent",
      ".DismissMessage",
      ".PanelColumn",
      ".Meta-Discussion"
    ],
    "contentSelectors": [
      {
        "selector": "[role=heading]",
        "category": "content-block"
      },
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": ".userContent",
        "category": "content-block"
      },
      {
        "selector": ".DismissMessage",
        "category": "content-block"
      },
      {
        "selector": ".PanelColumn",
        "category": "content-block"
      },
      {
        "selector": ".Meta-Discussion",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ClearFix .Count"
    ]
  },
  {
    "id": "linkedinFeed",
    "siteKey": "linkedin.com",
    "matches": [
      "https://linkedin.com/feed/*"
    ],
    "selectors": [
      "h1",
      ".feed-shared-update-v2__description-wrapper"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": ".feed-shared-update-v2__description-wrapper",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "indiehackers",
    "siteKey": "www.indiehackers.com",
    "matches": [
      "www.indiehackers.com"
    ],
    "excludeSelectors": [
      ".portal-entry__date",
      ".portal-entry__byline",
      ".firestore-post__header-metadata",
      ".story__counts",
      ".story__time-ago",
      ".story__byline",
      ".partnerships__age",
      ".job__pay",
      ".author-bio__name-link",
      ".comment__footer"
    ],
    "injectedCss": [
      ".meetups__meetup-name,.partnerships__title { -webkit-line-clamp: unset!important;max-height: unset!important; }"
    ]
  },
  {
    "id": "deepwiki",
    "siteKey": "deepwiki.com",
    "matches": [
      "deepwiki.com"
    ],
    "excludeSelectors": [
      "[class*='flex items-center break-all rounded-l px-2 py-1.5 bg-[#e5e5e5] text-[#333333] dark:bg-[#252525] dark:text-[#e4e4e4] rounded-r']",
      "[class*='mb-1 mr-1 inline-flex items-stretch font-mono text-xs !no-underline transition-opacity hover:opacity-75']"
    ]
  },
  {
    "id": "libreddit",
    "siteKey": "libreddit.de",
    "matches": [
      "libreddit.de"
    ],
    "selectors": [
      "h2.post_title",
      ".comment_body > .md"
    ],
    "contentSelectors": [
      {
        "selector": "h2.post_title",
        "category": "content-block"
      },
      {
        "selector": ".comment_body > .md",
        "category": "content-block"
      }
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
    ],
    "excludeSelectors": [
      ".notion-code-block"
    ],
    "injectedCss": [
      "[aria-label='Templates'] font br {display:none;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "newyorker",
    "siteKey": "www.newyorker.com",
    "matches": [
      "www.newyorker.com"
    ],
    "selectors": [
      "h1",
      "[data-testid=SummaryItemHed]"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=SummaryItemHed]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[data-testid=PersistentTop]",
      "[data-testid=StackedNavigationHeader]"
    ],
    "isHighDynamic": true
  },
  {
    "id": "typora",
    "siteKey": "typora.io",
    "matches": [
      "typora.io"
    ],
    "excludeSelectors": [
      ".tab-slider--nav"
    ]
  },
  {
    "id": "startme",
    "siteKey": "start.me",
    "matches": [
      "start.me"
    ],
    "selectors": [
      ".rss-article__title",
      ".rss-articles-list__article-link",
      ".rss-showcase__title",
      ".rss-showcase__text"
    ],
    "contentSelectors": [
      {
        "selector": ".rss-article__title",
        "category": "content-block"
      },
      {
        "selector": ".rss-articles-list__article-link",
        "category": "content-block"
      },
      {
        "selector": ".rss-showcase__title",
        "category": "content-block"
      },
      {
        "selector": ".rss-showcase__text",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "scmp",
    "siteKey": "www.scmp.com",
    "matches": [
      "www.scmp.com"
    ],
    "selectors": [
      ".info__subHeadline",
      ".section-content h2",
      "[data-qa='ArticleList-Item']",
      "[data-qa='GenericArticle-Content']"
    ],
    "contentSelectors": [
      {
        "selector": ".info__subHeadline",
        "category": "content-block"
      },
      {
        "selector": ".section-content h2",
        "category": "content-block"
      },
      {
        "selector": "[data-qa='ArticleList-Item']",
        "category": "content-block"
      },
      {
        "selector": "[data-qa='GenericArticle-Content']",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "lesswrong",
    "siteKey": "www.lesswrong.com",
    "matches": [
      "www.lesswrong.com"
    ],
    "selectors": [
      "span.commentOnSelection"
    ],
    "contentSelectors": [
      {
        "selector": "span.commentOnSelection",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".PostsPagePostHeader-authorAndSecondaryInfo",
      ".Answer-answerHeader",
      "time",
      ".CommentsItemMeta-root",
      ".CommentsListMeta-root",
      ".CommentsTableOfContents-tocPostedAt",
      ".CommentsTableOfContents-commentAuthor",
      ".CommentBottom-bottom"
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
    ],
    "selectors": [
      "div.status__content__text",
      ".about__section__body",
      ".content",
      ".form-container",
      ".account__header__extra"
    ],
    "contentSelectors": [
      {
        "selector": "div.status__content__text",
        "category": "content-block"
      },
      {
        "selector": ".about__section__body",
        "category": "content-block"
      },
      {
        "selector": ".content",
        "category": "content-block"
      },
      {
        "selector": ".form-container",
        "category": "content-block"
      },
      {
        "selector": ".account__header__extra",
        "category": "content-block"
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "cnbc",
    "siteKey": "www.cnbc.com",
    "matches": [
      "www.cnbc.com"
    ],
    "excludeSelectors": [
      "#GlobalNavigation",
      "#GlobalFooter",
      ".LiveBlogHeader-timestampAndShareBarContainer",
      ".LiveBlogHeader-liveUpdatesPill",
      ".QuoteInBody-inlineButton"
    ],
    "isHighDynamic": true
  },
  {
    "id": "dailyDev",
    "siteKey": "app.daily.dev",
    "matches": [
      "app.daily.dev"
    ],
    "selectors": [
      "h1",
      ".typo-body",
      "article h3",
      "[class^=markdown_markdown]"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": ".typo-body",
        "category": "content-block"
      },
      {
        "selector": "article h3",
        "category": "content-block"
      },
      {
        "selector": "[class^=markdown_markdown]",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      ".trendingNow",
      ".searchItem",
      ".tagcloud > a"
    ],
    "contentSelectors": [
      {
        "selector": ".trendingNow",
        "category": "content-block"
      },
      {
        "selector": ".searchItem",
        "category": "content-block"
      },
      {
        "selector": ".tagcloud > a",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "yourporn",
    "siteKey": "www.youporn.com",
    "matches": [
      "https://www.youporn.com/*"
    ],
    "selectors": [
      ".button"
    ],
    "contentSelectors": [
      {
        "selector": ".button",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "xvideos",
    "siteKey": "www.xvideos.com",
    "matches": [
      "https://www.xvideos.com/*"
    ],
    "excludeSelectors": [
      ".video-hd-mark"
    ]
  },
  {
    "id": "missav",
    "siteKey": "missav.*",
    "matches": [
      "https://missav.*/*"
    ],
    "excludeSelectors": [
      ".leading-normal",
      "[class='absolute bottom-1 right-1 rounded-lg px-2 py-1 text-xs text-nord5 bg-gray-800 bg-opacity-75']",
      "[class='absolute bottom-1 left-1 rounded-lg px-2 py-1 text-xs text-nord5 bg-blue-800 bg-opacity-75']"
    ]
  },
  {
    "id": "javbus",
    "siteKey": "www.javbus.com",
    "matches": [
      "https://www.javbus.com/*"
    ],
    "excludeSelectors": [
      ".item-tag",
      "date"
    ]
  },
  {
    "id": "spankbang",
    "siteKey": "spankbang.com",
    "matches": [
      "https://spankbang.com/*"
    ],
    "selectors": [
      ".searches > a",
      ".tag > a",
      ".extra > a",
      ".positions > li"
    ],
    "contentSelectors": [
      {
        "selector": ".searches > a",
        "category": "content-block"
      },
      {
        "selector": ".tag > a",
        "category": "content-block"
      },
      {
        "selector": ".extra > a",
        "category": "content-block"
      },
      {
        "selector": ".positions > li",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".stats",
      ".thumb"
    ]
  },
  {
    "id": "javdb",
    "siteKey": "javdb*.com",
    "matches": [
      "https://javdb*.com/*"
    ],
    "excludeSelectors": [
      ".video-number",
      ".score",
      ".has-addons"
    ]
  },
  {
    "id": "netflav",
    "siteKey": "netflav*.com",
    "matches": [
      "https://netflav*.com/*"
    ],
    "selectors": [
      ".genre_filter_item",
      "button"
    ],
    "contentSelectors": [
      {
        "selector": ".genre_filter_item",
        "category": "content-block"
      },
      {
        "selector": "button",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      "div[class^='detail_wbtext']",
      ".weibo-text",
      ".m-feed",
      ".wbpro-feed-content",
      ".wbpro-list .text"
    ],
    "contentSelectors": [
      {
        "selector": "div[class^='detail_wbtext']",
        "category": "content-block"
      },
      {
        "selector": ".weibo-text",
        "category": "content-block"
      },
      {
        "selector": ".m-feed",
        "category": "content-block"
      },
      {
        "selector": ".wbpro-feed-content",
        "category": "content-block"
      },
      {
        "selector": ".wbpro-list .text",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "uxtension",
    "siteKey": "www.uxento.io",
    "matches": [
      "www.uxento.io"
    ],
    "selectors": [
      "[class='px-4 pb-4 text-sm leading-relaxed break-words text-white overflow-hidden']",
      "[class='text-xs leading-relaxed break-words text-[#AAAAB9] mb-2 overflow-hidden']",
      "[class='px-4 pb-4 text-sm leading-relaxed break-words text-white']",
      "[class='text-xs leading-relaxed break-words text-[#AAAAB9] mb-2']",
      "[class='flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip'] section",
      "h2",
      "article",
      "article h2",
      "article p"
    ],
    "contentSelectors": [
      {
        "selector": "[class='px-4 pb-4 text-sm leading-relaxed break-words text-white overflow-hidden']",
        "category": "content-block"
      },
      {
        "selector": "[class='text-xs leading-relaxed break-words text-[#AAAAB9] mb-2 overflow-hidden']",
        "category": "content-block"
      },
      {
        "selector": "[class='px-4 pb-4 text-sm leading-relaxed break-words text-white']",
        "category": "content-block"
      },
      {
        "selector": "[class='text-xs leading-relaxed break-words text-[#AAAAB9] mb-2']",
        "category": "content-block"
      },
      {
        "selector": "[class='flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip'] section",
        "category": "content-block"
      },
      {
        "selector": "h2",
        "category": "content-block"
      },
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": "article h2",
        "category": "content-block"
      },
      {
        "selector": "article p",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "article div[class='flex justify-between items-center px-3']",
      "article div[class='flex items-center gap-2 mb-2']",
      "article div[class='flex justify-between items-center pr-4']",
      "article div[class='px-3 pb-3 pt-1 grid grid-cols-2 gap-4']",
      "article div[class='flex flex-wrap gap-1 mt-1']",
      "article div[class='flex items-center gap-3 pr-12']"
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
    ],
    "selectors": [
      "h1,h2,h3",
      "article section",
      "[aria-hidden='false'] pre",
      "article p",
      ".postMetaInline",
      "a .u-fontSize24",
      "pre .ha",
      "pre > div > div > div",
      "div > p > span",
      "section p,section span",
      "a div span",
      ".ppapp-form-info,.request-form"
    ],
    "contentSelectors": [
      {
        "selector": "h1,h2,h3",
        "category": "content-block"
      },
      {
        "selector": "article section",
        "category": "content-block"
      },
      {
        "selector": "[aria-hidden='false'] pre",
        "category": "content-block"
      },
      {
        "selector": "article p",
        "category": "content-block"
      },
      {
        "selector": ".postMetaInline",
        "category": "content-block"
      },
      {
        "selector": "a .u-fontSize24",
        "category": "content-block"
      },
      {
        "selector": "pre .ha",
        "category": "content-block"
      },
      {
        "selector": "pre > div > div > div",
        "category": "content-block"
      },
      {
        "selector": "div > p > span",
        "category": "content-block"
      },
      {
        "selector": "section p,section span",
        "category": "content-block"
      },
      {
        "selector": "a div span",
        "category": "content-block"
      },
      {
        "selector": ".ppapp-form-info,.request-form",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[aria-label='Post Preview Reading Time']",
      ".speechify-ignore",
      "article pre",
      "pre > span"
    ],
    "injectedCss": [
      ".u-lineClamp4,.u-lineClamp3,.u-lineClamp2 {-webkit-line-clamp:unset!important;max-height:unset!important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "economist",
    "siteKey": "www.economist.com",
    "matches": [
      "www.economist.com"
    ],
    "excludeSelectors": [
      "footer.ds-footer"
    ],
    "injectedCss": [
      "a::before {position:relative!important;}",
      "[class^=button] span font {white-space:pre-wrap;}"
    ]
  },
  {
    "id": "healthline",
    "siteKey": "www.healthline.com",
    "matches": [
      "www.healthline.com"
    ],
    "excludeSelectors": [
      ".icon-hl-trusted-source-after"
    ]
  },
  {
    "id": "ebay",
    "siteKey": "www.ebay.com",
    "matches": [
      "www.ebay.com"
    ],
    "excludeSelectors": [
      "headers",
      "[itemprop=offers]",
      ".dne-itemtile-original-price"
    ],
    "injectedCss": [
      ".iS4T .zgfQ .uHzw .Ep66 {-webkit-line-clamp: unset;max-height: unset;}",
      "[itemprop=name],.merch-item-title {-webkit-line-clamp: unset;max-height: unset;}"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
  },
  {
    "id": "skinstore",
    "siteKey": "www.skinstore.com",
    "matches": [
      "www.skinstore.com"
    ],
    "excludeSelectors": [
      ".responsiveFlyoutMenu_levelOneLink"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
  },
  {
    "id": "tripadvisor",
    "siteKey": "www.tripadvisor.com",
    "matches": [
      "www.tripadvisor.com"
    ],
    "injectedCss": [
      ".ZTpaU,.alvrA {-webkit-line-clamp:unset;}"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
  },
  {
    "id": "primevideo",
    "siteKey": "www.primevideo.com",
    "matches": [
      "www.primevideo.com",
      "https://*.amazon.co.*/*video*",
      "https://*.amazon.com/*video*",
      "https://*.amazon.*/*video*"
    ],
    "excludeSelectors": [
      "#dv-web-player"
    ],
    "mutationExcludeSelectors": [
      "#dv-web-player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "amazon",
    "siteKey": "www.amazon.*",
    "matches": [
      "www.amazon.*"
    ],
    "selectors": [
      ".a-size-small.a-link-normal.page-banner-link.a-nowrap"
    ],
    "contentSelectors": [
      {
        "selector": ".a-size-small.a-link-normal.page-banner-link.a-nowrap",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "#navFooter",
      ".s-price-instructions-style",
      "[class*='-star ']",
      "[data-hook='acr-average-stars-rating-text']",
      ".a-color-price,.a-price",
      "[data-testid='price-section']",
      "[data-component='dui-badge']",
      "#glow-ingress-block,#nav-link-accountList,#nav-orders,#nav-cart"
    ],
    "injectedCss": [
      ".a-carousel-viewport {height:unset;}",
      "[class*='clamp'] {max-height: unset!important;-webkit-line-clamp: unset!important;}",
      "[data-rows] {max-height: unset!important;-webkit-line-clamp: unset!important;}",
      "[data-a-expander-name='review_text_read_more'] { max-height: unset;}",
      ".compact.primaryText.primaryTextOnly {max-height: unset;-webkit-line-clamp: unset;}",
      ".format {-webkit-line-clamp: unset;}",
      ".dcl-truncate,[class*='textButton'],span[data-a-max-rows] {max-height:unset!important;-webkit-line-clamp: unset!important;}"
    ],
    "paragraphMinTextCount": 4,
    "paragraphMinWordCount": 2
  },
  {
    "id": "sellercentral-amazon-message",
    "siteKey": "sellercentral.amazon.*",
    "matches": [
      "https://sellercentral.amazon.*/messaging/inbox*"
    ],
    "selectors": [
      "#case-messages"
    ],
    "contentSelectors": [
      {
        "selector": "#case-messages",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "visualstudioMarketplace",
    "siteKey": "marketplace.visualstudio.com",
    "matches": [
      "marketplace.visualstudio.com"
    ],
    "selectors": [
      ".core-info-cell > div.name"
    ],
    "contentSelectors": [
      {
        "selector": ".core-info-cell > div.name",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".core-info-second-row",
      ".core-info-third-row",
      ".meta-data-list",
      ".item-title",
      ".breadcrumb",
      ".itemDetails-right",
      ".ux-user-name",
      ".ux-updated-date",
      ".ux-item-second-row-wrapper",
      ".stats-and-offer",
      ".header-container"
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
    ],
    "selectors": [
      "main article",
      ".body-content"
    ],
    "contentSelectors": [
      {
        "selector": "main article",
        "category": "content-block"
      },
      {
        "selector": ".body-content",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ticker-bar",
      "nav",
      "[aria-label=Banner]",
      "aside",
      "[data-component=ticker-bar]",
      "footer.bb-global-footer",
      ".vjs-text-track-display"
    ],
    "isHighDynamic": true
  },
  {
    "id": "sciencedirect",
    "siteKey": "www.sciencedirect.com",
    "matches": [
      "www.sciencedirect.com"
    ],
    "excludeMatches": [
      "www.sciencedirect.com/*/pdf/download/*"
    ],
    "selectors": [
      "span.display",
      "span.captions",
      "span[id^=cap]",
      "article"
    ],
    "contentSelectors": [
      {
        "selector": "span.display",
        "category": "content-block"
      },
      {
        "selector": "span.captions",
        "category": "content-block"
      },
      {
        "selector": "span[id^=cap]",
        "category": "content-block"
      },
      {
        "selector": "article",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".bibliography",
      ".author-group"
    ],
    "injectedCss": [
      "h2 {font-size:unset;}",
      ".u-clamp-2-lines {-webkit-line-clamp:unset!important;}",
      ".immersive-translate-target-wrapper {content-visibility:auto;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "thehighestofthemountains",
    "siteKey": "www.thehighestofthemountains.com",
    "matches": [
      "www.thehighestofthemountains.com"
    ],
    "selectors": [
      "div"
    ],
    "contentSelectors": [
      {
        "selector": "div",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "annasArchive",
    "siteKey": "annas-archive.org",
    "matches": [
      "*.annas-archive.org",
      "annas-archive.org"
    ],
    "selectors": [
      "a.custom-a"
    ],
    "contentSelectors": [
      {
        "selector": "a.custom-a",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "explainshell",
    "siteKey": "explainshell.com",
    "matches": [
      "explainshell.com"
    ],
    "selectors": [
      "[class='help-box']"
    ],
    "contentSelectors": [
      {
        "selector": "[class='help-box']",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "apnews",
    "siteKey": "apnews.com",
    "matches": [
      "apnews.com"
    ],
    "isHighDynamic": true
  },
  {
    "id": "googlePlay",
    "siteKey": "play.google.com",
    "matches": [
      "play.google.com"
    ],
    "excludeSelectors": [
      ".vlGucd",
      ".ubGTjb",
      ".page-nums"
    ]
  },
  {
    "id": "tumblr",
    "siteKey": "www.tumblr.com",
    "matches": [
      "www.tumblr.com"
    ],
    "selectors": [
      "article h1",
      "article > header + div",
      "[data-testid=notes-root] p",
      "div.k31gt",
      "p",
      "article ul",
      "article h2",
      "article h3",
      "article h4",
      "article h5",
      "article h6",
      "article blockquote",
      "article ol"
    ],
    "contentSelectors": [
      {
        "selector": "article h1",
        "category": "content-block"
      },
      {
        "selector": "article > header + div",
        "category": "content-block"
      },
      {
        "selector": "[data-testid=notes-root] p",
        "category": "content-block"
      },
      {
        "selector": "div.k31gt",
        "category": "content-block"
      },
      {
        "selector": "p",
        "category": "content-block"
      },
      {
        "selector": "article ul",
        "category": "content-block"
      },
      {
        "selector": "article h2",
        "category": "content-block"
      },
      {
        "selector": "article h3",
        "category": "content-block"
      },
      {
        "selector": "article h4",
        "category": "content-block"
      },
      {
        "selector": "article h5",
        "category": "content-block"
      },
      {
        "selector": "article h6",
        "category": "content-block"
      },
      {
        "selector": "article blockquote",
        "category": "content-block"
      },
      {
        "selector": "article ol",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "div.fAAi8",
      "div.wvu3V"
    ]
  },
  {
    "id": "foxnews",
    "siteKey": "www.foxnews.com",
    "matches": [
      "www.foxnews.com"
    ],
    "excludeSelectors": [
      ".site-footer",
      ".components-MessageDetails-index__message-details-wrapper",
      "div[class^=SlideDown__container]",
      ".components-MessageActions-index__messageActionsWrapper",
      "span[data-openweb-allow-amp]",
      "div.spcv_typing-users"
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
    ],
    "selectors": [
      "aside",
      "div.manualContent"
    ],
    "contentSelectors": [
      {
        "selector": "aside",
        "category": "content-block"
      },
      {
        "selector": "div.manualContent",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "div.topNav",
      "div.usernameLink",
      "ul.authorDetails",
      "ul.tagViewer",
      "ul.breadCrumbNav",
      "ul.subForumForums",
      "ul.postTools",
      "li.comment ul.controls",
      "div.forumTopNavWrap",
      "div.downloadWrap",
      "div.articleLeftMenu",
      "div.usernameTextWrap",
      "div.favouriteWrap",
      "div.bannerWrapper",
      "div.viewAddonRightMenu",
      "div.extendedMenu.addonsSubMenu",
      "#BottomLinks.bottomLinks",
      "div#LeftSide.leftSide",
      "div#BottomWrap.bottomWrap",
      "div.courseListWrap div.overview",
      "div.conversationControls",
      "div.contentWrapper h1",
      "td.location a#LocationLink",
      "#TopLevelComments .topBar",
      "#TopLevelComments .controls",
      ".tagViewWrap",
      ".changeCount",
      ".otherStats",
      ".FilterMenu",
      ".mobileTopicStats",
      ".forumControlsWrapper",
      ".forumsBottomNavWrap",
      ".breadCrumbNav",
      ".favouriteWrap",
      ".usernameLink",
      ".followWrapper",
      ".blogPostStats",
      ".manualContent dl dt"
    ]
  },
  {
    "id": "getpocket",
    "siteKey": "getpocket.com",
    "matches": [
      "getpocket.com"
    ],
    "selectors": [
      "h2",
      "div.excerpt p",
      "article",
      "h1"
    ],
    "contentSelectors": [
      {
        "selector": "h2",
        "category": "content-block"
      },
      {
        "selector": "div.excerpt p",
        "category": "content-block"
      },
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": "h1",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "fandom",
    "siteKey": "fandom.com",
    "matches": [
      "*.fandom.com"
    ],
    "selectors": [
      ".mp-nav a"
    ],
    "contentSelectors": [
      {
        "selector": ".mp-nav a",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "header.fandom-community-header",
      "div.ph-registration-buttons"
    ],
    "injectedCss": [
      ".immersive-translate-target-translation-block-wrapper {display: unset!important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "huggingface",
    "siteKey": "huggingface.co",
    "matches": [
      "huggingface.co"
    ],
    "excludeSelectors": [
      "thead",
      "ul.text-base",
      "a.group > div.flex-1",
      "div.absolute.truncate",
      "nav",
      "ul[class*='dark:border-gray-800']",
      "div[class*='from-gray-100-to-white']"
    ]
  },
  {
    "id": "epubReader",
    "siteKey": "epub-reader.online",
    "matches": [
      "epub-reader.online"
    ],
    "selectors": [
      "div.slide-contents-item"
    ],
    "contentSelectors": [
      {
        "selector": "div.slide-contents-item",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "you",
    "siteKey": "you.com",
    "matches": [
      "https://you.com/search"
    ],
    "excludeSelectors": [
      "div.hpIWZO"
    ]
  },
  {
    "id": "auth0Openai",
    "siteKey": "auth0.openai.com",
    "matches": [
      "auth0.openai.com"
    ],
    "excludeSelectors": [
      "form",
      "header > h1"
    ]
  },
  {
    "id": "chatOpenai",
    "siteKey": "chat.openai.com",
    "matches": [
      "chat.openai.com",
      "chatgpt.com"
    ],
    "excludeSelectors": [
      "div.absolute.bottom-0.left-0.w-full",
      "h1",
      "div#headlessui-portal-root",
      "nav",
      "ul[aria-multiselectable]",
      ".markdown *",
      "div[class='flex flex-col items-start']",
      "div[class='flex items-center justify-center gap-1 border-b border-black/10 bg-gray-50 p-3 text-gray-500 dark:border-gray-900/50 dark:bg-gray-700 dark:text-gray-300']"
    ],
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "poe",
    "siteKey": "poe.com",
    "matches": [
      "https://poe.com/*"
    ],
    "excludeSelectors": [
      ".Markdown_markdownContainer__Tz3HQ *",
      ".MarkdownLink_linkifiedLink__KxC9G",
      "menu",
      "aside"
    ]
  },
  {
    "id": "janitorai",
    "siteKey": "janitorai.com",
    "matches": [
      "https://janitorai.com"
    ],
    "excludeSelectors": [
      "[data-testid=virtuoso-scroller] .css-104fsj *"
    ]
  },
  {
    "id": "glasp",
    "siteKey": "glasp.co",
    "matches": [
      "glasp.co"
    ],
    "excludeSelectors": [
      ".home_overview_list_content_wrapper"
    ]
  },
  {
    "id": "developerChrome",
    "siteKey": "developer.chrome.com",
    "matches": [
      "developer.chrome.com"
    ],
    "excludeSelectors": [
      "web-tabs",
      "ul.code-sections--summary"
    ]
  },
  {
    "id": "android",
    "siteKey": "developer.android.google.cn",
    "matches": [
      "developer.android.google.cn",
      "developer.android.com"
    ],
    "selectors": [
      "aside",
      "google-codelab-step"
    ],
    "contentSelectors": [
      {
        "selector": "aside",
        "category": "content-block"
      },
      {
        "selector": "google-codelab-step",
        "category": "content-block"
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "ft",
    "siteKey": "www.ft.com",
    "matches": [
      "www.ft.com"
    ],
    "excludeSelectors": [
      "header",
      "[aria-labelledby=cookie-banner-aria-label]",
      "footer",
      "[aria-label='Primary navigation']"
    ]
  },
  {
    "id": "microsoft",
    "siteKey": "apps.microsoft.com",
    "matches": [
      "https://apps.microsoft.com/store/detail/*"
    ],
    "selectors": [
      "pre"
    ],
    "contentSelectors": [
      {
        "selector": "pre",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "gitlab",
    "siteKey": "gitlab.com",
    "matches": [
      "gitlab.com"
    ],
    "excludeSelectors": [
      ".tree-content-holder",
      "nav",
      ".home-panel-metadata",
      "div[data-testid=project_topic_list]",
      ".commit"
    ]
  },
  {
    "id": "tiktok",
    "siteKey": "www.tiktok.com",
    "matches": [
      "https://www.tiktok.com/*/video/*",
      "https://www.tiktok.com/*"
    ],
    "excludeSelectors": [
      "[class*='DivInfoPosition']",
      "[data-e2e*='-count']",
      "[data-e2e='nav-foryou']",
      "[data-e2e*='view-more']",
      "[data-e2e*='comment-reply']",
      "[data-e2e*='comment-username']",
      "[class*='DivCommentSubContentSplitWrapper']",
      "[class*='DivViewRepliesContainer']"
    ],
    "mutationExcludeSelectors": [
      "[class*='DivInfoPosition'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "steamcommunity",
    "siteKey": "steamcommunity.com",
    "matches": [
      "steamcommunity.com"
    ],
    "selectors": [
      ".apphub_sectionTab"
    ],
    "contentSelectors": [
      {
        "selector": ".apphub_sectionTab",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".forum_paging",
      ".forum_topic_reply_count",
      ".forum_topic_lastpost",
      ".forum_topic_award_count",
      ".discussion_search_pagingcontrols",
      ".found_helpful,.vote_header,.date_posted,.early_access_review,.apphub_CardContentAuthorBlock"
    ],
    "injectedCss": [
      ".forum_topic,.rightbox_list_option,.appHubShortcut {height: unset;}",
      ".forum_topic_name {white-space:normal;line-height: 1.25rem; padding: 6px 20px 0 0;}",
      ".forum_topic_op {clear: left; padding: 0 0 6px 2rem;}"
    ]
  },
  {
    "id": "steampoweredApp",
    "siteKey": "store.steampowered.com",
    "matches": [
      "store.steampowered.com/app/*"
    ],
    "selectors": [
      ".game_area_sys_req_leftCol",
      ".game_area_sys_req_rightCol",
      ".game_page_autocollapse_ctn iframe"
    ],
    "contentSelectors": [
      {
        "selector": ".game_area_sys_req_leftCol",
        "category": "content-block"
      },
      {
        "selector": ".game_area_sys_req_rightCol",
        "category": "content-block"
      },
      {
        "selector": ".game_page_autocollapse_ctn iframe",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "#global_actions",
      "#store_controls",
      "#foryou_tab",
      "[class*=persona]",
      "a.btn_medium",
      ".persona_name",
      ".hours.ellipsis",
      ".checkcol",
      ".postedDate",
      ".dev_row .summary",
      ".already_in_library",
      ".game_header_image_ctn .grid_content",
      ".ds_flag.ds_wishlist_flag",
      ".early_access_review.tooltip",
      ".communitylink_achievement_images",
      ".user_reviews_summary_row.summary",
      ".review_award_ctn",
      ".add_to_wishlist_area",
      ".next_in_queue_content",
      ".glance_tags.popular_tags",
      ".game_purchase_action",
      ".vote_button_ctn",
      "#VoteUpDownBtnCtn",
      "#footer",
      "#ViewAllReviewssummary",
      ".user_reviews",
      ".ReviewContentCtn .title",
      ".author_counts,.control_block,.vote_info"
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
    ],
    "excludeSelectors": [
      ".c-header",
      ".c-recommendations-header",
      ".c-recommendations-list-container",
      ".c-article-references__links",
      ".c-article-identifiers",
      ".c-article-author-list",
      ".c-article-metrics-bar__wrapper",
      ".c-article__pill-button",
      "#author-information-content",
      "#article-info-section",
      ".pdf-content"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper {content-visibility:auto;}"
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
    ],
    "selectors": [
      "app-summary-authors + div",
      "app-full-record-keywords span span",
      "[data-ta=summary-record-title-link]",
      "[cdxanalyticscategory=wos-recordCard_ExpandAbstract]"
    ],
    "contentSelectors": [
      {
        "selector": "app-summary-authors + div",
        "category": "content-block"
      },
      {
        "selector": "app-full-record-keywords span span",
        "category": "content-block"
      },
      {
        "selector": "[data-ta=summary-record-title-link]",
        "category": "content-block"
      },
      {
        "selector": "[cdxanalyticscategory=wos-recordCard_ExpandAbstract]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "app-custom-breadcrumbs",
      ".summary-left-panel",
      ".authors",
      "app-full-record-keywords mark",
      "mat-sidenav",
      "[name=pubdate]",
      "[data-ta^=Summary-]",
      "app-summary-authors",
      ".search-text",
      ".mat-drawer-inner-container",
      "[class*='sidenav-panel']"
    ],
    "isHighDynamic": true
  },
  {
    "id": "science",
    "siteKey": "www.science.org",
    "matches": [
      "www.science.org"
    ],
    "excludeSelectors": [
      ".core-self-citation",
      ".contributors"
    ]
  },
  {
    "id": "appleinsider",
    "siteKey": "appleinsider.com",
    "matches": [
      "appleinsider.com"
    ],
    "excludeSelectors": [
      "#topic-nav"
    ]
  },
  {
    "id": "jetbrains",
    "siteKey": "jetbrains.com",
    "matches": [
      "https://*.jetbrains.com"
    ],
    "selectors": [
      "[data-test=prompt]"
    ],
    "contentSelectors": [
      {
        "selector": "[data-test=prompt]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".toolbar__ee8",
      "[data-test=\"left-sidebar\"]",
      ".comment__info",
      ".symbol.monospace"
    ]
  },
  {
    "id": "theverge",
    "siteKey": "www.theverge.com",
    "matches": [
      "www.theverge.com"
    ],
    "selectors": [
      "[role='article'] p"
    ],
    "contentSelectors": [
      {
        "selector": "[role='article'] p",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".k8dtcj0",
      "._2xqpwjf._2xqpwj0"
    ]
  },
  {
    "id": "simp",
    "siteKey": "beta.simp.red",
    "matches": [
      "https://beta.simp.red/trans*"
    ],
    "selectors": [
      ".simpread-read-root"
    ],
    "contentSelectors": [
      {
        "selector": ".simpread-read-root",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "lookintobitcoin",
    "siteKey": "www.lookintobitcoin.com",
    "matches": [
      "https://www.lookintobitcoin.com/charts/*"
    ],
    "excludeSelectors": [
      "svg"
    ]
  },
  {
    "id": "openaiAccount",
    "siteKey": "platform.openai.com",
    "matches": [
      "https://platform.openai.com/account/api-keys*"
    ],
    "isHighDynamic": true
  },
  {
    "id": "openaiDocs",
    "siteKey": "platform.openai.com",
    "matches": [
      "https://platform.openai.com/docs*"
    ],
    "excludeSelectors": [
      ".pheader"
    ]
  },
  {
    "id": "pkgStd",
    "siteKey": "pkg.go.dev",
    "matches": [
      "https://pkg.go.dev/std"
    ],
    "selectors": [
      "td.UnitDirectories-desktopSynopsis"
    ],
    "contentSelectors": [
      {
        "selector": "td.UnitDirectories-desktopSynopsis",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "pkg",
    "siteKey": "pkg.go.dev",
    "matches": [
      "https://pkg.go.dev/*"
    ],
    "selectors": [
      "div.UnitDetails",
      "#_nav_group_README",
      "p.SearchSnippet-infoLabel",
      ".go-Container"
    ],
    "contentSelectors": [
      {
        "selector": "div.UnitDetails",
        "category": "content-block"
      },
      {
        "selector": "#_nav_group_README",
        "category": "content-block"
      },
      {
        "selector": "p.SearchSnippet-infoLabel",
        "category": "content-block"
      },
      {
        "selector": ".go-Container",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "explainpaper",
    "siteKey": "www.explainpaper.com",
    "matches": [
      "https://www.explainpaper.com/reader*"
    ],
    "selectors": [
      ".leading-relaxed",
      ".chat-messages p",
      ".text-sm"
    ],
    "contentSelectors": [
      {
        "selector": ".leading-relaxed",
        "category": "content-block"
      },
      {
        "selector": ".chat-messages p",
        "category": "content-block"
      },
      {
        "selector": ".text-sm",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "coinmarketcap",
    "siteKey": "coinmarketcap.com",
    "matches": [
      "coinmarketcap.com"
    ],
    "selectors": [
      "div[class='sc-3502f6cd-0 JxHqg']"
    ],
    "contentSelectors": [
      {
        "selector": "div[class='sc-3502f6cd-0 JxHqg']",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "wandb",
    "siteKey": "wandb.ai",
    "matches": [
      "wandb.ai"
    ],
    "selectors": [
      ".report-page-top"
    ],
    "contentSelectors": [
      {
        "selector": ".report-page-top",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "paulgraham",
    "siteKey": "paulgraham.com",
    "matches": [
      "paulgraham.com"
    ],
    "selectors": [
      "font[face=verdana]"
    ],
    "contentSelectors": [
      {
        "selector": "font[face=verdana]",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "zendesk",
    "siteKey": "zendesk.com",
    "matches": [
      "https://*.zendesk.com/agent/*"
    ],
    "selectors": [
      "[data-test-id*=subject]",
      "[data-test-id*=content] > span",
      ".zd-comment",
      ".title"
    ],
    "contentSelectors": [
      {
        "selector": "[data-test-id*=subject]",
        "category": "content-block"
      },
      {
        "selector": "[data-test-id*=content] > span",
        "category": "content-block"
      },
      {
        "selector": ".zd-comment",
        "category": "content-block"
      },
      {
        "selector": ".title",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "migadu",
    "siteKey": "webmail.migadu.com",
    "matches": [
      "webmail.migadu.com"
    ],
    "selectors": [
      ".bodyText"
    ],
    "contentSelectors": [
      {
        "selector": ".bodyText",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "thehackernews",
    "siteKey": "thehackernews.com",
    "matches": [
      "thehackernews.com"
    ],
    "selectors": [
      ".pop-title"
    ],
    "contentSelectors": [
      {
        "selector": ".pop-title",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "span#blog-pager-older-link",
      "span.h-datetime"
    ]
  },
  {
    "id": "brown",
    "siteKey": "cs.brown.edu",
    "matches": [
      "cs.brown.edu"
    ],
    "excludeSelectors": [
      ".SCodeFlow"
    ]
  },
  {
    "id": "fiverr",
    "siteKey": "www.fiverr.com",
    "matches": [
      "https://www.fiverr.com/inbox/*"
    ],
    "selectors": [
      ".message-body",
      "article[data-testid=index-container]"
    ],
    "contentSelectors": [
      {
        "selector": ".message-body",
        "category": "content-block"
      },
      {
        "selector": "article[data-testid=index-container]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[data-testid=basic-message-header]",
      "[data-testid=message-header-timestamp]",
      "time",
      ".user-name",
      ".user-info",
      ".header"
    ]
  },
  {
    "id": "fiverr-main",
    "siteKey": "fiverr.com",
    "matches": [
      "*.fiverr.com"
    ],
    "excludeSelectors": [
      ".popular"
    ]
  },
  {
    "id": "jira",
    "siteKey": "jira.*.com",
    "matches": [
      "jira.*.com/browse/*",
      "jira.*.com/projects/*"
    ],
    "selectors": [
      "[id=descriptionmodule]",
      "[id=summary-val]",
      "div.action-body",
      "td.stsummary"
    ],
    "contentSelectors": [
      {
        "selector": "[id=descriptionmodule]",
        "category": "content-block"
      },
      {
        "selector": "[id=summary-val]",
        "category": "content-block"
      },
      {
        "selector": "div.action-body",
        "category": "content-block"
      },
      {
        "selector": "td.stsummary",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "thehill",
    "siteKey": "thehill.com",
    "matches": [
      "thehill.com"
    ],
    "excludeSelectors": [
      "div.featured-cards__byline",
      "div.list-item__meta",
      ".tags__item",
      "div.extended-scroll__header",
      ".submitted-by",
      ".site-header--has-alert-banner",
      ".homepage__container__opinion__item__byline",
      ".homepage__container__header",
      ".archive__item__meta"
    ],
    "injectedCss": [
      ".most-popular-item { max-height: unset !important; }",
      ".most-popular-item__link { -webkit-line-clamp: unset !important; }"
    ]
  },
  {
    "id": "ubuntu",
    "siteKey": "manpages.ubuntu.com",
    "matches": [
      "manpages.ubuntu.com"
    ],
    "selectors": [
      "pre"
    ],
    "contentSelectors": [
      {
        "selector": "pre",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "promptingguide",
    "siteKey": "www.promptingguide.ai",
    "matches": [
      "www.promptingguide.ai"
    ],
    "selectors": [
      "article",
      "li"
    ],
    "contentSelectors": [
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": "li",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "ietf",
    "siteKey": "ietf.org",
    "matches": [
      "*.ietf.org/doc/html/*"
    ],
    "selectors": [
      "[href^='#page']"
    ],
    "contentSelectors": [
      {
        "selector": "[href^='#page']",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "newsminimalist",
    "siteKey": "www.newsminimalist.com",
    "matches": [
      "https://www.newsminimalist.com/"
    ],
    "selectors": [
      ".inline-flex"
    ],
    "contentSelectors": [
      {
        "selector": ".inline-flex",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "yandexIndex",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/"
    ],
    "selectors": [
      ".tabs__item-text"
    ],
    "contentSelectors": [
      {
        "selector": ".tabs__item-text",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "yandexSearch",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/search/*"
    ],
    "excludeSelectors": [
      ".KeyValue-Row",
      ".EntityFeedbackFooter",
      ".Organic-Subtitle",
      ".SerpFooter-Content",
      ".serp-user",
      ".Pager"
    ]
  },
  {
    "id": "yandex",
    "siteKey": "yandex.com",
    "matches": [
      "https://yandex.com/video/*"
    ],
    "selectors": [
      ".serp-item__title",
      ".serp-item__text",
      ".Keypoints-ItemTitle",
      ".bes-epmjnzm-idtktyj",
      ".OrganicTitle-LinkText",
      "h1.VideoTitle"
    ],
    "contentSelectors": [
      {
        "selector": ".serp-item__title",
        "category": "content-block"
      },
      {
        "selector": ".serp-item__text",
        "category": "content-block"
      },
      {
        "selector": ".Keypoints-ItemTitle",
        "category": "content-block"
      },
      {
        "selector": ".bes-epmjnzm-idtktyj",
        "category": "content-block"
      },
      {
        "selector": ".OrganicTitle-LinkText",
        "category": "content-block"
      },
      {
        "selector": "h1.VideoTitle",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "react",
    "siteKey": "react.dev",
    "matches": [
      "react.dev"
    ],
    "injectedCss": [
      "[class*='h-\\[40px\\]'] {height: unset !important;}"
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
    ],
    "excludeSelectors": [
      "[data-framer-name='Desktop']"
    ]
  },
  {
    "id": "allmyfaves",
    "siteKey": "allmyfaves.com",
    "matches": [
      "https://allmyfaves.com/"
    ],
    "selectors": [
      "p"
    ],
    "contentSelectors": [
      {
        "selector": "p",
        "category": "content-block"
      }
    ],
    "paragraphMinTextCount": 2,
    "paragraphMinWordCount": 1
  },
  {
    "id": "kadaza",
    "siteKey": "www.kadaza.com",
    "matches": [
      "https://www.kadaza.com/"
    ],
    "selectors": [
      ".header span.title",
      ".custom-content-footer"
    ],
    "contentSelectors": [
      {
        "selector": ".header span.title",
        "category": "content-block"
      },
      {
        "selector": ".custom-content-footer",
        "category": "content-block"
      }
    ],
    "paragraphMinTextCount": 2,
    "paragraphMinWordCount": 1
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
    ],
    "excludeSelectors": [
      "div.enlighter"
    ]
  },
  {
    "id": "chinadaily",
    "siteKey": "www.chinadaily.com.cn",
    "matches": [
      "www.chinadaily.com.cn"
    ],
    "excludeSelectors": [
      ".topNav",
      ".topNav2_art > span",
      ".topNav_art2 > .dropdown",
      ".dibu-three",
      ".topBar"
    ],
    "injectedCss": [
      "a { height: unset !important; }",
      "li { height: unset !important; }",
      "div { height: unset !important; }",
      ".immersive-translate-target-inner {color:black;}"
    ]
  },
  {
    "id": "braynzarsoft",
    "siteKey": "www.braynzarsoft.net",
    "matches": [
      "www.braynzarsoft.net"
    ],
    "excludeSelectors": [
      "#content-header",
      ".sidebar-section",
      ".rating-box",
      ".tutorial-stat",
      "#bookmark-btn",
      ".question-footer",
      ".adsbygoogle",
      ".footer",
      ".type",
      ".views",
      ".questioninputcode"
    ],
    "injectedCss": [
      ".tutorial-desc {overflow: scroll !important;}",
      ".question-title {display:inline-flex !important;}"
    ]
  },
  {
    "id": "yuque",
    "siteKey": "www.yuque.com",
    "matches": [
      "https://www.yuque.com/*"
    ],
    "excludeSelectors": [
      ".lark-virtual-tree"
    ]
  },
  {
    "id": "researchgate",
    "siteKey": "www.researchgate.net",
    "matches": [
      "www.researchgate.net"
    ],
    "excludeSelectors": [
      ".nova-legacy-v-publication-item__meta-data",
      ".nova-legacy-v-publication-item__person-list",
      ".js-authors-list"
    ]
  },
  {
    "id": "theatlantic",
    "siteKey": "www.theatlantic.com",
    "matches": [
      "www.theatlantic.com",
      "https://mashable.com/*"
    ],
    "excludeSelectors": [
      "footer:last-of-type",
      "nav",
      "header div.subtitle-2.w-full"
    ]
  },
  {
    "id": "dw",
    "siteKey": "www.dw.com",
    "matches": [
      "www.dw.com"
    ],
    "excludeSelectors": [
      ".focus-menu-shown"
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
    ],
    "excludeSelectors": [
      ".Leftnav"
    ]
  },
  {
    "id": "whatsapp",
    "siteKey": "web.whatsapp.com",
    "matches": [
      "web.whatsapp.com"
    ],
    "selectors": [
      "._akbu",
      "[role=list]",
      ".copyable-text",
      ".quoted-mention"
    ],
    "contentSelectors": [
      {
        "selector": "._akbu",
        "category": "content-block"
      },
      {
        "selector": "[role=list]",
        "category": "content-block"
      },
      {
        "selector": ".copyable-text",
        "category": "content-block"
      },
      {
        "selector": ".quoted-mention",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "[aria-hidden=true]"
    ]
  },
  {
    "id": "bing",
    "siteKey": "bing.com",
    "matches": [
      "https://*.bing.com/search*"
    ],
    "excludeSelectors": [
      ".tptxt"
    ]
  },
  {
    "id": "drizzle",
    "siteKey": "orm.drizzle.team",
    "matches": [
      "orm.drizzle.team"
    ],
    "excludeSelectors": [
      "[class^='codetabs_tab']",
      ".npm__tab"
    ]
  },
  {
    "id": "yahoo",
    "siteKey": "yahoo.*",
    "matches": [
      "*.yahoo.*"
    ],
    "selectors": [
      ".SIPGg",
      ".sc-kzMCTH.pSZXj"
    ],
    "contentSelectors": [
      {
        "selector": ".SIPGg",
        "category": "content-block"
      },
      {
        "selector": ".sc-kzMCTH.pSZXj",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "._ys_jiqava",
      "#Col2-5-Rmp-Proxy",
      ".readmore",
      ".ticker-item-wrapper",
      ".ticker-list",
      ".footer"
    ],
    "injectedCss": [
      "[class*='line-clamp'],h3.clamp {-webkit-line-clamp:unset!important;}",
      "#atomic .Mt\\(20px\\) {margin-top: 100px;}",
      "[class*='LineClamp'] {-webkit-line-clamp:unset;max-height:unset;}",
      "a[class*='js-content-viewer']> div[class*='Td\\(n\\)'] {overflow: scroll;}",
      "[class*='_ys_24482e'] {-webkit-line-clamp:unset;}",
      "#Aside > :first-child {overflow:scroll;}"
    ],
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "wsj",
    "siteKey": "www.wsj.com",
    "matches": [
      "www.wsj.com",
      "cn.wsj.com"
    ],
    "selectors": [
      ".series-nav__link-thumbnail"
    ],
    "contentSelectors": [
      {
        "selector": ".series-nav__link-thumbnail",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "header",
      "footer",
      "nav",
      "[aria-label='Markets summary']"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper br {display:none;}",
      ".spcv_list-item .immersive-translate-target-translation-block-wrapper {display:inline-block;margin-top:8px;}"
    ]
  },
  {
    "id": "businessinsider",
    "siteKey": "www.businessinsider.com",
    "matches": [
      "www.businessinsider.com"
    ],
    "excludeSelectors": [
      "header",
      "nav",
      "section.live-updates-module"
    ]
  },
  {
    "id": "goodreads",
    "siteKey": "www.goodreads.com",
    "matches": [
      "www.goodreads.com"
    ],
    "excludeSelectors": [
      ".badgeYear",
      ".gr-mediaBox__desc",
      ".bookVotedRow",
      ".minirating",
      "div[itemprop='aggregateRating']",
      ".wtrButtonContainer",
      ".RatingsHistogram__labelTitle",
      ".FollowButton",
      ".siteHeader__topLevelLink",
      "#books > thead",
      "td[class*='rating']",
      "td[class*='shelves']",
      "td[class*='date_read']",
      "td[class*='date_added']",
      "td[class*='actions']"
    ]
  },
  {
    "id": "nytimes",
    "siteKey": "www.nytimes.com",
    "matches": [
      "www.nytimes.com"
    ],
    "excludeSelectors": [
      "#app > div > div > header",
      "#app > div > div > div > div > header",
      "#in-story-masthead",
      "[data-testid=masthead-container]",
      "[data-testid=user-header]",
      "[data-testid^='recommend-button']",
      "[data-testid=copy-link]",
      ".css-mydst6 > a"
    ],
    "injectedCss": [
      "a::after {position:relative!important;}",
      "footer {line-height: unset!important;;}"
    ]
  },
  {
    "id": "bugsKde",
    "siteKey": "bugs.kde.org",
    "matches": [
      "bugs.kde.org"
    ],
    "excludeSelectors": [
      ".bz_first_comment_head",
      ".bz_comment_head",
      ".related_actions"
    ]
  },
  {
    "id": "plati",
    "siteKey": "plati.market",
    "matches": [
      "plati.market"
    ],
    "injectedCss": [
      ".card .custom-link{-webkit-line-clamp: unset !important;}"
    ]
  },
  {
    "id": "claudeAi",
    "siteKey": "claude.ai",
    "matches": [
      "claude.ai"
    ],
    "excludeSelectors": [
      ".contents *",
      ".code-block__code"
    ],
    "injectedCss": [
      "[data-testid='chat-menu-trigger'] br {display:none;}",
      "[data-test-render-count] {overflow: scroll;}"
    ],
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "feishu",
    "siteKey": "feishu.cn",
    "matches": [
      "*.feishu.cn",
      "*.larkoffice.com",
      "*.larksuite.com"
    ],
    "excludeSelectors": [
      ".catalogue__list"
    ]
  },
  {
    "id": "kaggle",
    "siteKey": "www.kaggle.com",
    "matches": [
      "www.kaggle.com"
    ],
    "excludeSelectors": [
      ".sc-kHItYk.kCjSZT",
      ".sc-hagvSa.guBIfV",
      ".sc-jhZTHU.btgPPn",
      "#editor-sidebar-scroll-container"
    ],
    "injectedCss": [
      ".km-listitem--large {height:unset !important;}",
      ".km-listitem--large .jWyUHl {height:unset !important;}",
      "[role=listitem] {overflow:scroll;}",
      "[role=listitem] div {-webkit-line-clamp:unset;}",
      "[class*='km-listitem--medium'] {height:unset !important;}",
      ".MuiListItem-root a > div :nth-child(2) {height:unset !important;}"
    ]
  },
  {
    "id": "ieee",
    "siteKey": "spectrum.ieee.org",
    "matches": [
      "spectrum.ieee.org"
    ],
    "selectors": [
      "small"
    ],
    "contentSelectors": [
      {
        "selector": "small",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "cnn",
    "siteKey": "cnn.com",
    "matches": [
      "*.cnn.com"
    ],
    "selectors": [
      ".layout__content-wrapper",
      ".article__content-container"
    ],
    "contentSelectors": [
      {
        "selector": ".layout__content-wrapper",
        "category": "content-block"
      },
      {
        "selector": ".article__content-container",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ad-slot-header__wrapper",
      "#pageFooter"
    ]
  },
  {
    "id": "uni-trier",
    "siteKey": "dblp.uni-trier.de",
    "matches": [
      "dblp.uni-trier.de"
    ],
    "selectors": [
      "h1",
      "h2",
      ".title",
      ".external",
      "dd p"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "h2",
        "category": "content-block"
      },
      {
        "selector": ".title",
        "category": "content-block"
      },
      {
        "selector": ".external",
        "category": "content-block"
      },
      {
        "selector": "dd p",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".side-column"
    ]
  },
  {
    "id": "bilibili",
    "siteKey": "www.bilibili.com",
    "matches": [
      "www.bilibili.com"
    ],
    "excludeSelectors": [
      ".bpx-player-subtitle-panel-text",
      ".bili-video-card__info--author, .bili-video-card__info--date",
      "#pictures,#note,#info,#footer,#expander-footer,.playinfo,.upname,#bilibili-player"
    ]
  },
  {
    "id": "time",
    "siteKey": "time.com",
    "matches": [
      "time.com"
    ],
    "excludeSelectors": [
      ".date-and-duration"
    ]
  },
  {
    "id": "docs-swift",
    "siteKey": "docs.swift.org",
    "matches": [
      "docs.swift.org"
    ],
    "selectors": [
      ".content",
      "#menu"
    ],
    "contentSelectors": [
      {
        "selector": ".content",
        "category": "content-block"
      },
      {
        "selector": "#menu",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "mail-yandex",
    "siteKey": "mail.yandex.com",
    "matches": [
      "mail.yandex.com"
    ],
    "selectors": [
      "article",
      ".Text_color_primary",
      ".mail-MessageSnippet-Item_subject"
    ],
    "contentSelectors": [
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": ".Text_color_primary",
        "category": "content-block"
      },
      {
        "selector": ".mail-MessageSnippet-Item_subject",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "forums.zotero",
    "siteKey": "forums.zotero.org",
    "matches": [
      "forums.zotero.org"
    ],
    "selectors": [
      ".page-sidebar",
      ".page-content"
    ],
    "contentSelectors": [
      {
        "selector": ".page-sidebar",
        "category": "content-block"
      },
      {
        "selector": ".page-content",
        "category": "content-block"
      }
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
    ],
    "selectors": [
      ".mixed-citation"
    ],
    "contentSelectors": [
      {
        "selector": ".mixed-citation",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".docsum-journal-citation",
      ".citation-part",
      ".docsum-authors",
      ".top-wrapper",
      ".article-source",
      ".citation-doi",
      ".identifiers",
      ".cite",
      ".share",
      ".arrow-link",
      ".multiple-results-actions",
      ".sort-dropdown .option-label",
      ".display-options .button-label",
      ".actions-buttons.sidebar",
      ".title-copy"
    ],
    "mutationExcludeSelectors": [
      "#Scholarscope_HighlightContent",
      "#Scholarscope_HighlightContent span"
    ],
    "injectedCss": [
      "#Scholarscope_HighlightOrigin > p font,#Scholarscope_HighlightContent > p font {display: inline!important;}",
      "#Scholarscope_HighlightOrigin > p font br,#Scholarscope_HighlightContent > p font br {display: none!important;}",
      ".title-translate {display:block;}",
      ".immersive-translate-target-inner br{display:none;}",
      ".immersive-translate-target-wrapper {content-visibility:auto;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "chosun",
    "siteKey": "www.chosun.com",
    "matches": [
      "www.chosun.com"
    ],
    "injectedCss": [
      "body {word-break: unset!important;}"
    ]
  },
  {
    "id": "yna",
    "siteKey": "yna*",
    "matches": [
      "*.yna*"
    ],
    "injectedCss": [
      "font > br {display:none}"
    ]
  },
  {
    "id": "digitimes",
    "siteKey": "www.digitimes.com",
    "matches": [
      "www.digitimes.com"
    ],
    "excludeSelectors": [
      ".main-nav-frame",
      ".sub-header-wrapper",
      ".footer",
      ".date"
    ]
  },
  {
    "id": "vdi-nachrichten",
    "siteKey": "www.vdi-nachrichten.com",
    "matches": [
      "www.vdi-nachrichten.com"
    ],
    "excludeSelectors": [
      ".header-menu__item > a",
      ".linkbar__item",
      ".header__button-group"
    ]
  },
  {
    "id": "qqMail",
    "siteKey": "mail.qq.com",
    "matches": [
      "*.mail.qq.com"
    ],
    "excludeSelectors": [
      ".xmail-cmp-account"
    ]
  },
  {
    "id": "brutalist",
    "siteKey": "brutalist.report",
    "matches": [
      "brutalist.report"
    ],
    "selectors": [
      "li > a:first-child",
      "aside",
      "nav > a",
      "h1 > a",
      "h3 > a",
      "h2 >a"
    ],
    "contentSelectors": [
      {
        "selector": "li > a:first-child",
        "category": "content-block"
      },
      {
        "selector": "aside",
        "category": "content-block"
      },
      {
        "selector": "nav > a",
        "category": "content-block"
      },
      {
        "selector": "h1 > a",
        "category": "content-block"
      },
      {
        "selector": "h3 > a",
        "category": "content-block"
      },
      {
        "selector": "h2 >a",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "maxroll",
    "siteKey": "maxroll.gg",
    "matches": [
      "maxroll.gg"
    ],
    "excludeSelectors": [
      "span[class^='text-opac'] + span[class^='text-']"
    ],
    "injectedCss": [
      "font {font-family: sans-serif !important;}",
      ".d4t-sprite-icon {display: unset !important;}"
    ]
  },
  {
    "id": "gradioappdocs",
    "siteKey": "www.gradio.app",
    "matches": [
      "www.gradio.app/docs/*"
    ],
    "selectors": [
      "div.obj"
    ],
    "contentSelectors": [
      {
        "selector": "div.obj",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "div#examples"
    ]
  },
  {
    "id": "arca",
    "siteKey": "arca.live",
    "matches": [
      "arca.live"
    ],
    "excludeSelectors": [
      "span.user-info"
    ]
  },
  {
    "id": "app.element.io",
    "siteKey": "app.element.io",
    "matches": [
      "app.element.io"
    ],
    "excludeSelectors": [
      ".mx_DisambiguatedProfile",
      ".mx_ReplyChain_wrapper",
      ".mx_ThreadSummary_replies_amount"
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
    ],
    "excludeSelectors": [
      "#blog-page-sidebar-wrapper"
    ]
  },
  {
    "id": "discussions.apple",
    "siteKey": "discussions.apple.com",
    "matches": [
      "discussions.apple.com"
    ],
    "excludeSelectors": [
      ".page-number"
    ]
  },
  {
    "id": "www.sixthtone.com",
    "siteKey": "www.sixthtone.com",
    "matches": [
      "www.sixthtone.com"
    ],
    "excludeSelectors": [
      "#footer",
      "[class^=index_time]",
      "[class^=index_anthorList]",
      "[class^=index_node]",
      "[class^=index_popupWrapper]"
    ]
  },
  {
    "id": "forum.unity",
    "siteKey": "forum.unity.com",
    "matches": [
      "forum.unity.com"
    ],
    "excludeSelectors": [
      ".bbCodeCode"
    ]
  },
  {
    "id": "netflix",
    "siteKey": "www.netflix.com",
    "matches": [
      "www.netflix.com"
    ],
    "excludeSelectors": [
      ".player-timedtext"
    ],
    "mutationExcludeSelectors": [
      ".player-timedtext *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "udemy",
    "siteKey": "udemy.com",
    "matches": [
      "*.udemy.com"
    ],
    "excludeSelectors": [
      "[data-purpose='captions-cue-text']",
      ".shaka-text-container"
    ],
    "mutationExcludeSelectors": [
      "[data-purpose='captions-cue-text'] *",
      ".shaka-text-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "iview",
    "siteKey": "iview.abc.net.au",
    "matches": [
      "iview.abc.net.au"
    ],
    "excludeSelectors": [
      ".jwplayer"
    ],
    "mutationExcludeSelectors": [
      ".jwplayer *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "marketsurge",
    "siteKey": "marketsurge.investors.com",
    "matches": [
      "marketsurge.investors.com"
    ],
    "excludeSelectors": [
      ".jwplayer"
    ],
    "mutationExcludeSelectors": [
      ".jwplayer *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "nmaart",
    "siteKey": "www.nma.art",
    "matches": [
      "www.nma.art"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
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
    ],
    "excludeSelectors": [
      ".loa-authors",
      ".MuiBox-root > .MuiTypography-root.MuiTypography-body2"
    ]
  },
  {
    "id": "patreon",
    "siteKey": "www.patreon.com",
    "matches": [
      "www.patreon.com"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "thaipbs",
    "siteKey": "www.thaipbs.*",
    "matches": [
      "www.thaipbs.*",
      "players.brightcove.net"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "hstream",
    "siteKey": "hstream.moe",
    "matches": [
      "hstream.moe"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "zenva",
    "siteKey": "academy.zenva.com",
    "matches": [
      "academy.zenva.com"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "lowstresshandling",
    "siteKey": "university.lowstresshandling.com",
    "matches": [
      "university.lowstresshandling.com"
    ],
    "excludeSelectors": [
      "div[data-vjs-player]"
    ],
    "mutationExcludeSelectors": [
      "div[data-vjs-player] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "apple",
    "siteKey": "developer.apple.com",
    "matches": [
      "developer.apple.com"
    ],
    "excludeSelectors": [
      ".developer-video-player",
      ".vue-recycle-scroller"
    ],
    "mutationExcludeSelectors": [
      ".developer-video-player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "nebula",
    "siteKey": "nebula.tv",
    "matches": [
      "nebula.tv"
    ],
    "excludeSelectors": [
      "[data-subtitles-container='true']"
    ],
    "mutationExcludeSelectors": [
      "[data-subtitles-container='true'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "zebrack-shueisha",
    "siteKey": "zebrack-comic.shueisha.*",
    "matches": [
      "zebrack-comic.shueisha.*"
    ],
    "excludeSelectors": [
      ".eAvsta_root"
    ]
  },
  {
    "id": "hentai",
    "siteKey": "e-hentai.org",
    "matches": [
      "e-hentai.org"
    ],
    "excludeSelectors": [
      "#i3"
    ]
  },
  {
    "id": "scholar.cnki.net",
    "siteKey": "scholar.cnki.net",
    "matches": [
      "scholar.cnki.net"
    ],
    "injectedCss": [
      ".result .searchItem {height: auto!important;}"
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
    ],
    "isHighDynamic": true
  },
  {
    "id": "datalab.naver",
    "siteKey": "datalab.naver.com",
    "matches": [
      "datalab.naver.com"
    ],
    "injectedCss": [
      ".tab_list_area .list_itm {height: unset !important;}",
      ".section.main_tab_opt .select {height: unset !important;}"
    ]
  },
  {
    "id": "championcross.jp",
    "siteKey": "championcross.jp",
    "matches": [
      "https://championcross.jp"
    ],
    "injectedCss": [
      "[class^='Original_section_title'] {overflow:hidden!important;}"
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
    ],
    "injectedCss": [
      "[class^='Original_section_title'] {overflow:hidden!important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "runoob",
    "siteKey": "www.runoob.com",
    "matches": [
      "www.runoob.com"
    ],
    "excludeSelectors": [
      ".example_code"
    ]
  },
  {
    "id": "pixiv",
    "siteKey": "www.pixiv.net",
    "matches": [
      "www.pixiv.net"
    ],
    "injectedCss": [
      "[id*='expandable-paragraph'] {max-height:unset!important;}"
    ]
  },
  {
    "id": "nicovideo",
    "siteKey": "seiga.nicovideo.*",
    "matches": [
      "seiga.nicovideo.*/watch/mg*"
    ],
    "excludeSelectors": [
      ".page"
    ],
    "mutationExcludeSelectors": [
      ".stream_comment"
    ],
    "isHighDynamic": true
  },
  {
    "id": "h5_nicovideo",
    "siteKey": "sp.*.nicovideo.*",
    "matches": [
      "sp.*.nicovideo.*/watch/mg*"
    ],
    "mutationExcludeSelectors": [
      ".stream_comment"
    ],
    "isHighDynamic": true
  },
  {
    "id": "frontendmasters",
    "siteKey": "frontendmasters.com",
    "matches": [
      "frontendmasters.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "udacity",
    "siteKey": "udacity.com",
    "matches": [
      "*.udacity.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "tubitv",
    "siteKey": "tubitv.com",
    "matches": [
      "tubitv.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "iaabcfoundation",
    "siteKey": "learning.iaabcfoundation.org",
    "matches": [
      "learning.iaabcfoundation.org"
    ],
    "excludeSelectors": [
      "[data-testid=\"video-player\"]"
    ],
    "mutationExcludeSelectors": [
      "[data-testid=\"video-player\"] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "domestika",
    "siteKey": "www.domestika.org",
    "matches": [
      "www.domestika.org"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "barrons",
    "siteKey": "www.barrons.com",
    "matches": [
      "www.barrons.com"
    ],
    "injectedCss": [
      "font.immersive-translate-target-wrapper > br {display:none;}"
    ]
  },
  {
    "id": "scrimba",
    "siteKey": "scrimba.com",
    "matches": [
      "scrimba.com"
    ],
    "injectedCss": [
      "[class*='trunc'] {-webkit-line-clamp: unset !important;}",
      ".tile {overflow: scroll;}"
    ]
  },
  {
    "id": "hbomax",
    "siteKey": "play.max.com",
    "matches": [
      "play.max.com",
      "play.hbomax.com"
    ],
    "excludeSelectors": [
      "[data-testid='playerContainer']",
      "[data-testid='CueBoxContainer']"
    ],
    "mutationExcludeSelectors": [
      "[data-testid='playerContainer'] *",
      "[data-testid='CueBoxContainer'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "mindvalley",
    "siteKey": "home.mindvalley.com",
    "matches": [
      "home.mindvalley.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "viki",
    "siteKey": "www.viki.com",
    "matches": [
      "www.viki.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "masterclass",
    "siteKey": "www.masterclass.com",
    "matches": [
      "www.masterclass.com",
      "learn.microsoft.com"
    ],
    "excludeSelectors": [
      ".mc-video--text-track"
    ],
    "mutationExcludeSelectors": [
      ".mc-video--text-track *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "slideslive",
    "siteKey": "slideslive.com",
    "matches": [
      "slideslive.com"
    ],
    "excludeSelectors": [
      ".slp__video"
    ],
    "mutationExcludeSelectors": [
      ".slp__video *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "viu",
    "siteKey": "www.viu.com",
    "matches": [
      "www.viu.com"
    ],
    "excludeSelectors": [
      ".bmpui-ui-viu-subtitle-overlay"
    ],
    "mutationExcludeSelectors": [
      ".bmpui-ui-viu-subtitle-overlay *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "linkin",
    "siteKey": "linkedin.com",
    "matches": [
      "*.linkedin.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "injectedCss": [
      ".linked-area * {max-height: unset !important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "kanopy",
    "siteKey": "kanopy.com",
    "matches": [
      "*.kanopy.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "iflix",
    "siteKey": "www.iflix.com",
    "matches": [
      "www.iflix.com",
      "wetv.vip"
    ],
    "excludeSelectors": [
      ".text-track"
    ],
    "mutationExcludeSelectors": [
      ".player-wrapper *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "app.rapidlaunch.wtf",
    "siteKey": "app.rapidlaunch.wtf",
    "matches": [
      "app.rapidlaunch.wtf"
    ],
    "excludeSelectors": [
      "div.border-b.border-gray-700\\/50.flex",
      "a.text-blue-400",
      ".flex.items-center.text-xs.text-gray-400",
      ".flex.items-center.gap-1\\.5.mb-1"
    ],
    "injectedCss": [
      ".max-h-24 { max-height: unset !important; }",
      ".line-clamp-2 {-webkit-line-clamp: unset !important;}"
    ]
  },
  {
    "id": "letsjelly",
    "siteKey": "app.letsjelly.com",
    "matches": [
      "app.letsjelly.com"
    ],
    "selectors": [
      ".message-content",
      ".h1-subject-button",
      ".cil-subject",
      ".cil-body-wrapper",
      ".text-body"
    ],
    "contentSelectors": [
      {
        "selector": ".message-content",
        "category": "content-block"
      },
      {
        "selector": ".h1-subject-button",
        "category": "content-block"
      },
      {
        "selector": ".cil-subject",
        "category": "content-block"
      },
      {
        "selector": ".cil-body-wrapper",
        "category": "content-block"
      },
      {
        "selector": ".text-body",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "imdb",
    "siteKey": "www.imdb.com",
    "matches": [
      "www.imdb.com",
      "m.imdb.com"
    ],
    "excludeSelectors": [
      ".jw-text-track-container"
    ],
    "mutationExcludeSelectors": [
      ".jw-text-track-container *"
    ],
    "injectedCss": [
      "[class*=overflow] {max-height:unset!important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "quark",
    "siteKey": "pan.quark.*",
    "matches": [
      "pan.quark.*"
    ],
    "excludeSelectors": [
      ".video-container"
    ],
    "mutationExcludeSelectors": [
      ".video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "espn",
    "siteKey": "espn.com",
    "matches": [
      "*.espn.com"
    ],
    "excludeSelectors": [
      "#fittPageContainer"
    ],
    "mutationExcludeSelectors": [
      "#fittPageContainer *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "orchestraltools",
    "siteKey": "www.orchestraltools.com",
    "matches": [
      "www.orchestraltools.com"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper *, .immersive-translate-target-wrapper {font-size: inherit !important;}"
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
    ],
    "excludeSelectors": [
      ".jw-wrapper",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".jw-wrapper *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "dailymotion",
    "siteKey": "dailymotion.com",
    "matches": [
      "*.dailymotion.com"
    ],
    "excludeSelectors": [
      ".player"
    ],
    "mutationExcludeSelectors": [
      ".player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "crunchyroll",
    "siteKey": "crunchyroll.com",
    "matches": [
      "*.crunchyroll.com"
    ],
    "excludeSelectors": [
      "#vilos",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#vilos *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "osmosis",
    "siteKey": "osmosis.org",
    "matches": [
      "*.osmosis.org"
    ],
    "excludeSelectors": [
      "#video-player-container",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#video-player-container *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "pbs",
    "siteKey": "pbs.org",
    "matches": [
      "*.pbs.org"
    ],
    "excludeSelectors": [
      ".wrapper",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".wrapper *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "internetfundamentals",
    "siteKey": "internetfundamentals.com",
    "matches": [
      "internetfundamentals.com"
    ],
    "excludeSelectors": [
      "#vjs_video_3",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#vjs_video_3 *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "mgtv",
    "siteKey": "w.mgtv.com",
    "matches": [
      "w.mgtv.com"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "themotionmagic",
    "siteKey": "player.hotmart.com",
    "matches": [
      "player.hotmart.com"
    ],
    "selectorMatches": [
      "iframe[src*='player.hotmart.com']"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "movie-web",
    "siteKey": "movie-web.app",
    "matches": [
      "movie-web.app/media*",
      "movie-web-me.vercel.app/media*",
      "*.vidbinge.com",
      "vidsrc.xyz"
    ],
    "excludeSelectors": [
      "#root"
    ],
    "mutationExcludeSelectors": [
      "#root *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "deeplearning",
    "siteKey": "learn.deeplearning.ai",
    "matches": [
      "learn.deeplearning.ai"
    ],
    "excludeSelectors": [
      "[data-layout=\"video\"]"
    ],
    "mutationExcludeSelectors": [
      "[data-layout=\"video\"] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "weverse",
    "siteKey": "weverse.io",
    "matches": [
      "weverse.io"
    ],
    "excludeSelectors": [
      ".pzp-pc__video"
    ],
    "mutationExcludeSelectors": [
      ".pzp-pc__video *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "docubay",
    "siteKey": "www.docubay.com",
    "matches": [
      "www.docubay.com"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "hubspotvideo",
    "siteKey": "hubspotvideo.com",
    "matches": [
      "*.hubspotvideo.com"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "quantinsti",
    "siteKey": "quantra.quantinsti.com",
    "matches": [
      "quantra.quantinsti.com"
    ],
    "excludeSelectors": [
      "#vjs_video_3"
    ],
    "mutationExcludeSelectors": [
      "#vjs_video_3 *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "paramountplus",
    "siteKey": "paramountplus.com",
    "matches": [
      "*.paramountplus.com"
    ],
    "excludeSelectors": [
      ".aa-player-skin"
    ],
    "mutationExcludeSelectors": [
      ".aa-player-skin *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "pluto",
    "siteKey": "pluto.tv",
    "matches": [
      "pluto.tv"
    ],
    "excludeSelectors": [
      ".video-player-layout"
    ],
    "mutationExcludeSelectors": [
      ".video-player-layout *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "ted",
    "siteKey": "www.ted.com",
    "matches": [
      "www.ted.com"
    ],
    "excludeSelectors": [
      "#video"
    ],
    "mutationExcludeSelectors": [
      "#video *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "devEpicGames",
    "siteKey": "dev.epicgames.com",
    "matches": [
      "dev.epicgames.com"
    ],
    "excludeSelectors": [
      ".vjs-poster"
    ],
    "mutationExcludeSelectors": [
      ".vjs-poster *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "hikaritv",
    "siteKey": "boosterx.stream",
    "matches": [
      "boosterx.stream"
    ],
    "excludeSelectors": [
      ".jw-wrapper"
    ],
    "mutationExcludeSelectors": [
      ".jw-wrapper *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "khflix",
    "siteKey": "khflix.com",
    "matches": [
      "khflix.com",
      "watch.globaltv.com"
    ],
    "excludeSelectors": [
      "#video-playlist"
    ],
    "mutationExcludeSelectors": [
      "#video-playlist *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "donghuaworld",
    "siteKey": "dwserver.donghuaworld.com",
    "matches": [
      "dwserver.donghuaworld.com"
    ],
    "excludeSelectors": [
      ".jw-media"
    ],
    "mutationExcludeSelectors": [
      ".jw-media *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "lecturio",
    "siteKey": "app.lecturio.com",
    "matches": [
      "app.lecturio.com"
    ],
    "excludeSelectors": [
      "#vjs_video_3"
    ],
    "mutationExcludeSelectors": [
      "#vjs_video_3 *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "ganjingworld",
    "siteKey": "www.ganjingworld.com",
    "matches": [
      "www.ganjingworld.com"
    ],
    "excludeSelectors": [
      ".vidPlayerWrap"
    ],
    "mutationExcludeSelectors": [
      ".vidPlayerWrap *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "fautv",
    "siteKey": "www.fau.tv",
    "matches": [
      "www.fau.tv"
    ],
    "excludeSelectors": [
      ".jw-wrapper"
    ],
    "mutationExcludeSelectors": [
      ".jw-wrapper *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "vimeo",
    "siteKey": "vimeo.com",
    "matches": [
      "vimeo.com",
      "training.leveleffect.com"
    ],
    "excludeSelectors": [
      ".vp-captions"
    ],
    "mutationExcludeSelectors": [
      ".vp-captions *"
    ],
    "isHighDynamic": true
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
    ],
    "selectors": [
      "span.vp-captions-line",
      "span[class^=CaptionsRenderer_]"
    ],
    "contentSelectors": [
      {
        "selector": "span.vp-captions-line",
        "category": "content-block"
      },
      {
        "selector": "span[class^=CaptionsRenderer_]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".vp-captions-line"
    ],
    "mutationExcludeSelectors": [
      ".vp-captions *",
      ".vp-captions-line *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "tv.adobe",
    "siteKey": "tv.adobe.com",
    "matches": [
      "https://*.tv.adobe.com"
    ],
    "excludeSelectors": [
      ".mpc-player"
    ],
    "mutationExcludeSelectors": [
      ".mpc-player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "threejs-journey",
    "siteKey": "threejs-journey.com",
    "matches": [
      "threejs-journey.com"
    ],
    "excludeSelectors": [
      ".video-area"
    ],
    "mutationExcludeSelectors": [
      ".video-area *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "comsol",
    "siteKey": "comsol.com",
    "matches": [
      "*.comsol.com"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
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
    ],
    "excludeSelectors": [
      ".w-captions",
      ".w-captions-line > div > span"
    ],
    "mutationExcludeSelectors": [
      ".w-captions *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "panopto",
    "siteKey": "southampton.cloud.panopto.eu_no_subitle",
    "matches": [
      "southampton.cloud.panopto.eu_no_subitle"
    ],
    "excludeSelectors": [
      ".primaryPlayer"
    ],
    "mutationExcludeSelectors": [
      ".primaryPlayer *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "edx",
    "siteKey": "edx.org",
    "matches": [
      "*.edx.org",
      "courses.mitxonline.mit.edu"
    ],
    "excludeSelectors": [
      ".closed-captions",
      ".wrapper-video-bottom-section",
      ".secondary-controls"
    ]
  },
  {
    "id": "ardmediathek",
    "siteKey": "www.ardmediathek.*",
    "matches": [
      "www.ardmediathek.*"
    ],
    "excludeSelectors": [
      ".ardplayer-viewport-addon-overlays"
    ],
    "mutationExcludeSelectors": [
      ".ardplayer-viewport-addon-overlays *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "bbc-iplayer",
    "siteKey": "www.bbc.*",
    "matches": [
      "https://www.bbc.*/iplayer*"
    ],
    "excludeSelectors": [
      ".player"
    ],
    "mutationExcludeSelectors": [
      ".player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "bbc-emp",
    "siteKey": "emp.bbc.*",
    "matches": [
      "https://emp.bbc.*/emp/*"
    ],
    "excludeSelectors": [
      ".p_accessibleHitArea"
    ],
    "mutationExcludeSelectors": [
      ".p_accessibleHitArea *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "bbc",
    "siteKey": "bbc.*",
    "matches": [
      "*.bbc.*"
    ],
    "selectors": [
      "#main-content",
      "article"
    ],
    "contentSelectors": [
      {
        "selector": "#main-content",
        "category": "content-block"
      },
      {
        "selector": "article",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      "section.module--languages",
      ".drop-capped",
      ".smp-toucan-player",
      "smp-subtitles",
      "#subtitle_subtitle2"
    ],
    "mutationExcludeSelectors": [
      "[data-testid='media-player-container-landscape'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "zdf.de",
    "siteKey": "www.zdf.de",
    "matches": [
      "www.zdf.de"
    ],
    "excludeSelectors": [
      ".zdfplayer-video-container",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".zdfplayer-video-container *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "disneyplus",
    "siteKey": "www.disneyplus.com",
    "matches": [
      "www.disneyplus.com"
    ],
    "excludeSelectors": [
      ".dss-hls-subtitle-overlay"
    ],
    "mutationExcludeSelectors": [
      ".dss-hls-subtitle-overlay *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "hulu",
    "siteKey": "hulu.com",
    "matches": [
      "https://*.hulu.com",
      "https://*.hulu.*"
    ],
    "excludeSelectors": [
      ".PlayerMetadata__subTitle",
      ".CaptionBox"
    ]
  },
  {
    "id": "youku.tv",
    "siteKey": "www.youku.tv",
    "matches": [
      "www.youku.tv"
    ],
    "excludeSelectors": [
      "#subtitle"
    ],
    "mutationExcludeSelectors": [
      "#subtitle *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "starz",
    "siteKey": "www.starz.com",
    "matches": [
      "www.starz.com"
    ],
    "excludeSelectors": [
      "starz-player"
    ],
    "mutationExcludeSelectors": [
      "starz-player *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "rtve",
    "siteKey": "www.rtve.*",
    "matches": [
      "www.rtve.*"
    ],
    "injectedCss": [
      ".errorHead * {font-size: 3.2rem!important;}"
    ]
  },
  {
    "id": "www.iq.com",
    "siteKey": "www.iq.com",
    "matches": [
      "www.iq.com"
    ],
    "excludeSelectors": [
      ".iqp-subtitle"
    ],
    "mutationExcludeSelectors": [
      ".iqp-subtitle *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "cbsnews",
    "siteKey": "www.cbsnews.com",
    "matches": [
      "www.cbsnews.com"
    ],
    "excludeSelectors": [
      ".avia-container"
    ],
    "mutationExcludeSelectors": [
      ".avia-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "gaia",
    "siteKey": "www.gaia.com",
    "matches": [
      "www.gaia.com"
    ],
    "excludeSelectors": [
      "video-js"
    ],
    "mutationExcludeSelectors": [
      "video-js *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "medbridge",
    "siteKey": "www.medbridge.com",
    "matches": [
      "www.medbridge.com"
    ],
    "excludeSelectors": [
      "#player-video"
    ],
    "mutationExcludeSelectors": [
      "#player-video *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "urplay",
    "siteKey": "urplay.se",
    "matches": [
      "urplay.se"
    ],
    "excludeSelectors": [
      ".jw-media"
    ],
    "mutationExcludeSelectors": [
      ".jw-media *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "medici",
    "siteKey": "www.medici.tv",
    "matches": [
      "www.medici.tv"
    ],
    "excludeSelectors": [
      "#player-movie-page"
    ],
    "mutationExcludeSelectors": [
      "#player-movie-page *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "asu",
    "siteKey": "api.playposit.com",
    "matches": [
      "api.playposit.com"
    ],
    "excludeSelectors": [
      "#overlay-container"
    ],
    "mutationExcludeSelectors": [
      "#overlay-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "gagaoolala",
    "siteKey": "www.gagaoolala.com",
    "matches": [
      "www.gagaoolala.com"
    ],
    "excludeSelectors": [
      "#gl-id-video-container"
    ],
    "mutationExcludeSelectors": [
      "#gl-id-video-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "curiositystream",
    "siteKey": "curiositystream.com",
    "matches": [
      "curiositystream.com"
    ],
    "excludeSelectors": [
      "[data-testid=\"video-player\"]"
    ],
    "mutationExcludeSelectors": [
      "[data-testid=\"video-player\"] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "shangpaAcademy",
    "siteKey": "shangpa-academy.mn.co",
    "matches": [
      "shangpa-academy.mn.co"
    ],
    "excludeSelectors": [
      ".mighty-video-player-container"
    ],
    "mutationExcludeSelectors": [
      ".mighty-video-player-container *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "ucdavis",
    "siteKey": "aggievideo.canvas.ucdavis.edu",
    "matches": [
      "aggievideo.canvas.ucdavis.edu"
    ],
    "excludeSelectors": [
      "[data-testid=\"video-player\"]"
    ],
    "mutationExcludeSelectors": [
      "[data-testid=\"video-player\"] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "f1tv",
    "siteKey": "f1tv.formula1.com",
    "matches": [
      "f1tv.formula1.com"
    ],
    "excludeSelectors": [
      "#main-embeddedPlayer"
    ],
    "mutationExcludeSelectors": [
      "#main-embeddedPlayer *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "datacamp",
    "siteKey": "projector.datacamp.com",
    "matches": [
      "projector.datacamp.com"
    ],
    "excludeSelectors": [
      ".video"
    ],
    "mutationExcludeSelectors": [
      ".video *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "imigresen-online",
    "siteKey": "imigresen-online.imi.gov.my",
    "matches": [
      "imigresen-online.imi.gov.my"
    ],
    "excludeSelectors": [
      "#clock"
    ]
  },
  {
    "id": "orvehogar",
    "siteKey": "www.orvehogar.com",
    "matches": [
      "www.orvehogar.com"
    ],
    "injectedCss": [
      "h3.vtex-product-summary-2-x-productNameContainer{height: unset!important;}"
    ]
  },
  {
    "id": "coindesk",
    "siteKey": "www.coindesk.com",
    "matches": [
      "www.coindesk.com"
    ],
    "excludeSelectors": [
      "[data-subtitles-container='true']"
    ],
    "mutationExcludeSelectors": [
      "[data-subtitles-container='true'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "dr",
    "siteKey": "dr.dk",
    "matches": [
      "*.dr.dk"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display > div",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display > div *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "nrk",
    "siteKey": "tv.nrk.no",
    "matches": [
      "tv.nrk.no"
    ],
    "excludeSelectors": [
      "tv-player[data-testid=\"tv-player\"]",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "tv-player[data-testid=\"tv-player\"] *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "mediadelivery",
    "siteKey": "iframe.mediadelivery.net",
    "matches": [
      "iframe.mediadelivery.net"
    ],
    "excludeSelectors": [
      ".plyr__captions",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".plyr__captions *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "tver",
    "siteKey": "tver.jp",
    "matches": [
      "tver.jp"
    ],
    "excludeSelectors": [
      "div[class*=\"player_container\"]",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "div[class*=\"player_container\"] *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "aljazeera",
    "siteKey": "www.aljazeera.com",
    "matches": [
      "www.aljazeera.com"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "arte",
    "siteKey": "www.arte.tv",
    "matches": [
      "www.arte.tv"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "updraft",
    "siteKey": "updraft.cyfrin.io",
    "matches": [
      "updraft.cyfrin.io"
    ],
    "excludeSelectors": [
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "learningSap",
    "siteKey": "learning.sap.com",
    "matches": [
      "learning.sap.com"
    ],
    "excludeSelectors": [
      ".playkit-subtitles",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".playkit-subtitles",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "feynmanlectures",
    "siteKey": "www.feynmanlectures.caltech.edu",
    "matches": [
      "www.feynmanlectures.caltech.edu"
    ],
    "excludeSelectors": [
      ".videoview",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      ".videoview",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "archiveToday",
    "siteKey": "archive.today",
    "matches": [
      "archive.today",
      "archive.ph",
      "archive.is",
      "archive.md"
    ],
    "excludeSelectors": [
      "#HEADER"
    ]
  },
  {
    "id": "arxiv-vanity.com",
    "siteKey": "www.arxiv-vanity.com",
    "matches": [
      "www.arxiv-vanity.com"
    ],
    "excludeSelectors": [
      ".arxiv-vanity-wrapper"
    ]
  },
  {
    "id": "bardGoogle",
    "siteKey": "bard.google.com",
    "matches": [
      "bard.google.com"
    ],
    "excludeSelectors": [
      "mat-sidenav",
      "div.capabilities-disclaimer",
      "#cdk-overlay-6",
      "message-actions button",
      ".mdc-button__label .ng-star-inserted",
      ".mdc-list-item__primary-text"
    ]
  },
  {
    "id": "chatGoogle",
    "siteKey": "chat.google.com",
    "matches": [
      "chat.google.com"
    ],
    "selectors": [
      "[jsname=bgckF]"
    ],
    "contentSelectors": [
      {
        "selector": "[jsname=bgckF]",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "gemini.google",
    "siteKey": "gemini.google.com",
    "matches": [
      "gemini.google.com"
    ],
    "injectedCss": [
      "[data-test-id=conversation] {height: unset!important;}"
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
    ],
    "selectors": [
      "p ms-cmark-node"
    ],
    "contentSelectors": [
      {
        "selector": "p ms-cmark-node",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".o_35",
      "[style*='Google Symbols']",
      "md-icon-button",
      ".material-symbols-outlined",
      ".cfc-result-card-table",
      ".material-symbols",
      ".gemini-large-text__overlay",
      "code",
      "view-line",
      "#modelSelector",
      ".leaderboard-content",
      "#selected-count",
      "#selected-cat"
    ],
    "injectedCss": [
      ".scSearchSearch_results_listSearchresultslistsnippet { -webkit-line-clamp:unset;}"
    ]
  },
  {
    "id": "arxiv",
    "siteKey": "browse.arxiv.org",
    "matches": [
      "https://browse.arxiv.org",
      "https://arxiv.org/html/*"
    ],
    "selectors": [
      "article",
      ".ltx_abstract"
    ],
    "contentSelectors": [
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": ".ltx_abstract",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".desktop_header",
      "[class*='ltx_lst_language_']",
      "div.package-alerts",
      ".ltx_toclist",
      ".ltx_authors",
      ".ltx_bibliography"
    ]
  },
  {
    "id": "ar5iv",
    "siteKey": "ar5iv.labs.arxiv.org",
    "matches": [
      "ar5iv.labs.arxiv.org"
    ],
    "selectors": [
      ".ltx_p"
    ],
    "contentSelectors": [
      {
        "selector": ".ltx_p",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".ltx_bibliography",
      ".ltx_tag.ltx_tag_item",
      ".ltx_listing.ltx_lstlisting.ltx_listing",
      ".ltx_eqn_table"
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
    ],
    "excludeSelectors": [
      ".audio-duration",
      "[data-qa='card-item-count']"
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
    ],
    "excludeSelectors": [
      "[class='css-146c3p1 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-1iln25a']",
      "[class='css-175oi2r r-1la3zjv r-3o4zer']",
      "[data-testid^=homeScreenFeedTabs]",
      "[class='css-146c3p1 r-1loqt21']",
      "[class='css-1jxf684 r-1loqt21']",
      "[data-testid^=repostCount]",
      "[data-testid^=likeCount]",
      "[data-testid^=quoteCount]",
      "[data-testid^=replyBtn]",
      "[aria-label='View profile']"
    ],
    "injectedCss": [
      ".r-xoduu5 {display:inline!important;}",
      "[style*='-webkit-line-clamp'] {-webkit-line-clamp:unset!important;}"
    ]
  },
  {
    "id": "peacocktv",
    "siteKey": "peacocktv.com",
    "matches": [
      "*.peacocktv.com"
    ],
    "injectedCss": [
      ".video-player__subtitles__line > font,.video-player__subtitles__line:only-child{display:block;}"
    ]
  },
  {
    "id": "smzdm",
    "siteKey": "www.smzdm.com",
    "matches": [
      "www.smzdm.com"
    ],
    "excludeSelectors": [
      ".z-highlight",
      ".feed-block-info",
      ".z-feed-foot",
      ".feed-block-descripe",
      "#J_column_tab_box",
      ".crumbs"
    ]
  },
  {
    "id": "xiaohongshu.com",
    "siteKey": "www.xiaohongshu.com",
    "matches": [
      "www.xiaohongshu.com"
    ],
    "excludeSelectors": [
      ".author-wrapper",
      ".info",
      ".side-bar",
      ".interactions",
      ".show-more",
      ".bottom-container",
      ".total",
      ".reds-sticky"
    ],
    "blockMinTextCount": 6,
    "blockMinWordCount": 1
  },
  {
    "id": "notateslaapp",
    "siteKey": "www.notateslaapp.com",
    "matches": [
      "www.notateslaapp.com"
    ],
    "selectors": [
      ".nav > *"
    ],
    "contentSelectors": [
      {
        "selector": ".nav > *",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "eightfold",
    "siteKey": "eightfold.ai",
    "matches": [
      "*.eightfold.ai"
    ],
    "injectedCss": [
      ".flexbox{width:100%}"
    ]
  },
  {
    "id": "soundcloud",
    "siteKey": "soundcloud.com",
    "matches": [
      "soundcloud.com"
    ],
    "excludeSelectors": [
      ".searchTitle__textContent",
      ".searchOptions__container",
      ".compactTrackListItem__additional",
      ".soundTitle__tagContainer",
      ".searchResultGroupHeading",
      ".sc-ministats-group",
      ".compactTrackList__moreLink",
      ".sound__soundActions"
    ],
    "injectedCss": [
      ".compactTrackListItem {height: unset !important;}"
    ]
  },
  {
    "id": "section.blog.naver.com",
    "siteKey": "section.blog.naver.com",
    "matches": [
      "section.blog.naver.com"
    ],
    "selectors": [
      ".item",
      ".heading a",
      ".info_find a"
    ],
    "contentSelectors": [
      {
        "selector": ".item",
        "category": "content-block"
      },
      {
        "selector": ".heading a",
        "category": "content-block"
      },
      {
        "selector": ".info_find a",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".comments",
      ".time"
    ]
  },
  {
    "id": "hadoop.apache.org",
    "siteKey": "hadoop.apache.org",
    "matches": [
      "hadoop.apache.org"
    ],
    "excludeSelectors": [
      ".xleft",
      ".xright",
      "#navcolumn"
    ]
  },
  {
    "id": "docs.unity3d",
    "siteKey": "docs.unity3d.com",
    "matches": [
      "docs.unity3d.com"
    ],
    "selectors": [
      ".tooltip > .tooltiptext",
      "body"
    ],
    "contentSelectors": [
      {
        "selector": ".tooltip > .tooltiptext",
        "category": "content-block"
      },
      {
        "selector": "body",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      ".immersive-translate-target-inner .tooltiptext {display: none;}",
      ".immersive-translate-target-inner .tooltip {cursor:pointer;border-bottom:unset;}"
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
    ],
    "selectors": [
      ".article_abstract",
      ".article_header-title",
      "[property=\"articleBody\"]"
    ],
    "contentSelectors": [
      {
        "selector": ".article_abstract",
        "category": "content-block"
      },
      {
        "selector": ".article_header-title",
        "category": "content-block"
      },
      {
        "selector": "[property=\"articleBody\"]",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".articleHeaderDropzone2",
      "header"
    ]
  },
  {
    "id": "archiveofourown-chapter",
    "siteKey": "archiveofourown.org",
    "matches": [
      "archiveofourown.org/works*chapters/*"
    ],
    "excludeSelectors": [
      ".meta,.navigation,.byline,.pagination,.datetime,.stats",
      "#add_comment",
      "#footer",
      ".summary > h3",
      ".notes > h3"
    ]
  },
  {
    "id": "archiveofourown",
    "siteKey": "archiveofourown.org",
    "matches": [
      "archiveofourown.org"
    ],
    "excludeSelectors": [
      ".meta,.navigation,.byline,.pagination,.datetime,.stats",
      "#add_comment",
      "#footer",
      ".summary > h3",
      ".notes > h3"
    ]
  },
  {
    "id": "bitwarden.com",
    "siteKey": "bitwarden.com",
    "matches": [
      "bitwarden.com"
    ],
    "excludeSelectors": [
      ".status-widget__state"
    ]
  },
  {
    "id": "www.ey.com",
    "siteKey": "www.ey.com",
    "matches": [
      "www.ey.com"
    ],
    "injectedCss": [
      ".up-rich-text__container {height: unset!important;}"
    ]
  },
  {
    "id": "yodayo.chat",
    "siteKey": "yodayo.com",
    "matches": [
      "https://yodayo.com/*/chat/*"
    ],
    "selectors": [
      ".inline-flex span"
    ],
    "contentSelectors": [
      {
        "selector": ".inline-flex span",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "ipinfo",
    "siteKey": "ipinfo.io",
    "matches": [
      "ipinfo.io"
    ],
    "injectedCss": [
      ".text-bali-hai-primary:last-child {display:none!important;}"
    ]
  },
  {
    "id": "help.maxon.net",
    "siteKey": "help.maxon.net",
    "matches": [
      "help.maxon.net"
    ],
    "excludeSelectors": [
      "#contentBody"
    ]
  },
  {
    "id": "character.ai",
    "siteKey": "character.ai",
    "matches": [
      "character.ai"
    ],
    "selectors": [
      ".auto-content",
      ".auto-content *",
      "#chat-messages > .group:first-child .prose *",
      "#chat-messages > .group:not(:first-child) .font-display *"
    ],
    "contentSelectors": [
      {
        "selector": ".auto-content",
        "category": "content-block"
      },
      {
        "selector": ".auto-content *",
        "category": "content-block"
      },
      {
        "selector": "#chat-messages > .group:first-child .prose *",
        "category": "content-block"
      },
      {
        "selector": "#chat-messages > .group:not(:first-child) .font-display *",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper br {display:none;}",
      "[imt-state=dual] .prose p {margin:0;}"
    ],
    "advanceMergeConfig": [
      {
        "condition": "true",
        "advanceConfig": {
          "dynamicPreset": "chat-stream",
          "isHighDynamic": true
        }
      }
    ],
    "isHighDynamic": true
  },
  {
    "id": "queenslibrary.org",
    "siteKey": "queenslibrary.org",
    "matches": [
      "queenslibrary.org"
    ],
    "excludeSelectors": [
      "#Web-QBPL-Menu"
    ],
    "injectedCss": [
      "font.notranslate { all: unset!important;}"
    ]
  },
  {
    "id": "ac.nowcoder",
    "siteKey": "ac.nowcoder.com",
    "matches": [
      "ac.nowcoder.com"
    ],
    "excludeSelectors": [
      ".answer-module",
      ".question-intr",
      ".language-list",
      ".question-oi"
    ]
  },
  {
    "id": "chromium",
    "siteKey": "chromium.org",
    "matches": [
      "*.chromium.org"
    ],
    "excludeSelectors": [
      "ancestors-breadcrumbs",
      "depth-finder[role='tree']",
      "repository-detail",
      "issue-metadata-sidebar",
      "nav",
      ".bv2-event-user",
      ".b-description-heading",
      "b-attachment-viewer",
      "i"
    ],
    "injectedCss": [
      "font svg {display:none;}"
    ]
  },
  {
    "id": "ffmpeg",
    "siteKey": "ffmpeg.org",
    "matches": [
      "ffmpeg.org"
    ],
    "excludeSelectors": [
      ".memproto",
      ".memtitle"
    ]
  },
  {
    "id": "podcasts",
    "siteKey": "podcasts.apple.com",
    "matches": [
      "podcasts.apple.com"
    ],
    "excludeSelectors": [
      ".detailed-play-button-wrapper"
    ],
    "injectedCss": [
      ".multiline-clamp { display: flex!important;flex-direction: column; }",
      ".headings__title,.powerswoosh__title,[data-testid=truncate-text] {-webkit-line-clamp:unset!important;}",
      ".show-artwork {height:fit-content!important;}",
      ".powerswoosh__lockup-details-container,.powerswoosh__chin,[data-testid=amp-review__text] {max-height:unset!important;height:unset!important;}",
      ".episode-hero__overlay {overflow:auto!important;}",
      "ul .multiline-clamp {display:unset!important;}"
    ]
  },
  {
    "id": "sp-codeSites",
    "siteKey": "docs.wxwidgets.org",
    "matches": [
      "docs.wxwidgets.org"
    ],
    "excludeSelectors": [
      ".doxygen-awesome-fragment-wrapper"
    ],
    "injectedCss": [
      ".textblock p > font{display:flex;}"
    ]
  },
  {
    "id": "wayfair",
    "siteKey": "www.wayfair.com",
    "matches": [
      "www.wayfair.com"
    ],
    "injectedCss": [
      "[data-enzyme-id=\"Collapse-Collapsible\"] {height:unset!important;}"
    ]
  },
  {
    "id": "followis",
    "siteKey": "app.follow.is",
    "matches": [
      "https://app.follow.is/feeds/*"
    ],
    "excludeSelectors": [
      ".bg-native",
      "main > div > div.h-full:first-child span"
    ],
    "injectedCss": [
      "[class*='line-clamp'] {-webkit-line-clamp:unset;}"
    ]
  },
  {
    "id": "svelte",
    "siteKey": "svelte.dev",
    "matches": [
      "svelte.dev/docs/*",
      "learn.svelte.dev"
    ],
    "selectors": [
      ".text"
    ],
    "contentSelectors": [
      {
        "selector": ".text",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "gitpod",
    "siteKey": "www.gitpod.io",
    "matches": [
      "www.gitpod.io/docs/*"
    ],
    "selectors": [
      ".content-docs"
    ],
    "contentSelectors": [
      {
        "selector": ".content-docs",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "service-now",
    "siteKey": "service-now.com",
    "matches": [
      "*.service-now.com"
    ],
    "selectors": [
      "article",
      ".email-content",
      "section"
    ],
    "contentSelectors": [
      {
        "selector": "article",
        "category": "content-block"
      },
      {
        "selector": ".email-content",
        "category": "content-block"
      },
      {
        "selector": "section",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "realpython",
    "siteKey": "realpython.com",
    "matches": [
      "realpython.com"
    ],
    "selectors": [
      "h1",
      "h2",
      ".my-0",
      ".my-1",
      ".article-body",
      "table-of-contents",
      "#disqus_recommendations"
    ],
    "contentSelectors": [
      {
        "selector": "h1",
        "category": "content-block"
      },
      {
        "selector": "h2",
        "category": "content-block"
      },
      {
        "selector": ".my-0",
        "category": "content-block"
      },
      {
        "selector": ".my-1",
        "category": "content-block"
      },
      {
        "selector": ".article-body",
        "category": "content-block"
      },
      {
        "selector": "table-of-contents",
        "category": "content-block"
      },
      {
        "selector": "#disqus_recommendations",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "casino",
    "siteKey": "www.casino.org",
    "matches": [
      "www.casino.org"
    ],
    "excludeSelectors": [
      ".material-symbols-outlined"
    ]
  },
  {
    "id": "wisdom",
    "siteKey": "wisdom.nec.com",
    "matches": [
      "wisdom.nec.com"
    ],
    "injectedCss": [
      "a > font {width: max-content;}"
    ]
  },
  {
    "id": "www.acrobiosystems.com",
    "siteKey": "www.acrobiosystems.com",
    "matches": [
      "www.acrobiosystems.com"
    ],
    "injectedCss": [
      ".productDetialDetail .productLink {overflow: hidden;}",
      ".productDetialDetail .productLink .box a {display: flex; justify-content: center; white-space: nowrap;}"
    ]
  },
  {
    "id": "www.metacritic.com",
    "siteKey": "www.metacritic.com",
    "matches": [
      "www.metacritic.com"
    ],
    "injectedCss": [
      ".c-finderProductCard_info .c-finderProductCard_meta {display: block;}"
    ]
  },
  {
    "id": "motrix.app",
    "siteKey": "motrix.app",
    "matches": [
      "motrix.app"
    ],
    "excludeSelectors": [
      ".download-section__right .el-tabs__nav"
    ]
  },
  {
    "id": "xgo",
    "siteKey": "www.xgo.ing",
    "matches": [
      "www.xgo.ing"
    ],
    "injectedCss": [
      "[class*='line-clamp']{-webkit-line-clamp:unset !important;}"
    ]
  },
  {
    "id": "nebula.starbreeze",
    "siteKey": "nebula.starbreeze.com",
    "matches": [
      "https://nebula.starbreeze.com/support"
    ],
    "injectedCss": [
      "main section>div {overflow-y:scroll !important;}",
      "main section>div::-webkit-scrollbar {display: none;width: 0px;background: transparent;}"
    ]
  },
  {
    "id": "app.schildi.chat",
    "siteKey": "app.schildi.chat",
    "matches": [
      "app.schildi.chat"
    ],
    "excludeSelectors": [
      ".mx_DisambiguatedProfile",
      ".mx_MessageTimestamp",
      ".mx_EventTile_avatar"
    ]
  },
  {
    "id": "balthild",
    "siteKey": "balthild.github.io",
    "matches": [
      "balthild.github.io"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper [aria-hidden=true] {display:none;}"
    ]
  },
  {
    "id": "csust",
    "siteKey": "tsgvpn2.csust.edu.cn",
    "matches": [
      "tsgvpn2.csust.edu.cn"
    ],
    "injectedCss": [
      "h2 {font-size:unset;}"
    ]
  },
  {
    "id": "translation-font-size-unset",
    "siteKey": "m.yxlady.com",
    "matches": [
      "m.yxlady.com",
      "web3.fireverseai.com"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper, .immersive-translate-target-translation-block-wrapper, .immersive-translate-target-inner { font-size: unset; }"
    ]
  },
  {
    "id": "ml4vis",
    "siteKey": "ml4vis.github.io",
    "matches": [
      "ml4vis.github.io"
    ],
    "excludeSelectors": [
      ".jss45"
    ]
  },
  {
    "id": "www.dgl.ai",
    "siteKey": "www.dgl.ai",
    "matches": [
      "www.dgl.ai"
    ],
    "excludeSelectors": [
      "header"
    ]
  },
  {
    "id": "monmouthcoffee",
    "siteKey": "www.monmouthcoffee.*",
    "matches": [
      "www.monmouthcoffee.*"
    ],
    "excludeSelectors": [
      "#basket"
    ]
  },
  {
    "id": "sakura",
    "siteKey": "www.sakura.fm",
    "matches": [
      "www.sakura.fm"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper, .immersive-translate-target-translation-block-wrapper, .immersive-translate-target-inner span { opacity: 1 !important; }"
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
    ],
    "injectedCss": [
      ".article-body {column-count:unset;-webkit-column-count:unset;-moz-column-count:unset;}"
    ]
  },
  {
    "id": "novel-site",
    "siteKey": "www.piaotia.com",
    "matches": [
      "www.piaotia.com",
      "www.zhenhunxiaoshuo.com",
      "www.hetushu.com"
    ],
    "injectedCss": [
      ".centent ul { display: flex; }",
      ".centent ul li { height: unset !important; float: none !important; }",
      "article.excerpt { white-space: normal !important; overflow: visible !important; }",
      "#dir dd { white-space: normal !important; overflow: visible !important; }"
    ]
  },
  {
    "id": "xianqihaotianmi",
    "siteKey": "www.xianqihaotianmi.org",
    "matches": [
      "www.xianqihaotianmi.org"
    ],
    "injectedCss": [
      ".list-charts { display: flex; flex-wrap: wrap; }",
      ".list-charts li { white-space: normal !important; overflow: visible !important; }"
    ]
  },
  {
    "id": "sobqg",
    "siteKey": "www.sobqg.com",
    "matches": [
      "www.sobqg.com/book/*"
    ],
    "excludeSelectors": [
      "#hot .g_book > span"
    ],
    "injectedCss": [
      "#volumes { display: flex; flex-wrap: wrap; }",
      "a.ell { white-space: normal !important; overflow: visible !important; }",
      "#hot .g_book > a > h3 { white-space: normal; overflow: visible; max-height: none; -webkit-line-clamp: none; }",
      "#hot .g_book { height: 330px; }"
    ]
  },
  {
    "id": "luminousfox",
    "siteKey": "www.luminousfox.com",
    "matches": [
      "www.luminousfox.com/book/*"
    ],
    "injectedCss": [
      "#detail_chapter .box_content ul li { height: unset !important; overflow: visible !important; }"
    ]
  },
  {
    "id": "doupocangqiong",
    "siteKey": "www.doupocangqiong.org",
    "matches": [
      "www.doupocangqiong.org"
    ],
    "injectedCss": [
      "#play_0 ul { display: grid; grid-template-columns: repeat(3, 1fr); }",
      "#play_0 ul li { height: unset !important; }"
    ]
  },
  {
    "id": "proko",
    "siteKey": "www.proko.com",
    "matches": [
      "www.proko.com"
    ],
    "excludeSelectors": [
      ".proko-preview-statistic-wrap",
      ".lesson-instructors-wrap",
      ".proko-comments-item-title",
      ".proko-comments-item-vote-wrap",
      ".course-card__details .border-outline075",
      ".category-subscribe"
    ],
    "injectedCss": [
      ".lesson-video-banner-skip,.lesson-title,.lesson-content,.course-card__details {height:unset!important;overflow:scroll;}",
      "[class*='clamp'],.course-card__description{-webkit-line-clamp:unset!important;overflow:unset;}",
      "proko-button{z-index:1;}",
      ".truncate {white-space:unset;}"
    ]
  },
  {
    "id": "vodtw",
    "siteKey": "www.vodtw.com",
    "matches": [
      "www.vodtw.com/book/*"
    ],
    "selectors": [
      "dl dd a"
    ],
    "contentSelectors": [
      {
        "selector": "dl dd a",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      "dl { display: flex; flex-wrap: wrap; }",
      "dl dd { white-space: normal !important; overflow: visible !important; }",
      "#info p { height: unset !important; }"
    ]
  },
  {
    "id": "jwxs",
    "siteKey": "www.jwxs.org",
    "matches": [
      "www.jwxs.org/book/*"
    ],
    "injectedCss": [
      "#list dd { height: 5rem !important; line-height: unset !important; }",
      ".readbtn .chapterlist { margin: unset !important; }"
    ]
  },
  {
    "id": "ceros",
    "siteKey": "view.ceros.com",
    "matches": [
      "view.ceros.com"
    ],
    "injectedCss": [
      ".page-object.group > .page-object.text > p { height: 100% !important; overflow: auto !important; }"
    ]
  },
  {
    "id": "xfiction.org",
    "siteKey": "xfiction.org",
    "matches": [
      "*.xfiction.org"
    ],
    "selectors": [
      "tw-story"
    ],
    "contentSelectors": [
      {
        "selector": "tw-story",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "aliexpress",
    "siteKey": "aliexpress.*",
    "matches": [
      "*.aliexpress.*"
    ],
    "excludeSelectors": [
      "[class*='multi--price']"
    ],
    "injectedCss": [
      "[class*='multi--title'],.G7dOC {-webkit-line-clamp:unset;}"
    ]
  },
  {
    "id": "ozon",
    "siteKey": "www.ozon.ru",
    "matches": [
      "www.ozon.ru"
    ],
    "injectedCss": [
      ".tile-clickable-element > div {-webkit-line-clamp:unset;}"
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
    ],
    "injectedCss": [
      "li {height:unset!important;}",
      ".big_box,article .text,article .title {height:unset!important;}"
    ]
  },
  {
    "id": "codeium",
    "siteKey": "codeium.com",
    "matches": [
      "codeium.com"
    ],
    "excludeSelectors": [
      "nav a[class*=C]"
    ]
  },
  {
    "id": "book-douban",
    "siteKey": "book.douban.com",
    "matches": [
      "book.douban.com"
    ],
    "excludeSelectors": [
      "a.author-name",
      "p.user > a",
      "div#collector > div > div[style^='padding-left'] > a",
      "div#info a"
    ]
  },
  {
    "id": "taobao",
    "siteKey": "taobao.com",
    "matches": [
      "*.taobao.com"
    ],
    "excludeSelectors": [
      ".text-price"
    ]
  },
  {
    "id": "graphcore",
    "siteKey": "www.graphcore.ai",
    "matches": [
      "www.graphcore.ai"
    ],
    "excludeSelectors": [
      ".morph"
    ]
  },
  {
    "id": "digitaltrends",
    "siteKey": "www.digitaltrends.com",
    "matches": [
      "www.digitaltrends.com"
    ],
    "selectors": [
      ".b-mem-post__title"
    ],
    "contentSelectors": [
      {
        "selector": ".b-mem-post__title",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      ".b-mem__inner .b-mem-post:first-child h3{-webkit-line-clamp: 2;}",
      ".b-mem__inner .b-mem-post:first-child .b-mem-post__excerpt{display:inline;}"
    ]
  },
  {
    "id": "jscires",
    "siteKey": "jscires.org",
    "matches": [
      "jscires.org"
    ],
    "selectors": [
      ".jatsauthtab_title"
    ],
    "contentSelectors": [
      {
        "selector": ".jatsauthtab_title",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".jatsa_contrib_info"
    ]
  },
  {
    "id": "vaseven",
    "siteKey": "www.vaseven.com",
    "matches": [
      "www.vaseven.com"
    ],
    "excludeSelectors": [
      ".et_pb_main_blurb_image"
    ]
  },
  {
    "id": "qidian",
    "siteKey": "www.qidian.com",
    "matches": [
      "www.qidian.com"
    ],
    "selectors": [
      ".type-list a"
    ],
    "contentSelectors": [
      {
        "selector": ".type-list a",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "alphaxiv",
    "siteKey": "www.alphaxiv.org",
    "matches": [
      "www.alphaxiv.org"
    ],
    "injectedCss": [
      "[class*=line-clamp] {-webkit-line-clamp:unset;}"
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
    ],
    "injectedCss": [
      "[class*='line-clamp-'] {-webkit-line-clamp: unset!important; max-height: unset!important;}"
    ]
  },
  {
    "id": "ollama",
    "siteKey": "ollama.com",
    "matches": [
      "ollama.com"
    ],
    "excludeSelectors": [
      "#file-explorer",
      "span[x-test-search-response-title]",
      "a[x-test-model-name]",
      "span[x-test-size]",
      "span[x-test-capability]"
    ]
  },
  {
    "id": "swaycloud",
    "siteKey": "sway.cloud.microsoft",
    "matches": [
      "sway.cloud.microsoft"
    ],
    "injectedCss": [
      ".text_wrapper ul li {max-height:unset!important;}",
      ".container {overflow:scroll;}"
    ]
  },
  {
    "id": "teacherspayteachers",
    "siteKey": "www.teacherspayteachers.com",
    "matches": [
      "www.teacherspayteachers.com/browse/*"
    ],
    "injectedCss": [
      ".ProductRowCard-module__cardTitleLink--YPqiC { display:unset !important; }"
    ]
  },
  {
    "id": "claudeartifacts",
    "siteKey": "claudeartifacts.com",
    "matches": [
      "claudeartifacts.com"
    ],
    "excludeSelectors": [
      "h1",
      "h3 + span.rounded-full",
      "[class='p-6 pt-0 flex justify-between items-center']",
      "[class='text-xs text-gray-500']"
    ]
  },
  {
    "id": "1password",
    "siteKey": "1password.com",
    "matches": [
      "*.1password.com"
    ],
    "excludeSelectors": [
      ".secret-key"
    ]
  },
  {
    "id": "descript",
    "siteKey": "www.descript.com",
    "matches": [
      "www.descript.com"
    ],
    "excludeSelectors": [
      "h1.home-hero"
    ],
    "injectedCss": [
      ".immersive-translate-target-wrapper, .immersive-translate-target-wrapper *{color:unset!important;}"
    ]
  },
  {
    "id": "law.mit.edu",
    "siteKey": "law.mit.edu",
    "matches": [
      "law.mit.edu"
    ],
    "injectedCss": [
      "@media screen and (min-width: 768px) { .pub-header-theme-light {top:-80% !important;} }"
    ]
  },
  {
    "id": "nextjs",
    "siteKey": "nextjs.org",
    "matches": [
      "nextjs.org"
    ],
    "injectedCss": [
      "[imt-state=dual] .styled-scrollbar ul li ul li ul li ul li a {white-space:nowrap!important;}",
      "[imt-state=dual] .styled-scrollbar ul li font.immersive-translate-target-wrapper {text-align: right;width: 100%;}"
    ]
  },
  {
    "id": "noon",
    "siteKey": "www.noon.com",
    "matches": [
      "www.noon.com"
    ],
    "excludeSelectors": [
      "[class*='priceContainer']",
      "[class*='ProductImageFooter']",
      "[class*='Nudges_nudges']"
    ],
    "injectedCss": [
      "[class*='ProductDetailsSection'] {-webkit-line-clamp:unset!important;}",
      "[class*='title'] {-webkit-line-clamp:unset!important;}"
    ]
  },
  {
    "id": "klibs",
    "siteKey": "klibs.io",
    "matches": [
      "klibs.io"
    ],
    "excludeSelectors": [
      "[class*='styles_footerWrapper']",
      "[class*='styles_searchFilterContainerWrapper']",
      "[class*='styles_headingWrapper']",
      "[class*='styles_navigation']",
      "[class*='styles_rightSideColumnWrapper']",
      ".breadcrumb"
    ],
    "injectedCss": [
      "[class*='styles_card'] {height:unset!important; -webkit-line-clamp:unset!important; max-height:unset!important;}"
    ]
  },
  {
    "id": "androidpolice",
    "siteKey": "www.androidpolice.com",
    "matches": [
      "www.androidpolice.com"
    ],
    "excludeSelectors": [
      ".author",
      ".w-total-info",
      ".images-header-menu-list",
      ".w-display-card-details",
      ".w-display-card-extra"
    ],
    "injectedCss": [
      ".display-card-title,.display-card-title * {height:unset!important;-webkit-line-clamp:unset!important;}"
    ]
  },
  {
    "id": "doc2x",
    "siteKey": "doc2x.com",
    "matches": [
      "doc2x.com",
      "doc2x.noedgeai.com"
    ],
    "excludeSelectors": [
      "#md-scroll-top-dom"
    ]
  },
  {
    "id": "trade",
    "siteKey": "axiom.trade",
    "matches": [
      "axiom.trade"
    ],
    "selectors": [
      "[class^=tweet-body_root] *"
    ],
    "contentSelectors": [
      {
        "selector": "[class^=tweet-body_root] *",
        "category": "content-block"
      }
    ]
  },
  {
    "id": "pytorch",
    "siteKey": "pytorch.org",
    "matches": [
      "pytorch.org"
    ],
    "excludeSelectors": [
      ".with-down-arrow",
      ".hello-bar",
      "[data-cta='join']"
    ]
  },
  {
    "id": "1688",
    "siteKey": "www.1688.com",
    "matches": [
      "www.1688.com"
    ],
    "injectedCss": [
      "[class^='defaultSubNav'],[class^='loginButton'] {height:unset!important;}",
      "[data-tracker='category'] > font {white-space:nowrap!important;}"
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
    ],
    "excludeSelectors": [
      ".chatd-message-userName"
    ],
    "injectedCss": [
      "[data-tid=m4b_overflow_text_multiply] {height:unset!important;-webkit-line-clamp:unset!important;}",
      "[class^=replyText],[class^=productItemInfo],[class^=reviewText] {height:unset!important;-webkit-line-clamp:unset!important;}"
    ]
  },
  {
    "id": "ccfddl",
    "siteKey": "ccfddl.com",
    "matches": [
      "ccfddl.com"
    ],
    "excludeSelectors": [
      "div.conf-timer > span[style^='color: black']"
    ]
  },
  {
    "id": "pinboard",
    "siteKey": "pinboard.in",
    "matches": [
      "pinboard.in"
    ],
    "injectedCss": [
      "div.blurb_box,div.homepage_quad,div.signup_button {height: unset !important;}",
      "h1.magazine_title {line-height: 1.2 !important;}"
    ]
  },
  {
    "id": "flutterDev",
    "siteKey": "docs.flutter.dev",
    "matches": [
      "docs.flutter.dev",
      "docs.flutter.cn"
    ],
    "excludeSelectors": [
      "span.expander.material-symbols",
      "span.material-symbols"
    ]
  },
  {
    "id": "dtmstation",
    "siteKey": "www.dtmstation.com",
    "matches": [
      "www.dtmstation.com"
    ],
    "selectors": [
      ".entry-card-title,.entry-card-snippet"
    ],
    "contentSelectors": [
      {
        "selector": ".entry-card-title,.entry-card-snippet",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      ".entry-card-title,.entry-card-snippet { -webkit-line-clamp: unset!important; max-height: unset!important;}"
    ]
  },
  {
    "id": "docs-tutorials",
    "siteKey": "docs.pytorch.org",
    "matches": [
      "docs.pytorch.org"
    ],
    "selectors": [
      ".tutorial-filter"
    ],
    "contentSelectors": [
      {
        "selector": ".tutorial-filter",
        "category": "content-block"
      }
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
    ],
    "injectedCss": [
      ".side_list a,.title a,.tit,.item-title {-webkit-line-clamp:unset!important;height:unset!important;}",
      "details {height:unset!important;}",
      ".product-title {height:unset!important;-webkit-line-clamp:unset!important;}",
      ".plugin-product-comment-content {height:unset!important;-webkit-line-clamp:unset!important;}",
      "div.jdd-product-info-box {height:unset!important;}",
      "span.hotData-text { -webkit-line-clamp: unset !important; line-clamp: unset !important;}",
      "div.line-clamp-4 { -webkit-line-clamp: unset; max-height: unset;}",
      "[class*='titleTypography'] {-webkit-line-clamp: unset !important;}",
      ".div-text-line-three { -webkit-line-clamp: unset; max-height: unset;}",
      ".data-title { -webkit-line-clamp: unset!important; max-height: unset!important;}",
      ".paper-title,.search-result-abstract.folded,.list-group-item-mod h5 { -webkit-line-clamp: unset!important; max-height: unset!important;}",
      ".kb-advanced-heading-link,.limited-text { -webkit-line-clamp: unset!important; max-height: unset!important;}",
      ".entry-card-title,.entry-card-snippet { -webkit-line-clamp: unset!important; max-height: unset!important;}",
      "span.line-clamp-2 { -webkit-line-clamp: unset!important; max-height: unset!important;}",
      ".css-1yo0yr8 {-webkit-line-clamp: unset!important; max-height: unset!important;}",
      "[class*='line-clamp-'],[class*='line-clamp-'] font {white-space:unset!important;-webkit-line-clamp: unset!important; max-height: unset!important;}",
      ".product-card__brand-wrap {white-space:unset;}",
      ".card-recommend-oneImg article h4 {max-height:unset;-webkit-line-clamp:unset;}",
      ".description__4cb8a {max-height:unset;-webkit-line-clamp:unset;}",
      ".link-container {height:unset!important;-webkit-line-clamp:unset!important;}"
    ],
    "isHighDynamic": true
  },
  {
    "id": "other-chatapps",
    "siteKey": "app.salesmartly.com",
    "matches": [
      "app.salesmartly.com/chat"
    ],
    "selectors": [
      ".chat__inbox_item_text_ordinary",
      ".ivu-tooltip [title]"
    ],
    "contentSelectors": [
      {
        "selector": ".chat__inbox_item_text_ordinary",
        "category": "content-block"
      },
      {
        "selector": ".ivu-tooltip [title]",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      "._ss_2FLBr4_u {height:unset!important;}"
    ]
  },
  {
    "id": "wistia-hook",
    "siteKey": "agencysupremacy.io",
    "matches": [
      "agencysupremacy.io",
      "dynamous.ai",
      "dynamous.wistia.com"
    ],
    "excludeSelectors": [
      "div[data-handle='captions']"
    ],
    "mutationExcludeSelectors": [
      "div[data-handle='captions'] *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "graphpad",
    "siteKey": "www.graphpad.com",
    "matches": [
      "www.graphpad.com"
    ],
    "excludeSelectors": [
      "div[data-handle='captions']",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "div[data-handle='captions'] *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
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
    ],
    "excludeSelectors": [
      "div[data-handle='captions']",
      "#immersive-translate-caption-window"
    ],
    "mutationExcludeSelectors": [
      "div[data-handle='captions'] *",
      "#immersive-translate-caption-window *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "barotem",
    "siteKey": "www.barotem.com",
    "matches": [
      "www.barotem.com"
    ],
    "injectedCss": [
      ".product_name {-webkit-line-clamp: unset!important;}",
      ".lists_goods_content > div {height: unset!important; min-height: 76px}",
      ".immersive-translate-target-inner {font-family: sans-serif !important;}"
    ]
  },
  {
    "id": "msn",
    "siteKey": "www.msn.com",
    "matches": [
      "www.msn.com"
    ],
    "excludeSelectors": [
      ".attribution",
      ".super-nav-container",
      "#follow-button",
      ".media-info-container",
      ".ad-label",
      ".provider-name",
      ".weather-container",
      ".money-info-content",
      "casual-games-card",
      ".match-data",
      ".me-stripe-container"
    ],
    "injectedCss": [
      ".root {overflow-y: scroll!important;}",
      ".heading {-webkit-line-clamp: unset!important;}",
      ".content .text {overflow-y: scroll !important;}"
    ]
  },
  {
    "id": "edclub.com",
    "siteKey": "www.edclub.com",
    "matches": [
      "www.edclub.com"
    ],
    "excludeSelectors": [
      ".vjs-text-track-display"
    ],
    "mutationExcludeSelectors": [
      ".vjs-text-track-display *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "mediaspace",
    "siteKey": "mediaspace.illinois.edu",
    "matches": [
      "mediaspace.illinois.edu"
    ],
    "excludeSelectors": [
      ".playkit-overlay-action"
    ],
    "mutationExcludeSelectors": [
      ".playkit-overlay-action  *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "nbcnews",
    "siteKey": "www.nbcnews.com",
    "matches": [
      "www.nbcnews.com"
    ],
    "excludeSelectors": [
      ".jw-wrapper.jw-reset"
    ],
    "mutationExcludeSelectors": [
      ".jw-wrapper.jw-reset *"
    ],
    "isHighDynamic": true
  },
  {
    "id": "skool",
    "siteKey": "www.skool.com",
    "matches": [
      "www.skool.com"
    ],
    "excludeSelectors": [
      "[class^=styled__ShowMore]",
      "[class^=styled__UserNameText]",
      "[class^=styled__GroupNameWrapper]",
      "[class^=styled__ButtonWrapper]",
      "[class^=styled__LeaderboardsPreviewTitle]",
      "[class^=styled__ExpandRepliesWrapper]",
      "[class^=styled__GroupFeedLinkLabel]",
      "[class^=styled__HeaderLinks]",
      "[class^=styled__RecentActivityLabel]",
      "[class^=styled__PostedDate]",
      "[class^=styled__MemberInfo]",
      "[class^=styled__UserRoleTag]",
      "[class^=styled__DateAndLabelWrapper]",
      "[class^=styled__PinnedOverlay]",
      "[class^=styled__CommentsCount]",
      "[class^=styled__LastMessageTime]",
      "[class^=styled__LikeLabel]",
      "[class^=styled__TypographyWrapper]",
      "[class^=styled__MemberPercentage]",
      "[class^=styled__LevelBlockTitle]"
    ],
    "injectedCss": [
      ".erGJuk {max-height:unset!important;}"
    ]
  },
  {
    "id": "xiaosaas",
    "siteKey": "xiaosaas.com",
    "matches": [
      "*.xiaosaas.com"
    ],
    "excludeSelectors": [
      "p.marginRight10",
      "p.marginLeft10"
    ]
  },
  {
    "id": "freecodecamp",
    "siteKey": "www.freecodecamp.org",
    "matches": [
      "www.freecodecamp.org"
    ],
    "excludeSelectors": [
      ".monaco-mouse-cursor-text",
      ".challenge-preview"
    ]
  },
  {
    "id": "gta5-mods",
    "siteKey": "www.gta5-mods.com",
    "matches": [
      "www.gta5-mods.com"
    ],
    "excludeSelectors": [
      "#main-nav"
    ]
  },
  {
    "id": "cooperativa",
    "siteKey": "cooperativa.cl",
    "matches": [
      "cooperativa.cl"
    ],
    "injectedCss": [
      "font.notranslate {display:unset!important}"
    ]
  },
  {
    "id": "sdk-cooperate",
    "siteKey": "pandaily.com",
    "matches": [
      "pandaily.com"
    ],
    "excludeSelectors": [
      "[data-discover]",
      "header"
    ]
  },
  {
    "id": "read.amazon",
    "siteKey": "read.amazon.com",
    "matches": [
      "read.amazon.com"
    ],
    "selectors": [
      "span.kg-a11y-rel[role=text]"
    ],
    "contentSelectors": [
      {
        "selector": "span.kg-a11y-rel[role=text]",
        "category": "content-block"
      }
    ],
    "injectedCss": [
      "font { color:#333!important; white-space: pre-wrap;}",
      "p > font { position:absolute;left:0;right:0; }",
      ".kg-a11y-rel { background:white!important; }"
    ]
  },
  {
    "id": "dcinside",
    "siteKey": "dcinside.com",
    "matches": [
      "*.dcinside.com"
    ],
    "excludeSelectors": [
      ".num",
      ".time"
    ],
    "injectedCss": [
      ".time_best .typet_list li a {font-size:unset !important;}",
      "font {background:unset!important;padding:unset!important;}"
    ]
  },
  {
    "id": "f95zone",
    "siteKey": "f95zone.to",
    "matches": [
      "f95zone.to"
    ],
    "excludeSelectors": [
      ".pageNavWrapper",
      ".message-userExtras",
      ".message-name"
    ]
  },
  {
    "id": "marquee-gs",
    "siteKey": "marquee.gs.com",
    "matches": [
      "marquee.gs.com"
    ],
    "excludeSelectors": [
      "[class*='article-header-sub-header']",
      "[role=img]"
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
    ],
    "injectedCss": [
      "ul li {text-wrap:unset!important;}"
    ]
  },
  {
    "id": "folo",
    "siteKey": "app.folo.is",
    "matches": [
      "app.folo.is"
    ],
    "excludeSelectors": [
      "[role=button]"
    ]
  },
  {
    "id": "fontFmaily",
    "siteKey": "skyvipservices.com",
    "matches": [
      "skyvipservices.com",
      "book.novelpia.com"
    ],
    "injectedCss": [
      "font {display:block !important;}",
      "#book-box font {font-family:unset!important;}"
    ]
  },
  {
    "id": "arena",
    "siteKey": "lmarena.ai",
    "matches": [
      "lmarena.ai"
    ],
    "excludeSelectors": [
      "table"
    ]
  },
  {
    "id": "murlok",
    "siteKey": "murlok.io",
    "matches": [
      "murlok.io"
    ],
    "injectedCss": [
      ".vi-media-object {display:flex;}"
    ]
  },
  {
    "id": "vercel",
    "siteKey": "vercel.com",
    "matches": [
      "vercel.com"
    ],
    "excludeSelectors": [
      "[class^=fade-in-words]"
    ]
  },
  {
    "id": "moltbook",
    "siteKey": "www.moltbook.com",
    "matches": [
      "www.moltbook.com"
    ],
    "excludeSelectors": [
      "[class='flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-[#7c7c7c] mb-1.5 sm:mb-2 flex-wrap']",
      "[class='flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[#7c7c7c]']",
      "[class='flex items-center gap-2 p-2 rounded-lg transition-all duration-200 group animate-fadeIn bg-gradient-to-r from-[#ffd700]/10 to-transparent hover:from-[#ffd700]/20']",
      "[class='flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[32px] sm:min-w-[40px]']",
      "[class='bg-white border border-[#e0e0e0] rounded-lg overflow-hidden'] .p-2",
      "[class='text-xs text-[#818384] mb-2']",
      "[class='w-12 bg-[#161617] rounded-l-lg flex flex-col items-center py-3 text-sm']",
      "[class='bg-[#1a1a1b] px-4 py-3 flex items-center justify-between sticky top-[52px] z-40 rounded-t-lg border border-[#333] shadow-md']",
      "[class='flex items-center gap-3 text-xs text-[#818384]']",
      "a[class='text-[#d7dadc] font-medium hover:underline']"
    ],
    "injectedCss": [
      "[class*='line-clamp']{-webkit-line-clamp:unset !important;}"
    ]
  },
  {
    "id": "dynamic-repets",
    "siteKey": "khovar.tj",
    "matches": [
      "khovar.tj"
    ],
    "excludeSelectors": [
      ".slide_container [style*='position: absolute']"
    ]
  },
  {
    "id": "floatSites",
    "siteKey": "docs.stripe.com",
    "matches": [
      "docs.stripe.com"
    ],
    "injectedCss": [
      ".immersive-translate-target-translation-block-wrapper {display: inline !important;}"
    ]
  },
  {
    "id": "common-vtt-jw",
    "siteKey": "rottentomatoes.com",
    "matches": [
      "*.rottentomatoes.com",
      "megaplay.buzz",
      "www.brighttalk.com"
    ],
    "excludeSelectors": [
      ".jw-wrapper"
    ],
    "mutationExcludeSelectors": [
      ".jw-wrapper *"
    ],
    "isHighDynamic": true
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
    ],
    "excludeSelectors": [
      ".api-code",
      "pre.highlight.def"
    ],
    "mutationExcludeSelectors": [
      "body"
    ],
    "isHighDynamic": true
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
    ],
    "injectedCss": [
      "#main-content {overflow:unset;}",
      ".TextImage--inner {overflow:auto !important;}",
      "body{overflow-y:scroll!important;}",
      "li.expanded > div{ overflow:scroll; }",
      ".book_list ul li { height: unset !important; overflow: visible !important; }",
      "#tabs-content-wrap {overflow:scroll;}",
      ".ReactVirtualized__Grid__innerScrollContainer {overflow:scroll!important;}",
      ".b--wrap {overflow:scroll!important;}"
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
    ],
    "isHighDynamic": true
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
    ],
    "selectors": [
      ".btn"
    ],
    "contentSelectors": [
      {
        "selector": ".btn",
        "category": "content-block"
      }
    ],
    "excludeSelectors": [
      ".site-header"
    ],
    "injectedCss": [
      "[class*='line-clamp-'] {-webkit-line-clamp: unset!important; max-height: unset!important;}"
    ],
    "isHighDynamic": true
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
    ],
    "isHighDynamic": true
  }
] as const satisfies readonly WebTranslationRule[];
