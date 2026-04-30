const HAN_TEXT = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const HAN_TEXT_GLOBAL = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu;
const KANA_OR_HANGUL_TEXT = /[\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af]/u;
const LATIN_WORD = /[A-Za-z][A-Za-z0-9._+#'-]*/g;

export function shouldSkipForTargetLanguage(value: string, targetLang?: string): boolean {
  if (!isChineseTargetLanguage(targetLang)) return false;
  if (!HAN_TEXT.test(value)) return false;
  if (KANA_OR_HANGUL_TEXT.test(value)) return false;

  const hanCount = countMatches(value, HAN_TEXT_GLOBAL);
  const latinWords = value.match(LATIN_WORD) ?? [];

  if (latinWords.length >= 4 && hanCount <= 3) return false;
  return true;
}

function isChineseTargetLanguage(targetLang?: string): boolean {
  if (!targetLang) return false;
  const normalized = targetLang.trim().toLowerCase().replace("_", "-");
  return normalized === "zh" || normalized.startsWith("zh-") || normalized === "cmn" || normalized.startsWith("cmn-");
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}
