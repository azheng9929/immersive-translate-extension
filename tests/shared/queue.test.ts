import { describe, expect, it } from "vitest";
import { TranslationQueue } from "@/shared/queue";

describe("TranslationQueue", () => {
  it("limits concurrency", async () => {
    const queue = new TranslationQueue(2);
    let active = 0;
    let maxActive = 0;

    const task = () =>
      queue.enqueue(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return "done";
      });

    await Promise.all([task(), task(), task(), task()]);
    expect(maxActive).toBe(2);
  });

  it("clears pending work without cancelling active work", async () => {
    const queue = new TranslationQueue(1);
    const slow = queue.enqueue(() => new Promise((resolve) => setTimeout(() => resolve("active"), 20)));
    const pending = queue.enqueue(async () => "pending");
    const pendingExpectation = expect(pending).rejects.toThrow("Translation task cancelled before start");
    queue.clearPending();

    await expect(slow).resolves.toBe("active");
    await pendingExpectation;
  });
});
