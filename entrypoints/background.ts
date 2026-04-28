import { handleBackgroundMessage, sendToActiveTab, toggleActiveTabTranslation } from "../src/background/messageRouter";
import type { BackgroundMessage } from "../src/shared/messages";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "imt-translate-page",
      title: "Translate page",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "imt-restore-page",
      title: "Restore original",
      contexts: ["page"],
    });
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "imt-translate-page") {
      void sendToActiveTab({ type: "IMT_TRANSLATE_PAGE" });
    }
    if (info.menuItemId === "imt-restore-page") {
      void sendToActiveTab({ type: "IMT_RESTORE_PAGE" });
    }
  });

  chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-page-translation") {
      void toggleActiveTabTranslation();
    }
  });

  chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    handleBackgroundMessage(message).then(sendResponse);
    return true;
  });
});
