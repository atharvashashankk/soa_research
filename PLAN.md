# Agent Memory Research Project

Status: implementation authorized by the project owner on 2026-09-27. Initial website and research pipeline built and tested. GitHub Pages publication awaits a repository destination and authenticated GitHub access.

## Implementation status

- Completed the 20-paper pilot and expanded the source-checked corpus to 50 relevant papers spanning 2023-2026.
- Retained 267 discovery candidates in a separate queue; the initial API discovery retrieved the latest 100 results per query and is not exhaustive.
- Implemented primary-source metadata collection, API-first scraping, source caching, version deduplication, date screening, and provenance logs.
- Published memory lifecycle descriptions, seven overlapping mechanism families, evidence links, publication labels, and evaluation limitations.
- Generated local semantic embeddings, related-paper rankings, and 32 automatically proposed average-linkage groups, including singletons.
- Built static paper, category, semantic group, and methodology pages with search, filters, reading lists, and data exports.
- Passed 13 pipeline tests and 25 browser E2E checks, including GitHub Pages project paths, responsive layouts, and automated WCAG audits.
- Added a GitHub Actions build/test/deploy workflow and setup documentation.
- Outstanding research work: independent human review, more full-text extraction, broader source coverage, and the 100-paper expansion goal. These are reported openly in the site methodology.
- Outstanding publication work: supply a GitHub repository and authenticated access, then run and inspect the live deployment.

## Objective

Build a research collection about memory management in LLM agents for software development, with particular attention to how software workflows create, retrieve, update, consolidate, and discard memory. Cover both single-agent and multi-agent systems. Categorize papers by similarity and present the collection through a website hosted on GitHub Pages.

## Confirmed research scope

Focus on LLM agents for software development, including single-agent and multi-agent workflows for repository exploration, planning, coding, debugging, testing, code review, and maintenance.

Include papers that introduce or evaluate memory methods in these settings, or explicitly connect memory management to software development workflows. Memory can include retained task history, repository knowledge, plans, execution traces, reusable lessons, and shared agent state.

Exclude generic agent memory papers without an explicit software development connection from the main corpus. Foundational papers from other domains may be cited as background, but must remain clearly labeled and excluded from main-corpus counts and clustering.

Screen ordinary code retrieval and context construction papers for an explicit memory management contribution before inclusion. Record the reason for each borderline inclusion.

## Working defaults

- Publication period: 2023 through the collection date, with earlier foundational papers included through reference tracing. Record a precise cutoff date when collection begins.
- Publication types: preprints and peer-reviewed papers, with publication status clearly labeled.
- Sources: arXiv, OpenReview, and relevant conference proceedings, supplemented by backward and forward citation searches. Verify available APIs and access rules during collection planning.
- Similarity: multiple taxonomy labels for memory mechanisms and workflow stages, supported by semantic similarity of structured method descriptions and human review.
- Collection size: a 20-paper pilot, then a target of 100 relevant papers. Do not include weak matches merely to reach the target; report the actual coverage.
- Website: search, filters, paper detail pages, evidence-backed summaries, citations, category browsing, related papers, methodology, and downloadable records. Defer a similarity map until the core collection is useful.
- Architecture: a static site for GitHub Pages, with collection and analysis run separately and versioned data published with the site. Select specific tools during implementation.
- Budget: no paid services by default. Prefer local or free tools for extraction and embeddings; discuss any necessary paid service before using it.
- Updates: an initial dated research snapshot with a documented manual refresh process. Add scheduled updates later if requested.
- GitHub repository: its name and owner can be supplied before publication; they do not block planning.

## Phase 1: Define the research protocol

1. Confirm the scope and research questions with the project owner.
2. Define inclusion and exclusion criteria, search terms, publication dates, and source coverage.
3. Distinguish agent memory from ordinary retrieval systems and context handling; decide which borderline papers belong in the collection.
4. Record search dates, queries, and screening decisions so the collection can be reproduced.

Proposed research questions:

