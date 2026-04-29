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
    expect(rules.length).toBeLessThan(40);
    expect(rules.some((rule) => rule.id === "medium")).toBe(true);
    expect(rules.some((rule) => rule.id === "github")).toBe(false);
  });

  it("does not load imported rules for unrelated pages", async () => {
    await expect(getWebRulesForUrl("https://example.invalid/story")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
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
