import { describe, expect, it } from "vitest";
import { isSkippableElement, isMeaningfulText } from "@/shared/skipRules";

describe("isSkippableElement", () => {
  it("skips code and preformatted regions", () => {
    document.body.innerHTML = "<pre><code>Hello</code></pre>";
    expect(isSkippableElement(document.querySelector("pre")!)).toBe(true);
    expect(isSkippableElement(document.querySelector("code")!)).toBe(true);
  });

  it("skips buttons and navigation by default", () => {
    document.body.innerHTML = "<button>Submit</button>";
    expect(isSkippableElement(document.querySelector("button")!)).toBe(true);

    document.body.innerHTML = '<nav><a href="/docs">Docs</a></nav>';
    expect(isSkippableElement(document.querySelector("a")!)).toBe(true);
  });

  it("skips plugin-managed nodes", () => {
    document.body.innerHTML = '<span data-imt-managed="true">Translated</span>';
    expect(isSkippableElement(document.querySelector("span")!)).toBe(true);
  });

  it("allows tooltip text only when the caller opts in", () => {
    document.body.innerHTML = '<div role="tooltip"><p>Damage from attacks and Abilities.</p></div>';

    expect(isSkippableElement(document.querySelector("p")!)).toBe(true);
    expect(isSkippableElement(document.querySelector("p")!, { allowTooltip: true })).toBe(false);
  });
});

describe("isMeaningfulText", () => {
  it("rejects numbers, dates, urls, and email addresses", () => {
    expect(isMeaningfulText("12345", "content-block")).toBe(false);
    expect(isMeaningfulText("2026-04-27", "content-block")).toBe(false);
    expect(isMeaningfulText("https://example.com", "content-block")).toBe(false);
    expect(isMeaningfulText("hello@example.com", "content-block")).toBe(false);
  });

  it("keeps short UI text", () => {
    expect(isMeaningfulText("Save", "button")).toBe(true);
    expect(isMeaningfulText("OK", "button")).toBe(true);
  });

  it("rejects short content text outside UI", () => {
    expect(isMeaningfulText("OK", "content-block")).toBe(false);
  });

  it("keeps prose that resembles hexadecimal text", () => {
    expect(isMeaningfulText("defaced", "content-block")).toBe(true);
  });
});
