import { describe, expect, it } from "vitest";
import { fakeProvider } from "@/background/providers/fakeProvider";

describe("fakeProvider", () => {
  it("returns successful translated items in the original order", async () => {
    const result = await fakeProvider.translate({
      provider: "fake",
      targetLang: "zh-Hans",
      items: [
        { id: "u-1", text: "Hello", category: "content-block" },
        { id: "u-2", text: "Submit", category: "button" },
      ],
    });

    expect(result).toEqual([
      { id: "u-1", text: "[zh-Hans] Hello", status: "ok" },
      { id: "u-2", text: "[zh-Hans] Submit", status: "ok" },
    ]);
  });
});
