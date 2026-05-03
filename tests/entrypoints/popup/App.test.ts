import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../../entrypoints/popup/App.vue";
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from "@/shared/config";

describe("popup App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not expose dynamic mode choices in the popup", async () => {
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

    expect(wrapper.find("[data-testid='dynamic-mode-off']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='dynamic-mode-conservative']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='dynamic-mode-normal']").exists()).toBe(false);
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "IMT_UPDATE_CONFIG",
      patch: expect.objectContaining({ dynamicMode: expect.any(String) }),
    }));
  });

  it("keeps input translation off by default and saves the popup toggle", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG };
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

    const toggle = wrapper.find<HTMLInputElement>("[data-testid='popup-input-translator-toggle']");
    expect(toggle.element.checked).toBe(false);

    await toggle.setValue(true);
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { showInputTranslator: true },
    });
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

    expect(wrapper.find("[data-testid='popup-openai-status']").text()).toBe("需要 API Key");

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

    expect(wrapper.find("[data-testid='popup-gemini-status']").text()).toBe("需要 API Key");

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

  it("shows and saves additional AI provider settings from the popup", async () => {
    let config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      provider: "deepseek",
      deepseekApiKey: "",
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

    expect(wrapper.find("[data-testid='popup-deepseek-status']").text()).toBe("需要 API Key");

    await wrapper.find<HTMLInputElement>("[data-testid='popup-deepseek-api-key']").setValue("ds-test");
    await wrapper.find<HTMLInputElement>("[data-testid='popup-deepseek-model']").setValue("deepseek-v4-pro");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { deepseekApiKey: "ds-test" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { deepseekModel: "deepseek-v4-pro" },
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
    expect(wrapper.find("[data-testid='debug-status']").text()).toContain("已翻译");
    expect(wrapper.find("[data-testid='debug-status']").text()).toContain("已翻译 1 / 1");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("新内容观察中，2 个待处理，3 个懒加载");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("缓存 0 命中，1 未命中");
    expect(wrapper.find("[data-testid='popup-debug-details']").text()).toContain("服务请求 1，失败 0，跳过 0");
  });

  it("keeps current site controls focused on auto translate", async () => {
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

    expect(wrapper.find("[data-testid='site-auto-translate-toggle']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='site-mode-auto']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='site-mode-normal']").exists()).toBe(false);
  });

  it("saves auto translate for the current site", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, siteRules: {} };
    const sendMessage = vi.fn(async (message) => {
      if (message.type === "IMT_GET_CONFIG") return { ok: true, config };
      if (message.type === "IMT_POPUP_GET_ACTIVE_TAB_STATUS") {
        return {
          ok: true,
          status: {
            phase: "ready",
            observation: "idle",
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

    const toggle = wrapper.find<HTMLInputElement>("[data-testid='site-auto-translate-toggle']");
    expect(toggle.element.checked).toBe(false);

    await toggle.setValue(true);
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { siteRules: { "youtube.com": { autoTranslate: true } } },
    });
  });

  it("persists current-site auto translate by hostname when the policy site key is a wildcard", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, siteRules: {} };
    const sendMessage = vi.fn(async (message) => {
      if (message.type === "IMT_GET_CONFIG") return { ok: true, config };
      if (message.type === "IMT_POPUP_GET_ACTIVE_TAB_STATUS") {
        return {
          ok: true,
          status: {
            phase: "ready",
            observation: "idle",
            pendingRoots: 0,
            observedRoots: 0,
            total: 0,
            translated: 0,
            failed: 0,
            skipped: 0,
            dynamicRuns: 0,
            lastError: undefined,
            site: {
              hostname: "www.google.com",
              siteKey: "www.google.*",
              dynamicMode: "normal",
              dynamicModeSource: "global",
              isHighDynamic: false,
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

    const toggle = wrapper.find<HTMLInputElement>("[data-testid='site-auto-translate-toggle']");
    expect(toggle.element.checked).toBe(false);

    await toggle.setValue(true);
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { siteRules: { "google.com": { autoTranslate: true } } },
    });

    wrapper.unmount();
    const reopened = mount(App);
    await flushPromises();

    expect(reopened.find<HTMLInputElement>("[data-testid='site-auto-translate-toggle']").element.checked).toBe(true);
  });

  it("switches active page render state from the popup display controls", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, displayMode: "bilingual" };
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

    await wrapper.find("[data-testid='display-mode-original']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_POPUP_SET_ACTIVE_TAB_RENDER_STATE",
      renderState: "original",
    });

    await wrapper.find("[data-testid='display-mode-translation']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { displayMode: "translation-only" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_POPUP_SET_ACTIVE_TAB_RENDER_STATE",
      renderState: "translation",
    });
  });
});
