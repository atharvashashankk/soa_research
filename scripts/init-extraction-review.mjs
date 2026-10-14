import {readJSON, writeJSON} from './lib.mjs';

const papers = await readJSON('research/papers.json');
let existing = [];
try { existing = await readJSON('research/extraction-review.json'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const previous = new Map(existing.map(row => [row.id, row]));
const fields = ['summary','representation','evaluation','limitations','staleKnowledge'];
const rows = papers.map(paper => {
  const old = previous.get(paper.id);
  if (old && old.version !== paper.version) throw new Error(`${paper.id}: source version changed; review the existing extraction before reinitializing`);
  const claims = Object.fromEntries([...fields, ...Object.keys(paper.lifecycle).map(key => `lifecycle.${key}`)].map(field => {
    const value = field.startsWith('lifecycle.') ? paper.lifecycle[field.slice(10)] : paper[field];
    if (old?.claims?.[field] && old.claims[field].value !== value) throw new Error(`${paper.id} ${field}: claim changed; review before reinitializing`);
    return [field, old?.claims?.[field] ?? {
      value,
      claimType: field === 'limitations' || field === 'staleKnowledge' ? 'atlas interpretation' : 'author report or atlas paraphrase; distinguish during full-text review',
      sourceUrl:paper.evidenceUrl,
      locator:paper.evidenceLocator,
      supportingPassage:null,
      evidenceDepth:paper.evidenceDepth,
      humanReviewer:null,
      reviewedAt:null,
      adjudication:null
    }];
  }));
  return {id:paper.id,version:paper.version,fullTextReview:'pending',secondReview:'pending',claims};
});
await writeJSON('research/extraction-review.json',rows);
console.log(`Extraction review forms prepared for ${rows.length} papers. No human reviews were inferred.`);
