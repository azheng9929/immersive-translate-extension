import { describe, expect, it } from "vitest";
import {
  classifyElementForTranslation,
  compileFilterRule,
  findTranslationRoot,
} from "@/content/compiledFilterRule";
import { mountFixture } from "@/test/domFixtures";

describe("compiledFilterRule", () => {
  it("classifies elements with selector, tag, and computed-style signals", () => {
    mountFixture(`
      <article>
        <div itemprop="description"><span id="atomic-child">Product description text.</span></div>
        <p id="paragraph">Readable paragraph.</p>
        <g-emoji id="emoji">🚀</g-emoji>
        <code id="code">const value = 1</code>
        <span class="math" id="math">x^2</span>
      </article>
    `);
    const filterRule = compileFilterRule({
      selectors: ["article p"],
      excludeSelectors: [],
      mutationExcludeSelectors: [],
      injectedCss: [],
      contentSelectors: [],
      attributeNames: [],
      extraInlineSelectors: ["g-emoji"],
      extraBlockSelectors: [],
      atomicBlockSelectors: ["[itemprop=description]"],
      stayOriginalTags: ["CODE"],
      stayOriginalSelectors: [".math"],
    });

    expect(classifyElementForTranslation(document.querySelector("#atomic-child")!, filterRule).kind).toBe("atomic");
    expect(classifyElementForTranslation(document.querySelector("#paragraph")!, filterRule).kind).toBe("block");
    expect(classifyElementForTranslation(document.querySelector("#emoji")!, filterRule).kind).toBe("inline");
    expect(classifyElementForTranslation(document.querySelector("#code")!, filterRule).kind).toBe("stay-original");
    expect(classifyElementForTranslation(document.querySelector("#math")!, filterRule).kind).toBe("stay-original");
  });

  it("finds atomic and block translation roots without promoting configured inline nodes", () => {
    mountFixture(`
      <article>
        <div itemprop="description"><span id="atomic-child">Product description text.</span></div>
        <p id="paragraph">Hello <g-emoji id="emoji">rocket</g-emoji> world.</p>
        <span class="headline" id="headline">Card headline.</span>
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
      stayOriginalTags: [],
      stayOriginalSelectors: [],
    });

    expect(findTranslationRoot(document.querySelector("#atomic-child")!, filterRule)).toBe(
      document.querySelector("[itemprop=description]"),
    );
    expect(findTranslationRoot(document.querySelector("#emoji")!, filterRule)).toBe(document.querySelector("#paragraph"));
    expect(findTranslationRoot(document.querySelector("#headline")!, filterRule)).toBe(document.querySelector("#headline"));
  });

  it("honors rule-level excluded and inline tags", () => {
    mountFixture(`
      <article>
        <aside><span id="aside-text">Skip this sidebar.</span></aside>
        <p>Hello <mark id="mark">highlight</mark> world.</p>
      </article>
    `);
    const filterRule = compileFilterRule({
      excludeTags: ["aside"],
      inlineTags: ["mark"],
    });

    expect(classifyElementForTranslation(document.querySelector("#aside-text")!, filterRule).kind).toBe("excluded");
    expect(classifyElementForTranslation(document.querySelector("#mark")!, filterRule).kind).toBe("inline");
  });
});
