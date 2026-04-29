import {
  classifyContentScriptUrl,
  decideContentMainLoad,
  measureFrameElement,
  type FrameVisibilityMetrics,
} from "../src/content/contentGuard";

const IFRAME_VISIBILITY_REQUEST = "IMT_IFRAME_VISIBILITY_REQUEST";
const IFRAME_VISIBILITY_RESPONSE = "IMT_IFRAME_VISIBILITY_RESPONSE";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  allFrames: true,
  matchAboutBlank: true,
  async main() {
    if (window.__IMT_CONTENT_GUARD_LOADED__) return;
    window.__IMT_CONTENT_GUARD_LOADED__ = true;
    installIframeVisibilityResponder();

    const classification = classifyContentScriptUrl(window.location.href);
    if (classification.blocked) return;

    const isTopFrame = window.top === window;
    const frameMetrics = isTopFrame ? undefined : await readCurrentFrameMetrics();

    const decision = decideContentMainLoad({
      href: window.location.href,
      isTopFrame,
      ...(frameMetrics ? { frameMetrics } : {}),
    });

    if (!decision.load) return;
    await loadContentMain();
  },
});

async function loadContentMain(): Promise<void> {
  await import(/* @vite-ignore */ chrome.runtime.getURL("content-main.js"));
}

async function readCurrentFrameMetrics(): Promise<FrameVisibilityMetrics | undefined> {
  const localMetrics = readLocalFrameMetrics();
  if (localMetrics) return localMetrics;
  return askParentForFrameMetrics();
}

function readLocalFrameMetrics(): FrameVisibilityMetrics | undefined {
  try {
    return measureFrameElement(window.frameElement);
  } catch {
    return undefined;
  }
}

function installIframeVisibilityResponder(): void {
  window.addEventListener("message", (event) => {
    if (!isIframeVisibilityRequest(event.data)) return;

    const frameElement = findSourceFrame(event.source);
    const metrics = measureFrameElement(frameElement);
    const response = {
      type: IFRAME_VISIBILITY_RESPONSE,
      id: event.data.id,
      metrics,
    };

    if (event.source && "postMessage" in event.source) {
      (event.source as WindowProxy).postMessage(response, "*");
    }
  });
}

function askParentForFrameMetrics(timeoutMs = 180): Promise<FrameVisibilityMetrics | undefined> {
  if (window.parent === window) return Promise.resolve(undefined);

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
    const handleMessage = (event: MessageEvent) => {
      if (!isIframeVisibilityResponse(event.data, id)) return;
      cleanup();
      resolve(event.data.metrics);
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: IFRAME_VISIBILITY_REQUEST, id }, "*");
  });
}

function findSourceFrame(source: MessageEventSource | null): HTMLIFrameElement | undefined {
  if (!source) return undefined;

  for (const iframe of document.querySelectorAll("iframe")) {
    try {
      if (iframe.contentWindow === source) return iframe;
    } catch {
      // Some sandboxed frames can deny access; keep looking.
    }
  }

  return undefined;
}

function isIframeVisibilityRequest(data: unknown): data is { type: typeof IFRAME_VISIBILITY_REQUEST; id: string } {
  return isRecord(data) && data.type === IFRAME_VISIBILITY_REQUEST && typeof data.id === "string";
}

function isIframeVisibilityResponse(
  data: unknown,
  id: string,
): data is { type: typeof IFRAME_VISIBILITY_RESPONSE; id: string; metrics?: FrameVisibilityMetrics } {
  return isRecord(data) && data.type === IFRAME_VISIBILITY_RESPONSE && data.id === id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

declare global {
  interface Window {
    __IMT_CONTENT_GUARD_LOADED__?: boolean;
  }
}
