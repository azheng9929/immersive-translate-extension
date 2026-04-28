import { describe, expect, it } from "vitest";
import { ALL_TRANSLATABLE_ATTRIBUTES, scanDocumentText, scanTranslatableAttributes } from "@/content/domScanner";
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

  it("skips text inside hidden ancestors", () => {
    mountFixture(`
      <p>Visible text</p>
      <div hidden><p>Hidden text</p></div>
    `);

    const texts = scanDocumentText(document.body).map((item) => item.text);

    expect(texts).toContain("Visible text");
    expect(texts).not.toContain("Hidden text");
  });

  it("skips text inside nested code regions", () => {
    mountFixture(`
      <p>Visible text</p>
      <pre><span>const value = 1</span></pre>
    `);

    const texts = scanDocumentText(document.body).map((item) => item.text);

    expect(texts).toContain("Visible text");
    expect(texts).not.toContain("const value = 1");
  });

  it("keeps short button and navigation text", () => {
    mountFixture(`
      <button>OK</button>
      <nav><a href="/start">Go</a></nav>
    `);

    const texts = scanDocumentText(document.body).map((item) => item.text);

    expect(texts).toContain("OK");
    expect(texts).toContain("Go");
  });

  it("skips plaintext-only editable regions", () => {
    mountFixture(`
      <p>Visible text</p>
      <div contenteditable="plaintext-only">Editable text</div>
    `);

    const texts = scanDocumentText(document.body).map((item) => item.text);

    expect(texts).toContain("Visible text");
    expect(texts).not.toContain("Editable text");
  });

  it("uses YouTube granularity rules to keep content and skip controls", () => {
    mountFixture(`
      <main>
        <div id="masthead-container">Search</div>
        <h1 class="title">How large language models actually work</h1>
        <yt-formatted-string id="content-text">This explanation finally made the idea click for me.</yt-formatted-string>
        <div id="metadata-line">1.2M views</div>
        <div id="top-level-buttons-computed"><button>Share</button></div>
      </main>
    `);

    const texts = scanDocumentText(document.body, { hostname: "www.youtube.com" }).map((item) => item.text);

    expect(texts).toContain("How large language models actually work");
    expect(texts).toContain("This explanation finally made the idea click for me.");
    expect(texts).not.toContain("Search");
    expect(texts).not.toContain("1.2M views");
    expect(texts).not.toContain("Share");
  });

  it("uses Reddit granularity rules to keep posts and skip metadata/actions", () => {
    mountFixture(`
      <shreddit-post>
        <a data-testid="post_author_link">u/alice</a>
        <a data-testid="post-title" slot="title">A practical guide to browser extension translation</a>
        <div data-click-id="upvote">12K</div>
        <button data-click-id="share">Share</button>
        <div data-testid="comment"><p>This comment adds useful context for readers.</p></div>
      </shreddit-post>
    `);

    const texts = scanDocumentText(document.body, { hostname: "www.reddit.com" }).map((item) => item.text);

    expect(texts).toContain("A practical guide to browser extension translation");
    expect(texts).toContain("This comment adds useful context for readers.");
    expect(texts).not.toContain("u/alice");
    expect(texts).not.toContain("12K");
    expect(texts).not.toContain("Share");
  });

  it("uses X granularity rules to keep tweet text and skip hover/control text", () => {
    mountFixture(`
      <article>
        <div data-testid="User-Name"><span>@openai</span></div>
        <time>2h</time>
        <div data-testid="tweetText" lang="en">Shipping readable translation without moving the page layout.</div>
        <div role="button">Reply</div>
        <div data-testid="HoverCard"><span>218 likes</span></div>
      </article>
    `);

    const texts = scanDocumentText(document.body, { hostname: "x.com" }).map((item) => item.text);

    expect(texts).toEqual(["Shipping readable translation without moving the page layout."]);
  });
});

describe("scanTranslatableAttributes", () => {
  it("finds safe attributes by default", () => {
    mountFixture(`
      <input placeholder="Search docs" aria-label="Search input" />
      <img alt="Product photo" />
      <button title="Open settings">⚙</button>
    `);

    const attrs = scanTranslatableAttributes(document.body);
    expect(attrs.map((attr) => `${attr.name}:${attr.originalValue}`)).toEqual([
      "placeholder:Search docs",
      "alt:Product photo",
    ]);
  });

  it("finds title and aria-label when explicitly enabled", () => {
    mountFixture(`
      <input placeholder="Search docs" aria-label="Search input" />
      <img alt="Product photo" />
      <button title="Open settings">Settings</button>
    `);

    const attrs = scanTranslatableAttributes(document.body, ALL_TRANSLATABLE_ATTRIBUTES);
    expect(attrs.map((attr) => `${attr.name}:${attr.originalValue}`)).toEqual([
      "placeholder:Search docs",
      "aria-label:Search input",
      "alt:Product photo",
      "title:Open settings",
    ]);
  });

  it("skips attributes inside nested code regions", () => {
    mountFixture(`
      <input placeholder="Search docs" />
      <pre><span title="Code title">x</span></pre>
    `);

    const attrs = scanTranslatableAttributes(document.body);

    expect(attrs.map((attr) => `${attr.name}:${attr.originalValue}`)).toEqual([
      "placeholder:Search docs",
    ]);
  });

  it("finds attributes on the root element", () => {
    mountFixture("");
    const input = document.createElement("input");
    input.setAttribute("placeholder", "Search docs");

    const attrs = scanTranslatableAttributes(input);

    expect(attrs.map((attr) => `${attr.name}:${attr.originalValue}`)).toEqual([
      "placeholder:Search docs",
    ]);
  });
});
