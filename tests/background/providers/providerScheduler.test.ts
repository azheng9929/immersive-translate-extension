import { describe, expect, it } from "vitest";
import { ProviderAdaptiveError, runProviderBatchesWithAdaptiveRetry } from "@/background/providers/providerScheduler";
import type { ProviderRequestItem } from "@/background/providers/providerTypes";

describe("providerScheduler", () => {
  it("reduces wave concurrency after throttled chunks", async () => {
    const waveSizes: number[] = [];
    let active = 0;
    const items = Array.from({ length: 6 }, (_, index): ProviderRequestItem => ({
      id: `u-${index + 1}`,
      text: `Text ${index + 1}`,
      category: "content-block",
    }));

    const result = await runProviderBatchesWithAdaptiveRetry(
      items,
      {
        maxBatchItems: 1,
        maxBatchChars: 100,
        maxConcurrentRequests: 3,
      },
      async (chunk) => {
        if (active === 0) waveSizes.push(0);
        active += 1;
        const waveIndex = waveSizes.length - 1;
        waveSizes[waveIndex] = (waveSizes[waveIndex] ?? 0) + 1;
        await Promise.resolve();
        active -= 1;

        const item = chunk[0] as ProviderRequestItem;
        if (item.id === "u-1") throw new Error("Provider failed: 429 Rate limit exceeded");
        return [{ id: item.id, text: `translated-${item.id}`, status: "ok" }];
      },
    );

    expect(waveSizes).toEqual([3, 2, 1]);
    expect(result).toEqual([
      { id: "u-1", text: "", status: "failed", error: "Provider failed: 429 Rate limit exceeded" },
      { id: "u-2", text: "translated-u-2", status: "ok" },
      { id: "u-3", text: "translated-u-3", status: "ok" },
      { id: "u-4", text: "translated-u-4", status: "ok" },
      { id: "u-5", text: "translated-u-5", status: "ok" },
      { id: "u-6", text: "translated-u-6", status: "ok" },
    ]);
  });

  it("shrinks later batch sizes when a provider reports token pressure", async () => {
    const requestSizes: number[] = [];
    const items = Array.from({ length: 10 }, (_, index): ProviderRequestItem => ({
      id: `u-${index + 1}`,
      text: `Text ${index + 1}`,
      category: "content-block",
    }));

    await runProviderBatchesWithAdaptiveRetry(
      items,
      {
        maxBatchItems: 4,
        maxBatchChars: 1000,
        maxConcurrentRequests: 1,
      },
      async (chunk) => {
        requestSizes.push(chunk.length);
        const responseItems = chunk.map((item) => ({ id: item.id, text: `translated-${item.id}`, status: "ok" as const }));
        if (requestSizes.length === 1) {
          return {
            items: responseItems,
            throttle: { reduceBatch: true, reason: "low token headroom" },
          };
        }
        return {
          items: responseItems,
        };
      },
    );

    expect(requestSizes.slice(0, 3)).toEqual([4, 2, 2]);
  });

  it("uses adaptive error metadata to reduce concurrency without relying on message text", async () => {
    const waveSizes: number[] = [];
    let active = 0;
    const items = Array.from({ length: 6 }, (_, index): ProviderRequestItem => ({
      id: `u-${index + 1}`,
      text: `Text ${index + 1}`,
      category: "content-block",
    }));

    await runProviderBatchesWithAdaptiveRetry(
      items,
      {
        maxBatchItems: 1,
        maxBatchChars: 100,
        maxConcurrentRequests: 3,
      },
      async (chunk) => {
        if (active === 0) waveSizes.push(0);
        active += 1;
        const waveIndex = waveSizes.length - 1;
        waveSizes[waveIndex] = (waveSizes[waveIndex] ?? 0) + 1;
        await Promise.resolve();
        active -= 1;

        const item = chunk[0] as ProviderRequestItem;
        if (item.id === "u-1") {
          throw new ProviderAdaptiveError("Provider asked us to slow down", {
            reduceConcurrency: true,
            reason: "low request headroom",
          });
        }
        return [{ id: item.id, text: `translated-${item.id}`, status: "ok" }];
      },
    );

    expect(waveSizes).toEqual([3, 2, 1]);
  });
});
