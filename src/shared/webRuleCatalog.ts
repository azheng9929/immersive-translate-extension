import { IMPORTED_IMMERSIVE_RULE_CATALOG } from "./data/importedImmersiveRuleCatalog";
import { mayWebTranslationRuleMatchUrl, selectPotentialWebTranslationRulesForUrl } from "./webRuleMatcher";
import type { WebTranslationRule } from "./webRuleTypes";

export function selectPotentialImportedWebRuleCatalogForUrl(url: string): WebTranslationRule[] {
  return selectPotentialWebTranslationRulesForUrl(url, IMPORTED_IMMERSIVE_RULE_CATALOG);
}

export function shouldLoadImportedWebRulesForUrl(url: string): boolean {
  return (IMPORTED_IMMERSIVE_RULE_CATALOG as readonly WebTranslationRule[]).some((rule) =>
    Boolean(rule.matches?.length) && mayWebTranslationRuleMatchUrl(url, rule)
  );
}
