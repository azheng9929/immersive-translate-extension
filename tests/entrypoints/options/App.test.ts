import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../../entrypoints/options/App.vue";
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from "@/shared/config";

describe("options App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves the dynamic mode from the settings page", async () => {
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

    await wrapper.find("[data-testid='options-dynamic-mode-conservative']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { dynamicMode: "conservative" },
    });
    expect(wrapper.find("[data-testid='options-dynamic-mode-conservative']").classes()).toContain("active");
  });

  it("saves OpenAI-compatible API settings from the settings page", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, provider: "openai-compatible" };
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

    const endpoint = wrapper.find<HTMLInputElement>("[data-testid='openai-endpoint']");
    const apiKey = wrapper.find<HTMLInputElement>("[data-testid='openai-api-key']");
    const model = wrapper.find<HTMLInputElement>("[data-testid='openai-model']");

    expect(endpoint.element.value).toBe("https://api.openai.com/v1/chat/completions");
    await endpoint.setValue("https://api.example.test/v1/chat/completions");
    await apiKey.setValue("sk-test");
    await model.setValue("gpt-test");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiEndpoint: "https://api.example.test/v1/chat/completions" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiApiKey: "sk-test" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiModel: "gpt-test" },
    });
  });
});
