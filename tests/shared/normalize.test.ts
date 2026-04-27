import { describe, expect, it } from "vitest";
import { normalizeForCache, normalizeVisibleText } from "@/shared/normalize";

describe("normalizeVisibleText", () => {
  it("collapses whitespace while preserving readable punctuation", () => {
    expect(normalizeVisibleText("  Open   the\nsettings\tpage.  ")).toBe("Open the settings page.");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeVisibleText(" \n\t ")).toBe("");
  });
});

describe("normalizeForCache", () => {
  it("lowercases and collapses whitespace for cache keys", () => {
    expect(normalizeForCache("  Settings   Page ")).toBe("settings page");
  });
});
