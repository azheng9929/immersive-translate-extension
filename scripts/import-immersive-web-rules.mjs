import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = process.argv[2] ??
  resolve(process.cwd(), "..", "_analysis", "chrome-immersive-translate-1_28_5", "unpacked", "default_config.json");
const rulesOutPath = resolve(process.cwd(), "public", "data", "imported-immersive-web-rules.json");
const catalogOutPath = resolve(process.cwd(), "src", "shared", "data", "importedImmersiveRuleCatalog.ts");

const config = JSON.parse(readFileSync(sourcePath, "utf8"));
const rules = config.rules
  .map(normalizeRule)
  .filter((rule) => rule.matches?.length || rule.selectorMatches?.length);

writeFileSync(rulesOutPath, `${JSON.stringify(rules, null, 2)}\n`);
writeFileSync(catalogOutPath, renderCatalog(rules));
console.log(`Imported ${rules.length} web rules from ${sourcePath}`);

function normalizeRule(source) {
  const matches = collectArray(source, "matches");
  const selectors = collectArray(source, "selectors");
  const excludeSelectors = collectArray(source, "excludeSelectors", ["additionalExcludeSelectors"]);
  const mutationExcludeSelectors = collectArray(source, "mutationExcludeSelectors");
  const injectedCss = collectArray(source, "injectedCss");
  const extraBlockSelectors = collectArray(source, "extraBlockSelectors");
  const extraInlineSelectors = collectArray(source, "extraInlineSelectors");
  const atomicBlockSelectors = collectArray(source, "atomicBlockSelectors");
  const stayOriginalSelectors = collectArray(source, "stayOriginalSelectors");
  const stayOriginalTags = collectArray(source, "stayOriginalTags").map((tag) => tag.toUpperCase());
  const globalStyles = collectRecord(source, "globalStyles");

  const rule = compact({
    id: String(source.id),
    siteKey: inferSiteKey(source, matches),
    matches,
    excludeMatches: collectArray(source, "excludeMatches"),
    selectorMatches: collectArray(source, "selectorMatches"),
    excludeSelectorMatches: collectArray(source, "excludeSelectorMatches"),
    selectors,
    excludeSelectors,
    mutationExcludeSelectors,
    injectedCss,
    extraBlockSelectors,
    extraInlineSelectors,
    atomicBlockSelectors,
    stayOriginalSelectors,
    stayOriginalTags,
    globalStyles,
    mainFrameSelector: source.mainFrameSelector,
    observeUrlChange: source.observeUrlChange,
    urlChangeDelay: source.urlChangeDelay,
    detectParagraphLanguage: source.detectParagraphLanguage,
    paragraphMinTextCount: source.paragraphMinTextCount,
    paragraphMinWordCount: source.paragraphMinWordCount,
    blockMinTextCount: source.blockMinTextCount,
    blockMinWordCount: source.blockMinWordCount,
    advanceMergeConfig: normalizeAdvanceMergeConfig(source.advanceMergeConfig, source.id),
    ...dynamicHints(source),
  });

  return rule;
}

function collectArray(source, field, aliases = []) {
  let values = toArray(source[field]);
  const remove = new Set();

  for (const key of [field, ...aliases]) {
    values = values.concat(toArray(source[`${key}.add`]));
    for (const [sourceKey, value] of Object.entries(source)) {
      if (sourceKey.startsWith(`${key}.add_v.`)) values = values.concat(toArray(value));
      if (sourceKey === `${key}.remove` || sourceKey.startsWith(`${key}.remove_v.`)) {
        for (const item of toArray(value)) remove.add(String(item));
      }
    }
  }

  return unique(values.map(String).filter((value) => value.trim().length > 0 && !remove.has(value)));
}

function collectRecord(source, field) {
  const output = {};
  assignRecord(output, source[field]);
  assignRecord(output, source[`${field}.add`]);

  for (const [sourceKey, value] of Object.entries(source)) {
    if (sourceKey.startsWith(`${field}.add_v.`)) assignRecord(output, value);
    if (sourceKey === `${field}.remove` || sourceKey.startsWith(`${field}.remove_v.`)) {
      for (const key of toArray(value)) delete output[key];
    }
  }

  return output;
}

