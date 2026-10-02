import { pipeline, env } from '@huggingface/transformers';
import { readFile, mkdir } from 'node:fs/promises';
import { root, readJSON, writeJSON, sha256, analysisText, neighbors, clusterVectors, validateCorpus } from './lib.mjs';
const papers = await readJSON('research/papers.json');
const protocol = await readJSON('research/protocol.json');
const taxonomy = await readJSON('research/taxonomy.json');
validateCorpus(papers, taxonomy);
const texts = papers.map(analysisText);
const config = protocol.similarity;
const inputHash = sha256(JSON.stringify({ids:papers.map(p=>p.id),texts,config}));
const cachePath = `.cache/embeddings/${inputHash}.json`;
let vectors;
try { vectors = JSON.parse(await readFile(new URL(cachePath, root),'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
if (!vectors) {
  await mkdir(new URL('.cache/models/', root), {recursive:true});
  env.cacheDir = new URL('.cache/models/', root).pathname.replace(/^\/(\w:)/,'$1');
  console.log(`Loading local embedding model ${config.model}. First run downloads model weights.`);
  const extractor = await pipeline('feature-extraction', config.model, {dtype:config.dtype});
  vectors = [];
  for (let i=0;i<texts.length;i++) {
    const result = await extractor(texts[i], {pooling:config.pooling,normalize:config.normalize});
    vectors.push(Array.from(result.data));
    console.log(`Embedded ${i+1}/${texts.length}: ${papers[i].short}`);
  }
  await extractor.dispose();
  await writeJSON(cachePath,vectors);
}
if (vectors.length !== papers.length || vectors.some(v => v.length !== 384 || v.some(n=>!Number.isFinite(n)))) throw new Error('Invalid embedding output');
await writeJSON('research/similarity.json', {
  generatedAt:new Date().toISOString(), inputHash, model:config.model, dtype:config.dtype,
  pooling:config.pooling, normalize:config.normalize, dimensions:384, metric:config.metric,
  textBasis:config.text, method:'Local sentence embeddings with cosine similarity; taxonomy groups are overlapping source-based interpretations.',
  neighborCount:config.neighbors, neighbors:neighbors(papers,vectors,config.neighbors),
  clustering:{algorithm:'average-linkage agglomerative',threshold:config.clusterThreshold,metric:'cosine',singletonPolicy:'Keep singleton groups; never force an unrelated paper into a cluster'},
  clusters:clusterVectors(papers,vectors,config.clusterThreshold).map(group=>{
    const counts=taxonomy.map(t=>({id:t.id,name:t.name,count:group.papers.filter(id=>papers.find(p=>p.id===id).categories.includes(t.id)).length})).sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
    return {...group,label:counts[0].name,dominantCategories:counts.filter(t=>t.count>0).slice(0,2).map(t=>t.id)};
  }),
  groups:taxonomy.map(t=>({...t,papers:papers.filter(p=>p.categories.includes(t.id)).map(p=>p.id)})),
  review:'Source-checked mechanism labels; independent human review pending. Semantic neighbors are automatically suggested.'
});
console.log('Semantic analysis saved. No paid services used.');
