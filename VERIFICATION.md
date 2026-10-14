# Verification record

## 2026-10-13 expansion

Added 44 papers from the archived 2026-10-03 arXiv Atom candidate set, reaching 94 source-linked records under the requested 249-paper ceiling. Each addition has a versioned primary-source link, abstract hash, storage categories, and a pending human extraction-review form. The screening ledger now has 94 inclusions, 7 other decisions, and 1,606 pending records. Local embeddings produced 58 proposed semantic groups; group-review forms and threshold sensitivity were regenerated. A separate catalog links 11 GitHub coding harnesses and memory layers to their repository evidence and related papers. The findings page adds claim-level validity and conversion of experience into coding behavior. The static build generated 94 paper pages and a project catalog page. All 17 pipeline tests and 27 browser E2E checks, including local-link and accessibility checks, passed. This remains a targeted abstract-heavy map; independent human and broader-venue review are pending.

## 2026-10-03 update

The historical three arXiv queries were paginated at the same 2026-09-27 cutoff, yielding 1,699 unique candidates. The 50-paper published corpus was unchanged. The unified screening ledger records 1,650 pending cases. A sensitivity analysis shows 22 to 45 semantic groups across thresholds 0.58 to 0.70, compared with 32 at the chosen 0.64. Sixteen pipeline tests and 26 browser E2E checks passed after the research-process changes. The separate agent-browser CLI could not establish a Chrome CDP connection; the Playwright E2E suite completed the browser checks. No independent human review has been recorded.

Date: 2026-09-27

## Executed flow

1. Queried the official arXiv API: 267 unique discovery candidates retained separately.
2. Collected 50 canonical paper records from primary sources; verified selected conference/workshop links and cached three cited full-text HTML papers.
3. Generated 384-dimensional local MiniLM embeddings, four neighbors per paper, and 32 average-linkage similarity groups at a 0.64 threshold.
4. Built the static collection, 50 paper pages, seven taxonomy pages, 32 semantic-group pages, methodology, and dataset exports.
5. Inspected the live site with agent-browser and desktop/mobile screenshots.
6. Passed 13 pipeline tests and 25 browser E2E checks, including automated accessibility audits.

## Results

- Real collection and analysis commands completed successfully; no paid services were used.
- Records are deduplicated and constrained to the documented publication dates.
- Every generated page and local link resolved beneath a simulated GitHub Pages project prefix.
- Search, combined filtering, sorting, reading lists, citation actions, and downloads passed.
- Desktop, mobile, and tablet layouts had no horizontal overflow at tested widths.
- Main page types passed axe WCAG 2/2.1 AA checks after text-contrast corrections.
- Successful browser flows produced no console errors, uncaught page errors, or failed requests.
- Failed data loading preserves static browsing; browsing remains usable without JavaScript.
- The site works with external runtime network requests blocked.

## Limits

- GitHub Actions and live GitHub Pages deployment have not run because a destination repository and authenticated GitHub access have not been supplied.
- The independent human research review and the 100-paper expansion target remain outstanding.
- Most source extraction is abstract-based; three records cite inspected full-text sections. Research findings have not been independently replicated.
- Browser verification used installed Chrome/Chromium on Windows. The checked-in CI workflow additionally installs Chromium on Linux.
- Automated accessibility checks do not cover every assistive-technology interaction.

Detailed machine reports and screenshots are stored locally in `artifacts/`, which is excluded from source control and uploaded by CI.
