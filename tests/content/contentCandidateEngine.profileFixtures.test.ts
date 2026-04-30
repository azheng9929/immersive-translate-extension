import { describe, expect, it } from "vitest";
import {
  classifyCandidateProfile,
  selectTextDrivenTranslationRoots,
  type PageContentProfile,
} from "@/content/contentCandidateEngine";

type ProfileFixture = {
  name: string;
  html: string;
  expectedSelector: string;
  expectedProfile: PageContentProfile;
};

const fixtures: ProfileFixture[] = [
  {
    name: "article prose",
    expectedSelector: "article",
    expectedProfile: "article",
    html: `
      <article>
        <h1>Machine translation changed how readers access scientific work</h1>
        <p>Researchers now publish summaries, datasets, and explanations that reach a much wider audience.</p>
        <p>The article body contains sustained prose with citations and enough context to translate as one content root.</p>
        <p>Navigation links and footer controls should not dominate this page profile.</p>
      </article>
    `,
  },
  {
    name: "technical documentation with code",
    expectedSelector: ".docs-content",
    expectedProfile: "docs",
    html: `
      <main class="docs-content">
        <h1>Using the streaming API</h1>
        <p>Call the endpoint with a stable request body and handle partial events as they arrive.</p>
        <pre><code>const stream = client.responses.stream({ model: "gpt-4.1" });</code></pre>
        <p>Code blocks remain original while surrounding explanations are translated.</p>
      </main>
    `,
  },
  {
    name: "high-link card list",
    expectedSelector: ".card-grid",
    expectedProfile: "card-list",
    html: `
      <section class="card-grid">
        <a class="card" href="/a"><h2>Build faster project rituals</h2><p>Coordinate roadmaps across product and engineering.</p></a>
        <a class="card" href="/b"><h2>Review customer feedback</h2><p>Cluster messy comments into crisp themes.</p></a>
        <a class="card" href="/c"><h2>Share launch notes</h2><p>Publish concise updates for every stakeholder.</p></a>
      </section>
    `,
  },
  {
    name: "video title grid",
    expectedSelector: ".video-grid",
    expectedProfile: "video-list",
    html: `
      <section class="video-grid">
        <a href="/v/1"><img alt="" /><span class="video-title">Exploring the future of browser translation</span><span>12K views</span></a>
        <a href="/v/2"><img alt="" /><span class="video-title">How developers debug complex web pages</span><span>8K views</span></a>
        <a href="/v/3"><img alt="" /><span class="video-title">Designing fast multilingual interfaces</span><span>4K views</span></a>
      </section>
    `,
  },
  {
    name: "commerce product grid",
    expectedSelector: ".products",
    expectedProfile: "commerce",
    html: `
      <section class="products">
        <a href="/p/1"><img alt="" /><h2>Compact wireless keyboard for travel</h2><span>$49.99</span></a>
        <a href="/p/2"><img alt="" /><h2>Adjustable laptop stand with cooling base</h2><span>$39.99</span></a>
        <a href="/p/3"><img alt="" /><h2>Noise reducing microphone for meetings</h2><span>$79.99</span></a>
      </section>
    `,
  },
  {
    name: "forum thread list",
    expectedSelector: ".discussion-list",
    expectedProfile: "forum",
    html: `
      <section class="discussion-list forum">
        <article><h2>How do you preserve original code while translating docs?</h2><p>Several maintainers compare inline and block strategies.</p></article>
        <article><h2>Best fallback rules for old community forums</h2><p>The thread discusses timestamps, usernames, and reply controls.</p></article>
        <article><h2>Debug traces for skipped paragraphs</h2><p>Participants share examples from real websites.</p></article>
      </section>
    `,
  },
  {
    name: "social feed",
    expectedSelector: ".post-feed",
    expectedProfile: "social",
    html: `
      <main class="post-feed">
        <article class="post"><span>@reader_one</span><p>Browser translation feels better when short posts keep their original rhythm.</p></article>
        <article class="post"><span>@builder_two</span><p>Dynamic content needs conservative observation so feeds do not collapse.</p></article>
        <article class="post"><span>@debugger_three</span><p>Hover cards should translate only when they actually appear.</p></article>
      </main>
    `,
  },
  {
    name: "landing feature section",
    expectedSelector: ".hero",
    expectedProfile: "landing",
    html: `
      <section class="hero">
        <h1>Ship reliable AI workflows without copying prompts across tools</h1>
        <p>Teams can version, review, and publish production prompts from one place.</p>
      </section>
    `,
  },
  {
    name: "search results",
    expectedSelector: ".results",
    expectedProfile: "card-list",
    html: `
      <main class="results">
        <div class="result"><a href="/r/1"><h3>OpenAI platform documentation</h3><p>Learn how to build with models, tools, and structured outputs.</p></a></div>
        <div class="result"><a href="/r/2"><h3>API reference for responses</h3><p>Find parameters, examples, and integration notes.</p></a></div>
        <div class="result"><a href="/r/3"><h3>Developer quickstart guide</h3><p>Start with a small request and expand into production.</p></a></div>
      </main>
    `,
  },
  {
    name: "adult video title grid",
    expectedSelector: ".adult-video-grid",
    expectedProfile: "video-list",
    html: `
      <section class="adult-video-grid">
        <a href="/v/1"><img alt="" /><span class="video-title">Long explicit video title with several searchable words</span><span>13:28</span></a>
        <a href="/v/2"><img alt="" /><span class="video-title">Another explicit video title shown inside a card</span><span>10:21</span></a>
        <a href="/v/3"><img alt="" /><span class="video-title">Third explicit video title with a badge and duration</span><span>25:52</span></a>
      </section>
    `,
  },
];

describe("contentCandidateEngine profile fixtures", () => {
  it.each(fixtures)("detects $name as $expectedProfile", ({ html, expectedSelector, expectedProfile }) => {
    document.body.innerHTML = html;

    const roots = selectTextDrivenTranslationRoots(document.body);

    expect(roots[0]).toBe(document.querySelector(expectedSelector));
    expect(classifyCandidateProfile(roots[0]!)).toBe(expectedProfile);
  });
});
