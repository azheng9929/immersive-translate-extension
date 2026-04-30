# Imported Rule Runtime

The extension treats Immersive Translate rules as a large candidate library, not as always-on core logic.

## Flow

1. `scripts/import-immersive-web-rules.mjs` reads `default_config.json` from the unpacked Immersive Translate extension.
2. It writes the full normalized rule dataset to `public/data/imported-immersive-web-rules.json`.
3. It writes a lightweight URL and DOM-shape catalog to `src/shared/data/importedImmersiveRuleCatalog.ts`.
4. `src/background/webRuleStore.ts` uses the catalog to avoid loading the full JSON on unrelated pages.
5. When a page may match, background loads the JSON, filters it through `prepareImportedWebTranslationRules`, and sends only candidate rules for the current URL.
6. Content keeps `CORE_WEB_TRANSLATION_RULES` as the stable base. Same-site imported stable rules are merged in as deltas.

## Capability Gate

Runtime filtering keeps only fields supported by the current webpage translation engine. Unsupported source fields from the upstream config are not executed.

Rules for non-webpage surfaces are filtered out at runtime, including PDF, ebook, subtitle, OCR, VTT/text-track, and upstream `NoTranslate` rules. Those features need separate product work before they should affect webpage translation.

Each imported rule is also classified before it reaches content script:

- `content-ready`: the rule has selectors, content selectors, a main frame selector, or body/article anchors. It can directly drive scanning.
- `modifier-only`: the rule mainly carries layout/style fixes such as `globalStyles` or `injectedCss`. It can improve rendering, but it cannot decide what text to translate by itself.
- `structure-only`: the rule carries block/inline/atomic/container/dynamic hints, but no content anchor.
- `match-only`: the rule only identifies a URL or page shape.
- `unsafe`: reserved for rules that should never enter webpage translation.

When a non-`content-ready` imported rule matches a page, content script does not treat it as a finished site adaptation. It adds a conservative page-type fallback extractor instead:

- video pages: headings and video/list title surfaces
- article pages: article/main headings and paragraphs
- social/forum pages: post/comment text surfaces
- commerce pages: product title and description surfaces
- generic pages: only when the rule has real structure hints, not for bare match-only rules

This is the key guardrail learned from the newer Immersive Translate package: imported rules are useful knowledge, but many of them are deltas rather than complete extraction strategies.

## Priority

- Core rules remain authoritative for high-value sites such as X, YouTube, Reddit, MetaTFT, and tactics.tools.
- Imported stable rules can add selectors, excludes, styles, container hints, and scheduling hints to matching core rules.
- Imported experimental rules are kept visible to diagnostics but are not merged into core rules.
- Pages without a core rule can still use a matching imported rule as their primary rule.

## Auditing

Run:

```bash
npm run audit:web-rules
```

The report counts imported rules by capability and fallback profile, then lists non-content-ready rules that are worth reviewing for future core rules. High-value sites should gradually move from fallback extraction into explicit core rules.