function assignRecord(target, value) {
  if (!value || Array.isArray(value) || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") target[key] = entry;
  }
}

function normalizeAdvanceMergeConfig(value, id) {
  if (!Array.isArray(value)) return undefined;
  const entries = value.map((entry) => ({
    condition: String(entry.condition ?? "true"),
    advanceConfig: normalizeAdvanceConfig(entry.advanceConfig ?? {}, id),
  })).filter((entry) => Object.keys(entry.advanceConfig).length > 0);
  return entries.length > 0 ? entries : undefined;
}

function normalizeAdvanceConfig(source, id) {
  return compact({
    selectors: collectArray(source, "selectors"),
    excludeSelectors: collectArray(source, "excludeSelectors", ["additionalExcludeSelectors"]),
    mutationExcludeSelectors: collectArray(source, "mutationExcludeSelectors"),
    injectedCss: collectArray(source, "injectedCss"),
    extraBlockSelectors: collectArray(source, "extraBlockSelectors"),
    extraInlineSelectors: collectArray(source, "extraInlineSelectors"),
    atomicBlockSelectors: collectArray(source, "atomicBlockSelectors"),
    stayOriginalSelectors: collectArray(source, "stayOriginalSelectors"),
    stayOriginalTags: collectArray(source, "stayOriginalTags").map((tag) => tag.toUpperCase()),
    globalStyles: collectRecord(source, "globalStyles"),
    mainFrameSelector: source.mainFrameSelector,
    observeUrlChange: source.observeUrlChange,
    urlChangeDelay: source.urlChangeDelay,
    detectParagraphLanguage: source.detectParagraphLanguage,
    paragraphMinTextCount: source.paragraphMinTextCount,
    paragraphMinWordCount: source.paragraphMinWordCount,
    blockMinTextCount: source.blockMinTextCount,
    blockMinWordCount: source.blockMinWordCount,
    ...dynamicHints({ id, ...source }),
  });
}

function dynamicHints(source) {
  const id = String(source.id ?? "").toLowerCase();
  if (["discord", "telegram", "slack", "googlemail", "outlook", "team"].includes(id)) {
    return { dynamicPreset: "chat-stream", isHighDynamic: true };
  }
  return {};
}

function inferSiteKey(source, matches) {
  if (source.siteKey) return String(source.siteKey);
  const match = matches.find((item) => item && !item.includes("*")) ?? matches[0];
  if (!match) return undefined;
  try {
    const url = new URL(match.includes("://") ? match : `https://${match}`);
    return url.hostname || undefined;
  } catch {
    return match.split("/")[0]?.replace(/^\*\./, "") || undefined;
  }
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function compact(rule) {
  const output = {};
  for (const [key, value] of Object.entries(rule)) {
    if (value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (isEmptyRecord(value)) continue;
    output[key] = value;
  }
  return output;
}

function isEmptyRecord(value) {
  return value && !Array.isArray(value) && typeof value === "object" && Object.keys(value).length === 0;
}

function unique(values) {
  return [...new Set(values)];
}

function renderCatalog(rules) {
  const entries = rules.map((rule) => compact({
    id: rule.id,
    siteKey: rule.siteKey,
    matches: rule.matches,
    excludeMatches: rule.excludeMatches,
    selectorMatches: rule.selectorMatches,
    excludeSelectorMatches: rule.excludeSelectorMatches,
  }));

  return `import type { WebTranslationRule } from "../webRuleTypes";

// Lightweight URL/DOM-shape catalog derived from public/data/imported-immersive-web-rules.json.
// It lets background decide whether the full imported rule chunk is needed for the current page.
export type ImportedImmersiveRuleCatalogEntry = Pick<
  WebTranslationRule,
  "id" | "siteKey" | "matches" | "excludeMatches" | "selectorMatches" | "excludeSelectorMatches"
>;

export const IMPORTED_IMMERSIVE_RULE_CATALOG = ${JSON.stringify(entries, null, 2)} as const satisfies readonly ImportedImmersiveRuleCatalogEntry[];
`;
}
