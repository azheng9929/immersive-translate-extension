export type FrameVisibilityMetrics = {
  width: number;
  height: number;
  rectWidth: number;
  rectHeight: number;
  visibleByViewport: boolean;
};

export type ContentScriptUrlClassification =
  | { blocked: false }
  | { blocked: true; reason: "blocked-domain" | "cloudflare-challenge-page" };

export type ContentMainLoadDecision =
  | { load: true; reason: "top-frame" | "visible-iframe" | "iframe-visibility-unknown" }
  | { load: false; reason: "blocked-domain" | "cloudflare-challenge-page" | "hidden-iframe" };

const BLOCKED_FRAME_HOST_PARTS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "googletagservices.com",
  "pubmatic.com",
  "openx.net",
  "rubiconproject.com",
  "indexww.com",
  "bidswitch.net",
  "adnxs.com",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "moatads.com",
  "inmobi.com",
  "amazon-adsystem.com",
  "imasdk.googleapis.com",
] as const;

const CLOUDFLARE_CHALLENGE_PATH_PARTS = ["/cdn-cgi/challenge-platform/"] as const;
const MIN_VISIBLE_FRAME_SIZE = 2;

export function classifyContentScriptUrl(href: string): ContentScriptUrlClassification {
  const url = parseUrl(href);
  if (!url) return { blocked: false };

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_FRAME_HOST_PARTS.some((part) => hostname === part || hostname.endsWith(`.${part}`))) {
    return { blocked: true, reason: "blocked-domain" };
  }

  const pathname = url.pathname.toLowerCase();
  if (CLOUDFLARE_CHALLENGE_PATH_PARTS.some((part) => pathname.includes(part))) {
    return { blocked: true, reason: "cloudflare-challenge-page" };
  }

  return { blocked: false };
}

export function decideContentMainLoad(args: {
  href: string;
  isTopFrame: boolean;
  frameMetrics?: FrameVisibilityMetrics;
}): ContentMainLoadDecision {
  const classification = classifyContentScriptUrl(args.href);
  if (classification.blocked) return { load: false, reason: classification.reason };
  if (args.isTopFrame) return { load: true, reason: "top-frame" };
  if (!args.frameMetrics) return { load: true, reason: "iframe-visibility-unknown" };
  if (!isVisibleFrameMetrics(args.frameMetrics)) return { load: false, reason: "hidden-iframe" };
  return { load: true, reason: "visible-iframe" };
}

export function isVisibleFrameMetrics(metrics: FrameVisibilityMetrics): boolean {
  return (
    metrics.visibleByViewport &&
    metrics.width >= MIN_VISIBLE_FRAME_SIZE &&
    metrics.height >= MIN_VISIBLE_FRAME_SIZE &&
    metrics.rectWidth >= MIN_VISIBLE_FRAME_SIZE &&
    metrics.rectHeight >= MIN_VISIBLE_FRAME_SIZE
  );
}

export function shouldRetryHiddenFrameMetrics(metrics: FrameVisibilityMetrics): boolean {
  return (
    metrics.visibleByViewport &&
    !isVisibleFrameMetrics(metrics) &&
    (
      metrics.width < MIN_VISIBLE_FRAME_SIZE ||
      metrics.height < MIN_VISIBLE_FRAME_SIZE ||
      metrics.rectWidth < MIN_VISIBLE_FRAME_SIZE ||
      metrics.rectHeight < MIN_VISIBLE_FRAME_SIZE
    )
  );
}

export function measureFrameElement(
  element: Element | null | undefined,
  viewport: { width: number; height: number } = {
    width: globalThis.innerWidth || 0,
    height: globalThis.innerHeight || 0,
  },
): FrameVisibilityMetrics | undefined {
  if (!(element instanceof HTMLElement)) return undefined;

  const rect = element.getBoundingClientRect();
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    rectWidth: rect.width,
    rectHeight: rect.height,
    visibleByViewport: rect.bottom > 0 && rect.right > 0 && rect.top < viewport.height && rect.left < viewport.width,
  };
}

function parseUrl(href: string): URL | undefined {
  try {
    return new URL(href);
  } catch {
    return undefined;
  }
}
