import { describe, expect, it } from "vitest";
import { isPageControlMessage, shouldHandleContentMessage } from "@/content/contentMessagePolicy";

describe("contentMessagePolicy", () => {
  it("lets the top frame answer page-level control messages", () => {
    expect(shouldHandleContentMessage({ type: "IMT_TRANSLATE_PAGE" }, true)).toBe(true);
    expect(shouldHandleContentMessage({ type: "IMT_GET_PAGE_STATUS" }, true)).toBe(true);
    expect(shouldHandleContentMessage({ type: "IMT_SET_PAGE_RENDER_STATE", renderState: "bilingual" }, true)).toBe(true);
    expect(shouldHandleContentMessage({ type: "IMT_CONFIG_UPDATED" }, true)).toBe(true);
  });

  it("keeps iframes from racing the top frame for page-level responses", () => {
    expect(shouldHandleContentMessage({ type: "IMT_TRANSLATE_PAGE" }, false)).toBe(false);
    expect(shouldHandleContentMessage({ type: "IMT_RESTORE_PAGE" }, false)).toBe(false);
    expect(shouldHandleContentMessage({ type: "IMT_GET_PAGE_STATUS" }, false)).toBe(false);
    expect(shouldHandleContentMessage({ type: "IMT_SET_PAGE_RENDER_STATE", renderState: "original" }, false)).toBe(false);
    expect(shouldHandleContentMessage({ type: "IMT_CONFIG_UPDATED" }, false)).toBe(false);
  });

  it("does not treat unrelated messages as page controls", () => {
    expect(isPageControlMessage({ type: "OTHER" })).toBe(false);
    expect(isPageControlMessage(undefined)).toBe(false);
    expect(shouldHandleContentMessage({ type: "OTHER" }, false)).toBe(true);
  });
});
