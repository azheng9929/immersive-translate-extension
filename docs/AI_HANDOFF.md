# AI 交接文档

最后更新：2026-04-30  
当前重点：网页翻译内核，对标新版沉浸式翻译的加载流程、规则系统、DOM 扫描、动态调度和渲染稳定性。暂不展开 OCR、PDF、图片翻译、字幕市场等高级场景。

## 一句话状态

项目已经从“简单整页翻译插件”推进到“规则驱动的网页翻译内核”。核心能力包括：悬浮控制台、整页翻译、双语/译文/原文模式、划词翻译、输入框翻译、动态补翻、懒翻译、失败重试、缓存、后台并发治理、Provider 配置、站点规则、术语表、规则可视化和真实站点回归。

还没有达到成熟商业插件的站点适配厚度。下一阶段的主要工作不是盲目继续导字段，而是用规则可视化和真实网页回归，把几十个高价值网站逐个调稳。

## 产品路线状态

| 阶段 | 状态 | 说明 |
| --- | --- | --- |
| 第一阶段：交互壳 | 基本完成 | 悬浮球、可展开页面翻译控制台、popup、options 基础项、页面状态面板已具备。 |
| 第二阶段：局部翻译 | 基本完成 | 划词翻译已改成低打扰触发；输入框翻译已支持，并按用户偏好默认隐藏/按需启用；原文 hover 不再作为双语模式的核心交互。 |
| 第三阶段：稳定性 | 已收口但需持续回归 | 动态内容补翻、页面状态管理、懒翻译、失败重试、缓存、后台 in-flight 去重、真实站点回归脚本都已接入。高动态站点还需要持续调规则。 |
| 第四阶段：个性化 | 部分完成 | OpenAI/Gemini/DeepSeek/Anthropic/OpenRouter 等 Provider、Prompt 参数、站点自动翻译、站点规则、术语表导入导出、缓存管理、规则调试入口已具备。更细的快捷键和 per-site 偏好仍可加强。 |
| 第五阶段：高级场景 | 暂不做 | PDF、OCR、图片翻译、字幕、阅读模式、规则市场暂时不是当前目标。 |

## 架构概览

```text
Chrome MV3 / WXT
  |
  |-- entrypoints/background.ts
  |     |-- src/background/messageRouter.ts
  |     |-- configStore / webRuleStore / paragraphCache
  |     |-- translationPermit / inflightTranslationDedupe
  |     `-- providers: fake, microsoft, openai-compatible, gemini,
                    deepseek, anthropic, openrouter
  |
  |-- content script
        |-- src/content/contentGuard.ts
        |-- src/content/contentMain.ts
        |-- src/content/pageTranslationSession.ts
        |-- src/content/pageController.ts
        |-- domScanner / unitBuilder / compiledFilterRule
        |-- renderEngine / restoreEngine / renderDecider
        |-- floatingControl / debugOverlay / ruleTargetInspector
        `-- selectionTranslator / inputTranslator
```

核心边界：

- background 负责配置、规则懒加载、缓存、并发许可、跨 tab in-flight 去重和 Provider 请求。
- content 负责页面上下文、DOM 扫描、翻译单元构建、可见区调度、动态观察、渲染和恢复。
- shared 负责配置类型、规则类型、规则匹配、缓存键、术语、语言启发式和消息协议。

## 新版沉浸式翻译对齐点

已经吸收的关键设计：

- 静态注入轻量 guard，主逻辑延后加载。
- 将站点规则作为资产，而不是在代码里写一堆站点 if/else。
- background 做配置、缓存、permit、队列和 Provider 治理。
- content 使用 TreeWalker/规则分类/可见区调度，而不是 `querySelectorAll("p")`。
- 规则分层：URL 匹配、DOM 形态匹配、翻译范围、排除范围、样式修复、动态调度。
- 导入规则按 URL 懒加载，不把 830 条规则全塞进每个页面。
- 对导入规则做能力过滤和分类：`content-ready`、`modifier-only`、`structure-only`、`match-only`。
- 不把非 content-ready 规则当成完整站点适配，而是按页面类型降级到保守 fallback。
- 用规则可视化解释“为什么没翻/为什么被排除”，避免靠猜调规则。

刻意没有照搬的点：

- 不使用上游历史包袱里的 `font` wrapper。
- 不把 PDF/OCR/字幕规则混进网页翻译内核。
- 不无条件执行所有上游字段；未理解语义的字段只保留或降级。

## 关键模块地图

| 目标 | 主要文件 |
| --- | --- |
| 规则类型和 schema | `src/shared/webRuleTypes.ts` |
| 导入规则能力过滤 | `src/shared/importedWebRuleRuntime.ts` |
| 规则匹配 | `src/shared/webRuleMatcher.ts` |
| background 规则懒加载 | `src/background/webRuleStore.ts` |
| core + imported 规则合并 | `src/content/webTranslationRules.ts` |
| 编译运行时过滤器 | `src/content/compiledFilterRule.ts` |
| DOM 扫描 | `src/content/domScanner.ts` |
| 翻译单元构建 | `src/content/unitBuilder.ts` |
| 页面翻译控制 | `src/content/pageController.ts` |
| 动态补翻和状态机 | `src/content/pageTranslationSession.ts` |
| 渲染/恢复 | `src/content/renderEngine.ts`, `src/content/restoreEngine.ts` |
| 悬浮控制台 | `src/content/floatingControl.ts` |
| 规则可视化 | `src/content/debugOverlay.ts` |
| 点击定位问题 | `src/content/ruleTargetInspector.ts` |
| Provider 请求 | `src/background/providers/*` |
| 后台并发和去重 | `src/background/translationPermit.ts`, `src/background/inflightTranslationDedupe.ts` |
| 真实站点回归 | `scripts/real-site-regression.mjs`, `scripts/real-site-regression-config.mjs` |

