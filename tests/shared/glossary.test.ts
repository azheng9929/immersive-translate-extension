import { describe, expect, it } from "vitest";
import {
  buildGlossarySystemPrompt,
  exportGlossaryEntries,
  glossaryEntriesToText,
  glossaryTextToEntries,
  importGlossaryEntries,
  normalizeGlossaryEntries,
} from "@/shared/glossary";

describe("glossary helpers", () => {
  it("normalizes glossary entries and drops incomplete rows", () => {
    expect(
      normalizeGlossaryEntries([
        { source: " OpenAI ", target: " OpenAI " },
        { source: " prompt ", target: "提示词", note: "LLM term" },
        { source: "", target: "empty" },
        { source: "missing target", target: "" },
        "bad",
      ]),
    ).toEqual([
      { source: "OpenAI", target: "OpenAI" },
      { source: "prompt", target: "提示词", note: "LLM term" },
    ]);
  });

  it("parses and formats editable glossary text", () => {
    const entries = glossaryTextToEntries(`
      OpenAI = OpenAI
      prompt => 提示词 # LLM term
      API\t接口
    `);

    expect(entries).toEqual([
      { source: "OpenAI", target: "OpenAI" },
      { source: "prompt", target: "提示词", note: "LLM term" },
      { source: "API", target: "接口" },
    ]);
    expect(glossaryEntriesToText(entries)).toBe("OpenAI = OpenAI\nprompt = 提示词 # LLM term\nAPI = 接口");
  });

  it("appends glossary instructions to an AI provider system prompt", () => {
    expect(
      buildGlossarySystemPrompt("Translate as JSON.", [
        { source: "OpenAI", target: "OpenAI" },
        { source: "prompt", target: "提示词", note: "LLM term" },
      ]),
    ).toContain('"prompt" => "提示词" (LLM term)');
  });

  it("fills the terms prompt placeholder when present", () => {
    const prompt = buildGlossarySystemPrompt("Rules.{{terms_prompt}}End.", [
      { source: "API", target: "API" },
    ]);

    expect(prompt).toContain("Rules.\nTerminology glossary:");
    expect(prompt).toContain('"API" => "API"');
    expect(prompt).toContain("End.");
    expect(buildGlossarySystemPrompt("Rules.{{terms_prompt}}End.", [])).toBe("Rules.End.");
  });

  it("exports and imports glossary JSON", () => {
    const exported = exportGlossaryEntries([
      { source: "OpenAI", target: "OpenAI" },
      { source: "prompt", target: "提示词", note: "LLM term" },
    ]);

    expect(exported).toContain('"schema": "imt-glossary-v1"');
    expect(importGlossaryEntries(exported)).toEqual([
      { source: "OpenAI", target: "OpenAI" },
      { source: "prompt", target: "提示词", note: "LLM term" },
    ]);
  });

  it("imports pasted glossary text when JSON is not used", () => {
    expect(importGlossaryEntries("API = 接口")).toEqual([{ source: "API", target: "接口" }]);
  });
});
