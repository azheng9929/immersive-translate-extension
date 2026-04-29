import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";
import { resetImportedWebRulesForTests } from "@/background/webRuleStore";

export function stubImportedRulesResource(): ReturnType<typeof vi.fn> {
  resetImportedWebRulesForTests();
  const importedRulesJson = readFileSync(
    resolve(process.cwd(), "public/data/imported-immersive-web-rules.json"),
    "utf8",
  );
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => JSON.parse(importedRulesJson) as unknown,
  }));

  vi.stubGlobal("chrome", {
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    },
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
