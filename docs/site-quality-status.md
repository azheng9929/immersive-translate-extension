# Site Quality Status

Baseline report: `.tmp/real-site-regression-reports/report-2026-05-01T01-31-45-315Z.json`

Baseline date: 2026-05-01 Asia/Shanghai

Profile: `fixture-matrix`

Provider: `fake`

## Release Gate Snapshot

| Gate | Status | Evidence |
| --- | --- | --- |
| Typecheck | PASS | `npm.cmd run typecheck` |
| Unit tests | PASS | `npm.cmd test` - 56 files, 422 tests |
| Build | PASS | `npm.cmd run build`; fixture matrix also rebuilt `.output/chrome-mv3` |
| Rule capability audit | PASS | `npm.cmd run audit:web-rules` - 830 rules, 0 invalid selectors |
| Rule semantic audit | PASS | `npm.cmd run audit:rule-semantics` |
| Real-site smoke | PASS | 1 PASS, 0 WARN, 0 FAIL |
| Fixture matrix | PASS | 28 PASS, 7 WARN, 5 GATED, 0 FAIL |
| Real provider smoke | PASS | Native DeepSeek `deepseek-v4-flash`: 6 PASS, 0 WARN, 0 FAIL |
| Critical negative violations | PASS | 0 critical violations |
| Restore failures | PASS | 0 restore failures |

Current release gate result: PASS for a first usable version. The native DeepSeek smoke, fake-provider smoke, and full fake-provider fixture matrix have no FAIL results, no critical negative violations, and no restore failures.

## Real Provider Smoke

Report: `.tmp/real-site-regression-reports/report-2026-05-01T01-12-04-971Z.json`

Provider: `deepseek`

Endpoint: `https://api.deepseek.com/chat/completions`

Model: `deepseek-v4-flash`

Site filter: OpenAI Docs, GitHub README, YouTube, Google Search, Amazon Product, Product Hunt

| Site | Verdict | Provider | Render | Negative | Restore | First translation | Full translation | Notes |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| YouTube | PASS | ok 68/70 | ok, 0 loading | ok, 0 critical | ok | 2330ms | 39255ms | Deterministic dynamic probe passed. |
| OpenAI Docs | PASS | ok 12/13 | ok, 0 loading | ok, 0 critical | ok | 2982ms | 9931ms | - |
| Product Hunt | PASS | ok 55/56 | ok, 0 loading | ok, 0 critical | ok | 1504ms | 29815ms | Product card links translated; profile shoutouts excluded. |
| Amazon Product | PASS | ok 6/6 | ok, 0 loading | ok, 0 critical | ok | 2685ms | 9404ms | - |
| GitHub README | PASS | ok 13/13 | ok, 0 loading | ok, 0 critical | ok | 1375ms | 10750ms | - |
| Google Search | PASS | ok 38/38 | ok, 0 loading | ok, 0 critical | ok | 1674ms | 16514ms | Deterministic dynamic probe passed. |

Real provider acceptance:

| Gate | Status |
| --- | --- |
| FAIL count | PASS - 0 |
| Critical negative violations | PASS - 0 |
| Restore failed | PASS - 0 |
| Provider stage failed | PASS - 0 sites |
| JSON parse / missing provider result errors | PASS - 0 surfaced errors |
| Loading cleanup | PASS - 0 loading markers at capture |

## Baseline Summary

| Verdict | Count | Notes |
| --- | ---: | --- |
| PASS | 28 | Stable core coverage across docs, GitHub, article, landing, card-list, video-list, commerce, search, forum, data dashboard, and adult video-list fixtures. |
| WARN | 7 | No critical failures; remaining WARNs are dense UI unit coverage, dynamic partial checks, generic-rule coverage, or eBay duplicate render hygiene. |
| FAIL | 0 | No accessible site failed the quality baseline. |
| GATED | 5 | Login walls or humanity checks; not counted as translation failures. |

## WARN Groups

| Group | Sites | Main issue | Next action |
| --- | --- | --- | --- |
| Dense UI or list unit coverage | Tactics Tools Hover, AlternativeTo, Vimeo Watch, Mobalytics TFT | Translation works and negative samples are clean, but unit quality score is partial due to many short UI/attribute units or fewer core units than the fixture target. | Review debug overlay before changing thresholds; prefer site selectors/excludes over lowering standards. |
| Dynamic partial with otherwise healthy translation | Vimeo Watch, DuckDuckGo Search, Mobalytics TFT, OP.GG Champions | Provider, render, negative, and restore pass; dynamic observation did not fully drain or did not produce a deterministic translated new-root run in the fixture window. | Add deterministic site actions only where the product workflow naturally mutates content. |
| eBay render hygiene | eBay Search | Content, unit build, provider, negative samples, and restore pass, but policy is weak and duplicate translation count is high on a large result page. | Keep Amazon/Etsy commerce logic unchanged; tune eBay-specific roots/excludes if eBay becomes release-critical. |
| Generic rule path | OP.GG Champions | Translation is healthy through the generic profile, but the page has no dedicated site rule and dynamic remains partial. | Add a dedicated OP.GG rule only if generic coverage regresses or tooltip quality becomes a priority. |

