import { afterEach, describe, expect, it } from "vitest";
import {
  clearTranslationPermitQueues,
  resetTranslationPermitStateForTests,
  withTranslationPermit,
} from "@/background/translationPermit";

describe("translationPermit", () => {
  afterEach(() => {
    resetTranslationPermitStateForTests();
  });

  it("limits concurrent provider work and starts queued requests when a permit is released", async () => {
    const events: string[] = [];
    let releaseFirst: (() => void) | undefined;

    const first = withTranslationPermit("openai-compatible", 1, async () => {
      events.push("first:start");
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      events.push("first:end");
      return "first";
    });
    const second = withTranslationPermit("openai-compatible", 1, async () => {
      events.push("second:start");
      return "second";
    });

    await Promise.resolve();
    expect(events).toEqual(["first:start"]);

    releaseFirst?.();
    await expect(Promise.all([first, second])).resolves.toEqual(["first", "second"]);
    expect(events).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("rejects queued work when the translation queue is cleared", async () => {
    let releaseFirst: (() => void) | undefined;

    const first = withTranslationPermit("openai-compatible", 1, async () => {
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      return "first";
    });
    const second = withTranslationPermit("openai-compatible", 1, async () => "second");

    await Promise.resolve();
    clearTranslationPermitQueues("openai-compatible");

    const secondStatus = await promiseStatus(second);
    expect(secondStatus).toEqual({
      status: "rejected",
      message: "Translation queue cleared",
    });

    releaseFirst?.();
    await expect(first).resolves.toBe("first");
  });
});

async function promiseStatus<T>(promise: Promise<T>): Promise<{ status: "pending" | "resolved" | "rejected"; message?: string }> {
  let status: { status: "pending" | "resolved" | "rejected"; message?: string } = { status: "pending" };
  promise.then(
    () => {
      status = { status: "resolved" };
    },
    (error: unknown) => {
      status = { status: "rejected", message: error instanceof Error ? error.message : String(error) };
    },
  );
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return status;
}
