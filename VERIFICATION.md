# Verification record

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
