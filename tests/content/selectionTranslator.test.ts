import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionTranslator } from "@/content/selectionTranslator";

describe("SelectionTranslator", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows a quiet translation popover for selected text", () => {
    const translator = new SelectionTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });

    translator.mount(document.body);
    translator.showCurrentSelection();

    const root = document.querySelector<HTMLElement>("[data-imt-selection='root']");
    expect(root).not.toBeNull();
    expect(root?.dataset.imtManaged).toBe("true");
    expect(document.querySelector("[data-imt-selection='source']")?.textContent).toBe("Hello world");
    expect(document.querySelector("[data-imt-selection-status]")?.textContent).toBe("Ready");
    expect(document.querySelector("[data-imt-selection-action='translate']")).not.toBeNull();
  });

  it("translates the current selection after an explicit action", async () => {
    const translateText = vi.fn().mockResolvedValue("你好，世界");
    const translator = new SelectionTranslator({
      translateText,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();

    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(translateText).toHaveBeenCalledWith("Hello world");
    expect(document.querySelector("[data-imt-selection-status]")?.textContent).toBe("Translated");
    expect(document.querySelector("[data-imt-selection='result']")?.textContent).toBe("你好，世界");
  });

  it("copies the translated result from the popover", async () => {
    const copyText = vi.fn().mockResolvedValue(undefined);
    const translator = new SelectionTranslator({
      translateText: async () => "你好，世界",
      copyText,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();
    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='copy']")?.click();
    await Promise.resolve();

    expect(copyText).toHaveBeenCalledWith("你好，世界");
  });

  it("hides the popover when selection is empty", () => {
    const translator = new SelectionTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
      getSelectionText: () => "   ",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });

    translator.mount(document.body);
    translator.showCurrentSelection();

    expect(document.querySelector("[data-imt-selection='root']")).toBeNull();
  });

  it("closes the popover without changing page content", () => {
    document.body.innerHTML = "<p>Hello world</p>";
    const translator = new SelectionTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
      getSelectionText: () => "Hello world",
      getSelectionRect: () => new DOMRect(120, 80, 90, 24),
    });
    translator.mount(document.body);
    translator.showCurrentSelection();

    document.querySelector<HTMLButtonElement>("[data-imt-selection-action='close']")?.click();

    expect(document.querySelector("[data-imt-selection='root']")).toBeNull();
    expect(document.querySelector("p")?.textContent).toBe("Hello world");
  });
});
