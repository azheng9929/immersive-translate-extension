import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../../entrypoints/popup/App.vue";
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from "@/shared/config";

describe("popup App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows dynamic mode choices and saves the selected mode", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, dynamicMode: "normal" };
    const sendMessage = vi.fn(async (message) => {
      if (message.type === "IMT_GET_CONFIG") return { ok: true, config };
      if (message.type === "IMT_UPDATE_CONFIG") {
        config = { ...config, ...message.patch };
        return { ok: true, config };
      }
      return { ok: true };
    });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find("[data-testid='dynamic-mode-off']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='dynamic-mode-conservative']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='dynamic-mode-normal']").exists()).toBe(true);

    await wrapper.find("[data-testid='dynamic-mode-off']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { dynamicMode: "off" },
    });
    expect(wrapper.find("[data-testid='dynamic-mode-off']").classes()).toContain("active");
  });
});
