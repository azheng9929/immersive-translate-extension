import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = resolve(import.meta.dirname, "..");
const extensionSourceDir = resolve(rootDir, ".output", "chrome-mv3");
const chromePath = process.env.CHROME_PATH ?? findBrowserExecutable();
const port = Number(process.env.IMT_REGRESSION_PORT ?? await findAvailablePort());
const runtimeDir = join(tmpdir(), "imt-real-site-regression", String(Date.now()));
const extensionDir = join(runtimeDir, "extension");
const profileDir = join(runtimeDir, "profile");
const reportDir = resolve(rootDir, ".tmp", "real-site-regression-reports");
const reportPath = join(reportDir, `report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
const provider = process.env.IMT_REGRESSION_PROVIDER ?? "fake";
const dynamicModes = parseCsv(process.env.IMT_REGRESSION_DYNAMIC_MODES ?? "conservative,normal");

const sites = [
  { name: "X", host: "x.com", url: "https://x.com/explore" },
  { name: "YouTube", host: "youtube.com", url: "https://www.youtube.com/results?search_query=openai" },
  { name: "Reddit", host: "reddit.com", url: "https://www.reddit.com/r/technology/" },
  { name: "MetaTFT", host: "metatft.com", url: "https://www.metatft.com/comps" },
  { name: "MetaTFT Augments", host: "metatft.com", url: "https://www.metatft.com/augments" },
  {
    name: "Tactics Tools Hover",
    host: "tactics.tools",
    url: "https://tactics.tools/team-compositions",
    hoverTooltip: true,
  },
];
const siteFilter = parseCsv(process.env.IMT_REGRESSION_SITE_FILTER ?? "").map((item) => item.toLowerCase());
const selectedSites = siteFilter.length === 0
  ? sites
  : sites.filter((site) =>
      siteFilter.some((filter) =>
        site.name.toLowerCase().includes(filter) ||
        site.host.toLowerCase().includes(filter) ||
        site.url.toLowerCase().includes(filter),
      )
    );

const baseConfig = {
  targetLang: "zh-Hans",
  provider,
  displayMode: "bilingual",
  dynamicMode: "conservative",
  openaiEndpoint: process.env.IMT_REGRESSION_OPENAI_ENDPOINT ?? "https://api.openai.com/v1/chat/completions",
  openaiApiKey: process.env.IMT_REGRESSION_OPENAI_API_KEY ?? "",
  openaiModel: process.env.IMT_REGRESSION_OPENAI_MODEL ?? "gpt-4o-mini",
  openaiMaxConcurrentRequests: Number(process.env.IMT_REGRESSION_OPENAI_CONCURRENCY ?? 2),
  openaiMaxBatchItems: Number(process.env.IMT_REGRESSION_OPENAI_BATCH_ITEMS ?? 16),
  openaiMaxBatchChars: Number(process.env.IMT_REGRESSION_OPENAI_BATCH_CHARS ?? 6000),
  openaiRequestTimeoutMs: Number(process.env.IMT_REGRESSION_OPENAI_TIMEOUT_MS ?? 45000),
  geminiEndpoint: process.env.IMT_REGRESSION_GEMINI_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta",
  geminiApiKey: process.env.IMT_REGRESSION_GEMINI_API_KEY ?? "",
  geminiModel: process.env.IMT_REGRESSION_GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview",
  geminiMaxConcurrentRequests: Number(process.env.IMT_REGRESSION_GEMINI_CONCURRENCY ?? 2),
  geminiMaxBatchItems: Number(process.env.IMT_REGRESSION_GEMINI_BATCH_ITEMS ?? 16),
  geminiMaxBatchChars: Number(process.env.IMT_REGRESSION_GEMINI_BATCH_CHARS ?? 6000),
  geminiRequestTimeoutMs: Number(process.env.IMT_REGRESSION_GEMINI_TIMEOUT_MS ?? 45000),
  siteDynamicModes: {},
  showFloatingBall: true,
  useCache: false,
};

async function main() {
  if (!existsSync(resolve(extensionSourceDir, "manifest.json"))) {
    console.error(`Extension build not found: ${extensionSourceDir}`);
    process.exit(1);
  }

  if (!existsSync(chromePath)) {
    console.error(`Browser executable not found. Set CHROME_PATH to override. Tried: ${chromePath}`);
    process.exit(1);
  }
  validateProviderConfig(baseConfig);

  await mkdir(profileDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });
  await cp(extensionSourceDir, extensionDir, { recursive: true });

  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    `--disable-extensions-except=${extensionDir}`,
    `--load-extension=${extensionDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
    "--disable-features=Translate",
    "--window-size=1366,900",
    "about:blank",
  ];

  const chrome = await launchChrome(chromePath, chromeArgs, port);

  const report = {
    createdAt: new Date().toISOString(),
    extensionSourceDir,
    extensionDir,
    port,
    provider,
    dynamicModes,
    config: publicConfig(baseConfig),
    siteFilter,
    sites: [],
  };

  try {
    var browserSession = await connectToBrowser(port);
    const serviceWorker = await connectToExtensionServiceWorker(port);
    const extensionId = new URL(serviceWorker.url).host;
    const serviceWorkerSession = await CDPSession.connect(serviceWorker.webSocketDebuggerUrl);
    await serviceWorkerSession.send("Runtime.enable");
    for (const dynamicMode of dynamicModes) {
      const config = { ...baseConfig, dynamicMode };
      await setExtensionConfig(serviceWorkerSession, config);
      for (const site of selectedSites) {
        const siteResult = await runSiteRegression(browserSession, serviceWorkerSession, extensionId, site, config);
        report.sites.push(siteResult);
        console.log(`${siteResult.ok ? "PASS" : "FAIL"} ${site.name} [${dynamicMode}]: ${siteResult.summary}`);
      }
    }

    await serviceWorkerSession.close();
    report.extensionId = extensionId;
  } finally {
    try {
      await browserSession?.send("Browser.close");
    } catch {
      chrome?.kill?.();
    } finally {
      await browserSession?.close?.();
    }
  }

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report: ${reportPath}`);

  const failed = report.sites.filter((site) => !site.ok);
  if (failed.length > 0) process.exit(1);
}

async function runSiteRegression(browserSession, serviceWorkerSession, extensionId, site, config) {
  const pageSession = await createPageSession(browserSession);
  const runtimeErrors = [];
  const consoleErrors = [];

  pageSession.on("Runtime.exceptionThrown", (event) => {
    runtimeErrors.push(formatRuntimeError(event.exceptionDetails));
  });
  pageSession.on("Log.entryAdded", (event) => {
    if (event.entry?.level === "error") {
      consoleErrors.push({ text: event.entry.text, url: event.entry.url ?? "" });
    }
  });

  try {
    await pageSession.send("Runtime.enable");
    await pageSession.send("Page.enable");
    await pageSession.send("Log.enable");
    await navigate(pageSession, site.url);
    await delay(3000);

    const translateStartedAt = Date.now();
    const translateResponse = await sendContentMessage(serviceWorkerSession, site.host, { type: "IMT_TRANSLATE_PAGE" });
    const firstProgress = await waitForTranslationProgress(pageSession, translateStartedAt, 8000);
    await delay(500);
    const hoverResult = site.hoverTooltip ? await runHoverTooltipRegression(pageSession) : undefined;
    await scrollPage(pageSession);
    await delay(3500);
    const pageStatusResponse = await sendContentMessage(serviceWorkerSession, site.host, { type: "IMT_GET_PAGE_STATUS" });

    const metrics = await evaluate(pageSession, `(() => {
      const forbiddenTranslations = document.querySelectorAll([
        '[data-testid="HoverCard"] .imt-translation-block',
        '[data-imt-managed="true"] .imt-translation-block',
        '[data-imt-managed="true"] [data-imt-state="translated"]',
        '#masthead-container [data-imt-state="translated"]',
        '#guide-content [data-imt-state="translated"]',
        '#top-level-buttons-computed [data-imt-state="translated"]',
        '#metadata-line [data-imt-state="translated"]',
        'ytd-button-renderer [data-imt-state="translated"]',
        '[data-click-id="share"] [data-imt-state="translated"]',
        '[data-click-id="upvote"] [data-imt-state="translated"]',
        '[data-click-id="downvote"] [data-imt-state="translated"]',
        '[data-testid="post_author_link"] [data-imt-state="translated"]',
        '[data-testid="comment_author_link"] [data-imt-state="translated"]',
        '[data-testid="placementTracking"] [data-imt-state="translated"]',
        '[data-testid="User-Name"] [data-imt-state="translated"]'
      ].join(',')).length;
      return {
        url: location.href,
        title: document.title,
        readyState: document.readyState,
        bodyTextLength: document.body?.innerText?.length ?? 0,
        translatedBlocks: document.querySelectorAll('.imt-translation-block, .imt-translation-compact').length,
        translatedRoots: document.querySelectorAll('[data-imt-state="translated"]').length,
        floatingControl: Boolean(document.querySelector('[data-imt-control="root"]')),
        forbiddenTranslations,
      };
    })()`);

    const screenshotPath = await captureScreenshot(pageSession, site.name);
    const extensionErrors = [
      ...runtimeErrors.filter((error) => isExtensionError(error, extensionId)),
      ...consoleErrors.filter((error) => isExtensionError(error, extensionId) && !isIgnorableConsoleError(error.text)),
    ];
    const siteErrors = [
      ...runtimeErrors.filter((error) => !isExtensionError(error, extensionId)),
      ...consoleErrors.filter((error) => !isExtensionError(error, extensionId) && !isIgnorableConsoleError(error.text)),
    ];
    const skipReason = siteAccessGateReason(site, metrics);
    const skipped = Boolean(skipReason);
    const pageStatus = pageStatusResponse?.ok ? pageStatusResponse.status : undefined;
    const excessiveFailures = pageStatus ? pageStatus.failed > Math.max(5, Math.ceil(pageStatus.total * 0.5)) : false;
    const ok = Boolean(translateResponse?.ok) &&
      Boolean(pageStatusResponse?.ok) &&
      (skipped || metrics.bodyTextLength > 0) &&
      (skipped || metrics.translatedBlocks > 0 || metrics.translatedRoots > 0) &&
      metrics.forbiddenTranslations === 0 &&
      (!site.hoverTooltip || hoverResult?.ok) &&
      !excessiveFailures &&
      pageStatus?.phase !== "failed" &&
      extensionErrors.length === 0;

    return {
      ...site,
      provider: config.provider,
      dynamicMode: config.dynamicMode,
      ok,
      skipped,
      summary: skipped
        ? `skipped: ${skipReason} (${metrics.bodyTextLength} chars), forbidden=${metrics.forbiddenTranslations}`
        : [
            `${metrics.translatedBlocks} blocks, ${metrics.translatedRoots} roots`,
            `failed=${pageStatus?.failed ?? "n/a"}`,
            `forbidden=${metrics.forbiddenTranslations}`,
            `first=${firstProgress.elapsedMs ?? "n/a"}ms`,
            hoverResult ? `hover=${hoverResult.ok ? "ok" : "failed"}` : undefined,
          ].filter(Boolean).join(", "),
      translateResponse,
      pageStatusResponse,
      metrics,
      hoverResult,
      firstProgress,
      screenshotPath,
      errors: extensionErrors,
      siteErrors: siteErrors.slice(0, 10),
      siteErrorCount: siteErrors.length,
    };
  } catch (error) {
    return {
      ...site,
      provider: config.provider,
      dynamicMode: config.dynamicMode,
      ok: false,
      summary: error instanceof Error ? error.message : String(error),
      errors: [error instanceof Error ? error.stack ?? error.message : String(error)],
    };
  } finally {
    await closeTarget(browserSession, pageSession.targetId);
    await pageSession.close();
  }
}

async function connectToBrowser(debugPort) {
  let lastError;
  for (let index = 0; index < 120; index += 1) {
    try {
      const version = await getJson(`http://127.0.0.1:${debugPort}/json/version`);
      if (version.webSocketDebuggerUrl) return CDPSession.connect(version.webSocketDebuggerUrl);
    } catch (error) {
      lastError = error;
      await delay(1000);
    }
  }
  throw new Error(`Chrome remote debugging endpoint did not start: ${lastError?.message ?? "no response"}`);
}

