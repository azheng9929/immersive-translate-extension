import { shouldLoadImportedWebRulesForUrl } from "../shared/webRuleCatalog";
import { prepareImportedWebTranslationRules } from "../shared/importedWebRuleRuntime";
import { mayWebTranslationRuleMatchUrl, selectWebTranslationRulesForContent } from "../shared/webRuleMatcher";
import type { WebTranslationRule } from "../shared/webRuleTypes";

const IMPORTED_WEB_RULES_RESOURCE_PATH = "data/imported-immersive-web-rules.json";

let importedRulesPromise: Promise<readonly WebTranslationRule[]> | undefined;

export async function getWebRulesForUrl(url: string): Promise<WebTranslationRule[]> {
  if (!shouldLoadImportedWebRulesForUrl(url)) return [];
  const rules = await loadImportedWebRules();
  if (!rules.some((rule) => Boolean(rule.matches?.length) && mayWebTranslationRuleMatchUrl(url, rule))) return [];
  return selectWebTranslationRulesForContent(url, rules);
}

export function resetImportedWebRulesForTests(): void {
  importedRulesPromise = undefined;
}

async function loadImportedWebRules(): Promise<readonly WebTranslationRule[]> {
  importedRulesPromise ??= fetchImportedWebRules();
  return importedRulesPromise;
}

async function fetchImportedWebRules(): Promise<readonly WebTranslationRule[]> {
  const url = chrome.runtime.getURL(IMPORTED_WEB_RULES_RESOURCE_PATH);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load imported web rules: ${response.status}`);

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Imported web rules payload is not an array");
  return prepareImportedWebTranslationRules(data as WebTranslationRule[]);
}
