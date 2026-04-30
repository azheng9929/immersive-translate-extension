import { afterEach, describe, expect, it } from "vitest";
import { ensureRuntimeStyle } from "@/content/style";

describe("ensureRuntimeStyle", () => {
  afterEach(() => {
    document.documentElement.querySelector("#imt-runtime-style")?.remove();
  });

  it("styles bilingual translations as quiet inline annotations instead of cards", () => {
    ensureRuntimeStyle();

    const css = document.documentElement.querySelector("#imt-runtime-style")?.textContent ?? "";

    expect(css).toContain(".imt-translation-block");
    expect(css).toContain("background: transparent");
    expect(css).toContain("border-inline-start");
    expect(css).toContain("padding-inline-start");
    expect(css).toContain("box-sizing: border-box");
  });

  it("keeps compact translations visually lighter than block translations", () => {
    ensureRuntimeStyle();

    const css = document.documentElement.querySelector("#imt-runtime-style")?.textContent ?? "";

    expect(css).toContain(".imt-translation-compact");
    expect(css).toContain("border-inline-start: 0");
    expect(css).toContain("font-size: 0.82em");
    expect(css).toContain("line-height: 1.32");
  });
});
