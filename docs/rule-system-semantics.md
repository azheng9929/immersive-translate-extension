# 规则系统语义矩阵

最后更新：2026-04-30  
目的：确认从新版沉浸式翻译吸收的规则字段是否真的在本项目运行时发挥作用，避免“只导字段、不执行语义”。

## 当前审计摘要

运行命令：

```bash
npm.cmd run audit:rule-semantics -- --sample=12
npm.cmd run audit:web-rules
```

当前导入规则：

- 总数：830。
- capability：`content-ready=103`，`modifier-only=184`，`structure-only=53`，`match-only=490`。
- selector 检查：2093 个 selector，invalid=0，broad=1。
- 样式字段：global style 159 条，injected css 287 条。

## 字段分组状态

| 分组 | 上游解决的问题 | 本项目状态 | 当前实现 | 注意事项 |
| --- | --- | --- | --- | --- |
| site matching | 判断规则是否适用于当前 URL 或页面形态 | 已实现 | `matches`、`excludeMatches`、`selectorMatches`、`excludeSelectorMatches` 进入规则匹配；`selectorMatches` 只做页面检测，不当成翻译范围 | `*.twitter.com` 不匹配根域名这类规则语义要保留 |
| translation scope | 决定哪些元素可翻译、哪些必须排除 | 已实现 | `selectors`、`additionalSelectors`、`excludeSelectors`、`additionalExcludeSelectors`、`excludeTags`、`additionalExcludeTags`、`stayOriginalSelectors`、`stayOriginalTags` | `selectors` 会收窄范围；追加/移除优先用 `.add/.remove` |
| block / inline / atomic | 控制 DOM 切段，避免 inline 被拆碎或卡片被过度合并 | 已实现 | `extraBlockSelectors`、`extraInlineSelectors`、`atomicBlockSelectors`、`inlineTags`、`preWhitespaceDetectedTags` 编译进 filter rule | 分类器同时看 selector、标签和 computed style |
| container / body | 限制主内容区域，避免导航、侧栏、推荐区误翻 | 部分实现 | `mainFrameSelector`、`mainFrameMinTextCount`、`mainFrameMinWordCount`、`bodyRule.enable`、`bodyRule.minTextLength`、`bodyRule.bodySelector`、`bodyRule.articleSelector`、`buildContainerSelectors`、`skipBuildContainerSelectors`、`containerMinTextCount` | `bodyRule.xpathRule` 和 `bodyRule.matchNodeRule` 暂为元数据，不执行 |
| layout repair | 修复译文造成的截断、折叠、overflow、line-clamp | 已实现 | `globalStyles` 转 CSS 注入；`globalAttributes` 经 sanitizer 后应用；`injectedCss` 注入；`translationClasses`、`wrapperPrefix`、`wrapperSuffix`、`lineBreakMaxTextCount` 生效 | 需要警惕上游 CSS 里与 `font` wrapper 相关的历史包袱 |
| dynamic scheduling | 处理 SPA、动态列表、聊天流、tooltip、mutation 噪音 | 已实现 | `observeUrlChange`、`urlChangeDelay`、`mutationExcludeSelectors`、`dynamicPreset`、`isHighDynamic`、`advanceMergeConfig` 参与调度策略 | 高动态站点仍要真实网页压测 |
| ai streaming | 处理 AI 对话页面里不断被重写的消息节点 | 已实现 | `aiRule.messageWrapperSelector` / `messageContainerSelector` 转成扫描 root，并套 `chat-stream` 调度 | 仅做网页正文翻译，不做 AI assistant 产品面 |
| userscript/mobile | 控制油猴或移动端手势、浮窗 | 跳过 | 当前 Chrome MV3 网页内核不执行 | 等做移动端/油猴再考虑 |

## 运行链路

```text
upstream default_config.json
  |
  |-- scripts/import-immersive-web-rules.mjs
  |     生成 public/data/imported-immersive-web-rules.json
  |     生成 src/shared/data/importedImmersiveRuleCatalog.ts
  |
  |-- src/background/webRuleStore.ts
  |     按当前 URL 用 catalog 判断是否需要加载完整规则
  |
  |-- src/shared/importedWebRuleRuntime.ts
  |     过滤非网页规则
  |     标注 capability / fallbackProfile
  |     保留已支持字段
  |
  |-- src/content/webTranslationRules.ts
  |     core rule + imported rule 合并
  |     执行 .add/.remove/.add_v/.remove_v
  |     执行 advanceMergeConfig
  |     编译 site policy 和 filter rule
  |
  |-- src/content/compiledFilterRule.ts
  |     将 selector/tag/atomic/inline/stay-original/exclude 编译成运行时规则
  |
  |-- src/content/pageController.ts
        collect roots
        scan DOM
        build units
        cache/query provider
        render/restore
```

