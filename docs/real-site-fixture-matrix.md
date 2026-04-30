# Real Site Fixture Matrix

This matrix is the curated live-site companion to the offline DOM fixtures. It is intentionally organized by page type, because generic webpage translation failures usually come from using the wrong content model for the page shape.

Run the full matrix with:

```bash
npm run build
node scripts/real-site-regression.mjs --profile=fixture-matrix
```

Use focused filters while debugging:

```bash
IMT_REGRESSION_SITE_FILTER="github, mdn, react" node scripts/real-site-regression.mjs --profile=fixture-matrix
```

## Page Types

| Type | Representative Sites | Why This Type Matters |
| --- | --- | --- |
| `article` | Wikipedia Article, Nature Article, GitHub Blog | Long-form prose, headings, paragraphs, citations, sidebars. Link density should usually be a penalty. |
| `docs-code` | OpenAI Docs, MDN JavaScript Guide, React Reference | Documentation mixes prose, inline code, code blocks, API names, tables, and navigation. Code must stay original. |
| `github` | GitHub README, GitHub Issues | Mixed markdown, comments, labels, usernames, timestamps, code snippets, expandable sections. |
| `card-list` | Product Hunt, GitHub Trending, AlternativeTo | Repeated cards where titles are often links; this should not be treated like article navigation. |
| `video-list` | YouTube, Vimeo Watch, Dailymotion | High link density is normal; titles and descriptions should translate, metrics and buttons usually should not. |
| `commerce` | Amazon Product, eBay Search, Etsy Search | Product titles/descriptions should translate; prices, ratings, stock labels, and buttons need conservative handling. |
| `forum` | StackOverflow, Old Reddit, Hacker News | Post/comment bodies are useful; usernames, scores, timestamps, and controls are noise. |
| `social-feed` | X, Threads, Reddit | Dynamic feed content, hover cards, short text, usernames, metrics, route changes, and repeated cards. |
| `landing` | Inworld, PromptOT, Linear | Hero text, feature blocks, short headings/descriptions, animated sections, and fixed navigation. |
| `search-results` | Google Search, Bing Search, DuckDuckGo Search | Snippets and result titles matter; dates, URLs, ads, filters, and side controls need careful filtering. |
| `data-dashboard` | MetaTFT, MetaTFT Augments, Mobalytics TFT | Dense app-like lists/cards, game terms, icon-heavy rows, high dynamic updates, and many short labels. |
| `hover-tooltip` | Tactics Tools Hover, U.GG Champions, OP.GG Champions | Content appears only after pointer interaction; tooltips must be translated without permanent scanning loops. |
| `ai-chat` | ChatGPT, Claude, Poe | Streaming message nodes, rewritten DOM, login gates, composer/input areas, and message wrappers. |
| `adult-video-list` | Pornhub, XVideos | High-link video-title grids with explicit content, badges, durations, view counts, and ad/sidebar noise. |

## Maintenance Rules

- Keep every type at two or three representative sites.
- Prefer stable public URLs, but allow `requiresLogin` for AI chat pages because their DOM class of bugs is important.
- Do not remove a type just because one site becomes flaky; replace the site or gate it.
- Keep `fixtureKind` accurate. It is used to verify coverage and to explain why a site is in the matrix.
- Add new types only when they imply different translation semantics, not just a different brand.