async function launchChrome(executablePath, args, debugPort) {
  if (process.platform === "win32") {
    const argumentList = args.map((arg) => psQuote(arg)).join(", ");
    const debugUrl = `http://127.0.0.1:${debugPort}/json/version`;
    const windowStyle = process.env.IMT_REGRESSION_VISIBLE === "0" ? " -WindowStyle Hidden" : "";
    const command = `
$ErrorActionPreference = 'Stop'
$process = Start-Process -FilePath ${psQuote(executablePath)} -ArgumentList @(${argumentList})${windowStyle} -PassThru
$ready = $false
for ($i = 0; $i -lt 120; $i++) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri ${psQuote(debugUrl)} -TimeoutSec 2 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}
if (-not $ready) {
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  throw ${psQuote(`Chrome remote debugging endpoint did not start on port ${debugPort}`)}
}
Write-Output $process.Id
`.trim();
    const processHandle = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    const { stdout } = await waitForExit(processHandle, "Chrome launcher");
    const processId = Number(stdout.trim().split(/\s+/).at(-1));
    return {
      kill() {
        if (Number.isInteger(processId)) {
          spawn("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            `Stop-Process -Id ${processId} -Force -ErrorAction SilentlyContinue`,
          ], { stdio: "ignore" });
        }
      },
    };
  }

  return spawn(executablePath, args, {
    detached: false,
    stdio: "ignore",
  });
}

