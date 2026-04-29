import { describe, expect, it } from "vitest";
import {
  selectPotentialImportedWebRuleCatalogForUrl,
  shouldLoadImportedWebRulesForUrl,
} from "@/shared/webRuleCatalog";

describe("webRuleCatalog", () => {
  it("uses a lightweight catalog to decide whether imported rules are worth loading", () => {
    expect(shouldLoadImportedWebRulesForUrl("https://example.invalid/story")).toBe(false);
    expect(shouldLoadImportedWebRulesForUrl("https://medium.com/@writer/story")).toBe(true);
  });

  it("keeps URL filtering available before loading full rule details", () => {
    const mediumCatalogRules = selectPotentialImportedWebRuleCatalogForUrl("https://medium.com/@writer/story");

    expect(mediumCatalogRules.some((rule) => rule.id === "medium")).toBe(true);
    expect(mediumCatalogRules.some((rule) => rule.id === "github")).toBe(false);
  });
});
