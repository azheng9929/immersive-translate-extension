import { describe, expect, it } from "vitest";
import { applyAttributeBudget } from "@/content/attributeBudget";
import { scanDocumentText, scanTranslatableAttributes } from "@/content/domScanner";
import { createTranslationDiagnostics } from "@/content/translationDiagnostics";
import { mountFixture } from "@/test/domFixtures";

describe("applyAttributeBudget", () => {
  it("keeps attributes within page, root, name, and text-ratio budgets", () => {
    mountFixture(`
      <main>
        <article id="first">
          <p>Readable product description that should anchor nearby media.</p>
          <img id="first-a" alt="First product image" title="First product title" />
          <img id="first-b" alt="Second product image" />
        </article>
        <article id="second">
          <p>Another readable product description for a separate card.</p>
          <img id="second-a" alt="Third product image" />
        </article>
        <aside>
          <img id="sidebar" alt="Sidebar promotion image" />
        </aside>
      </main>
    `);
    const diagnostics = createTranslationDiagnostics();
    const scannedTexts = scanDocumentText(document.body, { diagnostics });
    const rawAttributes = scanTranslatableAttributes(document.body, ["alt", "title"], { diagnostics });

    const attributes = applyAttributeBudget(rawAttributes, scannedTexts, {
      diagnostics,
      budget: {
        enabled: true,
        allowedNames: ["alt"],
        maxPerPage: 3,
        maxPerRoot: 1,
        maxRatioToTextUnits: 1,
        requireContentRoot: true,
      },
    });

    expect(attributes.map((attr) => attr.element.id)).toEqual(["first-a", "second-a"]);
    expect(diagnostics.scan.attributes.skippedByReason["attribute-budget"]).toBe(3);
  });
});
