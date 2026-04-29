import { afterEach, describe, expect, it, vi } from "vitest";
import { InputTranslator } from "@/content/inputTranslator";

describe("InputTranslator", () => {
  let translator: InputTranslator | undefined;

  afterEach(() => {
    translator?.unmount();
    translator = undefined;
    document.body.innerHTML = "";
  });

  it("shows a quiet control for focused text input with content", () => {
    document.body.innerHTML = '<input value="Hello world" />';
    const input = document.querySelector("input")!;
    translator = new InputTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
    });

    translator.mount(document.body);
    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    const root = document.querySelector<HTMLElement>("[data-imt-input='root']");
    expect(root).not.toBeNull();
    expect(root?.dataset.imtManaged).toBe("true");
    expect(document.querySelector("[data-imt-input='source']")?.textContent).toBe("Hello world");
    expect(document.querySelector("[data-imt-input-status]")?.textContent).toBe("就绪");
  });

  it("translates input content without changing the input value", async () => {
    document.body.innerHTML = '<input value="Hello world" />';
    const input = document.querySelector("input")!;
    const translateText = vi.fn().mockResolvedValue("你好，世界");
    translator = new InputTranslator({ translateText });
    translator.mount(document.body);
    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    document.querySelector<HTMLButtonElement>("[data-imt-input-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(translateText).toHaveBeenCalledWith("Hello world");
    expect(input.value).toBe("Hello world");
    expect(document.querySelector("[data-imt-input='result']")?.textContent).toBe("你好，世界");
  });

  it("appears after typing into an initially empty focused input", () => {
    document.body.innerHTML = "<input />";
    const input = document.querySelector("input")!;
    translator = new InputTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
    });
    translator.mount(document.body);

    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.querySelector("[data-imt-input='root']")).toBeNull();

    input.value = "Hello later";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "Hello later" }));

    expect(document.querySelector("[data-imt-input='source']")?.textContent).toBe("Hello later");
  });

  it("replaces input content only after the replace action", async () => {
    document.body.innerHTML = '<input value="Hello world" />';
    const input = document.querySelector("input")!;
    const inputListener = vi.fn();
    input.addEventListener("input", inputListener);
    translator = new InputTranslator({
      translateText: async () => "你好，世界",
    });
    translator.mount(document.body);
    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    document.querySelector<HTMLButtonElement>("[data-imt-input-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    document.querySelector<HTMLButtonElement>("[data-imt-input-action='replace']")?.click();

    expect(input.value).toBe("你好，世界");
    expect(inputListener).toHaveBeenCalledTimes(1);
  });

  it("copies translated text without changing input content", async () => {
    document.body.innerHTML = '<textarea>Hello world</textarea>';
    const textarea = document.querySelector("textarea")!;
    const copyText = vi.fn().mockResolvedValue(undefined);
    translator = new InputTranslator({
      translateText: async () => "你好，世界",
      copyText,
    });
    translator.mount(document.body);
    textarea.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    document.querySelector<HTMLButtonElement>("[data-imt-input-action='translate']")?.click();
    await Promise.resolve();
    await Promise.resolve();

    document.querySelector<HTMLButtonElement>("[data-imt-input-action='copy']")?.click();
    await Promise.resolve();

    expect(copyText).toHaveBeenCalledWith("你好，世界");
    expect(textarea.value).toBe("Hello world");
  });

  it("ignores protected, structured, and extension managed fields", () => {
    document.body.innerHTML = `
      <input type="password" value="secret" />
      <input type="number" value="123" />
      <input type="email" value="hello@example.com" />
      <input data-imt-managed="true" value="Hello world" />
    `;
    translator = new InputTranslator({
      translateText: async (text) => `[zh-Hans] ${text}`,
    });
    translator.mount(document.body);

    document.querySelector<HTMLInputElement>("input[type='password']")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.querySelector("[data-imt-input='root']")).toBeNull();

    document.querySelector<HTMLInputElement>("input[type='number']")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.querySelector("[data-imt-input='root']")).toBeNull();

    document.querySelector<HTMLInputElement>("input[type='email']")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.querySelector("[data-imt-input='root']")).toBeNull();

    document.querySelector<HTMLInputElement>("[data-imt-managed='true']")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.querySelector("[data-imt-input='root']")).toBeNull();
  });
});
