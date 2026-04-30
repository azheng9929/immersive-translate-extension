# Verification

## Automated Checks

- `npm.cmd run typecheck`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test`: PASS, 46 test files and 290 tests
- `npm.cmd run audit:web-rules`: PASS, 830 imported rules audited
- `npm.cmd run test:real-sites:smoke`: PASS, MetaTFT Augments smoke regression

## Covered Flows

- Full-page DOM scanning skips hidden, code, managed, and non-meaningful text.
- Unit building keeps semantic roots, merges inline text, dedupes nested units, and preserves document order.
- Render decisions choose bilingual article rendering, compact bilingual table/card rendering, text replacement for UI, and attribute replacement.
- Restore removes inserted translation nodes and restores replaced text and attributes.
- Page controller prevents stale async translation results after restore.
- Translation cache reuses successful translations and does not cache failed results.
- Background provider protocol supports fake, Microsoft, and OpenAI-compatible providers with stable id mapping.
- Imported Immersive Translate web rules are URL-lazy loaded, runtime capability filtered, and merged as same-site deltas on top of stable core rules.
- Imported rules are classified as `content-ready`, `modifier-only`, `structure-only`, or `match-only`.
- Non-content-ready imported rules use conservative page-type fallback extractors instead of pretending to be complete site adaptations.

## Browser Manual Check

- Automated real-site smoke regression loaded the built extension and passed on MetaTFT Augments.
- Build output exists and is ready for manual loading from `.output/chrome-mv3`.

## Manual Test Steps For Browser

1. Open Chrome or Edge extension management.
2. Enable developer mode.
3. Load unpacked extension from `.output/chrome-mv3`.
4. Open a mixed English page with article text, buttons, navigation, tables, and placeholders.
5. Click `Translate page`.
6. Confirm article text gets bilingual blocks, compact/UI text does not break layout, attributes are replaced, and no code/hidden text is translated.
7. Click `Restore original`.
8. Confirm inserted translation nodes are gone and original text/attributes are restored.
