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

## Priority

- Core rules remain authoritative for high-value sites such as X, YouTube, Reddit, MetaTFT, and tactics.tools.
- Imported stable rules can add selectors, excludes, styles, container hints, and scheduling hints to matching core rules.
- Imported experimental rules are kept visible to diagnostics but are not merged into core rules.
- Pages without a core rule can still use a matching imported rule as their primary rule.
