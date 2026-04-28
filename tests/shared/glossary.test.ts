import { describe, expect, it } from "vitest";
import {
  buildGlossarySystemPrompt,
  glossaryEntriesToText,
  glossaryTextToEntries,
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
});
