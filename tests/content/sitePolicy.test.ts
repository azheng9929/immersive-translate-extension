import { describe, expect, it } from "vitest";
import { ALL_TRANSLATABLE_ATTRIBUTES, SAFE_TRANSLATABLE_ATTRIBUTES } from "@/content/domScanner";
import { resolveSitePolicy } from "@/content/sitePolicy";

describe("sitePolicy", () => {
  it("uses safe defaults for normal pages", () => {
    const policy = resolveSitePolicy("example.com");

    expect(policy.dynamicMode).toBe("normal");
    expect(policy.attributeNames).toEqual(SAFE_TRANSLATABLE_ATTRIBUTES);
    expect(policy.allowTooltip).toBe(true);
    expect(policy.debounceMs).toBeGreaterThanOrEqual(1000);
    expect(policy.maxQueueSize).toBeGreaterThan(0);
    expect(policy.excludedDynamicSelectors).not.toContain('[role="tooltip"]');
    expect(policy.excludedDynamicSelectors).not.toContain("[popover]");
  });

  it("uses a fast bounded dynamic policy for Twitter and X", () => {
    for (const hostname of ["x.com", "twitter.com", "mobile.twitter.com"]) {
      const policy = resolveSitePolicy(hostname);
      const normal = resolveSitePolicy("example.com");

      expect(policy.dynamicMode).toBe("conservative");
      expect(policy.attributeNames).toEqual([]);
      expect(policy.allowTooltip).toBe(false);
      expect(policy.debounceMs).toBeLessThan(3000);
      expect(policy.lazyRootMargin).toBe("700px");
      expect(policy.maxRootsPerFlush).toBeGreaterThan(6);
      expect(policy.maxRootsPerFlush).toBeLessThan(normal.maxRootsPerFlush);
      expect(policy.maxQueueSize).toBeLessThan(normal.maxQueueSize);
      expect(policy.excludedDynamicSelectors).toContain('[data-testid="HoverCard"]');
      expect(policy.excludedDynamicSelectors).toContain('[role="tooltip"]');
      expect(policy.excludedDynamicSelectors).toContain('[data-testid="sidebarColumn"]');
      expect(policy.preferredScanRootSelectors).toContain('div[data-testid="tweetText"]');
    }
  });

  it("uses conservative dynamic defaults for YouTube and Reddit", () => {
    for (const hostname of ["youtube.com", "www.youtube.com", "m.youtube.com", "reddit.com", "www.reddit.com", "old.reddit.com"]) {
      const policy = resolveSitePolicy(hostname);

      expect(policy.dynamicMode).toBe("conservative");
      expect(policy.dynamicModeSource).toBe("site-default");
      expect(policy.isHighDynamic).toBe(true);
      expect(policy.maxQueueSize).toBeLessThan(resolveSitePolicy("example.com").maxQueueSize);
    }
  });

  it("uses a wider fast policy for MetaTFT", () => {
    const policy = resolveSitePolicy("www.metatft.com");
    const normal = resolveSitePolicy("example.com");

    expect(policy.dynamicMode).toBe("normal");
    expect(policy.dynamicModeSource).toBe("site-default");
    expect(policy.isHighDynamic).toBe(true);
    expect(policy.siteKey).toBe("metatft.com");
    expect(policy.debounceMs).toBeLessThan(normal.debounceMs);
    expect(policy.lazyRootMargin).toBe("1400px");
    expect(policy.eagerLazyRootMargin).toBe("1800px");
    expect(policy.maxEagerLazyRoots).toBeGreaterThan(normal.maxEagerLazyRoots);
    expect(policy.maxRootsPerFlush).toBeGreaterThan(normal.maxRootsPerFlush);
  });

  it("uses a faster tooltip-friendly policy for Tactics Tools", () => {
    const policy = resolveSitePolicy("www.tactics.tools");
    const normal = resolveSitePolicy("example.com");

    expect(policy.siteKey).toBe("tactics.tools");
    expect(policy.dynamicMode).toBe("normal");
    expect(policy.dynamicModeSource).toBe("site-default");
    expect(policy.isHighDynamic).toBe(true);
    expect(policy.allowTooltip).toBe(true);
    expect(policy.debounceMs).toBeLessThan(normal.debounceMs);
    expect(policy.excludedDynamicSelectors).not.toContain('[role="tooltip"]');
    expect(policy.excludedDynamicSelectors).not.toContain("[popover]");
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

  it("lets an explicit site override force the dynamic mode", () => {
    const automatic = resolveSitePolicy("www.youtube.com", "normal");
    const forcedNormal = resolveSitePolicy("www.youtube.com", "normal", { siteDynamicMode: "normal" });
    const forcedOff = resolveSitePolicy("www.youtube.com", "normal", { siteDynamicMode: "off" });

    expect(automatic.dynamicMode).toBe("conservative");
    expect(forcedNormal).toMatchObject({
      dynamicMode: "normal",
      dynamicModeSource: "site-override",
      siteKey: "youtube.com",
    });
    expect(forcedNormal.maxQueueSize).toBeGreaterThan(automatic.maxQueueSize);
    expect(forcedOff.dynamicMode).toBe("off");
  });

  it("keeps the complete attribute list available for explicit opt-in", () => {
    expect(ALL_TRANSLATABLE_ATTRIBUTES).toEqual(["placeholder", "alt", "title", "aria-label"]);
  });
});
