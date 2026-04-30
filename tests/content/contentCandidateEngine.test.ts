import { describe, expect, it } from "vitest";
import {
  classifyCandidateProfile,
  collectTextDrivenCandidates,
  selectTextDrivenTranslationRoots,
} from "@/content/contentCandidateEngine";

describe("contentCandidateEngine", () => {
  it("selects a high-link video grid as content instead of rejecting it as navigation", () => {
    document.body.innerHTML = `
      <header>
        <a href="/home">Home</a>
        <a href="/categories">Categories</a>
        <button>Upload</button>
      </header>
      <div class="video-grid">
        <a class="video-card" href="/v/1">
          <img alt="" />
          <span class="video-title">Deep dive into browser translation engines</span>
          <span class="meta">12K views</span>
        </a>
        <a class="video-card" href="/v/2">
          <img alt="" />
          <span class="video-title">How layout preserving translation works</span>
          <span class="meta">2 days ago</span>
        </a>
        <a class="video-card" href="/v/3">
          <img alt="" />
          <span class="video-title">Building reliable dynamic page translation</span>
          <span class="meta">9:42</span>
        </a>
        <a class="video-card" href="/v/4">
          <img alt="" />
          <span class="video-title">Debugging multilingual web applications</span>
          <span class="meta">18K views</span>
        </a>
      </div>
    `;

    const roots = selectTextDrivenTranslationRoots(document.body, { profileHint: "video" });

    expect(roots).toEqual([document.querySelector(".video-grid")]);
    expect(classifyCandidateProfile(roots[0]!)).toBe("video-list");
  });

  it("uses weak candidate selectors as score hints without selecting unrelated chrome", () => {
    document.body.innerHTML = `
      <header>
        <a href="/pricing">Pricing</a>
        <a href="/docs">Docs</a>
      </header>
      <div class="app-shell">
        <div class="clamp-title">Revenue intelligence for product teams</div>
        <div class="clamp-desc">Turn messy user feedback into clear priorities across every roadmap discussion.</div>
      </div>
    `;

    const roots = selectTextDrivenTranslationRoots(document.body, {
      weakCandidateSelectors: [".clamp-title", ".clamp-desc"],
    });

    expect(roots).toEqual([document.querySelector(".app-shell")]);
  });

  it("scores candidates from accepted text instead of raw excluded descendants", () => {
    document.body.innerHTML = `
      <main>
        <section class="shell">
          This is the real readable sentence that should contribute to root scoring
          because it survives the active exclusion rules and sits on the candidate shell.
          <aside class="excluded">
            ${Array.from({ length: 20 }, (_, index) => `<p>Excluded sidebar copy ${index} that must not inflate candidate text.</p>`).join("")}
          </aside>
        </section>
      </main>
    `;

    const main = document.querySelector<HTMLElement>("main")!;
    const candidates = collectTextDrivenCandidates(document.body, {
      excludeSelectors: [".excluded"],
      weakCandidateSelectors: [".shell"],
    });
    const candidate = candidates.find((entry) => entry.element === main) ?? candidates.find((entry) => entry.element.matches(".shell"));

    expect(candidate?.stats.acceptedTextLength).toBe(candidate?.stats.textLength);
    expect(candidate?.stats.textLength).toBeLessThan(180);
    expect(candidate?.stats.rawTextLength).toBeGreaterThan(900);
    expect(candidate?.stats.excludedTextLength).toBeGreaterThan(800);
  });

  it("prefers post roots over a generic social parent without feed semantics", () => {
    document.body.innerHTML = `
      <main>
        <article class="post">
          <span>@reader_one</span>
          <p>
            Browser translation feels better when short posts keep their original rhythm and avoid action chrome.
            The candidate should stay close to the post body instead of expanding to the whole page shell.
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

    const roots = selectTextDrivenTranslationRoots(document.body, { profileHint: "social" });

    expect(roots).toEqual([...document.querySelectorAll(".post")]);
  });
});
