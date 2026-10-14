import {readFile} from 'node:fs/promises';
import {root, readJSON, writeJSON, clusterVectors} from './lib.mjs';

const papers = await readJSON('research/papers.json');
const similarity = await readJSON('research/similarity.json');
const vectors = JSON.parse(await readFile(new URL(`.cache/embeddings/${similarity.inputHash}.json`, root), 'utf8'));
if (vectors.length !== papers.length) throw new Error('Embedding cache does not match corpus');
const thresholds = [.58,.60,.62,.64,.66,.68,.70];
const sensitivity = thresholds.map(threshold => {
  const clusters = clusterVectors(papers,vectors,threshold);
  return {threshold,groups:clusters.length,singletons:clusters.filter(c => c.papers.length === 1).length,largest:Math.max(...clusters.map(c => c.papers.length))};
});
await writeJSON('research/similarity-sensitivity.json', {
  inputHash:similarity.inputHash,
  method:'Same embeddings and average-linkage algorithm; only the merge threshold varies. Descriptive sensitivity, not external validation.',
  results:sensitivity
});
let previous = [];
try { previous = await readJSON('research/similarity-review.json'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const old = new Map(previous.map(row => [row.groupId, row]));
for (const cluster of similarity.clusters) {
  const prior=old.get(cluster.id);
  if (prior?.humanReviewer && JSON.stringify(prior.papers)!==JSON.stringify(cluster.papers)) throw new Error(`${cluster.id}: reviewed membership changed; review prior judgments before regenerating forms`);
}
await writeJSON('research/similarity-review.json', similarity.clusters.map(cluster => {
  const prior=old.get(cluster.id);
  if(prior && JSON.stringify(prior.papers)===JSON.stringify(cluster.papers))return prior;
  return {
  groupId:cluster.id,papers:cluster.papers,representative:cluster.representative,
  humanReviewer:null,reviewedAt:null,coherent:null,labelAppropriate:null,
  representativePairsChecked:[],ambiguousAssignments:[],notes:null,adjudication:null
  };
}));
console.log(`Sensitivity analyzed at ${thresholds.length} thresholds; ${similarity.clusters.length} group review forms prepared.`);
