import type { ProviderId } from "./providers/providerTypes";

type PermitState = {
  active: number;
  queue: (() => void)[];
};

const states = new Map<ProviderId, PermitState>();

export async function withTranslationPermit<T>(
  provider: ProviderId,
  maxConcurrentRequests: number | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const release = await acquireTranslationPermit(provider, maxConcurrentRequests);
  try {
    return await work();
  } finally {
    release();
  }
}

export function resetTranslationPermitStateForTests(): void {
  states.clear();
}

export function clearTranslationPermitQueues(provider?: ProviderId): void {
  if (provider) {
    const state = states.get(provider);
    if (state) state.queue = [];
    return;
  }
  for (const state of states.values()) state.queue = [];
}

async function acquireTranslationPermit(
  provider: ProviderId,
  maxConcurrentRequests: number | undefined,
): Promise<() => void> {
  const state = getState(provider);
  const capacity = normalizeCapacity(maxConcurrentRequests);

  if (state.active < capacity) {
    state.active += 1;
    return () => releasePermit(provider);
  }

  await new Promise<void>((resolve) => {
    state.queue.push(resolve);
  });
  state.active += 1;
  return () => releasePermit(provider);
}

function releasePermit(provider: ProviderId): void {
  const state = getState(provider);
  state.active = Math.max(0, state.active - 1);
  state.queue.shift()?.();
}

function getState(provider: ProviderId): PermitState {
  const existing = states.get(provider);
  if (existing) return existing;
  const next: PermitState = { active: 0, queue: [] };
  states.set(provider, next);
  return next;
}

function normalizeCapacity(value: number | undefined): number {
  if (!Number.isFinite(value)) return 4;
  return Math.max(1, Math.min(16, Math.round(value ?? 4)));
}
