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
});
