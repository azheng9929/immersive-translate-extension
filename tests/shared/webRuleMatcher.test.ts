import { describe, expect, it } from "vitest";
import {
  matchWebTranslationRule,
  selectWebTranslationRulesForContent,
} from "@/shared/webRuleMatcher";
import type { WebTranslationRule } from "@/shared/webRuleTypes";

describe("webRuleMatcher", () => {
  it("matches host wildcard, host path, exclude URL, and DOM-shape rules without content modules", () => {
    document.body.innerHTML = `<main data-reader><p>Article body.</p></main>`;
    const rules: WebTranslationRule[] = [
      { id: "wiki", matches: ["*.wikipedia.org"] },
      { id: "telegram", matches: ["web.telegram.org/z/*"] },
      { id: "settings", matches: ["example.com"], excludeMatches: ["example.com/settings/*"] },
      { id: "generic", matches: ["example.com"] },
      { id: "shape", matches: ["example.com"], selectorMatches: ["main[data-reader]"] },
    ];

    expect(matchWebTranslationRule("https://en.wikipedia.org/wiki/Translation", undefined, rules)?.id).toBe("wiki");
    expect(matchWebTranslationRule("https://web.telegram.org/z/#-123", undefined, rules)?.id).toBe("telegram");
    expect(matchWebTranslationRule("https://example.com/settings/profile", undefined, rules)?.id).toBe("generic");
    expect(matchWebTranslationRule("https://example.com/story", document, rules)?.id).toBe("shape");
  });

  it("selects DOM-detection rules plus the current URL rule for content-side matching", () => {
    const rules: WebTranslationRule[] = [
      { id: "news", matches: ["news.example.com"], selectors: ["article p"] },
      { id: "reader-shape", matches: ["news.example.com"], selectorMatches: ["main[data-reader]"], selectors: ["main p"] },
      { id: "shop", matches: ["shop.example.com"], selectors: [".product-title"] },
      { id: "paywall-shape", selectorMatches: [".paywall"], excludeSelectorMatches: [".logged-in"] },
    ];

    expect(selectWebTranslationRulesForContent("https://news.example.com/story", rules).map((rule) => rule.id)).toEqual([
      "news",
      "reader-shape",
    ]);
  });

  it("returns all URL-compatible rules and does not ship selector-only rules across sites by default", () => {
    const rules: WebTranslationRule[] = [
      { id: "core-content", matches: ["news.example.com"], selectors: ["article p"] },
      { id: "layout-fix", matches: ["news.example.com"], globalStyles: { ".headline": "-webkit-line-clamp: unset;" } },
      { id: "shape-same-site", matches: ["news.example.com"], selectorMatches: ["main[data-reader]"], selectors: ["main p"] },
      { id: "global-shape", selectorMatches: ["main[data-reader]"], selectors: [".wrong-site"] },
      { id: "shop", matches: ["shop.example.com"], selectors: [".product-title"] },
    ];

    expect(selectWebTranslationRulesForContent("https://news.example.com/story", rules).map((rule) => rule.id)).toEqual([
      "core-content",
      "layout-fix",
      "shape-same-site",
    ]);
  });

  it("does not let selector-only DOM shape rules steal a URL-specific rule", () => {
    document.body.innerHTML = `<main data-reader><p>Article body.</p></main>`;
    const rules: WebTranslationRule[] = [
      { id: "news", matches: ["news.example.com"], selectors: ["article p"] },
      { id: "selector-only", selectorMatches: ["main[data-reader]"], selectors: [".wrong-site"] },
    ];

    expect(matchWebTranslationRule("https://news.example.com/story", document, rules)?.id).toBe("news");
  });

  it("accepts scalar string match fields from advanced user config", () => {
    const rules = [
      {
        id: "scalar",
        matches: "example.com",
        excludeMatches: "example.com/private/*",
      },
    ] as unknown as WebTranslationRule[];

    expect(matchWebTranslationRule("https://example.com/post", undefined, rules)?.id).toBe("scalar");
    expect(matchWebTranslationRule("https://example.com/private/post", undefined, rules)).toBeUndefined();
  });
});
