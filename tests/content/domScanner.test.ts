import { describe, expect, it } from "vitest";
import { scanDocumentText, scanTranslatableAttributes } from "@/content/domScanner";
import { mountFixture } from "@/test/domFixtures";

describe("scanDocumentText", () => {
  it("finds article, button, navigation, and table text", () => {
    mountFixture(`
      <main>
        <article><p>Hello <strong>world</strong>.</p></article>
        <button>Submit</button>
        <nav><a href="/settings">Settings</a></nav>
        <table><tr><td>Project name</td><td>2026-04-27</td></tr></table>
      </main>
    `);

    const results = scanDocumentText(document.body);
    const texts = results.map((item) => item.text);

    expect(texts).toContain("Hello");
    expect(texts).toContain("world");
    expect(texts).toContain("Submit");
    expect(texts).toContain("Settings");
    expect(texts).toContain("Project name");
    expect(texts).not.toContain("2026-04-27");
  });

  it("skips managed and code regions", () => {
    mountFixture(`
      <p>Translate me</p>
      <pre>const value = 1</pre>
      <span data-imt-managed="true">Managed translation</span>
    `);

    const texts = scanDocumentText(document.body).map((item) => item.text);

    expect(texts).toContain("Translate me");
    expect(texts).not.toContain("const value = 1");
    expect(texts).not.toContain("Managed translation");
  });
});

describe("scanTranslatableAttributes", () => {
  it("finds placeholder title alt and aria-label", () => {
    mountFixture(`
      <input placeholder="Search docs" aria-label="Search input" />
      <img alt="Product photo" />
      <button title="Open settings">⚙</button>
    `);

    const attrs = scanTranslatableAttributes(document.body);
    expect(attrs.map((attr) => `${attr.name}:${attr.originalValue}`)).toEqual([
      "placeholder:Search docs",
      "aria-label:Search input",
      "alt:Product photo",
      "title:Open settings",
    ]);
  });
});
