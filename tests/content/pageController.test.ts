import { describe, expect, it } from "vitest";
import { PageController } from "@/content/pageController";

describe("PageController", () => {
  it("translates and restores a mixed page using fake translation", async () => {
    document.body.innerHTML = `
      <main>
        <p>Hello world.</p>
        <button>Submit</button>
        <input placeholder="Search docs" />
      </main>
    `;

    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => items.map((item) => ({ id: item.id, text: `译:${item.text}`, status: "ok" as const })),
    });

    await controller.translatePage();

    expect(document.querySelector(".imt-translation-block")?.textContent).toBe("译:Hello world.");
    expect(document.querySelector("button")?.textContent).toBe("译:Submit");
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("译:Search docs");

    controller.restorePage();
    expect(document.querySelector(".imt-translation-block")).toBeNull();
    expect(document.querySelector("button")?.textContent).toBe("Submit");
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("Search docs");
  });

  it("does not write stale translation results after restore", async () => {
    document.body.innerHTML = `<p>Hello world.</p>`;
    let resolveBatch: ((value: Array<{ id: string; text: string; status: "ok" }>) => void) | undefined;
    let capturedItems: Array<{ id: string; text: string }> = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        capturedItems = items;
        return new Promise((resolve) => {
          resolveBatch = resolve;
        });
      },
    });

    const translatePromise = controller.translatePage();
    await Promise.resolve();
    controller.restorePage();
    resolveBatch?.(capturedItems.map((item) => ({ id: item.id, text: `译:${item.text}`, status: "ok" })));
    await translatePromise;

    expect(document.querySelector(".imt-translation-block")).toBeNull();
    expect(document.querySelector("p")?.textContent).toBe("Hello world.");
  });
});
