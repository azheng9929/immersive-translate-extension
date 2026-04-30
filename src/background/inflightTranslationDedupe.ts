import { normalizeForCache } from "../shared/normalize";
import type { ProviderRequest, ProviderRequestItem, ProviderResponseItem } from "./providers/providerTypes";

type ProviderRequestRunner = (request: ProviderRequest) => Promise<ProviderResponseItem[]>;

type InflightEntry = {
  promise: Promise<ProviderResponseItem>;
};

type RequestGroup = {
  key: string;
  representative: ProviderRequestItem;
  items: ProviderRequestItem[];
};

type DeferredResult = {
  promise: Promise<ProviderResponseItem>;
  resolve: (item: ProviderResponseItem) => void;
  reject: (error: unknown) => void;
};

const inFlight = new Map<string, InflightEntry>();

export async function runProviderRequestWithInflightDedupe(
  request: ProviderRequest,
  runProviderRequest: ProviderRequestRunner,
): Promise<ProviderResponseItem[]> {
  if (request.items.length === 0) return [];

  const groups = groupRequestItems(request);
  const ownedGroups: Array<{ group: RequestGroup; deferred: DeferredResult }> = [];
  const promiseByGroupKey = new Map<string, Promise<ProviderResponseItem>>();

  for (const group of groups) {
    const existing = inFlight.get(group.key);
    if (existing) {
      promiseByGroupKey.set(group.key, existing.promise);
      continue;
    }

    const deferred = createDeferredResult();
    inFlight.set(group.key, { promise: deferred.promise });
    promiseByGroupKey.set(group.key, deferred.promise);
    ownedGroups.push({ group, deferred });
  }

  if (ownedGroups.length > 0) {
    void runOwnedGroups(request, ownedGroups, runProviderRequest);
  }

  const resolvedByKey = new Map<string, ProviderResponseItem>();
  await Promise.all(
    groups.map(async (group) => {
      const result = await promiseByGroupKey.get(group.key);
      if (result) resolvedByKey.set(group.key, result);
    }),
  );

  return request.items.map((item) => {
    const key = createInflightTranslationKey(request, item);
    const result = resolvedByKey.get(key);
    if (!result) return failedItem(item, "Missing in-flight translation result");
    return { ...result, id: item.id };
  });
}

export function resetInflightTranslationDedupeForTests(): void {
  inFlight.clear();
}

function groupRequestItems(request: ProviderRequest): RequestGroup[] {
  const groups: RequestGroup[] = [];
  const groupByKey = new Map<string, RequestGroup>();

  for (const item of request.items) {
    const key = createInflightTranslationKey(request, item);
    let group = groupByKey.get(key);
    if (!group) {
      group = { key, representative: item, items: [] };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

function runOwnedGroups(
  request: ProviderRequest,
  ownedGroups: Array<{ group: RequestGroup; deferred: DeferredResult }>,
  runProviderRequest: ProviderRequestRunner,
): Promise<void> {
  const representativeItems = ownedGroups.map(({ group }) => group.representative);
  return runProviderRequest({ ...request, items: representativeItems }).then(
    (results) => {
      const resultById = new Map(results.map((result) => [result.id, result]));
      for (const { group, deferred } of ownedGroups) {
        const result = resultById.get(group.representative.id);
        deferred.resolve(result && result.status === "ok" && result.text.length > 0
          ? result
          : result ?? failedItem(group.representative, "Missing provider result"));
      }
    },
    (error) => {
      for (const { deferred } of ownedGroups) deferred.reject(error);
    },
  ).finally(() => {
    for (const { group } of ownedGroups) inFlight.delete(group.key);
  });
}

function createInflightTranslationKey(request: ProviderRequest, item: ProviderRequestItem): string {
  return [
    request.provider,
    request.endpoint ?? "",
    request.model ?? "",
    request.sourceLang ?? "auto",
    request.targetLang,
    request.pageTitle ?? "",
    request.systemPrompt ?? "",
    item.cacheKey ?? normalizeForCache(item.text),
  ].join("\u001f");
}

function createDeferredResult(): DeferredResult {
  let resolve: DeferredResult["resolve"] | undefined;
  let reject: DeferredResult["reject"] | undefined;
  const promise = new Promise<ProviderResponseItem>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return {
    promise,
    resolve: (item) => resolve?.(item),
    reject: (error) => reject?.(error),
  };
}

function failedItem(item: ProviderRequestItem, error: string): ProviderResponseItem {
  return {
    id: item.id,
    text: "",
    status: "failed",
    error,
  };
}
