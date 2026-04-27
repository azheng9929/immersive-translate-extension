export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "imt-toggle-page",
      title: "Translate / Restore page",
      contexts: ["page"],
    });
  });
});
