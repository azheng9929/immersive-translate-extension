import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  fixtureExpectationForKind,
  resolveRegressionSelection,
  siteAccessGateReason,
} from "./real-site-regression-config.mjs";
import {
  buildFailedRegressionReport,
  buildStructuredRegressionReport,
} from "./real-site-regression-evaluator.mjs";

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
const regressionSelection = resolveRegressionSelection({
  argv: process.argv.slice(2),
  env: process.env,
});
const { profile, dynamicModes, siteFilter, fixtureKinds, selectedSites } = regressionSelection;

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
  firstTranslationTimeoutMs: Number(process.env.IMT_REGRESSION_FIRST_TRANSLATION_TIMEOUT_MS ?? (provider === "fake" ? 8000 : 20000)),
  translationSettleTimeoutMs: Number(process.env.IMT_REGRESSION_TRANSLATION_SETTLE_TIMEOUT_MS ?? (provider === "fake" ? 5000 : 45000)),
  translationSettleQuietMs: Number(process.env.IMT_REGRESSION_TRANSLATION_SETTLE_QUIET_MS ?? 1000),
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
    profile,
    dynamicModes,
    fixtureKinds,
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
        console.log(`${siteResult.verdict} ${site.name} [${dynamicMode}]: ${siteResult.summary}`);
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
  const expectation = fixtureExpectationForKind(site.fixtureKind);
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
    await pageSession.send("Page.bringToFront").catch(() => undefined);
    const pageLoadStartedAt = Date.now();
    await navigate(pageSession, site.url);
    const pageLoadMs = Date.now() - pageLoadStartedAt;
    await pageSession.send("Page.bringToFront").catch(() => undefined);
    await delay(3000);

    const translateStartedAt = Date.now();
    const translateResponse = await sendContentMessage(serviceWorkerSession, site.host, { type: "IMT_TRANSLATE_PAGE" });
    const firstProgress = await waitForTranslationProgress(pageSession, translateStartedAt, config.firstTranslationTimeoutMs);
    await delay(500);
    const hoverResult = site.hoverTooltip ? await runHoverTooltipRegression(pageSession, site) : undefined;
    await scrollPage(pageSession);
    await waitForTranslationSettled(
      pageSession,
      translateStartedAt,
      config.translationSettleTimeoutMs,
      config.translationSettleQuietMs,
    );
    const fullTranslationMs = Date.now() - translateStartedAt;
    const pageStatusResponse = await sendContentMessage(serviceWorkerSession, site.host, { type: "IMT_GET_PAGE_STATUS" });

    const ruleVisualizationSelectors = pageStatusResponse?.ok
      ? pageStatusResponse.status?.site?.ruleDiagnostics?.visualizationSelectors ?? []
      : [];
    const metrics = await readRegressionMetrics(pageSession, site, expectation, ruleVisualizationSelectors);
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
    const restoreStartedAt = Date.now();
    const restoreResponse = skipReason ? { ok: true } : await sendContentMessage(serviceWorkerSession, site.host, { type: "IMT_RESTORE_PAGE" });
    await delay(500);
    const restoreMetrics = skipReason ? undefined : await readRestoreMetrics(pageSession);

    return buildStructuredRegressionReport({
      site,
      config,
      metrics,
      translateResponse,
      pageStatusResponse,
      firstProgress,
      hoverResult,
      restoreResponse,
      restoreMetrics,
      timings: {
        pageLoadMs,
        firstTranslationMs: firstProgress.elapsedMs,
        fullTranslationMs,
        restoreMs: skipReason ? undefined : Date.now() - restoreStartedAt,
      },
      screenshotPath,
      extensionErrors,
      siteErrors,
      siteErrorCount: siteErrors.length,
      gateReason: skipReason,
      expectation,
    });
  } catch (error) {
    return buildFailedRegressionReport({ site, config, error });
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

async function readRegressionMetrics(pageSession, site, expectation, ruleVisualizationSelectors = []) {
  return evaluate(pageSession, `(() => {
    const expectation = ${JSON.stringify({
      fixtureKind: site.fixtureKind ?? "generic",
      positiveSelectors: expectation.positiveSelectors,
      negativeSelectors: expectation.negativeSelectors,
      ruleVisualizationSelectors,
    })};
    const TRANSLATED_SELECTOR = [
      '[data-imt-state="translated"]',
      '.imt-translation-block',
      '.imt-translation-compact',
      '.imt-translation-replacement'
    ].join(',');
    const LOADING_SELECTOR = '[data-imt-state="loading"], .imt-translation-loading[data-imt-loading="true"]';

    function safeQueryAll(selector, root = document) {
      try {
        return Array.from(root.querySelectorAll(selector));
      } catch {
        return [];
      }
    }

    function textPreview(element) {
      return [
        element.innerText,
        element.textContent,
        element.getAttribute?.('value'),
        element.getAttribute?.('placeholder'),
        element.getAttribute?.('aria-label'),
        element.getAttribute?.('title'),
        element.getAttribute?.('alt'),
      ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim().slice(0, 180);
    }

    function isElementTranslated(element) {
      return Boolean(
        element.closest('[data-imt-state="translated"]') ||
        element.matches('[data-imt-managed="true"], .imt-translation-block, .imt-translation-compact, .imt-translation-replacement') ||
        element.querySelector(TRANSLATED_SELECTOR) ||
        element.querySelector('[data-imt-managed="true"]')
      );
    }

    function isElementDirectlyTranslated(element) {
      return Boolean(
        element.matches('[data-imt-state="translated"], [data-imt-managed="true"], .imt-translation-block, .imt-translation-compact, .imt-translation-replacement')
      );
    }

    function isGeneratedTranslationElement(element) {
      return Boolean(
        element.closest('[data-imt-managed="true"], .imt-translation-block, .imt-translation-compact, .imt-translation-replacement')
      );
    }

    function isNegativeTranslated(element) {
      return Boolean(
        isElementDirectlyTranslated(element) ||
        element.querySelector(TRANSLATED_SELECTOR) ||
        element.querySelector('[data-imt-managed="true"]')
      );
    }

    function isBroadDescendantOnlyNegative(selector, element) {
      if (isElementDirectlyTranslated(element)) return false;
      const normalized = String(selector || '').toLowerCase();
      return (
        normalized.includes("class*='sidebar'") ||
        normalized.includes('class*="sidebar"') ||
        normalized.includes("class*='url'") ||
        normalized.includes('class*="url"')
      );
    }

    function isSkippableNegativeElement(element, text) {
      if (isGeneratedTranslationElement(element)) return true;
      if (element.matches('script,style,template,noscript')) return true;
      if (!text) return true;
      return false;
    }

    function classifyNegativeViolation(element, selector, text) {
      const marker = [selector, element.tagName, element.id, element.className, text].join(' ').toLowerCase();
      if (element.closest('pre,code,kbd,samp') || /\\b(pre|code|kbd|samp)\\b/.test(marker)) return 'code';
      if (element.closest('input,textarea,select') || /\\b(input|textarea|select|composer|searchbox)\\b/.test(marker)) return 'input';
      if (/(price|a-price|\\$\\s?\\d|€\\s?\\d|£\\s?\\d|¥\\s?\\d)/i.test(marker)) return 'price';
      if (/(rating|stars?|reviews?|\\d(?:\\.\\d)?\\s*out of\\s*5)/i.test(marker)) return 'rating';
      if (/(username|user-name|author|avatar|@\\w+)/i.test(marker)) return 'username';
      if (element.closest('time') || /\\b(time|date|ago|relative-time)\\b/i.test(marker)) return 'time';
      if (/(https?:\\/\\/|www\\.|\\burl\\b|cite)/i.test(marker)) return 'url';
      if (element.closest('button,[role="button"]') || /\\b(button|role=.button|btn)\\b/i.test(marker)) return 'button';
      if (element.closest('nav,header,footer,menu,[role="navigation"]') || /\\b(nav|header|footer|menu|sidebar)\\b/i.test(marker)) return 'nav';
      if (/\\b(ad|ads|sponsored|promoted)\\b/i.test(marker)) return 'ad';
      if (/(views?|likes?|votes?|score|metric|rank|duration|\\d+%|\\d+k\\b|\\d+m\\b)/i.test(marker)) return 'metric';
      return 'metadata';
    }

    function samplePositiveSelectors(selectors) {
      const bySelector = selectors.map((selector) => {
        const elements = safeQueryAll(selector).slice(0, 40);
        const samples = elements.slice(0, 8).map((element) => ({
          selector,
          textPreview: textPreview(element),
          translated: isElementTranslated(element),
        }));
        return {
          selector,
          matchedCount: elements.length,
          translatedCount: elements.filter(isElementTranslated).length,
          samples,
        };
      });
      const matched = bySelector.reduce((sum, entry) => sum + entry.matchedCount, 0);
      const translated = bySelector.reduce((sum, entry) => sum + entry.translatedCount, 0);
      const untranslatedSamples = bySelector
        .flatMap((entry) => entry.samples.filter((sample) => !sample.translated && sample.textPreview).map((sample) => sample.textPreview))
        .slice(0, 10);
      return {
        checked: matched,
        translated,
        bySelector,
        untranslatedSamples,
      };
    }

    function sampleNegativeSelectors(selectors) {
      const violations = [];
      let checked = 0;
      for (const selector of selectors) {
        for (const element of safeQueryAll(selector).slice(0, 60)) {
          checked += 1;
          const text = textPreview(element);
          if (isSkippableNegativeElement(element, text)) continue;
          if (!isNegativeTranslated(element)) continue;
          if (isBroadDescendantOnlyNegative(selector, element)) continue;
          const translatedText = Array.from(element.querySelectorAll(TRANSLATED_SELECTOR))
            .map((node) => textPreview(node))
            .filter(Boolean)
            .join(' | ')
            .slice(0, 180);
          violations.push({
            kind: classifyNegativeViolation(element, selector, text),
            selector,
            textPreview: text,
            translatedTextPreview: translatedText || undefined,
            direct: isElementDirectlyTranslated(element),
            descendant: Boolean(element.querySelector(TRANSLATED_SELECTOR)),
          });
          if (violations.length >= 30) return { checked, violations };
        }
      }
      return { checked, violations };
    }

    function readRuleVisualizationSelectors() {
      const selectors = expectation.ruleVisualizationSelectors ?? [];
      return selectors.map((entry) => ({
        group: entry.group,
        selector: entry.selector,
        label: entry.label,
        matchedCount: safeQueryAll(entry.selector).length,
      }));
    }

    const translatedTextNodes = safeQueryAll('.imt-translation-block, .imt-translation-compact, .imt-translation-replacement');
    const translatedTextSamples = translatedTextNodes.map(textPreview).filter(Boolean).slice(0, 12);
    const translatedUnitRoots = safeQueryAll('[data-imt-state="translated"]');
    const duplicateTranslationCount = translatedUnitRoots.filter((root) =>
      safeQueryAll('.imt-translation-block, .imt-translation-compact, .imt-translation-replacement', root).length > 1
    ).length;
    const loadingNodes = safeQueryAll(LOADING_SELECTOR);
    const negativeSamples = sampleNegativeSelectors(expectation.negativeSelectors);

    return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      visibilityState: document.visibilityState,
      fixtureKind: expectation.fixtureKind,
      bodyTextLength: document.body?.innerText?.length ?? 0,
      bodyTextPreview: (document.body?.innerText ?? '').replace(/\\s+/g, ' ').trim().slice(0, 500),
      contentReady: Boolean(window.__IMT_CONTENT_READY__),
      contentGuardLoaded: Boolean(window.__IMT_CONTENT_GUARD_LOADED__),
      contentMainLoading: Boolean(window.__IMT_CONTENT_MAIN_LOADING__),
      hasDebugApi: Boolean(window.__OPENAI_IT_DEBUG__),
      floatingControl: Boolean(document.querySelector('[data-imt-control="root"]')),
      translatedBlocks: safeQueryAll('.imt-translation-block').length,
      translatedCompacts: safeQueryAll('.imt-translation-compact').length,
      translatedReplacements: safeQueryAll('.imt-translation-replacement').length,
      translatedAttributes: safeQueryAll('[data-imt-original-text]').filter((element) =>
        !element.matches('.imt-translation-block, .imt-translation-compact, .imt-translation-replacement')
      ).length,
      translatedRoots: translatedUnitRoots.length,
      translatedTextLength: translatedTextSamples.join('\\n').length,
      translatedTextSamples,
      loadingDomCount: loadingNodes.length,
      orphanLoadingCount: loadingNodes.filter((node) => !node.closest('[data-imt-state="loading"]')).length,
      managedNodeCount: safeQueryAll('[data-imt-managed="true"]').length,
      duplicateTranslationCount,
      positiveSamples: samplePositiveSelectors(expectation.positiveSelectors),
      negativeSamples,
      forbiddenTranslations: negativeSamples.violations.length,
      ruleVisualizationSelectors: readRuleVisualizationSelectors(),
    };
  })()`);
}

async function readRestoreMetrics(pageSession) {
  return evaluate(pageSession, `(() => ({
    translatedDomAfter: document.querySelectorAll([
      '[data-imt-state="translated"]',
      '.imt-translation-block',
      '.imt-translation-compact',
      '.imt-translation-replacement'
    ].join(',')).length,
    managedDomAfter: document.querySelectorAll('[data-imt-managed="true"]').length,
    loadingDomAfter: document.querySelectorAll('[data-imt-state="loading"], .imt-translation-loading[data-imt-loading="true"]').length,
    originalTextMarkersAfter: document.querySelectorAll('[data-imt-original-text]').length,
    unitIdMarkersAfter: document.querySelectorAll('[data-imt-unit-id]').length,
  }))()`);
}

async function runHoverTooltipRegression(pageSession, site) {
  await evaluate(pageSession, "window.scrollTo(0, Math.min(600, Math.max(0, document.body.scrollHeight - window.innerHeight)))");
  await delay(1000);

  const maxAttempts = Math.max(1, Math.min(Number(site.hoverMaxAttempts ?? 8), 20));
  const attemptTimeoutMs = Math.max(500, Math.min(Number(site.hoverAttemptTimeoutMs ?? 2500), 5000));
  const candidates = await readHoverCandidates(pageSession);
  const attempted = [];

  for (const candidate of candidates.slice(0, maxAttempts)) {
    attempted.push(candidate);
    await pageSession.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: candidate.x,
      y: candidate.y,
    });

    const tooltip = await waitForTranslatedTooltip(pageSession, attemptTimeoutMs);
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
    maxAttempts,
    attemptTimeoutMs,
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
        const marker = [
          element.tagName,
          element.id,
          element.className,
          element.getAttribute('alt'),
          element.getAttribute('title'),
          element.getAttribute('aria-label')
        ].join(' ').toLowerCase();
        const score =
          (/(champion|unit|item|augment|trait|hero|spell|ability)/.test(marker) ? 6 : 0) +
          (element.matches('img,canvas,[style*="background-image"]') ? 4 : 0) +
          (rect.width >= 20 && rect.width <= 96 && rect.height >= 20 && rect.height <= 96 ? 3 : 0) +
          (element.getAttribute('alt') || element.getAttribute('title') || element.getAttribute('aria-label') ? 2 : 0) -
          (/(logo|avatar|icon-button|social|share|menu|nav|close|search)/.test(marker) ? 5 : 0);
        return {
          index,
          score,
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
      .sort((left, right) => right.score - left.score || left.y - right.y || left.x - right.x)
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
    loadingDomCount: document.querySelectorAll('[data-imt-state="loading"], .imt-translation-loading[data-imt-loading="true"]').length,
  }))()`);
}

async function waitForTranslationSettled(pageSession, startedAt, timeoutMs, quietMs) {
  const deadline = Date.now() + timeoutMs;
  let lastProgress = await readTranslationProgress(pageSession);
  let lastChangedAt = Date.now();

  while (Date.now() < deadline) {
    const progress = await readTranslationProgress(pageSession);
    if (hasTranslationProgressChanged(progress, lastProgress)) {
      lastProgress = progress;
      lastChangedAt = Date.now();
    }

    const hasTranslation = progress.translatedBlocks > 0 || progress.translatedRoots > 0;
    const quietForLongEnough = Date.now() - lastChangedAt >= quietMs;
    if (hasTranslation && progress.loadingDomCount === 0 && quietForLongEnough) {
      return {
        ...progress,
        elapsedMs: Date.now() - startedAt,
        timedOut: false,
      };
    }

    await delay(250);
  }

  return {
    ...lastProgress,
    elapsedMs: Date.now() - startedAt,
    timedOut: true,
  };
}

function hasTranslationProgressChanged(left, right) {
  return (
    left.translatedBlocks !== right.translatedBlocks ||
    left.translatedRoots !== right.translatedRoots ||
    left.loadingDomCount !== right.loadingDomCount
  );
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
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await evaluate(serviceWorkerSession, `(async () => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((item) => item.url && item.url.includes(${JSON.stringify(host)}));
      if (!tab?.id) return { ok: false, error: "tab not found", tabs: tabs.map((item) => item.url) };
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, ${JSON.stringify(message)}, (contentResponse) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(contentResponse ?? { ok: false, error: "empty response" });
        });
      });
    })()`);
    if (response?.ok || !isTransientContentMessageError(response?.error) || attempt === 4) return response;
    await delay(300 + attempt * 300);
  }
  return response;
}

function isTransientContentMessageError(error) {
  return /receiving end does not exist|could not establish connection|no receiver/i.test(String(error ?? ""));
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

function isIgnorableConsoleError(message) {
  return /favicon|net::ERR_BLOCKED_BY_CLIENT|net::ERR_CONNECTION_CLOSED|ResizeObserver loop/i.test(message);
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
