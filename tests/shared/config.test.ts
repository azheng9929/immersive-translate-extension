import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_CONFIG, normalizeExtensionConfig } from "@/shared/config";

describe("normalizeExtensionConfig", () => {
  it("returns the default config for missing input", () => {
    expect(normalizeExtensionConfig(undefined)).toEqual(DEFAULT_EXTENSION_CONFIG);
  });

  it("keeps supported basic settings", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "ja",
        provider: "fake",
        displayMode: "translation-only",
        dynamicMode: "conservative",
        showFloatingBall: false,
        useCache: false,
      }),
    ).toEqual({
      targetLang: "ja",
      provider: "fake",
      displayMode: "translation-only",
      dynamicMode: "conservative",
      showFloatingBall: false,
      useCache: false,
    });
  });

  it("rejects unsupported values back to defaults", () => {
    expect(
      normalizeExtensionConfig({
        targetLang: "",
        provider: "unknown",
        displayMode: "raw",
        dynamicMode: "aggressive",
        showFloatingBall: "yes",
        useCache: "no",
      }),
    ).toEqual(DEFAULT_EXTENSION_CONFIG);
  });
});
