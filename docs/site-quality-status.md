# Site Quality Status

Baseline report: `.tmp/real-site-regression-reports/report-2026-04-30T23-57-52-956Z.json`

Baseline date: 2026-05-01 Asia/Shanghai

Profile: `fixture-matrix`

Provider: `fake`

## Release Gate Snapshot

| Gate | Status | Evidence |
| --- | --- | --- |
| Typecheck | PASS | `npm.cmd run typecheck` |
| Unit tests | PASS | `npm.cmd test` - 56 files, 415 tests |
| Build | PASS | `npm.cmd run build` |
| Rule capability audit | PASS | `npm.cmd run audit:web-rules` - 830 rules, 0 invalid selectors |
| Rule semantic audit | PASS | `npm.cmd run audit:rule-semantics` |
| Real-site smoke | WARN | 1 WARN, 0 FAIL |
| Fixture matrix | PASS | 22 PASS, 13 WARN, 5 GATED, 0 FAIL |
| Real provider smoke | PASS | DeepSeek `deepseek-v4-flash`: 4 PASS, 2 WARN, 0 FAIL |
| Critical negative violations | PASS | 0 critical violations |
| Restore failures | PASS | 0 restore failures |

Current release gate result: PASS for a first usable version. High-dynamic pages still have WARN items, but there are no FAIL results and no critical negative violations.

## Real Provider Smoke

Report: `.tmp/real-site-regression-reports/report-2026-05-01T00-25-28-656Z.json`

Provider: `openai-compatible`

Endpoint: `https://api.deepseek.com/chat/completions`

Model: `deepseek-v4-flash`

Site filter: OpenAI Docs, GitHub README, YouTube, Google Search, Amazon Product, Product Hunt

| Site | Verdict | Provider | Render | Negative | Restore | First translation | Full translation | Notes |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| YouTube | WARN | ok 17/17 | ok, 0 loading | ok, 0 critical | ok | 3682ms | 19080ms | Dynamic partial only. |
| OpenAI Docs | PASS | ok 13/13 | ok, 0 loading | ok, 0 critical | ok | 5759ms | 12842ms | - |
| Product Hunt | PASS | ok 56/56 | ok, 0 loading | ok, 0 critical | ok | 5029ms | 69699ms | Slow full page due many card units. |
| Amazon Product | PASS | ok 6/6 | ok, 0 loading | ok, 0 critical | ok | 9231ms | 18016ms | - |
| GitHub README | PASS | ok 13/13 | ok, 0 loading | ok, 0 critical | ok | 10471ms | 24878ms | - |
| Google Search | WARN | ok 24/24 | ok, 0 loading | ok, 0 critical | ok | 4611ms | 17116ms | Dynamic partial only. |

Real provider acceptance:

| Gate | Status |
| --- | --- |
| FAIL count | PASS - 0 |
| Critical negative violations | PASS - 0 |
| Restore failed | PASS - 0 |
| Provider failed | PASS - 0 |
| JSON parse / missing provider result | PASS - 0 |
| Loading cleanup | PASS - 0 loading markers at capture |

## Baseline Summary

| Verdict | Count | Notes |
| --- | ---: | --- |
| PASS | 22 | Stable core coverage across docs, GitHub, article, landing, commerce, adult video list, and most card/list pages. |
| WARN | 13 | Mostly dynamic partial checks or partial unit coverage on dense dashboard/list pages. |
| FAIL | 0 | No accessible site failed the quality baseline. |
| GATED | 5 | Login walls or humanity checks; not counted as translation failures. |

## WARN Groups

