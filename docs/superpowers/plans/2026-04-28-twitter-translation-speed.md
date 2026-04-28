# Twitter Translation Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Speed up X/Twitter page translation without returning to the previous high-dynamic crash behavior.

**Architecture:** Add a Twitter-specific fast-bounded site policy and pass preferred scan selectors from `sitePolicy` into `PageController`. For X/Twitter, the controller scans only tweet/user/card content roots instead of walking the whole page tree as generic content.

**Tech Stack:** TypeScript, Vitest, browser extension content script, existing lazy translation and provider scheduler.

---

### Task 1: Twitter Fast-Bounded Policy

**Files:**
- Modify: `src/content/sitePolicy.ts`
- Test: `tests/content/sitePolicy.test.ts`

- [x] **Step 1: Write the failing test**

Add assertions that X/Twitter uses a faster bounded policy: `debounceMs` lower than conservative, `lazyRootMargin` wider than conservative, root flush above 6 but below normal, attributes disabled, and Twitter selectors present.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/content/sitePolicy.test.ts`

- [x] **Step 3: Write minimal implementation**

Add `preferredScanRootSelectors` to `SitePolicy`, define `TWITTER_FAST_DYNAMIC_LIMITS`, and update `TWITTER_SITE_POLICY` to use it.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/content/sitePolicy.test.ts`

### Task 2: Preferred Scan Roots

**Files:**
- Modify: `src/content/pageController.ts`
- Modify: `entrypoints/content.ts`
- Test: `tests/content/pageController.test.ts`

- [x] **Step 1: Write the failing test**

Add a fixture with tweet text, username, sidebar, and button text. Create a `PageController` with Twitter `preferredScanRootSelectors`; assert only tweet content is sent to translation.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/content/pageController.test.ts`

- [x] **Step 3: Write minimal implementation**

Add `preferredScanRootSelectors` to `PageController` options. When present, scan matching roots under the supplied root, dedupe nested roots, and pass the same scan options to text and attribute scanners.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/content/pageController.test.ts`

### Task 3: Final Verification

**Files:**
- Modify as needed from Tasks 1-2.

- [x] **Step 1: Run focused tests**

Run: `npm.cmd test -- tests/content/sitePolicy.test.ts tests/content/pageController.test.ts tests/content/domScanner.test.ts`

- [x] **Step 2: Run project verification**

Run: `npm.cmd run typecheck`, `npm.cmd test`, and `npm.cmd run build`.

- [x] **Step 3: Commit**

Commit message: `feat: speed up twitter translation policy`
