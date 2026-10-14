import {readJSON, writeJSON} from './lib.mjs';

const candidates = await readJSON('research/candidates.json');
const collection = await readJSON('research/collection-log.json');
const papers = await readJSON('research/papers.json');
let existing = [];
try { existing = await readJSON('research/screening-ledger.json'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const previous = new Map(existing.map(row => [row.id, row]));
const decisions = new Map(collection.screening.map(row => [row.id, row]));
const included = new Set(papers.map(p => p.id));
const discovered = new Map(candidates.map(row => [row.id, row]));
const ids = new Set([...discovered.keys(), ...decisions.keys(), ...included]);
const rows = [...ids].sort().map(id => {
  const candidate = discovered.get(id);
  const legacy = decisions.get(id);
  const old = previous.get(id);
  const decision = old?.decision ?? legacy?.decision ?? 'pending';
  const origin = old?.origin ?? (candidate ? 'arXiv discovery query' : 'Legacy curation; discovery route undocumented');
  return {
    id,
    title: candidate?.title ?? papers.find(p => p.id === id)?.title ?? old?.title ?? '',
    discoveryQuery: candidate?.query ?? old?.discoveryQuery ?? null,
    discoveryQueries: candidate?.matchedQueries ?? old?.discoveryQueries ?? (candidate ? [candidate.query] : []),
    origin,
    decision,
    reason: old?.reason ?? legacy?.reason ?? null,
    evidenceUrl: old?.evidenceUrl ?? candidate?.sourceUrl ?? papers.find(p => p.id === id)?.sourceUrl ?? null,
    reviewer: old?.reviewer ?? (legacy ? 'Agent-assisted legacy curation; identity not recorded' : null),
    reviewedAt: old?.reviewedAt ?? null,
    recordedAt: old?.recordedAt ?? (legacy ? collection.collectedAt : null),
    independentHumanReview: old?.independentHumanReview ?? false
  };
});
for (const row of rows) {
  if (included.has(row.id) && row.decision !== 'include') throw new Error(`Included paper lacks inclusion decision: ${row.id}`);
  if (row.decision !== 'pending' && !row.reason) throw new Error(`Missing decision reason: ${row.id}`);
}
await writeJSON('research/screening-ledger.json', rows);
const counts = Object.fromEntries(['include','exclude','background','pending'].map(decision => [decision, rows.filter(row => row.decision === decision).length]));
console.log(`Screening ledger: ${rows.length} records; ${JSON.stringify(counts)}. Undocumented origins: ${rows.filter(row => row.origin.startsWith('Legacy')).length}.`);
