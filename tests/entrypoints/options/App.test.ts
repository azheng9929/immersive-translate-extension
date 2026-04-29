import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../../entrypoints/options/App.vue";
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from "@/shared/config";

describe("options App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides dynamic mode presets from the settings page", async () => {
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

    expect(wrapper.text()).toContain("设置");
    expect(wrapper.text()).toContain("翻译服务");
    expect(wrapper.text()).toContain("交互入口");
    expect(wrapper.text()).toContain("术语表");
    expect(wrapper.text()).toContain("站点规则");
    expect(wrapper.find("[data-testid='options-dynamic-mode-off']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='options-dynamic-mode-conservative']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='options-dynamic-mode-normal']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='request-profile-high-dynamic']").exists()).toBe(false);
  });

  it("keeps input translation off by default and saves interaction toggles", async () => {
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

    const inputTranslator = wrapper.find<HTMLInputElement>("[data-testid='options-input-translator-toggle']");
    const floatingBall = wrapper.find<HTMLInputElement>("[data-testid='options-floating-ball-toggle']");
    const cache = wrapper.find<HTMLInputElement>("[data-testid='options-cache-toggle']");
    const newContent = wrapper.find<HTMLInputElement>("[data-testid='options-new-content-toggle']");
    expect(inputTranslator.element.checked).toBe(false);
    expect(floatingBall.element.checked).toBe(true);
    expect(cache.element.checked).toBe(true);
    expect(newContent.element.checked).toBe(true);

    await inputTranslator.setValue(true);
    await floatingBall.setValue(false);
    await cache.setValue(false);
    await newContent.setValue(false);
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { showInputTranslator: true },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { showFloatingBall: false },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { useCache: false },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { dynamicMode: "off" },
    });
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
    const maxConcurrent = wrapper.find<HTMLInputElement>("[data-testid='openai-max-concurrent']");
    const maxBatchItems = wrapper.find<HTMLInputElement>("[data-testid='openai-max-batch-items']");
    const maxBatchChars = wrapper.find<HTMLInputElement>("[data-testid='openai-max-batch-chars']");
    const timeout = wrapper.find<HTMLInputElement>("[data-testid='openai-request-timeout']");
    const systemPrompt = wrapper.find<HTMLTextAreaElement>("[data-testid='openai-system-prompt']");

    expect(endpoint.element.value).toBe("https://api.openai.com/v1/chat/completions");
    expect(maxConcurrent.element.value).toBe("4");
    expect(maxBatchItems.element.value).toBe("4");
    await endpoint.setValue("https://api.example.test/v1/chat/completions");
    await apiKey.setValue("sk-test");
    await model.setValue("gpt-test");
    await maxConcurrent.setValue("4");
    await maxBatchItems.setValue("12");
    await maxBatchChars.setValue("9000");
    await timeout.setValue("60000");
    await systemPrompt.setValue("Custom prompt");
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
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiMaxConcurrentRequests: 4 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiMaxBatchItems: 12 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiMaxBatchChars: 9000 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiRequestTimeoutMs: 60000 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { openaiSystemPrompt: "Custom prompt" },
    });
  });

  it("saves Gemini API settings from the settings page", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, provider: "gemini" };
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

    const endpoint = wrapper.find<HTMLInputElement>("[data-testid='gemini-endpoint']");
    const apiKey = wrapper.find<HTMLInputElement>("[data-testid='gemini-api-key']");
    const model = wrapper.find<HTMLInputElement>("[data-testid='gemini-model']");
    const maxConcurrent = wrapper.find<HTMLInputElement>("[data-testid='gemini-max-concurrent']");
    const maxBatchItems = wrapper.find<HTMLInputElement>("[data-testid='gemini-max-batch-items']");
    const maxBatchChars = wrapper.find<HTMLInputElement>("[data-testid='gemini-max-batch-chars']");
    const timeout = wrapper.find<HTMLInputElement>("[data-testid='gemini-request-timeout']");
    const systemPrompt = wrapper.find<HTMLTextAreaElement>("[data-testid='gemini-system-prompt']");

    expect(endpoint.element.value).toBe("https://generativelanguage.googleapis.com/v1beta");
    expect(model.element.value).toBe("gemini-3.1-flash-lite-preview");
    await endpoint.setValue("https://generativelanguage.googleapis.com/v1beta");
    await apiKey.setValue("gem-test");
    await model.setValue("gemini-test");
    await maxConcurrent.setValue("3");
    await maxBatchItems.setValue("10");
    await maxBatchChars.setValue("7000");
    await timeout.setValue("65000");
    await systemPrompt.setValue("Gemini custom prompt");
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
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiMaxConcurrentRequests: 3 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiMaxBatchItems: 10 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiMaxBatchChars: 7000 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiRequestTimeoutMs: 65000 },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { geminiSystemPrompt: "Gemini custom prompt" },
    });
  });

  it("saves fallback provider without exposing request presets", async () => {
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

    expect(wrapper.find("[data-testid='request-profile-high-dynamic']").exists()).toBe(false);
    await wrapper.find<HTMLSelectElement>("[data-testid='fallback-provider']").setValue("microsoft");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { fallbackProvider: "microsoft" },
    });
  });

  it("saves glossary entries from editable text", async () => {
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

    await wrapper.find<HTMLTextAreaElement>("[data-testid='glossary-text']").setValue("OpenAI = OpenAI\nprompt => 提示词 # LLM term");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: {
        glossary: [
          { source: "OpenAI", target: "OpenAI" },
          { source: "prompt", target: "提示词", note: "LLM term" },
        ],
      },
    });
  });

  it("imports and exports glossary JSON", async () => {
    let config: ExtensionConfig = {
      ...DEFAULT_EXTENSION_CONFIG,
      glossary: [{ source: "OpenAI", target: "OpenAI" }],
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

    await wrapper.find("[data-testid='glossary-export']").trigger("click");
    expect(wrapper.find<HTMLTextAreaElement>("[data-testid='glossary-export-text']").element.value).toContain("imt-glossary-v1");

    await wrapper.find<HTMLTextAreaElement>("[data-testid='glossary-import-text']").setValue(
      JSON.stringify({ schema: "imt-glossary-v1", glossary: [{ source: "API", target: "接口" }] }),
    );
    await wrapper.find("[data-testid='glossary-import']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: { glossary: [{ source: "API", target: "接口" }] },
    });
  });

  it("manages site auto translate rules from settings", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, siteDynamicModes: { "x.com": "conservative" } };
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

    await wrapper.find<HTMLInputElement>("[data-testid='site-rule-host']").setValue("https://www.youtube.com/watch?v=abc");
    await wrapper.find<HTMLSelectElement>("[data-testid='site-rule-auto-translate']").setValue("always");
    await wrapper.find("[data-testid='site-rule-save']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: {
        siteRules: { "youtube.com": { autoTranslate: true } },
      },
    });

    await wrapper.find("[data-testid='site-rule-remove-youtube.com']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: {
        siteRules: {},
      },
    });
  });

  it("saves enhanced site rule fields from settings", async () => {
    let config: ExtensionConfig = { ...DEFAULT_EXTENSION_CONFIG, siteRules: {}, siteDynamicModes: {} };
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

    await wrapper.find<HTMLInputElement>("[data-testid='site-rule-host']").setValue("https://reddit.com/r/typescript");
    await wrapper.find<HTMLSelectElement>("[data-testid='site-rule-display-mode']").setValue("bilingual");
    await wrapper.find<HTMLSelectElement>("[data-testid='site-rule-provider']").setValue("gemini");
    await wrapper.find<HTMLSelectElement>("[data-testid='site-rule-fallback-provider']").setValue("microsoft");
    await wrapper.find<HTMLSelectElement>("[data-testid='site-rule-auto-translate']").setValue("always");
    await wrapper.find("[data-testid='site-rule-save']").trigger("click");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "IMT_UPDATE_CONFIG",
      patch: {
        siteRules: {
          "reddit.com": {
            autoTranslate: true,
            displayMode: "bilingual",
            provider: "gemini",
            fallbackProvider: "microsoft",
          },
        },
      },
    });
  });
});
