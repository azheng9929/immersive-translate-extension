import { describe, expect, it } from "vitest";
import { setSiteDynamicModeRule, normalizeSiteRuleKey } from "@/shared/siteRules";

describe("site rule helpers", () => {
  it("normalizes user-entered hosts and URLs to stable site keys", () => {
    expect(normalizeSiteRuleKey("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
    expect(normalizeSiteRuleKey("https://mobile.twitter.com/home")).toBe("twitter.com");
    expect(normalizeSiteRuleKey("WWW.Example.COM:443/docs")).toBe("example.com");
    expect(normalizeSiteRuleKey("not a host")).toBe("");
  });

  it("adds and removes dynamic mode overrides by normalized site key", () => {
    const added = setSiteDynamicModeRule({}, "https://www.reddit.com/r/typescript", "off");
    expect(added).toEqual({ "reddit.com": "off" });

    const removed = setSiteDynamicModeRule(added, "reddit.com", "auto");
    expect(removed).toEqual({});
  });
});
