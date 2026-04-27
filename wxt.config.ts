import { defineConfig } from "wxt";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  vite: () => ({
    plugins: [vue()],
  }),
  manifest: {
    name: "Immersive Translate Lab",
    description: "Intelligent full-page immersive translation.",
    permissions: ["storage", "contextMenus", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Immersive Translate Lab",
      default_popup: "popup.html",
    },
    commands: {
      "toggle-page-translation": {
        suggested_key: {
          default: "Alt+T"
        },
        description: "Translate or restore the current page"
      }
    }
  }
});
