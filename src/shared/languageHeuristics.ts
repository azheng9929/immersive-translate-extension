const HAN_TEXT = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const KANA_OR_HANGUL_TEXT = /[\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af]/u;

export function shouldSkipForTargetLanguage(value: string, targetLang?: string): boolean {
  if (!isChineseTargetLanguage(targetLang)) return false;
  if (!HAN_TEXT.test(value)) return false;
  if (KANA_OR_HANGUL_TEXT.test(value)) return false;
  return true;
}

function isChineseTargetLanguage(targetLang?: string): boolean {
  if (!targetLang) return false;
  const normalized = targetLang.trim().toLowerCase().replace("_", "-");
  return normalized === "zh" || normalized.startsWith("zh-") || normalized === "cmn" || normalized.startsWith("cmn-");
}
