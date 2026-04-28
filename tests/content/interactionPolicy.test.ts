import { describe, expect, it } from "vitest";
import { shouldMountOriginalTextTooltip } from "@/content/interactionPolicy";

describe("interaction policy", () => {
  it("keeps hover original text tooltip disabled by default", () => {
    expect(shouldMountOriginalTextTooltip()).toBe(false);
  });
});
