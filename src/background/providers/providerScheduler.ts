import type { ProviderRequestItem, ProviderResponseItem } from "./providerTypes";

type ProviderSchedulerOptions = {
  maxBatchItems: number;
  maxBatchChars: number;
  maxConcurrentRequests: number;
};

export type ProviderThrottleSignal = {
  reduceConcurrency?: boolean;
  reduceBatch?: boolean;
  retryAfterMs?: number;
  reason?: string;
};

export type ProviderChunkRunResult =
  | ProviderResponseItem[]
  | {
      items: ProviderResponseItem[];
      throttle?: ProviderThrottleSignal;
    };

type AdaptiveChunkResult = {
  items: ProviderResponseItem[];
  degraded: boolean;
  throttle?: ProviderThrottleSignal;
};

type SchedulerState = {
  maxBatchItems: number;
  maxBatchChars: number;
  maxConcurrency: number;
  currentBatchItems: number;
  currentBatchChars: number;
  currentConcurrency: number;
  stableConcurrencyWaves: number;
  stableBatchWaves: number;
};

export class ProviderAdaptiveError extends Error {
  readonly throttle?: ProviderThrottleSignal;

  constructor(message: string, throttle?: ProviderThrottleSignal) {
    super(message);
    this.name = "ProviderAdaptiveError";
    if (throttle) this.throttle = throttle;
  }
}

export async function runProviderBatchesWithAdaptiveRetry(
  items: ProviderRequestItem[],
  options: ProviderSchedulerOptions,
  runChunk: (items: ProviderRequestItem[]) => Promise<ProviderChunkRunResult>,
): Promise<ProviderResponseItem[]> {
  const state = createSchedulerState(options);
  const results: ProviderResponseItem[] = [];
  let nextIndex = 0;

  while (nextIndex < items.length) {
    const chunks: ProviderRequestItem[][] = [];
    for (let index = 0; index < state.currentConcurrency && nextIndex < items.length; index += 1) {
      const chunk = takeChunk(items, nextIndex, state.currentBatchItems, state.currentBatchChars);
      chunks.push(chunk);
      nextIndex += chunk.length;
    }

    const waveResults = await Promise.all(chunks.map((chunk) => runChunkWithAdaptiveRetry(chunk, runChunk)));
    for (const result of waveResults) results.push(...result.items);
    tuneSchedulerState(state, waveResults);
  }

  return results;
}

function createSchedulerState(options: ProviderSchedulerOptions): SchedulerState {
  const maxBatchItems = Math.max(1, options.maxBatchItems);
  const maxBatchChars = Math.max(1, options.maxBatchChars);
  const maxConcurrency = Math.max(1, options.maxConcurrentRequests);

  return {
    maxBatchItems,
    maxBatchChars,
    maxConcurrency,
    currentBatchItems: maxBatchItems,
    currentBatchChars: maxBatchChars,
    currentConcurrency: maxConcurrency,
    stableConcurrencyWaves: 0,
    stableBatchWaves: 0,
  };
}

function takeChunk(
  items: ProviderRequestItem[],
  startIndex: number,
  maxBatchItems: number,
  maxBatchChars: number,
): ProviderRequestItem[] {
  const chunk: ProviderRequestItem[] = [];
  let currentChars = 0;

  for (let index = startIndex; index < items.length; index += 1) {
    const item = items[index] as ProviderRequestItem;
    const itemChars = item.text.length;
    const wouldOverflowItems = chunk.length >= maxBatchItems;
    const wouldOverflowChars = chunk.length > 0 && currentChars + itemChars > maxBatchChars;
    if (wouldOverflowItems || wouldOverflowChars) break;

    chunk.push(item);
    currentChars += itemChars;
  }

  return chunk.length > 0 ? chunk : [items[startIndex] as ProviderRequestItem];
}

