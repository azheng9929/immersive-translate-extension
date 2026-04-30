import { describe, expect, it } from "vitest";
import {
  classifyCandidateProfile,
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
});
