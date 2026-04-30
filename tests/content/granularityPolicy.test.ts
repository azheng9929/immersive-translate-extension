import { describe, expect, it } from "vitest";
import { resolveTextGranularity } from "@/content/granularityPolicy";
import { mountFixture } from "@/test/domFixtures";

describe("resolveTextGranularity", () => {
  it("keeps YouTube content while skipping chrome, controls, metadata, and short action text", () => {
    mountFixture(`
      <div id="masthead-container"><span>Search</span></div>
      <h1 class="title"><span>How large language models actually work</span></h1>
      <yt-formatted-string id="content-text">This explanation finally made the idea click for me.</yt-formatted-string>
      <yt-formatted-string id="description-text" class="metadata-snippet-text">
        <span>This video explains what changed in OpenAI's latest release and why it matters.</span>
      </yt-formatted-string>
      <div id="metadata-line"><span>1.2M views</span></div>
      <div id="top-level-buttons-computed"><button><span>Share</span></button></div>
    `);

    const title = document.querySelector<HTMLElement>("h1 span")!;
    const comment = document.querySelector<HTMLElement>("yt-formatted-string#content-text")!;
    const resultDescription = document.querySelector<HTMLElement>("#description-text span")!;
    const masthead = document.querySelector<HTMLElement>("#masthead-container span")!;
    const metadata = document.querySelector<HTMLElement>("#metadata-line span")!;
    const share = document.querySelector<HTMLElement>("button span")!;

    expect(resolveTextGranularity(title, title.textContent ?? "", { hostname: "www.youtube.com" })).toMatchObject({
      skip: false,
      category: "heading",
      root: title.closest("h1.title"),
    });
    expect(resolveTextGranularity(comment, comment.textContent ?? "", { hostname: "www.youtube.com" })).toMatchObject({
      skip: false,
      category: "comment",
      root: comment,
    });
    expect(
      resolveTextGranularity(resultDescription, resultDescription.textContent ?? "", { hostname: "www.youtube.com" }),
    ).toMatchObject({
      skip: false,
      category: "card-text",
      root: resultDescription.closest("#description-text"),
    });
    expect(resolveTextGranularity(masthead, masthead.textContent ?? "", { hostname: "www.youtube.com" }).skip).toBe(
      true,
    );
    expect(resolveTextGranularity(metadata, metadata.textContent ?? "", { hostname: "www.youtube.com" }).skip).toBe(
      true,
    );
    expect(resolveTextGranularity(share, share.textContent ?? "", { hostname: "www.youtube.com" }).skip).toBe(true);
  });

  it("keeps Reddit post and comment content while skipping authors, votes, and actions", () => {
    mountFixture(`
      <shreddit-post>
        <a data-testid="post_author_link">u/alice</a>
        <a data-testid="post-title" slot="title">A practical guide to browser extension translation</a>
        <div data-click-id="upvote">12K</div>
        <button data-click-id="share">Share</button>
        <div data-testid="comment"><p>This comment adds useful context for readers.</p></div>
      </shreddit-post>
      <div id="right-sidebar-container">
        <faceplate-tracker>
          <summary>
            <h2 class="i18n-translatable-text">No piracy and Content Quality</h2>
          </summary>
        </faceplate-tracker>
        <div data-testid="community-status-text">
          <p>Xiaomi Community Official</p>
        </div>
      </div>
    `);

    const author = document.querySelector<HTMLElement>("[data-testid='post_author_link']")!;
    const title = document.querySelector<HTMLElement>("[data-testid='post-title']")!;
    const votes = document.querySelector<HTMLElement>("[data-click-id='upvote']")!;
    const share = document.querySelector<HTMLElement>("[data-click-id='share']")!;
    const comment = document.querySelector<HTMLElement>("[data-testid='comment'] p")!;
    const sidebarRule = document.querySelector<HTMLElement>("#right-sidebar-container h2")!;
    const sidebarAbout = document.querySelector<HTMLElement>("[data-testid='community-status-text'] p")!;

    expect(resolveTextGranularity(title, title.textContent ?? "", { hostname: "www.reddit.com" })).toMatchObject({
      skip: false,
      category: "card-text",
      root: title,
    });
    expect(resolveTextGranularity(comment, comment.textContent ?? "", { hostname: "www.reddit.com" })).toMatchObject({
      skip: false,
      category: "comment",
      root: comment,
    });
    expect(resolveTextGranularity(sidebarRule, sidebarRule.textContent ?? "", { hostname: "www.reddit.com" })).toMatchObject({
      skip: false,
      category: "card-text",
      root: sidebarRule,
    });
    expect(resolveTextGranularity(sidebarAbout, sidebarAbout.textContent ?? "", { hostname: "www.reddit.com" })).toMatchObject({
      skip: false,
      category: "content-block",
      root: sidebarAbout,
    });
    expect(resolveTextGranularity(author, author.textContent ?? "", { hostname: "www.reddit.com" }).skip).toBe(true);
    expect(resolveTextGranularity(votes, votes.textContent ?? "", { hostname: "www.reddit.com" }).skip).toBe(true);
    expect(resolveTextGranularity(share, share.textContent ?? "", { hostname: "www.reddit.com" }).skip).toBe(true);
  });

  it("keeps X tweet text while skipping hover cards, controls, handles, and timestamps", () => {
    mountFixture(`
      <article>
        <div data-testid="User-Name"><span>@openai</span></div>
        <time>2h</time>
        <div data-testid="tweetText" lang="en"><span>Shipping readable translation without moving the page layout.</span></div>
        <div role="button">Reply</div>
        <div data-testid="HoverCard"><span>218 likes</span></div>
      </article>
    `);

    const handle = document.querySelector<HTMLElement>("[data-testid='User-Name'] span")!;
    const time = document.querySelector<HTMLElement>("time")!;
    const tweet = document.querySelector<HTMLElement>("[data-testid='tweetText'] span")!;
    const reply = document.querySelector<HTMLElement>("[role='button']")!;
    const hover = document.querySelector<HTMLElement>("[data-testid='HoverCard'] span")!;

    expect(resolveTextGranularity(tweet, tweet.textContent ?? "", { hostname: "x.com" })).toMatchObject({
      skip: false,
      category: "comment",
      root: tweet.closest("[data-testid='tweetText']"),
    });
    expect(resolveTextGranularity(handle, handle.textContent ?? "", { hostname: "x.com" }).skip).toBe(true);
    expect(resolveTextGranularity(time, time.textContent ?? "", { hostname: "x.com" }).skip).toBe(true);
    expect(resolveTextGranularity(reply, reply.textContent ?? "", { hostname: "x.com" }).skip).toBe(true);
    expect(resolveTextGranularity(hover, hover.textContent ?? "", { hostname: "x.com" }).skip).toBe(true);
  });

  it("keeps Threads post text while skipping authors, controls, metrics, and timestamps", () => {
    mountFixture(`
      <main>
        <nav><span>For You</span></nav>
        <div role="article">
          <a href="/@openai"><span dir="auto">openai</span></a>
          <time>2h</time>
          <div class="body"><div dir="auto">Shipping readable translation without moving the page layout.</div></div>
          <div role="button" aria-label="Reply"><span>Reply</span></div>
          <div role="button" aria-label="Like"><span>1.2K</span></div>
        </div>
      </main>
    `);

    const author = document.querySelector<HTMLElement>('a[href^="/@"] span')!;
    const time = document.querySelector<HTMLElement>("time")!;
    const post = document.querySelector<HTMLElement>(".body div")!;
    const reply = document.querySelector<HTMLElement>('[aria-label="Reply"] span')!;
    const likes = document.querySelector<HTMLElement>('[aria-label="Like"] span')!;
    const nav = document.querySelector<HTMLElement>("nav span")!;

    expect(resolveTextGranularity(post, post.textContent ?? "", { hostname: "www.threads.com" })).toMatchObject({
      skip: false,
      category: "comment",
      root: post,
    });
    expect(resolveTextGranularity(author, author.textContent ?? "", { hostname: "www.threads.com" }).skip).toBe(true);
    expect(resolveTextGranularity(time, time.textContent ?? "", { hostname: "www.threads.com" }).skip).toBe(true);
    expect(resolveTextGranularity(reply, reply.textContent ?? "", { hostname: "www.threads.com" }).skip).toBe(true);
    expect(resolveTextGranularity(likes, likes.textContent ?? "", { hostname: "www.threads.com" }).skip).toBe(true);
    expect(resolveTextGranularity(nav, nav.textContent ?? "", { hostname: "www.threads.com" }).skip).toBe(true);
  });

  it("skips global icon, code, social share, and identifier-only fragments without hiding normal text", () => {
    mountFixture(`
      <p>Readable product documentation for normal pages.</p>
      <span class="material-icons">favorite</span>
      <div class="social-share">Share this page</div>
      <div role="code">const value = 1</div>
      <span>@just_a_handle</span>
      <span>u/example_user</span>
    `);

    const readable = document.querySelector<HTMLElement>("p")!;
    const icon = document.querySelector<HTMLElement>(".material-icons")!;
    const share = document.querySelector<HTMLElement>(".social-share")!;
    const code = document.querySelector<HTMLElement>("[role='code']")!;
    const handle = Array.from(document.querySelectorAll<HTMLElement>("span")).find(
      (element) => element.textContent === "@just_a_handle",
    )!;
    const redditUser = Array.from(document.querySelectorAll<HTMLElement>("span")).find(
      (element) => element.textContent === "u/example_user",
    )!;

    expect(resolveTextGranularity(readable, readable.textContent ?? "", { hostname: "example.com" }).skip).toBe(false);
    expect(resolveTextGranularity(icon, icon.textContent ?? "", { hostname: "example.com" }).skip).toBe(true);
    expect(resolveTextGranularity(share, share.textContent ?? "", { hostname: "example.com" }).skip).toBe(true);
    expect(resolveTextGranularity(code, code.textContent ?? "", { hostname: "example.com" }).skip).toBe(true);
    expect(resolveTextGranularity(handle, handle.textContent ?? "", { hostname: "example.com" }).skip).toBe(true);
    expect(resolveTextGranularity(redditUser, redditUser.textContent ?? "", { hostname: "example.com" }).skip).toBe(
      true,
    );
  });
});
