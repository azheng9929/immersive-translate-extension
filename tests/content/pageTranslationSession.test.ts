import { afterEach, describe, expect, it, vi } from "vitest";
import { PageController } from "@/content/pageController";
import { PageTranslationSession } from "@/content/pageTranslationSession";

describe("PageTranslationSession", () => {
  let session: PageTranslationSession | undefined;

  afterEach(() => {
    session?.dispose();
    session = undefined;
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("tracks page translation status transitions", async () => {
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) =>
        items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const })),
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body });
    const phases: string[] = [];
    session.subscribe((status) => phases.push(status.phase));

    const status = await session.translatePage();

    expect(status).toMatchObject({
      phase: "translated",
      total: 1,
      translated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(phases).toEqual(["translating", "translated"]);

    session.restorePage();
    expect(session.getStatus()).toMatchObject({ phase: "idle", total: 0, translated: 0, failed: 0, skipped: 0 });
  });

  it("translates newly added content after page translation", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body, debounceMs: 20 });

    await session.translatePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world.", "Late content."]);
    expect(session.getStatus()).toMatchObject({
      phase: "translated",
      total: 2,
      translated: 2,
      failed: 0,
      skipped: 0,
      dynamicRuns: 1,
    });
    expect(Array.from(document.querySelectorAll(".imt-translation-block")).map((node) => node.textContent)).toEqual([
      "[zh-Hans] Hello world.",
      "[zh-Hans] Late content.",
    ]);
  });

  it("stops dynamic translation after restore", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<main><p>Hello world.</p></main>`;
    const requestedTexts: string[] = [];
    const controller = new PageController({
      targetLang: "zh-Hans",
      translateBatch: async (items) => {
        requestedTexts.push(...items.map((item) => item.text));
        return items.map((item) => ({ id: item.id, text: `[zh-Hans] ${item.text}`, status: "ok" as const }));
      },
    });
    session = new PageTranslationSession(controller, { observeRoot: document.body, debounceMs: 20 });
    await session.translatePage();

    session.restorePage();
    const lateParagraph = document.createElement("p");
    lateParagraph.textContent = "Late content.";
    document.querySelector("main")?.append(lateParagraph);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(requestedTexts).toEqual(["Hello world."]);
    expect(session.getStatus().phase).toBe("idle");
    expect(document.querySelector(".imt-translation-block")).toBeNull();
  });
});
