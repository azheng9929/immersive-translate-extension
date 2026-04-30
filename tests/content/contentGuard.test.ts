import { describe, expect, it } from "vitest";
import {
  classifyContentScriptUrl,
  decideContentMainLoad,
  isVisibleFrameMetrics,
  shouldRetryHiddenFrameMetrics,
  type FrameVisibilityMetrics,
} from "@/content/contentGuard";

describe("contentGuard", () => {
  it("loads the main content script in top frames", () => {
    expect(decideContentMainLoad({ href: "https://example.com/article", isTopFrame: true })).toEqual({
      load: true,
      reason: "top-frame",
    });
  });

  it("skips known ad and analytics frames before loading heavy translation code", () => {
    expect(decideContentMainLoad({ href: "https://securepubads.g.doubleclick.net/tag/js/gpt.js", isTopFrame: false })).toEqual({
      load: false,
      reason: "blocked-domain",
    });
    expect(classifyContentScriptUrl("https://ads.pubmatic.com/AdServer/js/pwt.js")).toEqual({
      blocked: true,
      reason: "blocked-domain",
    });
  });

  it("skips Cloudflare challenge pages", () => {
    expect(decideContentMainLoad({ href: "https://example.com/cdn-cgi/challenge-platform/h/b/orchestrate/jsch/v1", isTopFrame: true })).toEqual({
      load: false,
      reason: "cloudflare-challenge-page",
    });
  });

  it("loads only visible iframe frames", () => {
    const visible: FrameVisibilityMetrics = {
      width: 320,
      height: 180,
      rectWidth: 320,
      rectHeight: 180,
      visibleByViewport: true,
    };
    const hidden: FrameVisibilityMetrics = {
      width: 0,
      height: 0,
      rectWidth: 0,
      rectHeight: 0,
      visibleByViewport: true,
    };

    expect(isVisibleFrameMetrics(visible)).toBe(true);
    expect(isVisibleFrameMetrics(hidden)).toBe(false);
    expect(decideContentMainLoad({ href: "https://example.com/embed", isTopFrame: false, frameMetrics: visible })).toEqual({
      load: true,
      reason: "visible-iframe",
    });
    expect(decideContentMainLoad({ href: "https://example.com/embed", isTopFrame: false, frameMetrics: hidden })).toEqual({
      load: false,
      reason: "hidden-iframe",
    });
  });

  it("falls back to loading uncertain non-top frames instead of missing real embedded content", () => {
    expect(decideContentMainLoad({ href: "https://example.com/embed", isTopFrame: false })).toEqual({
      load: true,
      reason: "iframe-visibility-unknown",
    });
  });

  it("retries hidden iframe metrics when layout may not have settled yet", () => {
    expect(shouldRetryHiddenFrameMetrics({
      width: 0,
      height: 0,
      rectWidth: 0,
      rectHeight: 0,
      visibleByViewport: true,
    })).toBe(true);
    expect(shouldRetryHiddenFrameMetrics({
      width: 320,
      height: 180,
      rectWidth: 320,
      rectHeight: 180,
      visibleByViewport: false,
    })).toBe(false);
  });
});
