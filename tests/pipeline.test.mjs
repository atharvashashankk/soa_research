import test from 'node:test';
import {validateStorage,storageCategories} from '../research/storage.mjs';
import assert from 'node:assert/strict';
import { readJSON, validateCorpus, deduplicate, cosine, neighbors, clusterVectors, escapeHTML, analysisText, sha256 } from '../scripts/lib.mjs';
const papers=await readJSON('research/papers.json'),taxonomy=await readJSON('research/taxonomy.json'),protocol=await readJSON('research/protocol.json');
test('all papers have source-linked representation categories while exact formats stay evidence-based',()=>{
  validateStorage(papers);
  assert.deepEqual(storageCategories.map(c=>c.id),['notes','records','histories','graphs','banks','context','backends']);
  assert.ok(papers.every(p=>p.storageCategories.length>0));
  assert.deepEqual(papers.find(p=>p.id==='2606.23752').storageFormats,['md','json','jsonl']);
  assert.deepEqual(papers.find(p=>p.id==='2606.23752').storageCategories,['notes','records','histories']);
  assert.deepEqual(papers.find(p=>p.id==='2609.05510').storageCategories,['records','backends']);
  assert.equal(papers.filter(p=>p.storageFormats.includes('unspecified')).length,47);
  const bad=structuredClone(papers);bad[0].storageFormats=['md'];bad[0].storageEvidence=[];
  assert.throws(()=>validateStorage(bad));
  const mismatched=structuredClone(papers);mismatched[0].storageCategories=['notes'];
  assert.throws(()=>validateStorage(mismatched));
});
test('published corpus is valid and meets the pilot without duplicates',()=>{
  assert.equal(validateCorpus(papers,taxonomy),true);assert.ok(papers.length>=protocol.pilotTarget);
  assert.equal(deduplicate(papers).length,papers.length);
  assert.ok(papers.every(p=>p.published<=protocol.cutoff&&p.published>=protocol.start));
});
test('invalid sources, missing evidence, and unknown categories are rejected',()=>{
  for(const mutate of [p=>p.sourceUrl='javascript:alert(1)',p=>p.evidenceLocator='',p=>p.categories=['invented'],p=>p.authors=[],p=>p.lifecycle.forget='',p=>p.scope='background']){
    const copy=structuredClone(papers);mutate(copy[0]);assert.throws(()=>validateCorpus(copy,taxonomy));
  }
});
test('versions and duplicate normalized titles deduplicate',()=>{
  const a={id:'2501.12345v1',title:'A Memory Method'},b={id:'2501.12345v2',title:'Revised Method'},c={id:'2502.23456',title:'A memory-method!'};
  assert.deepEqual(deduplicate([a,b,c]),[a]);
});
test('cosine handles orthogonal, identical, opposite and zero vectors',()=>{
  assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1,0],[-1,0]),-1);assert.equal(cosine([0,0],[1,0]),0);
  assert.throws(()=>cosine([1],[1,2]));
});
test('neighbors are ranked and never include the query paper',()=>{
  const rows=[{id:'a',categories:['context']},{id:'b',categories:['context']},{id:'c',categories:['skills']}];
  const results=neighbors(rows,[[1,0],[.9,.1],[0,1]],2);
  assert.equal(results.a[0].id,'b');assert.deepEqual(results.a[0].shared,['context']);assert.ok(results.a.every(p=>p.id!=='a'));assert.equal(results.a.length,2);
});
test('HTML escaping prevents source metadata becoming executable markup',()=>{
  assert.equal(escapeHTML('<img src="x" onerror="alert(1)">'), '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHTML("A & B's"),'A &amp; B&#39;s');
});
test('average-linkage grouping merges similar vectors and retains unrelated singletons',()=>{
  const records=[{id:'a'},{id:'b'},{id:'c'}],vectors=[[1,0],[.99,.01],[0,1]];
  const groups=clusterVectors(records,vectors,.9);assert.equal(groups.length,2);assert.deepEqual(groups[0].papers,['a','b']);assert.deepEqual(groups[1].papers,['c']);assert.ok(groups[0].cohesion>.9);assert.equal(groups[1].cohesion,null);
  assert.deepEqual(clusterVectors(records,vectors,.9),groups);
});
test('each source paper belongs to exactly one semantic group',async()=>{
  const similarity=await readJSON('research/similarity.json');const ids=similarity.clusters.flatMap(c=>c.papers);
  assert.equal(ids.length,papers.length);assert.equal(new Set(ids).size,papers.length);assert.ok(papers.every(p=>ids.includes(p.id)));
  assert.ok(similarity.clusters.every(c=>c.papers.includes(c.representative)&&(c.cohesion===null||c.cohesion>=protocol.similarity.clusterThreshold)));
});
test('semantic text omits unknown lifecycle rules and performance numbers',()=>{
  const input=analysisText(papers[0]);assert.ok(!input.includes('Not specified'));assert.ok(!input.includes(papers[0].title));assert.ok(input.includes(papers[0].representation));
});
test('checked-in analysis matches the exact current inputs and model configuration',async()=>{
  const similarity=await readJSON('research/similarity.json');
  const hash=sha256(JSON.stringify({ids:papers.map(p=>p.id),texts:papers.map(analysisText),config:protocol.similarity}));
  assert.equal(hash,similarity.inputHash);assert.equal(similarity.dimensions,384);assert.equal(similarity.metric,'cosine');
  for(const p of papers){const rows=similarity.neighbors[p.id];assert.equal(rows.length,Math.min(4,papers.length-1));assert.ok(rows.every(q=>q.id!==p.id&&Number.isFinite(q.score)));}
});
test('category membership exactly matches paper labels',async()=>{
  const similarity=await readJSON('research/similarity.json');
  for(const group of similarity.groups)assert.deepEqual(group.papers,papers.filter(p=>p.categories.includes(group.id)).map(p=>p.id));
});
test('provenance and publication status are evidence-linked',async()=>{
  const log=await readJSON('research/collection-log.json');assert.equal(log.count,papers.length);assert.ok(log.requests.length);
  assert.ok(log.requests.every(r=>/^https:/.test(r.url)&&r.sha256?.length===64));
  assert.ok(papers.every(p=>p.abstractHash?.length===64&&p.version.match(/^v\d+$/)));
  assert.ok(papers.filter(p=>p.publication!=='Preprint').every(p=>p.alternateSources.length));
  assert.ok(log.screening.some(s=>s.decision==='exclude'&&s.reason.includes('Clinical')));
});