function tuneSchedulerState(state: SchedulerState, waveResults: AdaptiveChunkResult[]): void {
  const shouldReduceConcurrency = waveResults.some((result) => result.degraded || result.throttle?.reduceConcurrency);
  const shouldReduceBatch = waveResults.some((result) => result.throttle?.reduceBatch);

  if (shouldReduceConcurrency) {
    state.currentConcurrency = Math.max(1, state.currentConcurrency - 1);
    state.stableConcurrencyWaves = 0;
  } else if (state.currentConcurrency < state.maxConcurrency) {
    state.stableConcurrencyWaves += 1;
    if (state.stableConcurrencyWaves >= 2) {
      state.currentConcurrency += 1;
      state.stableConcurrencyWaves = 0;
    }
  }

  if (shouldReduceBatch) {
    state.currentBatchItems = Math.max(1, Math.floor(state.currentBatchItems / 2));
    state.currentBatchChars = Math.max(Math.min(500, state.maxBatchChars), Math.floor(state.currentBatchChars * 0.65));
    state.stableBatchWaves = 0;
  } else if (state.currentBatchItems < state.maxBatchItems || state.currentBatchChars < state.maxBatchChars) {
    state.stableBatchWaves += 1;
    if (state.stableBatchWaves >= 3) {
      state.currentBatchItems = Math.min(state.maxBatchItems, state.currentBatchItems + 1);
      state.currentBatchChars = Math.min(state.maxBatchChars, Math.ceil(state.currentBatchChars * 1.25));
      state.stableBatchWaves = 0;
    }
  }
}

async function runChunkWithAdaptiveRetry(
  chunk: ProviderRequestItem[],
  runChunk: (items: ProviderRequestItem[]) => Promise<ProviderChunkRunResult>,
): Promise<AdaptiveChunkResult> {
  try {
    return normalizeChunkRunResult(await runChunk(chunk));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const throttle = getErrorThrottleSignal(error);
    if (chunk.length > 1 && shouldRetryWithSmallerChunks(message, throttle)) {
      const smallerResults: AdaptiveChunkResult[] = [];
      for (const smallerChunk of splitChunk(chunk)) {
        smallerResults.push(await runChunkWithAdaptiveRetry(smallerChunk, runChunk));
      }
      return adaptiveResult(smallerResults.flatMap((result) => result.items), true, throttle);
    }

    return adaptiveResult(
      chunk.map((item) => failedItem(item, message)),
      shouldReduceConcurrency(message) || shouldReduceFromThrottle(throttle),
      throttle,
    );
  }
}

function normalizeChunkRunResult(result: ProviderChunkRunResult): AdaptiveChunkResult {
  if (Array.isArray(result)) {
    return {
      items: result,
      degraded: false,
    };
  }

  return adaptiveResult(result.items, shouldReduceFromThrottle(result.throttle), result.throttle);
}

function adaptiveResult(
  items: ProviderResponseItem[],
  degraded: boolean,
  throttle?: ProviderThrottleSignal,
): AdaptiveChunkResult {
  const result: AdaptiveChunkResult = {
    items,
    degraded,
  };
  if (throttle) result.throttle = throttle;
  return result;
}

function splitChunk(chunk: ProviderRequestItem[]): ProviderRequestItem[][] {
  if (chunk.length <= 1) return [chunk];
  const midpoint = Math.ceil(chunk.length / 2);
  return [chunk.slice(0, midpoint), chunk.slice(midpoint)].filter((items) => items.length > 0);
}

function shouldRetryWithSmallerChunks(message: string, throttle?: ProviderThrottleSignal): boolean {
  return throttle?.reduceBatch === true ||
    shouldReduceConcurrency(message) ||
    /invalid JSON|missing .*items|missing .*content|empty .*result/i.test(message);
}

function shouldReduceConcurrency(message: string): boolean {
  return /429|rate limit|quota|too many|timed out|timeout|5\d\d|server error|temporarily unavailable/i.test(message);
}

function shouldReduceFromThrottle(throttle?: ProviderThrottleSignal): boolean {
  return throttle?.reduceConcurrency === true || throttle?.reduceBatch === true;
}

function getErrorThrottleSignal(error: unknown): ProviderThrottleSignal | undefined {
  return error instanceof ProviderAdaptiveError ? error.throttle : undefined;
}

function failedItem(item: ProviderRequestItem, error: string): ProviderResponseItem {
  return {
    id: item.id,
    text: "",
    status: "failed",
    error,
  };
}
