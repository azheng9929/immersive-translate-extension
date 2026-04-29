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
    web_accessible_resources: [
      {
        resources: ["content-main.js", "chunks/*.js"],
        matches: ["<all_urls>"],
      },
    ],
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },
    action: {
      default_title: "Immersive Translate Lab",
      default_popup: "popup.html",
      default_icon: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png",
      },
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