function waitForExit(processHandle, label) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    processHandle.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    processHandle.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    processHandle.once("exit", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${label} exited with code ${code}: ${stderr || stdout || "no output"}`));
    });
    processHandle.once("error", reject);
  });
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function connectToExtensionServiceWorker(debugPort) {
  let lastTargets = [];
  for (let index = 0; index < 90; index += 1) {
    const targets = await getJson(`http://127.0.0.1:${debugPort}/json/list`);
    lastTargets = targets;
    const serviceWorkers = targets.filter((target) =>
      target.type === "service_worker" &&
      target.url?.startsWith("chrome-extension://") &&
      target.url?.endsWith("/background.js") &&
      target.webSocketDebuggerUrl
    );
    for (const serviceWorker of serviceWorkers) {
      if (await isRegressionExtensionServiceWorker(serviceWorker)) return serviceWorker;
    }
    await delay(1000);
  }
  throw new Error(`Extension service worker was not found. Targets: ${lastTargets.map((target) => `${target.type}:${target.url}`).join(" | ")}`);
}

async function isRegressionExtensionServiceWorker(target) {
  try {
    const session = await CDPSession.connect(target.webSocketDebuggerUrl);
    await session.send("Runtime.enable");
    const name = await evaluate(session, "chrome.runtime.getManifest().name");
    await session.close();
    return name === "Immersive Translate Lab";
  } catch {
    return false;
  }
}

