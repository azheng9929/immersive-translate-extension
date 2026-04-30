import { describe, expect, it } from "vitest";
import { scanDocumentText, scanTranslatableAttributes } from "@/content/domScanner";
import { createTranslationDiagnostics } from "@/content/translationDiagnostics";
import { compileFilterRule } from "@/content/compiledFilterRule";
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

  it("does not prefer nested UI controls over readable content blocks", () => {
    mountFixture(`
      <p>
        Review the <button>Detailed report</button> before changing the rollout plan.
      </p>
    `);
    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      category: "content-block",
      originalText: "Review the Detailed report before changing the rollout plan.",
    });
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
    mountFixture(`<img alt="Product photo" />`);
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
    expect(units[0]!.originalText).toBe("Product photo");
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

  it("skips a whole Chinese-dominant unit even when English terms are split into inline nodes", () => {
    mountFixture(`
      <p>这篇文章介绍 <strong>React Server Components</strong> 的 <span>streaming</span> 策略。</p>
      <p>React Server Components stream UI from the server.</p>
    `);

    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, { targetLang: "zh-Hans" }),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
    });

    expect(units.map((unit) => unit.originalText)).toEqual([
      "React Server Components stream UI from the server.",
    ]);
  });

  it("records why a scanned text group did not become a translation unit", () => {
    mountFixture(`
      <p>${"\u8fd9\u7bc7\u6587\u7ae0\u4ecb\u7ecd"} <strong>React Server Components</strong> ${"\u7684"} <span>streaming</span> ${"\u7b56\u7565\u3002"}</p>
      <p>React Server Components stream UI from the server.</p>
    `);
    const diagnostics = createTranslationDiagnostics();

    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, { targetLang: "zh-Hans", diagnostics }),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
      diagnostics,
    });

    expect(units.map((unit) => unit.originalText)).toEqual([
      "React Server Components stream UI from the server.",
    ]);
    expect(diagnostics.units).toMatchObject({
      built: 1,
      dropped: 1,
      droppedByReason: {
        "target-language": 1,
      },
    });
  });

  it("uses compiled atomic, extra block, extra inline, and stay-original rule metadata", () => {
    mountFixture(`
      <article>
        <div itemprop="description"><span>Compact</span> <span>description text.</span></div>
        <p>Hello <g-emoji>rocket</g-emoji> world <code>const value = 1</code>.</p>
        <span class="headline">Card headline text.</span>
        <p><span class="math">x^2</span></p>
      </article>
    `);
    const filterRule = compileFilterRule({
      selectors: [],
      excludeSelectors: [],
      mutationExcludeSelectors: [],
      injectedCss: [],
      contentSelectors: [],
      attributeNames: [],
      extraInlineSelectors: ["g-emoji"],
      extraBlockSelectors: [".headline"],
      atomicBlockSelectors: ["[itemprop=description]"],
      stayOriginalTags: ["CODE"],
      stayOriginalSelectors: [".math"],
    });

    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, { filterRule }),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
      filterRule,
    });

    expect(units.map((unit) => unit.originalText)).toEqual([
      "Compact description text.",
      "Hello rocket world.",
      "Card headline text.",
    ]);
    expect(units[0]!.root).toBe(document.querySelector("[itemprop=description]"));
    expect(units[2]!.root).toBe(document.querySelector(".headline"));
  });

  it("uses pre whitespace detected tags to preserve meaningful inline breaks", () => {
    mountFixture(`
      <div class="post-body">
        <span>First line keeps its own rhythm.</span>
        <span>Second line should not be joined as one sentence.</span>
      </div>
    `);
    const filterRule = compileFilterRule({
      contentSelectors: [{ selector: ".post-body", category: "content-block" }],
      preWhitespaceDetectedTags: ["SPAN"],
    });

    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body, {
        contentSelectors: [{ selector: ".post-body", category: "content-block" }],
        filterRule,
      }),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
      contentSelectors: [{ selector: ".post-body", category: "content-block" }],
      filterRule,
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.originalText).toBe(
      "First line keeps its own rhythm.\nSecond line should not be joined as one sentence.",
    );
  });

  it("splits very long units by sentence when a rule configures lineBreakMaxTextCount", () => {
    mountFixture(`
      <p>First long sentence for a compact card. Second long sentence for the same card. Third long sentence should remain ordered.</p>
    `);

    const units = buildTranslationUnits({
      scannedTexts: scanDocumentText(document.body),
      attributes: [],
      sessionId: "s1",
      revision: 1,
      targetLang: "zh-Hans",
      lineBreakMaxTextCount: 36,
    });

    expect(units).toHaveLength(1);
    expect(units[0]!.originalText).toBe(
      "First long sentence for a compact card.\nSecond long sentence for the same card.\nThird long sentence should remain ordered.",
    );
  });
});
