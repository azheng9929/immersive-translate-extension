import { IMPORTED_IMMERSIVE_RULE_CATALOG } from "./data/importedImmersiveRuleCatalog";
import { selectPotentialWebTranslationRulesForUrl } from "./webRuleMatcher";
import type { WebTranslationRule } from "./webRuleTypes";

export function selectPotentialImportedWebRuleCatalogForUrl(url: string): WebTranslationRule[] {
  return selectPotentialWebTranslationRulesForUrl(url, IMPORTED_IMMERSIVE_RULE_CATALOG);
}

export function shouldLoadImportedWebRulesForUrl(url: string): boolean {
  return selectPotentialImportedWebRuleCatalogForUrl(url).length > 0;
}
