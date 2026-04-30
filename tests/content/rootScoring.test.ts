import { describe, expect, it } from "vitest";
import { compileFilterRule } from "@/content/compiledFilterRule";
import { scoreTranslationRoot, selectHighConfidenceTranslationRoots } from "@/content/rootScoring";

describe("rootScoring", () => {
  it("scores article-like roots above navigation-heavy roots", () => {
    document.body.innerHTML = `
      <nav>
        <a href="/a">Home</a>
        <a href="/b">Pricing</a>
        <button>Menu</button>
      </nav>
      <article>
        <h1>How translation engines keep complex pages readable</h1>
        <p>
          A good webpage translator should identify the main reading area, avoid navigation chrome,
          and preserve the surrounding layout while translating useful paragraphs first.
        </p>
      </article>
    `;

    const nav = document.querySelector<HTMLElement>("nav")!;
    const article = document.querySelector<HTMLElement>("article")!;

    expect(scoreTranslationRoot(article).score).toBeGreaterThan(scoreTranslationRoot(nav).score);
  });

  it("selects the highest-confidence content root from a generic document", () => {
    document.body.innerHTML = `
      <header><a href="/home">Home</a><a href="/docs">Docs</a><button>Sign in</button></header>
      <main>
        <article>
          <h1>Readable article title</h1>
          <p>
            This article has enough natural language content to be treated as the primary page
            root. It should be selected before sidebars, menus, toolbars, or recommendation cards.
          </p>
        </article>
      </main>
      <aside><a href="/related">Related link</a><button>Share</button></aside>
    `;

    expect(selectHighConfidenceTranslationRoots(document.body)).toEqual([document.querySelector("article")]);
  });

  it("keeps independent marketing page sections instead of only the single highest score", () => {
    document.body.innerHTML = `
      <header><a href="/docs">Docs</a><button>Log in</button></header>
      <section id="hero">
        <h1>The most natural voice AI</h1>
        <p>
          Make every user feel understood with production-grade speech and language APIs
          built for developers who care about latency, quality, and cost.
        </p>
      </section>
      <section id="tts">
        <h2>Keep every user engaged with realtime text to speech</h2>
        <p>
          Create voices with human-like expression and stream responses for natural
          conversations across apps, games, assistants, and learning products.
        </p>
      </section>
      <footer><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer>
    `;

    expect(selectHighConfidenceTranslationRoots(document.body)).toEqual([
      document.querySelector("#hero"),
      document.querySelector("#tts"),
    ]);
  });

  it("keeps high-link video list containers as confident content roots", () => {
    document.body.innerHTML = `
      <header><a href="/home">Home</a><a href="/categories">Categories</a><button>Upload</button></header>
      <div class="video-grid">
        <a class="video-card" href="/v/1"><img alt="" /><span class="video-title">Deep dive into browser translation engines</span></a>
        <a class="video-card" href="/v/2"><img alt="" /><span class="video-title">How layout preserving translation works</span></a>
        <a class="video-card" href="/v/3"><img alt="" /><span class="video-title">Building reliable dynamic page translation</span></a>
        <a class="video-card" href="/v/4"><img alt="" /><span class="video-title">Debugging multilingual web applications</span></a>
      </div>
    `;

    expect(selectHighConfidenceTranslationRoots(document.body, { profileHint: "video" })).toEqual([
      document.querySelector(".video-grid"),
    ]);
  });

  it("respects compiled filter and exclude selectors before scoring roots", () => {
    document.body.innerHTML = `
      <main>
        <section class="promo">
          <h2>Popular links that should not drive the page root</h2>
          <p>
            This excluded promotional section has enough text to look like real content,
            but the active site rule explicitly excludes it from page translation.
          </p>
        </section>
        <article>
          <h1>Primary article title</h1>
          <p>
            The accepted article body should be the only confident root because it is
            outside the excluded selector and remains eligible after rule filtering.
          </p>
        </article>
      </main>
    `;

    const filterRule = compileFilterRule({ excludeSelectors: [".promo"] });

    expect(selectHighConfidenceTranslationRoots(document.body, {
      filterRule,
      excludeSelectors: [".promo"],
    })).toEqual([document.querySelector("article")]);
  });

  it("keeps social post roots instead of reselecting a generic parent", () => {
    document.body.innerHTML = `
      <main>
        <article class="post">
          <span>@reader_one</span>
          <p>
            Browser translation feels better when short posts keep their original rhythm and avoid action chrome.
            The page shell should not become the only root just because it wraps multiple posts.
          </p>
        </article>
        <article class="post">
          <span>@builder_two</span>
          <p>
            Dynamic content needs conservative observation so feeds do not translate stale hover cards.
            A post-sized root gives the scheduler a stable unit when new entries arrive.
          </p>
        </article>
        <article class="post">
          <span>@debugger_three</span>
          <p>
            Debug traces should make it clear which post body became a translation candidate.
            The parent main element has no feed marker, so nested post candidates should win.
          </p>
        </article>
      </main>
    `;

    expect(selectHighConfidenceTranslationRoots(document.body, { profileHint: "social" })).toEqual([
      ...document.querySelectorAll(".post"),
    ]);
  });
});
