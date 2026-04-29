import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getWebRulesForUrl } from "@/background/webRuleStore";

describe("webRuleStore", () => {
  it("filters imported rules through shared matching code", () => {
    const rules = getWebRulesForUrl("https://medium.com/@writer/story");

    expect(rules.length).toBeGreaterThan(1);
    expect(rules.length).toBeLessThan(40);
    expect(rules.some((rule) => rule.id === "medium")).toBe(true);
    expect(rules.some((rule) => rule.id === "github")).toBe(false);
  });

  it("does not import content translation policy code", () => {
    const sourcePath = resolve(process.cwd(), "src/background/webRuleStore.ts");
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toContain("../content/webTranslationRules");
    expect(source).toContain("../shared/webRuleMatcher");
  });
});
