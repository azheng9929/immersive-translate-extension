import { describe, expect, it } from "vitest";
import { decideRenderMode } from "@/content/renderDecider";
import type { UnitCategory } from "@/shared/types";

function element(tag: string, style = ""): HTMLElement {
  document.body.innerHTML = `<${tag} style="${style}">Text</${tag}>`;
  return document.body.firstElementChild as HTMLElement;
}

describe("decideRenderMode", () => {
  it("uses bilingual rendering for normal content blocks", () => {
    expect(decideRenderMode("content-block", element("p"), "Long readable paragraph")).toBe("bilingual-inside");
  });

  it("replaces button and nav text", () => {
    expect(decideRenderMode("button", element("button"), "Submit")).toBe("replace-text");
    expect(decideRenderMode("nav", element("a"), "Settings")).toBe("replace-text");
  });

  it("uses compact bilingual for long table cells but replacement for short cells", () => {
    expect(decideRenderMode("table-cell", element("td"), "Status")).toBe("replace-text");
    expect(decideRenderMode("table-cell", element("td"), "This project is waiting for approval")).toBe("compact-bilingual");
  });

  it("downgrades content inside row flex layout to compact bilingual", () => {
    document.body.innerHTML = `<div style="display:flex; flex-direction:row"><p>Readable paragraph text</p></div>`;
    expect(decideRenderMode("content-block", document.querySelector("p")!, "Readable paragraph text")).toBe("compact-bilingual");
  });

  it.each<UnitCategory>(["attribute", "label", "inline-ui"])("handles %s conservatively", (category) => {
    expect(decideRenderMode(category, element("span"), "Search")).toMatch(/replace/);
  });
});