## Site Matrix

| Site | Kind | Verdict | Main issue | Next action |
| --- | --- | --- | --- | --- |
| X | social-feed | GATED | Login wall | Use manual authenticated session for quality checks. |
| Threads | social-feed | PASS | - | Keep in matrix. |
| YouTube | video-list | PASS | Dynamic probe passes in full matrix and DeepSeek smoke | Keep in release gate. |
| Reddit | social-feed | GATED | Humanity check | Keep gated classification. |
| Old Reddit | forum | PASS | Dynamic probe now passes | Keep in matrix. |
| Inworld | landing | PASS | - | Keep in matrix. |
| PromptOT | landing | PASS | - | Keep in matrix. |
| MetaTFT | data-dashboard | PASS | - | Keep in matrix. |
| MetaTFT Augments | data-dashboard | PASS | Dynamic probe passes | Keep in smoke gate. |
| Tactics Tools Hover | hover-tooltip | WARN | Unit partial from many short attribute/UI units; dynamic ok | Review tooltip unit thresholds and attribute-unit policy. |
| StackOverflow | forum | PASS | Dynamic probe now passes | Keep in matrix. |
| GitHub Blog | article | PASS | - | Keep in matrix. |
| OpenAI Docs | docs-code | PASS | - | Keep in release gate. |
| Nature Article | article | PASS | - | Keep in matrix. |
| Product Hunt | card-list | PASS | Profile shoutouts excluded in current rule | Keep in release gate. |
| Amazon Product | commerce | PASS | - | Keep in release gate. |
| Pornhub | adult-video-list | PASS | - | Keep in matrix. |
| XVideos | adult-video-list | PASS | - | Keep in matrix. |
| Wikipedia Article | article | PASS | 1 minor negative violation, 0 critical | Keep; inspect minor sample only if it grows. |
| MDN JavaScript Guide | docs-code | PASS | - | Keep in release gate. |
| React Reference | docs-code | PASS | - | Keep in release gate. |
| GitHub README | github | PASS | - | Keep in release gate. |
| GitHub Issues | github | PASS | - | Keep in release gate. |
| GitHub Trending | card-list | PASS | - | Keep in matrix. |
| AlternativeTo | card-list | WARN | Unit partial; 7 units vs card-list target | Strengthen card selectors if prioritizing card-list breadth. |
| Vimeo Watch | video-list | WARN | Unit partial and dynamic partial | Add Vimeo-specific content/dynamic actions only if Vimeo becomes priority. |
| Dailymotion | video-list | PASS | Dynamic probe passes | Keep in matrix. |
| eBay Search | commerce | WARN | Weak policy and duplicate render count on large page; 0 negative violations | Tune eBay-specific roots/excludes later. |
| Etsy Search | commerce | PASS | - | Keep in matrix. |
| Hacker News | forum | PASS | Dynamic probe now passes | Keep in matrix. |
| Linear Landing | landing | PASS | - | Keep in matrix. |
| Google Search | search-results | PASS | Dynamic probe passes in full matrix and DeepSeek smoke | Keep in release gate. |
| Bing Search | search-results | PASS | Dynamic probe now passes | Keep in matrix. |
| DuckDuckGo Search | search-results | WARN | Dynamic partial; translation otherwise healthy | Add deterministic dynamic action later. |
| Mobalytics TFT | data-dashboard | WARN | Unit partial and pending dynamic roots | Review dashboard UI-unit thresholds and pending-root drain. |
| U.GG Champions | hover-tooltip | PASS | Generic rule path, translation healthy | Consider dedicated rule only if coverage regresses. |
| OP.GG Champions | hover-tooltip | WARN | Generic rule path and dynamic partial; translation otherwise healthy | Add dedicated rule or deterministic hover action only if prioritized. |
| ChatGPT | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |
| Claude | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |
| Poe | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |

## Next Repair Queue

1. Keep P0 focused on regressions only: any future FAIL, critical negative violation, provider failure, render failure, or restore failure blocks release.
2. Improve deterministic dynamic actions for DuckDuckGo, Vimeo, Mobalytics, and OP.GG only where the page has a natural content mutation.
3. Review dense dashboard/list pages with debug overlay before changing thresholds: Tactics Tools, Mobalytics, AlternativeTo, Vimeo.
4. Tune eBay commerce roots/excludes as a site-specific task; do not broaden commerce heuristics while Amazon and Etsy are passing.
