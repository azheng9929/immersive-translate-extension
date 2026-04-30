# Web Translation Core Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the webpage translation core closer to the uploaded Immersive Translate package by improving background request governance, observability, rule expressiveness, generic page detection, cache operations, and regression speed.

**Architecture:** Keep content scripts focused on DOM analysis and rendering, and move request-level sharing into background services. Add a small opt-in debug overlay that reads existing page status/diagnostics without affecting normal users. Extend rule schema and generic root selection incrementally so imported rules remain data-driven.

**Tech Stack:** WXT Chrome MV3 extension, TypeScript, Vue options/popup UI, Vitest, existing CDP real-site regression script.

---

### Task 1: Background In-Flight Dedupe

**Files:**
- Create: `src/background/inflightTranslationDedupe.ts`
- Modify: `src/background/messageRouter.ts`
- Modify: `src/background/providers/providerTypes.ts`
- Modify: `src/content/pageController.ts`
- Test: `tests/background/inflightTranslationDedupe.test.ts`
- Test: `tests/content/pageController.test.ts`

- [ ] Write failing tests proving two concurrent background requests with the same `cacheKey` trigger one provider call and both callers receive their own ids.
- [ ] Add optional `cacheKey` to `ProviderRequestItem`.
- [ ] Pass paragraph cache keys from `PageController` into batch items.
- [ ] Implement background in-flight map keyed by provider/model/endpoint/source/target/pageTitle/systemPrompt/cacheKey.
- [ ] Run targeted tests and commit.

### Task 2: Debug Overlay

**Files:**
- Create: `src/content/debugOverlay.ts`
- Modify: `src/content/contentMain.ts`
- Modify: `src/shared/config.ts`
- Modify: `entrypoints/options/App.vue`
- Test: `tests/content/debugOverlay.test.ts`
- Test: `tests/shared/config.test.ts`
- Test: `tests/entrypoints/options/App.test.ts`

- [ ] Add `showDebugOverlay` config defaulting to false.
- [ ] Add options toggle.
- [ ] Mount a small fixed overlay when enabled, showing matched rule/site, phase, segments, queue, cache, provider, and scan counters.
- [ ] Expose `window.__OPENAI_IT_DEBUG__` with status/config/rule/restore/reAnalyze helpers.
- [ ] Run targeted tests and commit.

### Task 3: Rule Schema Alignment

**Files:**
- Modify: `src/shared/webRuleTypes.ts`
- Modify: `src/content/webTranslationRules.ts`
- Modify: `src/content/sitePolicy.ts`
- Modify: `src/content/pageController.ts`
- Test: `tests/content/webTranslationRules.test.ts`
- Test: `tests/content/pageController.test.ts`

- [ ] Add `bodyRule`, `mainFrameMinTextCount`, `mainFrameMinWordCount`, `buildContainerSelectors`, and `skipBuildContainerSelectors`.
- [ ] Support versioned delta suffixes `.add_v` and `.remove_v` during imported rule normalization.
- [ ] Apply build/skip container selectors when collecting scan roots.
- [ ] Use main frame minimum text/word thresholds before generic full-page scanning.
- [ ] Run targeted tests and commit.

### Task 4: Root Scoring

**Files:**
- Create: `src/content/rootScoring.ts`
- Modify: `src/content/pageController.ts`
- Test: `tests/content/rootScoring.test.ts`
- Test: `tests/content/pageController.test.ts`

- [ ] Score candidate roots using text length, word count, link density, button density, visible area, and repeated text density.
- [ ] Prefer high-confidence roots for generic pages when no explicit content selectors exist.
- [ ] Keep site-specific selector behavior stronger than generic scoring.
- [ ] Run targeted tests and commit.

### Task 5: Cache Management

**Files:**
- Modify: `src/shared/translationCache.ts`
- Modify: `src/background/paragraphCache.ts`
- Modify: `src/background/messageRouter.ts`
- Modify: `src/shared/messages.ts`
- Modify: `entrypoints/options/App.vue`
- Test: `tests/shared/translationCache.test.ts`
- Test: `tests/background/paragraphCache.test.ts`
- Test: `tests/background/messageRouter.test.ts`
- Test: `tests/entrypoints/options/App.test.ts`

- [ ] Add cache stats and clear operations to IndexedDB cache.
- [ ] Expose background messages for stats and clear.
- [ ] Add options UI showing entry count and a clear cache button.
- [ ] Run targeted tests and commit.

### Task 6: Regression Script Profiles

**Files:**
- Modify: `scripts/real-site-regression.mjs`
- Modify: `package.json`

- [ ] Add site profiles: smoke, high-dynamic, all.
- [ ] Add scripts for fast smoke regression and high-dynamic regression.
- [ ] Make default full regression less likely to hang by allowing per-site timeout and clear summary.
- [ ] Run smoke regression and commit.

### Final Verification

- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Run fast real-site regression.
- [ ] Confirm `git status --short` is clean.
