import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionTranslator } from "@/content/selectionTranslator";

describe("SelectionTranslator", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows only a compact trigger dot for selected text", () => {
    const translateText = vi.fn().mockResolvedValue("[zh-Hans] Hello world");
    const translator = new SelectionTranslator({
      translateText,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });

    translator.mount(document.body);
    translator.showCurrentSelection();

    const root = document.querySelector<HTMLElement>("[data-imt-selection='root']");
    expect(root).not.toBeNull();
    expect(root?.dataset.imtManaged).toBe("true");
    expect(document.querySelector("[data-imt-selection='trigger']")).not.toBeNull();
    expect(document.querySelector("[data-imt-selection='source']")).toBeNull();
    expect(document.querySelector("[data-imt-selection-status]")).toBeNull();
    expect(document.querySelector("[data-imt-selection-action='translate']")).toBeNull();
    expect(translateText).not.toHaveBeenCalled();
  });

  it("expands and translates the current selection after clicking the trigger dot", async () => {
    const translateText = vi.fn().mockResolvedValue("[zh-Hans] Hello world");
    const translator = new SelectionTranslator({
      translateText,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();

    document.querySelector<HTMLButtonElement>("[data-imt-selection='trigger']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(translateText).toHaveBeenCalledWith("Hello world");
    expect(document.querySelector("[data-imt-selection-status]")?.textContent).toBe("Translated");
    expect(document.querySelector("[data-imt-selection='source']")?.textContent).toBe("Hello world");
    expect(document.querySelector("[data-imt-selection='result']")?.textContent).toBe("[zh-Hans] Hello world");
  });

  it("copies the translated result from the expanded popover", async () => {
    const copyText = vi.fn().mockResolvedValue(undefined);
    const translator = new SelectionTranslator({
      translateText: async () => "[zh-Hans] Hello world",
      copyText,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();
    document.querySelector<HTMLButtonElement>("[data-imt-selection='trigger']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='copy']")?.click();
    await Promise.resolve();

    expect(copyText).toHaveBeenCalledWith("[zh-Hans] Hello world");
  });

  it("hides the trigger dot when selection is empty", () => {
    const translator = new SelectionTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
      getSelectionText: () => "   ",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });

    translator.mount(document.body);
    translator.showCurrentSelection();

    expect(document.querySelector("[data-imt-selection='root']")).toBeNull();
  });

  it("closes the expanded popover without changing page content", () => {
    document.body.innerHTML = "<p>Hello world</p>";
    const translator = new SelectionTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();
    document.querySelector<HTMLButtonElement>("[data-imt-selection='trigger']")?.click();

    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='close']")?.click();

    expect(document.querySelector("[data-imt-selection='root']")).toBeNull();
    expect(document.querySelector("p")?.textContent).toBe("Hello world");
  });
});
