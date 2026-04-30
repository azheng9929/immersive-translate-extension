import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DATA_PATH = resolve(process.cwd(), "public/data/imported-immersive-web-rules.json");
const SAMPLE_LIMIT = Number(process.argv.find((arg) => arg.startsWith("--sample="))?.split("=")[1] ?? 40);

const SEMANTIC_GROUPS = [
  {
    group: "site matching",
    purpose: "Decide whether a rule applies by URL and page shape before touching the DOM pipeline.",
    fields: ["matches", "excludeMatches", "selectorMatches", "excludeSelectorMatches"],
    runtime: "implemented",
    action: "Use directly. selectorMatches stays as detection only, not as translation scope.",
  },
  {
    group: "translation scope",
    purpose: "Choose what can be translated and what must be excluded.",
    fields: [
      "selectors",
      "additionalSelectors",
      "excludeSelectors",
      "additionalExcludeSelectors",
      "excludeTags",
      "additionalExcludeTags",
      "stayOriginalSelectors",
      "stayOriginalTags",
    ],
    runtime: "implemented",
    action: "Use directly. Broad selectors are still capability-filtered before import.",
  },
  {
    group: "block inline atomic",
    purpose: "Classify DOM fragments so inline text, cards, atomic descriptions, and code/math areas are not split incorrectly.",
    fields: ["extraBlockSelectors", "extraInlineSelectors", "atomicBlockSelectors", "inlineTags", "preWhitespaceDetectedTags"],
    runtime: "implemented",
    action: "Use directly. preWhitespaceDetectedTags now changes text assembly with newline boundaries.",
  },
  {
    group: "container and body",
    purpose: "Limit scans to the real content frame and avoid generic body scans on apps that need selector-only behavior.",
    fields: [
      "mainFrameSelector",
      "mainFrameMinTextCount",
      "mainFrameMinWordCount",
      "bodyRule",
      "buildContainerSelectors",
      "skipBuildContainerSelectors",
      "containerMinTextCount",
    ],
    runtime: "partial",
    action: "Implemented for main frame thresholds, bodyRule.enable, build/skip containers. bodyRule article scoring and containerMinTextCount are degraded to existing root scoring.",
  },
  {
    group: "layout repair",
    purpose: "Repair line-clamp, overflow, hidden content, and site-specific translated text styling.",
    fields: ["globalStyles", "injectedCss", "additionalInjectedCss", "globalAttributes", "translationClasses", "wrapperPrefix", "wrapperSuffix", "lineBreakMaxTextCount"],
    runtime: "implemented",
    action: "Use directly after sanitizer. lineBreakMaxTextCount now affects provider text, not just config display.",
  },
  {
    group: "dynamic scheduling",
    purpose: "Handle SPA route changes, mutation noise, tooltips, chat streams, and high-dynamic list pages.",
    fields: ["mutationExcludeSelectors", "observeUrlChange", "urlChangeDelay", "advanceMergeConfig", "dynamicPreset", "isHighDynamic"],
    runtime: "implemented",
    action: "Use directly for queue limits, mutation filters, SPA delay, and chat/high-dynamic presets.",
  },
  {
    group: "ai streaming",
    purpose: "Special-case streaming AI message pages where one DOM node is incrementally rewritten.",
    fields: ["aiRule"],
    runtime: "deferred",
    action: "Keep imported metadata but do not activate yet. Needs a separate streaming-message controller.",
  },
  {
    group: "mobile userscript",
    purpose: "Control userscript or mobile-specific gestures and panel placement.",
    fields: ["isShowUserscriptPagePopup", "fingerCountToToggleTranslagePageWhenTouching"],
    runtime: "skipped",
    action: "Ignore for this Chrome MV3 web translation core.",
  },
];

const rules = JSON.parse(await readFile(DATA_PATH, "utf8"));
if (!Array.isArray(rules)) throw new Error("Imported web rules payload is not an array");

console.log("Rule semantic alignment audit");
console.log(`Total imported rules: ${rules.length}`);
console.log(`Sample limit per group: ${SAMPLE_LIMIT}`);
console.log("");

for (const group of SEMANTIC_GROUPS) {
  const matches = rules.filter((rule) => group.fields.some((field) => hasField(rule, field)));
  console.log(`[${group.runtime}] ${group.group}`);
  console.log(`Purpose: ${group.purpose}`);
  console.log(`Action: ${group.action}`);
  console.log(`Rules using these fields: ${matches.length}`);
  console.log(`Fields: ${group.fields.map((field) => `${field}=${countRulesWithField(rules, field)}`).join(", ")}`);
  const sample = matches.slice(0, SAMPLE_LIMIT).map(ruleLabel);
  if (sample.length > 0) console.log(`Sample rules: ${sample.join(", ")}`);
  console.log("");
}

const implementedRules = rules.filter((rule) =>
  SEMANTIC_GROUPS.some((group) => group.runtime === "implemented" && group.fields.some((field) => hasField(rule, field)))
);
const deferredRules = rules.filter((rule) =>
  SEMANTIC_GROUPS.some((group) => group.runtime === "deferred" && group.fields.some((field) => hasField(rule, field)))
);

console.log("Summary");
console.log(`Implemented-field rules: ${implementedRules.length}`);
console.log(`Deferred-field rules: ${deferredRules.length}`);
console.log(`At least ${Math.min(SAMPLE_LIMIT, implementedRules.length)} implemented-field samples checked above per group.`);

function countRulesWithField(items, field) {
  return items.filter((rule) => hasField(rule, field)).length;
}

function hasField(rule, field) {
  if (hasMeaningfulValue(rule[field])) return true;
  return Object.keys(rule).some((key) =>
    (key === `${field}.add` ||
      key === `${field}.remove` ||
      key === `${field}.replace` ||
      key.startsWith(`${field}.add_v.`) ||
      key.startsWith(`${field}.remove_v.`)) &&
    hasMeaningfulValue(rule[key])
  );
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    if ("add" in value || "remove" in value || "replace" in value) {
      return hasMeaningfulValue(value.add) || hasMeaningfulValue(value.remove) || hasMeaningfulValue(value.replace);
    }
    return Object.keys(value).length > 0;
  }
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function ruleLabel(rule) {
  const site = rule.siteKey ?? firstHost(rule.matches) ?? firstHost(rule.selectorMatches) ?? "";
  return site && site !== rule.id ? `${rule.id}(${site})` : String(rule.id);
}

function firstHost(value) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return undefined;
  return first.replace(/^https?:\/\//, "").split(/[/*?#]/)[0];
}
