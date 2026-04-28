import { describe, expect, it } from "vitest";
import { ALL_TRANSLATABLE_ATTRIBUTES, SAFE_TRANSLATABLE_ATTRIBUTES } from "@/content/domScanner";
import { resolveSitePolicy } from "@/content/sitePolicy";

describe("sitePolicy", () => {
  it("uses safe defaults for normal pages", () => {
    const policy = resolveSitePolicy("example.com");

    expect(policy.dynamicMode).toBe("normal");
    expect(policy.attributeNames).toEqual(SAFE_TRANSLATABLE_ATTRIBUTES);
    expect(policy.debounceMs).toBeGreaterThanOrEqual(1000);
    expect(policy.maxQueueSize).toBeGreaterThan(0);
    expect(policy.excludedDynamicSelectors).toContain('[role="tooltip"]');
  });

  it("uses a conservative dynamic policy for Twitter and X", () => {
    for (const hostname of ["x.com", "twitter.com", "mobile.twitter.com"]) {
      const policy = resolveSitePolicy(hostname);

      expect(policy.dynamicMode).toBe("conservative");
      expect(policy.attributeNames).toEqual([]);
      expect(policy.debounceMs).toBeGreaterThan(resolveSitePolicy("example.com").debounceMs);
      expect(policy.maxQueueSize).toBeLessThan(resolveSitePolicy("example.com").maxQueueSize);
      expect(policy.excludedDynamicSelectors).toContain('[data-testid="HoverCard"]');
    }
  });

  it("turns dynamic translation off when the user chooses off", () => {
    expect(resolveSitePolicy("example.com", "off").dynamicMode).toBe("off");
    expect(resolveSitePolicy("x.com", "off").dynamicMode).toBe("off");
  });

  it("uses conservative limits when the user chooses conservative on normal sites", () => {
    const normal = resolveSitePolicy("example.com", "normal");
    const conservative = resolveSitePolicy("example.com", "conservative");

    expect(conservative.dynamicMode).toBe("conservative");
    expect(conservative.maxQueueSize).toBeLessThan(normal.maxQueueSize);
    expect(conservative.debounceMs).toBeGreaterThan(normal.debounceMs);
  });

  it("keeps Twitter conservative even when the user chooses normal", () => {
    expect(resolveSitePolicy("x.com", "normal").dynamicMode).toBe("conservative");
  });

  it("keeps the complete attribute list available for explicit opt-in", () => {
    expect(ALL_TRANSLATABLE_ATTRIBUTES).toEqual(["placeholder", "alt", "title", "aria-label"]);
  });
});