## 字段详细说明

### 1. 站点匹配字段

审计数据：

- 使用规则数：830。
- 字段计数：`matches=806`，`excludeMatches=25`，`selectorMatches=43`，`excludeSelectorMatches=0`。

语义：

- `matches/excludeMatches` 先按 URL 判断候选规则。
- `selectorMatches/excludeSelectorMatches` 再按 DOM 形态判断页面类型。
- selector match 是“规则是否命中”的条件，不是“翻译哪些元素”的范围。

主要代码：

- `src/shared/webRuleMatcher.ts`
- `src/background/webRuleStore.ts`
- `src/content/webTranslationRules.ts`

### 2. 翻译范围字段

审计数据：

- 使用规则数：398。
- 字段计数：`selectors=84`，`excludeSelectors=324`，`excludeTags=8`，`stayOriginalSelectors=30`，`stayOriginalTags=2`。

语义：

- `selectors` 代表只翻译这些范围。
- `excludeSelectors/excludeTags` 代表即使命中也不翻。
- `stayOriginalSelectors/stayOriginalTags` 代表保留原样，典型是 code、公式、特殊控件。

主要代码：

- `src/content/compiledFilterRule.ts`
- `src/content/domScanner.ts`
- `src/content/unitBuilder.ts`
- `src/content/pageController.ts`

### 3. block / inline / atomic 字段

审计数据：

- 使用规则数：79。
- 字段计数：`extraBlockSelectors=46`，`extraInlineSelectors=28`，`atomicBlockSelectors=13`，`preWhitespaceDetectedTags=2`。

语义：

- block：作为独立段落或块级翻译。
- inline：作为父段落的一部分聚合，不单独拆散。
- atomic：整体作为一个不可拆单元，适合卡片、标题、tooltip 说明等。
- preWhitespaceDetectedTags：在文本组装时保留换行边界。

主要代码：

- `src/content/compiledFilterRule.ts`
- `src/content/unitBuilder.ts`
- `src/content/granularityPolicy.ts`

### 4. container / body 字段

审计数据：

- 使用规则数：71。
- 字段计数：`mainFrameSelector=15`，`mainFrameMinTextCount=37`，`mainFrameMinWordCount=35`，`bodyRule=20`，`buildContainerSelectors=11`，`containerMinTextCount=3`。

语义：

- `mainFrameSelector` 指定主扫描容器。
- `mainFrameMinTextCount/mainFrameMinWordCount` 用于判断主内容是否 ready，避免骨架屏误扫。
- `bodyRule` 是通用正文兜底，不等于全 body 乱扫。
- `buildContainerSelectors` 强制把某些元素作为候选容器。
- `skipBuildContainerSelectors` 从容器候选里排除区域。
- `containerMinTextCount` 控制容器最小文本量。

当前缺口：

- `bodyRule.xpathRule` 暂不执行。
- `bodyRule.matchNodeRule` 暂不执行。

决策：

- 这两个字段只有在真实站点明确依赖时再实现。否则会显著增加扫描复杂度和误判风险。

### 5. 样式修复字段

审计数据：

- 使用规则数：222。
- 字段计数：`globalStyles=89`，`injectedCss=132`，`globalAttributes=11`，`translationClasses=1`，`wrapperPrefix=7`，`wrapperSuffix=1`，`lineBreakMaxTextCount=2`。

语义：

- `globalStyles/injectedCss` 解决 line-clamp、overflow、隐藏折叠、站点自身样式压缩译文等问题。
- `globalAttributes` 修正需要属性配合的页面行为。
- `translationClasses` 给译文 wrapper 增加站点特定 class。
- `wrapperPrefix/wrapperSuffix` 控制译文前后缀。
- `lineBreakMaxTextCount` 影响 provider 请求文本的长段落换行。

主要代码：