async function createPageSession(browserSession) {
  const { targetId } = await browserSession.send("Target.createTarget", { url: "about:blank" });
  const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
  const target = targets.find((item) => item.id === targetId);
  if (!target?.webSocketDebuggerUrl) throw new Error(`Page target not found: ${targetId}`);
  const session = await CDPSession.connect(target.webSocketDebuggerUrl);
  session.targetId = targetId;
  return session;
}

async function closeTarget(browserSession, targetId) {
  if (!targetId) return;
  try {
    await browserSession.send("Target.closeTarget", { targetId });
  } catch {
    // The target may already be closed by the browser.
  }
}

async function navigate(pageSession, url) {
  const loaded = pageSession.waitFor("Page.loadEventFired", 45000).catch(() => undefined);
  await pageSession.send("Page.navigate", { url });
  await loaded;
}

async function scrollPage(pageSession) {
  for (let index = 0; index < 3; index += 1) {
    await evaluate(pageSession, "window.scrollBy(0, Math.max(window.innerHeight, 700))");
    await delay(1000);
  }
}

async function runHoverTooltipRegression(pageSession) {
  await evaluate(pageSession, "window.scrollTo(0, Math.min(600, Math.max(0, document.body.scrollHeight - window.innerHeight)))");
  await delay(1000);

  const candidates = await readHoverCandidates(pageSession);
  const attempted = [];

  for (const candidate of candidates) {
    attempted.push(candidate);
    await pageSession.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: candidate.x,
      y: candidate.y,
    });

    const tooltip = await waitForTranslatedTooltip(pageSession, 5000);
    if (tooltip?.translatedBlocks > 0) {
      return {
        ok: true,
        target: candidate,
        tooltip,
        attempted: attempted.length,
      };
    }

    await pageSession.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 4, y: 4 });
    await delay(150);
  }

  const lastTooltip = await readVisibleTooltips(pageSession);
  return {
    ok: false,
    attempted: attempted.length,
    candidates: candidates.slice(0, 12),
    lastTooltip,
    error: candidates.length === 0 ? "No hover candidates found" : "No translated hover tooltip found",
  };
}