- What information do agents retain, and in what form?
- When do workflows write, retrieve, revise, consolidate, or remove memories?
- How do repository changes, failed tests, debugging cycles, and task handoffs trigger memory updates or invalidate retained knowledge?
- How do single-agent and multi-agent workflows share and isolate memory?
- How are memory quality, task performance, latency, and cost evaluated?
- Which methods are similar, and where do their assumptions or results differ?

Deliverable: an agreed research protocol and initial taxonomy.

## Phase 2: Collect and screen a pilot corpus

1. Prefer official metadata APIs or exports where available; use page scraping where needed and permitted.
2. Preserve titles, authors, dates, abstracts, identifiers, source URLs, publication venue, and version information.
3. Deduplicate preprint and published versions while retaining their source links.
4. Screen candidates against the agreed criteria and record exclusion reasons.
5. Retrieve accessible full text where permitted. Mark abstract-only records clearly and avoid bypassing access controls.

Deliverable: a pilot corpus with provenance and screening records.

## Phase 3: Extract memory methods and workflow patterns

For each included paper, record:

- Research problem and software development task.
- Repository scope, memory lifetime within or across tasks, and handling of stale code knowledge.
- Memory representation and storage mechanism.
- Policies for writing, retrieval, updating, consolidation, and forgetting.
- Workflow triggers and the role of memory in planning, execution, reflection, and handoffs.
- Single-agent or multi-agent setting and memory sharing behavior.
- Evaluation tasks, baselines, metrics, reported findings, and limitations.
- Evidence locations in the source, extraction confidence, and review status.

Keep author claims distinct from project interpretations. Mark missing information rather than inventing details. Any machine-assisted extraction must retain evidence references and receive review.

Deliverable: structured paper records and an extraction guide.

## Phase 4: Categorize by similarity

1. Review the pilot to refine the taxonomy; allow papers to have multiple labels.
2. Compute semantic similarity using consistently extracted, structured method descriptions; document any fallback for incomplete records.
3. Record the embedding model, text preparation, clustering settings, and corpus version.
4. Compare automated groups with the extracted memory and workflow attributes.
5. Review representative papers, ambiguous assignments, and outliers; name groups using their shared methods.
6. Distinguish topical similarity from similarity of memory mechanisms. Group membership must not imply equivalent performance.

Deliverable: reviewed categories, similarity relationships, and an explanation of the grouping method.

## Phase 5: Build the GitHub Pages website

Choose the static site stack after requirements are confirmed. Run collection and analysis separately, then publish generated data and static assets suitable for GitHub Pages.

Proposed pages and features:

- Collection overview with scope, coverage, and last update date.
- Search and filters for memory methods, workflow stages, dates, and agent domains.
- Paper pages with summaries, extracted attributes, evidence references, and original source links.
- Category pages showing shared methods and representative papers.
- Methodology page describing collection, exclusions, extraction, and grouping.
- Optional interactive similarity map and downloadable records.

Deliverable: a reviewable site, followed by GitHub Pages publication when authorized.

## Phase 6: Review and maintain

- Review extraction accuracy and category coherence before expanding the pilot.
- Verify navigation, search, filters, accessibility, mobile display, and GitHub Pages path handling.
- Preserve a reproducible collection snapshot and analysis configuration.
- If ongoing updates are requested, define a collection schedule and review process before publishing new records.

## Completion criteria

- Agreed scope and documented collection methodology.
- Target collection size reached, with deduplicated records and source provenance.
- Memory and workflow attributes supported by available paper evidence.
- Reviewed similarity groups with an understandable explanation.
- A functioning GitHub Pages site with the agreed features.

### Implemented addition: memory storage formats

Add a separate, overlapping classification for memory storage: `.md`, `.qmd`, `.json`, `.jsonl`, `.yaml` / `.yml`, `.txt`, SQLite, and unspecified formats. Require explicit primary-source evidence for known labels. Provide a collection filter, storage overview and category pages, paper-level evidence, and exported fields. Preserve empty categories without inventing matches. Verify combined filters, URL persistence, empty categories, navigation, mobile layouts, and accessibility.

## Immediate next step

Publish the tested site after the project owner supplies the GitHub repository destination and authenticated access. Continue independent research review and further corpus expansion through the documented collection workflow.
