import { describe, expect, it } from "vitest";
import {
  isFastFullPageMode,
  progressivePageBatchOptions,
} from "@/content/contentMain";
import { DEFAULT_EXTENSION_CONFIG } from "@/shared/config";
import type { SitePolicy } from "@/content/sitePolicy";

function sitePolicy(overrides: Partial<SitePolicy> = {}): SitePolicy {
  return {
    isHighDynamic: false,
    fallbackProfile: "article",
    ...overrides,
  } as SitePolicy;
}

describe("contentMain fast full-page mode", () => {
  it("enables fast full-page eager translation only for the fast request profile outside social feeds", () => {
    expect(isFastFullPageMode(
      { ...DEFAULT_EXTENSION_CONFIG, requestProfile: "fast" },
      sitePolicy(),
    )).toBe(true);
    expect(isFastFullPageMode(
      { ...DEFAULT_EXTENSION_CONFIG, requestProfile: "balanced" },
      sitePolicy(),
    )).toBe(false);
    expect(isFastFullPageMode(
      { ...DEFAULT_EXTENSION_CONFIG, requestProfile: "fast" },
      sitePolicy({ isHighDynamic: true, fallbackProfile: "social" }),
    )).toBe(false);
  });

  it("uses aggressive normal batches for fast mode while keeping first-wave and dynamic batches small", () => {
    expect(progressivePageBatchOptions(
      {
        ...DEFAULT_EXTENSION_CONFIG,
        requestProfile: "fast",
        provider: "deepseek",
        deepseekMaxConcurrentRequests: 6,
        deepseekMaxBatchItems: 10,
        deepseekMaxBatchChars: 3500,
      },
      sitePolicy(),
    )).toEqual({
      firstWaveBatchItems: 3,
      firstWaveBatchChars: 1000,
      firstWaveConcurrentBatches: 2,
      progressiveBatchItems: 10,
      progressiveBatchChars: 3500,
      progressiveConcurrentBatches: 6,
      dynamicBatchItems: 4,
      dynamicBatchChars: 1600,
      dynamicConcurrentBatches: 2,
    });

    expect(progressivePageBatchOptions(
      {
        ...DEFAULT_EXTENSION_CONFIG,
        requestProfile: "balanced",
        provider: "deepseek",
        deepseekMaxConcurrentRequests: 6,
        deepseekMaxBatchItems: 10,
        deepseekMaxBatchChars: 3500,
      },
      sitePolicy(),
    )).toMatchObject({
      progressiveBatchItems: 8,
      progressiveBatchChars: 3500,
      progressiveConcurrentBatches: 6,
    });
  });
});
