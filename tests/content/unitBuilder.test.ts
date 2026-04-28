import { describe, expect, it } from "vitest";
import { scanDocumentText, scanTranslatableAttributes } from "@/content/domScanner";
import { buildTranslationUnits } from "@/content/unitBuilder";
import { mountFixture } from "@/test/domFixtures";

describe("buildTranslationUnits", () => {
  it("merges inline text inside a paragraph into one unit", () => {
    mountFixture(`<p>Hello <a>settings page</a> and <strong>save</strong>.</p>`);
    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.root.tagName).toBe("P");
    expect(units[0]!.originalText).toBe("Hello settings page and save.");
  });

  it("keeps button text as a separate UI unit", () => {
    mountFixture(`<div><button>Submit</button><p>Submit your report.</p></div>`);
    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units.map((unit) => unit.category)).toEqual(["button", "content-block"]);
  });

  it("classifies menu links as menu units", () => {
    mountFixture(`<menu><a href="/open">Open</a></menu>`);
    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.category).toBe("menu");
  });

  it("does not reintroduce skipped code text when building unit text", () => {
    mountFixture(`<p>Hello <code>const value = 1</code> world.</p>`);
    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.originalText).toBe("Hello world.");
  });

  it("creates attribute units", () => {
    mountFixture(`<input placeholder="Search docs" />`);
    const units = buildTranslationUnits({
      scannedTexts: [],
      attributes: scanTranslatableAttributes(document.body),
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.category).toBe("attribute");
    expect(units[0]!.renderMode).toBe("replace-attribute");
    expect(units[0]!.originalText).toBe("Search docs");
  });

  it("carries site granularity roots and categories into translation units", () => {
    mountFixture(`
      <article>
        <div data-testid="User-Name">@openai</div>
        <div data-testid="tweetText" lang="en"><span>Shipping readable translation without moving the page layout.</span></div>
        <div role="button">Reply</div>
      </article>
      <shreddit-post>
        <a data-testid="post-title" slot="title">A practical guide to browser extension translation</a>
      </shreddit-post>
    `);

    const tweetUnits = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, { hostname: "x.com" }),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
      hostname: "x.com",
    });
    const redditUnits = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, { hostname: "www.reddit.com" }),
      attributes: [],
      sessionId: "s2",
      revision: 1,
      targetLang: "zh-Hans",
      hostname: "www.reddit.com",
    });

    expect(tweetUnits).toHaveLength(2);
    expect(tweetUnits.find((unit) => unit.originalText.startsWith("Shipping"))).toMatchObject({
      category: "comment",
      root: document.querySelector("[data-testid='tweetText']"),
      priority: 100,
    });
    expect(tweetUnits.map((unit) => unit.originalText)).not.toContain("Reply");
    expect(redditUnits.find((unit) => unit.originalText.startsWith("A practical guide"))).toMatchObject({
      category: "card-text",
      root: document.querySelector("[data-testid='post-title']"),
    });
  });
});
