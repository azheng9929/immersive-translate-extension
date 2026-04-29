import { afterEach, describe, expect, it } from "vitest";
import {
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
});
