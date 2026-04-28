import { afterEach, describe, expect, it } from "vitest";
import { OriginalTextTooltip } from "@/content/originalTextTooltip";

describe("OriginalTextTooltip", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows original text when hovering translated content", () => {
    document.body.innerHTML = '<p><span data-imt-original-text="Hello world">Translated hello</span></p>';
    const tooltip = new OriginalTextTooltip();
    tooltip.mount(document.body);

    document.querySelector("span")?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 120, clientY: 80 }));

    const root = document.querySelector<HTMLElement>("[data-imt-original-tooltip='root']");
    expect(root).not.toBeNull();
    expect(root?.dataset.imtManaged).toBe("true");
    expect(root?.textContent).toBe("Hello world");
  });

  it("hides original text when leaving translated content", () => {
    document.body.innerHTML = '<button data-imt-original-text="Submit">Translated submit</button>';
    const tooltip = new OriginalTextTooltip();
    tooltip.mount(document.body);
    const button = document.querySelector("button")!;

    button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 120, clientY: 80 }));
    button.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));

    expect(document.querySelector("[data-imt-original-tooltip='root']")).toBeNull();
  });

  it("does not show a tooltip for extension UI without original text metadata", () => {
    document.body.innerHTML = '<button data-imt-managed="true">Translate</button>';
    const tooltip = new OriginalTextTooltip();
    tooltip.mount(document.body);

    document.querySelector("button")?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 120, clientY: 80 }));

    expect(document.querySelector("[data-imt-original-tooltip='root']")).toBeNull();
  });
});
