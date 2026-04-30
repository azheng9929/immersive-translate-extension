# Generic Content Engine Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the webpage translator infer useful content from real DOM text structure, especially for style-only imported rules, high-link-density card/video/product pages, and unknown landing pages.

**Architecture:** Keep the current `PageController -> scanDocumentText -> buildTranslationUnits` pipeline. Add a text-node-first candidate detector beside the existing selector-first root scoring, then feed selected roots back into the existing scanner, compiled filter rule, diagnostics, lazy translation, cache, and render layers.

**Tech Stack:** TypeScript, WXT content scripts, DOM TreeWalker, Vitest/jsdom fixtures.

---

### Scope

- Keep provider, cache, queue, popup, options, and background permit behavior unchanged.
- Do not add OCR, PDF, subtitle, or commercial account features.
- Do not promote style-only rules into hard translation selectors.
- Add behavior through tested content-engine modules only.

### Files

- Create: `src/content/contentCandidateEngine.ts`
- Modify: `src/content/rootScoring.ts`
- Modify: `src/content/pageController.ts`
- Modify: `src/content/sitePolicy.ts`
- Modify: `src/content/webTranslationRules.ts`
- Modify: `src/content/translationDiagnostics.ts` if trace fields are needed by the debug panel
- Modify: `src/content/debugOverlay.ts` only after trace data exists
- Test: `tests/content/contentCandidateEngine.test.ts`
- Test: `tests/content/rootScoring.test.ts`
- Test: `tests/content/pageController.test.ts`
- Test: `tests/content/webTranslationRules.test.ts`

### Task 1: Text-Node-First Candidate Detector

- [x] Add failing fixtures for high-link video/card content and style-only landing content.
- [x] Implement text-node harvesting with max text node and ancestor-depth caps.
- [x] Aggregate candidate stats without touching the DOM.
- [x] Export selected candidate roots and their profile/score/reasons.

### Task 2: Profile-Aware Scoring

- [x] Add failing tests showing high-link video/card titles are accepted without pulling unrelated chrome.
- [x] Implement profile classification for `article`, `landing`, `card-list`, `video-list`, `commerce`, `forum`, `social`, and `generic`.
- [x] Make link density and button density profile-specific rather than global penalties.
- [x] Preserve current article behavior as the default conservative path.

### Task 3: Root Pipeline Integration

- [x] Add failing `PageController` tests proving style-only weak hints translate intended content without translating navigation.
- [x] Call the text-node detector through generic root scoring and weak-hint fallback.
- [x] Preserve existing selector-first behavior for explicit core rules and configured scan roots.
- [x] Keep fallback to the original root when confidence is too low.

### Task 4: Style-Only Rule Intent

- [x] Add tests for modifier-only rules with `globalStyles` selectors like `.clamp-title` and `.clamp-desc`.
- [x] Parse style selectors into weak candidate hints when names include title/content/text/summary/name/desc/headline/body/caption/excerpt/comment/message/post.
- [x] Use weak hints only as score bonuses, never as mandatory scan roots.
- [x] Keep global styles and injected CSS as independent layout repair.

### Task 5: Trace And Debuggability

- [x] Add diagnostics for candidate evaluated/accepted counts grouped by profile.
- [x] Surface high-level counts in the debug overlay.
- [x] Preserve current skip reason counts for scanner/unit/provider/cache.

### Task 6: Verification

- [x] Run targeted content tests.
- [x] Run full unit tests if targeted tests pass.
- [x] Run typecheck, build, rule audits, and real-site smoke regression.
- [x] Leave unrelated local changes untouched. Not committed because the worktree already contains pre-existing uncommitted changes in shared language heuristics and `pageController.test.ts`.
