import { describe, expect, it } from "vitest";
import { analyzeWebTranslationRuleCapability } from "@/shared/webRuleCapability";
import type { WebTranslationRule } from "@/shared/webRuleTypes";

describe("webRuleCapability", () => {
  it("treats aiRule message wrappers as executable web content anchors", () => {
    const summary = analyzeWebTranslationRuleCapability({
      id: "claudeAi",
      siteKey: "claude.ai",
      matches: ["claude.ai"],
      aiRule: {
        messageWrapperSelector: ".contents",
        messageContainerSelector: ".ReactMarkdown",
        streamingChange: true,
      },
    } as WebTranslationRule);

    expect(summary).toMatchObject({
      capability: "content-ready",
      fallbackProfile: "social",
      hasContentAnchors: true,
      hasDynamicHints: true,
      contentAnchorCount: 1,
    });
    expect(summary.reasons).toContain("1 content anchors");
    expect(summary.reasons).toContain("dynamic hints");
  });

  it("keeps scope-only roots separate from executable content anchors", () => {
    const summary = analyzeWebTranslationRuleCapability({
      id: "docs-shell",
      matches: ["docs.example.com"],
      mainFrameSelector: "main",
      bodyRule: {
        bodySelector: "main",
        articleSelector: "article",
      },
    } as WebTranslationRule);

    expect(summary).toMatchObject({
      capability: "scope-ready",
      hasContentAnchors: false,
      contentAnchorCount: 0,
      hasScopeAnchors: true,
      scopeAnchorCount: 3,
    });
    expect(summary.reasons).toContain("3 scope anchors");
  });
});
