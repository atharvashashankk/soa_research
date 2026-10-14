# Agent Memory Atlas

A static website for a Virginia Tech research study of memory management in software development agents.

**Website:** https://atharvashashankk.github.io/soa_research/  
**Source:** https://github.com/atharvashashankk/soa_research

The current snapshot contains **94 agent-source-checked papers**, **11 source-linked GitHub projects**, **7 overlapping research tags across different axes**, and **58 automatically proposed semantic groups**. It includes an extended research synthesis, search, combined filters, paper pages, a separate harness and memory project library, related papers, a browser reading list, and JSON/CSV/BibTeX exports. The visual design uses a restrained academic layout and colors from [Virginia Tech's color guide](https://brand.vt.edu/content/brand_vt_edu/en/identity/color.html); it does not use a university logo.

## Memory storage categories

Browse `storage.html` or use the **Memory storage category** filter. Categories describe the source-linked form of retained memory: notes and documents, structured records, event and interaction histories, linked knowledge, experience and skill banks, working context and summaries, and named databases or search indexes. A paper can belong to several categories. Each paper page shows the representation behind its labels.

Exact file formats and backends, such as `.md`, `.jsonl`, JSON, or SQLite, are tracked separately and shown only when supported by explicit evidence. They are established for four papers; the other 90 have representation categories but no verified exact format. Category assignments and exact-format evidence live in `research/storage.mjs` and require review when the corpus changes.

## GitHub projects

Browse `projects.html` for six coding harnesses or combined harness-memory systems and five memory layers. Each entry links to its repository, evidence for the described capability, relevant research tags, and conceptually related papers. These implementation entries are separate from the paper count and semantic clusters; a related paper link does not mean it evaluated the project. Selection rules are in [research/PROJECTS.md](research/PROJECTS.md).

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

To replay the screened October 2026 additions from the saved arXiv Atom candidate archive, run `npm run expand:archived` before analysis. The project catalog is maintained separately in `research/projects.json`.

- **Discover:** queries and paginates the official arXiv Atom API, saving a timestamped search round. The historical 2026-09-27 search retrieved only the latest 100 results per query and produced 267 unique candidates. A 2026-10-03 paginated rerun with the same cutoff yielded 1,699 unique candidates. API page overlap left one record below the first query's reported total; this is still not exhaustive coverage.
- **Screen:** record candidate decisions, specific reasons, reviewer, date, and discovery route in `research/screening-ledger.json`. The reconciled ledger has 94 inclusions, 7 other decisions, and 1,606 pending records; 22 legacy decisions have no documented original discovery route. Add justified included records to the curation modules. Discovery matches are never automatically published.
- **Collect:** fetches primary metadata, deduplicates identifiers and titles, checks dates, verifies alternate publication sources, and saves source hashes and inclusion/exclusion decisions. It prefers the Atom API and falls back to rate-limited abstract-page scraping. Requests are cached and retried.
- **Analyze:** downloads free embedding weights on first use, then runs locally. It embeds consistent method descriptions with `Xenova/all-MiniLM-L6-v2`, computes cosine neighbors, and generates deterministic average-linkage groups at a 0.64 threshold. The embedding cache key hashes the exact input text and configuration; `research/model-artifacts.json` records and checks the model-file hashes on a fresh embedding run.
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

The [search plan](research/SEARCH_PLAN.md) documents the two arXiv search rounds and sources still to search.

The [coding guide](research/CODING_GUIDE.md) defines the tagging axes and claim-level evidence rule. `research/extraction-review.json` contains 94 structured claim review forms, and `research/similarity-review.json` contains 58 group review forms. Neither file asserts that independent human review has happened. `research/similarity-sensitivity.json` reports how the number of groups changes across thresholds from 0.58 to 0.70. Published citation metadata is separate from the arXiv version used for extraction in `research/publication-metadata.json`; unknown DOIs remain unknown.

After a new discovery round, run `npm run screening:reconcile`. Complete pending decisions and full-text review forms before describing the expanded corpus as screened. The existing 2026-09-27 discovery log and candidate set are preserved under `research/search-rounds/`.

The collection is a targeted research snapshot, not a systematic review. Ninety-one records use abstract evidence; three use cited full-text sections. The coding agent checked the extraction against sources; independent human review is pending. Automatic similarity groups and neighbors also require human review. Unknown lifecycle operations remain unspecified. Preprint status is the default unless a linked publication has been verified.

The initial 20-paper pilot has grown to 94 relevant papers. The requested target is just under 250; the remaining candidate queue needs screening, and unrelated matches have not been added to reach a count. The October 2026 addition used versioned abstracts from the archived arXiv Atom discovery round. See `research/expansion-2026-10.mjs` and `scripts/expand-archived.mjs`.

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

The updated pipeline passes **17 tests and 27 E2E checks**. E2E covers search, combined filters, URL persistence, sorting, reading-list retention and removal, exports, citations, paper and project links, categories, semantic groups, every local link, Pages project paths, keyboard focus, 320/390/768px layouts, data-load failures, JavaScript-disabled browsing, runtime network independence, console errors, and WCAG 2/2.1 AA audits of the main page types. Automated accessibility checks do not replace assistive-technology review.

Screenshots and JSON verification reports are in `artifacts/`. GitHub Actions uploads those reports for each run.

## Files

- `PLAN.md`: agreed scope and implementation status.
- `research/protocol.json`: dates, criteria, queries, and similarity settings.
- `research/curation.mjs`, `research/expansion.mjs`: source-checked interpretations.
- `research/expansion-2026-10.mjs`, `scripts/expand-archived.mjs`: archived-source paper expansion.
- `research/projects.json`, `research/PROJECTS.md`: source-linked GitHub harness and memory project catalog.
- `research/papers.json`: canonical publishable records.
- `research/collection-log.json`: source requests, hashes, and screening decisions.
- `research/candidates.json`, `research/discovery-log.json`: separate discovery queue and request log.
- `research/similarity.json`: reproducible semantic neighbors, groups, and configuration.
- `scripts/`: collection, local analysis, static generation, and preview.
- `src/`: site styling, browser interactions, and bundled fonts.
- `tests/`: data/analysis tests and headless browser checks.
- `.github/workflows/pages.yml`: checked GitHub Pages deployment workflow.

Bundled DM Sans and Manrope fonts include their SIL Open Font License files under `src/fonts/`. Paper rights belong to their authors and publishers; the site links to original sources rather than redistributing paper text.
