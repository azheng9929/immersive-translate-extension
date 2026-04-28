import type { ProviderRequestItem, ProviderResponseItem } from "./providerTypes";

type ProviderSchedulerOptions = {
  maxBatchItems: number;
  maxBatchChars: number;
  maxConcurrentRequests: number;
};

type AdaptiveChunkResult = {
  items: ProviderResponseItem[];
  degraded: boolean;
};

export async function runProviderBatchesWithAdaptiveRetry(
  items: ProviderRequestItem[],
  options: ProviderSchedulerOptions,
  runChunk: (items: ProviderRequestItem[]) => Promise<ProviderResponseItem[]>,
): Promise<ProviderResponseItem[]> {
  const chunks = chunkItems(items, options.maxBatchItems, options.maxBatchChars);
  const results = await mapChunksInAdaptiveWaves(chunks, options.maxConcurrentRequests, (chunk) =>
    runChunkWithAdaptiveRetry(chunk, runChunk),
  );
  return results.flatMap((result) => result.items);
}

function chunkItems(
  items: ProviderRequestItem[],
  maxBatchItems: number,
  maxBatchChars: number,
): ProviderRequestItem[][] {
  const chunks: ProviderRequestItem[][] = [];
  let current: ProviderRequestItem[] = [];
  let currentChars = 0;

  for (const item of items) {
    const itemChars = item.text.length;
    const wouldOverflowItems = current.length >= maxBatchItems;
    const wouldOverflowChars = current.length > 0 && currentChars + itemChars > maxBatchChars;

    if (wouldOverflowItems || wouldOverflowChars) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(item);
    currentChars += itemChars;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function mapChunksInAdaptiveWaves(
  chunks: ProviderRequestItem[][],
  maxConcurrentRequests: number,
  run: (chunk: ProviderRequestItem[]) => Promise<AdaptiveChunkResult>,
): Promise<AdaptiveChunkResult[]> {
  const results = new Array<AdaptiveChunkResult>(chunks.length);
  let nextIndex = 0;
  let currentConcurrency = Math.max(1, maxConcurrentRequests);
  let stableWaves = 0;

  while (nextIndex < chunks.length) {
    const waveSize = Math.min(currentConcurrency, chunks.length - nextIndex);
    const waveIndexes = Array.from({ length: waveSize }, (_, offset) => nextIndex + offset);
    nextIndex += waveSize;

    const waveResults = await Promise.all(waveIndexes.map((index) => run(chunks[index] as ProviderRequestItem[])));
    waveResults.forEach((result, offset) => {
      results[waveIndexes[offset] as number] = result;
    });

    if (waveResults.some((result) => result.degraded)) {
      currentConcurrency = Math.max(1, currentConcurrency - 1);
      stableWaves = 0;
    } else if (currentConcurrency < maxConcurrentRequests) {
      stableWaves += 1;
      if (stableWaves >= 2) {
        currentConcurrency += 1;
        stableWaves = 0;
      }
    }
  }

  return results;
}

async function runChunkWithAdaptiveRetry(
  chunk: ProviderRequestItem[],
  runChunk: (items: ProviderRequestItem[]) => Promise<ProviderResponseItem[]>,
): Promise<AdaptiveChunkResult> {
  try {
    return {
      items: await runChunk(chunk),
      degraded: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (chunk.length > 1 && shouldRetryWithSmallerChunks(message)) {
      const smallerResults: AdaptiveChunkResult[] = [];
      for (const smallerChunk of splitChunk(chunk)) {
        smallerResults.push(await runChunkWithAdaptiveRetry(smallerChunk, runChunk));
      }
      return {
        items: smallerResults.flatMap((result) => result.items),
        degraded: true,
      };
    }

    return {
      items: chunk.map((item) => failedItem(item, message)),
      degraded: shouldReduceConcurrency(message),
    };
  }
}

function splitChunk(chunk: ProviderRequestItem[]): ProviderRequestItem[][] {
  if (chunk.length <= 1) return [chunk];
  const midpoint = Math.ceil(chunk.length / 2);
  return [chunk.slice(0, midpoint), chunk.slice(midpoint)].filter((items) => items.length > 0);
}

function shouldRetryWithSmallerChunks(message: string): boolean {
  return shouldReduceConcurrency(message) || /invalid JSON|missing .*items|missing .*content|empty .*result/i.test(message);
}

function shouldReduceConcurrency(message: string): boolean {
  return /429|rate limit|quota|too many|timed out|timeout|5\d\d|server error|temporarily unavailable/i.test(message);
}

function failedItem(item: ProviderRequestItem, error: string): ProviderResponseItem {
  return {
    id: item.id,
    text: "",
    status: "failed",
    error,
  };
}
