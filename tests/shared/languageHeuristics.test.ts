import { describe, expect, it } from "vitest";
import { shouldSkipForTargetLanguage } from "@/shared/languageHeuristics";

describe("shouldSkipForTargetLanguage", () => {
  it("skips Chinese text with English terminology when target language is Chinese", () => {
    expect(shouldSkipForTargetLanguage("这篇文章介绍 React Server Components 的 streaming 策略。", "zh-Hans")).toBe(true);
    expect(shouldSkipForTargetLanguage("React Server Components 是一种新的架构。", "zh-Hant")).toBe(true);
  });

  it("does not skip English text when target language is Chinese", () => {
    expect(shouldSkipForTargetLanguage("React Server Components stream UI from the server.", "zh-Hans")).toBe(false);
  });

  it("does not treat Japanese or Korean text as Chinese just because Han characters appear", () => {
    expect(shouldSkipForTargetLanguage("これは漢字と API の説明です。", "zh-Hans")).toBe(false);
    expect(shouldSkipForTargetLanguage("이 문서는 漢字 API 설명입니다.", "zh-Hans")).toBe(false);
  });

  it("only applies Chinese target-language skipping to Chinese targets", () => {
    expect(shouldSkipForTargetLanguage("这是一段中文内容。", "en")).toBe(false);
  });
});
