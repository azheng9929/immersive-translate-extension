import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const DATA_PATH = resolve(process.cwd(), "public/data/imported-immersive-web-rules.json");

const VIDEO_HINTS = ["youtube", "youtu.be", "pornhub", "xvideos", "youporn", "vimeo", "twitch", "bilibili", "dailymotion", "tiktok"];
const SOCIAL_HINTS = ["twitter", "x.com", "threads", "facebook", "instagram", "mastodon", "discord", "telegram"];
const FORUM_HINTS = ["reddit", "stackoverflow", "stackexchange", "hackernews", "news.ycombinator"];
const COMMERCE_HINTS = ["amazon", "aliexpress", "shop", "store", "product", "taobao", "tmall", "jd.com"];
const ARTICLE_HINTS = ["docs", "documentation", "wiki", "wikipedia", "medium", "substack", "news", "blog", "article", "reuters", "bbc", "cnn"];

const rules = JSON.parse(await readFile(DATA_PATH, "utf8"));
if (!Array.isArray(rules)) throw new Error("Imported web rules payload is not an array");

const summaries = rules.map((rule) => ({ rule, ...analyze(rule) }));
const byCapability = countBy(summaries, (summary) => summary.capability);
const byFallback = countBy(summaries, (summary) => summary.fallbackProfile);
const fieldAudit = auditFields(rules);
const selectorAudit = auditSelectors(rules);
const styleAudit = auditStyles(rules);
const needsCoreReview = summaries
  .filter((summary) => summary.capability !== "content-ready" && summary.fallbackProfile !== "generic")
  .slice(0, 30)
  .map((summary) => `${summary.rule.id} [${summary.capability}/${summary.fallbackProfile}]`);

console.log("Imported web rule capability audit");
console.log(`Total rules: ${summaries.length}`);
console.log(`Capabilities: ${formatCounts(byCapability)}`);
console.log(`Fallback profiles: ${formatCounts(byFallback)}`);
console.log(`Imported detail fields: ${formatCounts(fieldAudit)}`);
console.log(
  `Selectors: checked=${selectorAudit.checked}, invalid=${selectorAudit.invalid.length}, broad=${selectorAudit.broad.length}`,
);
console.log(
  `Styles: global=${styleAudit.globalStyleCount}, injected=${styleAudit.injectedCssCount}, review-global=${styleAudit.reviewGlobalStyles.length}, review-injected=${styleAudit.reviewInjectedCss.length}`,
);
if (selectorAudit.invalid.length > 0) {
  console.log("Invalid selector samples:");
  for (const item of selectorAudit.invalid.slice(0, 20)) console.log(`- ${item.id}.${item.field}: ${item.selector}`);
}
if (styleAudit.reviewGlobalStyles.length > 0 || styleAudit.reviewInjectedCss.length > 0) {
  console.log("Style review samples (not necessarily wrong; often site-specific layout knowledge):");
  for (const item of [...styleAudit.reviewGlobalStyles, ...styleAudit.reviewInjectedCss].slice(0, 20)) {
    console.log(`- ${item.id}.${item.field}: ${item.preview}`);
  }
}
console.log("Review candidates:");
for (const line of needsCoreReview) console.log(`- ${line}`);

function analyze(rule) {
  const contentAnchorCount = [
    ...arrayValue(rule.selectors),
    ...arrayValue(rule.contentSelectors).map((entry) => entry?.selector).filter(Boolean),
    rule.mainFrameSelector,
    rule.bodyRule?.bodySelector,
    rule.bodyRule?.articleSelector,
  ].filter(Boolean).length;
  const hasContentAnchors = contentAnchorCount > 0;
  const hasLayoutHints = hasRecordValue(rule.globalStyles) || arrayValue(rule.injectedCss).length > 0;
  const hasStructureHints = [
    rule.extraBlockSelectors,
    rule.extraInlineSelectors,
    rule.atomicBlockSelectors,
    rule.buildContainerSelectors,
    rule.skipBuildContainerSelectors,
    rule.stayOriginalSelectors,
    rule.stayOriginalTags,
  ].some((value) => arrayValue(value).length > 0);
  const hasDynamicHints = Boolean(
    rule.observeUrlChange !== undefined ||
      rule.urlChangeDelay !== undefined ||
      rule.dynamicPreset ||
      rule.isHighDynamic ||
      rule.advanceMergeConfig?.length,
  );

  return {
    capability: rule.ruleCapability ?? deriveCapability(hasContentAnchors, hasLayoutHints, hasStructureHints, hasDynamicHints),
    fallbackProfile: rule.fallbackProfile ?? inferFallbackProfile(rule),
    contentAnchorCount,
  };
}

