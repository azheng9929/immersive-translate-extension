import { describe, expect, it } from "vitest";
import {
  areSitePolicySignaturesEqual,
  createSitePolicySignature,
} from "@/content/spaPolicy";
import { resolveSitePolicy, type SitePolicy } from "@/content/sitePolicy";

describe("spaPolicy", () => {
  it("keeps equivalent policy signatures stable", () => {
    const first = resolveSitePolicy("https://docs.example.com/guide", "normal", {
      rules: [
        {
          id: "docs",
          siteKey: "docs.example.com",
          matches: ["docs.example.com"],
          selectors: ["article p"],
          contentSelectors: [{ selector: "article p", category: "content-block" }],
          excludeSelectors: ["nav"],
        },
      ],
    });
    const second = resolveSitePolicy("https://docs.example.com/reference", "normal", {
      rules: [
        {
          id: "docs",
          siteKey: "docs.example.com",
          matches: ["docs.example.com"],
          selectors: ["article p"],
          contentSelectors: [{ selector: "article p", category: "content-block" }],
          excludeSelectors: ["nav"],
        },
      ],
    });

    expect(areSitePolicySignaturesEqual(
      createSitePolicySignature(first),
      createSitePolicySignature(second),
    )).toBe(true);
  });

  it("detects selector and dynamic policy changes across SPA routes", () => {
    const base = resolveSitePolicy("https://github.com/org/repo", "normal");
    const next = {
      ...base,
      ruleId: "github-issue",
      preferredScanRootSelectors: [".js-issue-title", ".comment-body"],
      contentSelectors: [{ selector: ".comment-body", category: "comment" }],
      excludeSelectors: [...base.excludeSelectors, ".gh-header-actions"],
      dynamicMode: "conservative",
      observeUrlChange: true,
      urlChangeDelay: 800,
    } satisfies SitePolicy;

    expect(areSitePolicySignaturesEqual(
      createSitePolicySignature(base),
      createSitePolicySignature(next),
    )).toBe(false);
  });
});
