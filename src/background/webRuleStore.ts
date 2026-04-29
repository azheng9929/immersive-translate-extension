import { IMPORTED_IMMERSIVE_WEB_RULES } from "../content/importedImmersiveRules";
import { selectWebTranslationRulesForContent } from "../shared/webRuleMatcher";
import type { WebTranslationRule } from "../shared/webRuleTypes";

export function getWebRulesForUrl(url: string): WebTranslationRule[] {
  return selectWebTranslationRulesForContent(url, IMPORTED_IMMERSIVE_WEB_RULES);
}
