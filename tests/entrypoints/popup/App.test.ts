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

  it("shows and saves OpenAI API settings from the popup", async () => {
    let config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "openai-compatible",
      openaiApiKey: "",
    };
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

    expect(wrapper.find("[data-testid='popup-openai-status']").text()).toBe("API key required");

    await wrapper.find<HTMLInputElement>("[data-testid='popup-openai-endpoint']").setValue("https://api.example.test/v1/chat/completions");
    await wrapper.find<HTMLInputElement>("[data-testid='popup-openai-api-key']").setValue("sk-test");
    await wrapper.find<HTMLInputElement>("[data-testid='popup-openai-model']").setValue("gpt-test");
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

  it("shows and saves Gemini API settings from the popup", async () => {
    let config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "gemini",
      geminiApiKey: "",
    };
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

    expect(wrapper.find("[data-testid='popup-gemini-status']").text()).toBe("API key required");

    await wrapper.find<HTMLInputElement>("[data-testid='popup-gemini-endpoint']").setValue("https://generativelanguage.googleapis.com/v1beta");
    await wrapper.find<HTMLInputElement>("[data-testid='popup-gemini-api-key']").setValue("gem-test");
    await wrapper.find<HTMLInputElement>("[data-testid='popup-gemini-model']").setValue("gemini-test");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiApiKey: "gem-test" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiModel: "gemini-test" },
    });
  });

  it("shows current page diagnostics from the active tab", async () => {
    const config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, dynamicMode: "normal" };
    const sendMessage = vi.fn(async (message) => {
      if (message.type === "IMT_GET_CONFIG") return { ok: true, config };
      if (message.type === "IMT_POPUP_GET_ACTIVE_TAB_STATUS") {
        return {
          ok: true,
          status: {
            phase: "translated",
            observation: "observing",
            pendingRoots: 2,
            observedRoots: 3,
            total: 1,
            translated: 1,
            failed: 0,
            skipped: 0,
            dynamicRuns: 2,
            lastError: undefined,
            site: {
              hostname: "www.youtube.com",
              siteKey: "youtube.com",
              dynamicMode: "conservative",
              dynamicModeSource: "site-default",
              isHighDynamic: true,
            },
            diagnostics: {
              scan: {
                text: {
                  seen: 4,
                  accepted: 1,
                  skipped: 3,
                  skippedByReason: {
                    "target-language": 1,
                    "global-selector": 2,
                  },
                },
                attributes: {
                  seen: 1,
                  accepted: 0,
                  skipped: 1,
                  skippedByReason: {
                    "target-language": 1,
                  },
                },
              },
              units: {
                built: 1,
                dropped: 1,
                droppedByReason: {
                  "target-language": 1,
                },
              },
              cache: {
                hits: 0,
                misses: 1,
              },
              provider: {
                requested: 1,
                failed: 0,
                skipped: 0,
              },
            },
          },
        };
      }
      return { ok: true };
    });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    const wrapper = mount(App);
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({ type: "IMT_POPUP_GET_ACTIVE_TAB_STATUS" });
    expect(wrapper.find("[data-testid='debug-status']").text()).toContain("Translated");
    expect(wrapper.find("[data-testid='debug-status']").text()).toContain("1 / 1 translated");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("Dynamic observing, 2 pending, 3 lazy");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("Cache 0 hits, 1 miss");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("Provider 1 requested, 0 failed, 0 skipped");
  });

  it("saves a dynamic mode override for the current site", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, siteDynamicModes: {} };
    const sendMessage = vi.fn(async (message) => {
      if (message.type === "IMT_GET_CONFIG") return { ok: true, config };
      if (message.type === "IMT_POPUP_GET_ACTIVE_TAB_STATUS") {
        return {
          ok: true,
          status: {
            phase: "translated",
            observation: "observing",
            pendingRoots: 0,
            observedRoots: 0,
            total: 0,
            translated: 0,
            failed: 0,
            skipped: 0,
            dynamicRuns: 0,
            lastError: undefined,
            site: {
              hostname: "www.youtube.com",
              siteKey: "youtube.com",
              dynamicMode: "conservative",
              dynamicModeSource: "site-default",
              isHighDynamic: true,
            },
          },
        };
      }
      if (message.type === "IMT_UPDATE_CONFIG") {
        config = { ...config, ...message.patch };
        return { ok: true, config };
      }
      return { ok: true };
    });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find("[data-testid='site-mode-auto']").classes()).toContain("active");

    await wrapper.find("[data-testid='site-mode-normal']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { siteDynamicModes: { "youtube.com": "normal" } },
    });
  });
});
