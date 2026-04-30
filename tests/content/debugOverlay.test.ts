import { afterEach, describe, expect, it } from "vitest";
import { DebugOverlay } from "@/content/debugOverlay";
import type { PageTranslationStatus } from "@/content/pageTranslationSession";

describe("DebugOverlay", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders page rule, queue, cache, provider, and scan diagnostics", () => {
    const listeners = new Set<(status: PageTranslationStatus) => void>();
    const status = createStatus();
    const overlay = new DebugOverlay({
      getStatus: () => status,
      subscribeStatus: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    });

    overlay.mount();

    const root = document.querySelector<HTMLElement>("[data-imt-debug-overlay='true']");
    expect(root).not.toBeNull();
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("x.com");
    expect(root?.querySelector("[data-testid='debug-overlay-rule']")?.textContent).toContain("core+imported");
    expect(root?.querySelector("[data-testid='debug-overlay-segments']")?.textContent).toContain("7");
    expect(root?.querySelector("[data-testid='debug-overlay-queue']")?.textContent).toContain("2");
    expect(root?.querySelector("[data-testid='debug-overlay-cache']")?.textContent).toContain("3 / 4");
    expect(root?.querySelector("[data-testid='debug-overlay-provider']")?.textContent).toContain("5 / 1");
    expect(root?.querySelector("[data-testid='debug-overlay-scan']")?.textContent).toContain("10 / 8 / 2");

    overlay.unmount();
    expect(document.querySelector("[data-imt-debug-overlay='true']")).toBeNull();
  });
});

function createStatus(): PageTranslationStatus {
  return {
    phase: "updating",
    observation: "queued",
    pendingRoots: 2,
    observedRoots: 9,
    dynamicRuns: 1,
    lastError: undefined,
    total: 7,
    translated: 4,
    failed: 1,
    skipped: 0,
    site: {
      hostname: "x.com",
      siteKey: "x.com",
      ruleId: "x",
      ruleSource: "core+imported",
      mergedRuleIds: ["x", "twitter"],
      dynamicMode: "conservative",
      dynamicModeSource: "site-default",
      isHighDynamic: true,
    },
    diagnostics: {
      scan: {
        text: {
          seen: 10,
          accepted: 8,
          skipped: 2,
          skippedByReason: { hidden: 2 },
        },
        attributes: {
          seen: 3,
          accepted: 2,
          skipped: 1,
          skippedByReason: { hidden: 1 },
        },
      },
      units: {
        built: 7,
        dropped: 1,
        droppedByReason: { "target-language": 1 },
      },
      cache: {
        hits: 3,
        misses: 4,
      },
      provider: {
        requested: 5,
        failed: 1,
        skipped: 0,
      },
    },
  };
}