## 规则系统当前状态

导入规则规模：

- 总规则数：830。
- 能力分类：`content-ready=103`，`modifier-only=184`，`structure-only=53`，`match-only=490`。
- fallback profile：article、video、social、forum、commerce、generic。

字段是否生效请看 [规则系统语义矩阵](./rule-system-semantics.md)。简要结论：

- 真正执行：匹配、范围、排除、保留原样、block/inline/atomic、样式修复、动态调度、AI streaming、Provider 批次和缓存。
- 部分执行：`bodyRule`、`mainFrame*`、`buildContainerSelectors`、`skipBuildContainerSelectors`、`containerMinTextCount`。
- 保留但暂不完整执行：`bodyRule.xpathRule`、`bodyRule.matchNodeRule`。
- 跳过：userscript/mobile 手势类字段，不属于当前 Chrome MV3 网页翻译核心。

## 当前鲁棒性判断

比较稳的部分：

- 静态文章、文档、博客、普通列表页。
- 有明确 selector 的站点。
- 大量重复文本页面，因为有缓存和后台 in-flight 去重。
- SPA 基础路由变化、characterData mutation、可见区/懒翻译。
- 规则调试，因为现在可以看到命中规则、selector 计数、exclude 情况、点击元素解释。

仍然脆弱的部分：

- X、Threads、YouTube、Reddit、MetaTFT、tactics.tools 这类高动态页面，需要持续真实站点回归。
- 富文本复杂 inline：链接、粗体、代码、折叠标题、line-clamp 的组合还要继续压测。
- iframe 和 shadow root 已有支持，但还需要更多真实站点用例。
- match-only 导入规则只能提供识别，不能保证站点质量。
- 上游个别规则依赖我们尚未完整执行的 `xpathRule/matchNodeRule` 语义。

## 调试一个“为什么没翻”的推荐流程

1. 打开插件悬浮控制台。
2. 开启规则可视化或点击“定位问题”。
3. 点击页面上没被翻译的文字。
4. 看它是：
   - 没有命中 selector；
   - 命中了 exclude；
   - 被认为是 hidden / not meaningful；
   - 被中文或短文本启发式跳过；
   - 命中了规则但还在 lazy queue；
   - Provider/cache/queue 层失败。
5. 只在明确原因后改规则或运行时逻辑。
6. 给该问题补 unit test 或真实站点回归配置。

## 常用命令

```bash
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run audit:web-rules
npm.cmd run audit:rule-semantics -- --sample=12
npm.cmd run test:real-sites:smoke
npm.cmd run test:real-sites:high-dynamic
npm.cmd run test:real-sites:long-tail
```

真实站点回归会受登录墙、人机验证、网络拦截影响。脚本里已经有 access gate，不要把被安全页挡住误判为规则失败。

## 近期重要节点

- 引入新版沉浸式翻译规则库，并改成按 URL 懒加载。
- 实现导入规则能力过滤，避免把非网页、PDF、OCR、字幕规则误用于网页。
- 规则 schema 对齐新版沉浸式的核心字段。
- 实现 compiled filter rule，扫描时不再到处临时判断字段。
- 实现 block / inline / atomic 分类器，结合标签、selector 和 computed style。
- 补 SPA URL change、characterData mutation、动态补翻和可见区补扫。
- background 增加 permit、缓存、in-flight 去重，避免多 tab/重复文本重复打 API。
- 增加 OpenAI/Gemini/DeepSeek/Anthropic/OpenRouter 等 Provider。
- 增加调试 overlay、selector 计数、点击元素解释、悬浮面板问题定位。
- 增加真实站点回归 profile：smoke、high-dynamic、core-rules、long-tail-rules、all。

## 下一步建议

优先级从高到低：

1. 用规则可视化逐站点调稳高价值网站：X、Threads、YouTube、Reddit、MetaTFT、tactics.tools、Inworld、PromptOT、Pornhub、XVideos。
2. 继续增强复杂 inline / 富文本渲染，特别是仅译文模式下的链接、粗体、代码、折叠标题和 line-clamp。
3. 对 `bodyRule.matchNodeRule` 和 `xpathRule` 做取舍：只有当真实站点明确依赖时再实现，不要为了字段完整而增加复杂度。
4. 继续补 iframe / shadow root 的真实站点回归。
5. 把规则可视化里的“为什么被 exclude/为什么 not meaningful”做得更可读，降低后续调规则成本。
6. 扩充高价值 core rules。导入规则是候选知识库，最终还是要沉淀成我们自己的稳定 core rule。

## 接手原则

- 有可疑表现，先怀疑我们的规则语义或运行时降级是否不完整。
- 不要把 830 条导入规则当成已经完成的站点适配。
- 不要再盲目加字段；每个字段都要回答三个问题：上游用它解决什么、我们运行时有没有对应逻辑、没有的话是实现还是降级。
- 不要为了翻译更多而破坏布局。宁可保守 fallback，也不要全页乱翻。
- 每次修站点，都尽量补规则审计、单测或真实站点回归。
