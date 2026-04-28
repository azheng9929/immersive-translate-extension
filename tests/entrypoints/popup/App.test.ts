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
});