| Group | Sites | Main issue | Next action |
| --- | --- | --- | --- |
| Dynamic partial with otherwise healthy translation | YouTube, Old Reddit, StackOverflow, Hacker News, Google Search, Bing Search, DuckDuckGo Search, MetaTFT Augments | Initial translation, provider, render, negative, and restore all pass; dynamic observer did not produce a translated dynamic run during the fixture window. | Keep as WARN for first release; later add deterministic scroll/insert/hover actions per site. |
| Partial unit coverage on dense UI pages | Tactics Tools Hover, AlternativeTo, Vimeo Watch, Mobalytics TFT | Translation works, but unit count or rendered unit coverage is below the page-type threshold. | Tighten site selectors or thresholds after reviewing screenshots/debug overlay. |
| Weak policy with successful translation | eBay Search | Content and rendering pass, but policy compilation is weak and render has duplicate translation count on a large result page. | Add stronger commerce scan roots/excludes if eBay becomes a priority. |

## Site Matrix

| Site | Kind | Verdict | Main issue | Next action |
| --- | --- | --- | --- | --- |
| X | social-feed | GATED | Login wall | Use manual authenticated session for quality checks. |
| Threads | social-feed | PASS | - | Keep in matrix. |
| YouTube | video-list | WARN | Dynamic partial; 0 negative violations | Add deterministic scroll/dynamic assertion later. |
| Reddit | social-feed | GATED | Humanity check | Keep gated classification. |
| Old Reddit | forum | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; add deterministic comment/list mutation later. |
| Inworld | landing | PASS | - | Keep in matrix. |
| PromptOT | landing | PASS | - | Keep in matrix. |
| MetaTFT | data-dashboard | PASS | - | Keep in matrix. |
| MetaTFT Augments | data-dashboard | WARN | Dynamic partial; duplicate render count 5 | Review dynamic trigger/debug overlay later. |
| Tactics Tools Hover | hover-tooltip | WARN | Unit partial; dynamic ok | Review tooltip unit thresholds. |
| StackOverflow | forum | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; dynamic action can be improved later. |
| GitHub Blog | article | PASS | - | Keep in matrix. |
| OpenAI Docs | docs-code | PASS | - | Keep in release gate. |
| Nature Article | article | PASS | - | Keep in matrix. |
| Product Hunt | card-list | PASS | - | Keep in release gate. |
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
| Vimeo Watch | video-list | WARN | Unit partial and dynamic partial | Add Vimeo-specific content selectors if this site becomes priority. |
| Dailymotion | video-list | PASS | - | Keep in matrix. |
| eBay Search | commerce | WARN | Policy weak; duplicate render count on large page | Add stronger commerce root/exclude tuning later. |
| Etsy Search | commerce | PASS | - | Keep in matrix. |
| Hacker News | forum | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; deterministic dynamic action later. |
| Linear Landing | landing | PASS | - | Keep in matrix. |
| Google Search | search-results | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; add deterministic dynamic action later. |
| Bing Search | search-results | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; add deterministic dynamic action later. |
| DuckDuckGo Search | search-results | WARN | Dynamic partial; translation otherwise healthy | Keep as WARN; add deterministic dynamic action later. |
| Mobalytics TFT | data-dashboard | WARN | Unit partial; dynamic ok | Review dashboard UI-unit thresholds. |
| U.GG Champions | hover-tooltip | PASS | Generic rule path, translation healthy | Consider dedicated rule only if coverage regresses. |
| OP.GG Champions | hover-tooltip | PASS | Generic rule path, translation healthy | Consider dedicated rule only if coverage regresses. |
| ChatGPT | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |
| Claude | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |
| Poe | ai-chat | GATED | Requires login | Use authenticated manual session for quality checks. |

## Next Repair Queue

1. Keep P0 focused on regressions only: any future FAIL, critical negative violation, or restore failure blocks release.
2. Improve deterministic dynamic actions for YouTube, forum, and search-result fixtures so dynamic partial WARNs become actionable.
3. Review dense dashboard/list pages with debug overlay before changing thresholds: Tactics Tools, Mobalytics, AlternativeTo, Vimeo.
4. Add eBay commerce root/exclude tuning only after inspecting duplicate render samples.