function auditFields(rules) {
  const fields = [
    "mainFrameMinTextCount",
    "mainFrameMinWordCount",
    "globalAttributes",
    "translationClasses",
    "wrapperPrefix",
    "wrapperSuffix",
    "excludeTags",
    "inlineTags",
    "preWhitespaceDetectedTags",
    "containerMinTextCount",
    "lineBreakMaxTextCount",
    "aiRule",
  ];
  const counts = {};
  for (const field of fields) counts[field] = rules.filter((rule) => hasMeaningfulField(rule[field])).length;
  return counts;
}

function hasMeaningfulField(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function deriveCapability(hasContentAnchors, hasLayoutHints, hasStructureHints, hasDynamicHints) {
  if (hasContentAnchors) return "content-ready";
  if (hasLayoutHints) return "modifier-only";
  if (hasStructureHints || hasDynamicHints) return "structure-only";
  return "match-only";
}

function inferFallbackProfile(rule) {
  const text = [rule.id, rule.siteKey, ...(rule.matches ?? []), ...(rule.selectorMatches ?? [])].join("\n").toLowerCase();
  if (hasHint(text, VIDEO_HINTS)) return "video";
  if (hasHint(text, FORUM_HINTS)) return "forum";
  if (hasHint(text, SOCIAL_HINTS)) return "social";
  if (hasHint(text, COMMERCE_HINTS)) return "commerce";
  if (hasHint(text, ARTICLE_HINTS)) return "article";
  return "generic";
}

function hasHint(text, hints) {
  return hints.some((hint) => text.includes(hint));
}

function arrayValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.replace ?? value.add ?? [];
}

function hasRecordValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.replace && typeof value.replace === "object") return Object.keys(value.replace).length > 0;
  if (value.add && typeof value.add === "object") return Object.keys(value.add).length > 0;
  return Object.keys(value).some((key) => !["replace", "add", "remove"].includes(key));
}

function auditSelectors(rules) {
  const document = new JSDOM("<!doctype html><html><body></body></html>").window.document;
  const selectorFields = [
    "selectorMatches",
    "excludeSelectorMatches",
    "selectors",
    "excludeSelectors",
    "mutationExcludeSelectors",
    "extraBlockSelectors",
    "extraInlineSelectors",
    "atomicBlockSelectors",
    "buildContainerSelectors",
    "skipBuildContainerSelectors",
    "stayOriginalSelectors",
  ];
  const invalid = [];
  const broad = [];
  let checked = 0;

  for (const rule of rules) {
    for (const field of selectorFields) {
      for (const selector of arrayValue(rule[field]).filter(Boolean)) {
        checked += 1;
        if (isBroadSelector(selector)) broad.push({ id: rule.id, field, selector });
        try {
          document.querySelector(selector);
        } catch {
          invalid.push({ id: rule.id, field, selector });
        }
      }
    }
    for (const selector of Object.keys(recordValue(rule.globalStyles))) {
      checked += 1;
      if (isBroadSelector(selector)) broad.push({ id: rule.id, field: "globalStyles", selector });
      try {
        document.querySelector(selector);
      } catch {
        invalid.push({ id: rule.id, field: "globalStyles", selector });
      }
    }
  }

  return { checked, invalid, broad };
}

function auditStyles(rules) {
  const reviewGlobalStyles = [];
  const reviewInjectedCss = [];
  let globalStyleCount = 0;
  let injectedCssCount = 0;

  for (const rule of rules) {
    for (const [selector, style] of Object.entries(recordValue(rule.globalStyles))) {
      globalStyleCount += 1;
      if (isBroadSelector(selector) || needsStyleReview(style)) {
        reviewGlobalStyles.push({
          id: rule.id,
          field: "globalStyles",
          preview: `${selector} { ${String(style).slice(0, 100)} }`,
        });
      }
    }
    for (const css of [...arrayValue(rule.injectedCss), ...arrayValue(rule.additionalInjectedCss)]) {
      injectedCssCount += 1;
      if (needsStyleReview(css)) {
        reviewInjectedCss.push({
          id: rule.id,
          field: "injectedCss",
          preview: String(css).replace(/\s+/g, " ").trim().slice(0, 120),
        });
      }
    }
  }

  return { globalStyleCount, injectedCssCount, reviewGlobalStyles, reviewInjectedCss };
}

function recordValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value.replace ?? value.add ?? value;
}

function isBroadSelector(selector) {
  return /^\s*(?:html|body|\*|:root)\s*$/i.test(String(selector));
}

function needsStyleReview(style) {
  return /(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0\b|position\s*:\s*fixed|pointer-events\s*:\s*none|z-index\s*:|overflow\s*:\s*hidden)/i
    .test(String(style));
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}
