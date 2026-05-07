# Chinese User UX Test - 2026-05-07

## Test Role

本轮体验刻意站在“中文母语、英文能力很差”的用户视角。

判断标准不是技术上有没有插入译文，而是：

- 我能不能不用猜英文就继续阅读、筛选、购买、查资料。
- 正文、标题、描述、说明、tooltip 是否有足够清楚的中文。
- 价格、用户名、代码、按钮、导航是否没有被乱翻到让我不信任页面。
- 页面是否看起来像正常网页，而不是被翻译器弄坏。

## Test Scope

使用真实网站、真实 Microsoft provider，覆盖 36 次站点运行，来源报告：

- `.tmp/real-site-regression-reports/report-2026-05-07T13-30-52-660Z.json`
- `.tmp/real-site-regression-reports/report-2026-05-07T13-33-21-654Z.json`
- `.tmp/real-site-regression-reports/report-2026-05-07T13-36-24-201Z.json`
- `.tmp/real-site-regression-reports/report-2026-05-07T13-48-06-103Z.json`

覆盖类型包括 docs-code、github、article、search-results、commerce、video-list、forum、social-feed、landing、data-dashboard、hover-tooltip、adult-video-list。

## Overall Feeling

核心阅读类页面已经能给普通中文用户使用。OpenAI Docs、MDN、React、GitHub README、GitHub Issues、Nature、GitHub Blog、StackOverflow、Hacker News 这类页面，中文出现很快，代码和用户名没有明显被破坏，阅读主线能接住。

商品和搜索类也基本可信。Amazon、eBay、Etsy、Google、Bing 的价格、评分、URL、搜索控件没有明显误翻；对英文差的用户来说，能看懂商品大意和搜索结果摘要。

最大问题不在“翻译能力”，而在三类体验缺口：

- rich inline placeholder 会露出 `<x id=...>`，在 Wikipedia/OpenAI Docs 这类正文页非常伤信任。
- dashboard / hover tooltip 类页面容易过翻、漏翻、翻译完成慢，Mobalytics 和 Tactics Tools 不能算真实可用。
- 搜索、视频、dashboard 的整页完成时间偏长。首屏能读，但滚动时会遇到一段时间内中英混杂。

## Site Notes

| Site | Verdict | User Feeling |
| --- | --- | --- |
| OpenAI Docs | PASS | 主文档能读，代码块没坏。但译文中可见 `<x id=...>` 占位符，像页面出错。 |
| MDN JavaScript Guide | PASS | 正文可读，代码/引用保留不错。侧边栏仍有英文，但我能接受。 |
| React Reference | PASS | 主内容中文够用，适合学习；少量术语保留英文可以接受。 |
| GitHub README | PASS | README 和介绍能读，代码/项目名基本没乱翻。 |
| GitHub Issues | PASS | issue 标题和描述能读，对查 bug 有帮助。 |
| StackOverflow | PASS | 问题和描述能读，代码没有被破坏，这是很重要的信任点。 |
| Hacker News | PASS | 标题/列表可读，论坛类体验合格。 |
| Wikipedia Article | PASS | 内容覆盖很强，但 `<x id=...>` 直接显示，作为普通用户会觉得译文脏。 |
| Nature Article | PASS | 文章型阅读体验好。 |
| GitHub Blog | PASS | 文章型体验好。 |
| Google Search | PASS | 结果摘要能读，控件没乱翻；但整页完成约 35s，滚动会看到中英混杂。 |
| Bing Search | PASS | 和 Google 类似，首屏快，整页慢。 |
| DuckDuckGo Search | WARN | 初始结果能读，但动态补翻不确定，继续加载结果时不放心。 |
| Amazon Product | PASS | 商品信息和描述能读，价格/评分没乱翻。中文偏灰，弱英文用户要多找一眼。 |
| eBay Search | PASS | 商品标题/状态可读，价格保留正确。体验比之前预期好。 |
| Etsy Search | PASS | 商品搜索可用，负样本控制不错。 |
| YouTube | PASS | 视频标题/描述能读，适合浏览；整页完成约 38s，滚动时会遇到未完成内容。 |
| Vimeo Watch | PASS | 视频页可用。 |
| Dailymotion | PASS | 可用但慢，首译约 2.3s，整页约 40s。 |
| Threads | PASS | feed 文本能读，用户名/动作没有明显被乱翻。 |
| Old Reddit | PASS | 老版论坛阅读可用。 |
| Reddit | GATED | 被 humanity check 阻挡，本轮不评价翻译质量。 |
| Product Hunt | GATED | 被 Cloudflare 阻挡，本轮不评价翻译质量。 |
| Inworld | PASS | landing 页 hero/section 能读。 |
| PromptOT | PASS | landing 页可读。 |
| Linear Landing | PASS | landing 页可读。 |
| Pornhub | PASS | 成人视频列表标题可读。 |
| XVideos | FAIL | 页面访问超时，无翻译，恢复也失败；不能算可用。 |
| MetaTFT | PASS | 有翻译但整页约 64s，dashboard 体感偏慢。 |
| MetaTFT Augments | PASS | 比 MetaTFT 主页面好。 |
| Tactics Tools Hover | FAIL | unit 很多、provider 成功，但 render failed；实际观感是 tooltip/广告/UI 混在一起，不能舒服读。 |
| Mobalytics TFT | FAIL | content discovery 为 0，核心内容没有翻译；对中文用户等于不可用。 |
| U.GG Champions | PASS | 有一定 tooltip 覆盖，但仍要继续人工验证核心说明。 |
| OP.GG Champions | PASS | 技术 PASS，但只有 1 个 unit，真实用户信心不足。 |

## High-Priority UX Problems

1. Placeholder leakage: `<x id=...>` 露出到译文正文。  
   这是当前最不像成品的地方，影响 OpenAI Docs、Wikipedia 等高价值阅读页。

2. Dark / styled page contrast: b.ai 上用户反馈 `x402 Payment Protocol -> x402 支付协议` 译文为黑色不可见。  
   这类问题本质是译文样式没有继承原文上下文颜色，应优先让译文继承原节点 computed color，或在低对比度时自动修正。

3. Dashboard over-translation and under-translation coexist.  
   Tactics Tools 是过多 unit + render coverage 失败；Mobalytics 是 content discovery 为 0；OP.GG 是技术 PASS 但实际覆盖太少。

4. Search/video full-page completion is slow.  
   首屏能读，但继续滚动时会撞上未翻译内容。弱英文用户会感觉“还没翻完，我要等一下”。

5. PASS score still misses “critical English residue”。  
   OP.GG 只有 1 个 translated unit 仍 PASS，说明现有评分对真实用户的“核心内容是否足够中文化”还不够严格。

## Recommended Next Fixes

1. 修 rich inline placeholder restore，确保 `<x id=...>` 永远不直接显示给用户。
2. 修译文样式继承和低对比度保护，覆盖 dark card、button-like item、li/card/list item。
3. 对 dashboard 新增真实用户口径的质量阈值：核心 tooltip/description 必须翻，广告/导航/按钮尽量不翻。
4. 为 Mobalytics、Tactics Tools、XVideos 建立 focused regression。
5. 给搜索/视频类增加“首屏已完成、剩余后台翻译中”的用户可见状态，降低等待焦虑。
6. 在 evaluator 中增加 visible untranslated critical samples，避免 OP.GG 这种技术 PASS 掩盖真实不可用。

