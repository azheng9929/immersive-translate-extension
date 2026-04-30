import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWebRulesForUrl } from "@/background/webRuleStore";
import { stubImportedRulesResource } from "../helpers/importedRulesResource";

describe("webRuleStore", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = stubImportedRulesResource();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filters imported rules through shared matching code", async () => {
    const rules = await getWebRulesForUrl("https://medium.com/@writer/story");

    expect(rules.length).toBeGreaterThan(1);
    expect(rules.length).toBeLessThan(80);
    expect(rules.some((rule) => rule.id === "medium")).toBe(true);
    expect(rules.some((rule) => rule.id === "github")).toBe(false);
  });

  it("does not load imported rules for unrelated pages", async () => {
    await expect(getWebRulesForUrl("https://example.invalid/story")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps advanced immersive rule fields in the lazily loaded dataset", async () => {
    const githubRules = await getWebRulesForUrl("https://github.com/openai/openai-node");
    const github = githubRules.find((rule) => rule.id === "github");
    expect(github).toMatchObject({
      detectParagraphLanguage: true,
      ruleSource: "imported-stable",
    });
    expect(github?.extraInlineSelectors).toContain("g-emoji");
    expect(github?.atomicBlockSelectors).toContain("[itemprop=description]");
    expect(github?.stayOriginalTags).toContain("CODE");
    expect(github?.globalStyles).toMatchObject({
      ".TimelineItem-body .Link--primary": "-webkit-line-clamp: unset;",
    });

    const mediumRules = await getWebRulesForUrl("https://medium.com/@writer/story");
    const medium = mediumRules.find((rule) => rule.id === "medium");
    expect(medium?.urlChangeDelay).toBe(20);
    expect(medium?.globalStyles).toMatchObject({
      "article p": "-webkit-line-clamp: unset;max-height:unset;",
    });
  });

  it("keeps supported body, container, and additional selector fields from the imported config", async () => {
    const wikipediaRules = await getWebRulesForUrl("https://en.wikipedia.org/wiki/Translation");
    const wikipedia = wikipediaRules.find((rule) => rule.id === "wikipedia");
    expect(wikipedia?.bodyRule).toMatchObject({
      bodySelector: "#content",
      articleSelector: "#bodyContent",
    });
    expect(wikipedia?.mainFrameSelector).toBe("#bodyContent");

    const maxrollRules = await getWebRulesForUrl("https://maxroll.gg/poe/build-guides/example");
    const maxroll = maxrollRules.find((rule) => rule.id === "maxroll");
    expect(maxroll?.buildContainerSelectors).toContain(".poe-content");

    const artstationRules = await getWebRulesForUrl("https://www.artstation.com/learning/courses/demo");
    const artstationLearning = artstationRules.find((rule) => rule.id === "artstationLearning");
    expect(artstationLearning?.selectors).toContain("footer.learning-course-description.ng-star-inserted > span");
  });

  it("filters imported rules whose primary surface is outside webpage translation", async () => {
    const rules = await getWebRulesForUrl("https://arxiv.org/pdf/2501.00001");

    expect(rules.map((rule) => rule.id)).not.toContain("pdf");
    expect(rules.map((rule) => rule.id)).not.toContain("finalCommon.pdfWebPage");
    expect(rules.map((rule) => rule.id)).not.toContain("NoTranslate");
    expect(rules.every((rule) => rule.ruleSource === "imported-stable" || rule.ruleSource === "imported-experimental"))
      .toBe(true);
  });

  it("does not statically import content or the full imported rule chunk", () => {
    const sourcePath = resolve(process.cwd(), "src/background/webRuleStore.ts");
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toContain("../content/webTranslationRules");
    expect(source).not.toMatch(/import\s+\{[^}]*IMPORTED_IMMERSIVE_WEB_RULES/);
    expect(source).not.toContain("importedImmersiveRules");
    expect(source).toContain("../shared/webRuleMatcher");
    expect(source).toContain("imported-immersive-web-rules.json");
    expect(source).toContain("fetch");
  });
});