async function readHoverCandidates(pageSession) {
  return evaluate(pageSession, `(() => {
    const selectors = [
      'img',
      '[style*="background-image"]',
      'canvas',
      'svg',
      '[class*="item"]',
      '[class*="unit"]'
    ].join(',');
    return Array.from(document.querySelectorAll(selectors))
      .filter((element) => !element.closest('[data-imt-managed="true"], [data-imt-control="root"]'))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
          tag: element.tagName,
          className: String(element.className || '').slice(0, 120),
          alt: element.getAttribute('alt') || undefined,
        };
      })
      .filter((item) =>
        item.x > 0 &&
        item.y > 0 &&
        item.x < window.innerWidth &&
        item.y < window.innerHeight &&
        item.width >= 10 &&
        item.width <= 120 &&
        item.height >= 10 &&
        item.height <= 120
      )
      .slice(0, 160);
  })()`);
}

async function waitForTranslatedTooltip(pageSession, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastTooltip = [];

  while (Date.now() < deadline) {
    lastTooltip = await readVisibleTooltips(pageSession);
    const translated = lastTooltip.find((tooltip) => tooltip.translatedBlocks > 0);
    if (translated) return translated;
    await delay(200);
  }

  return lastTooltip.find((tooltip) => tooltip.visible) ?? undefined;
}

async function readVisibleTooltips(pageSession) {
  return evaluate(pageSession, `(() => {
    const selector = [
      '[role="tooltip"]',
      '[popover]',
      '[data-tippy-root]',
      '.tippy-box',
      '.tooltip',
      '.popover',
      '[class*="tooltip"]',
      '[class*="popover"]'
    ].join(',');
    return Array.from(document.body.querySelectorAll(selector))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const translations = Array.from(
          element.querySelectorAll('.imt-translation-block, .imt-translation-compact')
        ).map((node) => node.textContent?.trim()).filter(Boolean);
        return {
          tag: element.tagName,
          role: element.getAttribute('role') || undefined,
          className: String(element.className || '').slice(0, 160),
          position: style.position,
          zIndex: style.zIndex,
          visible: rect.width > 0 && rect.height > 0,
          text: (element.innerText || element.textContent || '').trim().slice(0, 500),
          translatedBlocks: translations.length,
          translatedText: translations.slice(0, 8),
        };
      })
      .filter((item) => item.visible && item.text.length > 10);
  })()`);
}

async function waitForTranslationProgress(pageSession, startedAt, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastProgress = { translatedBlocks: 0, translatedRoots: 0 };

  while (Date.now() < deadline) {
    lastProgress = await readTranslationProgress(pageSession);
    if (lastProgress.translatedBlocks > 0 || lastProgress.translatedRoots > 0) {
      return {
        ...lastProgress,
        elapsedMs: Date.now() - startedAt,
        timedOut: false,
      };
    }
    await delay(100);
  }

  return {
    ...lastProgress,
    elapsedMs: undefined,
    timedOut: true,
  };
}

async function readTranslationProgress(pageSession) {
  return evaluate(pageSession, `(() => ({
    translatedBlocks: document.querySelectorAll('.imt-translation-block, .imt-translation-compact').length,
    translatedRoots: document.querySelectorAll('[data-imt-state="translated"]').length,
  }))()`);
}

