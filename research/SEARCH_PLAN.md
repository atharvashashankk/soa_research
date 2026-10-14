# Search and selection plan

## Current search rounds

On 2026-10-13, 44 further papers were selected by agent-assisted title and abstract screening of the archived 2026-10-03 arXiv Atom candidate set. The primary-source version and abstract hash are retained per paper. The corpus now has 94 inclusions, 7 other decisions, and 1,606 pending discovery records. This is an expansion of the targeted snapshot, not a new exhaustive search. See `expansion-2026-10.mjs` and `../scripts/expand-archived.mjs` for the selected interpretations and reproducible import.

The 2026-09-27 arXiv search used the three exact expressions in `protocol.json`, filtered to submissions from 2023-01-01 through 2026-09-27, sorted newest first, and stopped at 100 results per query. It returned 267 distinct records. Its request URLs and response hashes remain in `search-rounds/2026-09-27-initial-log.json`.

On 2026-10-03 the same expressions and cutoff were paginated through all reported API results. The three queries reported 911, 164, and 820 hits; 910, 164, and 820 distinct IDs were actually recovered within each query because adjacent pages overlapped. The merged queue contains 1,699 distinct IDs. This is a candidate queue, not a screened denominator or complete literature search. See the timestamped search-round log for exact requests and hashes.

## Next search round

Before changing the 2026-09-27 cutoff or claiming wider coverage, record a new protocol version and run date. Search these sources independently:

1. arXiv with paginated, date-bounded queries using terms for coding/software engineering agents, persistent memory, cross-task experience, repository knowledge, reflection, skill reuse, context compression, and stale knowledge. Save exact API strings, per-query counts, page overlap, and errors.
2. OpenReview and the proceedings of ICLR, NeurIPS, ICML, ACL/EMNLP, and relevant software engineering venues. Record the exact venue, year range, search method, URL, and results. A publication verification link alone is not a venue search.
3. Backward references and forward citations of included papers. Record seed paper, citation source, date, candidate ID, and whether the candidate was already found elsewhere.

Run broad terms in a pilot and refine them with a recorded reason; do not tune the search solely to recover the already included papers. Deduplicate by persistent identifier and normalized title, retaining all discovery routes. Screen titles/abstracts and then full texts using `CODING_GUIDE.md` and `screening-ledger.json`. Report record flow per source and exclude only after an actual decision. Avoid a PRISMA-style completed flow diagram while most candidates remain pending.

## Reproducibility boundaries

Search-result ordering and source metadata can change after a run. Timestamped JSON round files preserve returned metadata and the URLs/hashes of API responses. Raw fetched responses remain in the private `.cache/` directory; the public snapshot therefore supports re-execution and metadata audit, but does not contain a byte-for-byte archive of the source responses. See each paper's version and evidence URL for the source used in extraction.
