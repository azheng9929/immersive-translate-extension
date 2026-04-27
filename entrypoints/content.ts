export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main() {
    window.__IMT_CONTENT_READY__ = true;
  },
});

declare global {
  interface Window {
    __IMT_CONTENT_READY__?: boolean;
  }
}
