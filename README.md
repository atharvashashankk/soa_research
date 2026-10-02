# Agent Memory Atlas

A static website for a Virginia Tech research study of memory management in software development agents, ready for GitHub Pages.

The current snapshot contains **50 primary-source-checked papers**, **7 overlapping memory families**, and **32 automatically proposed semantic groups**. It includes an extended, source-linked research synthesis (`findings.html` in the built site), search, combined filters, paper pages, memory lifecycle descriptions, related papers, a browser reading list, and JSON/CSV/BibTeX exports. The visual design uses a restrained academic layout and colors from [Virginia Tech's color guide](https://brand.vt.edu/content/brand_vt_edu/en/identity/color.html); it does not use a university logo.

## Memory storage categories

Browse `storage.html` or use the **Memory storage category** filter. Categories describe the source-linked form of retained memory: notes and documents, structured records, event and interaction histories, linked knowledge, experience and skill banks, working context and summaries, and named databases or search indexes. A paper can belong to several categories. Each paper page shows the representation behind its labels.

Exact file formats and backends, such as `.md`, `.jsonl`, or SQLite, are tracked separately and shown only when supported by explicit evidence. They are established for three papers; the other 47 have representation categories but no verified exact format. Category assignments and exact-format evidence live in `research/storage.mjs` and require review when the corpus changes.

## Preview

The preview started during development is at **http://127.0.0.1:4173/**.

For this Windows workspace, run:

```powershell
.\scripts\dev.ps1
```

The script uses the workspace's portable Node installation if Node is not on your PATH. It builds the site and starts the preview server. Stop it with Ctrl+C. If the existing preview is running, use its URL or set a different port:

```powershell
$env:PORT = '4174'
.\scripts\dev.ps1
```

On another machine with Node.js 22 or newer:

```sh
npm ci
npm run build
npm run dev
```

The checked-in research data lets you build without collecting papers or downloading an embedding model. The website runs without a backend or runtime external requests; fonts are bundled locally.

## Publish to GitHub Pages

1. Put the source files in your GitHub repository's `main` branch. Include `package-lock.json`, `research/`, `scripts/`, `src/`, `tests/`, and `.github/workflows/pages.yml`. Exclude `.tools/`, `.cache/`, `node_modules/`, `artifacts/`, and generated `dist/`.
2. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Push to `main` or run **Build, test, and publish research atlas** manually from Actions.

The workflow installs dependencies, runs pipeline tests, builds the static website, runs headless Chromium E2E checks and accessibility audits, and publishes `dist/` only after checks pass. Pull requests run checks without deploying.

All internal links and data paths support a GitHub Pages project prefix such as `/soa_research/`. The E2E suite checks every generated HTML page and its local links at that prefix.

GitHub access is needed for publication; no research-source MCP or paid API key is needed for collection, analysis, building, or testing. A deployable website ZIP is generated under `artifacts/` for review, but the Actions workflow should publish the source repository build.

## Research workflow

```sh
npm run discover
npm run collect
npm run analyze
npm run check
```

- **Discover:** queries the official arXiv Atom API and saves a separate candidate queue. The initial discovery retrieved up to the latest 100 results per query, producing 267 unique candidates. This limit is a coverage boundary, not an exhaustive search.
- **Screen:** inspect candidate sources and add justified records to `research/curation.mjs` or `research/expansion.mjs`. Add verified publication links separately. Discovery matches are never automatically published.
- **Collect:** fetches primary metadata, deduplicates identifiers and titles, checks dates, verifies alternate publication sources, and saves source hashes and inclusion/exclusion decisions. It prefers the Atom API and falls back to rate-limited abstract-page scraping. Requests are cached and retried.
- **Analyze:** downloads free embedding weights on first use, then runs locally. It embeds consistent method descriptions with `Xenova/all-MiniLM-L6-v2`, computes cosine neighbors, and generates deterministic average-linkage groups at a 0.64 threshold. The embedding cache includes the exact input text and configuration hash.
- **Check:** validates records and analysis, builds all pages, and tests browser behavior. Builds reject outdated similarity input hashes.

To refresh cached source requests:

```sh
npm run collect -- --refresh
npm run analyze
npm run check
```

To attempt local HTML full-text retrieval as well:

```sh
npm run collect -- --full-text
```

Full text is retained in the private `.cache/` directory and is not redistributed. Downloading HTML does **not** automatically mark a record as checked against full text. Set an explicit evidence locator after inspecting the relevant section. PDF links remain available when structured HTML is unavailable.

## Evidence boundaries

The collection is a targeted research snapshot, not a systematic review. Forty-seven records use abstract evidence; three use cited full-text sections. The coding agent checked the extraction against sources; independent human review is pending. Automatic similarity groups and neighbors also require human review. Unknown lifecycle operations remain unspecified. Preprint status is the default unless a linked publication has been verified.

The initial 20-paper pilot was expanded to 50 relevant papers. The plan's 100-paper expansion target remains future work; unrelated matches have not been added to reach it. Candidate screening and broader venue discovery should precede another expansion.

Group labels come from the most frequent mechanism family among their members. Singleton groups remain separate rather than forcing an unrelated paper into a cluster. Similarity scores are not probabilities, measures of comparable performance, or scientific significance tests.

Negative results, narrow evaluations, and claims that do not isolate memory effects are retained. Summaries and labels are project interpretations; cite the original papers for scientific claims.

## Tests

```sh
npm test
npm run build
npm run test:e2e
```

On Linux/CI, install Chromium first:

```sh
npx playwright install --with-deps chromium
```

On Windows, tests use an installed Chrome browser when available. Otherwise install Playwright Chromium, or set `BROWSER_EXECUTABLE` to a compatible browser path.

The final run passed **13 pipeline tests and 25 E2E checks**. E2E covers search, combined filters, URL persistence, sorting, reading-list retention and removal, exports, citations, categories, semantic groups, every local link, Pages project paths, keyboard focus, 320/390/768px layouts, data-load failures, JavaScript-disabled browsing, runtime network independence, console errors, and WCAG 2/2.1 AA audits of the main page types. Automated accessibility checks do not replace assistive-technology review.

Screenshots and JSON verification reports are in `artifacts/`. GitHub Actions uploads those reports for each run.

## Files

- `PLAN.md`: agreed scope and implementation status.
- `research/protocol.json`: dates, criteria, queries, and similarity settings.
- `research/curation.mjs`, `research/expansion.mjs`: source-checked interpretations.
- `research/papers.json`: canonical publishable records.
- `research/collection-log.json`: source requests, hashes, and screening decisions.
- `research/candidates.json`, `research/discovery-log.json`: separate discovery queue and request log.
- `research/similarity.json`: reproducible semantic neighbors, groups, and configuration.
- `scripts/`: collection, local analysis, static generation, and preview.
- `src/`: site styling, browser interactions, and bundled fonts.
- `tests/`: data/analysis tests and headless browser checks.
- `.github/workflows/pages.yml`: checked GitHub Pages deployment workflow.

Bundled DM Sans and Manrope fonts include their SIL Open Font License files under `src/fonts/`. Paper rights belong to their authors and publishers; the site links to original sources rather than redistributing paper text.
