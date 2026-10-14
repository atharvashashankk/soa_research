# Coding guide (version 1.1, 2026-10-03)

This is a targeted evidence map. The current 94 records were coded with agent assistance; no independent human coding has been recorded. The labels below are descriptive tags on different axes, not seven mutually exclusive memory mechanisms. Record uncertainty and conflicting interpretations instead of forcing agreement.

## Unit and evidence rule

Code one canonical paper, including all verified publication versions, as one record. Use the exact paper version named by `sourceUrl`. For each nontrivial method, lifecycle, evaluation, or outcome claim, record the source URL, section/page/table/figure or abstract, a short supporting paraphrase, and whether the claim is author reported or an atlas inference. An abstract locator supports only what the abstract explicitly says. Leave unknown operations unknown. Do not infer file formats from logical representation names.

## Tag axes

| Axis | Existing tags | Decision rule |
| --- | --- | --- |
| Mechanism | `experience`, `skills` | Experience is a retained episode, lesson, or reflection. Skills are reusable procedures or executable capabilities. Both may apply. |
| Memory scope | `context`, `repository` | Context concerns the active task/session and its compression or selection. Repository concerns codebase history or project facts used across tasks. Persistence must be explicit. |
| Lifecycle | `governance` | Apply when admission, validation, conflict resolution, updating, supersession, archiving, or forgetting is a substantive contribution. |
| Evidence role | `evaluation` | Apply to papers that study memory utility or failure modes as a research question. This is not a memory mechanism. |
| Sharing setting | `collaboration` | Apply when memory is shared among agents/frameworks or retains user intent for agent collaboration. |

`storageCategories` describe representation and `storageFormats` describe verified serialization/backends. `stages` describe workflow use. `setting` describes agent organization. Do not use a tag to substitute for these fields.

## Borderline cases

- Retrieval of source code alone is insufficient. Include only when retained knowledge, its lifecycle, or the effect of memory is studied.
- A summary inside one run is working context; call it cross-task memory only if persistence across tasks is supported.
- A benchmark with memory in its name gets `evaluation` when it directly tests memory behavior, even if it proposes no new storage mechanism.
- A graph can be a storage representation without being a governance method; require explicit currency or conflict handling for `governance`.
- A paper can be relevant to software development through a coding evaluation even if its method is general. Record that narrower link and avoid implying repository-level validation.

## Review procedure

1. Screen title and abstract against `protocol.json`; record decision, precise reason, discovery route, reviewer, date, and source in `screening-ledger.json`.
2. Read the full paper for included records. Complete every field in `extraction-review.json`; use `not reported` where appropriate.
3. Have a second human reviewer independently recode at least a prespecified sample of records and all borderline inclusions. Record disagreements and adjudication without replacing the original decisions.
4. Review semantic neighbors and clusters separately. Record a judgment for representative pairs, ambiguous memberships, and singletons; do not treat cosine scores as quality evidence.
5. Reconcile the ledger with `npm run screening:reconcile` and run `npm run check` before publishing a new snapshot.

The 2026-09-27 search used only the first 100 arXiv results per query. Those results and the current inclusion decisions are historical data. A later complete search is a new search round, not a retroactive correction to the old one.