- `src/shared/importedWebRuleRuntime.ts`
- `src/content/webTranslationRules.ts`
- `src/content/pageController.ts`
- `src/content/renderEngine.ts`

### 6. 动态调度字段

审计数据：

- 使用规则数：142。
- 字段计数：`mutationExcludeSelectors=119`，`observeUrlChange=8`，`urlChangeDelay=15`，`advanceMergeConfig=2`，`dynamicPreset=6`，`isHighDynamic=6`。

语义：

- `mutationExcludeSelectors` 过滤噪音节点，避免无限重扫。
- `observeUrlChange/urlChangeDelay` 处理 SPA 路由变化。
- `dynamicPreset/isHighDynamic` 调整队列、观察、可见区补扫、flush 节奏。
- `advanceMergeConfig` 根据条件给规则打补丁。

主要代码：

- `src/content/webTranslationRules.ts`
- `src/content/pageTranslationSession.ts`
- `src/content/sitePolicy.ts`

### 7. AI streaming 字段

审计数据：

- 使用规则数：6。
- 样例：ChatGPT、Claude、Poe、JanitorAI、ChatPDF、Yodayo。

语义：

- AI 聊天页面的消息节点会持续被重写，不能当普通文章页处理。
- 本项目把 `messageWrapperSelector/messageContainerSelector` 转成普通扫描 root，然后套 `chat-stream` 动态策略。

主要代码：

- `src/shared/importedWebRuleRuntime.ts`
- `src/content/webTranslationRules.ts`
- `src/content/pageTranslationSession.ts`

## 规则质量分层

不要把导入规则都当成完整适配。当前分类含义：

- `content-ready`：有明确正文 selector、content selector、main frame 或 body/article 锚点，可以直接驱动扫描。
- `modifier-only`：主要是样式、排除、布局修复，不能独立决定翻译范围。
- `structure-only`：有 block/inline/container/dynamic 提示，但没有正文锚点。
- `match-only`：只能识别 URL 或页面形态。
- `unsafe`：保留概念，表示绝不应该进入网页翻译内核。

## 样式-only 规则如何理解

新版沉浸式翻译里，很多商业化站点规则只有 `globalStyles`、`injectedCss`、`excludeSelectors`、`extraBlockSelectors`，没有 `selectors`。这通常不是遗漏，而是它的通用正文引擎足够强：通用 TreeWalker、正文 root scoring、block/inline 分类、bodyRule 和动态调度先把内容找出来，站点规则只负责修复截断、折叠、line-clamp、广告区、导航区等问题。

本项目不能直接假设这些规则已经完整适配。处理方式是三层：

1. 对普通站点，保留样式/排除信息，并按 fallback profile 加保守 extractor。
2. 对高价值或已暴露问题的网站，提升成自己的 core rule，补明确的 `selectors/contentSelectors/excludeSelectors`。
3. 对仍然只有样式、且 fallback 不稳的网站，列入 `npm.cmd run audit:web-rules` 的 review candidates，后续逐站点调试。

已经提升过的典型样式-only 上游规则包括：Threads、StackOverflow、Substack、GitHub Blog、Google News、ProductHunt、Amazon、Shopee、AliExpress、Pornhub、XVideos、YouPorn。

降级策略：

- 非 content-ready 规则命中页面时，不假装已经完整适配。
- 根据 fallback profile 选择 article/video/social/forum/commerce/generic 的保守 extractor。
- 高价值站点逐步沉淀为本项目自己的 core rule。

## 调规则时的判断标准

新增或修改规则前，先确认：

1. 是没有命中站点规则，还是命中了但 selector 为空？
2. 是没有进入扫描 root，还是进入后被 exclude？
3. 是文本被认为 hidden / not meaningful / 中文主导 / 太短？
4. 是 lazy queue 未触发，还是 provider/cache 失败？
5. 是译文生成了但渲染被 line-clamp/overflow 截断？

对应工具：

- 悬浮面板“定位问题”。
- debug overlay 的规则可视化。
- `npm.cmd run audit:rule-semantics -- --sample=12`。
- `npm.cmd run test:real-sites:*`。

## 当前不追求的完整性

- 不追求复制上游 830 条规则的每个字段。
- 不追求一次性覆盖所有成人、视频、社交、文档站点。
- 不把 PDF/OCR/字幕规则混入网页翻译。
- 不为了“翻到更多文字”牺牲布局稳定性。