async function captureScreenshot(pageSession, siteName) {
  const response = await pageSession.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${siteName.toLowerCase()}.png`;
  const screenshotPath = join(reportDir, fileName);
  await writeFile(screenshotPath, Buffer.from(response.data, "base64"));
  return screenshotPath;
}

async function setExtensionConfig(serviceWorkerSession, nextConfig) {
  const result = await evaluate(serviceWorkerSession, `(async () => {
    await chrome.storage.local.set(${JSON.stringify({ "imt-extension-config": nextConfig })});
    return chrome.storage.local.get("imt-extension-config");
  })()`);
  if (result["imt-extension-config"]?.provider !== nextConfig.provider) {
    throw new Error("Failed to write extension regression config");
  }
}

async function sendContentMessage(serviceWorkerSession, host, message) {
  return evaluate(serviceWorkerSession, `(async () => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((item) => item.url && item.url.includes(${JSON.stringify(host)}));
    if (!tab?.id) return { ok: false, error: "tab not found", tabs: tabs.map((item) => item.url) };
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, ${JSON.stringify(message)}, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response ?? { ok: false, error: "empty response" });
      });
    });
  })()`);
}

async function evaluate(session, expression) {
  const response = await session.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Evaluation failed");
  }
  return response.result?.value;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function findAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) resolvePort(address.port);
        else reject(new Error("Could not allocate a regression debug port"));
      });
    });
  });
}

function findBrowserExecutable() {
  const candidates = process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome for Testing\\Application\\chrome.exe",
        "C:\\Program Files\\Chromium\\Application\\chrome.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ]
      : [
          "/usr/bin/microsoft-edge",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/google-chrome-for-testing",
          "/usr/bin/google-chrome",
        ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates.at(-1);
}

function formatRuntimeError(exceptionDetails = {}) {
  const stackTrace = exceptionDetails.stackTrace?.callFrames
    ?.map((frame) => `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`)
    ?.join("\n");
  return {
    text: exceptionDetails.text ?? exceptionDetails.exception?.description ?? "Runtime exception",
    url: exceptionDetails.url ?? exceptionDetails.exception?.url ?? "",
    stackTrace: stackTrace ?? "",
  };
}

function isExtensionError(error, extensionId) {
  const marker = `chrome-extension://${extensionId}/`;
  return error.url?.includes(marker) || error.stackTrace?.includes(marker) || error.text?.includes(marker);
}

function isXLoginWall(site, metrics) {
  return site.host === "x.com" && (
    metrics.url.includes("x.com/i/flow/login") ||
    metrics.bodyTextLength < 100
  );
}

function isRedditHumanityCheck(site, metrics) {
  return site.host === "reddit.com" && /prove your humanity/i.test(metrics.title);
}

function siteAccessGateReason(site, metrics) {
  if (isXLoginWall(site, metrics)) return "login wall";
  if (isRedditHumanityCheck(site, metrics)) return "humanity check";
  return undefined;
}

function isIgnorableConsoleError(message) {
  return /favicon|net::ERR_BLOCKED_BY_CLIENT|net::ERR_CONNECTION_CLOSED|ResizeObserver loop/i.test(message);
}

function parseCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function validateProviderConfig(config) {
  const supportedProviders = new Set(["fake", "microsoft", "openai-compatible", "gemini"]);
  if (!supportedProviders.has(config.provider)) {
    throw new Error(`Unsupported IMT_REGRESSION_PROVIDER: ${config.provider}`);
  }
  const supportedDynamicModes = new Set(["off", "conservative", "normal"]);
  for (const dynamicMode of dynamicModes) {
    if (!supportedDynamicModes.has(dynamicMode)) throw new Error(`Unsupported IMT_REGRESSION_DYNAMIC_MODES value: ${dynamicMode}`);
  }
  if (dynamicModes.length === 0) throw new Error("IMT_REGRESSION_DYNAMIC_MODES must include at least one mode");
  if (selectedSites.length === 0) throw new Error(`IMT_REGRESSION_SITE_FILTER matched no sites: ${siteFilter.join(", ")}`);
  if (config.provider === "openai-compatible" && !config.openaiApiKey) {
    throw new Error("IMT_REGRESSION_OPENAI_API_KEY is required when IMT_REGRESSION_PROVIDER=openai-compatible");
  }
  if (config.provider === "gemini" && !config.geminiApiKey) {
    throw new Error("IMT_REGRESSION_GEMINI_API_KEY is required when IMT_REGRESSION_PROVIDER=gemini");
  }
}

function publicConfig(config) {
  return {
    ...config,
    openaiApiKey: config.openaiApiKey ? "[set]" : "",
    geminiApiKey: config.geminiApiKey ? "[set]" : "",
  };
}

class CDPSession {
  static async connect(webSocketUrl) {
    const socket = new WebSocket(webSocketUrl);
    const session = new CDPSession(socket);
    await session.opened;
    return session;
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.opened = new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: resolvePending, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolvePending(message.result ?? {});
        return;
      }
      if (message.method) {
        for (const listener of this.listeners.get(message.method) ?? []) {
          listener(message.params ?? {});
        }
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolvePending, reject) => {
      this.pending.set(id, { resolve: resolvePending, reject });
      this.socket.send(payload);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
  }

  waitFor(method, timeoutMs) {
    return new Promise((resolvePending, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listener = (params) => {
        clearTimeout(timer);
        this.listeners.get(method)?.delete(listener);
        resolvePending(params);
      };
      this.on(method, listener);
    });
  }

  async close() {
    this.socket.close();
  }
}

await main();
